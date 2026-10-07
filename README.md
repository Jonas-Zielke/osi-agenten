# OSI-Agenten · Operation Lohnzettel

Ein Agenten-Krimi als Lernspiel, in dem sich Lernende das **OSI-Modell** selbst erarbeiten. Bei der Spedition Falkenrath & Oltmanns Logistik fängt eine gefälschte Lohnportal-Seite Zugangsdaten ab, und Löhne werden auf ein fremdes Konto umgeleitet. Die Agentinnen und Agenten ermitteln Schicht für Schicht von L1 bis L7: Sie lesen ARP-Caches, filtern Mitschnitte in einer simulierten Wireshark-Ansicht, tippen `ipconfig`, `nslookup` und `tracert` in ein simuliertes Terminal und überführen am Ende den Täter.

![Einsatzzentrale der Agenten](spiel/img/hq.jpg)

Das Spiel gibt es in zwei Fassungen mit demselben Spielcode:
- **Online mit Konto** (Ordner [`web/`](web/), Vercel + Postgres): Anmeldung mit Benutzername und Passwort, Lernende treten mit einem **Klassencode** bei.
  - Der Fortschritt wird automatisch gespeichert.
  - Lernende sehen ihre Klasse auf der Karte.
  - Lehrkräfte sehen alles live in der Einsatzzentrale.
  - Einrichtung: [`web/README.md`](web/README.md).
- **Lite ohne Konto** (Ordner `spiel/`): im Browser oder als ZIP, auch ganz ohne Internet. Gesichert wird über die Export-Datei.

