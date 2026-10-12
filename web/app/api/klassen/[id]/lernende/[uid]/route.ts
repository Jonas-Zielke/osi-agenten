// Lernende verwalten: ändern (Benutzername, Codename, Figur, Klasse) und aus der Klasse nehmen
// (?konto=loeschen löscht das ganze Konto mit Spielstand)
import { abfrage, pool } from '@/lib/db';
import { eigeneKlasse, fehler, lehrkraftOderFehler } from '@/lib/rechte';
import { kontoLoeschen, profilPruefen, profilSchreiben, transaktion } from '@/lib/verwaltung';

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
  const p = await profilPruefen(d, l);
  if (p instanceof Response) return p;
  let ziel: string | null = null;
  if (d.klasse != null && d.klasse !== k.id) {
    const zk = await eigeneKlasse(b, String(d.klasse));
    if (!zk) return fehler(404, 'Zielklasse nicht gefunden.');
    ziel = zk.id;
  }

  const f = await transaktion(async c => {
    await profilSchreiben(c, uid, p);
    if (ziel) await c.query('update mitgliedschaft set klasse_id = $2, beigetreten = now() where user_id = $1', [uid, ziel]);
  });
  if (f) return f;
  return Response.json({ ok: true, benutzername: p.name ?? l.username, klasse: ziel ?? k.id });
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
    await kontoLoeschen(uid);
  } else {
    await pool.query('delete from mitgliedschaft where user_id = $1', [uid]);
  }
  return Response.json({ ok: true });
}
