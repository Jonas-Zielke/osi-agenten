import Link from 'next/link';
import { notFound } from 'next/navigation';
import { abfrage } from '@/lib/db';
import { kontoLaden } from '@/lib/verwaltung';
import { zugangVon } from '@/lib/zugang';
import { Figur } from '../../../_teile/Figuren';
import { AdminRahmen, adminSeite, datum, prozent, RolleChip } from '../../Rahmen';
import { KontoBearbeiten, KontoLoeschen, KontoZugang, SpielstandVerwalten } from './Aktionen';

type Stand = { daten: Record<string, unknown>; version: string | null; punkte: number; fall: number; front: string | null; aktualisiert: Date; vorgabe: unknown };
const anzahl = (o: unknown) => (o && typeof o === 'object' ? Object.keys(o).length : 0);

export default async function KontoSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await adminSeite(`/admin/konten/${id}`);
  const k = await kontoLaden(id);
  if (!k) notFound();
  const [[klasse], [sitz], [stand], [verworfen], eigene, klassen] = await Promise.all([
    abfrage<{ id: string; name: string; lehrkraft_id: string; lehrkraft: string }>(
      'select k.id, k.name, k.lehrkraft_id, u.username as lehrkraft from klasse k join "user" u on u.id = k.lehrkraft_id where k.id = $1', [k.klasse_id]),
    abfrage<{ aktiv: number; zuletzt: Date | null }>(
      `select count(*) filter (where "expiresAt" > now())::int as aktiv, max("createdAt") as zuletzt from session where "userId" = $1`, [k.id]),
    abfrage<Stand>('select daten, version, punkte, fall, front, aktualisiert, vorgabe from spielstand where user_id = $1', [k.id]),
    abfrage<{ zeitpunkt: Date }>('select zeitpunkt from spielstand_verworfen where user_id = $1', [k.id]),
    abfrage<{ id: string; name: string; code: string; aktiv: boolean; lernende: number }>(
      `select k.id, k.name, k.code, k.aktiv, count(m.user_id)::int as lernende from klasse k left join mitgliedschaft m on m.klasse_id = k.id
        where k.lehrkraft_id = $1 group by k.id order by k.name`, [k.id]),
    abfrage<{ id: string; name: string; lehrkraft: string }>(
      'select k.id, k.name, u.username as lehrkraft from klasse k join "user" u on u.id = k.lehrkraft_id order by k.name')
  ]);
  const d = stand?.daten;
  const items = (d?.items ?? {}) as Record<string, { ok?: boolean }>;
  const selbst = k.id === b.id;
  return (
    <AdminRahmen aktiv="/admin/konten">
      <p><Link href="/admin/konten">◂ Alle Konten</Link></p>
      <div className="card konto-kopf">
        {k.avatar && <Figur id={k.avatar} className="konto-figur" />}
        <div>
          <div className="eyebrow"><RolleChip rolle={k.rolle} status={k.status} />{selbst && ' · euer eigenes Konto'}</div>
          <h2 style={{ margin: '4px 0' }}>👤 {k.username}</h2>
          <dl className="fakten">
            <dt>Klasse</dt><dd>{klasse ? <>{klasse.name} · Lehrkraft <Link href={`/admin/konten/${klasse.lehrkraft_id}`}>{klasse.lehrkraft}</Link></> : 'keine'}</dd>
            <dt>registriert</dt><dd>{datum(k.erstellt)}</dd>
            <dt>zuletzt angemeldet</dt><dd>{sitz.zuletzt && `${datum(sitz.zuletzt)} · `}{sitz.aktiv ? `${sitz.aktiv} aktive Anmeldung(en)` : 'gerade nicht angemeldet'}</dd>
          </dl>
        </div>
      </div>

      <div className="admin-spalten">
        <KontoBearbeiten konto={{ id: k.id, username: k.username, zugang: zugangVon(k.rolle, k.status), klasse: k.klasse_id, codename: k.codename, avatar: k.avatar }} klassen={klassen} selbst={selbst} />
        <KontoZugang id={k.id} name={k.username} />
      </div>

      <div className="card" id="spielstand">
        <h3>💾 Spielstand</h3>
        {stand && d ? (
          <>
            <dl className="fakten">
              <dt>Codename</dt><dd>{k.codename}</dd>
              <dt>XP</dt><dd>{stand.punkte}</dd>
              <dt>Fall gelöst</dt><dd>{prozent(stand.fall)}</dd>
              <dt>nächster Schritt</dt><dd><code>{stand.front ?? 'alles erledigt'}</code></dd>
              <dt>Schritte erledigt</dt><dd>{anzahl(d.steps)}</dd>
              <dt>Aufgaben</dt><dd>{Object.values(items).filter(i => i && i.ok).length} gelöst von {anzahl(items)} bearbeiteten</dd>
              <dt>Abzeichen</dt><dd>{anzahl(d.badges)}</dd>
              <dt>Zeit-Challenge</dt><dd>Bestwert {Number((d.challenge as { best?: number } | undefined)?.best) || 0}</dd>
              <dt>Spielversion</dt><dd>{stand.version || '–'}</dd>
              <dt>angelegt</dt><dd>{datum(String(d.erstellt ?? '') || null)}</dd>
              <dt>gespeichert</dt><dd>{datum(stand.aktualisiert)}</dd>
              {stand.vorgabe != null && <><dt>offene Änderung</dt><dd className="small">Codename/Figur werden beim nächsten Speichern ins offene Spiel übernommen.</dd></>}
            </dl>
            <details className="roh"><summary>Rohdaten ansehen (JSON)</summary><pre>{JSON.stringify(d, null, 2)}</pre></details>
          </>
        ) : <p className="muted">Noch kein Spielstand gespeichert.{verworfen && <> Zuletzt zurückgesetzt am {datum(verworfen.zeitpunkt)}.</>}</p>}
        <SpielstandVerwalten id={k.id} name={k.username} vorhanden={!!stand} selbst={selbst} />
      </div>

      {(k.rolle !== 'lernend' || eigene.length > 0) && (
        <div className="card tabelle-scroll">
          <h3>🏫 Klassen dieser Lehrkraft</h3>
          {eigene.length ? (
            <table className="t">
              <thead><tr><th>Klasse</th><th>Code</th><th className="num">Lernende</th><th>Registrierung</th><th></th></tr></thead>
              <tbody>{eigene.map(x => (
                <tr key={x.id}><td><b>{x.name}</b></td><td><code>{x.code}</code></td><td className="num">{x.lernende}</td><td>{x.aktiv ? 'offen' : '🔒 gesperrt'}</td>
                  <td><Link className="btn sec klein" href={`/lehrkraft/klasse/${x.id}`}>Lernende</Link></td></tr>))}
              </tbody>
            </table>
          ) : <p className="muted">Keine eigenen Klassen.</p>}
        </div>
      )}

      <KontoLoeschen id={k.id} name={k.username} klassen={eigene.length} selbst={selbst} />
    </AdminRahmen>
  );
}