**▶ Lite online spielen:** <https://glaside.github.io/osi-agenten/spiel/>
**▶ Lite offline spielen:** Unter [Releases](https://github.com/GlasiDe/osi-agenten/releases/latest) die ZIP der aktuellen Version herunterladen (`OSI-Agenten_v….zip`, enthält nur das Spiel und die Kurzanleitung), entpacken und `spiel/index.html` doppelklicken. Es wird kein Internet, kein Server und keine Installation gebraucht.

## Zielgruppe und Einordnung
- Informationstechnische Assistentinnen und Assistenten (NRW, Profilfach Betriebssysteme/Netzwerke)
- Fachinformatikerinnen und Fachinformatiker, Lernfeld 3 „Clients in Netzwerke einbinden“ und/oder Lernfeld 9 „Netzwerke und Dienste bereitstellen“

Das Spiel setzt Grundlagen voraus, z. B. IPv4 und Subnetting, MAC-Adressen, DHCP und ARP. Was genau vorausgesetzt wird, steht in [`lehrkraft/Mindestanforderungen_Vorwissen.pdf`](lehrkraft/Mindestanforderungen_Vorwissen.pdf), zusammen mit einem zehnminütigen Vorab-Check. Wo das Spiel im eigenen Bildungsgang hingehört, legt ihr in eurer **Didaktischen Jahresplanung** fest. Bezüge zu Bildungsplan und Lernfeldern stehen in [`DESIGN.md`](DESIGN.md#lehrplanbezug). Wer andere Lerngruppen hat, darf das Spiel gern anpassen.

## Ablauf im Unterricht
- **Verteilen:** die ZIP aus dem [aktuellen Release](https://github.com/GlasiDe/osi-agenten/releases/latest) an die Lernenden geben (z. B. über die Lernplattform) oder den Online-Link weitergeben. Das übrige Repo wird dafür nicht gebraucht.
- 7 Einsätze (E0–E6) und ein Abschlussverhör, etwa 6 Doppelstunden bei freiem Tempo
- Gespielt wird **grundsätzlich allein**. Fehlen Geräte oder spricht didaktisch etwas dafür, geht es auch zu zweit an einem Gerät mit gemeinsamem Spielstand (im Spiel „Duo“ genannt).
- Lite-Version: Am Stundenende wird der Spielstand als `.osiagent`-Datei exportiert und abgegeben. In der Online-Fassung entfällt das, weil alles im Konto gespeichert wird.
- Die Karte hat zwei Ebenen: Die **Weltkarte** zeigt die Einsätze als Stationen, ein Klick öffnet den **Pfad des Einsatzes** mit allen Schritten.
- Die **Einsatzzentrale** ([`lehrkraft/einsatzzentrale.html`](lehrkraft/einsatzzentrale.html)) liest die abgegebenen Dateien ein und zeigt alle Spielstände als Figuren mit Namensschild auf der Kletterkarte, dazu Beamer-Ansicht, Fortschritt je Spielstand, Aufgaben-Analyse und CSV-Export.
- Das Abschlussverhör beantwortet jede Person allein. Es dient der Diagnose und ist keine Note.

## Material für Lehrkräfte
Alle Unterlagen liegen als druckfertige A4-PDFs in [`lehrkraft/`](lehrkraft/):

| Datei | Inhalt |
|---|---|
| `Kurzanleitung_SuS.pdf` | Start, Speichern und Export für die Lernenden |
| `Loesungen_und_Debriefing.pdf` | alle Lösungen (automatisch aus den Spielinhalten erzeugt) und Debriefing-Impulse je Einsatz |
| `Inhaltsuebersicht_Einsaetze.pdf` | Fachinhalt und Handlung je Einsatz |
| `Mindestanforderungen_Vorwissen.pdf` | vorausgesetztes Vorwissen und Vorab-Check |
| `Offene_Aufgaben_Lehrkraft.pdf` | Ideen für Packet-Tracer-Außeneinsätze und weiteres Material |

### Lehrkraft-Modus
Im Spiel unten auf „Lehrkraft“ klicken oder **Strg + Alt + L** drücken. Das Standard-Passwort lautet `Einheit7-Zentrale`. Im Lehrkraft-Modus sind alle Akten offen, außerdem lässt sich das Abschlussverhör freischalten.

**Eigenes Passwort setzen:** `spiel/index.html` im Browser öffnen, die Entwicklerkonsole öffnen (F12) und `OSIStore.hash('lk|' + 'MeinPasswort')` eingeben. Den ausgegebenen Wert in `spiel/content/meta.js` bei `lehrkraftHash` eintragen. Das Passwort steht außerdem in `lehrkraft/quellen/loesungen.html`. Dort ebenfalls ändern und die PDFs neu erzeugen (siehe [CONTRIBUTING.md](CONTRIBUTING.md)).

> **Hinweis: Das Spiel ist nicht schummelsicher.** Lösungen, Passwort-Hash und Prüfsumme der Spielstände stecken im Quelltext, der im Browser läuft. Das ist Absicht: Punkte und Ränge sollen motivieren und sind nicht zur Leistungsbewertung gedacht. Es lohnt sich, das der Lerngruppe offen zu sagen.

## Spielstände, Datenschutz, Geräte
- **Lite-Version:** überträgt **keine Daten**. Es gibt keinen Server, keine Cookies, kein Tracking und keine externen Schriften. Der Spielstand liegt im Browser (`localStorage`) und in der exportierten `.osiagent`-Datei.
- **Online-Fassung:** speichert Benutzername, Passwort-Hash, Klassenzuordnung und Spielstand in einer Postgres-Datenbank (Neon, EU-Region empfohlen). Es werden keine E-Mail-Adressen gespeichert, ein Konto lässt sich jederzeit vollständig löschen. Vor dem Einsatz mit der Schule klären und Datenschutzerklärung und Impressum ergänzen (`web/app/datenschutz`, `web/app/impressum`).
- Bei der Online-Version protokolliert GitHub Pages wie jeder Webserver die IP-Adressen der Aufrufe (siehe [GitHub-Datenschutzerklärung](https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement)). Gegebenenfalls mit der Datenschutzbeauftragten oder dem Datenschutzbeauftragten der Schule abstimmen.
- **Browser-Speicher ist nur vorläufig:** Je nach Browser und Einstellung wird er gelöscht, z. B. beim Beenden oder nach längerer Zeit ohne Besuch. Deshalb nach **jeder** Stunde exportieren.
- **Tablets (z. B. iPad):** Lokale HTML-Dateien lassen sich dort meist nicht starten, dann die Online-Version nutzen.
- Updates sind spielstandsicher: Neue Versionen laden alte Spielstände weiter.

## Anpassen und mitmachen
Fehler gefunden, Ideen für neue Einsätze oder eine Anpassung für eure Lerngruppe? Issues und Pull Requests sind willkommen. Die Spielregeln für Beiträge (z. B. „IDs nie ändern“) stehen in [CONTRIBUTING.md](CONTRIBUTING.md), die Designentscheidungen in [DESIGN.md](DESIGN.md). Was sich zwischen den Versionen geändert hat, steht in [CHANGELOG.md](CHANGELOG.md).

## Lizenz
- **Code** (`spiel/js/`, `werkzeuge/`, Startseite): [MIT](LICENSE.md#code-mit)
- **Inhalte** (Texte, Aufgaben, Fall, PDFs, Bilder): [CC BY-SA 4.0](LICENSE.md#inhalte-cc-by-sa-40)
- Die Illustrationen wurden mit KI erzeugt (FLUX.2 [klein] 9B) und von der Lehrkraft geprüft und ausgewählt. Die 15 Spielfiguren, die Karte und alle Schaubilder sind selbst als SVG gezeichnet. Details in [LICENSE.md](LICENSE.md).
