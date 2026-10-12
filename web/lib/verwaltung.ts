// Konten, Profile, Passwörter, Spielstände und Klassen verwalten – gemeinsam für Registrierung, Lehrkraft-Bereich und Admin.
// Die Rechte prüfen die Routen vorher (lib/rechte.ts), hier wird nur geprüft, ob die Werte stimmen, und geschrieben.
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { auth } from './auth';
import { abfrage, pool } from './db';
import { fehler } from './rechte';
import type { Rolle } from './zugang';
import { gueltigeFigur, gueltigerName, klassencode, normCodename, normName, type Meta } from './werte';

export const NAME_REGEL = 'Benutzername: 3–24 Zeichen, nur a–z, 0–9, Punkt, Unterstrich und Bindestrich.';
const NAME_VERGEBEN = 'Diesen Benutzernamen gibt es schon.';
const istDoppelt = (e: unknown) => (e as { code?: string }).code === '23505';

// Neues Konto mit Passwort-Login (Better Auth verlangt eine E-Mail: zufällig unter .invalid, wird nie angeschrieben)
export async function kontoAnlegen(k: { name: string; anzeige: string; passwort: string; rolle: Rolle; status: string | null; klasseId: string | null }) {
  const ctx = await auth.$context;
  try {
    const user = await ctx.internalAdapter.createUser({
      name: k.name, username: k.name, displayUsername: k.anzeige,
      email: `${randomUUID()}@nutzer.invalid`, emailVerified: false,
      rolle: k.rolle, lehrkraftStatus: k.status
    }, { method: 'email-password' });
    await ctx.internalAdapter.createAccount({ userId: user.id, providerId: 'credential', accountId: user.id, password: await ctx.password.hash(k.passwort) });
    if (k.klasseId) await pool.query('insert into mitgliedschaft (user_id, klasse_id) values ($1, $2)', [user.id, k.klasseId]);
    return user.id as string;
  } catch (e) {
    if (istDoppelt(e)) return fehler(409, NAME_VERGEBEN);
    throw e;
  }
}

export const kontoLoeschen = async (uid: string) => (await auth.$context).internalAdapter.deleteUser(uid);

// Abmelden erzwingen – auf allen Geräten, außer der Sitzung, aus der die Änderung kommt
export async function sitzungenBeenden(uid: string, ausser: string | null = null) {
  const r = await pool.query('delete from session where "userId" = $1 and id is distinct from $2', [uid, ausser]);
  return r.rowCount ?? 0;
}

// Neues Passwort setzen (keine E-Mails im System: Lehrkraft oder Admin geben es weiter). Alte Sitzungen enden.
export async function passwortSetzen(uid: string, passwort: string, ausser: string | null = null) {
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(uid, await ctx.password.hash(passwort));
  await sitzungenBeenden(uid, ausser);
}

// ---- Profil: Benutzername (Anmeldung), Codename und Figur (Spiel)
export type Vorgabe = { codename?: string; avatar?: string };
export type Profil = { name: string | null; vorgabe: Vorgabe };
type Aktuell = { username: string; codename: string | null; avatar: string | null; gespielt: boolean };

// Prüfen, bevor irgendetwas geschrieben wird. Liefert nur, was sich wirklich ändert.
export async function profilPruefen(d: { benutzername?: unknown; codename?: unknown; avatar?: unknown }, l: Aktuell): Promise<Profil | Response> {
  let name: string | null = null;
  if (d.benutzername != null && normName(d.benutzername) !== l.username) {
    name = normName(d.benutzername);
    if (!gueltigerName(name)) return fehler(400, NAME_REGEL);
    if ((await abfrage('select 1 from "user" where username = $1', [name])).length) return fehler(409, NAME_VERGEBEN);
  }
  const vorgabe: Vorgabe = {};
  if (d.codename != null && normCodename(d.codename) !== l.codename) {
    vorgabe.codename = normCodename(d.codename);
    if (!vorgabe.codename) return fehler(400, 'Der Codename darf nicht leer sein.');
  }
  if (d.avatar != null && d.avatar !== l.avatar) {
    if (!gueltigeFigur(d.avatar)) return fehler(400, 'Diese Figur gibt es nicht.');
    vorgabe.avatar = d.avatar as string;
  }
  if (Object.keys(vorgabe).length && !l.gespielt) return fehler(409, 'Codename und Figur gibt es erst, wenn das Spiel einmal gestartet wurde.');
  return { name, vorgabe };
}

// Schreibt ein geprüftes Profil (innerhalb einer Transaktion des Aufrufers)
export async function profilSchreiben(c: PoolClient, uid: string, p: Profil) {
  if (p.name) {
    await c.query('update "user" set username = $2, name = $2, "displayUsername" = $2, "updatedAt" = now() where id = $1', [uid, p.name]);
    await c.query(`update spielstand set daten = jsonb_set(daten, '{duo,agenten}', jsonb_build_array($2::text)) where user_id = $1`, [uid, p.name]);
  }
  if (Object.keys(p.vorgabe).length) {
    // Stand in der DB sofort ändern und als „neuer“ markieren, damit ein alter Puffer im Browser ihn nicht überschreibt.
    // Ein gerade offenes Spiel bekommt die Vorgabe beim nächsten Speichern zurück und übernimmt sie (spiel/js/online/sync.js).
    await c.query(
      `update spielstand set
         daten = jsonb_set(jsonb_set(jsonb_set(daten,
           '{duo,codename}', to_jsonb(coalesce($2, daten->'duo'->>'codename'))),
           '{duo,avatar}', to_jsonb(coalesce($3, daten->'duo'->>'avatar'))),
           '{aktualisiert}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
         codename = coalesce($2, codename), avatar = coalesce($3, avatar),
         vorgabe = coalesce(vorgabe, '{}'::jsonb) || $4::jsonb
       where user_id = $1`,
      [uid, p.vorgabe.codename ?? null, p.vorgabe.avatar ?? null, JSON.stringify(p.vorgabe)]);
  }
}

