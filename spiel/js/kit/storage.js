/* OSI-Agenten – Spielstand: Kodierung, Prüfsumme, lokales Speichern, Export/Import.
   Wird vom Spiel, von der Einsatzzentrale und von den Werkzeugen (auch unter Node) genutzt. */
(function () {
  'use strict';

  const FORMAT = 'OSIAGENT1';
  const SALT = 'E7|kalle-macht-immer-pause|F&O';
  const LS_KEY = 'osiagenten.spielstand';

  // cyrb53 – schneller, nicht-kryptografischer Hash (reicht, um Manipulation zu erkennen)
  function hash(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function toB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function fromB64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encode(save) {
    const payload = toB64(JSON.stringify(save));
    return FORMAT + '.' + payload + '.' + hash(SALT + payload);
  }

  // Liefert {ok, save, fehler}
  function decode(text) {
    try {
      const parts = String(text).trim().split('.');
      if (parts.length !== 3 || parts[0] !== FORMAT) return { ok: false, fehler: 'Das ist keine OSI-Agenten-Spielstand-Datei.' };
      if (hash(SALT + parts[1]) !== parts[2]) return { ok: false, fehler: 'Die Prüfsumme stimmt nicht – die Datei wurde verändert oder ist beschädigt.' };
      const save = JSON.parse(fromB64(parts[1]));
      return { ok: true, save: migrate(save) };
    } catch (e) {
      return { ok: false, fehler: 'Die Datei konnte nicht gelesen werden.' };
    }
  }

  // Figuren a01 … a15. Fehlt die Wahl (Spielstände vor 2.0), gibt es eine feste Figur aus der Spielstand-ID –
  // so sehen Spiel und Einsatzzentrale für dieselbe Datei immer dieselbe Figur.
  const AVATARE = 15;
  const avatarId = n => 'a' + String(n + 1).padStart(2, '0');
  function avatarFuer(seed) { return avatarId(parseInt(hash(String(seed)).slice(-6), 36) % AVATARE); }
  function avatarGueltig(id) { return /^a\d\d$/.test(id) && +id.slice(1) >= 1 && +id.slice(1) <= AVATARE; }

  // Ältere Spielstände auf das aktuelle Schema bringen (IDs bleiben stabil).
  function migrate(s) {
    s.schema = s.schema || 1;
    s.items = s.items || {};
    s.steps = s.steps || {};
    s.badges = s.badges || {};
    s.bonus = s.bonus || {};
    s.challenge = s.challenge || { best: 0, runs: 0 };
    s.verhoer = s.verhoer || {};
    s.uebung = s.uebung || {};
    s.unlocked = s.unlocked || {};
    s.board = s.board || {};
    s.duo = s.duo || { codename: 'Duo', agenten: [] };
    if (!avatarGueltig(s.duo.avatar)) s.duo.avatar = avatarFuer(s.id || s.duo.codename);
    return s;
  }

  let lsOk = null;
  function localAvailable() {
    if (lsOk !== null) return lsOk;
    try {
      const k = '__osi_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      lsOk = true;
    } catch (e) { lsOk = false; }
    return lsOk;
  }

  function saveLocal(save) {
    if (!localAvailable()) return false;
    try { localStorage.setItem(LS_KEY, encode(save)); return true; } catch (e) { return false; }
  }
  function loadLocal() {
    if (!localAvailable()) return null;
    try {
      const t = localStorage.getItem(LS_KEY);
      if (!t) return null;
      const r = decode(t);
      return r.ok ? r.save : null;
    } catch (e) { return null; }
  }
  function clearLocal() {
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* egal */ }
  }

  function dateiname(save) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const name = (save.duo && save.duo.codename || 'Duo').replace(/[^A-Za-z0-9ÄÖÜäöüß_-]+/g, '-');
    return `OSI-Agenten_${name}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.osiagent`;
  }

  function download(save) {
    const blob = new Blob([encode(save)], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dateiname(save);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function readFile(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(decode(r.result));
      r.onerror = () => resolve({ ok: false, fehler: 'Die Datei konnte nicht geöffnet werden.' });
      r.readAsText(file);
    });
  }

  // Alle bewertbaren Items aus dem Inhalt (für Fortschritt & Zentrale)
  function alleItems(OSI) {
    const liste = [];
    (OSI.einsaetze || []).forEach(e => {
      (e.steps || []).forEach(st => {
        const add = (id, titel, extra) => liste.push(Object.assign({ id, titel, einsatz: e.id, step: st.id, bonus: !!st.bonus }, extra || {}));
        if (st.fragen) st.fragen.forEach(f => add(f.id, f.frage || f.text || st.titel, { optionen: f.optionen }));
        if (st.items) st.items.forEach(it => add(it.id, (st.titel ? st.titel + ': ' : '') + it.text));
        if (st.aufgaben) st.aufgaben.forEach(a => add(a.id, (st.titel ? st.titel + ': ' : '') + a.text));
        if (st.phasen) st.phasen.forEach(ph => add(ph.id, (st.titel ? st.titel + ': ' : '') + ph.titel, { optionen: ph.optionen && ph.optionen.map(o => o.label), keys: ph.optionen && ph.optionen.map(o => o.key) }));
      });
    });
    return liste;
  }

  window.OSIStore = { encode, decode, migrate, hash, saveLocal, loadLocal, clearLocal, localAvailable, download, readFile, alleItems, dateiname, avatarFuer, avatarGueltig, AVATARE };
})();
