import Link from 'next/link';
import { abfrage } from '@/lib/db';
import { Figur } from '../../_teile/Figuren';
import { AdminRahmen, adminSeite, datum, prozent } from '../Rahmen';
import { SpielstandHerunterladen } from '../konten/[id]/Aktionen';

type Zeile = { id: string; username: string; codename: string; avatar: string; punkte: number; fall: number; front: string | null; version: string | null; aktualisiert: Date; klasse: string | null };
type Suche = { q?: string; klasse?: string };

export default async function Spielstaende({ searchParams }: { searchParams: Promise<Suche> }) {
  await adminSeite('/admin/spielstaende');
  const s = await searchParams;
  const q = String(s.q ?? '').trim().toLowerCase();
  const klasse = String(s.klasse ?? '');
  const staende = await abfrage<Zeile>(
    `select u.id, u.username, s.codename, s.avatar, s.punkte, s.fall, s.front, s.version, s.aktualisiert, k.name as klasse
       from spielstand s join "user" u on u.id = s.user_id
       left join mitgliedschaft m on m.user_id = u.id left join klasse k on k.id = m.klasse_id
      where ($1 = '' or strpos(u.username, $1) > 0 or strpos(lower(coalesce(s.codename, '')), $1) > 0)
        and ($2 = '' or ($2 = 'keine' and m.klasse_id is null) or m.klasse_id::text = $2)
      order by s.aktualisiert desc`, [q, klasse]);
  const klassen = await abfrage<{ id: string; name: string; lehrkraft: string }>(
    'select k.id, k.name, u.username as lehrkraft from klasse k join "user" u on u.id = k.lehrkraft_id order by k.name');
  const gefiltert = !!(q || klasse);
  return (
    <AdminRahmen aktiv="/admin/spielstaende">
      <div className="card">
        <div className="btnrow" style={{ marginTop: 0 }}>
          <a className="btn" href="/lehrkraft/einsatzzentrale.html?klasse=alle">🗺️ Alle in der Live-Zentrale</a>
          <a className="btn ghost" href="/api/admin/export" download>⬇ Sicherung aller Daten (JSON)</a>
        </div>
        <p className="small muted">Einzelne Spielstände ersetzt oder setzt ihr auf der Seite des Kontos zurück (Verwalten).</p>
      </div>
      <form className="card filter" method="get">
        <div><label htmlFor="q">Suche</label><input type="search" id="q" name="q" defaultValue={q} placeholder="Benutzername oder Codename" /></div>
        <div><label htmlFor="f-klasse">Klasse</label>
          <select id="f-klasse" name="klasse" defaultValue={klasse}>
            <option value="">alle</option><option value="keine">ohne Klasse</option>
            {klassen.map(k => <option key={k.id} value={k.id}>{k.name} ({k.lehrkraft})</option>)}
          </select></div>
        <div className="btnrow"><button className="btn">Filtern</button>{gefiltert && <Link className="btn ghost" href="/admin/spielstaende">Alle zeigen</Link>}</div>
      </form>
      <div className="card tabelle-scroll">
        <h3>Spielstände ({staende.length})</h3>
        {staende.length ? (
          <table className="t">
            <thead><tr><th>Codename</th><th>Benutzername</th><th>Klasse</th><th className="num">XP</th><th className="num">Fall</th><th>nächster Schritt</th><th>Version</th><th>gespeichert</th><th>Aktionen</th></tr></thead>
            <tbody>{staende.map(x => (
              <tr key={x.id} data-spielstand={x.username}>
                <td className="nowrap"><Figur id={x.avatar} className="rl-figur" />{x.codename}</td>
                <td><Link href={`/admin/konten/${x.id}`}>{x.username}</Link></td><td>{x.klasse ?? <span className="muted">–</span>}</td>
                <td className="num">{x.punkte}</td><td className="num">{prozent(x.fall)}</td>
                <td className="nowrap"><code className="small">{x.front ?? 'fertig'}</code></td><td className="small">{x.version || '–'}</td><td className="small nowrap">{datum(x.aktualisiert)}</td>
                <td><div className="zeile eng"><SpielstandHerunterladen id={x.id} name={x.username} /><Link className="btn sec klein" href={`/admin/konten/${x.id}#spielstand`}>Verwalten</Link></div></td>
              </tr>))}
            </tbody>
          </table>
        ) : <p className="muted">Keine Spielstände {gefiltert ? 'für diesen Filter' : ''}.</p>}
      </div>
    </AdminRahmen>
  );
}
