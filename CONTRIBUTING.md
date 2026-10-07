# Mitmachen

Schön, dass du das Spiel verbessern oder anpassen möchtest! Für kleine Korrekturen genügt ein Issue. Bei größeren Änderungen bitte erst ein Issue mit der Idee eröffnen, dann einen Pull Request.

Diese Datei ist die verbindliche Grundlage für alle Beiträge, von Menschen wie von KI-Assistenten. Die inhaltlichen und didaktischen Vorgaben (Fall, Figuren, Netzdaten, Spielmechanik) stehen in [`DESIGN.md`](DESIGN.md). Vor inhaltlicher Arbeit bitte lesen.

## Grundregeln
**Spielstände**
- **IDs von Schritten und Aufgaben nie ändern oder wiederverwenden.** Sie stecken in den Spielständen der Lernenden. Texte dürfen geändert, Aufgaben zwischen Schritten verschoben und neue IDs ergänzt werden. Gestrichene IDs kommen in `OSI.ausgemustert` (`spiel/content/meta.js`).
- Jede Änderung muss bestehende Spielstände weiter laden können.

**Technik**
- Das Spiel (`spiel/`) muss offline per Doppelklick (`file://`) in jedem Browser laufen: kein `fetch`, keine CDNs, keine Frameworks. Inhalte werden per `<script src>` geladen. Einzige Ausnahme ist `spiel/js/online/sync.js`: Es wird nur in der Online-Fassung geladen und nie von `spiel/index.html`.
- Die Online-Fassung (`web/`) ist eine Next.js-App und darf npm-Pakete nutzen. Sie verändert das Spiel nicht, sondern kopiert es beim Build (`web/scripts/spiel-kopieren.mjs`). Spiellogik gehört deshalb immer nach `spiel/`.

**Sprache**
- Keine Gendersternchen (`*in`), stattdessen neutrale Form oder Paarform („Agentinnen und Agenten“, „Lernende“).
- Schichtnummern (L1–L7) vor Schichtnamen. „Frame“ wird nicht übersetzt. L2 immer mit Header **und** Trailer.

**Aufgaben**
- Fragen nur zu Inhalten, die vorher im Spiel vermittelt wurden oder laut Mindestanforderungen (`lehrkraft/quellen/mindestanforderungen.html`) vorausgesetzt sind. Dort als „nur angeteasert“ geführte Themen werden nicht abgefragt.
- Ist unklar, ob ein neues Konzept als Vorwissen vorausgesetzt werden kann: erst im Issue klären.
- Aufgaben nicht nach Schichten sortiert anordnen. Lösungen nie optisch hervorheben.
- Angriffe nur aus Ermittlersicht (erkennen, belegen, abwehren), nie als Anleitung. Bei Forensik-Themen auf die IT-Sicherheitsvorgaben des Betriebs hinweisen.

**Personen und Daten**
- Figuren bekommen keine echten Namen aus dem Schulumfeld.
- Keine Spielstände, Klassenbezeichnungen oder andere Angaben zu Lerngruppen und Personen ins Repo, auch nicht in Issues oder Commits. Rückmeldungen aus dem Unterricht nur fachlich und anonym („Rückmeldung aus dem Unterricht: Aufgabe X wurde oft missverstanden“).
- Bilder nur selbst erstellt oder mit geklärter freier Lizenz. Fachliches (Diagramme, Terminal, Wireshark) als HTML/SVG, nie als KI-Bild.

**Material**
- Druckmaterial immer als fertige A4-PDF. Quellen in `lehrkraft/quellen/*.html`, erzeugt mit `npm run pdf`.

