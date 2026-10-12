// Registrierung: Lernende mit Klassencode, Lehrkräfte als Antrag (Admin schaltet frei).
// Das Konto mit ADMIN_BENUTZERNAME wird Admin, solange es noch keinen gibt. Danach meldet sich das Formular selbst an.
import { abfrage } from '@/lib/db';
import { fehler } from '@/lib/rechte';
import { kontoAnlegen, NAME_REGEL } from '@/lib/verwaltung';
import type { Rolle } from '@/lib/zugang';
import { gueltigerName, gueltigesPasswort, normName } from '@/lib/werte';

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { benutzername?: string; passwort?: string; art?: string; klassencode?: string } | null;
  if (!b) return fehler(400, 'Ungültige Anfrage.');
  const name = normName(b.benutzername);
  if (!gueltigerName(name)) return fehler(400, NAME_REGEL);
  if (!gueltigesPasswort(b.passwort)) return fehler(400, 'Das Passwort braucht mindestens 8 Zeichen.');
  const art = b.art === 'lehrkraft' ? 'lehrkraft' : 'lernend';

  let klasseId: string | null = null;
  if (art === 'lernend') {
    const code = String(b.klassencode ?? '').trim().toUpperCase();
    const [k] = await abfrage<{ id: string }>('select id from klasse where upper(code) = $1 and aktiv', [code]);
    if (!k) return fehler(400, 'Diesen Klassencode gibt es nicht (oder die Klasse ist gesperrt). Fragt eure Lehrkraft.');
    klasseId = k.id;
  }
  if ((await abfrage('select 1 from "user" where username = $1', [name])).length) return fehler(409, 'Diesen Benutzernamen gibt es schon.');

  let rolle: Rolle = art, status: string | null = art === 'lehrkraft' ? 'beantragt' : null;
  const admin = normName(process.env.ADMIN_BENUTZERNAME);
  if (admin && name === admin && !(await abfrage('select 1 from "user" where rolle = $1', ['admin'])).length) { rolle = 'admin'; status = 'frei'; }

  const neu = await kontoAnlegen({ name, anzeige: String(b.benutzername).trim(), passwort: String(b.passwort), rolle, status, klasseId });
  if (neu instanceof Response) return neu;
  return Response.json({ ok: true, rolle, lehrkraftStatus: status });
}
