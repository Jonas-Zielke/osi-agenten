// Passwort vergessen: Die Lehrkraft vergibt ein neues Startpasswort (keine E-Mails im System). Alte Sitzungen enden.
import { abfrage } from '@/lib/db';
import { eigeneKlasse, fehler, lehrkraftOderFehler } from '@/lib/rechte';
import { passwortSetzen } from '@/lib/verwaltung';
import { startpasswort } from '@/lib/werte';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; uid: string }> }) {
  const b = await lehrkraftOderFehler();
  if (b instanceof Response) return b;
  const { id, uid } = await params;
  const k = await eigeneKlasse(b, id);
  if (!k) return fehler(404, 'Klasse nicht gefunden.');
  const [m] = await abfrage('select 1 from mitgliedschaft where klasse_id = $1 and user_id = $2', [k.id, uid]);
  if (!m) return fehler(404, 'Nicht in dieser Klasse.');
  const neu = startpasswort();
  await passwortSetzen(uid, neu);
  return Response.json({ passwort: neu });
}
