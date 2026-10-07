// Prüft die Inhalte in spiel/content/ ohne Browser (läuft in Sekunden, deshalb zuerst in npm test):
// IDs eindeutig und nicht ausgemustert, Schritt-Typen bekannt, Antworten zeigen auf vorhandene Optionen/Fächer,
// interaktive Schritte vollständig, Challenge-Begriffe gültig und nicht doppelt. Regeln: OSI.pruefen() in spiel/content/api.js.
// Aufruf: node test-inhalte.js   (oder npm run inhalte)
const path = require('path');
const { ROOT } = require('./lib');

function laden() {
  global.window = {};
  const dateien = require(path.join(ROOT, 'spiel/content/inhalte.js'));
  dateien.forEach(d => { const f = path.join(ROOT, 'spiel/content', d); delete require.cache[f]; require(f); });
  return window.OSI;
}

const OSI = laden();
const fehler = OSI.pruefen();

// Die Prüfung selbst prüfen: absichtlich kaputte Inhalte müssen auffallen
const probe = laden();
const e = probe.einsatz('e0');
const erste = e.steps[0];
probe.schritte('e0', [
  { id: erste.id, type: 'lesson', titel: 'x', html: 'x' },
  { id: 'probe-typ', type: 'gibtsnicht' },
  { id: 'probe-quiz', type: 'quiz', titel: 'x', fragen: [{ id: 'probe-f', frage: 'x', optionen: ['a', 'b'], richtig: 2 }] },
  { id: 'probe-ia', type: 'interaktiv', titel: 'x', aufgaben: [] }
]);
probe.challengeBegriffe([{ t: 'Switch', l: 2 }, { t: 'Neu', l: 9 }, { t: 'Port 443', l: 4 }]);
const erwartet = ['Schritt-id „' + erste.id + '“ gibt es schon', 'unbekannter Schritt-Typ', 'richtig zeigt nicht auf', 'braucht eine Funktion start', 'Begriff doppelt', 'Schicht l muss', 'nur einzelne Fachbegriffe'];
const gemeldet = probe.pruefen().join('\n');
erwartet.forEach(t => { if (!gemeldet.includes(t)) fehler.push(`Prüfung erkennt nicht: ${t}`); });
let wirft = false;
try { probe.schritte('e0', [], { nach: 'gibt-es-nicht' }); } catch (err) { wirft = true; }
if (!wirft) fehler.push('OSI.schritte meldet einen unbekannten Anker nicht');

if (fehler.length) { console.log('❌ INHALTE FEHLERHAFT:\n  ' + fehler.join('\n  ')); process.exit(1); }
const schritte = OSI.einsaetze.reduce((n, x) => n + x.steps.length, 0);
console.log(`✅ Inhalte bestanden (${OSI.einsaetze.length} Einsätze, ${schritte} Schritte, ${OSI.challenge.pool.length} Challenge-Begriffe)`);
