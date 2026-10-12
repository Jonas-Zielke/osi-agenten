// Admin: alle Spielstände aller Konten – für die Live-Einsatzzentrale (einsatzzentrale.html?klasse=alle)
import { abfrage } from '@/lib/db';
import { adminOderFehler } from '@/lib/rechte';

export async function GET() {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const rows = await abfrage<{ daten: Record<string, unknown> }>('select daten from spielstand order by aktualisiert desc');
  return Response.json({ klasse: { id: 'alle', name: 'Alle Klassen' }, spielstaende: rows.map(r => r.daten) });
}