// Mehrere Schreibvorgänge als eine Transaktion; ein doppelter Benutzername wird zur 409
export async function transaktion(tun: (c: PoolClient) => Promise<void>): Promise<Response | null> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await tun(c);
    await c.query('commit');
    return null;
  } catch (e) {
    await c.query('rollback');
    if (istDoppelt(e)) return fehler(409, NAME_VERGEBEN);
    throw e;
  } finally {
    c.release();
  }
}

// ---- Spielstand ersetzen oder zurücksetzen (nur Admin)
// Damit ein noch offenes Spiel oder der Puffer im Browser den alten Stand nicht zurückschreibt: Zuerst enden alle Sitzungen
// der Person (das Spiel schreibt nur mit noch bestehender Sitzung, siehe /api/spielstand), dann landet der Zeitpunkt in
// spielstand_verworfen – sync.js verwirft beim nächsten Start jeden älteren Puffer im Browser.
async function verwerfen(c: PoolClient, uid: string) {
  const { rows: [alt] } = await c.query<{ akt: string | null }>(`select daten->>'aktualisiert' as akt from spielstand where user_id = $1`, [uid]);
  // Läuft die Uhr im Browser vor, ist der alte Stand „später“ als jetzt – dann zählt sein Zeitpunkt (höchstens ein Tag voraus)
  const t = Math.min(Math.max(Date.now(), Date.parse(alt?.akt ?? '') || 0), Date.now() + 864e5);
  await c.query(
    `insert into spielstand_verworfen (user_id, zeitpunkt) values ($1, to_timestamp($2 / 1000.0))
     on conflict (user_id) do update set zeitpunkt = excluded.zeitpunkt`, [uid, t]);
}

export async function spielstandErsetzen(uid: string, username: string, daten: Record<string, unknown>, meta: Meta, ausser: string | null) {
  (daten.duo as Record<string, unknown>).agenten = [username]; // online gehört der Stand immer zum Konto
  await sitzungenBeenden(uid, ausser);
  await transaktion(async c => {
    await verwerfen(c, uid);
    await c.query(
      `insert into spielstand (user_id, daten, version, codename, avatar, punkte, front, fall, aktualisiert, vorgabe)
       values ($1, $2, $3, $4, $5, $6, $7, $8, now(), null)
       on conflict (user_id) do update set daten = excluded.daten, version = excluded.version, codename = excluded.codename,
         avatar = excluded.avatar, punkte = excluded.punkte, front = excluded.front, fall = excluded.fall, aktualisiert = now(), vorgabe = null`,
      [uid, daten, String(daten.version ?? ''), meta.codename, meta.avatar, meta.punkte, meta.front, meta.fall]);
  });
}

export async function spielstandZuruecksetzen(uid: string, ausser: string | null) {
  await sitzungenBeenden(uid, ausser);
  await transaktion(async c => {
    await verwerfen(c, uid);
    await c.query('delete from spielstand where user_id = $1', [uid]);
  });
}

// ---- Klassen: Klassencodes sind eindeutig – bei einer (seltenen) Kollision mit neuem Code nochmal versuchen
async function mitFreiemCode<T>(tun: (code: string) => Promise<T>): Promise<T | Response> {
  for (let i = 0; i < 8; i++) {
    try {
      return await tun(klassencode());
    } catch (e) {
      if (!istDoppelt(e)) throw e;
    }
  }
  return fehler(500, 'Kein freier Klassencode gefunden – bitte nochmal versuchen.');
}

export const klasseAnlegen = (lehrkraftId: string, name: string) => mitFreiemCode(async code =>
  (await abfrage<{ id: string; name: string; code: string; aktiv: boolean }>(
    'insert into klasse (lehrkraft_id, name, code) values ($1, $2, $3) returning id, name, code, aktiv', [lehrkraftId, name, code]))[0]);

export const neuerKlassencode = (id: string) => mitFreiemCode(async code => {
  await pool.query('update klasse set code = $2 where id = $1', [id, code]);
  return code;
});

// ---- Admin: ein Konto mit allem, was die Verwaltung braucht
export type Konto = {
  id: string; username: string; rolle: Rolle; status: string | null; erstellt: Date;
  codename: string | null; avatar: string | null; gespielt: boolean; klasse_id: string | null;
};
export async function kontoLaden(id: string): Promise<Konto | null> {
  const [k] = await abfrage<Konto>(
    `select u.id, u.username, u.rolle, u."lehrkraftStatus" as status, u."createdAt" as erstellt,
            s.codename, s.avatar, s.user_id is not null as gespielt, m.klasse_id
       from "user" u left join spielstand s on s.user_id = u.id left join mitgliedschaft m on m.user_id = u.id
      where u.id = $1`, [id]);
  return k ?? null;
}

// Es muss immer mindestens einen Admin geben – sonst kann niemand mehr Lehrkräfte freischalten
export async function letzterAdmin(uid: string) {
  const [r] = await abfrage<{ n: number; ist: boolean }>(`select count(*)::int as n, coalesce(bool_or(id = $1), false) as ist from "user" where rolle = 'admin'`, [uid]);
  return r.ist && r.n <= 1;
}
export const LETZTER_ADMIN = 'Das ist das einzige Admin-Konto. Macht erst ein anderes Konto zum Admin.';
