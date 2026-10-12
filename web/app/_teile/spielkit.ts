'use client';
// Lädt Inhalte und Baukasten des Spiels nach (wie die Einsatzzentrale), damit der Admin Spielstände mit DENSELBEN Funktionen
// liest, kodiert und auswertet wie das Spiel: .osiagent-Dateien (OSIStore) und Kennzahlen (OSIKit.progress).
export type Spielstand = Record<string, unknown> & { duo: { codename: string; avatar: string } };
export type Kennzahlen = { codename: string; avatar: string; punkte: number; front: string | null; fall: number };
type Store = {
  decode: (text: string) => { ok: boolean; save?: Spielstand; fehler?: string };
  migrate: (s: unknown) => Spielstand;
  download: (s: unknown) => void;
};
export type SpielKit = { store: Store; kennzahlen: (s: Spielstand) => Kennzahlen };

const skript = (src: string) => new Promise<void>((ok, fehler) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = () => ok();
  s.onerror = () => fehler(new Error(`${src} konnte nicht geladen werden.`));
  document.head.appendChild(s);
});

let laden: Promise<SpielKit> | null = null;
export function spielKit(): Promise<SpielKit> {
  laden ??= (async () => {
    const dateien: string[] = await (await fetch('/spiel/content/inhalte.json')).json();
    // nacheinander: progress.js liest window.OSI schon beim Laden
    for (const src of [...dateien.map(d => `/spiel/content/${d}`), '/spiel/js/kit/storage.js', '/spiel/js/kit/util.js', '/spiel/js/kit/progress.js']) await skript(src);
    const w = window as unknown as { OSIStore: Store; OSIKit: { progress: { kennzahlen: (s: Spielstand) => Kennzahlen } } };
    return { store: w.OSIStore, kennzahlen: w.OSIKit.progress.kennzahlen };
  })().catch(e => { laden = null; throw e; });
  return laden;
}

// Datei lesen: .osiagent (mit Prüfsumme) oder JSON – ein reiner Spielstand oder { daten } wie aus dem Admin-Export
export async function spielstandAusDatei(datei: File): Promise<{ save: Spielstand; meta: Kennzahlen } | { fehler: string }> {
  const k = await spielKit();
  const text = await datei.text();
  let roh: unknown;
  if (text.trim().startsWith('OSIAGENT')) {
    const r = k.store.decode(text);
    if (!r.ok) return { fehler: r.fehler || 'Die Datei konnte nicht gelesen werden.' };
    roh = r.save;
  } else {
    try { roh = JSON.parse(text); } catch { return { fehler: 'Weder eine .osiagent-Datei noch JSON.' }; }
    const o = roh as { daten?: unknown };
    if (o && typeof o === 'object' && o.daten && typeof o.daten === 'object') roh = o.daten;
  }
  const r = roh as Record<string, unknown> | null;
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.duo) return { fehler: 'Das sieht nicht wie ein Spielstand aus.' };
  const save = k.store.migrate(r);
  return { save, meta: k.kennzahlen(save) };
}

export function alsDatei(name: string, inhalt: string, typ = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
