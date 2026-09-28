(() => {
  'use strict';

  // ---------- utilities ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => {
    n = Math.round(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
    return String(n);
  };
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function makeRng(seed) {
    let a = hashStr(String(seed));
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hexA = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const shortName = c => String(c.name || '').replace(/^(the\s+)?(people's republic|democratic republic|republic|kingdom|union|federation|commonwealth|empire|state|emirate|confederation)\s+of\s+/i, '').replace(/\s+(republic|federation|union|commonwealth|empire|kingdom|confederation|state)$/i, '') || c.name;

  // ---------- data ----------
  const LS_CFG = 'triad.ww3.config.v1';
  const LS_RUNS = 'triad.ww3.runs.v1';

  const DOCTRINES = {
    'Blitzkrieg': 'Overwhelming early offensives; fades if the war drags on.',
    'Defensive Depth': 'Trades space for time. Brutal to attack.',
    'Asymmetric': 'Punches above its weight when outgunned.',
    'Naval Supremacy': 'Dominates maritime and littoral theaters.',
    'Cyber Warfare': 'Cripples enemy economies before shots are fired.',
    'Attrition': 'Absorbs losses and bleeds the enemy dry.'
  };
  const STANCES = { Hawkish: 1.4, Pragmatic: 1.0, Dovish: 0.7 };

  const FLASHPOINTS = {
    naval: { label: 'Naval incident in a contested strait', text: (a, d) => `A ${shortName(a)} destroyer and a ${shortName(d)} frigate exchange fire in disputed waters. 212 sailors are lost. Both capitals blame the other within the hour.` },
    border: { label: 'Border skirmish spirals', text: (a, d) => `An artillery duel on the ${shortName(a)}–${shortName(d)} frontier kills 40 soldiers. Mobilization orders go out overnight.` },
    assassination: { label: 'Assassination of a head of state', text: (a, d) => `A senior ${shortName(a)} minister is killed in a car bomb in ${a.capital}. Intelligence points — rightly or not — at ${shortName(d)}.` },
    resource: { label: 'Resource war over rare earths', text: (a, d) => `${shortName(d)} nationalizes the rare-earth fields that feed ${shortName(a)}'s industry. ${a.leader} calls it "an act of economic war."` },
    cyber: { label: 'Nationwide cyber blackout', text: (a, d) => `${a.capital} goes dark after a crippling cyberattack on the grid. Forensics trace the code to units linked with ${shortName(d)}.` },
    coup: { label: 'Disputed election & coup', text: (a, d) => `A contested election in a buffer state ends in a coup backed by ${shortName(d)}. ${shortName(a)} moves troops to "restore order."` }
  };

  const TOWNS = ['Brask', 'Tervo', 'Hollin', 'Mirakh', 'Oskel', 'Varnholm', 'Duvna', 'Lirr', 'Kestrel', 'Sedan', 'Iskar', 'Morrow', 'Pellin', 'Zadar Ridge', 'Grel', 'Carrow'];
  const RIVERS = ['Vesk', 'Amar', 'Dolen', 'Sarn', 'Orla', 'Tiva'];
  const STRAITS = ['Kerrin', 'Maro', 'Ashgard', 'Solace', 'Venn'];
  const SEAS = ['Ashen', 'Cobalt', 'Northern', 'Amber', 'Iron'];
  const NEUTRAL_CITIES = ['Geneva', 'Reykjavík', 'Singapore', 'Montevideo', 'Helsinki', 'Oslo'];
  const CYBER_TARGETS = ['national power grid', 'central banking network', 'satellite constellation', 'port logistics systems', 'rail signalling network', 'military command network'];
  const TECH = ['autonomous drone swarms', 'hypersonic glide missiles', 'AI-directed artillery', 'a directed-energy air-defense shield', 'quantum-secured battlefield comms', 'stealth submarine drones'];
  const WAR_QUOTES = ['We did not choose this war, but we will finish it.', 'History will judge who struck first.', 'Our patience has ended.', 'There will be no negotiation under fire.', 'Every inch of our soil is sacred.'];
  const OP_A = ['Iron', 'Crimson', 'Silent', 'Broken', 'Northern', 'Pale', 'Burning', 'Glass', 'Black', 'Last', 'Winter', 'Shattered'];
  const OP_B = ['Meridian', 'Tide', 'Horizon', 'Trident', 'Covenant', 'Eclipse', 'Anvil', 'Lantern', 'Dominion', 'Rubicon', 'Sovereign', 'Triangle'];

  const SAMPLE = {
    countries: [
      { name: 'Republic of Valdoria', leader: 'President Elena Marić', capital: 'Castel Varo', region: 'Vesna Valley', color: '#38bdf8', pop: 84, gdp: 3.9, budget: 68, troops: 310, nukes: 0, tech: 8, air: 8, navy: 5, morale: 8, doctrine: 'Defensive Depth', stance: 'Pragmatic' },
      { name: 'Kharesh Federation', leader: 'Marshal Dmitri Orlov-Kan', capital: 'Novy Kharesh', region: 'Steppe Oblast', color: '#ef4444', pop: 142, gdp: 2.1, budget: 94, troops: 1150, nukes: 1600, tech: 6, air: 7, navy: 6, morale: 6, doctrine: 'Blitzkrieg', stance: 'Hawkish' },
      { name: 'Aurelian Union', leader: 'Chancellor Amara Osei-Laurent', capital: 'Port Solenne', region: 'Gilded Coast', color: '#f59e0b', pop: 210, gdp: 5.4, budget: 120, troops: 540, nukes: 290, tech: 9, air: 8, navy: 9, morale: 5, doctrine: 'Naval Supremacy', stance: 'Dovish' }
    ],
    settings: { flashpoint: 'naval', turns: 14, drama: 62, nuclear: 'tactical', seed: 'ORION-7' }
  };

  const FIELDS = [
    { k: 'name', label: 'Nation name', type: 'text', span: 2 },
    { k: 'leader', label: 'Leader', type: 'text', span: 2 },
    { k: 'capital', label: 'Capital', type: 'text' },
    { k: 'region', label: 'Heartland region', type: 'text' },
    { k: 'pop', label: 'Population (M)', type: 'number', min: 1, max: 2000, step: 1 },
    { k: 'gdp', label: 'GDP ($T)', type: 'number', min: 0.1, max: 40, step: 0.1 },
    { k: 'budget', label: 'Defense ($B/yr)', type: 'number', min: 1, max: 1500, step: 1 },
    { k: 'troops', label: 'Active troops (K)', type: 'number', min: 5, max: 4000, step: 5 },
    { k: 'nukes', label: 'Nuclear warheads', type: 'number', min: 0, max: 7000, step: 10 },
    { k: 'color', label: 'Map color', type: 'color' },
    { k: 'doctrine', label: 'Military doctrine', type: 'select', options: Object.keys(DOCTRINES) },
    { k: 'stance', label: 'Leadership stance', type: 'select', options: Object.keys(STANCES) },
    { k: 'tech', label: 'Technology', type: 'range' },
    { k: 'air', label: 'Air power', type: 'range' },
    { k: 'navy', label: 'Naval power', type: 'range' },
    { k: 'morale', label: 'National resolve', type: 'range' }
  ];
  const NUMERIC = new Set(['pop', 'gdp', 'budget', 'troops', 'nukes', 'tech', 'air', 'navy', 'morale']);

  // ---------- state ----------
  const clone = o => JSON.parse(JSON.stringify(o));
  let cfg = loadCfg();
  let runs = loadRuns();
  let run = null;
  let mapModel = null;
  const play = { k: 0, timer: null, metric: 'territory' };

  function loadCfg() {
    try {
      const c = JSON.parse(localStorage.getItem(LS_CFG));
      if (c && Array.isArray(c.countries) && c.countries.length === 3 && c.settings) return c;
    } catch (e) { /* ignore */ }
    return { ...clone(SAMPLE), isSample: true };
  }
  function loadRuns() { try { return JSON.parse(localStorage.getItem(LS_RUNS)) || []; } catch (e) { return []; } }
  let saveT;
  function saveCfg() { clearTimeout(saveT); saveT = setTimeout(() => localStorage.setItem(LS_CFG, JSON.stringify(cfg)), 150); }
  function saveRuns() { localStorage.setItem(LS_RUNS, JSON.stringify(runs.slice(0, 15))); }

  // ---------- simulation ----------
  function basePower(c) {
    return Math.sqrt(+c.troops || 0) * 1.2 + (+c.tech || 0) * 7 + (+c.air || 0) * 4 + (+c.navy || 0) * 3 +
      Math.log10((+c.budget || 0) + 1) * 18 + Math.sqrt(+c.pop || 0) * 0.8 + (+c.gdp || 0) * 2;
  }

  function directorPlan(C, settings) {
    const P = C.map(basePower);
    const order = [0, 1, 2].sort((a, b) => P[b] - P[a]);
    const ratio = P[order[0]] / Math.max(1, P[order[2]]);
    const notes = [];
    const sn = i => esc(shortName(C[i]));
    notes.push({ icon: '📊', text: `Combat power index: <b>${sn(order[0])}</b> ${P[order[0]].toFixed(0)}, <b>${sn(order[1])}</b> ${P[order[1]].toFixed(0)}, <b>${sn(order[2])}</b> ${P[order[2]].toFixed(0)} — a ${ratio.toFixed(2)}× spread.` });
    let arc;
    if (ratio > 1.3) { arc = 'The Underdog Stand'; notes.push({ icon: '🎬', text: `Clear imbalance. To avoid a foregone conclusion the Director will let fear of <b>${sn(order[0])}</b> drive the weaker powers together. Watch for coalition dynamics.` }); }
    else if (ratio < 1.1) { arc = 'Three-Body Problem'; notes.push({ icon: '🎬', text: 'Near-parity. Whoever wins the alliance game wins the war — expect shifting loyalties and betrayal.' }); }
    else { arc = 'Clash of Titans'; notes.push({ icon: '🎬', text: `Uneven but contestable. <b>${sn(order[0])}</b> is favored, but doctrine and morale can flip individual fronts.` }); }
    const nukeStates = C.filter(c => +c.nukes > 0);
    if (nukeStates.length && settings.nuclear !== 'taboo') {
      if (nukeStates.length >= 2) arc = 'Brinkmanship';
      notes.push({ icon: '☢️', text: `${nukeStates.map(c => `<b>${esc(shortName(c))}</b>`).join(' and ')} hold${nukeStates.length === 1 ? 's' : ''} nuclear weapons. Doctrine "${settings.nuclear === 'open' ? 'No limits' : 'Tactical'}": a cornered nuclear state may cross the threshold${settings.nuclear === 'open' ? ' — and retaliation could escalate to a strategic exchange' : ''}.` });
    } else if (nukeStates.length) {
      notes.push({ icon: '🕊️', text: 'The nuclear taboo holds in this scenario: warheads are leverage, never used.' });
    }
    C.forEach((c, i) => {
      if (c.doctrine === 'Blitzkrieg') notes.push({ icon: '⚡', text: `<b>${sn(i)}</b> runs a Blitzkrieg doctrine: expect a violent opening. If it stalls by month ${Math.ceil(settings.turns / 3)}, it becomes a quagmire.` });
      if (c.doctrine === 'Defensive Depth') notes.push({ icon: '🛡️', text: `<b>${sn(i)}</b> will trade space for time — attackers pay a 30% premium.` });
      if (c.doctrine === 'Cyber Warfare') notes.push({ icon: '💻', text: `<b>${sn(i)}</b> will open a digital front against enemy economies.` });
      if (c.doctrine === 'Asymmetric') notes.push({ icon: '🎯', text: `<b>${sn(i)}</b> fights asymmetrically — dangerous precisely when it looks beaten.` });
    });
    const d = +settings.drama;
    notes.push({ icon: '🎚️', text: `Drama dial ${d}%: ${d > 70 ? 'Hollywood cut — high volatility, dramatic reversals, frequent alliance shocks.' : d > 35 ? 'Balanced cut — plausible, but eventful.' : 'Realist cut — grinding, strategic, few miracles.'}` });
    return { arc, notes, P };
  }

  function simulate(countries, settings) {
    const rng = makeRng(settings.seed || 'seed');
    const pick = arr => arr[Math.floor(rng() * arr.length)];
    const pickW = (arr, w) => { const ws = arr.map(w); let r = rng() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
    const N = clamp(+settings.turns || 12, 6, 24);
    const drama = clamp(+settings.drama || 0, 0, 100) / 100;
    const policy = settings.nuclear;
    const C = countries.map((c, i) => ({ ...c, i, base: basePower(c) }));
    const S = C.map(c => ({ forces: 100, morale: clamp(c.morale * 10, 10, 100), econ: 100, territory: 100 / 3, mil: 0, civ: 0, disp: 0, nukesUsed: 0, warned: false, alive: true, techBonus: 1, belligerent: false }));
    const H = [[0, 0.2, 0.2], [0.2, 0, 0.2], [0.2, 0.2, 0]];
    const setH = (a, b, v) => { H[a][b] = H[b][a] = v; };
    const nm = i => esc(shortName(C[i]));
    const others = i => [0, 1, 2].filter(j => j !== i);
    const alive = () => [0, 1, 2].filter(i => S[i].alive);
    let coalition = null, coalitions = 0, joined = false, ended = null, nuclearExchange = false, nukesDetonated = 0;
    const turns = [];

    const power = (i, t) => {
      const c = C[i], s = S[i];
      let p = c.base * s.techBonus * Math.pow(Math.max(s.forces, 1) / 100, 0.8) * (0.55 + s.morale / 100 * 0.6) * (0.7 + s.econ / 100 * 0.4);
      if (c.doctrine === 'Blitzkrieg') p *= t <= N / 3 ? 1.12 : 0.95;
      return p;
    };
    function normalize() {
      const sum = S.reduce((a, s) => a + (s.alive ? Math.max(0, s.territory) : 0), 0) || 1;
      S.forEach(s => {
        s.territory = s.alive ? Math.max(0, s.territory) / sum * 100 : 0;
        s.forces = clamp(s.forces, 0, 100); s.morale = clamp(s.morale, 3, 100); s.econ = clamp(s.econ, 2, 100);
      });
    }
    function snapshot(t, events) {
      normalize();
      turns.push({ t, events, s: S.map(x => ({ ...x })), coalition: coalition ? { ...coalition } : null, nukes: nukesDetonated });
    }
    function capitulate(loser, winner, ev) {
      S[loser].alive = false; S[loser].forces = 0;
      S[winner].territory += S[loser].territory; S[loser].territory = 0;
      S[winner].morale += 12;
      ev.push({ type: 'capitulate', icon: '🏳️', big: true, a: winner, d: loser, title: `${nm(loser)} capitulates`, text: `${esc(C[winner].name)} forces enter ${esc(C[loser].capital)}. ${esc(C[loser].leader)} signs an unconditional surrender.` });
      if (coalition && (coalition.against === loser || coalition.members.includes(loser))) coalition = null;
    }

    function battle(a, d, t, ev) {
      const A = C[a], D = C[d];
      const naval = rng() < 0.12 + (+A.navy + +D.navy) / 45;
      let pa = power(a, t), pd = power(d, t);
      if (A.doctrine === 'Blitzkrieg') pa *= t <= N / 3 ? 1.25 : 0.95;
      if (D.doctrine === 'Defensive Depth') pd *= 1.3;
      if (A.doctrine === 'Asymmetric' && pa < pd) pa *= 1.22;
      if (D.doctrine === 'Asymmetric' && pd < pa) pd *= 1.22;
      if (naval) {
        pa *= 0.8 + A.navy / 25; pd *= 0.8 + D.navy / 25;
        if (A.doctrine === 'Naval Supremacy') pa *= 1.3;
        if (D.doctrine === 'Naval Supremacy') pd *= 1.3;
      }
      if (A.doctrine === 'Cyber Warfare') pd *= 0.9;
      if (D.doctrine === 'Cyber Warfare') pa *= 0.93;
      const atCapital = S[d].territory < 14;
      if (atCapital) pd *= 1.25;
      const finale = t === N;
      const p = pa / (pa + pd);
      let swing = (p - 0.5) * 1.6 + (rng() - 0.5) * (0.35 + 0.45 * drama);
      if (finale) swing *= 1.5;
      let gain = clamp(swing * 14, -9, 9);
      gain = gain > 0 ? Math.min(gain, S[d].territory) : -Math.min(-gain, S[a].territory * 0.6);
      S[a].territory += gain; S[d].territory -= gain;
      const attrA = D.doctrine === 'Attrition' ? 1.2 : 1, attrD = A.doctrine === 'Attrition' ? 1.2 : 1;
      const lossA = (2.5 + (1 - p) * 8) * (0.6 + rng() * 0.8) * attrA * (A.doctrine === 'Attrition' ? 0.85 : 1);
      const lossD = (2.5 + p * 8) * (0.6 + rng() * 0.8) * attrD * (D.doctrine === 'Attrition' ? 0.85 : 1);
      S[a].forces -= lossA; S[d].forces -= lossD;
      S[a].morale += gain * 1.1; S[d].morale -= gain * 1.1;
      S[a].econ -= 1.5 + rng() * 2; S[d].econ -= 2 + rng() * 3 + Math.max(0, gain) * 0.3;
      const kA = lossA / 100 * A.troops * 1000 * 0.45, kD = lossD / 100 * D.troops * 1000 * 0.45;
      S[a].mil += kA; S[d].mil += kD;
      const loser = gain >= 0 ? d : a;
      const civ = (kA + kD) * (0.18 + rng() * 0.2) * (atCapital ? 3 : 1);
      S[loser].civ += civ;
      S[loser].disp += Math.abs(gain) / 100 * C[loser].pop * 1e6 * 0.3;

      const sa = esc(shortName(A)), sd = esc(shortName(D));
      let loc;
      if (atCapital && !naval) loc = `the gates of ${esc(D.capital)}`;
      else if (naval) loc = pick([`the Strait of ${pick(STRAITS)}`, `the ${esc(D.region)} coast`, `the ${pick(SEAS)} Sea`, `the ${esc(D.capital)} approaches`]);
      else loc = pick([esc(D.region), pick(TOWNS), `the ${sa}–${sd} frontier`, `the ${pick(RIVERS)} River crossings`, `${pick(TOWNS)} Gap`, `the ${esc(D.region)} highlands`]);
      const g = Math.abs(gain).toFixed(1);
      let text;
      if (gain > 5) text = `${sa} forces smash through at ${loc}. ${sd} lines collapse; ${g}% of the theater changes hands.`;
      else if (gain > 1.5) text = `${sa} grinds forward at ${loc}, taking ${g}% of contested ground at heavy cost.`;
      else if (gain > -1.5) text = `Bloody stalemate at ${loc}. Neither ${sa} nor ${sd} breaks.`;
      else if (gain > -5) text = `${sa}'s offensive at ${loc} is repulsed. ${sd} counterattacks and retakes ${g}%.`;
      else text = `Disaster for ${sa} at ${loc}: ${sd} routs the assault and drives ${g}% deep into ${sa}-held territory.`;
      text += ` <span class="text-slate-500">(${fmt(kA)} / ${fmt(kD)} casualties)</span>`;
      ev.push({ type: naval ? 'naval' : 'battle', icon: naval ? '⚓' : '⚔️', title: `${finale ? 'Decisive battle' : naval ? 'Naval battle' : 'Battle'} of ${loc.replace(/^the /, '')}`, text, a, d, gain, mag: Math.abs(gain) });

      [d, a].forEach(x => {
        if (S[x].alive && (S[x].territory < 2.5 || S[x].forces < 6)) capitulate(x, x === d ? a : d, ev);
      });
    }

    // Opening
    const fpKey = FLASHPOINTS[settings.flashpoint] ? settings.flashpoint : 'border';
    const fp = FLASHPOINTS[fpKey];
    const agg = [0, 1, 2].map(i => ({ i, w: STANCES[C[i].stance] * C[i].base * (0.85 + rng() * 0.3) })).sort((x, y) => y.w - x.w)[0].i;
    const oth = others(agg);
    let tgt;
    if (fpKey === 'resource') tgt = +C[oth[0]].gdp >= +C[oth[1]].gdp ? oth[0] : oth[1];
    else if (fpKey === 'cyber' || fpKey === 'assassination') tgt = +C[oth[0]].tech >= +C[oth[1]].tech ? oth[0] : oth[1];
    else tgt = pick(oth);
    const neutral = [0, 1, 2].find(i => i !== agg && i !== tgt);
    setH(agg, tgt, 1); S[agg].belligerent = S[tgt].belligerent = true;
    snapshot(0, [
      { type: 'start', icon: '🔥', big: true, title: fp.label, text: fp.text(C[agg], C[tgt]).replace(/[<>]/g, '') },
      { type: 'war', icon: '📜', a: agg, d: tgt, title: `${nm(agg)} declares war on ${nm(tgt)}`, text: `${esc(C[agg].leader)}: “${pick(WAR_QUOTES)}”` },
      { type: 'neutral', icon: '👁️', a: neutral, title: `${nm(neutral)} watches`, text: `${esc(C[neutral].leader)} mobilizes reserves but keeps ${nm(neutral)} out of the fighting — for now.` }
    ]);

    for (let t = 1; t <= N && !ended; t++) {
      const ev = [];
      let al = alive();

      // Third power decides
      if (!joined && S[neutral].alive && t >= 2) {
        const chance = 0.25 + drama * 0.35 + (t >= 4 ? 0.3 : 0);
        if (rng() < chance) {
          joined = true;
          const ps = [agg, tgt].filter(i => S[i].alive).sort((x, y) => power(y, t) - power(x, t));
          const strongest = ps[0], weaker = ps[1];
          const balance = weaker === undefined || rng() < 0.45 + drama * 0.35;
          const enemy = balance ? strongest : weaker, friend = balance ? weaker : strongest;
          setH(neutral, enemy, 1); if (friend !== undefined) setH(neutral, friend, 0.08);
          S[neutral].belligerent = true;
          ev.push({ type: 'join', icon: '🎖️', big: true, a: neutral, d: enemy, title: `${nm(neutral)} enters the war`, text: balance ? `Fearing a ${nm(enemy)} victory, ${esc(C[neutral].leader)} commits ${nm(neutral)} forces against ${nm(enemy)}.` : `Sensing weakness, ${nm(neutral)} opportunistically strikes ${nm(enemy)} to share the spoils.` });
        } else if (t === 3) {
          S[neutral].econ = Math.min(100, S[neutral].econ + 4);
          ev.push({ type: 'neutral', icon: '💰', a: neutral, title: `${nm(neutral)} profits`, text: `${nm(neutral)} sells arms and fuel to both sides while its generals draw up plans.` });
        }
      }

      // Coalition against a runaway leader
      al = alive();
      if (joined && !coalition && coalitions < 2 && al.length === 3) {
        const lead = al.slice().sort((x, y) => S[y].territory - S[x].territory)[0];
        if (S[lead].territory > 44 - drama * 4 && rng() < 0.3 + drama * 0.5) {
          const [x, y] = others(lead);
          setH(x, y, 0.05); setH(lead, x, 1); setH(lead, y, 1);
          coalition = { against: lead, since: t, members: [x, y] }; coalitions++;
          ev.push({ type: 'alliance', icon: '🤝', big: true, a: x, d: lead, title: 'Emergency pact', text: `Alarmed by ${nm(lead)}'s advance, ${nm(x)} and ${nm(y)} sign a mutual-defense pact. Two fronts now face ${esc(C[lead].leader)}.` });
        }
      }
      // Betrayal
      if (coalition && t - coalition.since >= 3 && al.length === 3 && S[coalition.against].territory < 36 && rng() < 0.1 + drama * 0.25) {
        const [x, y] = coalition.members;
        const traitor = S[x].territory > S[y].territory ? x : y, victim = traitor === x ? y : x;
        setH(x, y, 1); setH(traitor, coalition.against, 0.5);
        ev.push({ type: 'betrayal', icon: '🗡️', big: true, a: traitor, d: victim, title: 'The pact shatters', text: `With ${nm(coalition.against)} contained, ${nm(traitor)} turns its guns on its former ally ${nm(victim)}.` });
        coalition = null;
      }

      // Cyber front
      for (const i of al) {
        if (!S[i].belligerent) continue;
        const cyb = C[i].doctrine === 'Cyber Warfare';
        if (rng() < (cyb ? 0.4 : C[i].tech >= 8 ? 0.12 : 0.04)) {
          const enemies = al.filter(j => j !== i && H[i][j] >= 0.5);
          if (!enemies.length) continue;
          const j = pick(enemies), dmg = (cyb ? 8 : 5) + rng() * 7;
          S[j].econ -= dmg; S[j].morale -= 3;
          ev.push({ type: 'cyber', icon: '💻', a: i, d: j, title: 'Cyber offensive', text: `${nm(i)} operators take down ${nm(j)}'s ${pick(CYBER_TARGETS)}. Output falls ${dmg.toFixed(0)}%.` });
        }
      }
      // Tech breakthrough
      if (rng() < 0.1 + drama * 0.08) {
        const cands = al.filter(i => C[i].tech >= 5 && S[i].belligerent);
        if (cands.length) {
          const i = pick(cands); S[i].techBonus *= 1.12;
          ev.push({ type: 'tech', icon: '🚀', a: i, title: 'Battlefield breakthrough', text: `${nm(i)} fields ${pick(TECH)}, gaining a sudden edge.` });
        }
      }
      // Home front
      for (const i of al) {
        if (S[i].morale < 35 && rng() < 0.45) {
          S[i].forces -= 3; S[i].morale -= 4;
          ev.push({ type: 'home', icon: '📢', a: i, title: 'Home front cracks', text: pick([`Mass anti-war protests fill the streets of ${esc(C[i].capital)}.`, `Desertions surge as ${nm(i)} extends conscription to 45-year-olds.`, `A general strike paralyzes ${nm(i)}'s war industry.`]) });
        } else if (S[i].econ < 40 && rng() < 0.3) {
          S[i].morale -= 5;
          ev.push({ type: 'home', icon: '📉', a: i, title: 'Economic freefall', text: `Rationing and ${pick(['hyperinflation', 'fuel shortages', 'bank runs', 'rolling blackouts'])} grip ${nm(i)}.` });
        }
      }
      // Nuclear decisions
      for (const i of al) {
        if (!(+C[i].nukes > 0) || S[i].nukesUsed || !S[i].belligerent) continue;
        if (!(S[i].territory < 20 || S[i].forces < 30)) continue;
        const enemies = al.filter(j => j !== i && H[i][j] >= 0.5);
        if (!enemies.length) continue;
        const foe = enemies.sort((x, y) => power(y, t) - power(x, t))[0];
        if (!S[i].warned) {
          S[i].warned = true;
          ev.push({ type: 'warning', icon: '⚠️', big: true, a: i, d: foe, title: 'Nuclear alert', text: `${nm(i)} raises its strategic forces to maximum readiness. ${esc(C[i].leader)} warns ${nm(foe)} of “consequences never seen in history.”` });
          continue;
        }
        if (policy === 'taboo') {
          if (rng() < 0.5) ev.push({ type: 'restraint', icon: '🕊️', a: i, title: 'The taboo holds', text: `Back-channel diplomacy and a refusal inside the chain of command keep ${nm(i)}'s arsenal in its silos.` });
          continue;
        }
        const prob = ({ Hawkish: 0.42, Pragmatic: 0.2, Dovish: 0.08 }[C[i].stance] || 0.2) * (policy === 'open' ? 1.6 : 1) * (0.6 + drama * 0.8);
        if (rng() < prob) {
          S[i].nukesUsed = 1; nukesDetonated += 1 + Math.floor(rng() * 3);
          const civ = Math.round((40 + rng() * 160) * 1000);
          S[foe].forces -= 22; S[foe].econ -= 18; S[foe].civ += civ; S[foe].disp += civ * 8;
          S[foe].morale += rng() < 0.5 ? 8 : -15;
          S[i].morale -= 5;
          al.forEach(j => { S[j].econ -= 5; });
          ev.push({ type: 'nuke', icon: '☢️', big: true, a: i, d: foe, title: 'The nuclear threshold is crossed', text: `${nm(i)} detonates tactical warheads over ${nm(foe)} formations in ${esc(C[foe].region)}. An estimated ${fmt(civ)} civilians die. Global markets crash.` });
          if (policy === 'open' && +C[foe].nukes > 0 && rng() < 0.45 + drama * 0.3) {
            nuclearExchange = true;
            const c1 = Math.round((2 + rng() * 9) * 1e6), c2 = Math.round((2 + rng() * 9) * 1e6);
            S[i].civ += c1; S[foe].civ += c2; S[i].disp += c1 * 4; S[foe].disp += c2 * 4;
            [i, foe].forEach(j => { S[j].econ -= 45; S[j].forces -= 30; S[j].morale -= 25; });
            nukesDetonated += 20 + Math.floor(rng() * 80);
            ev.push({ type: 'nuke', icon: '☢️', big: true, a: foe, d: i, title: 'Strategic exchange', text: `${nm(foe)} retaliates with its strategic arsenal. ${esc(C[i].capital)} and ${esc(C[foe].capital)} are gone. Combined dead: ${fmt(c1 + c2)}.` });
            ended = 'exchange';
          }
          break;
        }
      }
      // Armistice
      al = alive();
      if (!ended && t > N * 0.6 && al.length >= 2) {
        const avgF = al.reduce((s, i) => s + S[i].forces, 0) / al.length;
        if (avgF < 42 && rng() < 0.2 + (1 - drama) * 0.25) {
          ended = 'armistice';
          ev.push({ type: 'ceasefire', icon: '🕊️', big: true, title: 'Armistice signed', text: `Exhausted, the belligerents sign an armistice in ${pick(NEUTRAL_CITIES)}. The guns fall silent along a new line of control.` });
        }
      }
      // Battles
      if (!ended) {
        const nb = 1 + (rng() < 0.3 + drama * 0.4 ? 1 : 0) + (t === N ? 1 : 0);
        for (let b = 0; b < nb; b++) {
          const al2 = alive(), pairs = [];
          for (let x = 0; x < al2.length; x++) for (let y = x + 1; y < al2.length; y++) if (H[al2[x]][al2[y]] >= 0.5) pairs.push([al2[x], al2[y]]);
          if (!pairs.length) break;
          let [a, d] = pickW(pairs, p => H[p[0]][p[1]] * (STANCES[C[p[0]].stance] + STANCES[C[p[1]].stance]));
          const wa = STANCES[C[a].stance] * power(a, t) * (S[a].territory < S[d].territory ? 1.2 : 1);
          const wd = STANCES[C[d].stance] * power(d, t) * (S[d].territory < S[a].territory ? 1.2 : 1);
          if (rng() * (wa + wd) > wa) [a, d] = [d, a];
          battle(a, d, t, ev);
        }
      }
      // Attrition & reinforcement
      alive().forEach(i => {
        if (!S[i].belligerent) return;
        S[i].econ -= 1.2; S[i].morale -= 0.8;
        S[i].forces = Math.min(100, S[i].forces + 1.5 + Math.min(3, C[i].pop / 150) * (S[i].econ / 100));
      });
      snapshot(t, ev);
      const al3 = alive();
      let hostile = false;
      for (let x = 0; x < al3.length; x++) for (let y = x + 1; y < al3.length; y++) if (H[al3[x]][al3[y]] >= 0.5) hostile = true;
      if (!ended && al3.length <= 1) ended = 'total';
      else if (!ended && !hostile && al3.length > 1 && joined) ended = 'peace';
    }

    // headlines + turning point
    turns.forEach(tr => {
      const ev = tr.events;
      tr.headline = ev.find(e => e.type === 'nuke') || ev.find(e => e.type === 'capitulate') || ev.find(e => e.big && e.type !== 'start') ||
        ev.filter(e => e.mag !== undefined).sort((x, y) => y.mag - x.mag)[0] || ev[0] || { icon: '⏳', title: 'An uneasy month', text: 'Both sides dig in and resupply.' };
    });
    let tp = turns[1] || turns[0], best = -1;
    for (let i = 1; i < turns.length; i++) {
      const dlt = turns[i].s.reduce((s, x, j) => s + Math.abs(x.territory - turns[i - 1].s[j].territory), 0) + (turns[i].events.some(e => e.type === 'nuke') ? 50 : 0);
      if (dlt > best) { best = dlt; tp = turns[i]; }
    }

    // outcome
    const fin = turns[turns.length - 1].s;
    const ranking = [0, 1, 2].map(i => ({ i, score: fin[i].alive ? fin[i].territory * 0.6 + fin[i].forces * 0.25 + fin[i].econ * 0.15 : 0 })).sort((x, y) => y.score - x.score);
    const w = ranking[0].i, W = fin[w];
    const aliveN = fin.filter(s => s.alive).length;
    let cls;
    if (nuclearExchange) cls = 'Mutual Assured Ruin';
    else if (aliveN === 1) cls = 'Total Victory';
    else if (ended === 'armistice') cls = 'Armistice';
    else if (W.territory > 50) cls = W.forces < 35 ? 'Pyrrhic Victory' : 'Decisive Victory';
    else if (W.forces < 35) cls = 'Pyrrhic Victory';
    else if (ended === 'peace') cls = 'Negotiated Peace';
    else cls = 'Frozen Conflict';

    const months = turns.length - 1;
    const WN = nm(w);
    const epi = [];
    const lead = {
      'Mutual Assured Ruin': `There are no winners. After ${months} months the war ends in radioactive ash; ${WN} is merely the least destroyed state left standing.`,
      'Total Victory': `${WN} stands alone. After ${months} months, every rival has capitulated and ${esc(C[w].leader)} redraws the map of the continent.`,
      'Armistice': `An armistice after ${months} months freezes the lines. ${WN} holds the strongest hand at the table with ${W.territory.toFixed(0)}% of the theater.`,
      'Decisive Victory': `${WN} wins decisively, controlling ${W.territory.toFixed(0)}% of the theater after ${months} months of war.`,
      'Pyrrhic Victory': `${WN} comes out on top — barely. It controls ${W.territory.toFixed(0)}% of the theater, but its armies are at ${W.forces.toFixed(0)}% strength.`,
      'Negotiated Peace': `With no hostile fronts left, the powers negotiate. ${WN} emerges with the upper hand after ${months} months.`,
      'Frozen Conflict': `No one breaks. After ${months} months the front hardens into a frozen conflict, with ${WN} marginally ahead.`
    }[cls];
    epi.push(lead);
    epi.push(`Turning point — month ${tp.t}: <b>${tp.headline.title}</b>. ${tp.headline.text}`);
    ranking.slice(1).forEach(r => {
      const s = fin[r.i];
      epi.push(!s.alive ? `${nm(r.i)} ceased to exist as a belligerent; ${esc(C[r.i].leader)}'s government is in exile.`
        : `${nm(r.i)} ends the war holding ${s.territory.toFixed(0)}% of the theater with an economy at ${s.econ.toFixed(0)}% of pre-war output.`);
    });

    return { turns, N, outcome: { cls, winner: w, ranking, tp: tp.t, epi }, C: C.map(c => ({ ...c })) };
  }

  // ---------- nation cards ----------
  function fieldHTML(f, c, i) {
    const v = c[f.k];
    const id = `f${i}_${f.k}`;
    const span = f.span === 2 ? 'col-span-2' : '';
    if (f.type === 'range') return `<div class="field ${span}"><label for="${id}">${f.label} <span class="mono text-slate-200" data-val="${i}_${f.k}">${v}/10</span></label><input id="${id}" data-i="${i}" data-k="${f.k}" type="range" min="1" max="10" step="1" value="${esc(v)}"></div>`;
    if (f.type === 'select') return `<div class="field ${span}"><label for="${id}">${f.label}</label><select id="${id}" data-i="${i}" data-k="${f.k}">${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    if (f.type === 'color') return `<div class="field ${span}"><label for="${id}">${f.label}</label><input id="${id}" data-i="${i}" data-k="${f.k}" type="color" value="${esc(v)}"></div>`;
    return `<div class="field ${span}"><label for="${id}">${f.label}</label><input id="${id}" data-i="${i}" data-k="${f.k}" type="${f.type}" ${f.type === 'number' ? `min="${f.min}" max="${f.max}" step="${f.step}"` : 'maxlength="40"'} value="${esc(v)}"></div>`;
  }
  function renderCountries() {
    $('#countries').innerHTML = cfg.countries.map((c, i) => `
      <div class="panel nation-card p-4" style="--accent:${esc(c.color)}" data-card="${i}">
        <div class="flex items-center justify-between mb-3 gap-2">
          <div class="flex items-center gap-2"><span class="dot"></span><span class="font-display tracking-[0.2em] text-xs text-slate-400">NATION ${['ALPHA', 'BRAVO', 'CHARLIE'][i]}</span></div>
          <button class="btn-ghost !py-1 !px-2 text-[11px]" data-rand="${i}" title="Generate a random fictional nation">🎲 Randomize</button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">${FIELDS.map(f => fieldHTML(f, c, i)).join('')}</div>
        <div class="mt-3 text-[11px] text-slate-400 italic" data-doc="${i}">${esc(DOCTRINES[c.doctrine] || '')}</div>
        <div class="mt-3">
          <div class="flex justify-between text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1"><span>Combat power index</span><span class="mono text-slate-200" data-cpi="${i}"></span></div>
          <div class="bar"><i data-cpibar="${i}" style="background:${esc(c.color)}"></i></div>
        </div>
      </div>`).join('');
    updateCPI();
  }
  function updateCPI() {
    const P = cfg.countries.map(basePower), max = Math.max(...P);
    const order = [0, 1, 2].sort((a, b) => P[b] - P[a]);
    P.forEach((p, i) => {
      const lab = $(`[data-cpi="${i}"]`), bar = $(`[data-cpibar="${i}"]`);
      if (lab) lab.textContent = `${p.toFixed(0)} · #${order.indexOf(i) + 1}`;
      if (bar) bar.style.width = (p / max * 100).toFixed(1) + '%';
    });
  }
  function markCustom() { if (cfg.isSample) { cfg.isSample = false; updateSampleBadge(); } }
  function updateSampleBadge() {
    const b = $('#sampleBadge');
    b.textContent = cfg.isSample ? '● SAMPLE DATA' : '● YOUR NATIONS';
    b.classList.toggle('custom', !cfg.isSample);
    $('#sampleNote').textContent = cfg.isSample ? 'Showing a sample scenario with fictional nations — edit the specs above and generate your own.' : '';
  }

  const SYL_A = ['Vel', 'Kor', 'Ast', 'Mar', 'Zen', 'Tal', 'Ory', 'Bel', 'Dra', 'Sev', 'Ilm', 'Quar', 'Nor', 'Esk', 'Ruv', 'Cal'];
  const SYL_B = ['ovia', 'ania', 'estan', 'heim', 'aria', 'oth', 'ara', 'uria', 'enia', 'ador', 'ikka', 'ona'];
  const FORMS = ['Republic of X', 'X Federation', 'Union of X', 'Kingdom of X', 'X Commonwealth', "People's Republic of X", 'X Confederation'];
  const FIRST = ['Adrian', 'Mira', 'Tobias', 'Leyla', 'Viktor', 'Ines', 'Rafael', 'Anja', 'Kenji', 'Sana', 'Oskar', 'Nadia', 'Idris', 'Petra'];
  const LAST = ['Valen', 'Kruger', 'Okafor', 'Sato', 'Moreau', 'Halvorsen', 'Duarte', 'Novak', 'Rahimi', 'Castell', 'Lindqvist', 'Mbeki'];
  const TITLES = ['President', 'Premier', 'Marshal', 'Chancellor', 'Queen', 'General Secretary', 'Prime Minister'];
  function randomNation(color) {
    const r = a => a[Math.floor(Math.random() * a.length)], n = (a, b) => Math.round(a + Math.random() * (b - a));
    const core = r(SYL_A) + r(SYL_B);
    return {
      name: r(FORMS).replace('X', core), leader: `${r(TITLES)} ${r(FIRST)} ${r(LAST)}`,
      capital: r(['Port ', 'New ', 'Castel ', 'Fort ', '', 'San ']) + r(SYL_A) + r([' grad', 'haven', 'mora', 'lis', 'ton', 'vik']).trim(),
      region: `${r(SYL_A)}${r(['a', 'en', 'ar'])} ${r(['Valley', 'Plateau', 'Coast', 'Basin', 'Marches', 'Steppe'])}`,
      color, pop: n(8, 400), gdp: +(0.2 + Math.random() * 8).toFixed(1), budget: n(8, 300), troops: n(40, 1500),
      nukes: Math.random() < 0.5 ? 0 : n(20, 3000), tech: n(3, 10), air: n(2, 10), navy: n(1, 10), morale: n(3, 10),
      doctrine: r(Object.keys(DOCTRINES)), stance: r(Object.keys(STANCES))
    };
  }

  function bindCountries() {
    const box = $('#countries');
    const onChange = e => {
      const el = e.target; const i = +el.dataset.i, k = el.dataset.k;
      if (!k || isNaN(i)) return;
      let v = el.value;
      if (NUMERIC.has(k)) { v = parseFloat(v); if (isNaN(v)) return; }
      cfg.countries[i][k] = v;
      if (el.type === 'range') { const l = $(`[data-val="${i}_${k}"]`); if (l) l.textContent = `${v}/10`; }
      if (k === 'color') { const card = $(`[data-card="${i}"]`); card.style.setProperty('--accent', v); $(`[data-cpibar="${i}"]`).style.background = v; }
      if (k === 'doctrine') $(`[data-doc="${i}"]`).textContent = DOCTRINES[v] || '';
      markCustom(); updateCPI(); saveCfg();
    };
    box.addEventListener('input', onChange);
    box.addEventListener('change', onChange);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-rand]'); if (!b) return;
      const i = +b.dataset.rand;
      cfg.countries[i] = randomNation(cfg.countries[i].color);
      markCustom(); saveCfg(); renderCountries();
    });
  }

  // ---------- settings ----------
  function renderSettings() {
    const s = cfg.settings;
    $('#sFlash').innerHTML = Object.entries(FLASHPOINTS).map(([k, f]) => `<option value="${k}" ${k === s.flashpoint ? 'selected' : ''}>${f.label}</option>`).join('');
    $('#sTurns').value = s.turns; $('#sTurnsVal').textContent = `${s.turns} months`;
    $('#sDrama').value = s.drama; $('#sDramaVal').textContent = `${s.drama}%`;
    $('#sSeed').value = s.seed;
    $$('#sNuke button').forEach(b => b.classList.toggle('on', b.dataset.v === s.nuclear));
  }
  function bindSettings() {
    const upd = () => { markCustom(); saveCfg(); renderSettings(); };
    $('#sFlash').addEventListener('change', e => { cfg.settings.flashpoint = e.target.value; upd(); });
    $('#sTurns').addEventListener('input', e => { cfg.settings.turns = +e.target.value; upd(); });
    $('#sDrama').addEventListener('input', e => { cfg.settings.drama = +e.target.value; upd(); });
    $('#sSeed').addEventListener('input', e => { cfg.settings.seed = e.target.value; markCustom(); saveCfg(); });
    $('#sNuke').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.settings.nuclear = b.dataset.v; upd(); });
    $('#btnSeed').addEventListener('click', () => {
      const r = Math.random;
      cfg.settings.seed = `${OP_B[Math.floor(r() * OP_B.length)].toUpperCase()}-${Math.floor(r() * 90 + 10)}`; upd();
    });
  }

  // ---------- map ----------
  function buildMap(seed, C) {
    const rng = makeRng('map:' + seed);
    const r = 12, W = 600, Ht = 430, cx = 300, cy = 218, R = 205;
    const s1 = rng() * 6.28, s2 = rng() * 6.28, s3 = rng() * 6.28;
    const dx = r * 1.5, dy = Math.sqrt(3) * r;
    const hexes = [];
    for (let col = 0; col * dx < W + r; col++) {
      for (let row = 0; row * dy < Ht + dy; row++) {
        const x = col * dx + 6, y = row * dy + (col % 2 ? dy / 2 : 0) + 4;
        const ang = Math.atan2(y - cy, x - cx), dist = Math.hypot(x - cx, (y - cy) * 1.3);
        const lim = R * (0.9 + 0.08 * Math.sin(3 * ang + s1) + 0.06 * Math.sin(5 * ang + s2) + 0.04 * Math.sin(9 * ang + s3));
        if (dist < lim) hexes.push({ x, y, n: [rng(), rng(), rng()], nb: [] });
      }
    }
    for (let i = 0; i < hexes.length; i++) for (let j = i + 1; j < hexes.length; j++) {
      if (Math.hypot(hexes[i].x - hexes[j].x, hexes[i].y - hexes[j].y) < dy * 1.1) { hexes[i].nb.push(j); hexes[j].nb.push(i); }
    }
    const caps = [-90, 30, 150].map(a => { const t = a * Math.PI / 180; return { x: cx + Math.cos(t) * R * 0.56, y: cy + Math.sin(t) * R * 0.56 / 1.3 }; });
    const pts = hexes.map(h => { const p = []; for (let k = 0; k < 6; k++) { const t = Math.PI / 3 * k; p.push(`${(h.x + (r - 0.4) * Math.cos(t)).toFixed(1)},${(h.y + (r - 0.4) * Math.sin(t)).toFixed(1)}`); } return p.join(' '); });
    const svg = $('#map');
    svg.innerHTML = `
      <defs>
        <pattern id="ocean" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(56,189,248,0.07)" stroke-width="1"/></pattern>
        <radialGradient id="nukeG"><stop offset="0" stop-color="#fffbeb"/><stop offset=".3" stop-color="#fde047"/><stop offset=".6" stop-color="#f97316" stop-opacity=".7"/><stop offset="1" stop-color="#dc2626" stop-opacity="0"/></radialGradient>
        <radialGradient id="vign"><stop offset=".6" stop-color="#020617" stop-opacity="0"/><stop offset="1" stop-color="#020617" stop-opacity=".8"/></radialGradient>
      </defs>
      <rect width="600" height="430" fill="#030712"/><rect width="600" height="430" fill="url(#ocean)"/>
      <g id="hexG">${pts.map((p, i) => `<polygon class="hex" data-h="${i}" points="${p}" fill="#1e293b"/>`).join('')}</g>
      <g id="fxG"></g>
      <g id="capG"></g>
      <rect width="600" height="430" fill="url(#vign)" pointer-events="none"/>`;
    return { hexes, caps, polys: $$('#hexG polygon', svg), C };
  }
  function owners(s) {
    const { hexes, caps } = mapModel;
    return hexes.map(h => {
      let best = -1, bd = Infinity;
      for (let i = 0; i < 3; i++) {
        if (!s[i].alive || s[i].territory <= 0.05) continue;
        const w = Math.sqrt(s[i].territory / 33.33);
        const d = Math.hypot(h.x - caps[i].x, h.y - caps[i].y) * (1 + (h.n[i] - 0.5) * 0.28) / w;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    });
  }
  function renderMap(tr) {
    const { hexes, caps, polys, C } = mapModel;
    const own = owners(tr.s);
    polys.forEach((p, i) => {
      const o = own[i];
      const front = o >= 0 && hexes[i].nb.some(j => own[j] !== o);
      p.setAttribute('fill', o < 0 ? '#1e293b' : C[o].color);
      p.setAttribute('fill-opacity', front ? '0.85' : (0.38 + hexes[i].n[0] * 0.14).toFixed(2));
    });
    // effects
    let fx = '';
    tr.events.forEach((e, ei) => {
      if ((e.type === 'battle' || e.type === 'naval') && e.a !== undefined) {
        let cand = [];
        hexes.forEach((h, i) => { if (own[i] === e.a || own[i] === e.d) { const other = own[i] === e.a ? e.d : e.a; if (h.nb.some(j => own[j] === other)) cand.push(i); } });
        let pt;
        if (cand.length) {
          const mx = (caps[e.a].x + caps[e.d].x) / 2, my = (caps[e.a].y + caps[e.d].y) / 2;
          cand.sort((x, y) => Math.hypot(hexes[x].x - mx, hexes[x].y - my) - Math.hypot(hexes[y].x - mx, hexes[y].y - my));
          const h = hexes[cand[Math.min(cand.length - 1, ei * 3)]]; pt = h;
        } else pt = caps[e.d];
        fx += `<g class="blast"><circle class="ring" cx="${pt.x}" cy="${pt.y}" r="9"/><circle class="ring" style="animation-delay:.5s" cx="${pt.x}" cy="${pt.y}" r="9"/><circle class="core" cx="${pt.x}" cy="${pt.y}" r="4"/></g>`;
      }
      if (e.type === 'nuke' && e.d !== undefined) {
        const c = caps[e.d];
        fx += `<circle class="nukefx" cx="${c.x}" cy="${c.y}" r="70" fill="url(#nukeG)"/><circle cx="${c.x}" cy="${c.y}" r="26" fill="url(#nukeG)" opacity=".9"/>`;
      }
    });
    $('#fxG').innerHTML = fx;
    $('#capG').innerHTML = caps.map((c, i) => {
      const alive = tr.s[i].alive;
      return `<g opacity="${alive ? 1 : 0.55}">
        <circle cx="${c.x}" cy="${c.y}" r="7" fill="#020617" stroke="${esc(C[i].color)}" stroke-width="2"/>
        <text x="${c.x}" y="${c.y + 3.5}" text-anchor="middle" font-size="9" fill="${alive ? '#fff' : '#64748b'}">${alive ? '★' : '✕'}</text>
        <text class="cap-label" x="${c.x}" y="${c.y - 12}" text-anchor="middle">${esc(C[i].capital).toUpperCase()}</text>
        <text class="cap-label" x="${c.x}" y="${c.y + 21}" text-anchor="middle" style="font-size:10px;fill:${esc(C[i].color)}">${esc(shortName(C[i])).toUpperCase()} · ${tr.s[i].territory.toFixed(0)}%</text>
      </g>`;
    }).join('');
  }

  // ---------- chart ----------
  function renderChart(k) {
    const W = 600, Hh = 220, pl = 34, pr = 14, pt = 12, pb = 26;
    const T = run.turns.length - 1, metric = play.metric;
    const x = t => pl + (T ? t / T : 0) * (W - pl - pr), y = v => pt + (1 - v / 100) * (Hh - pt - pb);
    let g = '';
    [0, 25, 50, 75, 100].forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(148,163,184,${v === 0 ? .3 : .09})"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="#64748b" font-family="JetBrains Mono">${v}</text>`; });
    const step = Math.max(1, Math.ceil(T / 12));
    for (let t = 0; t <= T; t += step) g += `<text x="${x(t)}" y="${Hh - 8}" text-anchor="middle" font-size="9" fill="#64748b" font-family="JetBrains Mono">M${t}</text>`;
    const tpT = run.outcome.tp;
    if (k >= tpT) g += `<line x1="${x(tpT)}" x2="${x(tpT)}" y1="${pt}" y2="${Hh - pb}" stroke="#f59e0b" stroke-dasharray="3 3" opacity=".6"/><text x="${x(tpT) + 4}" y="${pt + 9}" font-size="9" fill="#f59e0b" font-family="JetBrains Mono">TURNING POINT</text>`;
    run.C.forEach((c, i) => {
      const pts = run.turns.slice(0, k + 1).map((tr, t) => `${x(t).toFixed(1)},${y(tr.s[i][metric]).toFixed(1)}`);
      if (pts.length > 1) g += `<polyline points="${pts.join(' ')}" fill="none" stroke="${esc(c.color)}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      const last = run.turns[k].s[i][metric];
      g += `<circle cx="${x(k)}" cy="${y(last)}" r="4" fill="${esc(c.color)}" stroke="#020617" stroke-width="2"/>`;
    });
    g += `<line x1="${x(k)}" x2="${x(k)}" y1="${pt}" y2="${Hh - pb}" stroke="rgba(226,232,240,.25)"/>`;
    $('#chart').innerHTML = g;
    $('#chartLegend').innerHTML = run.C.map((c, i) => `<span class="flex items-center gap-2"><i style="width:14px;height:3px;border-radius:2px;background:${esc(c.color)};display:inline-block"></i>${esc(shortName(c))} <b class="mono">${run.turns[k].s[i][metric].toFixed(0)}%</b></span>`).join('');
    $$('#chartTabs button').forEach(b => b.classList.toggle('on', b.dataset.m === metric));
  }

  // ---------- theater render ----------
  function statusOf(s, i, tr) {
    if (!s.alive) return ['CAPITULATED', '#94a3b8'];
    if (s.nukesUsed) return ['NUCLEAR USE', '#facc15'];
    if (!s.belligerent) return ['NEUTRAL', '#94a3b8'];
    if (tr.coalition && tr.coalition.members.includes(i)) return ['ALLIED', '#6ee7b7'];
    return ['AT WAR', '#f87171'];
  }
  function renderStatus(tr) {
    $('#nationStatus').innerHTML = run.C.map((c, i) => {
      const s = tr.s[i]; const [st, col] = statusOf(s, i, tr);
      const bar = (lab, v, colr) => `<div><div class="flex justify-between text-[10px] uppercase tracking-[0.1em] text-slate-400 mb-1"><span>${lab}</span><span class="mono text-slate-200">${v.toFixed(0)}%</span></div><div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${colr}"></i></div></div>`;
      return `<div class="panel p-3.5 nation-card" style="--accent:${esc(c.color)}">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="dot"></span><span class="font-display text-lg tracking-wide truncate">${esc(c.name)}</span>
          <span class="pill ml-auto" style="color:${col}">${st}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          ${bar('Territory', s.territory, esc(c.color))}${bar('Forces', s.forces, '#94a3b8')}${bar('Economy', s.econ, '#34d399')}${bar('Morale', s.morale, '#a78bfa')}
        </div>
        <div class="mt-2.5 text-[11px] text-slate-400 mono flex gap-3 flex-wrap"><span>KIA ${fmt(s.mil)}</span><span>Civ. ${fmt(s.civ)}</span><span>Displaced ${fmt(s.disp)}</span><span class="text-slate-500">${esc(c.doctrine)}</span></div>
      </div>`;
    }).join('');
  }
  function renderFeed(k) {
    let html = '';
    for (let t = k; t >= 0; t--) {
      const tr = run.turns[t];
      html += `<div class="feed-turn">MONTH ${t}${t === 0 ? ' · OUTBREAK' : ''}</div>`;
      if (!tr.events.length) html += `<div class="feed-item"><div class="ic">⏳</div><div class="text-sm text-slate-400">Both sides dig in and resupply.</div></div>`;
      tr.events.forEach(e => {
        const cls = ['feed-item', t === k ? 'latest' : '', e.type === 'nuke' ? 'nuke' : e.big ? 'big' : ''].join(' ');
        const dot = e.a !== undefined ? `<i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${esc(run.C[e.a].color)};margin-right:6px"></i>` : '';
        html += `<div class="${cls}"><div class="ic">${e.icon}</div><div class="min-w-0"><div class="text-sm font-semibold text-slate-100">${dot}${e.title}</div><div class="text-[13px] text-slate-300 leading-snug mt-0.5">${e.text}</div></div></div>`;
      });
    }
    $('#feed').innerHTML = html;
    $('#feed').scrollTop = 0;
  }
  function renderAAR(k) {
    const T = run.turns.length - 1;
    if (k < T) {
      $('#aar').innerHTML = `<div class="panel-title mb-3">After-action report</div><div class="locked"><div class="text-3xl">🔒</div><div class="font-display tracking-widest">CLASSIFIED UNTIL THE WAR ENDS</div><div class="text-xs">${T - k} month${T - k === 1 ? '' : 's'} of fighting remain. Press play or skip to the end.</div></div>`;
      return;
    }
    const o = run.outcome, W = run.C[o.winner];
    const colr = o.cls === 'Mutual Assured Ruin' ? '#facc15' : W.color;
    $('#aar').innerHTML = `<div class="panel-title mb-3">After-action report</div>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="aar-class" style="color:${esc(colr)}">${o.cls.toUpperCase()}</div>
        <span class="pill" style="color:${esc(W.color)}">${o.cls === 'Mutual Assured Ruin' ? 'LAST STANDING' : 'VICTOR'}: ${esc(shortName(W)).toUpperCase()}</span>
      </div>
      <div class="mt-3 space-y-2 text-sm text-slate-300 leading-relaxed">${o.epi.map(p => `<p>${p}</p>`).join('')}</div>
      <div class="mt-4 grid grid-cols-3 gap-2">${o.ranking.map((r, n) => `<div class="stat" style="border-color:${hexA(run.C[r.i].color, .4)}"><div class="k">#${n + 1} ${esc(shortName(run.C[r.i]))}</div><div class="v" style="color:${esc(run.C[r.i].color)}">${r.score.toFixed(1)}</div><div class="text-[10px] text-slate-500">final power score</div></div>`).join('')}</div>`;
  }
  function renderTurn() {
    const k = play.k, tr = run.turns[k], T = run.turns.length - 1;
    renderMap(tr); renderStatus(tr); renderChart(k); renderFeed(k); renderAAR(k);
    const tot = tr.s.reduce((a, s) => ({ mil: a.mil + s.mil, civ: a.civ + s.civ, disp: a.disp + s.disp }), { mil: 0, civ: 0, disp: 0 });
    $('#cMil').textContent = fmt(tot.mil); $('#cCiv').textContent = fmt(tot.civ); $('#cDisp').textContent = fmt(tot.disp); $('#cNuke').textContent = tr.nukes;
    $('#cNuke').style.color = tr.nukes ? '#facc15' : '';
    $('#pSlider').max = T; $('#pSlider').value = k;
    $('#pLabel').textContent = `Month ${k} / ${T}`;
    const h = tr.headline;
    $('#headline').className = 'headline mt-4' + (h.type === 'nuke' ? ' nuke' : '');
    $('#headline').innerHTML = `<div class="flex gap-3 items-start"><div class="text-2xl">${h.icon}</div><div><div class="ht">${h.title}</div><div class="text-sm text-slate-300">${h.text}</div></div></div>`;
    $('#pPlay').textContent = play.timer ? '❚❚' : '▶';
  }
  function renderRunHeader() {
    const plan = directorPlan(run.C, run.settings);
    $('#opArc').textContent = `ARC: ${plan.arc.toUpperCase()} · SEED ${run.settings.seed} · ${FLASHPOINTS[run.settings.flashpoint]?.label.toUpperCase() || ''}`;
    $('#opTitle').textContent = run.title;
    $('#opSub').innerHTML = run.C.map(c => `<span style="color:${esc(c.color)}">${esc(c.name)}</span>`).join(' <span class="text-slate-500">vs</span> ') + ` <span class="text-slate-500">· ${run.turns.length - 1} months</span>`;
    $('#notes').innerHTML = plan.notes.map(n => `<li class="flex gap-2"><span>${n.icon}</span><span>${n.text}</span></li>`).join('');
  }

  // ---------- playback ----------
  function stop() { clearInterval(play.timer); play.timer = null; if (run) $('#pPlay').textContent = '▶'; }
  function start() {
    stop();
    if (play.k >= run.turns.length - 1) play.k = 0;
    play.timer = setInterval(() => {
      if (play.k >= run.turns.length - 1) { stop(); return; }
      play.k++; renderTurn();
      if (play.k >= run.turns.length - 1) stop();
    }, +$('#pSpeed').value);
    renderTurn();
  }
  function bindPlayback() {
    $('#pPlay').addEventListener('click', () => play.timer ? stop() : start());
    $('#pBack').addEventListener('click', () => { stop(); play.k = Math.max(0, play.k - 1); renderTurn(); });
    $('#pFwd').addEventListener('click', () => { stop(); play.k = Math.min(run.turns.length - 1, play.k + 1); renderTurn(); });
    $('#pEnd').addEventListener('click', () => { stop(); play.k = run.turns.length - 1; renderTurn(); });
    $('#pSlider').addEventListener('input', e => { stop(); play.k = +e.target.value; renderTurn(); });
    $('#pSpeed').addEventListener('change', () => { if (play.timer) start(); });
    $('#chartTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; play.metric = b.dataset.m; renderChart(play.k); });
  }

  // ---------- generate ----------
  function opTitle(seed) { const r = makeRng('op:' + seed); return `Operation ${OP_A[Math.floor(r() * OP_A.length)]} ${OP_B[Math.floor(r() * OP_B.length)]}`; }
  function execute(countries, settings, { archive = true, animate = true } = {}) {
    stop();
    const C = clone(countries), S = clone(settings);
    const res = simulate(C, S);
    run = { ...res, settings: S, title: opTitle(S.seed + C.map(c => c.name).join()) };
    mapModel = buildMap(S.seed, run.C);
    renderRunHeader();
    play.k = 0;
    renderTurn();
    if (archive) {
      const o = run.outcome;
      runs.unshift({ id: Date.now().toString(36), title: run.title, date: new Date().toISOString(), countries: C, settings: S, cls: o.cls, winner: shortName(run.C[o.winner]), winnerColor: run.C[o.winner].color, months: run.turns.length - 1 });
      runs = runs.slice(0, 15); saveRuns(); renderArchive();
    }
    if (!animate) { start(); return; }
    const plan = directorPlan(run.C, S);
    const lines = [
      `> ingesting specs: ${C.map(c => shortName(c)).join(', ')}`,
      `> computing combat power indices … ${plan.P.map(p => p.toFixed(0)).join(' / ')}`,
      `> flashpoint: ${FLASHPOINTS[S.flashpoint]?.label || S.flashpoint}`,
      `> selecting narrative arc … "${plan.arc}"`,
      `> seeding campaign engine (${S.seed}) · ${S.turns} months · drama ${S.drama}%`,
      `> simulating ${run.turns.length - 1} months · ${run.turns.reduce((a, t) => a + t.events.length, 0)} events generated`,
      `> scenario ready: ${run.title}`
    ];
    const ov = $('#overlay'), log = $('#overlayLog');
    log.innerHTML = ''; ov.classList.remove('hidden');
    lines.forEach((l, i) => setTimeout(() => { log.insertAdjacentHTML('beforeend', `<div>${esc(l)}</div>`); }, 160 * i));
    setTimeout(() => {
      ov.classList.add('hidden');
      $('#theater').scrollIntoView({ behavior: 'smooth', block: 'start' });
      start();
    }, 160 * lines.length + 350);
  }

  // ---------- archive ----------
  function renderArchive() {
    $('#archiveCount').textContent = runs.length ? `(${runs.length})` : '';
    if (!runs.length) { $('#archiveList').innerHTML = `<div class="panel p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">No wars archived yet. Hit <b>Generate the War</b> and each campaign will be saved here.</div>`; return; }
    $('#archiveList').innerHTML = runs.map(r => `
      <div class="panel p-4 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><div class="font-display text-lg tracking-wide truncate">${esc(r.title)}</div>
          <div class="text-[11px] text-slate-500 mono">${new Date(r.date).toLocaleString()} · seed ${esc(r.settings.seed)}</div></div>
          <button class="text-slate-500 hover:text-red-400 text-sm" data-del="${esc(r.id)}" title="Delete">✕</button>
        </div>
        <div class="text-xs text-slate-300">${r.countries.map(c => `<span style="color:${esc(c.color)}">${esc(shortName(c))}</span>`).join(' · ')}</div>
        <div class="flex items-center justify-between gap-2 mt-1">
          <span class="pill" style="color:${esc(r.winnerColor)}">${esc(r.cls.toUpperCase())} · ${esc(String(r.winner).toUpperCase())}</span>
          <button class="btn-ghost !py-1" data-replay="${esc(r.id)}">▶ Replay</button>
        </div>
      </div>`).join('');
  }
  function bindArchive() {
    $('#archiveList').addEventListener('click', e => {
      const d = e.target.closest('[data-del]'), p = e.target.closest('[data-replay]');
      if (d) { runs = runs.filter(r => r.id !== d.dataset.del); saveRuns(); renderArchive(); }
      if (p) {
        const r = runs.find(x => x.id === p.dataset.replay); if (!r) return;
        cfg = { countries: clone(r.countries), settings: clone(r.settings), isSample: false };
        saveCfg(); renderCountries(); renderSettings(); updateSampleBadge();
        execute(cfg.countries, cfg.settings, { archive: false });
      }
    });
  }

  // ---------- boot ----------
  function init() {
    renderCountries(); bindCountries();
    renderSettings(); bindSettings();
    bindPlayback(); bindArchive(); renderArchive(); updateSampleBadge();
    $('#btnGenerate').addEventListener('click', () => execute(cfg.countries, cfg.settings));
    $('#btnSample').addEventListener('click', () => {
      cfg = { ...clone(SAMPLE), isSample: true };
      saveCfg(); renderCountries(); renderSettings(); updateSampleBadge();
      execute(cfg.countries, cfg.settings, { archive: false, animate: false });
    });
    window.addEventListener('resize', () => {});
    execute(cfg.countries, cfg.settings, { archive: false, animate: false });
  }
  init();
})();
