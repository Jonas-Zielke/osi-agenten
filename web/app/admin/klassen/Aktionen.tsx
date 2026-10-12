'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { meldungVon, senden } from '../../_teile/api';

type Lehrkraft = { id: string; username: string };

export function KlasseAnlegen({ lehrkraefte }: { lehrkraefte: Lehrkraft[] }) {
  const router = useRouter();
  const [fehler, setFehler] = useState('');
  async function los(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget, f = new FormData(form);
    const r = await senden('/api/admin/klassen', 'POST', { name: f.get('name'), lehrkraft: f.get('lehrkraft') });
    if (!r.ok) { setFehler(meldungVon(r.daten)); return; }
    form.reset(); setFehler(''); router.refresh();
  }
  return (
    <form className="card formular" id="neu" onSubmit={los}>
      <h3>＋ Klasse anlegen</h3>
      <div className="feld2">
        <div><label htmlFor="kl-name">Name</label><input type="text" id="kl-name" name="name" required maxLength={60} placeholder="z. B. Netzwerke Kurs B" /></div>
        <div><label htmlFor="kl-lk">Lehrkraft</label>
          <select id="kl-lk" name="lehrkraft">{lehrkraefte.map(l => <option key={l.id} value={l.id}>{l.username}</option>)}</select></div>
      </div>
      {fehler && <div className="meldung fehler" role="alert">{fehler}</div>}
      <div className="btnrow"><button className="btn" id="admin-klasse-neu">＋ Anlegen</button></div>
    </form>
  );
}

type KlasseDaten = { id: string; name: string; code: string; aktiv: boolean; lehrkraft: string; lernende: number };

// Name, Lehrkraft, Registrierung, neuer Klassencode und Löschen (wahlweise samt den Konten der Lernenden)
export function KlasseVerwalten({ klasse, lehrkraefte }: { klasse: KlasseDaten; lehrkraefte: Lehrkraft[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [meldung, setMeldung] = useState('');
  // Gehört die Klasse gerade niemandem mit Rechten (z. B. Rechte entzogen), steht die bisherige Person trotzdem zur Wahl
  const wahl = lehrkraefte.some(l => l.id === klasse.lehrkraft) ? lehrkraefte : [{ id: klasse.lehrkraft, username: '(bisherige, ohne Rechte)' }, ...lehrkraefte];
  const fertig = () => { dialog.current?.close(); router.refresh(); };

  async function speichern(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const r = await senden(`/api/admin/klassen/${klasse.id}`, 'PATCH', { name: f.get('name'), lehrkraft: f.get('lehrkraft'), aktiv: f.get('aktiv') === 'on' });
    if (!r.ok) { setMeldung(meldungVon(r.daten)); return; }
    fertig();
  }
  async function neuerCode() {
    if (!confirm(`Neuen Klassencode für „${klasse.name}“ erzeugen? Der alte Code ${klasse.code} gilt dann nicht mehr. Wer schon registriert ist, bleibt in der Klasse.`)) return;
    const r = await senden(`/api/admin/klassen/${klasse.id}`, 'PATCH', { neuerCode: true });
    if (!r.ok) { setMeldung(meldungVon(r.daten)); return; }
    fertig();
  }
  async function loeschen(konten: boolean) {
    const frage = konten
      ? `Klasse „${klasse.name}“ UND die Konten aller ${klasse.lernende} Lernenden darin mit ihren Spielständen endgültig löschen?`
      : `Klasse „${klasse.name}“ löschen? Die Konten der Lernenden bleiben bestehen, sind aber keiner Klasse mehr zugeordnet.`;
    if (!confirm(frage)) return;
    const r = await senden(`/api/admin/klassen/${klasse.id}${konten ? '?konten=loeschen' : ''}`, 'DELETE');
    if (!r.ok) { setMeldung(meldungVon(r.daten)); return; }
    fertig();
  }
  return (
    <>
      <button className="btn sec klein" data-aktion="klasse-verwalten" onClick={() => { setMeldung(''); dialog.current?.showModal(); }}>✏️ Verwalten</button>
      <dialog ref={dialog} className="card dialog-bearbeiten" aria-label={`Klasse ${klasse.name} verwalten`}>
        <form className="formular" onSubmit={speichern}>
          <h3>✏️ Klasse {klasse.name}</h3>
          <label htmlFor={`kn-${klasse.id}`}>Name</label>
          <input type="text" id={`kn-${klasse.id}`} name="name" defaultValue={klasse.name} required maxLength={60} />
          <label htmlFor={`kl-${klasse.id}`}>Lehrkraft (sieht die Klasse und ihre Spielstände)</label>
          <select id={`kl-${klasse.id}`} name="lehrkraft" defaultValue={klasse.lehrkraft}>{wahl.map(l => <option key={l.id} value={l.id}>{l.username}</option>)}</select>
          <label className="haken"><input type="checkbox" name="aktiv" defaultChecked={klasse.aktiv} /> Registrierung mit dem Klassencode offen</label>
          <div className="btnrow">
            <button className="btn" data-aktion="klasse-speichern">Speichern</button>
            <button type="button" className="btn ghost" onClick={() => dialog.current?.close()}>Abbrechen</button>
          </div>
        </form>
        <hr />
        <p className="small"><b>Klassencode</b> <code>{klasse.code}</code> – ist er in falsche Hände geraten, erzeugt einen neuen.</p>
        <button className="btn sec klein" data-aktion="neuer-code" onClick={neuerCode}>🔄 Neuer Klassencode</button>
        <p className="small" style={{ marginTop: 16 }}><b>Löschen</b> – z. B. am Ende des Schuljahres.</p>
        <div className="zeile">
          <button className="btn ghost klein" data-aktion="klasse-loeschen" onClick={() => loeschen(false)}>Klasse löschen</button>
          {klasse.lernende > 0 && <button className="btn rot klein" data-aktion="klasse-konten-loeschen" onClick={() => loeschen(true)}>Klasse samt {klasse.lernende === 1 ? 'einem Konto' : `${klasse.lernende} Konten`} löschen</button>}
        </div>
        {meldung && <div className="meldung fehler" role="alert">{meldung}</div>}
      </dialog>
    </>
  );
}
