/* OSI-Agenten – Helfer für Inhaltsdateien. Läuft nach meta.js und vor den Einsätzen (Reihenfolge: content/inhalte.js).
   Ohne Abhängigkeit vom Spielcode, damit auch Einsatzzentrale, Lösungs-PDF und Werkzeuge (Node) die Inhalte laden können.
   Anleitung mit Beispielen: docs/inhalte.md */
(function () {
  'use strict';
  const OSI = window.OSI;

  // Alle Schritt-Typen, die das Spiel darstellen kann (Renderer in spiel/js/steps/)
  OSI.SCHRITT_TYPEN = ['story', 'lesson', 'quiz', 'sort', 'kapsel', 'sealed', 'ende', 'anklage', 'verhoer', 'urkunde', 'interaktiv'];

  // Schicht-Etikett für Texte: ${OSI.L(3)}
  OSI.L = n => `<span class="lchip" style="background:var(--L${n})">L${n}</span>`;

  // Einsatz aus meta.js holen (mit klarer Meldung bei Tippfehlern)
  OSI.einsatz = id => {
    const e = OSI.einsaetze.find(x => x.id === id);
    if (!e) throw new Error(`Einsatz „${id}“ steht nicht in OSI.einsaetze (spiel/content/meta.js).`);
    return e;
  };

  // Schritte zu einem Einsatz hinzufügen – am Ende oder an einer bestimmten Stelle:
  //   OSI.schritte('e2', [ … ])                       hängt an
  //   OSI.schritte('e2', [ … ], { nach: 'e2-arp' })   fügt hinter einem Schritt ein ({ vor: … } davor)
  // Zusatzdateien in inhalte.js NACH der Datei des Einsatzes eintragen (eN.js legt die Grundliste an).
  OSI.schritte = (eid, steps, opt = {}) => {
    const e = OSI.einsatz(eid);
    const anker = opt.nach || opt.vor;
    let pos = e.steps.length;
    if (anker) {
      const i = e.steps.findIndex(s => s.id === anker);
      if (i < 0) throw new Error(`OSI.schritte('${eid}'): Schritt „${anker}“ gibt es in diesem Einsatz nicht.`);
      pos = opt.nach ? i + 1 : i;
    }
    e.steps.splice(pos, 0, ...steps);
    return e;
  };

  // Zusätzliche Begriffe für die Zeit-Challenge: OSI.challengeBegriffe([{ t: 'Begriff', l: 3 }, …])
  OSI.challengeBegriffe = liste => { OSI.challenge.pool.push(...liste); };

  // ---------------------------------------------------------------- Prüfung
  // Findet typische Fehler beim Schreiben von Inhalten. Liefert eine Liste von Meldungen (leer = alles gut).
  // Läuft in npm test (werkzeuge/test-inhalte.js) und beim Start des Spiels (Meldungen in der Browser-Konsole).
  OSI.pruefen = () => {
    const fehler = [];
    const melde = (wo, text) => fehler.push(`${wo}: ${text}`);
    const aus = new Set(OSI.ausgemustert || []);
    const stepIds = new Map(), itemIds = new Map();
    const merke = (map, id, wo, art) => {
      if (typeof id !== 'string' || !id) return melde(wo, `${art} ohne gültige id`);
      if (map.has(id)) melde(wo, `${art}-id „${id}“ gibt es schon (${map.get(id)})`);
      if (aus.has(id)) melde(wo, `${art}-id „${id}“ ist ausgemustert und darf nicht wiederverwendet werden`);
      map.set(id, wo);
    };
    const istIndex = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
    const schicht = v => [].concat(v).every(x => Number.isInteger(+x) && +x >= 1 && +x <= 7);

    const eIds = new Set();
    OSI.einsaetze.forEach(e => {
      if (eIds.has(e.id)) melde(e.id, 'Einsatz-id doppelt');
      eIds.add(e.id);
      ['nrText', 'titel', 'farbe', 'icon'].forEach(f => { if (!e[f]) melde(e.id, `Einsatz ohne „${f}“`); });
      (e.steps || []).forEach(st => {
        const wo = `${e.id} › ${st.id || '?'}`;
        merke(stepIds, st.id, wo, 'Schritt');
        if (!OSI.SCHRITT_TYPEN.includes(st.type)) return melde(wo, `unbekannter Schritt-Typ „${st.type}“ (erlaubt: ${OSI.SCHRITT_TYPEN.join(', ')})`);
        if (st.type === 'story') {
          if (!Array.isArray(st.szenen) || !st.szenen.length) melde(wo, 'story braucht szenen');
          else st.szenen.forEach((sz, i) => { if (!OSI.figuren[sz.wer]) melde(wo, `Szene ${i + 1}: Figur „${sz.wer}“ gibt es nicht in OSI.figuren`); });
        }
        if (st.type === 'lesson' && (!st.titel || !st.html)) melde(wo, 'lesson braucht titel und html');
        if (st.type === 'quiz' || st.type === 'anklage') {
          if (!Array.isArray(st.fragen) || !st.fragen.length) melde(wo, `${st.type} braucht fragen`);
          (st.fragen || []).forEach(q => {
            const qwo = `${wo} › ${q.id}`;
            merke(itemIds, q.id, qwo, 'Aufgabe');
            if (q.richtig == null) return melde(qwo, 'Frage ohne „richtig“');
            if (q.layer && !schicht(q.richtig)) melde(qwo, 'layer-Frage: richtig muss 1–7 sein');
            const auswahl = q.optionen && !q.layer && !q.eingabe && !q.pick && !q.meldung;
            if (auswahl && ![].concat(q.richtig).every(i => istIndex(i, q.optionen.length))) melde(qwo, `richtig zeigt nicht auf eine der ${q.optionen.length} Optionen (Zählung ab 0)`);
            if (q.multi && !Array.isArray(q.richtig)) melde(qwo, 'multi-Frage: richtig muss eine Liste sein');
            if (!auswahl && !q.layer && !q.eingabe && !q.pick && !q.meldung) melde(qwo, 'Frage ohne Antwortart (optionen, layer, eingabe, pick oder meldung)');
          });
        }
        if (st.type === 'sort') {
          const bins = new Set((st.bins || []).map(b => String(b.id)));
          if (!bins.size) melde(wo, 'sort braucht bins');
          (st.items || []).forEach(it => {
            merke(itemIds, it.id, `${wo} › ${it.id}`, 'Aufgabe');
            if (![].concat(it.ziel).every(z => bins.has(String(z)))) melde(`${wo} › ${it.id}`, `ziel „${it.ziel}“ ist kein Fach (bins)`);
          });
        }
        if (st.type === 'kapsel') (st.phasen || []).forEach(ph => {
          merke(itemIds, ph.id, `${wo} › ${ph.id}`, 'Aufgabe');
          const keys = new Set((ph.optionen || []).map(o => o.key));
          if (!(ph.korrekt || []).every(k => keys.has(k))) melde(`${wo} › ${ph.id}`, 'korrekt enthält Schlüssel, die es in optionen nicht gibt');
        });
        if (st.type === 'verhoer') (st.verhoerFragen || []).forEach(q => merke(itemIds, q.id, `${wo} › ${q.id}`, 'Verhörfrage'));
        if (st.type === 'interaktiv') {
          if (typeof st.start !== 'function') melde(wo, 'interaktiv braucht eine Funktion start(el, api)');
          if (typeof st.loesen !== 'function') melde(wo, 'interaktiv braucht eine Funktion loesen(el, api) für den automatischen Test');
          if (!Array.isArray(st.aufgaben) || !st.aufgaben.length) melde(wo, 'interaktiv braucht aufgaben (je { id, text })');
          (st.aufgaben || []).forEach(a => { merke(itemIds, a.id, `${wo} › ${a.id}`, 'Aufgabe'); if (!a.text) melde(`${wo} › ${a.id}`, 'Aufgabe ohne text (erscheint in Zentrale und Lösungs-PDF)'); });
        }
      });
    });

    const C = OSI.challenge, begriffe = new Map();
    (C.pool || []).forEach((b, i) => {
      const wo = `Challenge › ${b && b.t ? b.t : 'Eintrag ' + (i + 1)}`;
      if (!b || typeof b.t !== 'string' || !b.t.trim()) return melde(wo, 'Begriff ohne Text (t)');
      if (b.t.length > 30) melde(wo, 'Begriff zu lang (höchstens 30 Zeichen, sonst ist er in Sekunden nicht lesbar)');
      if (!Number.isInteger(b.l) || b.l < 1 || b.l > 7) melde(wo, 'Schicht l muss eine Zahl von 1 bis 7 sein');
      const k = b.t.trim().toLowerCase();
      if (begriffe.has(k)) melde(wo, 'Begriff doppelt');
      begriffe.set(k, true);
    });
    if (C.freiNach && !stepIds.has(C.freiNach) && !itemIds.has(C.freiNach)) melde('Challenge', `freiNach zeigt auf keinen Schritt und keine Aufgabe: ${C.freiNach}`);
    return fehler;
  };
})();
