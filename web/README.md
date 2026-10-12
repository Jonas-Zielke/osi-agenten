# OSI-Agenten · Online-Fassung (`web/`)

Next.js-App für Vercel mit Postgres (Neon) und Anmeldung per **Benutzername + Passwort** (Better Auth, selbst gehostet).
Das Spiel selbst ist **derselbe Code wie die Lite-Version** in [`../spiel`](../spiel). `scripts/spiel-kopieren.mjs` kopiert es vor jedem Start/Build nach `public/spiel` und hängt nur `js/online/sync.js` an. Dazu kommt die Einsatzzentrale aus `../lehrkraft` mit `zentrale-online.js`.

| Rolle | kann |
|---|---|
| Lernende | registrieren sich mit **Klassencode** (ohne E-Mail), Spielstand wird automatisch gespeichert, Reiter „Klasse“ zeigt die Klasse auf der Weltkarte (nur Codenamen) |
| Lehrkraft | registriert sich mit Antrag, legt nach **Freischaltung durch den Admin** Klassen an, sieht die **Live-Einsatzzentrale**, ändert bei Lernenden **Benutzername, Codename, Figur und Klasse** (✏️ Bearbeiten), setzt Passwörter zurück, entfernt oder löscht Konten |
| Admin | das Konto mit dem Benutzernamen aus `ADMIN_BENUTZERNAME`. Verwaltet im Admin-Bereich (`/admin`) **alles**: schaltet Lehrkräfte frei; legt Konten an, ändert Benutzername, Codename, Figur, **Rolle** und Klasse, setzt Passwörter, meldet ab, löscht; verwaltet alle Klassen (übertragen, neuer Code, löschen – auch samt Konten); sieht alle Spielstände, lädt sie herunter (`.osiagent`/JSON), ersetzt oder setzt sie zurück; Live-Zentrale aller Klassen; Sicherung als JSON. Es bleibt immer mindestens ein Admin |

## Auf Vercel einrichten (einmalig)
1. **Neon:** Projekt in einer **EU-Region** (z. B. `aws-eu-central-1`). Unter *Connect* die **gepoolte** Verbindungs-URL kopieren.
2. **Vercel:** *Add New → Project → Import* `Jonas-Zielke/osi-agenten`.
   - **Root Directory:** `web`
   - Framework: Next.js (wird erkannt)
   - „Include files outside of the Root Directory in the Build Step“ muss an sein (Standard), denn der Build liest `../spiel` und `../lehrkraft`.
   - Unter *Settings → Functions* als Region **Frankfurt (fra1)** wählen (nah an der EU-Datenbank).
3. **Environment Variables** (Production **und** Preview), siehe [`.env.example`](.env.example):
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET` (`openssl rand -base64 32`)
   - `BETTER_AUTH_URL` (Produktions-Adresse, z. B. `https://osi-agenten.vercel.app`)
   - `ADMIN_BENUTZERNAME`
4. Deploy auslösen. Der Build (`npm run build`) legt die Tabellen automatisch an (`scripts/migrate.mjs`, steht im Build-Log).
5. Auf der Seite mit dem `ADMIN_BENUTZERNAME` registrieren („Ich bin Lehrkraft“) – dieses Konto wird Admin und ist sofort freigeschaltet.

Vorschau-Deployments nutzen dieselbe Datenbank, wenn dort dieselbe `DATABASE_URL` steht. Wer das trennen will, legt in Neon einen Branch an und setzt dessen URL nur für *Preview*.

## Lokal
```
cp .env.example .env.local   # Werte eintragen (lokales Postgres reicht)
npm install
npm run migrate
npm run dev                  # http://localhost:3000
```

## Aufbau
- `lib/auth-optionen.mjs` – Better-Auth-Einstellungen (eine Quelle für App und Migration), `lib/auth.ts`, `lib/db.ts`, `lib/rechte.ts` (wer darf was), `lib/zugang.ts` (Rollen samt Freischaltung), `lib/verwaltung.ts` (Konten, Profile, Passwörter, Spielstände, Klassen schreiben – für Registrierung, Lehrkraft und Admin), `lib/werte.ts` (Prüfungen, Klassencodes, Startpasswörter)
- `app/api/**` – Registrierung, Spielstand, Rangliste, Klassen, Lernende, Konto; `app/api/admin/**` (Konten, Klassen, Spielstände, Sicherung, Lehrkraft-Anträge – nur Admin); `app/api/auth/[...all]` ist Better Auth
- `app/**/page.tsx` – Start, Anmelden, Registrieren, Konto, Lehrkraft, Klasse, Admin (`/admin`, `/admin/konten`, `/admin/konten/[id]`, `/admin/klassen`, `/admin/spielstaende`), Datenschutz/Impressum (Platzhalter)
- `db/migrations/*.sql` – eigene Tabellen (`klasse`, `mitgliedschaft`, `spielstand`, `spielstand_verworfen`), jede Datei läuft genau einmal
- Der Admin-Bereich wertet hochgeladene Spielstände mit den Funktionen des Spiels aus (`app/_teile/spielkit.ts` lädt Inhalte und `spiel/js/kit/` nach, die Liste der Inhaltsdateien schreibt `scripts/spiel-kopieren.mjs` nach `public/spiel/content/inhalte.json`).
- Ersetzt oder löscht der Admin einen Spielstand, enden zuerst alle Sitzungen der Person (gespeichert wird nur mit bestehender Sitzung), und der Zeitpunkt steht in `spielstand_verworfen`. `sync.js` verwirft dann beim nächsten Start einen älteren Puffer im Browser.
- Ändert die Lehrkraft Codename oder Figur, steht die Änderung sofort in der DB und zusätzlich in `spielstand.vorgabe`. Ein gerade offenes Spiel bekommt sie beim nächsten Speichern als Antwort, übernimmt sie (`sync.js`) und schickt sie danach mit. Dann wird die Vorgabe geleert.
- Test: `cd ../werkzeuge && TEST_DATABASE_URL=postgres://…/osi_test npm run test:online` (vorher hier `npm run build`). **Leert die Test-Datenbank.**

## Datenschutz
Gespeichert werden nur Benutzername, Passwort-Hash, Klassenzuordnung und Spielstand. Die Sicherung im Admin-Bereich enthält Benutzernamen, Rollen, Klassen und Spielstände (keine Passwörter, Sitzungen oder E-Mail-Platzhalter) – sie ist so schutzbedürftig wie die Datenbank. Better Auth verlangt intern eine E-Mail-Adresse. Die App vergibt dafür eine zufällige Adresse unter der reservierten Domain `.invalid`, die nie angeschrieben wird. Konto löschen entfernt alles (Kaskade). Die Seiten `/datenschutz` und `/impressum` sind **Platzhalter**: Den verbindlichen Text liefert der Betreiber bzw. die Schule.
