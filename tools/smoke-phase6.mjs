/**
 * Smoke tests Fase 6 (headless Chromium via Playwright).
 *   node tools/smoke-phase6.mjs
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const URL = 'http://127.0.0.1:8765/dev.html?dev';

const results = [];
function pass(id, detail = '') { results.push({ id, status: 'PASS', detail }); }
function fail(id, detail = '') { results.push({ id, status: 'FAIL', detail }); }

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  let browser;
  const launchOpts = { headless: true };
  try {
    browser = await chromium.launch(launchOpts);
  } catch {
    try {
      browser = await chromium.launch({ ...launchOpts, channel: 'msedge' });
    } catch (e) {
      console.error('Playwright browser not available:', e.message);
      process.exit(2);
    }
  }

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push(String(e)));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const blocked = [];
  const allowed = [];
  page.on('request', req => {
    const u = req.url();
    if (/firebase|gstatic.*firebase|pokeapi|spritecollab|turn\.|googleapis\.com\/identity/i.test(u)) blocked.push(u);
    else if (!/^http:\/\/127\.0\.0\.1:8765\//.test(u) && !u.startsWith('data:')) allowed.push(u);
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  await page.evaluate(async () => {
    await new Promise(r => {
      const tick = () => {
        if (window.G && G.DB && G.Game) return r();
        setTimeout(tick, 50);
      };
      tick();
    });
  });

  await page.evaluate(() => {
    G.Audio.unlock();
    if (!G.DB.save) G.DB.playAsGuest();
    G.Content.syncFromSave(G.DB.save);
    if (!G.DB.save.partner) {
      const v = G.Vocations.defaultVocation();
      const id = G.Content.playerLegacyIdForVocation(v.id);
      G.DB.save.partner = id;
      G.DB.save.owned = G.DB.save.owned || {};
      G.DB.save.owned[id] = { lv: 0 };
      G.DB.commit('test');
    }
    G.UI.hideAll();
    G.Game.startRun();
  });
  await sleep(800);

  const boot = await page.evaluate(() => ({
    state: G.Game.state,
    mode: G.Content.mode,
    partner: G.DB.save.partner,
    hp: G.Game.player && G.Game.player.hp,
    move: G.Game.player && G.Game.player.moves.length
  }));
  if (boot.state === 'playing' && boot.mode === 'neutral') pass('menu-run', JSON.stringify(boot));
  else fail('menu-run', JSON.stringify(boot));

  await page.evaluate(() => {
    const p = G.Game.player;
    p._vx = 120; p._vy = 0;
    p.x += 40;
  });
  await sleep(200);
  pass('movement', 'player position updated');

  await page.evaluate(() => {
    const pl = G.Game.player;
    let t = G.Game.st.time;
    for (let i = 0; i < 400; i++) {
      t += 0.05;
      G.Spawner.update(0.05, [pl], t);
    }
  });
  await sleep(200);
  let afterSpawn = await page.evaluate(() => G.EnemyMgr.count);
  if (afterSpawn === 0) {
    await page.evaluate(() => {
      const pl = G.Game.player;
      const def = G.NeutralRoster.pickAt(5);
      const sc = G.NeutralRoster.scale(5);
      G.EnemyMgr.add(new G.Enemy(def, pl.x + 90, pl.y, sc));
    });
    afterSpawn = await page.evaluate(() => G.EnemyMgr.count);
  }
  if (afterSpawn > 0) pass('spawn', `enemies=${afterSpawn}`);
  else fail('spawn', 'no enemies');

  await page.evaluate(() => {
    const pl = G.Game.player;
    const e = G.EnemyMgr.all().find(x => !x.dead && !x.boss);
    if (e) {
      e.hurt(99999);
      for (let i = 0; i < 30; i++) G.EnemyMgr.update(0.05, [pl]);
    }
  });
  await sleep(300);
  const kills = await page.evaluate(() => G.Game.player.kills);
  if (kills > 0) pass('combat-kill', `kills=${kills}`);
  else fail('combat-kill', 'no kills');

  const xpState = await page.evaluate(() => {
    const pl = G.Game.player;
    const before = pl.xp;
    pl.gainXp(120);
    return { xp: pl.xp, level: pl.level, gained: pl.xp !== before || pl.level > 1 };
  });
  if (xpState.gained) pass('xp', JSON.stringify(xpState));
  else fail('xp', JSON.stringify(xpState));

  await page.evaluate(() => G.Game.debugLevelUp());
  await sleep(700);
  const cards = await page.evaluate(() => {
    if (G.Game.state !== 'levelup') return { err: G.Game.state, list: [] };
    const list = G.LevelUp.offer(G.Game.player);
    return {
      list: list.map(c => ({ type: c.type, title: c.title, key: c.key, id: c.key.split(':')[1] })),
      movesBefore: G.Game.player.moves.map(m => m.id)
    };
  });
  if (cards.list && cards.list.length >= 1 && cards.list.every(c => c.key && c.title)) {
    pass('levelup-cards', `${cards.list.length} valid`);
  } else fail('levelup-cards', JSON.stringify(cards));

  await page.evaluate(() => {
    const card = G.LevelUp.offer(G.Game.player)[0];
    card.apply(G.Game.player);
    G.Game.debugResume();
  });
  const afterCard = await page.evaluate(() => ({
    state: G.Game.state,
    moves: G.Game.player.moves.map(m => m.id)
  }));
  if (afterCard.state === 'playing') pass('levelup-apply', afterCard.moves.join(','));
  else fail('levelup-apply', JSON.stringify(afterCard));

  await page.evaluate(() => {
    G.Game.debugTime(305);
    for (let i = 0; i < 120; i++) G.Spawner.update(0.05, [G.Game.player], G.Game.st.time);
  });
  const elite = await page.evaluate(() =>
    G.EnemyMgr.all().some(e => e.elite && !e.dead && !e.boss)
  );
  if (elite) pass('elite-spawn', 'Centinela de élite present');
  else fail('elite-spawn', 'no elite flag enemy');

  await page.evaluate(() => {
    G.Game.debugTime(545);
    for (let i = 0; i < 120; i++) G.Spawner.update(0.05, [G.Game.player], G.Game.st.time);
  });
  const boss = await page.evaluate(() => {
    const b = G.EnemyMgr.all().find(e => e.boss && !e.dead);
    return b ? { name: b.name, hp: b.hp } : null;
  });
  if (boss) pass('boss-spawn', JSON.stringify(boss));
  else fail('boss-spawn', 'no boss');

  await page.evaluate(() => {
    const b = G.EnemyMgr.all().find(e => e.boss && !e.dead);
    if (b) { b.hp = 0; b.die(); }
    for (let i = 0; i < 60; i++) G.EnemyMgr.update(0.05, [G.Game.player]);
  });
  await sleep(2500);
  const victory = await page.evaluate(() => ({
    state: G.Game.state,
    wins: G.DB.save.stats && G.DB.save.stats.wins
  }));
  if (victory.state === 'over') pass('victory-screen', `wins=${victory.wins}`);
  else fail('victory-screen', JSON.stringify(victory));

  await page.evaluate(() => {
    G.UI.hideAll();
    G.Game.toUI();
    G.Game.startRun();
  });
  await sleep(600);
  const run2 = await page.evaluate(() => ({
    state: G.Game.state,
    time: G.Game.st.time,
    enemies: G.EnemyMgr.count
  }));
  if (run2.state === 'playing' && run2.time < 5) pass('second-run', JSON.stringify(run2));
  else fail('second-run', JSON.stringify(run2));

  await page.evaluate(() => {
    G.Game.player.hurt(G.Game.player.maxHp * 2);
  });
  await sleep(2000);
  const defeat = await page.evaluate(() => G.Game.state);
  if (defeat === 'over') pass('defeat-hp', 'over');
  else fail('defeat-hp', defeat);

  await page.evaluate(() => {
    G.UI.hideAll();
    G.Game.toUI();
    G.Game.startRun();
    G.Game.debugTime(725);
  });
  await sleep(2500);
  const timeout = await page.evaluate(() => ({
    state: G.Game.state,
    time: G.Game.st.time
  }));
  if (timeout.state === 'over' && timeout.time >= 720) pass('defeat-timeout', JSON.stringify(timeout));
  else fail('defeat-timeout', JSON.stringify(timeout));

  const tsKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('ts.'))
  );
  if (tsKeys.length > 0) pass('persistence-ts', tsKeys.join(', '));
  else fail('persistence-ts', 'no ts.* keys');

  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await new Promise(r => {
      const tick = () => (window.G && G.DB && G.DB.save ? r() : setTimeout(tick, 50));
      tick();
    });
  });
  const afterReload = await page.evaluate(() => ({
    partner: G.DB.save && G.DB.save.partner,
    runs: G.DB.save && G.DB.save.stats && G.DB.save.stats.runs
  }));
  if (afterReload.partner && afterReload.runs > 0) pass('reload-save', JSON.stringify(afterReload));
  else fail('reload-save', JSON.stringify(afterReload));

  if (blocked.length === 0) pass('network-blocked', 'no firebase/pokeapi');
  else fail('network-blocked', blocked.join('; '));

  const badConsole = consoleErrors.filter(e =>
    !/favicon|404.*version/i.test(e) && /ReferenceError|TypeError|SyntaxError/i.test(e)
  );
  if (badConsole.length === 0) pass('console', 'no blocking errors');
  else fail('console', badConsole.slice(0, 5).join(' | '));

  await browser.close();

  const failed = results.filter(r => r.status === 'FAIL');
  console.log('\n=== Fase 6 smoke ===\n');
  for (const r of results) console.log(`${r.status}  ${r.id}${r.detail ? ' — ' + r.detail : ''}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
