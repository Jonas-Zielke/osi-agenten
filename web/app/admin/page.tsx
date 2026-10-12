import Link from 'next/link';
import { abfrage } from '@/lib/db';
import { Figur } from '../_teile/Figuren';
import { AdminAktionen } from './Aktionen';
import { AdminRahmen, adminSeite, datum, prozent } from './Rahmen';

type Lk = { id: string; username: string; status: string; erstellt: Date; klassen: number };
type Zahlen = { konten: number; lernende: number; lehrkraefte: number; antraege: number; klassen: number; spielstaende: number; aktiv: number };
type Zuletzt = { id: string; username: string; codename: string; avatar: string; punkte: number; fall: number; aktualisiert: Date; klasse: string | null };

export default async function Admin() {
  await adminSeite('/admin');
  const [z] = await abfrage<Zahlen>(
    `select (select count(*)::int from "user") as konten,
            (select count(*)::int from "user" where rolle = 'lernend') as lernende,
            (select count(*)::int from "user" where rolle = 'lehrkraft' and "lehrkraftStatus" = 'frei') as lehrkraefte,
            (select count(*)::int from "user" where rolle = 'lehrkraft' and "lehrkraftStatus" is distinct from 'frei') as antraege,
            (select count(*)::int from klasse) as klassen,
            (select count(*)::int from spielstand) as spielstaende,
            (select count(*)::int from spielstand where aktualisiert > now() - interval '7 days') as aktiv`);
  const lk = await abfrage<Lk>(
    `select u.id, u.username, u."lehrkraftStatus" as status, u."createdAt" as erstellt, count(k.id)::int as klassen
       from "user" u left join klasse k on k.lehrkraft_id = u.id where u.rolle = 'lehrkraft' group by u.id order by u."lehrkraftStatus", u."createdAt" desc`);
  const zuletzt = await abfrage<Zuletzt>(
    `select u.id, u.username, s.codename, s.avatar, s.punkte, s.fall, s.aktualisiert, k.name as klasse
       from spielstand s join "user" u on u.id = s.user_id
       left join mitgliedschaft m on m.user_id = u.id left join klasse k on k.id = m.klasse_id
      order by s.aktualisiert desc limit 8`);
  return (
    <AdminRahmen aktiv="/admin">
      <div className="statkacheln">
        <div className="statkachel blau"><span>Konten</span><b>{z.konten}</b></div>
        <div className="statkachel blau"><span>Lernende</span><b>{z.lernende}</b></div>
        <div className="statkachel blau"><span>Lehrkräfte</span><b>{z.lehrkraefte}</b></div>
        <div className="statkachel gold"><span>Klassen</span><b>{z.klassen}</b></div>
        <div className="statkachel gruen"><span>Spielstände</span><b>{z.spielstaende}</b></div>
        <div className="statkachel gruen"><span>aktiv (7 Tage)</span><b>{z.aktiv}</b></div>
      </div>
      {z.antraege > 0 && <div className="warnbar">⏳ <b>{z.antraege === 1 ? 'Ein Lehrkraft-Antrag wartet' : `${z.antraege} Lehrkraft-Anträge warten`}</b> auf eure Entscheidung (unten).</div>}

      <div className="card">
        <h3>Werkzeuge</h3>
        <div className="btnrow">
          <a className="btn" href="/lehrkraft/einsatzzentrale.html?klasse=alle">🗺️ Live-Zentrale aller Klassen</a>
          <Link className="btn sec" href="/admin/konten#neu">＋ Konto anlegen</Link>
          <Link className="btn sec" href="/admin/klassen#neu">＋ Klasse anlegen</Link>
          <a className="btn ghost" href="/api/admin/export" download>⬇ Sicherung (JSON)</a>
        </div>
        <p className="small muted">Die Sicherung enthält alle Konten (ohne Passwörter), Klassen und Spielstände. Bewahrt sie so sorgfältig auf wie die Datenbank selbst.</p>
      </div>

      <div className="card tabelle-scroll">
        <h3>Lehrkräfte</h3>
        {lk.length ? (
          <table className="t">
            <thead><tr><th>Benutzername</th><th>Status</th><th className="num">Klassen</th><th>registriert</th><th>Aktion</th></tr></thead>
            <tbody>{lk.map(l => (
              <tr key={l.id} data-lehrkraft={l.username}>
                <td><Link href={`/admin/konten/${l.id}`}><b>{l.username}</b></Link></td><td>{l.status === 'frei' ? '✅ freigeschaltet' : '⏳ beantragt'}</td><td className="num">{l.klassen}</td>
                <td className="small">{datum(l.erstellt)}</td>
                <td><AdminAktionen id={l.id} status={l.status} name={l.username} /></td>
              </tr>))}
            </tbody>
          </table>
        ) : <p className="muted">Noch keine Lehrkraft registriert.</p>}
        <p className="small muted">Prüft vor dem Freischalten, ob ihr die Person kennt – Lehrkräfte sehen die Spielstände ihrer Klassen und können Passwörter zurücksetzen.</p>
      </div>

      <div className="card tabelle-scroll">
        <h3>Zuletzt gespielt</h3>
        {zuletzt.length ? (
          <table className="t">
            <thead><tr><th>Codename</th><th>Benutzername</th><th>Klasse</th><th className="num">XP</th><th className="num">Fall</th><th>gespeichert</th></tr></thead>
            <tbody>{zuletzt.map(s => (
              <tr key={s.id}>
                <td className="nowrap"><Figur id={s.avatar} className="rl-figur" />{s.codename}</td>
                <td><Link href={`/admin/konten/${s.id}`}>{s.username}</Link></td><td>{s.klasse ?? '–'}</td>
                <td className="num">{s.punkte}</td><td className="num">{prozent(s.fall)}</td><td className="small">{datum(s.aktualisiert)}</td>
              </tr>))}
            </tbody>
          </table>
        ) : <p className="muted">Noch kein Spielstand gespeichert.</p>}
        <p className="small"><Link href="/admin/spielstaende">Alle Spielstände ▸</Link></p>
      </div>
    </AdminRahmen>
  );
}
