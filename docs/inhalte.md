# Inhalte schreiben

So kommen neue Schritte, Aufgaben, Challenge-Begriffe und eigene interaktive Übungen ins Spiel. Für die didaktischen Vorgaben gilt [`DESIGN.md`](../DESIGN.md), für IDs, Sprache und Arbeitsablauf gilt [`CONTRIBUTING.md`](../CONTRIBUTING.md).

## Wo liegt was?
| Datei | Inhalt |
|---|---|
| `spiel/content/inhalte.js` | **Inhaltsverzeichnis:** welche Dateien geladen werden. Spiel, Einsatzzentrale, Lösungs-PDF und Tests lesen diese eine Liste. |
| `spiel/content/meta.js` | Stammdaten: Figuren, Ränge, Abzeichen, **Zeit-Challenge**, Einsatzliste (Karte), Netz von F&O |
| `spiel/content/api.js` | Helfer für Inhaltsdateien (siehe unten) und die automatische Prüfung `OSI.pruefen()` |
| `spiel/content/eN.js` | ein Einsatz je Datei (`E.steps = [ … ]`) |
| `docs/beispiele/` | Vorlagen, die nicht im Spiel eingebunden sind (z. B. ein interaktiver Schritt) |

## Schnellstart
**Schritt in einen bestehenden Einsatz:** direkt in `spiel/content/eN.js` in die Liste `E.steps` schreiben, an der Stelle, an der er im Pfad stehen soll.

**Größere Ergänzung in eigener Datei** (z. B. `spiel/content/e2-werkstatt.js`):
```js
(function () {
  const OSI = window.OSI;
  OSI.schritte('e2', [
    { id: 'e2-werkstatt-intro', type: 'lesson', titel: 'Werkstatt', html: '<p>…</p>' },
    { id: 'e2-werkstatt-quiz', type: 'quiz', titel: '…', fragen: [ … ] }
  ], { nach: 'e2-arp' });     // ohne { nach } wird angehängt, { vor: 'id' } fügt davor ein
  OSI.challengeBegriffe([{ t: 'Begriff', l: 2 }]);
})();
```
Dann die Datei in `spiel/content/inhalte.js` **hinter** `'e2.js'` eintragen. Weitere Stellen müssen nicht angepasst werden.

**Neuer Einsatz:** In `meta.js` unter `einsaetze` eintragen (mit `id`, `nrText`, `titel`, `untertitel`, `farbe`, `icon`, `status: 'offen'`, `steps: []`). Danach `spiel/content/eN.js` nach dem Muster von `e1.js` anlegen und in `inhalte.js` eintragen. Er erscheint als neue Station auf der Weltkarte.

**Prüfen:** `cd werkzeuge && npm run inhalte` braucht ein paar Sekunden und meldet doppelte oder ausgemusterte IDs, unbekannte Schritt-Typen, Antworten, die auf keine Option zeigen, unvollständige interaktive Schritte und ungültige Challenge-Begriffe. Dieselben Meldungen erscheinen beim Öffnen des Spiels in der Browser-Konsole (F12). Vor dem Commit läuft wie immer `npm run release`.

> **IDs sind für immer.** Schritt- und Aufgaben-IDs stecken in den Spielständen. Nie ändern, nie wiederverwenden. Gestrichenes kommt nach `OSI.ausgemustert`.

## Helfer aus `api.js`
| Helfer | Zweck |
|---|---|
| `OSI.L(3)` | Schicht-Etikett im Text (farbiges „L3“) |
| `OSI.einsatz('e2')` | Einsatz-Objekt holen (meldet Tippfehler deutlich) |
| `OSI.schritte(eid, [...], { nach \| vor })` | Schritte hinzufügen |
| `OSI.challengeBegriffe([{ t, l }])` | Begriffe für die Zeit-Challenge ergänzen |
| `OSI.pruefen()` | Liste aller Inhaltsfehler (leer = gut) |

## Schritt-Typen
Gemeinsame Felder: `id`, `type`, `titel`. Optional sind außerdem:
- `bonus: true`: neben dem Pfad, keine Pflicht
- `setzt: { verdaechtiger: 'entlastet' }`: Stempel auf dem Board

