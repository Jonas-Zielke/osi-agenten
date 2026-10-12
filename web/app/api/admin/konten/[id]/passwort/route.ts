// Admin: neues Passwort setzen – selbst gewählt oder als Startpasswort erzeugt. Alle Sitzungen der Person enden.
import { adminOderFehler, fehler } from '@/lib/rechte';
import { kontoLaden, passwortSetzen } from '@/lib/verwaltung';
import { gueltigesPasswort, startpasswort } from '@/lib/werte';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const k = await kontoLaden((await params).id);
  if (!k) return fehler(404, 'Konto nicht gefunden.');
  const d = ((await req.json().catch(() => null)) || {}) as { passwort?: string };
  const eigenes = d.passwort != null && d.passwort !== '';
  if (eigenes && !gueltigesPasswort(d.passwort)) return fehler(400, 'Das Passwort braucht 8 bis 128 Zeichen.');
  const neu = eigenes ? String(d.passwort) : startpasswort();
  await passwortSetzen(k.id, neu, b.sitzung);
  return Response.json({ passwort: neu });
}
