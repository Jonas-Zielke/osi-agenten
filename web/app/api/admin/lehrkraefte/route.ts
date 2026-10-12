// Admin: Lehrkraft-Anträge freischalten, ablehnen (Konto löschen) oder Rechte entziehen
import { abfrage, pool } from '@/lib/db';
import { adminOderFehler, fehler } from '@/lib/rechte';
import { kontoLoeschen } from '@/lib/verwaltung';

export async function GET() {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const lehrkraefte = await abfrage(
    `select id, username, "lehrkraftStatus" as status, "createdAt" as erstellt from "user" where rolle = 'lehrkraft' order by "lehrkraftStatus", "createdAt" desc`);
  return Response.json({ lehrkraefte });
}

export async function POST(req: Request) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const { id, aktion } = ((await req.json().catch(() => ({}))) || {}) as { id?: string; aktion?: string };
  const [u] = await abfrage<{ id: string }>(`select id from "user" where id = $1 and rolle = 'lehrkraft'`, [String(id)]);
  if (!u) return fehler(404, 'Lehrkraft nicht gefunden.');
  if (aktion === 'freischalten') await pool.query(`update "user" set "lehrkraftStatus" = 'frei' where id = $1`, [u.id]);
  else if (aktion === 'entziehen') await pool.query(`update "user" set "lehrkraftStatus" = 'beantragt' where id = $1`, [u.id]);
  else if (aktion === 'ablehnen') await kontoLoeschen(u.id);
  else return fehler(400, 'Unbekannte Aktion.');
  return Response.json({ ok: true });
}