| Typ | Wofür | Wichtige Felder |
|---|---|---|
| `story` | Szene mit Sprechblasen | `szenen: [{ wer: 'kalle', text }]` (`wer` aus `OSI.figuren`), `bild`, `board: true` |
| `lesson` | Lektion | `tag`, `html`, `kalle` (Spruch unten) |
| `quiz` | Aufgaben (siehe nächster Abschnitt) | `intro`, `kontext` (HTML oder Funktion), `terminal`, `wireshark`, `fragen: [...]` |
| `sort` | Begriffe in Fächer sortieren | `bins: [{ id, label, kurz }]`, `items: [{ id, text, ziel, erklaerung, hinweis }]`, `punkte` |
| `kapsel` | Reihenfolge-Puzzle | `phasen: [{ id, titel, text, start, optionen: [{ key, label }], korrekt: [keys] }]`, `abschluss` |
| `sealed` | versiegelte Bonus-Akte | `teaser`, `inhalt` (nach Freigabe durch die Lehrkraft) |
| `ende` | Kapitel-Abschluss | `text`, `abzeichen`, `abzeichenOhneTipp` |
| `anklage`, `verhoer`, `urkunde` | Finale und Abschlussverhör | siehe `e6.js` und `verhoer.js` |
| `interaktiv` | **eigene Interaktion** | siehe unten |

Neben den Pflichtfeldern gibt es zwei weitere:
- `ziel` (sort) und `richtig` (layer-Frage) dürfen eine Liste sein, wenn mehrere Schichten stimmen (z. B. TLS: `[6, 5]`).
- `hinweis` und `hinweise` sind Kalles Tipps, jeder kostet Punkte.

### Fragen im `quiz`
Jede Frage hat `id`, `frage`, `richtig`, `erklaerung` (erscheint nach dem Lösen), optional `hinweise: [...]`, `punkte` (Standard 10) und `falsch: { wert: 'gezielte Rückmeldung' }`.

| Art | Felder | `richtig` |
|---|---|---|
| Einfachwahl | `optionen: [...]` (gemischt, `fest: true` hält die Reihenfolge) | Index ab 0 |
| Mehrfachwahl | `optionen`, `multi: true` | Liste von Indizes |
| Schicht | `layer: true` | 1–7 oder Liste |
| Freitext | `eingabe: 'ip' \| 'mac' \| 'zahl' \| 'text' \| 'filter'`, `platzhalter` | Text oder Liste gleichwertiger Antworten |
| Klick ins Bild | `pick: true`, im `kontext` Elemente mit `data-pick="…"` | Wert von `data-pick` |
| Frame melden | `meldung: true` (mit `wireshark`) | Frame-Nummer |
| Ticket | zusätzlich `ticket` (HTML) und `ticketNr` | – |

Regeln aus DESIGN.md:
- Die richtige Antwort ist nie länger als die falschen. Das prüft der Test.
- Keine Zaunpfähle, die Begründung steht in `erklaerung`.
- Abgefragt wird nur, was vorher vermittelt wurde.

## Zeit-Challenge
Die Begriffe stehen in `meta.js` unter `challenge.pool`, nach Schichten gegliedert, je Eintrag `{ t: 'Begriff', l: 1–7 }`. Ergänzen lassen sie sich dort direkt oder aus einer Inhaltsdatei mit `OSI.challengeBegriffe([...])`.

- **Grundwissen statt Spezialwissen:** Die Challenge ist schnelles Wiederholen, kein Expertenquiz. Hinein gehören:
  - Kernbegriffe aus der Grundausbildung (E0) und dem Agenten-Handbuch (Aufgabe, Geräte, Adressen, PDUs je Schicht)
  - die Befehle der Fehler-Triage
  - bekannte Protokolle und Ports

  Nicht hinein gehören Detailwissen aus späteren Einsätzen (TCP-Flags, Portbereiche, DHCP-Nachrichten, Glasfaser-Arten) und konkrete Werte aus dem Fall, die man nur mit Fallkenntnis zuordnen kann.
- **Kurz:** höchstens 30 Zeichen. Er muss in einer Sekunde lesbar sein.
- **Eindeutig:** genau eine Schicht, ohne Diskussion. TLS (L5 oder L6) gehört deshalb nicht hinein.
- **Gelernt:** nur, was das Spiel vermittelt. Was laut Mindestanforderungen nur angeteasert wird, kommt nicht hinein (WLAN, VLAN, NAT, Firewall, TLS im Detail).
- **Im Stil der vorhandenen Begriffe:** Gerät, Adresse, Protokoll, Befehl oder Aufgabe einer Schicht (`Link-LED`, `Physische Adresse`, `ping`, `Port 443`, `Daten umwandeln`).

