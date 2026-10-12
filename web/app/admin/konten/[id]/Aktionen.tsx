'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZUGAENGE, type Zugang } from '@/lib/zugang';
import { meldungVon, senden } from '../../../_teile/api';
import { FigurWahl } from '../../../_teile/Figuren';
import { alsDatei, spielKit, spielstandAusDatei } from '../../../_teile/spielkit';

type Meldung = { ok: boolean; text: string } | null;
const Hinweis = ({ m }: { m: Meldung }) => (m ? <div className={`meldung ${m.ok ? 'ok' : 'fehler'}`} role={m.ok ? 'status' : 'alert'}>{m.text}</div> : null);

type KontoDaten = { id: string; username: string; zugang: Zugang; klasse: string | null; codename: string | null; avatar: string | null };

// Benutzername, Rolle, Klasse – und, sobald gespielt wurde, Codename und Figur
export function KontoBearbeiten({ konto, klassen, selbst }: { konto: KontoDaten; klassen: { id: string; name: string; lehrkraft: string }[]; selbst: boolean }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(konto.avatar);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const gespielt = konto.codename != null;
  async function speichern(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const rolle = String(f.get('rolle'));
    if (selbst && rolle !== 'admin' && !confirm('Ihr nehmt euch selbst die Admin-Rechte. Danach kommt ihr nicht mehr in diesen Bereich. Weiter?')) return;
    const body: Record<string, unknown> = { benutzername: f.get('benutzername'), rolle, klasse: f.get('klasse') };
    if (gespielt) { body.codename = f.get('codename'); body.avatar = avatar; }
    const r = await senden(`/api/admin/konten/${konto.id}`, 'PATCH', body);
    if (!r.ok) { setMeldung({ ok: false, text: meldungVon(r.daten) }); return; }
    if (selbst && rolle !== 'admin') { location.href = '/'; return; }
    setMeldung({ ok: true, text: 'Gespeichert.' });
    router.refresh();
  }
  return (
    <form className="card formular" onSubmit={speichern} id="bearbeiten">
      <h3>✏️ Konto bearbeiten</h3>
      <label htmlFor="k-name">Benutzername (für die Anmeldung)</label>
      <input type="text" id="k-name" name="benutzername" defaultValue={konto.username} required minLength={3} maxLength={24} autoComplete="off" />
      <label htmlFor="k-rolle">Rolle</label>
      <select id="k-rolle" name="rolle" defaultValue={konto.zugang}>{ZUGAENGE.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
      <label htmlFor="k-klasse">Klasse</label>
      <select id="k-klasse" name="klasse" defaultValue={konto.klasse ?? ''}>
        <option value="">keine Klasse</option>{klassen.map(k => <option key={k.id} value={k.id}>{k.name} ({k.lehrkraft})</option>)}
      </select>
      {gespielt ? (
        <>
          <label htmlFor="k-code">Codename im Spiel (sehen alle in der Rangliste)</label>
          <input type="text" id="k-code" name="codename" defaultValue={konto.codename ?? ''} required maxLength={24} autoComplete="off" />
          <label>Figur</label>
          <FigurWahl wert={avatar} onWahl={setAvatar} />
        </>
      ) : <p className="small muted">Codename und Figur lassen sich ändern, sobald das Spiel einmal gestartet wurde.</p>}
      <Hinweis m={meldung} />
      <div className="btnrow"><button className="btn" id="konto-speichern">Speichern</button></div>
    </form>
  );
}

// Passwort setzen (selbst gewählt oder Startpasswort) und auf allen Geräten abmelden
export function KontoZugang({ id, name }: { id: string; name: string }) {
  const [neu, setNeu] = useState('');
  const [meldung, setMeldung] = useState<Meldung>(null);
  async function passwort(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget, eigenes = String(new FormData(form).get('passwort') || '');
    if (!confirm(`${eigenes ? 'Neues Passwort' : 'Neues Startpasswort'} für „${name}“ setzen? Das alte gilt dann nicht mehr, alle Anmeldungen enden.`)) return;
    const r = await senden(`/api/admin/konten/${id}/passwort`, 'POST', { passwort: eigenes });
    if (!r.ok) { setMeldung({ ok: false, text: meldungVon(r.daten) }); return; }
    setNeu(String(r.daten.passwort)); setMeldung(null); form.reset();
  }
  async function abmelden() {
    const r = await senden(`/api/admin/konten/${id}/sitzungen`, 'DELETE');
    setMeldung(r.ok ? { ok: true, text: `${Number(r.daten.beendet)} Anmeldung(en) beendet.` } : { ok: false, text: meldungVon(r.daten) });
  }
  return (
    <div className="card">
      <form className="formular" onSubmit={passwort}>
        <h3>🔑 Zugang</h3>
        <label htmlFor="k-pw">Neues Passwort (leer lassen: Startpasswort erzeugen)</label>
        <input type="text" id="k-pw" name="passwort" minLength={8} maxLength={128} autoComplete="off" />
        <div className="btnrow"><button className="btn sec" data-aktion="passwort">🔑 Passwort setzen</button></div>
      </form>
      {neu && <p>Neues Passwort: <span className="passwort-neu" data-passwort>{neu}</span><br /><span className="small muted">Gebt es der Person weiter. Sie kann es unter 👤 Konto selbst ändern.</span></p>}
      <p className="small muted" style={{ marginTop: 18 }}>Abmelden beendet die Anmeldung auf allen Geräten. Das Passwort bleibt gleich.</p>
      <button className="btn ghost klein" data-aktion="abmelden" onClick={abmelden}>🚪 Überall abmelden</button>
      <Hinweis m={meldung} />
    </div>
  );
}

// .osiagent (mit Prüfsumme, lädt auch in der Lite-Version) oder JSON herunterladen
export function SpielstandHerunterladen({ id, name }: { id: string; name: string }) {
  const [laeuft, setLaeuft] = useState(false);
  async function holen(format: 'osiagent' | 'json') {
    setLaeuft(true);
    try {
      const r = await senden(`/api/admin/konten/${id}/spielstand`, 'GET');
      if (!r.ok) { alert(meldungVon(r.daten)); return; }
      if (format === 'json') alsDatei(`OSI-Agenten_${name}.json`, JSON.stringify(r.daten.daten, null, 2));
      else (await spielKit()).store.download(r.daten.daten);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLaeuft(false);
    }
  }
  return (
    <>
      <button className="btn sec klein" disabled={laeuft} data-aktion="osiagent" onClick={() => holen('osiagent')}>⬇ .osiagent</button>
      <button className="btn ghost klein" disabled={laeuft} data-aktion="json" onClick={() => holen('json')}>⬇ JSON</button>
    </>
  );
}

// Spielstand durch eine Datei ersetzen oder ganz zurücksetzen. Beides meldet die Person ab, damit ein offenes Spiel
// den alten Stand nicht zurückschreibt (beim eigenen Konto bleibt die laufende Sitzung).
export function SpielstandVerwalten({ id, name, vorhanden, selbst }: { id: string; name: string; vorhanden: boolean; selbst: boolean }) {
  const router = useRouter();
  const datei = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const abmelden = selbst ? '' : ` „${name}“ wird dabei abgemeldet.`;
  async function ersetzen(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    setMeldung({ ok: true, text: 'Datei wird gelesen …' });
    try {
      const r = await spielstandAusDatei(f);
      if ('fehler' in r) { setMeldung({ ok: false, text: r.fehler }); return; }
      if (!confirm(`Spielstand von „${name}“ durch „${r.meta.codename}“ (${r.meta.punkte} XP) ersetzen?${abmelden}`)) { setMeldung(null); return; }
      const a = await senden(`/api/admin/konten/${id}/spielstand`, 'PUT', { daten: r.save, meta: r.meta });
      setMeldung(a.ok ? { ok: true, text: 'Spielstand ersetzt.' } : { ok: false, text: meldungVon(a.daten) });
      router.refresh();
    } catch (e) {
      setMeldung({ ok: false, text: (e as Error).message });
    }
  }
  async function zuruecksetzen() {
    if (!confirm(`Spielstand von „${name}“ endgültig löschen? Beim nächsten Start beginnt das Spiel von vorn.${abmelden}\n\nTipp: Vorher als .osiagent herunterladen.`)) return;
    const r = await senden(`/api/admin/konten/${id}/spielstand`, 'DELETE');
    setMeldung(r.ok ? { ok: true, text: 'Spielstand zurückgesetzt.' } : { ok: false, text: meldungVon(r.daten) });
    router.refresh();
  }
  return (
    <>
      <div className="btnrow">
        {vorhanden && <SpielstandHerunterladen id={id} name={name} />}
        <button className="btn sec klein" data-aktion="ersetzen" onClick={() => datei.current?.click()}>⬆ {vorhanden ? 'Ersetzen' : 'Hochladen'} …</button>
        <input ref={datei} type="file" accept=".osiagent,.json,application/json" hidden onChange={ersetzen} data-datei="spielstand" />
        {vorhanden && <button className="btn ghost klein" data-aktion="zuruecksetzen" onClick={zuruecksetzen}>↺ Zurücksetzen</button>}
      </div>
      <p className="small muted">Hochladen nimmt .osiagent-Dateien (Export aus dem Spiel, auch aus der Lite-Version) und JSON. Punkte und Fortschritt werden wie im Spiel berechnet.</p>
      <Hinweis m={meldung} />
    </>
  );
}

export function KontoLoeschen({ id, name, klassen, selbst }: { id: string; name: string; klassen: number; selbst: boolean }) {
  const router = useRouter();
  const [meldung, setMeldung] = useState<Meldung>(null);
  async function loeschen() {
    const mehr = klassen ? ` Dazu gehören ${klassen} Klasse(n) – sie werden mit gelöscht, die Konten der Lernenden darin bleiben.` : '';
    if (!confirm(`Konto „${name}“ mit Spielstand endgültig löschen?${mehr}${selbst ? '\n\nDas ist euer eigenes Konto!' : ''}`)) return;
    const r = await senden(`/api/admin/konten/${id}`, 'DELETE');
    if (!r.ok) { setMeldung({ ok: false, text: meldungVon(r.daten) }); return; }
    if (r.daten.selbst) location.href = '/'; else router.push('/admin/konten');
  }
  return (
    <div className="card gefahr">
      <h3>Konto löschen</h3>
      <p className="small">Löscht Konto, Spielstand, Anmeldungen und Klassenzuordnung – bei Lehrkräften auch ihre Klassen. Das lässt sich nicht rückgängig machen.</p>
      <button className="btn rot" data-aktion="loeschen" onClick={loeschen}>Konto löschen</button>
      <Hinweis m={meldung} />
    </div>
  );
}
