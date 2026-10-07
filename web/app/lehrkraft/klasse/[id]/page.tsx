import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { abfrage } from '@/lib/db';
import { benutzer, eigeneKlasse, istAdmin, istLehrkraft } from '@/lib/rechte';
import { Kopf } from '../../../_teile/Kopf';
import { Fuss } from '../../../_teile/Fuss';
import { Figur } from '../../../_teile/Figuren';
import { KlasseAktionen, LernendBearbeiten, LernendeAktionen } from './Aktionen';

type Lernend = { id: string; username: string; codename: string | null; avatar: string | null; punkte: number | null; fall: number | null; aktualisiert: Date | null };

export default async function KlasseSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await benutzer();
  if (!b) redirect(`/anmelden?weiter=/lehrkraft/klasse/${id}`);
  if (!istLehrkraft(b)) redirect('/lehrkraft');
  const k = await eigeneKlasse(b, id);
  if (!k) notFound();
  const lernende = await abfrage<Lernend>(
    `select u.id, u.username, s.codename, s.avatar, s.punkte, s.fall, s.aktualisiert
       from mitgliedschaft m join "user" u on u.id = m.user_id left join spielstand s on s.user_id = u.id
      where m.klasse_id = $1 order by u.username`, [k.id]);
  // Zielklassen zum Verschieben: alle eigenen (der Admin: alle)
  const klassen = await abfrage<{ id: string; name: string }>(
    'select id, name from klasse where lehrkraft_id = $1 or $2 order by name', [b.id, istAdmin(b)]);
  return (
    <>
      <Kopf />
      <main className="seite">
        <p><Link href="/lehrkraft">◂ Alle Klassen</Link></p>
        <div className="card">
          <div className="eyebrow">{k.aktiv ? 'Klasse' : 'Klasse · gesperrt (keine neuen Registrierungen)'}</div>
          <h2>{k.name}</h2>
          <div className="zeile"><span className="muted">Klassencode</span><span className="code-gross">{k.code}</span></div>
          <div className="btnrow"><a className="btn" href={`/lehrkraft/einsatzzentrale.html?klasse=${k.id}`}>🗺️ Live-Einsatzzentrale</a><KlasseAktionen id={k.id} aktiv={k.aktiv} /></div>
        </div>
        <div className="card tabelle-scroll">
          <h3>Lernende ({lernende.length})</h3>
          {lernende.length ? (
            <table className="t">
              <thead><tr><th>Benutzername</th><th>Codename</th><th className="num">XP</th><th className="num">Fall</th><th>zuletzt</th><th>Aktionen</th></tr></thead>
              <tbody>{lernende.map(l => (
                <tr key={l.id} data-lernend={l.username}>
                  <td><b>{l.username}</b></td><td className="nowrap">{l.avatar && <Figur id={l.avatar} className="rl-figur" />}{l.codename ?? '–'}</td><td className="num">{l.punkte ?? 0}</td>
                  <td className="num">{Math.round((l.fall ?? 0) * 100)} %</td>
                  <td className="small">{l.aktualisiert ? new Date(l.aktualisiert).toLocaleString('de-DE') : 'noch nicht gespielt'}</td>
                  <td><LernendeAktionen klasse={k.id} id={l.id} name={l.username}><LernendBearbeiten klasse={k.id} lernend={l} klassen={klassen} /></LernendeAktionen></td>
                </tr>))}
              </tbody>
            </table>
          ) : <p className="muted">Noch niemand registriert. Gebt den Klassencode <b>{k.code}</b> weiter.</p>}
        </div>
        <Fuss />
      </main>
    </>
  );
}
