'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { meldungVon, senden } from '../../../_teile/api';
import { kit } from '../../../_teile/Figuren';

export function KlasseAktionen({ id, aktiv }: { id: string; aktiv: boolean }) {
  const router = useRouter();
  return (
    <>
      <button className="btn sec" onClick={async () => { await senden(`/api/klassen/${id}`, 'PATCH', { aktiv: !aktiv }); router.refresh(); }}>
        {aktiv ? '🔒 Registrierung sperren' : '🔓 Registrierung öffnen'}</button>
      <button className="btn ghost" onClick={async () => {
        if (!confirm('Klasse löschen? Die Konten der Lernenden bleiben bestehen, sind aber keiner Klasse mehr zugeordnet.')) return;
        await senden(`/api/klassen/${id}`, 'DELETE'); location.href = '/lehrkraft';
      }}>Klasse löschen</button>
    </>
  );
}

export function LernendeAktionen({ klasse, id, name, children }: { klasse: string; id: string; name: string; children?: React.ReactNode }) {
  const router = useRouter();
  const [neu, setNeu] = useState('');
  async function passwort() {
    if (!confirm(`Neues Startpasswort für „${name}“ erzeugen? Das alte Passwort gilt dann nicht mehr.`)) return;
    const r = await senden(`/api/klassen/${klasse}/lernende/${id}/passwort`, 'POST');
    if (r.ok) setNeu(String(r.daten.passwort)); else alert(meldungVon(r.daten));
  }
  async function entfernen(konto: boolean) {
    const frage = konto ? `Konto „${name}“ mit Spielstand endgültig löschen?` : `„${name}“ aus der Klasse nehmen? Das Konto bleibt bestehen.`;
    if (!confirm(frage)) return;
    await senden(`/api/klassen/${klasse}/lernende/${id}${konto ? '?konto=loeschen' : ''}`, 'DELETE');
    router.refresh();
  }
  return (
    <div className="zeile">
      {children}
      <button className="btn sec klein" data-aktion="passwort" onClick={passwort}>🔑 Passwort</button>
      <button className="btn ghost klein" onClick={() => entfernen(false)}>Entfernen</button>
      <button className="btn ghost klein" onClick={() => entfernen(true)}>Konto löschen</button>
      {neu && <span>Neues Passwort: <span className="passwort-neu" data-passwort>{neu}</span></span>}
    </div>
  );
}

export type LernendDaten = { id: string; username: string; codename: string | null; avatar: string | null };

// Benutzername, Codename, Figur und Klasse ändern (Codename und Figur erst, wenn ein Spielstand existiert)
export function LernendBearbeiten({ klasse, lernend, klassen }: { klasse: string; lernend: LernendDaten; klassen: { id: string; name: string }[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [figuren, setFiguren] = useState<{ id: string; name: string; svg: string }[]>([]);
  const [avatar, setAvatar] = useState(lernend.avatar);
  const [meldung, setMeldung] = useState('');
  const gespielt = lernend.codename != null;

  function oeffnen() {
    setAvatar(lernend.avatar); setMeldung('');
    if (gespielt && !figuren.length) kit().then(k => setFiguren(k.avatars.liste.map(a => ({ id: a.id, name: a.name, svg: k.avatars.svg(a.id, { titel: false }) }))));
    dialog.current?.showModal();
  }
  async function speichern(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const body: Record<string, unknown> = { benutzername: f.get('benutzername'), klasse: f.get('klasse') ?? klasse };
    if (gespielt) { body.codename = f.get('codename'); body.avatar = avatar; }
    const r = await senden(`/api/klassen/${klasse}/lernende/${lernend.id}`, 'PATCH', body);
    if (!r.ok) { setMeldung(meldungVon(r.daten)); return; }
    dialog.current?.close();
    router.refresh();
  }
  return (
    <>
      <button className="btn sec klein" data-aktion="bearbeiten" onClick={oeffnen}>✏️ Bearbeiten</button>
      <dialog ref={dialog} className="card dialog-bearbeiten" aria-label={`${lernend.username} bearbeiten`}>
        <form className="formular" onSubmit={speichern}>
          <h3>✏️ {lernend.username} bearbeiten</h3>
          <label htmlFor={`bn-${lernend.id}`}>Benutzername (für die Anmeldung)</label>
          <input id={`bn-${lernend.id}`} name="benutzername" defaultValue={lernend.username} required minLength={3} maxLength={24} autoComplete="off" />
          <p className="small muted">Ändert ihr ihn, gilt ab sofort nur noch der neue Name. Sagt ihn der Person, das Passwort bleibt gleich.</p>
          {gespielt ? (
            <>
              <label htmlFor={`cn-${lernend.id}`}>Codename im Spiel (sehen alle in der Rangliste)</label>
              <input id={`cn-${lernend.id}`} name="codename" defaultValue={lernend.codename ?? ''} required maxLength={24} autoComplete="off" />
              <label>Figur</label>
              <div className="av-picker" role="radiogroup" aria-label="Figur wählen">
                {figuren.map(a => (
                  <button key={a.id} type="button" role="radio" className="av-wahl" data-av={a.id} aria-checked={a.id === avatar} title={a.name}
                    onClick={() => setAvatar(a.id)}><span dangerouslySetInnerHTML={{ __html: a.svg }} /><span>{a.name}</span></button>
                ))}
              </div>
            </>
          ) : <p className="small muted">Codename und Figur lassen sich ändern, sobald das Spiel einmal gestartet wurde.</p>}
          {klassen.length > 1 && (
            <>
              <label htmlFor={`kl-${lernend.id}`}>Klasse</label>
              <select id={`kl-${lernend.id}`} name="klasse" defaultValue={klasse}>
                {klassen.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </>
          )}
          {meldung && <div className="meldung fehler" role="alert">{meldung}</div>}
          <div className="btnrow">
            <button className="btn" id="bearbeiten-speichern">Speichern</button>
            <button type="button" className="btn ghost" onClick={() => dialog.current?.close()}>Abbrechen</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
