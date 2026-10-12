// Admin: Konto direkt anlegen (Lernende mit oder ohne Klasse, Lehrkraft, Admin). Ohne Passwort gibt es ein Startpasswort.
import { abfrage } from '@/lib/db';
import { adminOderFehler, fehler, gueltigeId } from '@/lib/rechte';
import { kontoAnlegen, NAME_REGEL } from '@/lib/verwaltung';
import { gueltigerName, gueltigesPasswort, normName, startpasswort } from '@/lib/werte';
import { ZUGAENGE } from '@/lib/zugang';

export async function POST(req: Request) {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const d = ((await req.json().catch(() => null)) || {}) as { benutzername?: string; passwort?: string; rolle?: string; klasse?: string };
  const name = normName(d.benutzername);
  if (!gueltigerName(name)) return fehler(400, NAME_REGEL);
  const z = ZUGAENGE.find(x => x.id === (d.rolle || 'lernend'));
  if (!z) return fehler(400, 'Unbekannte Rolle.');
  const eigenes = d.passwort != null && d.passwort !== '';
  if (eigenes && !gueltigesPasswort(d.passwort)) return fehler(400, 'Das Passwort braucht 8 bis 128 Zeichen.');
  let klasseId: string | null = null;
  if (d.klasse) {
    const [k] = gueltigeId(d.klasse) ? await abfrage<{ id: string }>('select id from klasse where id = $1', [d.klasse]) : [];
    if (!k) return fehler(404, 'Klasse nicht gefunden.');
    klasseId = k.id;
  }
  if ((await abfrage('select 1 from "user" where username = $1', [name])).length) return fehler(409, 'Diesen Benutzernamen gibt es schon.');
  const passwort = eigenes ? String(d.passwort) : startpasswort();
  const id = await kontoAnlegen({ name, anzeige: name, passwort, rolle: z.rolle, status: z.status, klasseId });
  if (id instanceof Response) return id;
  return Response.json({ ok: true, id, benutzername: name, passwort: eigenes ? null : passwort });
}
