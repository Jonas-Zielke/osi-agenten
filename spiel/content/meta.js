/* OSI-Agenten – Stammdaten: Figuren, Ränge, Abzeichen, Handbuch, Challenge, Einsatzliste.
   IDs NIE ändern – sie stecken in den Spielständen. */
window.OSI = {
  version: '2.0.0',
  lehrkraftHash: 'cbqqqlkfkl',
  // Bewusst gestrichene Aufgaben/Schritte: dürfen in alten Spielständen stehen, werden aber NIE wiederverwendet.
  ausgemustert: ['e6-d-minuten'],

  figuren: {
    direktorin: { name: 'Direktorin Albers', bild: 'direktorin.jpg' },
    kalle: { name: 'Kalle (Technik)', bild: 'kalle.jpg' },
    system: { name: 'Einsatzsystem', icon: '📡' },
    brandt: { name: 'Thomas Brandt (IT-Leiter F&O)', bild: 'brandt.jpg' },
    leon: { name: 'Leon Berger (IT-Azubi)', bild: 'v_azubi.jpg' },
    demir: { name: 'Yusuf Demir (Hausmeister)', bild: 'v_hausmeister.jpg' },
    krueger: { name: 'Sabine Krüger (Buchhaltung)', bild: 'v_buchhaltung.jpg' }
  },

  raenge: [
    { name: 'Stufe 1 · Neuzugang', ab: 0 },
    { name: 'Stufe 2 · Probezeit', ab: 100 },
    { name: 'Stufe 3 · Außendienst', ab: 250 },
    { name: 'Stufe 4 · Spezialeinheit', ab: 450 },
    { name: 'Stufe 5 · Sonderermittlung', ab: 700 },
    { name: 'Stufe 6 · Führungsstab', ab: 1100 },
    { name: 'Stufe 7 · Direktionsebene', ab: 1600 },
    { name: 'Stufe 8 · Legende der Einheit 7', ab: 2200 }
  ],

  // Abzeichen: form (medaille = Einsatz geschafft, schild = ohne Tipp, sechseck = Training/Challenge, siegel = geheim),
  // farbe als Design-Token, motiv = SVG-Motiv aus js/kit/abzeichen.js. icon (Emoji) dient nur als Ersatz ohne Motiv.
  abzeichen: [
    { id: 'e0-fertig', form: 'medaille', farbe: 'brand', motiv: 'hut', icon: '🎓', name: 'Grundausbildung', text: 'Einsatz 0 abgeschlossen' },
    { id: 'e1-fertig', form: 'medaille', farbe: 'L1', motiv: 'taschenlampe', icon: '🔦', name: 'Spurensicherung L1', text: 'Einsatz 1 abgeschlossen' },
    { id: 'e0-ohne-tipp', form: 'schild', farbe: 'brand', motiv: 'gehirn', icon: '🧠', name: 'Ohne Kalle', text: 'Einsatz 0 ohne einen einzigen Tipp' },
    { id: 'e1-ohne-tipp', form: 'schild', farbe: 'L1', motiv: 'eule', icon: '🦉', name: 'Selbst ist das Duo', text: 'Einsatz 1 ohne einen einzigen Tipp' },
    { id: 'e2-fertig', form: 'medaille', farbe: 'L2', motiv: 'ausweis', icon: '🪪', name: 'Identitätsprüfung L2', text: 'Einsatz 2 abgeschlossen' },
    { id: 'e2-ohne-tipp', form: 'schild', farbe: 'L2', motiv: 'lupe', icon: '🔍', name: 'Scharfer Blick', text: 'Einsatz 2 ohne einen einzigen Tipp' },
    { id: 'e3-fertig', form: 'medaille', farbe: 'L3', motiv: 'kompass', icon: '🧭', name: 'Wegweiser L3', text: 'Einsatz 3 abgeschlossen' },
    { id: 'e3-ohne-tipp', form: 'schild', farbe: 'L3', motiv: 'karte', icon: '🗺️', name: 'Ortskundig', text: 'Einsatz 3 ohne einen einzigen Tipp' },
    { id: 'e4-fertig', form: 'medaille', farbe: 'L4', motiv: 'tuer', icon: '🚪', name: 'Türsteher L4', text: 'Einsatz 4 abgeschlossen' },
    { id: 'e4-ohne-tipp', form: 'schild', farbe: 'L4', motiv: 'handschlag', icon: '🤝', name: 'Fester Handschlag', text: 'Einsatz 4 ohne einen einzigen Tipp' },
    { id: 'e5-fertig', form: 'medaille', farbe: 'L5', motiv: 'schloss', icon: '🔓', name: 'Fälschung entlarvt L5–7', text: 'Einsatz 5 abgeschlossen' },
    { id: 'e5-ohne-tipp', form: 'schild', farbe: 'L5', motiv: 'schriftrolle', icon: '📜', name: 'Klartext-Leser', text: 'Einsatz 5 ohne einen einzigen Tipp' },
    { id: 'e6-fertig', form: 'medaille', farbe: 'gold', motiv: 'waage', icon: '⚖️', name: 'Fall gelöst', text: 'Finale abgeschlossen – Anklage erhoben' },
    { id: 'e6-ohne-tipp', form: 'schild', farbe: 'gold', motiv: 'gericht', icon: '🏛️', name: 'Wasserdicht', text: 'Finale ohne einen einzigen Tipp' },
    { id: 'verhoer-fertig', form: 'medaille', farbe: 'purple', motiv: 'detektiv', icon: '🕵️', name: 'Akte übergeben', text: 'Abschlussverhör von allen im Duo abgeschlossen' },
    { id: 'sortierer-perfekt', form: 'sechseck', farbe: 'blue', motiv: 'zielscheibe', icon: '🎯', name: 'Scharfschütze', text: 'Schichten-Sortierer ohne Fehler und ohne Tipp' },
    { id: 'training-5', form: 'sechseck', farbe: 'green', motiv: 'hantel', icon: '🏋️', name: 'Trainingsfleißig', text: '5 Schritte beim Üben fehlerfrei gemeistert' },
    { id: 'speed-15', form: 'sechseck', farbe: 'purple', motiv: 'blitz', icon: '⚡', name: 'Flinke Finger', text: '15 Richtige in der Zeit-Challenge' },
    { id: 'speed-25', form: 'sechseck', farbe: 'L2', motiv: 'rakete', icon: '🚀', name: 'Lichtgeschwindigkeit', text: '25 Richtige in der Zeit-Challenge' },
    { id: 'koffein', form: 'siegel', farbe: 'brand', motiv: 'kaffee', icon: '☕', name: 'Koffein-Alarm', text: 'Kalle beim Kaffee gestört', geheim: true },
    { id: 'pizza', form: 'siegel', farbe: 'red', motiv: 'pizza', icon: '🍕', name: 'Internationaler Austausch', text: 'Die englische Eselsbrücke gefunden', geheim: true },
    { id: 'matrix', form: 'siegel', farbe: 'green', motiv: 'matrix', icon: '🟩', name: 'Matrix-Modus', text: 'Im Terminal den echten Befehl für grüne Schrift gefunden', geheim: true }
  ],

  eggs: {
    pizza: { text: '🍕 <b>Kalle:</b> „Die Amis merken sich die Schichten von unten mit <i>Please Do Not Throw Sausage Pizza Away</i> – Physical, Data Link, Network, Transport, Session, Presentation, Application. Unser Kapitän findet seinen Satz besser.“', abzeichen: 'pizza' }
  },

  verdaechtige: [
    { id: 'berger', name: 'Leon Berger', rolle: 'IT-Azubi, 2. Lehrjahr, 19', bild: 'v_azubi.jpg', notiz: 'Hat Serverraum-Karte. Bekam vor 2 Wochen Ärger wegen privater Portscans im Firmennetz.' },
    { id: 'krueger', name: 'Sabine Krüger', rolle: 'Leiterin Buchhaltung, 54', bild: 'v_buchhaltung.jpg', notiz: 'Hat zum Monatsende gekündigt. Streit mit der Geschäftsführung. Kennt die Lohnabrechnung in- und auswendig.' },
    { id: 'seidel', name: 'Marco Seidel', rolle: 'Externer Drucker-Techniker, 38', bild: 'v_drucker.jpg', notiz: 'Wartet alle zwei Wochen die Drucker. Sehr hilfsbereit – „hilft“ auch gern der IT.' },
    { id: 'demir', name: 'Yusuf Demir', rolle: 'Hausmeister, 58', bild: 'v_hausmeister.jpg', notiz: 'Hat den Generalschlüssel. Seit 22 Jahren im Betrieb. Lässt Fremdfirmen in die Technikräume.' }
  ],
  boardAb: 'e0-akte',

  handbuch: [
    { n: 7, name: 'Anwendung', en: 'Application', aufgabe: 'Dienste für Programme bereitstellen', beispiele: 'HTTP, HTTPS, DNS, DHCP, SMTP', pdu: 'Daten' },
    { n: 6, name: 'Darstellung', en: 'Presentation', aufgabe: 'Daten umwandeln: Kodierung, Kompression, Verschlüsselung', beispiele: 'UTF-8, JPEG, (TLS)', pdu: 'Daten' },
    { n: 5, name: 'Sitzung', en: 'Session', aufgabe: 'Sitzungen auf- und abbauen, steuern', beispiele: 'Anmeldung, Sitzungs-IDs', pdu: 'Daten' },
    { n: 4, name: 'Transport', en: 'Transport', aufgabe: 'Ende-zu-Ende-Transport zwischen <b>Anwendungen</b> (Ports)', beispiele: 'TCP, UDP, Portnummern', pdu: 'Segment (TCP) / Datagramm (UDP)' },
    { n: 3, name: 'Vermittlung', en: 'Network', aufgabe: 'Weg durch <b>mehrere Netze</b> finden (logische Adressen)', beispiele: 'IP-Adresse, Router, L3-Switch', pdu: 'Paket' },
    { n: 2, name: 'Sicherung', en: 'Data Link', aufgabe: 'Zustellung <b>im selben Netz</b> (physische Adressen), Fehlererkennung', beispiele: 'MAC-Adresse, Switch, Ethernet, ARP', pdu: 'Frame' },
    { n: 1, name: 'Bitübertragung', en: 'Physical', aufgabe: 'Bits als Signale übertragen', beispiele: 'Kabel, Stecker, Hub, Repeater, Funk', pdu: 'Bits' }
  ],

  challenge: {
    sekunden: 60,
    freiNach: 'e0-sort-switch',
    abzeichen: [{ id: 'speed-15', ab: 15 }, { id: 'speed-25', ab: 25 }],
    // Begriff → Schicht. Nur Inhalte, die das Spiel vermittelt (Vorgeschmack auf spätere Einsätze erlaubt),
    // nichts, was laut Mindestanforderungen nur angeteasert wird (WLAN, TLS, VLAN, NAT, Firewall). Je Begriff genau eine Schicht.
    // Weitere Begriffe können Inhaltsdateien mit OSI.challengeBegriffe([...]) ergänzen (siehe docs/inhalte.md).
    pool: [
      // L1 · Bitübertragung
      { t: 'Hub', l: 1 }, { t: 'Repeater', l: 1 }, { t: 'Bits', l: 1 }, { t: 'Patchkabel', l: 1 }, { t: 'RJ45-Stecker', l: 1 },
      { t: 'Glasfaser', l: 1 }, { t: 'Funkwellen', l: 1 }, { t: 'Spannung auf der Leitung', l: 1 }, { t: 'Lichtimpulse', l: 1 },
      { t: 'Medienkonverter', l: 1 }, { t: 'Patchfeld', l: 1 },
      { t: 'Link-LED', l: 1 }, { t: 'Kabeltester', l: 1 }, { t: 'Netzwerkdose', l: 1 }, { t: 'Lichtwellenleiter (LWL)', l: 1 },
      { t: 'Kupferkabel', l: 1 }, { t: 'Singlemode-Faser', l: 1 }, { t: 'Multimode-Faser', l: 1 }, { t: 'Switch-Port 23', l: 1 },
      { t: '100 Mbit/s am Port', l: 1 }, { t: 'Elektromagnetische Störung', l: 1 },
      // L2 · Sicherung
      { t: 'Switch', l: 2 }, { t: 'MAC-Adresse', l: 2 }, { t: 'Frame', l: 2 }, { t: 'Ethernet-Header', l: 2 },
      { t: 'Ethernet-Trailer (FCS)', l: 2 }, { t: 'MAC-Adresstabelle', l: 2 }, { t: 'dc:a6:32:5e:19:7a', l: 2 },
      { t: 'ARP', l: 2 }, { t: 'arp -a', l: 2 }, { t: 'ARP-Cache', l: 2 }, { t: 'ARP-Spoofing', l: 2 }, { t: 'OUI (Herstellerkennung)', l: 2 },
      { t: 'ff:ff:ff:ff:ff:ff', l: 2 }, { t: 'Ziel-MAC im Frame', l: 2 }, { t: 'Ethernet', l: 2 }, { t: '00:15:5d:0a:32:14', l: 2 },
      // L3 · Vermittlung
      { t: 'Router', l: 3 }, { t: 'L3-Switch', l: 3 }, { t: 'IP-Adresse', l: 3 }, { t: 'Paket', l: 3 }, { t: 'Subnetzmaske', l: 3 },
      { t: 'Standardgateway', l: 3 }, { t: 'Routing-Tabelle', l: 3 }, { t: '192.168.50.10', l: 3 },
      { t: 'ping', l: 3 }, { t: 'tracert', l: 3 }, { t: 'ipconfig', l: 3 }, { t: 'route print', l: 3 }, { t: 'Hop', l: 3 },
      { t: 'TTL', l: 3 }, { t: 'Netzanteil', l: 3 }, { t: '255.255.255.0', l: 3 }, { t: '192.168.50.66', l: 3 },
      { t: '198.51.100.23', l: 3 }, { t: 'Standardroute 0.0.0.0', l: 3 }, { t: 'IPv4', l: 3 },
      // L4 · Transport
      { t: 'Portnummer', l: 4 }, { t: 'TCP', l: 4 }, { t: 'UDP', l: 4 }, { t: 'Segment', l: 4 }, { t: 'Datagramm', l: 4 },
      { t: 'Port 443', l: 4 }, { t: 'Port 53', l: 4 }, { t: '3-Wege-Handshake', l: 4 }, { t: 'SYN, ACK', l: 4 },
      { t: 'Port 22', l: 4 }, { t: 'Port 80', l: 4 },
      { t: 'netstat', l: 4 }, { t: 'Socket (IP + Port)', l: 4 }, { t: 'Quellport', l: 4 }, { t: 'UDP-Port 67', l: 4 }, { t: 'Port 3389', l: 4 },
      { t: 'Bekannte Ports 0–1023', l: 4 }, { t: 'Dynamische Ports', l: 4 }, { t: 'SYN', l: 4 }, { t: 'RST, ACK', l: 4 },
      { t: 'FIN', l: 4 }, { t: 'Portscan', l: 4 },
      // L5 · Sitzung
      { t: 'Sitzung auf-/abbauen', l: 5 }, { t: 'Sitzungs-ID (Cookie)', l: 5 }, { t: 'Anmelden / Abmelden', l: 5 },
      { t: 'Angemeldet bleiben', l: 5 }, { t: 'Sitzung läuft ab', l: 5 }, { t: 'Sitzungs-ID ungültig machen', l: 5 }, { t: 'Alle Sitzungen beenden', l: 5 },
      // L6 · Darstellung
      { t: 'Zeichenkodierung UTF-8', l: 6 }, { t: 'Bildformat JPEG', l: 6 }, { t: 'Verschlüsselung', l: 6 }, { t: 'ASCII', l: 6 },
      { t: 'URL-Kodierung %40', l: 6 }, { t: 'Kompression', l: 6 }, { t: '„Ã¼“ statt „ü“', l: 6 }, { t: 'ü = Bytes C3 BC', l: 6 },
      // L7 · Anwendung
      { t: 'HTTP', l: 7 }, { t: 'HTTPS', l: 7 }, { t: 'DNS', l: 7 }, { t: 'DHCP', l: 7 }, { t: 'SMTP (E-Mail)', l: 7 },
      { t: 'Webbrowser-Protokoll', l: 7 }, { t: 'SSH', l: 7 }, { t: 'HTTP-POST', l: 7 }, { t: 'DNS-Antwort', l: 7 }, { t: 'Statuscode 404', l: 7 },
      { t: 'nslookup', l: 7 }, { t: 'Statuscode 200', l: 7 }, { t: 'HTTP-GET', l: 7 }, { t: 'DHCP-Discover', l: 7 }, { t: 'DHCP-Offer', l: 7 },
      { t: 'DHCP-Lease', l: 7 }, { t: 'lohn.fo-logistik.intern', l: 7 }, { t: 'HTTP-Anfrage (Request)', l: 7 }, { t: 'Seite ohne Schloss (HTTP)', l: 7 }
    ]
  },

  // Einsatzliste = Kapitel der Kletterkarte (von unten nach oben). farbe: Design-Token (L1–L7, brand, gold, purple), icon: Kapitel-Symbol.
  einsaetze: [
    { id: 'e0', farbe: 'brand', icon: '🎓', nrText: 'EINSATZ 0', titel: 'Grundausbildung', untertitel: 'Schichten, Kapselung, Nummern – und ein Alarm', status: 'offen', steps: [] },
    { id: 'e1', farbe: 'L1', icon: '🔌', nrText: 'EINSATZ 1', titel: 'L1 – Spuren am Kabel', untertitel: 'Bitübertragung im Serverraum', status: 'offen', steps: [] },
    { id: 'e2', farbe: 'L2', icon: '🪪', nrText: 'EINSATZ 2', titel: 'L2 – Gestohlene Identität', untertitel: 'Wer ist hier wer?', status: 'offen', steps: [] },
    { id: 'e3', farbe: 'L3', icon: '🧭', nrText: 'EINSATZ 3', titel: 'L3 – Falsche Wegweiser', untertitel: 'Wohin gehen die Pakete wirklich?', status: 'offen', steps: [] },
    { id: 'e4', farbe: 'L4', icon: '🚪', nrText: 'EINSATZ 4', titel: 'L4 – Offene Türen', untertitel: 'Welche Dienste lauschen?', status: 'offen', steps: [] },
    { id: 'e5', farbe: 'L5', icon: '🔓', nrText: 'EINSATZ 5', titel: 'L5–7 – Die Fälschung', untertitel: 'Namen, Seiten, Schlösser', status: 'offen', steps: [] },
    { id: 'e6', farbe: 'gold', icon: '⚖️', nrText: 'FINALE', titel: 'Die Anklage', untertitel: 'Wer war es – und wie beweist ihr es?', status: 'offen', steps: [] },
    // Abschlussverhör: nur Diagnose, zählt nicht zum Fall-Fortschritt (diagnose: true), Antworten in save.verhoer
    { id: 'verhoer', farbe: 'purple', icon: '🕵️', nrText: 'ABSCHLUSS', titel: 'Das Verhör', untertitel: 'Einzeln, ohne Kalle, ohne Punkte', status: 'offen', diagnose: true, steps: [] }
  ],

  // ---------------------------------------------------------------- Netz von F&O (für Terminal- und Wireshark-Ansichten)
  netz: {
    hosts: {
      router: { name: 'Router (Gateway)', ip: '192.168.50.1', mac: '00:a0:57:2b:7c:01' },
      dc: { name: 'SRV-DC01', ip: '192.168.50.10', mac: '00:15:5d:0a:32:10' },
      file: { name: 'SRV-FILE', ip: '192.168.50.12', mac: '00:15:5d:0a:32:12' },
      lohn: { name: 'SRV-LOHN', ip: '192.168.50.20', mac: '00:15:5d:0a:32:14' },
      pi: { name: 'Fremdgerät', ip: '192.168.50.66', mac: 'dc:a6:32:5e:19:7a' },
      buch1: { name: 'PC-BUCH-01', ip: '192.168.50.121', mac: '18:66:da:4a:0f:e2' },
      buch3: { name: 'PC-BUCH-03', ip: '192.168.50.123', mac: '18:66:da:4a:11:9c' },
      vers1: { name: 'PC-VERSAND-01', ip: '192.168.50.131', mac: '18:66:da:4b:07:5d' },
      vers2: { name: 'PC-VERSAND-02', ip: '192.168.50.140', mac: '18:66:da:4b:22:31' },
      dispo1: { name: 'PC-DISPO-01', ip: '192.168.50.141', mac: '18:66:da:4b:02:17' },
      kalle: { name: 'Laptop Kalle (Switch-Port 22)', ip: '192.168.50.99', mac: '18:66:da:4c:77:01' },
      tunnel: { name: 'Server im Internet (Gegenstelle des Tunnels)', ip: '198.51.100.23' },
      webmail: { name: 'Webmail-Anbieter im Internet', ip: '203.0.113.80' }
    },
    // Wireshark löst die ersten drei Bytes (OUI) standardmäßig in Herstellernamen auf
    oui: { '00:a0:57': 'LANCOM', '00:15:5d': 'Microsoft', 'dc:a6:32': 'RaspberryPi', '18:66:da': 'Dell' },
    macName(mac) {
      if (mac === 'ff:ff:ff:ff:ff:ff') return 'Broadcast';
      const h = this.oui[mac.slice(0, 8)];
      return h ? `${h}_${mac.slice(9)}` : mac;
    },
    // Ausgabe von ping wie in der deutschen Windows-Eingabeaufforderung.
    // antworten: { 'IP': { ttl, ms } } · eigene: IP des PCs (für „Zielhost nicht erreichbar“)
    ping(ziel, antworten, eigene) {
      const ipOk = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ziel) && ziel.split('.').every(x => +x <= 255);
      if (!ipOk) return `Ping-Anforderung konnte Host "${ziel}" nicht finden. Überprüfen Sie den Namen, und versuchen Sie es erneut.\n(Simulation: Namen werden hier nicht aufgelöst – nutzt bitte die IP-Adresse.)\n`;
      const a = antworten[ziel];
      let zeilen, empf;
      if (a) { zeilen = Array(4).fill(`Antwort von ${ziel}: Bytes=32 Zeit${a.ms ? '=' + a.ms + 'ms' : '<1ms'} TTL=${a.ttl}`); empf = 4; }
      else if (ziel.startsWith('192.168.50.')) { zeilen = Array(4).fill(`Antwort von ${eigene}: Zielhost nicht erreichbar.`); empf = 4; }
      else { zeilen = Array(4).fill('Zeitüberschreitung der Anforderung.'); empf = 0; }
      let s = `\nPing wird ausgeführt für ${ziel} mit 32 Bytes Daten:\n${zeilen.join('\n')}\n\nPing-Statistik für ${ziel}:\n    Pakete: Gesendet = 4, Empfangen = ${empf}, Verloren = ${4 - empf}\n    (${(4 - empf) * 25}% Verlust),`;
      if (a) s += `\nCa. Zeitangaben in Millisek.:\n    Minimum = ${a.ms || 0}ms, Maximum = ${a.ms ? a.ms + 1 : 0}ms, Mittelwert = ${a.ms || 0}ms`;
      return s + '\n';
    },
    // Ausgabe von tracert. hops: Liste von IP-Adressen (letzte = Ziel)
    tracert(ziel, hops) {
      const ms = i => i < 2 ? '<1 ms' : `${(i * 3 + 2)} ms`;
      return `\nRoutenverfolgung zu ${ziel} über maximal 30 Hops\n\n` +
        hops.map((h, i) => `  ${String(i + 1).padStart(2)}    ${ms(i).padStart(5)}    ${ms(i).padStart(5)}    ${ms(i).padStart(5)}  ${h}`).join('\n') +
        '\n\nAblaufverfolgung beendet.\n';
    },
    // Baut eine Liste von Frames mit Nummern, Wireshark-Spalten, Detailbaum und Filterfeldern.
    // Jeder Eintrag: { t: Sekunden seit Start, typ: 'arp'|'icmp'|'tcp'|'dns'|'dhcp', src/dst: MAC, ... }
    mitschnitt(eintraege, datum) {
      const N = this;
      const fcs = nr => '0x' + ((nr * 2654435761 + 0x5bd1e995) >>> 0).toString(16).padStart(8, '0');
      const ethNode = (src, dst, typ, nr) => ({ t: `Ethernet II, Src: ${N.macName(src)} (${src}), Dst: ${N.macName(dst)} (${dst})`,
        kids: [`Destination: ${N.macName(dst)} (${dst})`, `Source: ${N.macName(src)} (${src})`, `Type: ${typ}`, `Frame check sequence: ${fcs(nr)} [correct]`] });
      const ipNode = (src, dst, proto, ttl) => ({ t: `Internet Protocol Version 4, Src: ${src}, Dst: ${dst}`,
        kids: ['Version: 4', `Time to Live: ${ttl}`, `Protocol: ${proto}`, `Source Address: ${src}`, `Destination Address: ${dst}`] });
      const udpNode = (sp, dp, len) => ({ t: `User Datagram Protocol, Src Port: ${sp}, Dst Port: ${dp}`, kids: [`Source Port: ${sp}`, `Destination Port: ${dp}`, `Length: ${len}`] });
      const DHCP_TYP = { Discover: 1, Offer: 2, Request: 3, ACK: 5 };
      return eintraege.map((e, i) => {
        const nr = i + 1;
        const p = { nr, zeit: e.t.toFixed(6), laenge: 60, protos: ['frame', 'eth'], felder: { 'frame.number': String(nr), 'eth.src': e.src, 'eth.dst': e.dst }, baum: [], warn: !!e.warn };
        const frameNode = protos => ({ t: `Frame ${nr}: ${p.laenge} bytes on wire (${p.laenge * 8} bits), ${p.laenge} bytes captured`,
          kids: [`Arrival Time: ${datum}`, `Frame Number: ${nr}`, `Frame Length: ${p.laenge} bytes (${p.laenge * 8} bits)`, `[Protocols in frame: ${protos}]`] });
        if (e.typ === 'arp') {
          const req = e.op === 1;
          p.protos.push('arp'); p.prot = 'ARP'; p.laenge = 60;
          p.quelle = N.macName(e.src); p.ziel = N.macName(e.dst);
          p.info = req ? `Who has ${e.tip}? Tell ${e.sip}` : `${e.sip} is at ${e.src}${e.warn ? ` (duplicate use of ${e.sip} detected!)` : ''}`;
          Object.assign(p.felder, { 'eth.type': '0x0806', 'arp.opcode': String(e.op), 'arp.src.hw_mac': e.src, 'arp.src.proto_ipv4': e.sip, 'arp.dst.hw_mac': req ? '00:00:00:00:00:00' : e.dst, 'arp.dst.proto_ipv4': e.tip });
          const arpKids = ['Hardware type: Ethernet (1)', 'Protocol type: IPv4 (0x0800)', `Opcode: ${req ? 'request (1)' : 'reply (2)'}`, `Sender MAC address: ${N.macName(e.src)} (${e.src})`, `Sender IP address: ${e.sip}`,
            `Target MAC address: ${req ? '00:00:00_00:00:00 (00:00:00:00:00:00)' : `${N.macName(e.dst)} (${e.dst})`}`, `Target IP address: ${e.tip}`];
          if (e.warn) arpKids.push(`[Duplicate IP address detected for ${e.sip} (${e.src}) - also in use by ${e.warn.mac} (frame ${e.warn.frame})]`, '[Expert Info (Warning/Sequence): Duplicate IP address configured]');
          p.baum = [frameNode('eth:ethertype:arp'), ethNode(e.src, e.dst, 'ARP (0x0806)', nr), { t: `Address Resolution Protocol (${req ? 'request' : 'reply'})`, kids: arpKids }];
          return p;
        }
        p.quelle = e.sip; p.ziel = e.dip;
        Object.assign(p.felder, { 'eth.type': '0x0800', 'ip.src': e.sip, 'ip.dst': e.dip, 'ip.ttl': String(e.ttl || 128) });
        p.protos.push('ip');
        if (e.typ === 'icmp' && e.icmp !== 3) {
          const req = e.icmp === 8;
          p.protos.push('icmp'); p.prot = 'ICMP'; p.laenge = 74;
          p.felder['icmp.type'] = String(e.icmp);
          p.info = `Echo (ping) ${req ? 'request' : 'reply'}  id=0x0001, seq=${e.seq || 17}/${(e.seq || 17) * 256}, ttl=${e.ttl || 128}`;
          p.baum = [frameNode('eth:ethertype:ip:icmp:data'), ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'ICMP (1)', e.ttl || 128),
            { t: 'Internet Control Message Protocol', kids: [`Type: ${e.icmp} (Echo (ping) ${req ? 'request' : 'reply'})`, 'Code: 0', 'Identifier (BE): 1 (0x0001)', `Sequence Number (BE): ${e.seq || 17}`, 'Data (32 bytes)'] }];
        } else if (e.typ === 'icmp' && e.icmp === 3) {
          // Antwort auf ein UDP-Datagramm an einen geschlossenen Port
          p.protos.push('icmp'); p.prot = 'ICMP'; p.laenge = 70;
          Object.assign(p.felder, { 'icmp.type': '3', 'icmp.code': '3' });
          p.info = 'Destination unreachable (Port unreachable)';
          p.baum = [frameNode('eth:ethertype:ip:icmp:ip:udp'), ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'ICMP (1)', e.ttl || 128),
            { t: 'Internet Control Message Protocol', kids: ['Type: 3 (Destination unreachable)', 'Code: 3 (Port unreachable)', `Internet Protocol Version 4, Src: ${e.dip}, Dst: ${e.sip}`, `User Datagram Protocol, Src Port: ${e.usp}, Dst Port: ${e.udp}`] }];
        } else if (e.typ === 'udp') {
          p.protos.push('udp'); p.prot = 'UDP'; p.laenge = 60;
          Object.assign(p.felder, { 'udp.srcport': String(e.sp), 'udp.dstport': String(e.dp) });
          p.info = `${e.sp} → ${e.dp} Len=${e.len || 0}`;
          p.baum = [frameNode('eth:ethertype:ip:udp'), ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'UDP (17)', e.ttl || 128), udpNode(e.sp, e.dp, 8 + (e.len || 0))];
        } else if (['tcp', 'http', 'tls', 'ssh'].includes(e.typ)) {
          // TCP mit Flags; optional darüber HTTP (Klartext), TLS oder SSH (verschlüsselt)
          const flags = e.flags || 'PSH, ACK', F = flags.split(', ');
          const hex = F.reduce((a, f) => a + ({ FIN: 1, SYN: 2, RST: 4, PSH: 8, ACK: 16 }[f] || 0), 0);
          const syn = F.includes('SYN'), len = e.len || 0, seq = e.seq || (syn ? 0 : 1), ack = e.ack || 1;
          p.protos.push('tcp'); p.prot = 'TCP'; p.laenge = syn ? 74 : Math.max(60, 54 + len);
          Object.assign(p.felder, { 'tcp.srcport': String(e.sp), 'tcp.dstport': String(e.dp),
            'tcp.flags.fin': F.includes('FIN') ? '1' : '0', 'tcp.flags.syn': syn ? '1' : '0', 'tcp.flags.reset': F.includes('RST') ? '1' : '0',
            'tcp.flags.push': F.includes('PSH') ? '1' : '0', 'tcp.flags.ack': F.includes('ACK') ? '1' : '0' });
          const win = syn ? 64240 : F.includes('RST') ? 0 : (e.win || 1026);
          const ackTxt = F.includes('ACK') ? ` Ack=${syn ? 1 : ack}` : '';
          p.info = `${e.sp} → ${e.dp} [${flags}] Seq=${seq}${ackTxt} Win=${win} Len=${len}${syn ? ' MSS=1460 SACK_PERM WS=128' : ''}`;
          const bit = (maske, kurz, name) => `    ${maske.replace('x', F.includes(kurz) ? '1' : '0')} = ${name}: ${F.includes(kurz) ? 'Set' : 'Not set'}`;
          const tcpNode = { t: `Transmission Control Protocol, Src Port: ${e.sp}, Dst Port: ${e.dp}, Seq: ${seq}${ackTxt ? ', Ack: ' + (syn ? 1 : ack) : ''}, Len: ${len}`,
            kids: [`Source Port: ${e.sp}`, `Destination Port: ${e.dp}`, `[TCP Segment Len: ${len}]`, `Flags: 0x${hex.toString(16).padStart(3, '0')} (${flags})`,
              bit('.... ...x ....', 'ACK', 'Acknowledgment'), bit('.... .... x...', 'PSH', 'Push'), bit('.... .... .x..', 'RST', 'Reset'),
              bit('.... .... ..x.', 'SYN', 'Syn'), bit('.... .... ...x', 'FIN', 'Fin')] };
          p.baum = [null, ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'TCP (6)', e.ttl || 128), tcpNode];
          let stapel = 'eth:ethertype:ip:tcp' + (len && e.typ === 'tcp' ? ':data' : '');
          if (e.typ === 'http') {
            p.protos.push('http'); p.prot = 'HTTP'; stapel += ':http';
            const f = p.felder;
            if (e.methode) { f['http.request.method'] = e.methode; f['http.request.uri'] = e.uri; p.info = `${e.methode} ${e.uri} HTTP/1.1${e.form ? '  (application/x-www-form-urlencoded)' : ''}`; }
            else { f['http.response.code'] = String(e.code); p.info = `HTTP/1.1 ${e.code} ${e.status}${e.html ? '  (text/html)' : ''}`; }
            if (e.host) f['http.host'] = e.host;
            if (e.cookie) f['http.cookie'] = e.cookie;
            if (e.setCookie) f['http.set_cookie'] = e.setCookie;
            p.baum.push({ t: 'Hypertext Transfer Protocol', kids: e.zeilen.map(z => z + '\\r\\n').concat(['\\r\\n']) });
            if (e.form) { stapel += ':urlencoded-form'; p.baum.push({ t: 'HTML Form URL Encoded: application/x-www-form-urlencoded', kids: e.form.map(([k, v]) => `Form item: "${k}" = "${v}"`) }); }
            if (e.html) { stapel += ':data-text-lines'; p.baum.push({ t: `Line-based text data: text/html (${e.html.length} lines)`, kids: e.html }); }
          } else if (e.typ === 'tls') {
            p.protos.push('tls'); p.prot = 'TLSv1.3'; p.info = 'Application Data'; stapel += ':tls';
            const bytes = Array.from({ length: 12 }, (_, i) => ((nr * 131 + i * 71) % 256).toString(16).padStart(2, '0')).join('');
            p.baum.push({ t: 'Transport Layer Security', kids: ['TLSv1.3 Record Layer: Application Data Protocol: Hypertext Transfer Protocol', 'Opaque Type: Application Data (23)', 'Version: TLS 1.2 (0x0303)', `Length: ${len - 5}`, `Encrypted Application Data: ${bytes}…`] });
          } else if (e.typ === 'ssh') {
            p.protos.push('ssh'); p.prot = 'SSHv2'; p.info = `${e.client ? 'Client' : 'Server'}: Encrypted packet (len=${len})`; stapel += ':ssh';
            const bytes = Array.from({ length: 10 }, (_, i) => ((nr * 97 + i * 53) % 256).toString(16).padStart(2, '0')).join('');
            p.baum.push({ t: 'SSH Protocol', kids: [`Packet Length (encrypted): ${bytes.slice(0, 8)}`, `Encrypted Packet: ${bytes}…`] });
          }
          p.baum[0] = frameNode(stapel);
        } else if (e.typ === 'dns') {
          const antwort = !!e.antwort;
          p.protos.push('udp', 'dns'); p.prot = 'DNS'; p.laenge = antwort ? 102 : 86;
          const sp = antwort ? 53 : e.sp, dp = antwort ? e.sp : 53;
          Object.assign(p.felder, { 'udp.srcport': String(sp), 'udp.dstport': String(dp), 'dns.qry.name': e.name });
          p.info = `Standard query ${antwort ? 'response ' : ''}${e.id} A ${e.name}${antwort ? ' A ' + e.antwort : ''}`;
          p.baum = [frameNode('eth:ethertype:ip:udp:dns'), ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'UDP (17)', e.ttl || 128), udpNode(sp, dp, p.laenge - 34),
            { t: `Domain Name System (${antwort ? 'response' : 'query'})`, kids: [`Transaction ID: ${e.id}`, 'Questions: 1', `Queries: ${e.name}: type A, class IN`].concat(antwort ? [`Answers: ${e.name}: type A, class IN, addr ${e.antwort}`] : []) }];
        } else if (e.typ === 'dhcp') {
          const vomServer = e.dhcp === 'Offer' || e.dhcp === 'ACK';
          p.protos.push('udp', 'dhcp'); p.prot = 'DHCP'; p.laenge = 342;
          const sp = vomServer ? 67 : 68, dp = vomServer ? 68 : 67;
          Object.assign(p.felder, { 'udp.srcport': String(sp), 'udp.dstport': String(dp), 'dhcp.option.dhcp': String(DHCP_TYP[e.dhcp]), 'dhcp.hw.mac_addr': e.client });
          if (e.server) p.felder['dhcp.option.dhcp_server_id'] = e.server;
          if (e.router) p.felder['dhcp.option.router'] = e.router;
          if (e.dns) p.felder['dhcp.option.domain_name_server'] = e.dns;
          if (e.your) p.felder['dhcp.ip.your'] = e.your;
          p.info = `DHCP ${e.dhcp} - Transaction ID ${e.xid}`;
          const kids = [`Message type: ${vomServer ? 'Boot Reply (2)' : 'Boot Request (1)'}`, `Transaction ID: ${e.xid}`, 'Client IP address: 0.0.0.0', `Your (client) IP address: ${e.your || '0.0.0.0'}`,
            `Client MAC address: ${N.macName(e.client)} (${e.client})`, `Option: (53) DHCP Message Type (${e.dhcp})`];
          if (e.server) kids.push(`Option: (54) DHCP Server Identifier (${e.server})`);
          if (e.wunsch) kids.push(`Option: (50) Requested IP Address (${e.wunsch})`);
          if (e.host) kids.push(`Option: (12) Host Name: ${e.host}`);
          if (e.lease) kids.push(`Option: (51) IP Address Lease Time (${e.lease})`);
          if (e.maske) kids.push(`Option: (1) Subnet Mask (${e.maske})`);
          if (e.router) kids.push(`Option: (3) Router (${e.router})`);
          if (e.dns) kids.push(`Option: (6) Domain Name Server (${e.dns})`);
          kids.push('Option: (255) End');
          p.baum = [frameNode('eth:ethertype:ip:udp:dhcp'), ethNode(e.src, e.dst, 'IPv4 (0x0800)', nr), ipNode(e.sip, e.dip, 'UDP (17)', e.ttl || 128), udpNode(sp, dp, 308),
            { t: `Dynamic Host Configuration Protocol (${e.dhcp})`, kids }];
        }
        return p;
      });
    }
  },

  // Hilfsfunktion: Schichten-Stapel als SVG (Farben über CSS-Klassen/Tokens, damit Hell und Dunkel passen)
  svgStapel(opts = {}) {
    const rows = this.handbuch;
    const h = 46, w = 640;
    const k = { 1: 'Bei', 2: 'Sturm', 3: 'verlieren', 4: 'Tanker', 5: 'schnell', 6: 'die', 7: 'Anker' };
    let s = `<svg viewBox="0 0 ${w} ${rows.length * (h + 6)}" width="${w}" role="img" aria-label="Die sieben Schichten des OSI-Modells" font-family="Segoe UI, Arial, sans-serif">`;
    rows.forEach((r, i) => {
      const y = i * (h + 6);
      s += `<rect class="svg-box" x="1" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="9" style="stroke:var(--L${r.n})" stroke-width="2"/>
        <rect x="0" y="${y}" width="70" height="${h}" rx="9" style="fill:var(--L${r.n})"/>
        <text class="svg-on" x="35" y="${y + 31}" text-anchor="middle" font-size="22" font-weight="800">L${r.n}</text>
        <text class="svg-text" x="86" y="${y + 20}" font-size="15" font-weight="700">${r.name}</text>
        <text class="svg-muted" x="86" y="${y + 38}" font-size="12">${r.en}</text>
        <text class="svg-text" x="250" y="${y + 28}" font-size="13">${r.beispiele}</text>`;
      if (opts.eselsbruecke) s += `<text x="${w - 18}" y="${y + 31}" text-anchor="end" font-size="17" font-style="italic" font-weight="800" style="fill:var(--L${r.n})">${k[r.n]}</text>`;
    });
    return s + '</svg>';
  }
};
