// Ende-zu-Ende-Test der Online-Fassung (web/) gegen eine Test-Datenbank:
// Admin → Klasse → Lehrkraft-Antrag + Freischaltung → Lernende registrieren mit Klassencode → spielen →
// Stand kommt nach Neuladen aus der DB → Rangliste der Klasse → Live-Einsatzzentrale → Passwort zurücksetzen → Lernende umbenennen/verschieben →
// Rechte (fremde Klasse, fremde Daten, öffentliche Registrierung gesperrt).
// Aufruf: TEST_DATABASE_URL=postgres://…/osi_test node test-online.js   (vorher in web/: npm run build)
// ACHTUNG: leert die Test-Datenbank. Der Name der Datenbank muss deshalb „test“ enthalten.
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
const { browser, sleep, shot, ROOT } = require('./lib');

const DB = process.env.TEST_DATABASE_URL;
if (!DB) { console.log('⏭ test-online übersprungen (TEST_DATABASE_URL nicht gesetzt)'); process.exit(0); }
if (!/test/i.test(new URL(DB.replace(/^postgres(ql)?:/, 'http:')).pathname)) { console.error('❌ TEST_DATABASE_URL muss auf eine Datenbank mit „test“ im Namen zeigen.'); process.exit(1); }

const WEB = path.join(ROOT, 'web');
const PORT = 3100, BASIS = `http://localhost:${PORT}`;
const env = Object.assign({}, process.env, { DATABASE_URL: DB, BETTER_AUTH_SECRET: 'test-schluessel-test-schluessel-test-schluessel', BETTER_AUTH_URL: BASIS, ADMIN_BENUTZERNAME: 'chef', NEXT_TELEMETRY_DISABLED: '1' });