## Aufbau
- `spiel/` – das Spiel selbst. Klassische Skripte ohne Build-Schritt und ohne Module, Ladereihenfolge in `spiel/index.html`.
  - `content/meta.js`: Version, Figuren der Story, Ränge, Abzeichen (je Abzeichen `form`, `farbe` und `motiv` für das SVG), Challenge, Einsatzliste (je Einsatz `farbe` und `icon` für die Karte)
  - `content/inhalte.js`: Inhaltsverzeichnis – die einzige Liste der geladenen Inhaltsdateien (Spiel, Einsatzzentrale, Lösungs-PDF und Tests lesen sie)
  - `content/meta.js`: Version, Figuren der Story, Ränge, Abzeichen, Challenge, Einsatzliste (je Einsatz `farbe` und `icon` für die Karte)
  - `content/api.js`: Helfer für Inhaltsdateien (`OSI.schritte`, `OSI.challengeBegriffe`, `OSI.L` …) und die Inhaltsprüfung `OSI.pruefen()`
  - `content/eN.js`: ein Einsatz je Datei
  - Anleitung zum Schreiben von Inhalten: [`docs/inhalte.md`](docs/inhalte.md)
  - `js/kit/` – Baukasten, den Spiel **und** Einsatzzentrale nutzen (`window.OSIKit`, `window.OSIStore`, `window.OSIAudio`), ohne Abhängigkeit vom Spielzustand:
    - `storage.js`: Spielstand-Kodierung mit Prüfsumme, Migration alter Spielstände (auch unter Node für die Werkzeuge)
    - `util.js`, `theme.js` (Hell/Dunkel), `audio.js`, `fx.js` (Animationen, beachtet „Bewegung reduzieren“)
    - `progress.js`: Fortschritt, Punkte, Ränge und die „Front“ (nächster offener Schritt) als reine Funktionen
    - `avatars.js`: die 15 Spielfiguren als selbst gezeichnetes SVG
    - `abzeichen.js`: die Abzeichen als selbst gezeichnetes SVG (Form je Art, Farbe als Token, ein Motiv je Abzeichen)
    - `map.js`: Kletterkarten – `welt` (Station je Einsatz, im Spiel senkrecht, in der Zentrale waagerecht), `pfad` (Schritte eines Einsatzes) und `spalten` (alle Schritte als Türme), Figuren mit Lauf-Animation
  - `js/game/` – das Spiel (`window.OSIGame`): `core.js` (Zustand, Punkte, Übungsmodus, Navigation), `shell.js` (Kopfleiste, Dialoge, Lehrkraft-Modus), `screens.js` (Start, Karte, Schritt-Rahmen), `main.js` (Router, Tastatur)
  - `js/steps/` – Renderer der Schritt-Typen: `common.js` (gemeinsame Bausteine), `story.js` (story, lesson, sealed), `quiz.js` (quiz mit mc/layer/pick/multi/eingabe/meldung, anklage), `sort.js` (sort, kapsel), `verhoer.js`, `ende.js` (ende, urkunde), `interaktiv.js` (eigene Interaktionen aus den Inhalten)
  - `js/tools/` – `terminal.js` (simuliertes Terminal), `wireshark.js` (Ansicht und Filter-Parser), `challenge.js` (Zeit-Challenge)
  - `css/` – Designsystem: `tokens.css` (alle Farben, hell und dunkel), `base.css`, `components.css`, `map.css`, `steps.css`, `tools.css`, `print.css`
- `lehrkraft/einsatzzentrale.html` mit `zentrale.js`/`zentrale.css` – Auswertung der `.osiagent`-Dateien (Karte mit allen Figuren, Beamer, Spielstände, Aufgaben-Analyse, Abschlussverhör, CSV).
- `lehrkraft/quellen/*.html` – Quellen der PDFs in `lehrkraft/`. `loesungen.html` erzeugt die Lösungen **automatisch aus den Spielinhalten**.
- `werkzeuge/` – Tests, PDF- und ZIP-Erzeugung, optionales Bildskript.
- `quellbilder/` – Original-PNGs. `spiel/img/` – verkleinerte JPGs (640 px, Qualität 82).
- `index.html` – Startseite der Lite-Version auf GitHub Pages (Pages veröffentlicht `main` ab Root, `.nojekyll` daneben).
- `web/` – Online-Fassung für Vercel: Next.js, Postgres (Neon), Better Auth mit Benutzername + Passwort, Klassen mit Klassencode, Live-Einsatzzentrale. Einrichtung und Aufbau in [`web/README.md`](web/README.md).
  - Das Spiel spricht mit dem Server nur über `OSIGame.online` (gesetzt von `spiel/js/online/sync.js`). In der Lite-Version ist es `null`.
  - Speichern läuft immer über `OSIGame.sichern()`.

**Design**
- Farben nur als Tokens in `spiel/css/tokens.css` (hell und dunkel). Inhalte nutzen inline nur `var(--L1)` … `var(--L7)` und Klassen wie `.merk`, `.profi`, `.lchip`, `table.t`, `.evidence` – deren Namen bleiben stabil.
- Schaubilder in Inhalten färben SVG über die Klassen `svg-box`, `svg-text`, `svg-muted`, `svg-on` oder `style="fill:var(--L3)"`, damit sie in beiden Themes lesbar sind.
- Figuren-IDs (`a01` … `a15`) stehen in den Spielständen und werden **nie geändert oder wiederverwendet**.

## Arbeitsablauf
Voraussetzungen:
- Node.js
- ein Chromium-Browser (Edge oder Chrome). Er wird automatisch gesucht, sonst den Pfad in `CHROME_PATH` angeben.
- für die ZIP zusätzlich PowerShell 7 (`pwsh`)

```
cd werkzeuge
npm install          # nur beim ersten Mal
npm run release      # Tests + PDFs + ZIP – vor jedem Commit
```

