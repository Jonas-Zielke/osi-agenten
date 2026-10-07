/* OSI-Agenten – Abschlüsse: ende (Kapitel geschafft) und urkunde (letzter Schritt mit druckbarer Ernennungsurkunde). */
(function () {
  'use strict';
  const G = window.OSIGame, A = window.OSIAudio, OSI = window.OSI, Kit = window.OSIKit;
  const B = G.bausteine, R = G.renderer, AV = Kit.avatars, fx = Kit.fx;
  const { esc, $ } = Kit.util;

  // ---------------------------------------------------------------- Einsatz-Ende
  R.ende = (box, st, e, ctx) => {
    const ersterBesuch = !ctx.done;
    ctx.fertig();
    if (st.abzeichen) G.abzeichen(st.abzeichen);
    const items = e.steps.flatMap(s => [...(s.fragen || []), ...(s.items || []), ...(s.phasen || [])]).map(q => q.id);
    const states = items.map(id => G.save.items[id]).filter(Boolean);
    const p = states.reduce((a, it) => a + (it.p || 0), 0);
    const erste = states.filter(it => it.ok && it.f === 0).length;
    const tipps = states.reduce((a, it) => a + (it.h || 0), 0);
    if (st.abzeichenOhneTipp && tipps === 0 && states.length) G.abzeichen(st.abzeichenOhneTipp);
    const quote = items.length ? Math.round(erste / items.length * 100) : 100;
    box.innerHTML = `<div class="card summary kapitel-ende" style="--k:${Kit.map.farbe(e)}">
      <div class="kapitel-ende-figur">${AV.svg(G.save.duo.avatar, { pose: 'jubel', klasse: 'av-gross' })}</div>
      <div class="eyebrow">${esc(e.nrText)} abgeschlossen</div>
      <h2>${esc(st.titel)}</h2>
      <div>${st.text}</div>
      <div class="statkacheln">
        <div class="statkachel gold"><span>Punkte</span><b class="big" data-zahl="${p}">${p}</b></div>
        <div class="statkachel gruen"><span>Erster Versuch</span><b><i data-zahl="${quote}">${quote}</i> %</b></div>
        <div class="statkachel blau"><span>Tipps</span><b data-zahl="${tipps}">${tipps}</b></div>
      </div>
      <p class="muted">${erste} von ${items.length} Aufgaben beim ersten Versuch gelöst · eure Freigabestufe: <b>${esc(G.rang().r.name)}</b></p>
      <div class="merk links"><b>Wichtig:</b> Exportiert jetzt euren Spielstand und schickt die Datei an die andere Person eures Duos. Am Stundenende gebt ihr sie bei eurer Lehrkraft ab.</div>
      <div class="btnrow mitte"><button class="btn gross" id="en-exp">⬇ Spielstand exportieren</button><button class="btn sec" id="en-hub">Zur Karte</button></div></div>`;
    box.querySelectorAll('[data-zahl]').forEach(el => fx.zaehlen(el, +el.dataset.zahl));
    if (ersterBesuch) { A.play('kapitel'); fx.konfetti(); }
    $('#en-exp', box).onclick = G.exportieren;
    $('#en-hub', box).onclick = () => G.zurKarte();
  };

  // ---------------------------------------------------------------- Abschluss mit Ernennungsurkunde (letzter Schritt des Spiels)
  // Eigenes A4-Druckblatt (genau eine Seite): wird nur zum Drucken an <body> gehängt, sonst ist alles andere ausgeblendet
  function urkundeDruckblatt(d) {
    document.querySelectorAll('.druckblatt').forEach(x => x.remove());
    const el = document.createElement('div');
    el.className = 'druckblatt';
    el.innerHTML = `<div class="db-rahmen">
      <div class="db-kopf">EINHEIT 7 · ABTEILUNG FÜR NETZWERKFORENSIK</div>
      <div class="db-titel">Ernennungsurkunde</div>
      <div class="db-linie"></div>
      <div class="db-figur">${AV.svg(d.avatar, { pose: 'jubel', titel: false })}</div>
      <div class="db-klein">Das Agenten-Duo</div>
      <div class="db-name">${esc(d.codename)}</div>
      <div class="db-kuerzel">${d.agenten.map(esc).join(' &amp; ')}</div>
      <p class="db-text">hat die <b>Operation „Lohnzettel“</b> aufgeklärt – Spur für Spur, von L1 bis L7 –,<br>den Täter überführt und drei Verdächtige entlastet.<br>In Anerkennung dieser Leistung wird dem Duo die Freigabestufe</p>
      <div class="db-rang">${esc(d.rang)}</div>
      <div class="db-klein">verliehen.</div>
      <div class="db-werte"><div><b>${d.punkte}</b><span>Punkte</span></div><div><b>${d.akten}</b><span>Akten aufgeklärt</span></div><div><b>${d.abzeichen.length}</b><span>Abzeichen</span></div></div>
      <div class="db-abz">${d.abzeichen.map(b => `<span>${Kit.abzeichen.svg(b)}${esc(b.name)}</span>`).join('')}</div>
      <div class="db-fuss"><div><div class="db-unterschrift">${esc(d.datum)}</div><span>Datum</span></div><div class="db-siegel">E7</div><div><div class="db-unterschrift"><i>Albers</i></div><span>Direktorin Albers, Einheit 7</span></div></div>
    </div>`;
    document.body.appendChild(el);
    document.body.classList.add('druck-urkunde');
    const weg = () => { el.remove(); document.body.classList.remove('druck-urkunde'); window.removeEventListener('afterprint', weg); };
    window.addEventListener('afterprint', weg);
    return el;
  }
  G.urkundeDruckblatt = urkundeDruckblatt;

  R.urkunde = (box, st, e, ctx) => {
    ctx.fertig();
    if (st.abzeichen) G.abzeichen(st.abzeichen);
    const { r } = G.rang();
    const p = G.punkte();
    const abz = OSI.abzeichen.filter(b => G.save.badges[b.id]);
    const fall = OSI.einsaetze.filter(x => !x.diagnose && x.steps.length);
    const aufgeklaert = fall.filter(x => G.einsatzFertig(x)).length;
    const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    const d = G.save.duo;
    box.innerHTML = `<div class="card">
      ${st.bild ? `<img class="scene-img" src="img/${st.bild}" alt="">` : ''}
      <h2>${esc(st.titel)}</h2>
      <div class="dialoge">${st.szenen.map((s, i) => B.dialogHtml(s, i)).join('')}</div>
      <div class="urkunde">
        <div class="uk-figur">${AV.svg(d.avatar, { pose: 'jubel' })}</div>
        <div class="uk-kopf">EINHEIT 7 · ABTEILUNG FÜR NETZWERKFORENSIK</div>
        <div class="uk-titel">Ernennungsurkunde</div>
        <p>Das Agenten-Duo</p>
        <div class="uk-name">${esc(d.codename)}</div>
        <div class="uk-kuerzel">${d.agenten.map(esc).join(' &amp; ')}</div>
        <p>hat die <b>Operation „Lohnzettel“</b> aufgeklärt – Spur für Spur, von L1 bis L7 –,<br>den Täter überführt und drei Verdächtige entlastet.</p>
        <div class="uk-werte"><div><b>${esc(r.name)}</b><span>Freigabestufe</span></div><div><b>${p}</b><span>Punkte</span></div><div><b>${aufgeklaert} / ${fall.length}</b><span>Akten aufgeklärt</span></div><div><b>${abz.length}</b><span>Abzeichen</span></div></div>
        <div class="uk-fuss"><span>${esc(datum)}</span><span class="uk-gez">gez. Direktorin Albers</span></div>
        <div class="uk-siegel">E7</div>
      </div>
      <div class="btnrow mitte"><button class="btn gross" id="uk-exp">⬇ Spielstand exportieren</button><button class="btn sec" id="uk-druck">🖨 Urkunde drucken</button><button class="btn sec" id="en-hub">Zur Karte</button></div></div>`;
    B.bindEggs(box);
    A.play('kapitel');
    fx.konfetti(140);
    $('#uk-exp', box).onclick = G.exportieren;
    $('#uk-druck', box).onclick = () => {
      urkundeDruckblatt({ codename: d.codename, agenten: d.agenten, avatar: d.avatar, rang: r.name, punkte: p, akten: `${aufgeklaert} / ${fall.length}`, datum, abzeichen: abz });
      window.print();
    };
    $('#en-hub', box).onclick = () => G.zurKarte();
  };
})();
