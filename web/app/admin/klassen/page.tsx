import Link from 'next/link';
import { abfrage } from '@/lib/db';
import { AdminRahmen, adminSeite, datum } from '../Rahmen';
import { KlasseAnlegen, KlasseVerwalten } from './Aktionen';

type Zeile = { id: string; name: string; code: string; aktiv: boolean; erstellt: Date; lehrkraft_id: string; lehrkraft: string; lernende: number; gespielt: number };

export default async function Klassen() {
  await adminSeite('/admin/klassen');
  const klassen = await abfrage<Zeile>(
    `select k.id, k.name, k.code, k.aktiv, k.erstellt, k.lehrkraft_id, u.username as lehrkraft,
            count(m.user_id)::int as lernende, count(s.user_id)::int as gespielt
       from klasse k join "user" u on u.id = k.lehrkraft_id
       left join mitgliedschaft m on m.klasse_id = k.id left join spielstand s on s.user_id = m.user_id
      group by k.id, u.username order by u.username, k.name`);
  // Wem kann eine Klasse gehören? Freigeschalteten Lehrkräften und Admins
  const lehrkraefte = await abfrage<{ id: string; username: string }>(
    `select id, username from "user" where rolle = 'admin' or (rolle = 'lehrkraft' and "lehrkraftStatus" = 'frei') order by username`);
  return (
    <AdminRahmen aktiv="/admin/klassen">
      <div className="card tabelle-scroll">
        <h3>Alle Klassen ({klassen.length})</h3>
        {klassen.length ? (
          <table className="t">
            <thead><tr><th>Klasse</th><th>Klassencode</th><th>Lehrkraft</th><th className="num">Lernende</th><th className="num">gespielt</th><th>Registrierung</th><th>angelegt</th><th>Aktionen</th></tr></thead>
            <tbody>{klassen.map(k => (
              <tr key={k.id} data-klasse={k.name}>
                <td><b>{k.name}</b></td><td><code>{k.code}</code></td>
                <td><Link href={`/admin/konten/${k.lehrkraft_id}`}>{k.lehrkraft}</Link></td>
                <td className="num"><Link href={`/admin/konten?klasse=${k.id}`}>{k.lernende}</Link></td><td className="num">{k.gespielt}</td>
                <td>{k.aktiv ? 'offen' : '🔒 gesperrt'}</td><td className="small nowrap">{datum(k.erstellt)}</td>
                <td><div className="zeile eng">
                  <a className="btn klein" href={`/lehrkraft/einsatzzentrale.html?klasse=${k.id}`}>🗺️ Live</a>
                  <Link className="btn sec klein" href={`/lehrkraft/klasse/${k.id}`}>👥 Lernende</Link>
                  <KlasseVerwalten klasse={{ id: k.id, name: k.name, code: k.code, aktiv: k.aktiv, lehrkraft: k.lehrkraft_id, lernende: k.lernende }} lehrkraefte={lehrkraefte} />
                </div></td>
              </tr>))}
            </tbody>
          </table>
        ) : <p className="muted">Noch keine Klasse angelegt.</p>}
      </div>
      <KlasseAnlegen lehrkraefte={lehrkraefte} />
    </AdminRahmen>
  );
}