(async () => {
  const fehler = [];
  const pruefe = (bed, text) => { if (!bed) fehler.push(text); };
  if (!fs.existsSync(path.join(WEB, '.next', 'BUILD_ID'))) throw new Error('web/ ist nicht gebaut – vorher in web/ „npm run build“ ausführen.');

  // ---- frische Test-Datenbank
  const { Client } = require(path.join(WEB, 'node_modules', 'pg'));
  const c = new Client({ connectionString: DB });
  await c.connect();
  await c.query('drop schema public cascade; create schema public;');
  await c.end();
  execFileSync('node', ['scripts/spiel-kopieren.mjs'], { cwd: WEB, env, stdio: 'ignore' });
  execFileSync('node', ['scripts/migrate.mjs'], { cwd: WEB, env, stdio: 'ignore' });

  // ---- Server starten
  const server = spawn(path.join(WEB, 'node_modules', '.bin', 'next'), ['start', '-p', String(PORT)], { cwd: WEB, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });
  for (let i = 0; i < 60 && !/Ready|started server|Local:/i.test(log); i++) await sleep(500);

  const b = await browser();
  // Jede Person bekommt einen eigenen Browser-Kontext (eigene Cookies)
  async function person() {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 1280, height: 860 });
    p.fehler = [];
    p.on('pageerror', e => p.fehler.push('PAGEERROR ' + e.message));
    p.api = (url, opt = {}) => p.evaluate(async (u, o) => { const r = await fetch(u, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, o)); let d = null; try { d = await r.json(); } catch (e) { } return { status: r.status, d }; }, url, opt);
    return p;
  }
  const geh = async (p, pfad) => { await p.goto(BASIS + pfad, { waitUntil: 'networkidle0' }); };
  async function registrieren(p, name, pw, art, code) {
    await geh(p, '/registrieren');
    if (art === 'lehrkraft') { await p.click('[role="tab"]:nth-child(2)'); await sleep(100); }
    else await p.type('#klassencode', code);
    await p.type('#benutzername', name); await p.type('#passwort', pw); await p.type('#passwort2', pw);
    await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {}), p.click('#registrieren')]);
    await sleep(300);
  }
  async function anmelden(p, name, pw) {
    await geh(p, '/anmelden');
    await p.type('#benutzername', name); await p.type('#passwort', pw);
    await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {}), p.click('#anmelden')]);
    await sleep(300);
  }

  try {
    // 1) Admin registriert sich (Benutzername aus ADMIN_BENUTZERNAME) und legt eine Klasse an
    const admin = await person();
    await registrieren(admin, 'chef', 'geheim-chef-123', 'lehrkraft');
    pruefe(admin.url().endsWith('/lehrkraft'), `Admin landet nicht im Lehrkraft-Bereich (${admin.url()})`);
    await admin.type('#klassenname', 'Testklasse');
    await admin.click('#klasse-neu'); await sleep(1500);
    const code = await admin.$eval('.code-gross', el => el.textContent.trim()).catch(() => null);
    pruefe(code && /^[A-Z]+-[A-Z0-9]{3}$/.test(code), `Kein Klassencode: ${code}`);
    const { d: kl } = await admin.api('/api/klassen');
    const klasseId = kl.klassen[0].id;
    await admin.screenshot({ path: shot('online_lehrkraft'), fullPage: true });

    // 2) Lehrkraft-Antrag: erst gesperrt, nach Freischaltung durch den Admin frei
    const lk = await person();
    await registrieren(lk, 'lk.zwei', 'geheim-lk-123', 'lehrkraft');
    await geh(lk, '/lehrkraft');
    pruefe(/Freischaltung/.test(await lk.content()), 'Beantragte Lehrkraft sieht keinen Hinweis auf die Freischaltung');
    pruefe((await lk.api('/api/klassen')).status === 403, 'Beantragte Lehrkraft darf schon Klassen sehen');
    await geh(admin, '/admin');
    await admin.click('tr[data-lehrkraft="lk.zwei"] [data-aktion="freischalten"]'); await sleep(1200);
    pruefe((await lk.api('/api/klassen')).status === 200, 'Freigeschaltete Lehrkraft darf keine Klassen sehen');
    pruefe((await lk.api(`/api/klassen/${klasseId}/spielstaende`)).status === 404, 'Fremde Lehrkraft sieht die Klasse des Admins');

    // 3) Falscher Klassencode, öffentliche E-Mail-Registrierung gesperrt
    const gast = await person();
    await geh(gast, '/');
    pruefe((await gast.api('/api/registrieren', { method: 'POST', body: JSON.stringify({ benutzername: 'falsch', passwort: '12345678', art: 'lernend', klassencode: 'NIX-000' }) })).status === 400, 'Falscher Klassencode wird angenommen');
    pruefe((await gast.api('/api/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ email: 'x@y.de', password: '12345678', name: 'x' }) })).status >= 400, 'Öffentliche Registrierung per E-Mail ist nicht gesperrt');
    pruefe((await gast.api('/api/spielstand')).status === 401, 'Spielstand ohne Anmeldung abrufbar');

    // 4) Lernende 1: registrieren → Online-Start → spielen → Stand liegt in der DB
    const a1 = await person();
    await registrieren(a1, 'agent.eins', 'geheim-eins-1', 'lernend', code);
    await sleep(1200);
    pruefe(a1.url().includes('/spiel/'), `Lernende landen nicht im Spiel (${a1.url()})`);
    pruefe(!!(await a1.$('#st-code')) && !(await a1.$('#st-k1')), 'Online-Start fragt nicht nur nach dem Codenamen');
    await a1.type('#st-code', 'Nachtfalke');
    await a1.click('#st-avatar [data-av="a05"]');
    await a1.click('#st-neu'); await sleep(500);
    while (await a1.$('#dl-next')) { await a1.click('#dl-next'); await sleep(40); }
    await a1.click('#st-weiter'); await sleep(400); // e0-intro erledigt → e0-warum
    await a1.click('#st-weiter'); await sleep(2600); // Lektion erledigt, Speichern entprellt
    const s1 = await a1.api('/api/spielstand');
    pruefe(s1.d && s1.d.daten && s1.d.daten.steps['e0-intro'] && s1.d.daten.steps['e0-warum'], 'Fortschritt wurde nicht in der DB gespeichert');
    pruefe(s1.d && s1.d.daten && s1.d.daten.duo.agenten[0] === 'agent.eins' && s1.d.daten.duo.avatar === 'a05', 'Kürzel/Figur im gespeicherten Stand falsch');
    await a1.evaluate(() => localStorage.clear()); // Stand muss aus der DB kommen, nicht aus dem Browser
    await a1.reload({ waitUntil: 'networkidle0' }); await sleep(800);
    const nachLaden = await a1.evaluate(() => OSIGame.save && OSIGame.save.duo.codename + '|' + Object.keys(OSIGame.save.steps).length);
    pruefe(nachLaden === 'Nachtfalke|2', `Nach dem Neuladen falscher Stand: ${nachLaden}`);
    pruefe(/gespeichert/.test(await a1.$eval('#topbar', el => el.textContent)), 'Kopfleiste zeigt keinen Sync-Status');
    await a1.screenshot({ path: shot('online_spiel'), fullPage: false });

    // 5) Lernende 2 in derselben Klasse → Rangliste zeigt beide (nur Codenamen)
    const a2 = await person();
    await registrieren(a2, 'agent.zwei', 'geheim-zwei-2', 'lernend', code);
    await sleep(1000);
    await a2.type('#st-code', 'Kupferdraht'); await a2.click('#st-neu'); await sleep(2200);
    const rl = await a2.api('/api/klasse/rangliste');
    pruefe(rl.d && rl.d.liste.length === 2 && rl.d.liste.every(x => !('username' in x)), `Rangliste: ${JSON.stringify(rl.d)}`);
    await a2.evaluate(() => { OSIGame.hubTab = 'klasse'; OSIGame.zurKarte(); OSIGame.hubTab = 'klasse'; OSIGame.render(); }); await sleep(1800);
    pruefe((await a2.$$('.map-pin')).length === 2, 'Reiter „Klasse“ zeigt nicht beide Figuren');
    await a2.screenshot({ path: shot('online_klasse'), fullPage: false });
    pruefe((await a2.api(`/api/klassen/${klasseId}/spielstaende`)).status === 403, 'Lernende sehen die Spielstände der Klasse');

    // 6) Live-Einsatzzentrale der Lehrkraft zeigt beide Figuren
    await geh(admin, `/lehrkraft/einsatzzentrale.html?klasse=${klasseId}`); await sleep(3500);
    pruefe((await admin.$$('.map-pin')).length === 2, 'Live-Einsatzzentrale zeigt nicht beide Figuren');
    pruefe(/Live/.test(await admin.$eval('.warnbar.live', el => el.textContent).catch(() => '')), 'Live-Hinweis fehlt');
    await admin.screenshot({ path: shot('online_zentrale'), fullPage: false });

    // 7) Passwort vergessen → Lehrkraft vergibt ein neues
    await geh(admin, `/lehrkraft/klasse/${klasseId}`);
    admin.on('dialog', d => d.accept());
    await admin.click('tr[data-lernend="agent.eins"] [data-aktion="passwort"]'); await sleep(1200);
    const neuPw = await admin.$eval('[data-passwort]', el => el.textContent).catch(() => null);
    pruefe(!!neuPw, 'Kein neues Passwort angezeigt');
    pruefe((await a1.api('/api/ich')).status === 401, 'Alte Sitzung gilt nach dem Zurücksetzen weiter');
    const a1neu = await person();
    await anmelden(a1neu, 'agent.eins', 'geheim-eins-1');
    pruefe(!a1neu.url().includes('/spiel/'), 'Altes Passwort funktioniert noch');
    await anmelden(a1neu, 'agent.eins', neuPw || '-');
    pruefe(a1neu.url().includes('/spiel/'), 'Anmeldung mit neuem Passwort klappt nicht');

    // 8) Lehrkraft ändert Benutzername, Codename und Figur – das offene Spiel übernimmt es beim nächsten Speichern
    await geh(admin, `/lehrkraft/klasse/${klasseId}`);
    await admin.click('tr[data-lernend="agent.zwei"] [data-aktion="bearbeiten"]');
    await admin.waitForSelector('dialog[open] [data-av="a07"]', { timeout: 5000 }).catch(() => {});
    await admin.$eval('dialog[open] input[name="benutzername"]', el => { el.value = ''; });
    await admin.type('dialog[open] input[name="benutzername"]', 'agent.drei');
    await admin.$eval('dialog[open] input[name="codename"]', el => { el.value = ''; });
    await admin.type('dialog[open] input[name="codename"]', 'Glasfaser');
    await admin.click('dialog[open] [data-av="a07"]');
    await admin.screenshot({ path: shot('online_bearbeiten'), fullPage: false });
    await admin.click('dialog[open] #bearbeiten-speichern'); await sleep(1500);
    pruefe(!!(await admin.$('tr[data-lernend="agent.drei"]')), 'Umbenannte Person erscheint nicht in der Liste');
    const lern = (await admin.api(`/api/klassen/${klasseId}`)).d.lernende.find(x => x.username === 'agent.drei');
    pruefe(lern && lern.codename === 'Glasfaser' && lern.avatar === 'a07', `Änderung nicht gespeichert: ${JSON.stringify(lern)}`);
    await a2.evaluate(() => OSIGame.sichern()); await sleep(4000); // Antwort bringt die Vorgabe, danach wird sie mitgeschickt
    const duo2 = await a2.evaluate(() => [OSIGame.save.duo.codename, OSIGame.save.duo.avatar].join('|'));
    pruefe(duo2 === 'Glasfaser|a07', `Offenes Spiel übernimmt die Änderung nicht: ${duo2}`);
    const db = new Client({ connectionString: DB }); await db.connect();
    const { rows: [st2] } = await db.query(`select s.codename, s.avatar, s.vorgabe, s.daten->'duo'->'agenten'->>0 as kuerzel from spielstand s join "user" u on u.id = s.user_id where u.username = 'agent.drei'`);
    await db.end();
    pruefe(st2 && st2.codename === 'Glasfaser' && st2.avatar === 'a07' && st2.vorgabe === null && st2.kuerzel === 'agent.drei', `Stand nach Übernahme: ${JSON.stringify(st2)}`);
    const a3 = await person();
    await anmelden(a3, 'agent.drei', 'geheim-zwei-2');
    pruefe(a3.url().includes('/spiel/'), 'Anmeldung mit neuem Benutzernamen klappt nicht');
    const lernUid = lern && lern.id;
    pruefe((await admin.api(`/api/klassen/${klasseId}/lernende/${lernUid}`, { method: 'PATCH', body: JSON.stringify({ benutzername: 'agent.eins' }) })).status === 409, 'Doppelter Benutzername wird angenommen');
    pruefe((await admin.api(`/api/klassen/${klasseId}/lernende/${lernUid}`, { method: 'PATCH', body: JSON.stringify({ benutzername: 'X!' }) })).status === 400, 'Ungültiger Benutzername wird angenommen');
    pruefe((await lk.api(`/api/klassen/${klasseId}/lernende/${lernUid}`, { method: 'PATCH', body: JSON.stringify({ codename: 'Fremd' }) })).status === 404, 'Fremde Lehrkraft darf Lernende ändern');
    // in eine andere eigene Klasse verschieben
    const { d: neuK } = await admin.api('/api/klassen', { method: 'POST', body: JSON.stringify({ name: 'Zweite Klasse' }) });
    const k2 = neuK && (neuK.klasse ? neuK.klasse.id : neuK.id);
    pruefe((await admin.api(`/api/klassen/${klasseId}/lernende/${lernUid}`, { method: 'PATCH', body: JSON.stringify({ klasse: k2 }) })).status === 200, 'Verschieben in eine andere Klasse klappt nicht');
    const { d: k2d } = await admin.api(`/api/klassen/${k2}`);
    pruefe(k2d && k2d.lernende.length === 1 && k2d.lernende[0].username === 'agent.drei', `Verschobene Person nicht in der Zielklasse: ${JSON.stringify(k2d)}`);

    // 9) Lite-Version lädt kein sync.js
    pruefe(!fs.readFileSync(path.join(ROOT, 'spiel', 'index.html'), 'utf8').includes('online/sync.js'), 'Lite-Version lädt sync.js');

    for (const p of [admin, lk, gast, a1, a2, a1neu, a3]) fehler.push(...p.fehler);
  } finally {
    await b.close();
    server.kill();
  }
  if (fehler.length) { console.log('❌ ONLINE FEHLGESCHLAGEN:\n  ' + fehler.join('\n  ') + (process.env.LOG ? '\n' + log : '')); process.exit(1); }
  console.log('✅ Online-Fassung bestanden (Registrierung, Klassen, Sync, Rangliste, Live-Zentrale, Passwort, Lernende ändern, Rechte)');
})().catch(e => { console.error('❌ TESTFEHLER', e); process.exit(1); });
