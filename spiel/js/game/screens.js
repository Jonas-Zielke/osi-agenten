/* OSI-Agenten – Bildschirme: Start, Karte (Übersicht) und der Rahmen um jeden Schritt. */
(function () {
  'use strict';
  const G = window.OSIGame, OSI = window.OSI, S = window.OSIStore, A = window.OSIAudio, Kit = window.OSIKit;
  const P = Kit.progress, AV = Kit.avatars, MAP = Kit.map, ABZ = Kit.abzeichen;
  const { esc, $, $$ } = Kit.util;
  const app = () => $('#app');

  const heroHtml = () => {
    const parade = ['a02', 'a07', 'a01', 'a10', 'a06'].map((id, i) => `<span class="parade-figur" style="--i:${i}">${AV.svg(id, { titel: false })}</span>`).join('');
    return `<div class="start-hero">
          <img class="start-bild" src="img/hq.jpg" alt="Einsatzzentrale der Einheit 7">
          <div class="start-parade" aria-hidden="true">${parade}</div>
          <div class="start-text"><div class="eyebrow">Einheit 7 · Abteilung für Netzwerkforensik</div>
            <h1>Operation <b>Lohnzettel</b></h1><p>Ein Fall in sieben Schichten. Klettert Schicht für Schicht nach oben – von L1 bis L7.</p></div>
        </div>`;
  };

  // ---------------------------------------------------------------- Start
  function renderStart(forceNeu) {
    G.view = 'start';
    G.renderTopbar();
    const lokal = !forceNeu && S.loadLocal();
    let avatar = AV.zufall();
    const lsWarn = S.localAvailable() ? '' : `<div class="warnbar">⚠ Euer Browser erlaubt hier kein automatisches Speichern. Das Spiel funktioniert trotzdem – <b>exportiert euren Spielstand aber am Ende unbedingt!</b></div>`;
    const weiter = lokal ? (() => {
      const rg = P.rang(P.punkte(lokal));
      return `<div class="card start-weiter">
        <div class="start-weiter-figur">${AV.svg(lokal.duo.avatar, { pose: 'jubel' })}</div>
        <div><div class="eyebrow">Willkommen zurück</div><h2>Duo ${esc(lokal.duo.codename)}</h2>
          <p class="muted">${lokal.duo.agenten.map(esc).join(' & ')} · ${esc(rg.r.name)} · ${Math.round(P.fallFortschritt(lokal) * 100)} % des Falls</p>
          <div class="btnrow"><button class="btn gross" id="st-weiter">▶ Weiterspielen</button></div></div></div>`;
    })() : '';
    app().innerHTML = `
      <section class="start">
        ${heroHtml()}
        ${lsWarn}
        ${weiter}
        <div class="start-grid">
          <div class="card">
            <h2>${lokal ? 'Anderes Duo' : 'Neues Agenten-Duo'}</h2>
            <label for="st-code">Codename eures Duos</label><input type="text" id="st-code" maxlength="24" placeholder="z. B. Nachtfalke">
            <div class="feld2"><div><label for="st-k1">Kürzel 1. Person</label><input type="text" id="st-k1" maxlength="12" placeholder="z. B. MK"></div>
            <div><label for="st-k2">Kürzel 2. Person</label><input type="text" id="st-k2" maxlength="12" placeholder="(leer, wenn allein)"></div></div>
            <p class="small muted">Kürzel so wählen, dass eure Lehrkraft euch erkennt – aber keine vollen Namen.</p>
            <label>Eure Figur <span class="muted small" id="st-av-name">· ${esc(AV.name(avatar))}</span></label>
            <div id="st-avatar"></div>
            <div class="btnrow"><button class="btn ${lokal ? 'sec' : 'gross'}" id="st-neu">Duo anlegen</button></div>
          </div>
          <div class="card">
            <h2>Spielstand-Datei laden</h2>
            <p>Ihr habt eine <code>.osiagent</code>-Datei aus eurem Duo oder aus der letzten Stunde? Dann ladet sie hier.</p>
            <div class="btnrow"><button class="btn sec" id="st-load">⬆ Datei auswählen</button><input type="file" id="st-file" accept=".osiagent" class="hidden"></div>
            <div id="st-drop" class="dropzone">… oder Datei hierher ziehen</div>
          </div>
        </div>
        <p class="fuss">Version ${esc(OSI.version)} · <a href="#" id="st-lk">Lehrkraft</a></p>
      </section>`;
    AV.picker($('#st-avatar'), avatar, id => { avatar = id; $('#st-av-name').textContent = '· ' + AV.name(id); A.play('plopp'); });
    if (lokal) $('#st-weiter').onclick = () => { G.save = lokal; G.lokalOk = true; A.play('funk'); G.render(); };
    $('#st-neu').onclick = () => {
      const code = $('#st-code').value.trim(), k1 = $('#st-k1').value.trim(), k2 = $('#st-k2').value.trim();
      if (!code || !k1) { alert('Bitte mindestens Codename und ein Kürzel eintragen.'); return; }
      if (lokal && !confirm(`Es gibt schon einen Spielstand von Duo „${lokal.duo.codename}“. Wirklich überschreiben? (Vorher exportieren, wenn ihr ihn noch braucht!)`)) return;
      G.save = G.neuerSpielstand(code, k1, k2, avatar);
      G.sichern();
      A.play('funk');
      G.gotoStep(OSI.einsaetze[0].id, OSI.einsaetze[0].steps[0].id);
    };
    $('#st-load').onclick = () => $('#st-file').click();
    $('#st-file').onchange = ev => { const f = ev.target.files[0]; if (f) G.importieren(f); };
    dropzone($('#st-drop'), f => G.importieren(f));
    $('#st-lk').onclick = ev => {
      ev.preventDefault();
      if (!G.save && lokal) G.save = lokal;
      if (!G.save) { alert('Bitte zuerst ein Duo anlegen oder einen Spielstand laden.'); return; }
      G.lehrkraftLogin();
    };
  }

  // ---------------------------------------------------------------- Online-Start (nur Online-Fassung, noch kein Spielstand im Konto)
  function renderOnlineStart() {
    G.view = 'start';
    G.renderTopbar();
    const O = G.online;
    let avatar = AV.zufall();
    app().innerHTML = `
      <section class="start">
        ${heroHtml()}
        <div class="start-grid">
          <div class="card">
            <div class="eyebrow">Angemeldet als ${esc(O.benutzer.name)}${O.benutzer.klasse ? ` · Klasse ${esc(O.benutzer.klasse)}` : ''}</div>
            <h2>Euer Agenten-Ausweis</h2>
            <label for="st-code">Codename</label><input type="text" id="st-code" maxlength="24" placeholder="z. B. Nachtfalke">
            <p class="small muted">Der Codename erscheint bei eurer Klasse und in der Einsatzzentrale – also kein echter Name.</p>
            <label>Eure Figur <span class="muted small" id="st-av-name">· ${esc(AV.name(avatar))}</span></label>
            <div id="st-avatar"></div>
            <div class="btnrow"><button class="btn gross" id="st-neu">Einsatz beginnen</button></div>
          </div>
          <div class="card">
            <h2>Schon mit der Lite-Version gespielt?</h2>
            <p>Ladet eure <code>.osiagent</code>-Datei hoch – dann geht es online genau dort weiter.</p>
            <div class="btnrow"><button class="btn sec" id="st-load">⬆ Datei auswählen</button><input type="file" id="st-file" accept=".osiagent" class="hidden"></div>
            <div id="st-drop" class="dropzone">… oder Datei hierher ziehen</div>
          </div>
        </div>
      </section>`;
    AV.picker($('#st-avatar'), avatar, id => { avatar = id; $('#st-av-name').textContent = '· ' + AV.name(id); A.play('plopp'); });
    $('#st-neu').onclick = () => {
      const code = $('#st-code').value.trim();
      if (!code) { Kit.fx.anstoss($('#st-code'), 'shake'); $('#st-code').focus(); return; }
      G.save = G.neuerSpielstand(code, O.benutzer.name, '', avatar);
      G.persist();
      A.play('funk');
      G.gotoStep(OSI.einsaetze[0].id, OSI.einsaetze[0].steps[0].id);
    };
    $('#st-load').onclick = () => $('#st-file').click();
    $('#st-file').onchange = ev => { const f = ev.target.files[0]; if (f) G.importieren(f); };
    dropzone($('#st-drop'), f => G.importieren(f));
  }

  function dropzone(el, onFile) {
    el.ondragover = e => { e.preventDefault(); el.classList.add('over'); };
    el.ondragleave = () => el.classList.remove('over');
    el.ondrop = e => { e.preventDefault(); el.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onFile(f); };
  }

  // ---------------------------------------------------------------- Karte (Übersicht)
  const HUB_TABS = [['karte', '🗺️', 'Karte'], ['klasse', '👥', 'Klasse'], ['board', '🗂️', 'Board'], ['abzeichen', '🎖️', 'Abzeichen'], ['challenge', '⏱️', 'Challenge']];
  G.hubTab = 'karte';

  function renderHub() {
    G.view = 'hub';
    G.uebung = null;
    G.renderTopbar();
    const s = G.save, front = P.front(s), rg = P.rang(P.punkte(s));
    const boardDa = Object.keys(s.board).length || s.steps[OSI.boardAb];
    if (G.hubTab === 'board' && !boardDa) G.hubTab = 'karte';
    const klasseDa = !!(G.online && G.online.benutzer.klasse);
    if (G.hubTab === 'klasse' && !klasseDa) G.hubTab = 'karte';
    const nav = HUB_TABS.filter(([k]) => (k !== 'board' || boardDa) && (k !== 'klasse' || klasseDa)).map(([k, ic, t]) => `<button class="hub-tab ${G.hubTab === k ? 'on' : ''}" data-tab="${k}"><span class="hub-tab-ic">${ic}</span><span>${t}</span></button>`).join('');
    const weiterText = front ? `${front.e.icon || ''} ${esc(front.st.titel || front.st.id)}` : 'Alles erledigt – stark!';
    app().innerHTML = `<div class="hub">
      <nav class="hub-nav" aria-label="Bereiche">${nav}</nav>
      <section class="hub-main" id="hub-main"></section>
      <aside class="hub-seite">
        <div class="card duo-karte">
          <div class="duo-figur">${AV.svg(s.duo.avatar)}</div>
          <div class="duo-name">Duo ${esc(s.duo.codename)}</div><div class="small muted">${s.duo.agenten.map(esc).join(' & ')} · ${esc(AV.name(s.duo.avatar))}</div>
          <div class="duo-rang"><span>${esc(rg.r.name)}</span><span class="mono">${P.punkte(s)} XP</span></div>
          <div class="fortschritt gold"><i style="width:${Math.round(rg.anteil * 100)}%"></i></div>
          <div class="small muted">${rg.next ? `Noch ${rg.next.ab - P.punkte(s)} XP bis „${esc(rg.next.name.replace(/^Stufe \d+ · /, ''))}“` : 'Höchste Freigabe erreicht'}</div>
          ${front ? `<button class="btn gross voll" id="hub-weiter"><span>Weiter</span><small>${weiterText}</small></button>` : `<div class="merk">🏆 ${weiterText}</div>`}
        </div>
        <div class="card fall-karte"><div class="eyebrow">Fall aufgeklärt</div><div class="fall-zahl">${Math.round(P.fallFortschritt(s) * 100)} %</div>
          <div class="fortschritt"><i style="width:${Math.round(P.fallFortschritt(s) * 100)}%"></i></div></div>
      </aside></div>
      <p class="fuss">Version ${esc(OSI.version)} · <a href="#" id="hub-lk">Lehrkraft</a></p>`;
    $$('.hub-tab').forEach(b => b.onclick = () => { G.hubTab = b.dataset.tab; A.play('klick'); renderHub(); window.scrollTo(0, 0); });
    $('#hub-lk').onclick = ev => { ev.preventDefault(); G.lehrkraft(); };
    if (front) $('#hub-weiter').onclick = () => G.gotoStep(front.e.id, front.st.id);
    const main = $('#hub-main');
    ({ karte: hubKarte, klasse: hubKlasse, board: hubBoard, abzeichen: hubAbzeichen, challenge: hubChallenge })[G.hubTab](main, front);
  }

  // ---------- Karte: Weltkarte (Stationen je Einsatz) oder Pfad eines Einsatzes
  G.kartenEinsatz = null;
  function hubKarte(main, front) {
    const e = G.kartenEinsatz && P.einsatz(G.kartenEinsatz);
    if (e && G.einsatzOffen(e)) einsatzKarte(main, e, front);
    else { G.kartenEinsatz = null; weltKarte(main, front); }
  }

  // Merkt sich je Karte, wo die Figur zuletzt stand – von dort hüpft sie zur neuen Front
  function zuletzt(karte, zielIdx) {
    const key = `osiagenten.karte.${G.save.id}.${karte}`;
    let von = null;
    try { von = localStorage.getItem(key); localStorage.setItem(key, String(zielIdx)); } catch (e) { /* egal */ }
    return von == null ? null : +von;
  }
  function eigeneFigur(karte, lay, ziel, zielIdx, schluessel) {
    const von = zuletzt(schluessel, zielIdx);
    MAP.pinne(karte, [{ ziel, avatar: G.save.duo.avatar, ich: true, titel: 'Euer Duo' }], { lauf: von != null && von < zielIdx, von, onHop: () => A.play('hupf') });
  }
  const gemeistert = e => {
    const ueb = e.steps.filter(st => G.UEBBAR.includes(st.type));
    return ueb.length > 0 && ueb.every(st => G.save.uebung[st.id] && G.save.uebung[st.id].gemeistert);
  };

  function weltKarte(main, front) {
    main.innerHTML = '<div class="karte-wrap" id="karte"></div>';
    const s = G.save;
    const lay = MAP.layout(P.sichtbar(G.teacher), 'welt');
    const status = n => G.einsatzFertig(n.e) ? 'done' : front && front.e === n.e ? 'cur' : G.einsatzOffen(n.e) ? 'open' : 'locked';
    const karte = MAP.render($('#karte'), lay, {
      status,
      fortschritt: e => P.einsatzFortschritt(s, e),
      stern: n => gemeistert(n.e),
      onKnoten: (n, btn) => {
        if (status(n) === 'locked') {
          A.play('falsch'); Kit.fx.anstoss(btn, 'shake');
          MAP.pop(karte.root, n, `<div class="map-pop-titel">🔒 ${esc(n.e.titel)}</div><div class="small">Schließt zuerst den Einsatz davor ab.</div>`);
          return;
        }
        A.play('plopp');
        const req = P.pflicht(n.e), fertig = req.filter(G.stepDone).length;
        const naechster = req.find(st => !G.stepDone(st));
        MAP.pop(karte.root, n, `<div class="map-pop-kap">${esc(n.e.nrText)} · ${fertig} von ${req.length} Schritten</div>
          <div class="map-pop-titel">${esc(n.e.titel)}</div>
          <div class="btnrow" style="margin-top:0">${naechster ? '<button class="btn voll" id="map-weiter">▶ Weiter</button>' : ''}<button class="btn voll sec" id="map-open">🗺️ Pfad öffnen</button></div>`);
        $('#map-open').onclick = () => zeigeEinsatz(n.e.id);
        if (naechster) $('#map-weiter').onclick = () => G.gotoStep(n.e.id, naechster.id);
      }
    });
    const ziel = front ? front.e.id : 'ziel';
    eigeneFigur(karte, lay, ziel, front ? lay.index[ziel] : lay.strecke.length, 'welt');
    const fokus = karte.root.querySelector('.map-station.is-cur') || karte.root.querySelector('.map-ziel');
    if (fokus) fokus.scrollIntoView({ block: 'center' });
  }

  function zeigeEinsatz(eid) {
    G.kartenEinsatz = eid;
    A.play('klick');
    renderHub();
    window.scrollTo(0, 0);
    const cur = $('.map-knoten.is-cur');
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  G.zeigeEinsatz = zeigeEinsatz;

  function einsatzKarte(main, e, front) {
    const s = G.save, f = P.einsatzFortschritt(s, e);
    main.innerHTML = `<div class="karte-kopf" style="--k:${MAP.farbe(e)}">
        <button class="karte-zurueck" id="karte-welt" title="Zur Weltkarte">◂ Weltkarte</button>
        <span class="karte-kopf-icon">${e.icon || ''}</span>
        <span class="karte-kopf-text"><small>${esc(e.nrText)}</small><b>${esc(e.titel)}</b></span>
        <span class="karte-kopf-pct">${Math.round(f * 100)} %</span></div>
      <div class="karte-wrap" id="karte"></div>`;
    $('#karte-welt').onclick = () => { G.kartenEinsatz = null; A.play('klick'); renderHub(); };
    const lay = MAP.layout([e], 'pfad', { ziel: false });
    const status = n => {
      if (G.stepDone(n.st)) return 'done';
      if (front && front.st === n.st) return 'cur';
      return G.stepOffen(n.e, n.idx) ? 'open' : 'locked';
    };
    const karte = MAP.render($('#karte'), lay, {
      status,
      stern: n => !!(s.uebung[n.st.id] && s.uebung[n.st.id].gemeistert),
      fortschritt: x => P.einsatzFortschritt(s, x),
      onKnoten: (n, btn) => {
        const st = status(n);
        if (st === 'locked') {
          A.play('falsch'); Kit.fx.anstoss(btn, 'shake');
          MAP.pop(karte.root, n, `<div class="map-pop-titel">🔒 ${esc(n.st.titel || n.st.id)}</div><div class="small">Schließt zuerst die Schritte davor ab.</div>`);
          return;
        }
        A.play('plopp');
        const label = st === 'done' ? (G.UEBBAR.includes(n.st.type) ? 'Ansehen & üben' : 'Nochmal ansehen') : 'Start';
        MAP.pop(karte.root, n, `<div class="map-pop-kap">${esc(n.e.nrText)} · ${esc(MAP.TYP_NAME[n.st.type] || '')}${n.bonus ? ' · Bonus' : ''}</div>
          <div class="map-pop-titel">${esc(n.st.titel || n.st.id)}</div>
          <button class="btn voll ${st === 'done' ? 'sec' : ''}" id="map-go">${label}</button>`);
        $('#map-go').onclick = () => G.gotoStep(n.e.id, n.st.id);
      }
    });
    // Figur: an der Front, wenn sie in diesem Einsatz liegt – sonst am Ende (fertig) oder unten (noch nicht dran)
    const hier = front && front.e === e;
    const ziel = hier ? front.st.id : G.einsatzFertig(e) ? lay.strecke[lay.strecke.length - 1].st.id : lay.strecke[0].st.id;
    eigeneFigur(karte, lay, ziel, lay.index[ziel], e.id);
    const fokus = karte.root.querySelector('.map-knoten.is-cur');
    if (fokus) fokus.scrollIntoView({ block: 'center' });
  }

  // ---------- Klasse (nur online): Weltkarte mit allen Figuren der Klasse und Rangliste – nur Codenamen und Figuren
  async function hubKlasse(main) {
    main.innerHTML = `<div class="card"><h2>👥 Eure Klasse</h2><p class="small muted">Wo stehen die anderen Agentinnen und Agenten? Zu sehen sind nur Codenamen und Figuren.</p>
      <div class="karte-wrap" id="karte"><p class="karte-leer">Lade Klasse …</p></div><div id="kl-liste"></div></div>`;
    let liste;
    try { liste = await G.online.klasse(); } catch (e) { $('#karte').innerHTML = '<p class="karte-leer">Die Klasse konnte gerade nicht geladen werden. Später nochmal versuchen.</p>'; return; }
    if (G.view !== 'hub' || G.hubTab !== 'klasse' || !main.isConnected) return;
    const s = G.save, front = P.front(s);
    const lay = MAP.layout(P.sichtbar(false), 'welt');
    const karte = MAP.render($('#karte'), lay, {
      status: n => G.einsatzFertig(n.e) ? 'done' : front && front.e === n.e ? 'cur' : G.einsatzOffen(n.e) ? 'open' : 'locked',
      fortschritt: e => P.einsatzFortschritt(s, e)
    });
    const zielVon = x => { const e = x.front && P.einsatzVonStep(x.front); return e ? e.id : 'ziel'; };
    MAP.pinne(karte, liste.map(x => ({ ziel: zielVon(x), avatar: x.avatar, name: x.ich ? 'Ihr' : x.codename, ich: x.ich, titel: x.codename })), { lauf: true, von: 0, staffel: 90, max: 8, proReihe: 4, versatz: 46, reihenAbstand: 40 });
    const fokus = karte.root.querySelector('.map-station.is-cur') || karte.root.querySelector('.map-ziel');
    if (fokus) fokus.scrollIntoView({ block: 'center' });
    const rang = liste.slice().sort((a, b) => b.punkte - a.punkte);
    $('#kl-liste').innerHTML = `<table class="t rangliste"><tr><th>#</th><th>Duo</th><th class="num">XP</th><th>Einsatz</th></tr>${rang.map((x, i) => {
      const e = x.front && P.einsatzVonStep(x.front);
      return `<tr class="${x.ich ? 'ich' : ''}"><td>${i + 1}</td><td><span class="rl-figur">${AV.svg(x.avatar, { titel: false })}</span>${esc(x.codename)}${x.ich ? ' <span class="muted small">(ihr)</span>' : ''}</td><td class="num">${x.punkte}</td><td>${e ? esc(e.icon + ' ' + e.nrText) : '🏆 fertig'}</td></tr>`;
    }).join('')}</table>`;
  }

  function hubBoard(main) {
    main.innerHTML = `<div class="card"><h2>🗂️ Verdächtigen-Board</h2><p class="small muted">Wer war es? Die Stempel setzt ihr mit euren Ermittlungen.</p>${boardHtml()}</div>`;
  }

  function hubAbzeichen(main) {
    const b = OSI.abzeichen;
    const n = b.filter(x => G.save.badges[x.id]).length;
    main.innerHTML = `<div class="card"><h2>🎖️ Abzeichen</h2><p class="muted">${n} von ${b.length} gesammelt</p>
      <div class="fortschritt gold"><i style="width:${Math.round(n / b.length * 100)}%"></i></div>
      <div class="badges">${b.map((x, i) => {
        const hat = !!G.save.badges[x.id], geheim = x.geheim && !hat;
        return `<div class="badge ${hat ? '' : 'off'}" style="--i:${i}" title="${esc(geheim ? 'Geheimes Abzeichen' : x.text)}">${ABZ.svg(x, { geheim })}<div class="bn">${esc(geheim ? '???' : x.name)}</div><div class="bd">${esc(geheim ? 'Geheimes Abzeichen' : x.text)}</div></div>`;
      }).join('')}</div></div>`;
  }

  function hubChallenge(main) {
    const ch = G.save.challenge, offen = G.teacher || !!(G.save.items[OSI.challenge.freiNach] || {}).ok;
    main.innerHTML = `<div class="card challenge-karte"><div class="challenge-icon">⏱️</div><h2>Zeit-Challenge</h2>
      <p>Ordnet so viele Begriffe wie möglich in ${OSI.challenge.sekunden} Sekunden der richtigen Schicht zu. Beliebig oft wiederholbar!</p>
      <div class="statkacheln"><div class="statkachel gold"><b>${ch.best}</b><span>Rekord</span></div><div class="statkachel blau"><b>${ch.runs}</b><span>Versuche</span></div></div>
      <div class="btnrow mitte"><button class="btn gross" id="hub-ch" ${offen ? '' : 'disabled'}>Challenge starten</button></div>
      ${offen ? '' : '<p class="small muted mitte">Wird im Training von Einsatz 0 freigeschaltet.</p>'}</div>`;
    $('#hub-ch').onclick = () => G.challenge.start();
  }

  // „entlastet“ bleibt „vorerst“ (alte Spielstände); endgültig entlastet = „frei“
  const STEMPEL = { entlastet: 'VORERST ENTLASTET', verdaechtig: 'VERDÄCHTIG', frei: 'ENTLASTET', ueberfuehrt: 'ÜBERFÜHRT' };
  function boardHtml() {
    return `<div class="board">${OSI.verdaechtige.map(v => {
      const st = G.save.board[v.id];
      return `<div class="suspect"><div class="pin"></div><img src="img/${v.bild}" alt="${esc(v.name)}">
        ${st ? `<div class="status ${st}">${STEMPEL[st] || 'VERDÄCHTIG'}</div>` : ''}
        <h4>${esc(v.name)}</h4><div class="role">${esc(v.rolle)}</div><div class="notes">${v.notiz}</div></div>`;
    }).join('')}</div>`;
  }

  // ---------------------------------------------------------------- Schritt-Rahmen
  function renderStepView(e, st) {
    G.view = 'step';
    G.tasten = null;
    if (G.uebung && G.uebung.stepId !== st.id) G.uebung = null;
    G.renderTopbar();
    const idx = e.steps.indexOf(st);
    const anteil = P.einsatzFortschritt(G.save, e);
    app().innerHTML = `<div class="step-kopf" style="--k:${MAP.farbe(e)}">
        <button class="step-zu" id="cr-hub" title="Zum Pfad dieses Einsatzes" aria-label="Zum Pfad dieses Einsatzes">✕</button>
        <div class="step-bar" title="${Math.round(anteil * 100)} % von ${esc(e.nrText)}"><i style="width:${Math.max(4, Math.round(anteil * 100))}%"></i></div>
        <span class="step-kap" title="${esc(e.titel)}">${e.icon || ''} <span>${esc(e.nrText)} · ${st.bonus ? '★' : idx + 1}/${e.steps.length}</span></span>
      </div>
      <div class="step-nav">
        <button class="step-pfeil" id="sn-zurueck" ${idx > 0 ? '' : 'disabled'} title="Vorheriger Schritt">‹</button>
        <span class="step-typ">${MAP.TYP_ICON[st.type] || ''} ${esc(MAP.TYP_NAME[st.type] || '')}</span>
        <button class="step-pfeil" id="sn-vor" ${idx < e.steps.length - 1 && G.stepOffen(e, idx + 1) ? '' : 'disabled'} title="Nächster Schritt">›</button>
      </div>
      <div id="uebbar"></div><div id="stepbox" class="stepbox"></div>`;
    $('#cr-hub').onclick = () => G.zurKarte(e.id);
    $('#sn-zurueck').onclick = () => G.gotoStep(e.id, e.steps[idx - 1].id);
    $('#sn-vor').onclick = () => G.gotoStep(e.id, e.steps[idx + 1].id);
    const box = $('#stepbox');
    const R = G.renderer[st.type];
    if (!R) { box.innerHTML = `<div class="card">Unbekannter Schritt-Typ: ${esc(st.type)}</div>`; return; }
    const ub = $('#uebbar');
    if (G.uebung) {
      ub.innerHTML = `<div class="uebbar on">🔁 <b>Übungsmodus</b> – zählt nicht für Punkte, Rang oder Fehlerquote. Schafft ihr es fehlerfrei und ohne Tipp, gibt es ⭐.
        <span class="spacer"></span><button class="btn sec klein" id="ub-stop">Übung beenden</button></div>`;
      $('#ub-stop').onclick = () => { G.uebung = null; renderStepView(e, st); };
    } else if (G.stepDone(st) && G.UEBBAR.includes(st.type)) {
      const u = G.save.uebung[st.id];
      ub.innerHTML = `<div class="uebbar">✓ Erledigt${u && u.gemeistert ? ' · ⭐ beim Üben gemeistert' : u ? ` · ${u.runs}× geübt` : ''}
        <span class="spacer"></span><button class="btn sec klein" id="ub-start">🔁 Nochmal üben</button></div>`;
      $('#ub-start').onclick = () => G.uebungStarten(e, st);
    }
    R(box, st, e, {
      fertig: () => { if (G.uebung) G.uebungFertig(st); else G.stepAbschliessen(st); },
      weiter: () => { if (G.uebung) G.uebungFertig(st); G.uebung = null; G.stepAbschliessen(st); G.naechsterStep(e, st); },
      done: G.stepDone(st),
      idx
    });
  }

  Object.assign(G, { renderStart, renderOnlineStart, renderHub, renderStepView, boardHtml, dropzone });
})();
