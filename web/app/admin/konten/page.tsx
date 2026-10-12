import Link from 'next/link';
import { abfrage } from '@/lib/db';
import { ZUGAENGE } from '@/lib/zugang';
import { Figur } from '../../_teile/Figuren';
import { AdminRahmen, adminSeite, datum, prozent, RolleChip } from '../Rahmen';
import { KontoAnlegen } from './Anlegen';

type Zeile = {
  id: string; username: string; rolle: string; status: string | null; erstellt: Date; klasse_id: string | null; klasse: string | null;
  codename: string | null; avatar: string | null; punkte: number | null; fall: number | null; aktualisiert: Date | null; sitzungen: number;
};
type Suche = { q?: string; rolle?: string; klasse?: string };
const GRENZE = 500;
// wie zugangVon() in lib/zugang.ts
const ZUGANG_SQL = `case u.rolle when 'admin' then 'admin' when 'lehrkraft' then case when u."lehrkraftStatus" = 'frei' then 'lehrkraft' else 'beantragt' end else 'lernend' end`;

export default async function Konten({ searchParams }: { searchParams: Promise<Suche> }) {
  await adminSeite('/admin/konten');
  const s = await searchParams;
  const q = String(s.q ?? '').trim().toLowerCase();
  const z = ZUGAENGE.find(x => x.id === s.rolle);
  const klasse = String(s.klasse ?? '');
  // Filter als Parameter: Suche in Benutzername und Codename, Rolle (samt Freischaltung), Klasse oder „ohne Klasse“
  const konten = await abfrage<Zeile>(
    `select u.id, u.username, u.rolle, u."lehrkraftStatus" as status, u."createdAt" as erstellt, m.klasse_id, k.name as klasse,
            s.codename, s.avatar, s.punkte, s.fall, s.aktualisiert,
            (select count(*)::int from session x where x."userId" = u.id and x."expiresAt" > now()) as sitzungen
       from "user" u left join mitgliedschaft m on m.user_id = u.id left join klasse k on k.id = m.klasse_id
       left join spielstand s on s.user_id = u.id
      where ($1 = '' or strpos(u.username, $1) > 0 or strpos(lower(coalesce(s.codename, '')), $1) > 0)
        and ($2 = '' or ${ZUGANG_SQL} = $2)
        and ($3 = '' or ($3 = 'keine' and m.klasse_id is null) or m.klasse_id::text = $3)
      order by u.username limit ${GRENZE + 1}`,
    [q, z?.id ?? '', klasse]);
  const klassen = await abfrage<{ id: string; name: string; lehrkraft: string }>(
    'select k.id, k.name, u.username as lehrkraft from klasse k join "user" u on u.id = k.lehrkraft_id order by k.name');
  const gefiltert = !!(q || z || klasse);
  return (
    <AdminRahmen aktiv="/admin/konten">
      <form className="card filter" method="get">
        <div><label htmlFor="q">Suche</label><input type="search" id="q" name="q" defaultValue={q} placeholder="Benutzername oder Codename" /></div>
        <div><label htmlFor="f-rolle">Rolle</label>
          <select id="f-rolle" name="rolle" defaultValue={z?.id ?? ''}>
            <option value="">alle</option>{ZUGAENGE.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select></div>
        <div><label htmlFor="f-klasse">Klasse</label>
          <select id="f-klasse" name="klasse" defaultValue={klasse}>
            <option value="">alle</option><option value="keine">ohne Klasse</option>
            {klassen.map(k => <option key={k.id} value={k.id}>{k.name} ({k.lehrkraft})</option>)}
          </select></div>
        <div className="btnrow"><button className="btn">Filtern</button>{gefiltert && <Link className="btn ghost" href="/admin/konten">Alle zeigen</Link>}</div>
      </form>

      <div className="card tabelle-scroll">
        <h3>Konten ({konten.length > GRENZE ? `mehr als ${GRENZE}` : konten.length})</h3>
        {konten.length ? (
          <table className="t">
            <thead><tr><th>Benutzername</th><th>Rolle</th><th>Klasse</th><th>Codename</th><th className="num">XP</th><th className="num">Fall</th><th>zuletzt gespielt</th><th>registriert</th><th></th></tr></thead>
            <tbody>{konten.slice(0, GRENZE).map(k => (
              <tr key={k.id} data-konto={k.username}>
                <td><Link href={`/admin/konten/${k.id}`}><b>{k.username}</b></Link>{k.sitzungen > 0 && <span className="small muted" title="aktive Anmeldungen"> · 🟢 {k.sitzungen}</span>}</td>
                <td><RolleChip rolle={k.rolle} status={k.status} /></td>
                <td>{k.klasse ?? <span className="muted">–</span>}</td>
                <td className="nowrap">{k.avatar && <Figur id={k.avatar} className="rl-figur" />}{k.codename ?? <span className="muted">–</span>}</td>
                <td className="num">{k.punkte ?? '–'}</td><td className="num">{k.aktualisiert ? prozent(k.fall) : '–'}</td>
                <td className="small nowrap">{k.aktualisiert ? datum(k.aktualisiert) : 'noch nicht'}</td><td className="small nowrap">{datum(k.erstellt)}</td>
                <td><Link className="btn sec klein" href={`/admin/konten/${k.id}`} data-aktion="oeffnen">Verwalten</Link></td>
              </tr>))}
            </tbody>
          </table>
        ) : <p className="muted">Keine Konten {gefiltert ? 'für diesen Filter' : ''}.</p>}
        {konten.length > GRENZE && <p className="small muted">Es werden die ersten {GRENZE} angezeigt – grenzt die Suche ein.</p>}
      </div>

      <KontoAnlegen klassen={klassen} />
    </AdminRahmen>
  );
}
