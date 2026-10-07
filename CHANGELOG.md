# Änderungen

Was sich für Lernende, Lehrkräfte und Mitwirkende geändert hat. Ältere Spielstände (`.osiagent`) laden in allen Fassungen weiter: Schritt-, Aufgaben- und Figuren-IDs bleiben unverändert.

## 2.0.0 (Oktober 2026)

### Für Lernende
- **Neues Design im Duolingo-Stil:**
  - runde Formen, Knöpfe und Kacheln mit 3D-Kante
  - Grün = weiter/richtig, Rot = falsch, Gold = Punkte
  - Feedback als Leiste unter der Aufgabe, Antworten auch per Ziffern- und Enter-Taste
  - **Hell** ist Standard, **Dunkel** (Noir) folgt der Systemeinstellung und ist umschaltbar
- **Kletterkarten statt Aktenliste**, immer von unten nach oben wie die Ermittlung:
  - **Weltkarte:** eine Station je Einsatz in seiner Schichtfarbe, mit Fortschrittsring
  - **Pfad je Einsatz:** jeder Schritt ein Knoten, Bonus-Akten neben dem Pfad
  - Die eigene Figur hüpft beim Öffnen einer Karte zur nächsten offenen Aufgabe
- **15 Spielfiguren** als selbst gezeichnete SVG: beim Anlegen wählbar, später über die Kopfleiste änderbar.
- **Neue Abzeichen:** Alle 22 Abzeichen sind jetzt eigene SVG-Grafiken statt Emojis, neu erstellt vom Maintainer. Die Form zeigt die Art:
  - Medaille = Einsatz abgeschlossen
  - Wappenschild mit Stern = Einsatz ohne Tipp
  - Sechseck = Training und Challenge
  - Siegel = geheim

  Zu sehen im Regal, im Hinweis beim Erhalt und auf der gedruckten Urkunde.
- **Animationen:** Pop, Wackeln, fliegende XP, Konfetti und Figuren-Lauf. Sie entfallen bei „Bewegung reduzieren“.
- **Neue Anzeigen**, ohne Punkte und ohne Druck:
  - Kombo-Hinweis bei richtigen Antworten in Folge
  - Tages-Flamme für heute erledigte Schritte
- **Zeit-Challenge:** 77 statt 55 Begriffe, alle aus dem Grundwissen (Grundausbildung, Agenten-Handbuch, Triage-Befehle, bekannte Protokolle und Ports).

### Für Lehrkräfte
- **Einsatzzentrale mit Karten-Reiter:**
  - alle geladenen Spielstände als Figuren mit Namensschild auf der Karte
  - umschaltbar: Weltkarte, ein einzelner Einsatz oder alle Schritte als Türme
  - mit Lauf-Animation und Vollbild für den Beamer
- **Interaktive Schritte:** Der neue Schritt-Typ `interaktiv` erlaubt eigene Übungen, etwa Teile anklicken, zusammensetzen oder eine kleine Simulation. Punkte, Tipps, Übungsmodus, Fehleranalyse in der Zentrale und Lösungs-PDF funktionieren wie bei allen Aufgaben. Eine Vorlage liegt in `docs/beispiele/interaktiv-frame.js` und ist noch nicht im Spiel eingebunden.

### Online-Fassung (neu)
Zusätzlich zur Lite-Version (ZIP, Doppelklick, GitHub Pages ohne Konto) gibt es eine **Online-Fassung** in `web/`. Sie läuft auf Vercel mit Postgres (Neon) und nutzt Better Auth mit Benutzername und Passwort.
- **Lernende:**
  - registrieren sich mit dem **Klassencode** ihrer Lehrkraft, ohne E-Mail
  - der Spielstand wird automatisch gespeichert; bei Funkloch puffert der Browser und holt das Speichern nach
  - Reiter **Klasse**: die eigene Klasse auf der Weltkarte und eine Rangliste, nur mit Codenamen und Figuren
- **Lehrkräfte** werden vom Admin freigeschaltet. Sie
  - legen Klassen mit Klassencode an und sperren oder löschen sie,
  - sehen die **Live-Einsatzzentrale** (aktualisiert alle 20 Sekunden),
  - setzen Passwörter zurück und entfernen oder löschen Konten,
  - ändern bei Lernenden **Benutzername, Codename, Figur und Klasse**.
- **Admin:** Das Konto aus `ADMIN_BENUTZERNAME` schaltet Lehrkraft-Anträge frei.
- **Datenschutz:**
  - gespeichert werden nur Benutzername, Passwort-Hash, Klassenzuordnung und Spielstand
  - „Konto löschen“ entfernt alles
  - Impressum und Datenschutzerklärung sind Platzhalter, den Text liefert die Schule bzw. der Betreiber
- Einrichtung: [`web/README.md`](web/README.md).

### Für Mitwirkende
- **Aufgeräumter Code:**
  - `spiel/js/kit/` enthält den Baukasten für Spiel und Einsatzzentrale (Speichern, Fortschritt, Figuren, Abzeichen, Karten, Animationen, Ton)
  - `spiel/js/game/` enthält das Spiel
  - `spiel/js/steps/` enthält die Renderer der Schritt-Typen
  - Designsystem mit Tokens in `spiel/css/tokens.css`
- **Inhalte schneller einbauen:**
  - `spiel/content/inhalte.js` ist die einzige Liste der Inhaltsdateien. Bisher standen die Script-Tags in drei HTML-Dateien.
  - `spiel/content/api.js` bringt die Helfer `OSI.schritte`, `OSI.challengeBegriffe` und `OSI.L`.
  - Anleitung mit Spickzettel aller Schritt-Typen: [`docs/inhalte.md`](docs/inhalte.md).
- **Inhaltsprüfung:** `npm run inhalte` meldet in Sekunden
  - doppelte oder ausgemusterte IDs,
  - unbekannte Schritt-Typen,
  - falsche Antwort-Verweise,
  - ungültige Challenge-Begriffe.

  Die Prüfung läuft zuerst in `npm test`, im Spiel erscheinen die Meldungen in der Browser-Konsole.
- **Mehr Tests:**
  - Karte und Figuren, interaktive Schritte und Inhaltsprüfung (`npm test`)
  - Ende-zu-Ende-Test der Online-Fassung gegen eine Test-Datenbank (`npm run test:online`)

## 1.1.0 (Oktober 2026)
Erste öffentliche Fassung von „Operation Lohnzettel“. Sie enthielt:
- Grundausbildung, die Einsätze zu L1 bis L7, Finale und Abschlussverhör
- die Einsatzzentrale
- das Lehrkraft-Material als PDF
- die Verteilung über GitHub-Releases
