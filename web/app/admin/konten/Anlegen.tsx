'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZUGAENGE } from '@/lib/zugang';
import { meldungVon, senden } from '../../_teile/api';

// Konto direkt anlegen – z. B. für Lernende ohne Klassencode oder eine weitere Lehrkraft
export function KontoAnlegen({ klassen }: { klassen: { id: string; name: string; lehrkraft: string }[] }) {
  const router = useRouter();
  const [fehler, setFehler] = useState('');
  const [neu, setNeu] = useState<{ id: string; name: string; passwort: string | null } | null>(null);
  async function los(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget, f = new FormData(form);
    const r = await senden('/api/admin/konten', 'POST', { benutzername: f.get('benutzername'), rolle: f.get('rolle'), klasse: f.get('klasse'), passwort: f.get('passwort') });
    if (!r.ok) { setFehler(meldungVon(r.daten)); return; }
    setFehler(''); form.reset();
    setNeu({ id: String(r.daten.id), name: String(r.daten.benutzername), passwort: r.daten.passwort ? String(r.daten.passwort) : null });
    router.refresh();
  }
  return (
    <form className="card formular" id="neu" onSubmit={los}>
      <h3>＋ Konto anlegen</h3>
      <div className="feld2">
        <div><label htmlFor="neu-name">Benutzername</label><input type="text" id="neu-name" name="benutzername" required minLength={3} maxLength={24} autoComplete="off" /></div>
        <div><label htmlFor="neu-pw">Passwort (leer lassen: Startpasswort)</label><input type="text" id="neu-pw" name="passwort" minLength={8} maxLength={128} autoComplete="off" /></div>
        <div><label htmlFor="neu-rolle">Rolle</label>
          <select id="neu-rolle" name="rolle" defaultValue="lernend">{ZUGAENGE.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
        <div><label htmlFor="neu-klasse">Klasse</label>
          <select id="neu-klasse" name="klasse" defaultValue=""><option value="">keine</option>{klassen.map(k => <option key={k.id} value={k.id}>{k.name} ({k.lehrkraft})</option>)}</select></div>
      </div>
      {fehler && <div className="meldung fehler" role="alert">{fehler}</div>}
      {neu && <div className="meldung ok" role="status">Konto <Link href={`/admin/konten/${neu.id}`}>{neu.name}</Link> angelegt.
        {neu.passwort && <> Startpasswort: <span className="passwort-neu" data-passwort>{neu.passwort}</span></>}</div>}
      <div className="btnrow"><button className="btn" id="konto-neu">＋ Anlegen</button></div>
    </form>
  );
}
