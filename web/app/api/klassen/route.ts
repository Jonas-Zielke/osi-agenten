// Klassen der Lehrkraft: auflisten und anlegen (mit eindeutigem Klassencode)
import { abfrage } from '@/lib/db';
import { fehler, istAdmin, lehrkraftOderFehler } from '@/lib/rechte';
import { klasseAnlegen } from '@/lib/verwaltung';

export async function GET() {
  const b = await lehrkraftOderFehler();
  if (b instanceof Response) return b;
  const klassen = await abfrage(
    `select k.id, k.name, k.code, k.aktiv, k.erstellt, count(m.user_id)::int as lernende
       from klasse k left join mitgliedschaft m on m.klasse_id = k.id
      where k.lehrkraft_id = $1 or $2 group by k.id order by k.erstellt desc`, [b.id, istAdmin(b)]);
  return Response.json({ klassen });
}

export async function POST(req: Request) {
  const b = await lehrkraftOderFehler();
  if (b instanceof Response) return b;
  const { name } = ((await req.json().catch(() => ({}))) || {}) as { name?: string };
  const n = String(name ?? '').trim().slice(0, 60);
  if (!n) return fehler(400, 'Bitte einen Namen für die Klasse angeben.');
  const k = await klasseAnlegen(b.id, n);
  return k instanceof Response ? k : Response.json({ klasse: k });
}
