/* OSI-Agenten – Online-Baustein: verbindet das Spiel mit dem Konto auf dem Server.
   Wird NUR in der Online-Fassung geladen (web/scripts/spiel-kopieren.mjs fügt es vor js/game/main.js ein),
   nie in der Lite-Version (ZIP, file://, GitHub Pages). Setzt OSIGame.online.
   Server-Schnittstelle (web/app/api): GET /api/ich · GET|PUT|POST /api/spielstand · GET /api/klasse/rangliste */
(function () {
  'use strict';
  const G = window.OSIGame, S = window.OSIStore, Kit = window.OSIKit;
  const API = '/api';
  const VERZOEGERUNG = 1500; // ms Ruhe, bevor gespeichert wird – mehrere Antworten landen in einer Anfrage
  let timer = null, laeuft = false, offen = null, versuche = 0;

  const zurAnmeldung = () => { location.href = '/anmelden?weiter=' + encodeURIComponent(location.pathname); };
  async function json(url, opt = {}) {
    const r = await fetch(url, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opt));
    if (r.status === 401) { zurAnmeldung(); throw new Error('401'); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // Kennzahlen für Rangliste und Zentrale – der Server speichert sie neben dem Spielstand
  function meta(save) {
    const f = Kit.progress.front(save);
    return { codename: save.duo.codename, avatar: save.duo.avatar, punkte: Kit.progress.punkte(save), front: f ? f.st.id : null, fall: Kit.progress.fallFortschritt(save) };
  }
  const nutzlast = save => JSON.stringify({ daten: save, meta: meta(save) });

  // Puffer im Browser (je Konto): sichert bei Funkloch und wird beim nächsten Start nachgeholt
  const pufferKey = () => 'osiagenten.online.' + O.benutzer.id;
  function pufferLesen() {
    try { const t = localStorage.getItem(pufferKey()); return t ? S.migrate(JSON.parse(t)) : null; } catch (e) { return null; }
  }

  function status(z) {
    if (O.status === z) return;
    O.status = z;
    if (G.save && G.renderTopbar) G.renderTopbar();
  }

  // Die Lehrkraft hat Codename oder Figur geändert: übernehmen und beim nächsten Speichern mitschicken
  function vorgabeUebernehmen(v) {
    const duo = G.save && G.save.duo;
    if (!duo) return;
    if (typeof v.codename === 'string') duo.codename = v.codename;
    if (typeof v.avatar === 'string' && Kit.avatars.liste.some(a => a.id === v.avatar)) duo.avatar = v.avatar;
    O.puffer(G.save);
    O.speichern(G.save);
    if (G.view === 'hub') G.render(); else if (G.renderTopbar) G.renderTopbar(); // mitten in einer Aufgabe nichts neu aufbauen
    G.toast(`✏️ <b>Eure Lehrkraft hat euer Profil geändert.</b><br>Ihr seid jetzt Duo ${Kit.util.esc(duo.codename)}.`, 4200, 'ok');
  }

  async function senden() {
    if (!offen || laeuft) return;
    const save = offen;
    offen = null; laeuft = true;
    status('laeuft');
    try {
      const r = await json(API + '/spielstand', { method: 'PUT', body: nutzlast(save) });
      versuche = 0;
      if (r.vorgabe) vorgabeUebernehmen(r.vorgabe);
      status(offen ? 'laeuft' : 'ok');
    } catch (e) {
      if (e.message === '401') return;
      offen = offen || save;
      versuche++;
      status('fehler');
      clearTimeout(timer);
      timer = setTimeout(senden, Math.min(30000, 2000 * Math.pow(2, versuche)));
    } finally {
      laeuft = false;
      if (offen && O.status !== 'fehler') { clearTimeout(timer); timer = setTimeout(senden, 300); }
    }
  }

  const O = G.online = {
    benutzer: null, status: 'ok', istLehrkraft: false,
    kontoUrl: '/konto', lehrkraftUrl: '/lehrkraft',

    async start() {
      document.getElementById('app').innerHTML = '<div class="card">Anmeldung wird geprüft …</div>';
      try {
        const ich = await json(API + '/ich');
        O.benutzer = ich.benutzer;
        O.istLehrkraft = ich.benutzer.istLehrkraft;
        const r = await json(API + '/spielstand');
        let save = r.daten ? S.migrate(r.daten) : null;
        // Der neuere Stand gewinnt (z. B. wenn beim letzten Mal das Netz weg war)
        const lokal = pufferLesen();
        if (lokal && (!save || lokal.id === save.id) && (!save || Date.parse(lokal.aktualisiert) > Date.parse(save.aktualisiert))) save = lokal;
        if (save) {
          save.duo.agenten = [O.benutzer.name];
          G.save = save;
          if (lokal === save) O.speichern(save);
          G.render();
        } else G.renderOnlineStart();
      } catch (e) {
        if (e.message === '401') return;
        document.getElementById('app').innerHTML = '<div class="card"><h2>Keine Verbindung</h2><p>Der Server ist gerade nicht erreichbar. Bitte die Seite gleich neu laden.</p><p class="small muted">Ohne Internet könnt ihr die Lite-Version spielen.</p></div>';
      }
    },
    puffer(save) {
      try { localStorage.setItem(pufferKey(), JSON.stringify(save)); return true; } catch (e) { return false; }
    },
    speichern(save) {
      offen = save;
      clearTimeout(timer);
      timer = setTimeout(senden, VERZOEGERUNG);
    },
    async klasse() {
      return (await json(API + '/klasse/rangliste')).liste;
    },
    async abmelden() {
      clearTimeout(timer);
      await senden();
      try { localStorage.removeItem(pufferKey()); } catch (e) { /* egal */ }
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      location.href = '/';
    }
  };

  // Beim Verlassen der Seite den letzten Stand noch sicher absenden
  addEventListener('pagehide', () => {
    if (offen && navigator.sendBeacon) { navigator.sendBeacon(API + '/spielstand', new Blob([nutzlast(offen)], { type: 'application/json' })); offen = null; }
  });
  addEventListener('online', () => { if (O.status === 'fehler') { clearTimeout(timer); senden(); } });
})();
