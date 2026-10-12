// Admin: Klasse für eine beliebige Lehrkraft anlegen
import { abfrage } from '@/lib/db';
import { adminOderFehler, fehler } from '@/lib/rechte';
import { klasseAnlegen } from '@/lib/verwaltung';

export async function POST(req: Request) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const d = ((await req.json().catch(() => null)) || {}) as { name?: string; lehrkraft?: string };
  const name = String(d.name ?? '').trim().slice(0, 60);
  if (!name) return fehler(400, 'Bitte einen Namen für die Klasse angeben.');
  const [lk] = await abfrage<{ id: string }>(`select id from "user" where id = $1 and rolle in ('lehrkraft', 'admin')`, [String(d.lehrkraft || b.id)]);
  if (!lk) return fehler(404, 'Lehrkraft nicht gefunden.');
  const k = await klasseAnlegen(lk.id, name);
  return k instanceof Response ? k : Response.json({ klasse: k });
}