## Interaktive Schritte (`type: 'interaktiv'`)
Für alles, was die Standard-Typen nicht können: Teile anklicken, zusammensetzen, verschieben, eine kleine Simulation. Der Inhalt baut seine Oberfläche selbst, den Rest übernimmt das Spiel:
- Punkte (1. Versuch voll, dann weniger, Tipps kosten)
- Kalle-Tipps und Feedback-Leiste
- Speichern und „Weiter“
- „Nochmal üben“ mit ⭐
- Fehleranalyse in der Einsatzzentrale und Zeile im Lösungs-PDF

**Vollständiges Beispiel zum Kopieren:** [`docs/beispiele/interaktiv-frame.js`](beispiele/interaktiv-frame.js). Lernende setzen dort einen Ethernet-Frame zusammen und finden den Trailer. `werkzeuge/test-interaktiv.js` spielt es bei jedem `npm test` durch.

```js
{
  id: 'e2-frame-bauen', type: 'interaktiv', titel: 'Einen Frame bauen',
  intro: '<p>Aufgabenstellung …</p>',
  aufgaben: [   // jede Aufgabe zählt einzeln (Punkte, Fehlerquote, Lösungs-PDF)
    { id: 'e2-frame-bauen-a', text: 'Kurzbeschreibung für Zentrale und PDF', punkte: 15,
      erklaerung: 'Erscheint nach dem Lösen', loesung: 'Steht im Lösungs-PDF',
      hinweise: ['Tipp 1', 'Tipp 2'], werte: { fcs: 'FCS (Prüfsumme)' } }   // werte: Klartext für falsche Antworten in der Zentrale
  ],
  css: `.meins-feld { border: 2px solid var(--L2); }`,   // optional, eigenes Präfix, Farben nur über var(--…)
  start(el, api) { /* Oberfläche in el bauen, bei Erfolg api.richtig(…), bei Fehlern api.falsch(…) */ },
  loesen(el, api) { /* für den automatischen Test: alles auf dem richtigen Weg lösen */ }
}
```

**`api` in `start(el, api)`:**
| | |
|---|---|
| `api.richtig(id, { el, text })` | Aufgabe gelöst: Punkte und grüne Leiste (Erklärung aus der Aufgabe oder `text`). Sind alle gelöst, erscheint „Weiter“. |
| `api.falsch(id, wert, text, { el })` | Fehlversuch: kostet Punkte, rote Leiste, `wert` landet in der Fehleranalyse. |
| `api.hinweis(html, titel)` | neutrale Leiste ohne Wertung (z. B. „Erst etwas auswählen“) |
| `api.geloest(id)`, `api.versuche(id)` | Stand einer Aufgabe, z. B. um einen gelösten Zustand wieder anzuzeigen |
| `api.tipps(id)` | Kalle-Tipps dieser Aufgabe zeigen (Standard: erste offene Aufgabe) |
| `api.uebung`, `api.erledigt` | „Nochmal üben“ läuft bzw. Schritt war schon fertig |
| `api.ton('klick')`, `api.fx.pop(el)`, `api.fx.wackeln(el)`, `api.fx.konfetti()` | Ton und Animation (beachten „Bewegung reduzieren“) |
| `api.tasten(ev => …)` | eigene Tastatur, solange der Schritt offen ist |
| `api.$`, `api.$$`, `api.esc`, `api.L`, `api.mischen`, `api.schichtFarbe` | Helfer |

Regeln für eigene Interaktionen:
- **Bausteine des Spiels nutzen:** Klassen wie `.chip`, `.pool`, `.opt`, `.btn`, `.merk`, `.evidence`, `.lchip` und Farben nur über Tokens. So passt alles zu Hell und Dunkel und zum Duolingo-Stil.
- **Lösungen nicht verraten:** nichts optisch hervorheben, bevor gelöst wurde. Falsche Wege zählen mit `api.falsch`.
- **Erst prüfen, dann weiter:** Jede Aufgabe muss lösbar sein. `loesen` beweist das im Test.
- **Fehler legen nichts lahm:** Wirft `start` einen Fehler, zeigt der Schritt einen Hinweis statt das Spiel anzuhalten. Der Fehler steht in der Konsole.
- **Angriffe nur aus Ermittlersicht:** erkennen, belegen, abwehren. Siehe CONTRIBUTING.
