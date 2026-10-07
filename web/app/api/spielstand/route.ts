// Eigener Spielstand: laden (GET) und speichern (PUT, beim Verlassen der Seite per sendBeacon als POST)
import { abfrage, pool } from '@/lib/db';
import { benutzer, fehler } from '@/lib/rechte';
import { pruefeSpielstand } from '@/lib/werte';

const MAX_BYTES = 512 * 1024;

export async function GET() {
  const b = await benutzer();
  if (!b) return fehler(401, 'Bitte anmelden.');
  const [s] = await abfrage<{ daten: unknown; aktualisiert: string }>('select daten, aktualisiert from spielstand where user_id = $1', [b.id]);
  return Response.json({ daten: s ? s.daten : null, aktualisiert: s ? s.aktualisiert : null });
}

async function speichern(req: Request) {
  const b = await benutzer();
  if (!b) return fehler(401, 'Bitte anmelden.');
  const text = await req.text();
  if (text.length > MAX_BYTES) return fehler(413, 'Spielstand ist zu groß.');
  let roh: unknown;
  try { roh = JSON.parse(text); } catch { return fehler(400, 'Kein gültiges JSON.'); }
  const p = pruefeSpielstand(roh);
  if (!p) return fehler(400, 'Das sieht nicht wie ein Spielstand aus.');
  // Online gehört der Spielstand immer zum angemeldeten Konto
  const duo = p.daten.duo as Record<string, unknown>;
  duo.agenten = [b.username];
  // Hat die Lehrkraft Codename oder Figur geändert, gilt das, bis das Spiel es mitschickt (dann ist die Vorgabe erledigt –
  // aber nur genau diese: eine neue Änderung, die gerade dazwischenkam, bleibt stehen)
  const [alt] = await abfrage<{ vorgabe: { codename?: string; avatar?: string } | null }>('select vorgabe from spielstand where user_id = $1', [b.id]);
  let vorgabe = alt?.vorgabe ?? null;
  if (vorgabe) {
    const v = vorgabe;
    if ((v.codename == null || duo.codename === v.codename) && (v.avatar == null || duo.avatar === v.avatar)) vorgabe = null;
    else {
      if (v.codename != null) duo.codename = p.meta.codename = v.codename;
      if (v.avatar != null) duo.avatar = p.meta.avatar = v.avatar;
    }
  }
  await pool.query(
    `insert into spielstand (user_id, daten, version, codename, avatar, punkte, front, fall, aktualisiert)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (user_id) do update set daten = excluded.daten, version = excluded.version, codename = excluded.codename,
       avatar = excluded.avatar, punkte = excluded.punkte, front = excluded.front, fall = excluded.fall, aktualisiert = now(),
       vorgabe = case when spielstand.vorgabe = $9::jsonb then null else spielstand.vorgabe end`,
    [b.id, p.daten, String(p.daten.version ?? ''), p.meta.codename, p.meta.avatar, p.meta.punkte, p.meta.front, p.meta.fall, alt?.vorgabe && !vorgabe ? JSON.stringify(alt.vorgabe) : null]
  );
  return Response.json(vorgabe ? { ok: true, vorgabe } : { ok: true });
}
export const PUT = speichern;
export const POST = speichern;
