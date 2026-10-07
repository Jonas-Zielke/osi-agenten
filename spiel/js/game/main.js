/* OSI-Agenten – Start und Router: Start | Karte | Schritt. Dazu die Tastatur (Lehrkraft-Kürzel, Ziffern/Enter in Aufgaben). */
(function () {
  'use strict';
  const G = window.OSIGame, S = window.OSIStore;

  function render() {
    G.tasten = null;
    if (!G.save) { G.renderStart(); return; }
    const p = G.aktuellePosition();
    if (p) G.renderStepView(p.e, p.st);
    else G.renderHub();
  }
  G.render = render;

  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey && ev.altKey && (ev.key === 'l' || ev.key === 'L')) { ev.preventDefault(); if (G.save) G.lehrkraft(); return; }
    if (!G.tasten || ev.ctrlKey || ev.altKey || ev.metaKey || document.getElementById('modal')) return;
    // In Eingabefeldern (Terminal, Filter, Freitext) und auf fokussierten Knöpfen gilt die normale Tastatur
    const t = ev.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
    if (ev.key === 'Enter' && t.closest && t.closest('button, a, summary')) return;
    G.tasten(ev);
  });

  window.addEventListener('DOMContentLoaded', () => {
    G.lokalOk = S.localAvailable();
    // Hilfe beim Schreiben von Inhalten: Fehler in spiel/content/ stehen sofort in der Browser-Konsole (F12)
    const inhaltsfehler = window.OSI.pruefen ? window.OSI.pruefen() : [];
    if (inhaltsfehler.length) console.error('OSI-Agenten – Fehler in den Inhalten:\n  ' + inhaltsfehler.join('\n  '));
    if (G.online) G.online.start(); // Online-Fassung: Konto und Spielstand kommen vom Server
    else G.renderStart();
  });
})();
