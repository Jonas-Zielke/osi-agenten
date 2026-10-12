// Admin: die Person auf allen Geräten abmelden (die eigene laufende Sitzung des Admins bleibt)
import { adminOderFehler, fehler } from '@/lib/rechte';
import { kontoLaden, sitzungenBeenden } from '@/lib/verwaltung';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  return Response.json({ beendet: await sitzungenBeenden(k.id, b.sitzung) });
}
