// Lernende verwalten: ändern (Benutzername, Codename, Figur, Klasse) und aus der Klasse nehmen
// (?konto=loeschen löscht das ganze Konto mit Spielstand)
import { auth } from '@/lib/auth';
import { abfrage, pool } from '@/lib/db';
import { eigeneKlasse, fehler, lehrkraftOderFehler } from '@/lib/rechte';
import { gueltigeFigur, gueltigerName, normCodename, normName } from '@/lib/werte';

type Aenderung = { benutzername?: string; codename?: string; avatar?: string; klasse?: string };

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; uid: string }> }) {
  const b = await lehrkraftOderFehler();
  if (b instanceof Response) return b;
  const { id, uid } = await params;
  const k = await eigeneKlasse(b, id);
  if (!k) return fehler(404, 'Klasse nicht gefunden.');
  const [l] = await abfrage<{ username: string; codename: string | null; avatar: string | null; gespielt: boolean }>(
    `select u.username, s.codename, s.avatar, s.user_id is not null as gespielt
       from mitgliedschaft m join "user" u on u.id = m.user_id left join spielstand s on s.user_id = u.id
      where m.klasse_id = $1 and m.user_id = $2`, [k.id, uid]);
  if (!l) return fehler(404, 'Nicht in dieser Klasse.');
  const d = ((await req.json().catch(() => null)) || {}) as Aenderung;

  // Prüfen, bevor irgendetwas geschrieben wird
  let name: string | null = null;
  if (d.benutzername != null && normName(d.benutzername) !== l.username) {
    name = normName(d.benutzername);
    if (!gueltigerName(name)) return fehler(400, 'Benutzername: 3–24 Zeichen, nur a–z, 0–9, Punkt, Unterstrich und Bindestrich.');
    if ((await abfrage('select 1 from "user" where username = $1', [name])).length) return fehler(409, 'Diesen Benutzernamen gibt es schon.');
  }
  const vorgabe: { codename?: string; avatar?: string } = {};
  if (d.codename != null && normCodename(d.codename) !== l.codename) {
    vorgabe.codename = normCodename(d.codename);
    if (!vorgabe.codename) return fehler(400, 'Der Codename darf nicht leer sein.');
  }
  if (d.avatar != null && d.avatar !== l.avatar) {
    if (!gueltigeFigur(d.avatar)) return fehler(400, 'Diese Figur gibt es nicht.');
    vorgabe.avatar = d.avatar;
  }
  if (Object.keys(vorgabe).length && !l.gespielt) return fehler(409, 'Codename und Figur gibt es erst, wenn das Spiel einmal gestartet wurde.');
  let ziel: string | null = null;
  if (d.klasse != null && d.klasse !== k.id) {
    const zk = await eigeneKlasse(b, String(d.klasse));
    if (!zk) return fehler(404, 'Zielklasse nicht gefunden.');
    ziel = zk.id;
  }

  const c = await pool.connect();
  try {
    await c.query('begin');
    if (name) {
      await c.query('update "user" set username = $2, name = $2, "displayUsername" = $2, "updatedAt" = now() where id = $1', [uid, name]);
      await c.query(`update spielstand set daten = jsonb_set(daten, '{duo,agenten}', jsonb_build_array($2::text)) where user_id = $1`, [uid, name]);
    }
    if (Object.keys(vorgabe).length) {
      // Stand in der DB sofort ändern und als „neuer“ markieren, damit ein alter Puffer im Browser ihn nicht überschreibt
      await c.query(
        `update spielstand set
           daten = jsonb_set(jsonb_set(jsonb_set(daten,
             '{duo,codename}', to_jsonb(coalesce($2, daten->'duo'->>'codename'))),
             '{duo,avatar}', to_jsonb(coalesce($3, daten->'duo'->>'avatar'))),
             '{aktualisiert}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
           codename = coalesce($2, codename), avatar = coalesce($3, avatar),
           vorgabe = coalesce(vorgabe, '{}'::jsonb) || $4::jsonb
         where user_id = $1`,
        [uid, vorgabe.codename ?? null, vorgabe.avatar ?? null, JSON.stringify(vorgabe)]);
    }
    if (ziel) await c.query('update mitgliedschaft set klasse_id = $2, beigetreten = now() where user_id = $1', [uid, ziel]);
    await c.query('commit');
  } catch (e) {
    await c.query('rollback');
    if ((e as { code?: string }).code === '23505') return fehler(409, 'Diesen Benutzernamen gibt es schon.');
    throw e;
  } finally {
    c.release();
  }
  return Response.json({ ok: true, benutzername: name ?? l.username, klasse: ziel ?? k.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; uid: string }> }) {
  const b = await lehrkraftOderFehler();
  if (b instanceof Response) return b;
  const { id, uid } = await params;
  const k = await eigeneKlasse(b, id);
  if (!k) return fehler(404, 'Klasse nicht gefunden.');
  const [m] = await abfrage('select 1 from mitgliedschaft where klasse_id = $1 and user_id = $2', [k.id, uid]);
  if (!m) return fehler(404, 'Nicht in dieser Klasse.');
  if (new URL(req.url).searchParams.get('konto') === 'loeschen') {
    await (await auth.$context).internalAdapter.deleteUser(uid);
  } else {
    await pool.query('delete from mitgliedschaft where user_id = $1', [uid]);
  }
  return Response.json({ ok: true });
}
