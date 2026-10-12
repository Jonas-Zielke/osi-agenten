// Admin: Sicherung als JSON-Datei – Konten (ohne Passwörter und Sitzungen), Klassen und alle Spielstände
import { abfrage } from '@/lib/db';
import { adminOderFehler } from '@/lib/rechte';

export async function GET() {
  const b = await adminOderFehler();
  if (b instanceof Response) return b;
  const [konten, klassen, spielstaende] = await Promise.all([
    abfrage(`select u.id, u.username as benutzername, u.rolle, u."lehrkraftStatus" as "lehrkraftStatus", u."createdAt" as registriert, m.klasse_id
               from "user" u left join mitgliedschaft m on m.user_id = u.id order by u."createdAt"`),
    abfrage('select id, name, code, aktiv, lehrkraft_id, erstellt from klasse order by erstellt'),
    abfrage(`select s.user_id, u.username as benutzername, s.aktualisiert, s.daten
               from spielstand s join "user" u on u.id = s.user_id order by u.username`)
  ]);
  const jetzt = new Date();
  return new Response(JSON.stringify({ art: 'OSI-Agenten Sicherung', exportiert: jetzt.toISOString(), konten, klassen, spielstaende }, null, 1), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="OSI-Agenten_Sicherung_${jetzt.toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store'
    }
  });
}
