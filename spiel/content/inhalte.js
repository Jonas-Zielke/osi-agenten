/* OSI-Agenten – Inhaltsverzeichnis: Diese Dateien aus spiel/content/ lädt das Spiel, in dieser Reihenfolge.
   Neue Inhaltsdatei? Hier eintragen – fertig. Spiel, Einsatzzentrale, Lösungs-PDF und Tests lesen alle diese Liste.
   Ohne fetch und ohne Module (läuft auch per Doppelklick über file://): Die Dateien werden beim Laden der Seite
   per document.write als normale <script>-Tags eingefügt und damit garantiert vor dem Spielcode ausgeführt.
   Anleitung: docs/inhalte.md */
(function () {
  var DATEIEN = [
    'meta.js',    // Stammdaten: Figuren, Ränge, Abzeichen, Challenge, Einsatzliste, Netz von F&O
    'api.js',     // Helfer für Inhaltsdateien (OSI.einsatz, OSI.schritte, OSI.challengeBegriffe, OSI.L …)
    'e0.js', 'e1.js', 'e2.js', 'e3.js', 'e4.js', 'e5.js', 'e6.js',
    'verhoer.js'
  ];
  if (typeof document === 'undefined') { module.exports = DATEIEN; return; } // Node (Werkzeuge)
  var basis = document.currentScript.src.replace(/[^/]*$/, '');
  for (var i = 0; i < DATEIEN.length; i++) document.write('<script src="' + basis + DATEIEN[i] + '"><\/script>');
})();
