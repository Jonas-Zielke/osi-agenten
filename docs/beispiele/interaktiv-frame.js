/* Beispiel für einen interaktiven Schritt (Typ „interaktiv“): Einen Ethernet-Frame aus seinen Teilen zusammensetzen.
   Nicht im Spiel eingebunden – es ist die Vorlage aus docs/inhalte.md und wird von werkzeuge/test-interaktiv.js geprüft.
   Ausprobieren: Datei nach spiel/content/ kopieren und in spiel/content/inhalte.js NACH 'e2.js' eintragen.
   Für echte Inhalte: neue, eigene IDs vergeben (sie stecken danach in den Spielständen und bleiben für immer). */
(function () {
  'use strict';
  const OSI = window.OSI;

  const TEILE = [
    { key: 'ziel', text: 'Ziel-MAC' },
    { key: 'quelle', text: 'Quell-MAC' },
    { key: 'typ', text: 'Typ (z. B. IPv4)' },
    { key: 'daten', text: 'Daten (das IP-Paket)' },
    { key: 'fcs', text: 'FCS (Prüfsumme)' }
  ];
  const NAMEN = Object.fromEntries(TEILE.map(t => [t.key, t.text])); // für die Fehleranalyse in der Einsatzzentrale

  OSI.schritte('e2', [{
    id: 'bsp-frame', type: 'interaktiv', bonus: true,
    titel: 'Werkstatt: Einen Frame bauen',
    intro: `<p>Kalle hat einen Ethernet-Frame in seine Teile zerlegt. Klickt die Teile in der Reihenfolge an, in der sie über die Leitung laufen – von vorne nach hinten.</p>`,

    // Jede Aufgabe zählt einzeln: Punkte, Tipps, Fehlerquote in der Zentrale, Zeile im Lösungs-PDF
    aufgaben: [
      {
        id: 'bsp-frame-bauen', text: 'Die Teile eines Frames in die richtige Reihenfolge bringen', punkte: 15,
        loesung: 'Ziel-MAC → Quell-MAC → Typ → Daten → FCS',
        erklaerung: `Vorne steht der <b>Header</b> (Ziel-MAC, Quell-MAC, Typ), dann die Daten, hinten der <b>Trailer</b> mit der Prüfsumme. ${OSI.L(2)} hat immer beides.`,
        hinweise: ['Der Switch soll so früh wie möglich wissen, wohin der Frame muss.', 'Die Prüfsumme kann erst berechnet werden, wenn alles davor feststeht.'],
        werte: NAMEN
      },
      {
        id: 'bsp-frame-trailer', text: 'Im fertigen Frame den Trailer finden',
        loesung: 'FCS (Prüfsumme)',
        erklaerung: 'Der Trailer ist die FCS am Ende. Mit ihr erkennt der Empfänger, ob unterwegs Bits kaputtgegangen sind.',
        hinweise: ['Trailer heißt „Anhänger“ – er hängt hinten dran.'],
        werte: NAMEN
      }
    ],

    // Eigenes Aussehen: Klassen mit eigenem Präfix (hier bsp-), Farben nur über Tokens, damit Hell und Dunkel passen
    css: `
      .bsp-frame { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 12px; }
      .bsp-feld { font: inherit; font-weight: 800; flex: 1 1 110px; min-height: 52px; display: flex; align-items: center; justify-content: center;
        padding: 8px; text-align: center; border-radius: 12px; border: 2px dashed var(--line); background: var(--surface-2); color: var(--muted); }
      .bsp-feld.gelegt { border: 2px solid var(--L2); background: var(--surface); color: var(--text); font-weight: 800; cursor: pointer; }
      .bsp-feld.gelegt:disabled { cursor: default; }
      .bsp-feld.trailer { border-color: var(--green); background: var(--green-soft); }`,

    // Baut die Interaktion. el: leere Fläche im Schritt, api: alles, was das Spiel dafür bereitstellt (docs/inhalte.md)
    start(el, api) {
      const reihe = api.geloest('bsp-frame-bauen') ? TEILE.map(t => t.key) : [];
      const vorrat = api.mischen(TEILE); // einmal mischen, damit die Teile beim Klicken nicht herumspringen

      const draw = () => {
        const fertig = reihe.length === TEILE.length, trailer = api.geloest('bsp-frame-trailer');
        el.innerHTML = `
          <div class="bsp-frame">${TEILE.map((t, i) => reihe[i]
            ? `<button class="bsp-feld gelegt ${trailer && reihe[i] === 'fcs' ? 'trailer' : ''}" data-k="${reihe[i]}" ${fertig && !trailer ? '' : 'disabled'}>${api.esc(NAMEN[reihe[i]])}</button>`
            : `<span class="bsp-feld">${i + 1}</span>`).join('')}</div>
          ${!fertig ? `<div class="pool">${vorrat.filter(t => !reihe.includes(t.key)).map(t => `<button class="chip" data-k="${t.key}">${api.esc(t.text)}</button>`).join('')}</div>`
            : !trailer ? '<p class="hinweiszeile">👆 Und jetzt: Welcher Teil ist der <b>Trailer</b>? Klickt ihn im Frame an.</p>' : ''}`;

        api.$$('.pool .chip').forEach(b => b.onclick = () => {
          const soll = TEILE[reihe.length].key;
          if (b.dataset.k !== soll) return api.falsch('bsp-frame-bauen', b.dataset.k, `„${NAMEN[b.dataset.k]}“ ist noch nicht an der Reihe.`, { el: b });
          reihe.push(soll);
          api.ton('klick');
          draw();
          if (reihe.length === TEILE.length) { api.richtig('bsp-frame-bauen', { el: api.$('.bsp-frame') }); api.tipps('bsp-frame-trailer'); }
        });
        api.$$('.bsp-feld.gelegt:not(:disabled)').forEach(b => b.onclick = () => {
          if (b.dataset.k !== 'fcs') return api.falsch('bsp-frame-trailer', b.dataset.k, `„${NAMEN[b.dataset.k]}“ gehört nicht zum Trailer.`, { el: b });
          api.richtig('bsp-frame-trailer', { el: b });
          draw();
        });
      };
      draw();
    },

    // Nur für den automatischen Test (npm test): löst alles auf dem richtigen Weg
    loesen(el) {
      TEILE.forEach(t => el.querySelector(`.pool .chip[data-k="${t.key}"]`).click());
      el.querySelector('.bsp-feld[data-k="fcs"]').click();
    }
  }]);
})();
