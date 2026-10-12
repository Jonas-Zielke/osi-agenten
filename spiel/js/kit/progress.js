/* OSI-Agenten – Fortschritt, Punkte und Ränge als reine Funktionen über (Inhalt, Spielstand).
   Spiel, Karte und Einsatzzentrale rechnen damit identisch. */
(function () {
  'use strict';
  const Kit = window.OSIKit = window.OSIKit || {};
  const OSI = window.OSI;

  const einsatz = id => OSI.einsaetze.find(e => e.id === id);
  // Freigegeben = hat Inhalt und ist nicht mehr „in Bearbeitung“ (die Lehrkraft sieht auch Akten in Bearbeitung mit Inhalt)
  const freigegeben = (e, teacher) => e.steps.length > 0 && (teacher || e.status !== 'bearbeitung');
  const sichtbar = teacher => OSI.einsaetze.filter(e => freigegeben(e, teacher));
  const pflicht = e => e.steps.filter(s => !s.bonus);

  const stepDone = (save, st) => !!(save.steps && save.steps[st.id]);
  const einsatzFertig = (save, e) => e.steps.length > 0 && pflicht(e).every(st => stepDone(save, st));
  function einsatzFortschritt(save, e) {
    const req = pflicht(e);
    return req.length ? req.filter(st => stepDone(save, st)).length / req.length : 0;
  }

  function einsatzOffen(save, e, teacher) {
    if (!freigegeben(e, teacher)) return false;
    if (teacher) return true;
    if (save.unlocked && save.unlocked[e.id]) return true; // z. B. Verhör vorzeitig durch die Lehrkraft freigegeben
    const i = OSI.einsaetze.indexOf(e);
    return i === 0 || einsatzFertig(save, OSI.einsaetze[i - 1]);
  }
  function stepOffen(save, e, idx, teacher) {
    if (teacher) return true;
    if (!einsatzOffen(save, e, teacher)) return false;
    for (let i = 0; i < idx; i++) if (!e.steps[i].bonus && !stepDone(save, e.steps[i])) return false;
    return true;
  }

  // Fall-Fortschritt ohne Diagnose-Akten (Abschlussverhör): Mittel über alle Akten des Falls
  function fallFortschritt(save) {
    const fall = OSI.einsaetze.filter(e => !e.diagnose && e.steps.length);
    return fall.length ? fall.reduce((a, e) => a + einsatzFortschritt(save, e), 0) / fall.length : 0;
  }

  // Die „Front“: erster noch offener Pflicht-Schritt in Spielreihenfolge – dort steht die Figur auf der Karte.
  function front(save) {
    for (const e of sichtbar(false)) {
      const st = pflicht(e).find(s => !stepDone(save, s));
      if (st) return { e, st };
    }
    return null;
  }

  function punkte(save) {
    let p = 0;
    Object.values(save.items || {}).forEach(it => { p += it.p || 0; });
    Object.values(save.bonus || {}).forEach(v => { p += v || 0; });
    return p;
  }
  function rang(p) {
    let i = 0;
    OSI.raenge.forEach((r, j) => { if (p >= r.ab) i = j; });
    const r = OSI.raenge[i], next = OSI.raenge[i + 1] || null;
    return { r, next, stufe: i + 1, anteil: next ? (p - r.ab) / (next.ab - r.ab) : 1 };
  }
  const geloest = save => Object.values(save.items || {}).filter(i => i.ok).length;

  // Schritte, die heute erledigt wurden (für die Tages-Flamme)
  function heute(save) {
    const t = new Date().toDateString();
    return Object.values(save.steps || {}).filter(iso => new Date(iso).toDateString() === t).length;
  }

  // Einsatz zu einer Schritt-ID (z. B. die „Front“ aus der Online-Rangliste)
  let schrittIndex = null;
  function einsatzVonStep(id) {
    if (!schrittIndex) { schrittIndex = {}; OSI.einsaetze.forEach(e => e.steps.forEach(st => { schrittIndex[st.id] = e; })); }
    return schrittIndex[id] || null;
  }

  // Kennzahlen, die die Online-Fassung neben dem Spielstand speichert (Rangliste, Live-Zentrale, Admin)
  function kennzahlen(save) {
    const f = front(save);
    return { codename: save.duo.codename, avatar: save.duo.avatar, punkte: punkte(save), front: f ? f.st.id : null, fall: fallFortschritt(save) };
  }

  Kit.progress = { einsatzVonStep, einsatz, freigegeben, sichtbar, pflicht, stepDone, einsatzFertig, einsatzFortschritt, einsatzOffen, stepOffen, fallFortschritt, front, punkte, rang, geloest, heute, kennzahlen };
})();
