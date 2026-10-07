/* OSI-Agenten – Schritt-Typ „interaktiv“: eigene Interaktionen direkt aus den Inhalten (Klick-Bilder, Puzzles, kleine
   Simulationen …). Der Inhalt liefert start(el, api) und baut in el seine Oberfläche. Punkte, Kalle-Tipps, Feedback-Leiste,
   Übungsmodus, Speichern und „Weiter“ übernimmt das Spiel über api. Anleitung und Beispiel: docs/inhalte.md */
(function () {
  'use strict';
  const G = window.OSIGame, A = window.OSIAudio, Kit = window.OSIKit, OSI = window.OSI;
  const B = G.bausteine, R = G.renderer;
  const { esc, $, $$, shuffle, layerColor } = Kit.util;
  let aktiv = null; // { st, el, api } des gerade gezeigten Schritts (für den automatischen Test)

  R.interaktiv = (box, st, e, ctx) => {
    // st.css: eigenes Aussehen der Interaktion (Klassen mit eigenem Präfix, Farben nur über var(--…) aus tokens.css)
    box.innerHTML = `${st.css ? `<style>${st.css}</style>` : ''}<div class="card aufgabe interaktiv">
      <div class="task-head"><h2>${esc(st.titel || '')}</h2><span class="task-count" id="ia-zahl"></span></div>
      <div class="task-punkte" id="ia-punkte"></div>
      ${st.intro ? `<div class="intro">${st.intro}</div>` : ''}
      <div class="ia-buehne" id="ia-buehne"></div>
      <div id="ia-tipps"></div><div id="ia-rueck"></div></div>`;
    B.bindEggs(box);
    const buehne = $('#ia-buehne', box), rueck = $('#ia-rueck', box), tippsEl = $('#ia-tipps', box);
    const aufgabe = id => {
      const a = st.aufgaben.find(x => x.id === id);
      if (!a) throw new Error(`Interaktiver Schritt ${st.id}: Aufgabe „${id}“ steht nicht in aufgaben`);
      return a;
    };
    const geloest = id => G.itemState(aufgabe(id).id).ok;
    const alleGeloest = () => st.aufgaben.every(a => G.itemState(a.id).ok);
    let tippFuer = null, fertigGemeldet = false;

    // Fortschrittspunkte oben und Kalle-Tipps für die erste offene Aufgabe (oder die mit api.tipps gewählte)
    const anzeigen = () => {
      const n = st.aufgaben.filter(a => G.itemState(a.id).ok).length;
      $('#ia-zahl', box).textContent = st.aufgaben.length > 1 ? `${n} / ${st.aufgaben.length}` : '';
      $('#ia-punkte', box).innerHTML = st.aufgaben.length > 1 ? st.aufgaben.map(a => `<i class="${G.itemState(a.id).ok ? 'ok' : ''}"></i>`).join('') : '';
      const a = (tippFuer && !geloest(tippFuer) && aufgabe(tippFuer)) || st.aufgaben.find(x => !G.itemState(x.id).ok);
      tippsEl.innerHTML = '';
      if (a && a.hinweise && a.hinweise.length) B.hinweisBlock(a, tippsEl);
    };
    const abschluss = fb => {
      if (fertigGemeldet) return;
      fertigGemeldet = true;
      ctx.fertig();
      if (fb) B.knopf(fb, 'st-weiter', 'Weiter', ctx.weiter);
      else { rueck.insertAdjacentHTML('beforeend', B.weiterButton()); $('#st-weiter', rueck).onclick = ctx.weiter; }
      B.tasten(box, { enter: '#st-weiter' });
    };

    const api = {
      el: buehne,
      uebung: !!G.uebung,           // „Nochmal üben“: alle Aufgaben starten offen, es gibt keine Punkte
      erledigt: ctx.done,           // Schritt schon einmal abgeschlossen
      geloest,                      // api.geloest('id') → true/false
      versuche: id => G.itemState(aufgabe(id).id).f,
      // Richtige Lösung einer Aufgabe: Punkte (1. Versuch voll, dann weniger), grüne Leiste mit Erklärung
      richtig(id, opt = {}) {
        const a = aufgabe(id);
        if (G.itemState(a.id).ok) return 0;
        const p = G.richtig(a.id, a.punkte || 10, opt.el || buehne);
        if (opt.el) Kit.fx.anstoss(opt.el, 'pop');
        const fb = B.feedback(rueck, true, opt.text != null ? opt.text : a.erklaerung, p);
        anzeigen();
        if (alleGeloest()) abschluss(fb); else G.zeige(fb);
        return p;
      },
      // Falscher Versuch: zählt als Fehlversuch (weniger Punkte), rote Leiste. wert landet in der Fehleranalyse der Zentrale.
      falsch(id, wert, text, opt = {}) {
        const a = aufgabe(id);
        if (G.itemState(a.id).ok) return;
        G.falsch(a.id, wert);
        if (opt.el) Kit.fx.anstoss(opt.el, 'shake');
        G.zeige(B.feedback(rueck, false, text || (a.falsch && wert != null && a.falsch[wert]) || 'Das stimmt noch nicht. Schaut genau hin – oder fragt Kalle nach einem Tipp.'));
      },
      // Neutraler Hinweis ohne Wertung (z. B. „Erst etwas auswählen“)
      hinweis(html, titel) { G.zeige(B.feedback(rueck, 'neutral', html, 0, titel || 'Hinweis')); },
      tipps(id) { tippFuer = id; anzeigen(); },  // Kalle-Tipps einer bestimmten Aufgabe anzeigen
      ton: name => A.play(name),                  // klick, richtig, falsch, tipp …
      fx: { pop: el => Kit.fx.anstoss(el, 'pop'), wackeln: el => Kit.fx.anstoss(el, 'shake'), konfetti: n => Kit.fx.konfetti(n || 40) },
      tasten(fn) { G.tasten = ev => { if (buehne.isConnected) fn(ev); }; }, // eigene Tastatur (Ziffern, Pfeile …)
      esc, L: OSI.L, mischen: shuffle, schichtFarbe: layerColor, $: sel => $(sel, buehne), $$: sel => $$(sel, buehne)
    };

    anzeigen();
    try {
      st.start(buehne, api);
    } catch (err) {
      console.error(`Interaktiver Schritt ${st.id}:`, err);
      buehne.innerHTML = `<div class="merk"><b>Dieser Schritt hat einen Fehler.</b> Bitte der Lehrkraft Bescheid geben. <span class="small muted">(${esc(err.message)})</span></div>`;
    }
    aktiv = { st, el: buehne, api };
    if (alleGeloest()) abschluss(null);
  };

  // Für werkzeuge/test-durchlauf.js: löst den gerade gezeigten interaktiven Schritt über seine loesen-Funktion
  G.interaktiv = { loesen() { if (!aktiv || !aktiv.el.isConnected) throw new Error('Kein interaktiver Schritt offen'); aktiv.st.loesen(aktiv.el, aktiv.api); } };
})();