- `npm test` prüft zuerst die Inhalte (`npm run inhalte`, ohne Browser), spielt dann alle freigegebenen Einsätze durch und prüft:
  - die Werkzeuge (Terminal-Befehle, Wireshark-Filter)
  - Kletterkarte und Figuren (Spiel und Einsatzzentrale)
  - die Antwortlängen (die richtige Antwort darf nicht auffällig länger sein)
  - Übungsmodus, Zeit-Challenge und Einsatzzentrale
  - interaktive Schritte am Beispiel `docs/beispiele/interaktiv-frame.js`
- `npm run test:online` prüft die Online-Fassung von Anmeldung bis Live-Zentrale gegen eine **Test-Datenbank**. Es braucht `TEST_DATABASE_URL` (Datenbankname mit „test“, wird geleert) und vorher `npm run build` in `web/`. Ohne die Variable wird der Test übersprungen.

  Screenshots landen in `werkzeuge/shots/`. Bei Änderungen an der Oberfläche bitte ansehen.
- `npm run pdf` erzeugt die PDFs neu. Das ist nach jeder Inhaltsänderung nötig, weil das Lösungs-PDF aus den Spielinhalten entsteht.
- `npm run zip` baut `verteilen/OSI-Agenten_v<version>.zip` (Spiel + Kurzanleitung). Der Ordner `verteilen/` ist nur lokal, veröffentlicht wird die ZIP über ein GitHub-Release (siehe unten).
- Optional: Eigene `.osiagent`-Dateien in einen Ordner `test/` im Projekt legen. Er wird von Git ignoriert. `npm test` prüft dann, ob diese Spielstände noch laden.
- Commit-Nachrichten auf Deutsch, kurz: was und warum.

## Neue Version veröffentlichen (Maintainer)
Nicht zu verwechseln: `npm run release` baut lokal Tests, PDFs und ZIP. Ein **GitHub-Release** stellt die ZIP öffentlich zum Download bereit.
1. `version` in `spiel/content/meta.js` erhöhen. Das nur, wenn eine neue Fassung an Lernende verteilt werden soll, nicht für jede Kleinigkeit.
2. `npm run release` ausführen, dann committen und pushen.
3. GitHub-Release `vX.Y.Z` auf diesem Commit anlegen und `verteilen/OSI-Agenten_vX.Y.Z.zip` anhängen:
   `gh release create vX.Y.Z verteilen/OSI-Agenten_vX.Y.Z.zip --target main --title "vX.Y.Z – …" --notes "…"`

In den Release-Notizen steht, was sich für Lernende und Lehrkräfte ändert. Ältere Spielstände laden weiter (siehe Grundregeln).

## Neuen Einsatz oder neue Inhalte ergänzen
Ausführlich mit Beispielen: [`docs/inhalte.md`](docs/inhalte.md).
1. `spiel/content/eN.js` anlegen (Muster: `e1.js`) und in `meta.js` mit `status: 'offen'`, `farbe` und `icon` eintragen. Er erscheint dann als neues Kapitel auf der Karte.
2. Die Datei in `spiel/content/inhalte.js` eintragen. Weitere Stellen müssen nicht angepasst werden. Zusatzdateien für bestehende Einsätze nutzen `OSI.schritte(…)` und stehen dort hinter der Datei des Einsatzes.
3. `npm run inhalte` (in `werkzeuge/`) prüft IDs, Schritt-Typen, Antworten und Challenge-Begriffe in Sekunden.
4. Eigene Interaktion? Schritt-Typ `interaktiv` mit `start(el, api)` und `loesen(el, api)`. Vorlage: `docs/beispiele/interaktiv-frame.js`.
5. Ganz neuer Schritt-Typ (selten nötig)? Renderer in `spiel/js/steps/` (eigene Datei mit Script-Tag in `spiel/index.html`) anlegen. Dazu den Typ in `OSI.SCHRITT_TYPEN` (`spiel/content/api.js`) eintragen, Symbol und Name in `TYP_ICON`/`TYP_NAME` (`spiel/js/kit/map.js`) ergänzen und den Typ in `werkzeuge/test-durchlauf.js` behandeln.
6. Debriefing-Impulse in `lehrkraft/quellen/loesungen.html` ergänzen.

## Bilder (optional)
Die fertigen Bilder liegen im Repo. Neue Bilder im selben Stil erzeugt `werkzeuge/bild.ps1` über ein lokales ComfyUI mit FLUX.2 [klein] 9B (nur das unveränderte Basismodell). Der Stil-Prompt steht im Skript, die Server-Adresse kommt aus `$env:COMFYUI_URL`. Danach mit Pillow als JPG nach `spiel/img/` verkleinern. Lichtquellen und Bildlogik prüfen.

## Lizenz deiner Beiträge
Mit einem Pull Request stellst du deinen Beitrag unter dieselben Lizenzen wie das Projekt: MIT für Code, CC BY-SA 4.0 für Inhalte (siehe [LICENSE.md](LICENSE.md)).
