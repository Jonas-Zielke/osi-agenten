// Holt das Spiel (../spiel) und die Einsatzzentrale (../lehrkraft) in public/ – vor dev und build.
// Das Spiel bleibt dabei unverändert; nur die Online-Fassung bekommt js/online/sync.js (vor js/game/main.js)
// und die Zentrale zentrale-online.js. So gibt es EINEN Spielcode für Lite (Datei/ZIP/Pages) und Online.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const web = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.join(web, '..');
const ziel = name => path.join(web, 'public', name);

function ersetze(datei, alt, neu) {
  const s = fs.readFileSync(datei, 'utf8');
  if (!s.includes(alt)) throw new Error(`${path.relative(web, datei)}: „${alt}“ nicht gefunden`);
  fs.writeFileSync(datei, s.split(alt).join(neu));
}

// Spiel
fs.rmSync(ziel('spiel'), { recursive: true, force: true });
fs.cpSync(path.join(repo, 'spiel'), ziel('spiel'), { recursive: true });
ersetze(path.join(ziel('spiel'), 'index.html'), '<script src="js/game/main.js"></script>', '<script src="js/online/sync.js"></script>\n  <script src="js/game/main.js"></script>');
// Liste der Inhaltsdateien als JSON: Der Admin-Bereich lädt damit die Inhalte nach (app/_teile/spielkit.ts) – inhalte.js selbst
// fügt sie per document.write ein, und das geht nur beim ersten Laden einer Seite
const inhalte = createRequire(import.meta.url)(path.join(repo, 'spiel', 'content', 'inhalte.js'));
fs.writeFileSync(path.join(ziel('spiel'), 'content', 'inhalte.json'), JSON.stringify(inhalte));

// Einsatzzentrale + PDFs für Lehrkräfte
fs.rmSync(ziel('lehrkraft'), { recursive: true, force: true });
fs.mkdirSync(ziel('lehrkraft'), { recursive: true });
for (const f of fs.readdirSync(path.join(repo, 'lehrkraft'))) {
  if (/^(einsatzzentrale\.html|zentrale(-online)?\.(js|css)|.*\.pdf)$/.test(f)) fs.copyFileSync(path.join(repo, 'lehrkraft', f), path.join(ziel('lehrkraft'), f));
}
const zentrale = path.join(ziel('lehrkraft'), 'einsatzzentrale.html');
ersetze(zentrale, '../spiel/', '/spiel/');
ersetze(zentrale, '<script src="zentrale.js"></script>', '<script src="zentrale.js"></script>\n<script src="zentrale-online.js"></script>');
console.log('✅ Spiel und Einsatzzentrale nach public/ kopiert (Online-Fassung)');
