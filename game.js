/* ==========================================================
   DRIVE MAD ULTRA (v2 – Logic sạch + JUMP)
   - GIỮ TOÀN BỘ CHỨC NĂNG CŨ:
       • Campaign: sao, unlock level, best time, ghost
       • Store + Wallet (coins từ run, bonus, Daily Quest)
       • Daily Endless: seed theo ngày, modifiers, quests, local leaderboard
       • Replay Best/Last
       • Stats + Achievements
       • Level Editor + Custom Levels
       • Keyboard + Touch + Tilt
   - CẢI TIẾN:
       • Thêm nút JUMP (Space/W/ArrowUp hoặc nút ⤴)
       • Logic nhảy dùng offset theo terrain (nhảy qua hazard)
       • Độ khó đầu game nhẹ hơn, dễ thắng hơn
   ========================================================== */

// ===== Canvas =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const minimapCanvas = document.getElementById("minimapCanvas");
const mctx = minimapCanvas.getContext("2d");

// ===== UI =====
const el = {
  // HUD
  hudMode: document.getElementById("hudMode"),
  hudLevelName: document.getElementById("hudLevelName"),
  hudStars: document.getElementById("hudStars"),
  hudTime: document.getElementById("hudTime"),
  hudSpeed: document.getElementById("hudSpeed"),
  hudLives: document.getElementById("hudLives"),
  hudNitro: document.getElementById("hudNitro"),
  hudFuel: document.getElementById("hudFuel"),
  hudCoins: document.getElementById("hudCoins"),
  hudWallet: document.getElementById("hudWallet"),
  hudScore: document.getElementById("hudScore"),

  // Buttons top
  btnMenu: document.getElementById("btnMenu"),
  btnRestart: document.getElementById("btnRestart"),
  btnPause: document.getElementById("btnPause"),
  btnReplayBest: document.getElementById("btnReplayBest"),
  btnReplayLast: document.getElementById("btnReplayLast"),
  btnStore: document.getElementById("btnStore"),
  btnLevels: document.getElementById("btnLevels"),
  btnEditor: document.getElementById("btnEditor"),
  btnFullscreen: document.getElementById("btnFullscreen"),
  btnSettings: document.getElementById("btnSettings"),
  btnStats: document.getElementById("btnStats"),
  btnSound: document.getElementById("btnSound"),

  // Touch
  btnLeft: document.getElementById("btnLeft"),
  btnRight: document.getElementById("btnRight"),
  btnNitro: document.getElementById("btnNitro"),
  btnJump: document.getElementById("btnJump"),

  // Panels
  menuPanel: document.getElementById("menuPanel"),
  levelPanel: document.getElementById("levelPanel"),
  settingsPanel: document.getElementById("settingsPanel"),
  storePanel: document.getElementById("storePanel"),
  pausePanel: document.getElementById("pausePanel"),
  resultPanel: document.getElementById("resultPanel"),
  statsPanel: document.getElementById("statsPanel"),
  editorPanel: document.getElementById("editorPanel"),

  // Menu buttons
  btnPlayCampaign: document.getElementById("btnPlayCampaign"),
  btnPlayDaily: document.getElementById("btnPlayDaily"),
  btnOpenLevels: document.getElementById("btnOpenLevels"),
  btnOpenStore: document.getElementById("btnOpenStore"),
  btnOpenEditor: document.getElementById("btnOpenEditor"),

  // Levels panel
  tabDefault: document.getElementById("tabDefault"),
  tabDaily: document.getElementById("tabDaily"),
  tabCustom: document.getElementById("tabCustom"),
  levelList: document.getElementById("levelList"),
  btnCloseLevels: document.getElementById("btnCloseLevels"),

  // Settings
  difficultySelect: document.getElementById("difficultySelect"),
  toggleGhost: document.getElementById("toggleGhost"),
  toggleEngine: document.getElementById("toggleEngine"),
  toggleTilt: document.getElementById("toggleTilt"),
  tiltSensitivity: document.getElementById("tiltSensitivity"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),

  // Store
  storeWallet: document.getElementById("storeWallet"),
  storeGrid: document.getElementById("storeGrid"),
  btnCloseStore: document.getElementById("btnCloseStore"),

  // Pause
  btnResume: document.getElementById("btnResume"),

  // Result
  resultTitle: document.getElementById("resultTitle"),
  starRow: document.getElementById("starRow"),
  resultText: document.getElementById("resultText"),
  resultExtra: document.getElementById("resultExtra"),
  btnRetry: document.getElementById("btnRetry"),
  btnNext: document.getElementById("btnNext"),

  // Stats
  statsRuns: document.getElementById("statsRuns"),
  statsDistance: document.getElementById("statsDistance"),
  statsCoins: document.getElementById("statsCoins"),
  statsWallet: document.getElementById("statsWallet"),
  statsCrashes: document.getElementById("statsCrashes"),
  statsBestScore: document.getElementById("statsBestScore"),
  statsDailyBest: document.getElementById("statsDailyBest"),
  achievements: document.getElementById("achievements"),
  btnResetData: document.getElementById("btnResetData"),
  btnCloseStats: document.getElementById("btnCloseStats"),

  // Daily / Leaderboard
  dailyChallengeSummary: document.getElementById("dailyChallengeSummary"),
  dailyQuestList: document.getElementById("dailyQuestList"),
  btnClaimDailyQuests: document.getElementById("btnClaimDailyQuests"),
  dailyLeaderboardInfo: document.getElementById("dailyLeaderboardInfo"),
  dailyLeaderboard: document.getElementById("dailyLeaderboard"),

  // Editor
  editorJson: document.getElementById("editorJson"),
  editorName: document.getElementById("editorName"),
  editorStartX: document.getElementById("editorStartX"),
  editorFinishX: document.getElementById("editorFinishX"),
  editorParTime: document.getElementById("editorParTime"),
  editorSnap: document.getElementById("editorSnap"),
  editorGrid: document.getElementById("editorGrid"),
  btnEditorNew: document.getElementById("btnEditorNew"),
  btnEditorTest: document.getElementById("btnEditorTest"),
  btnEditorSave: document.getElementById("btnEditorSave"),
  btnEditorExport: document.getElementById("btnEditorExport"),
  btnEditorImport: document.getElementById("btnEditorImport"),
  btnEditorClose: document.getElementById("btnEditorClose"),
  toolButtons: Array.from(document.querySelectorAll(".tool-btn")),
};

// ===== Utilities =====
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx*dx + dy*dy); }
function safeJSONParse(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }
function nowMs() { return performance.now(); }
function todayKeyStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${da}`;
}

// Seeded RNG
function makeRng(seed) {
  let s = seed >>> 0;
  return function rnd() {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function dateSeedYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${da}`) >>> 0;
}
function shuffleWithRng(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== Settings =====
let difficulty = "normal";
let ghostEnabled = true;
let engineSoundEnabled = true;
let soundEnabled = true;

// Tilt steering
let tiltEnabled = false;
let tiltValue = 0; // [-1..1]
let tiltSensitivity = 1.2;

// ===== Physics Params =====
let GRAVITY = 1100;
let BASE_ACCEL = 950;
let TURBO_ACCEL = 1800;
const FRICTION = 0.985;
const MAX_SPEED = 650;
const MAX_REV_SPEED = -280;
const ANGLE_CRASH_LIMIT = Math.PI * 0.8; // cho phép xoay nhiều hơn một chút, đỡ chết oan

// Jump (mới)
const JUMP_SPEED = 620;
const JUMP_GRAVITY = 1800;
let grounded = true;
let jumpOffset = 0;
let jumpVel = 0;
let jumpRequested = false;

// ===== Camera =====
let camX = 0, camY = 0;
let camZoom = 1, targetZoom = 1;
let camShake = 0;

// ===== State =====
let gameState = "menu"; // menu, playing, paused, result, replay_best, replay_last, editor
let mode = "PLAY";      // PLAY, DAILY, CUSTOM, TEST_EDITOR
let lastT = 0;

// ===== Input =====
const keys = {};
let touchLeft = false;
let touchRight = false;
let touchNitro = false;

// ===== Car =====
const car = {
  x: 0, y: 0, vx: 0, vy: 0,
  angle: 0, angularVel: 0,
  width: 110, height: 46,
  wheelOffsetX: 38,
  wheelOffsetY: 20
};

// ===== Skins (Store) =====
const skins = [
  { id: "yellow", body: "#ffcc33", accent: "#f4a623", cost: 0 },
  { id: "red", body: "#ff5252", accent: "#ff8a65", cost: 140 },
  { id: "blue", body: "#42a5f5", accent: "#90caf9", cost: 140 },
  { id: "green", body: "#66bb6a", accent: "#a5d6a7", cost: 180 },
  { id: "purple", body: "#ab47bc", accent: "#ce93d8", cost: 220 },
  { id: "white", body: "#f5f5f5", accent: "#cfd9e5", cost: 0 },
  { id: "black", body: "#2b2f3a", accent: "#707a8a", cost: 260 },
];
let skinId = "yellow";

// ===== Persistence keys =====
const STORAGE_KEYS = {
  skin: "dm_ultra_skin",
  stats: "dm_ultra_stats",
  ach: "dm_ultra_ach",
  customLevels: "dm_ultra_custom_levels",
  dailyBest: "dm_ultra_daily_best",
  wallet: "dm_ultra_wallet",
  ownedSkins: "dm_ultra_owned_skins",
  levelStars: "dm_ultra_level_stars",
  ghostPrefix: "dm_ultra_ghost_",
  bestTimePrefix: "dm_ultra_besttime_",
  dailyState: "dm_ultra_daily_state_v2"
};

// ===== Stats & Achievements =====
const stats = {
  runs: 0,
  distance: 0,
  runCoins: 0,
  wallet: 0,
  crashes: 0,
  bestScore: 0,
  dailyBestDistance: 0
};

const achievementsDef = [
  { id: "first_win", name: "First Win", info: "Hoàn thành 1 level campaign.", test: (ctx) => ctx.firstWin },
  { id: "coin_50", name: "Coin Hunter", info: "Nhặt tổng 50 run coins (cộng dồn).", test: (ctx) => ctx.totalRunCoins >= 50 },
  { id: "wallet_500", name: "Rich", info: "Wallet đạt 500 coins.", test: (ctx) => ctx.wallet >= 500 },
  { id: "crash_20", name: "Crash Dummy", info: "Crash tổng 20 lần.", test: (ctx) => ctx.totalCrashes >= 20 },
  { id: "score_5000", name: "High Score", info: "Đạt score ≥ 5000 trong 1 run.", test: (ctx) => ctx.runScore >= 5000 },
  { id: "daily_3000m", name: "Daily Runner", info: "Daily Endless đạt ≥ 3000m.", test: (ctx) => ctx.dailyDistance >= 3000 },
  { id: "custom_creator", name: "Creator", info: "Lưu 1 custom level.", test: (ctx) => ctx.customCount >= 1 },
  { id: "stars_6", name: "Campaigner", info: "Tổng sao Campaign đạt ≥ 6★.", test: (ctx) => ctx.totalStars >= 6 },
];
const achState = {}; // id -> boolean

// ===== Daily system =====
const DAILY_MODS_BASE = {
  coinValueMul: 1,
  fuelDrainMul: 1,
  nitroUseMul: 1,
  nitroRegenMul: 1,
  accelMul: 1,
  scoreMul: 1,
  hazardRadiusMul: 1
};

const DAILY_MODIFIERS = [
  {
    id: "double_coins",
    label: "Double Coins",
    desc: "+100% Run Coins & chút bonus Score từ coins.",
    mods: { coinValueMul: 2, scoreMul: 1.15 }
  },
  {
    id: "fuel_saver",
    label: "Fuel Saver",
    desc: "Tiêu hao nhiên liệu -35%.",
    mods: { fuelDrainMul: 0.65 }
  },
  {
    id: "nitro_mania",
    label: "Nitro Mania",
    desc: "Nitro regen +60%, tiêu hao nitro -20%.",
    mods: { nitroRegenMul: 1.6, nitroUseMul: 0.8 }
  },
  {
    id: "heavy_grip",
    label: "Heavy Grip",
    desc: "Xe bám đường hơn nhưng tăng tốc -15%.",
    mods: { accelMul: 0.85 }
  },
  {
    id: "danger_zone",
    label: "Danger Zone",
    desc: "Hitbox hazard +20%, coins +20%.",
    mods: { hazardRadiusMul: 1.2, coinValueMul: 1.2 }
  }
];

const DAILY_QUEST_POOL = [
  {
    id: "q_runs_3",
    type: "runs",
    target: 3,
    reward: 40,
    title: "Khởi động ngày mới",
    desc: "Chơi 3 run bất kỳ (Campaign / Daily / Custom)."
  },
  {
    id: "q_campaign_win_1",
    type: "campaign_win",
    target: 1,
    reward: 60,
    title: "Chiến thắng Campaign",
    desc: "Thắng 1 level trong Campaign."
  },
  {
    id: "q_coins_25",
    type: "coins",
    target: 25,
    reward: 50,
    title: "Tham lam tí",
    desc: "Nhặt tổng cộng 25 coins trong ngày."
  },
  {
    id: "q_daily_1500",
    type: "daily_distance_best",
    target: 1500,
    reward: 80,
    title: "Runner 1500m",
    desc: "Đạt ≥ 1500m trong Daily Endless."
  },
  {
    id: "q_score_3500",
    type: "score_single",
    target: 3500,
    reward: 60,
    title: "One Big Score",
    desc: "Đạt score ≥ 3500 trong 1 run bất kỳ."
  }
];

let dailyConfig = null;
let dailyState = null;
let activeDailyConfig = null;

function generateDailyConfig(seed, dateStr) {
  const rng = makeRng(seed ^ 0x9e3779b9);
  const mods = { ...DAILY_MODS_BASE };

  const modsShuffled = shuffleWithRng(DAILY_MODIFIERS.slice(), rng);
  const pickedMods = modsShuffled.slice(0, 2);
  for (const m of pickedMods) {
    for (const [k, v] of Object.entries(m.mods)) {
      mods[k] = (mods[k] || 1) * v;
    }
  }

  const questsShuffled = shuffleWithRng(DAILY_QUEST_POOL.slice(), rng);
  const pickedQuests = questsShuffled.slice(0, 3);

  return {
    seed,
    dateStr,
    title: "Daily Challenge",
    subtitle: `Seed ${seed}`,
    modifiers: mods,
    modifierList: pickedMods,
    quests: pickedQuests
  };
}

function saveDailyState() {
  if (!dailyState) return;
  localStorage.setItem(STORAGE_KEYS.dailyState, JSON.stringify(dailyState));
}

function initDailySystem() {
  const dateStr = todayKeyStr();
  const seed = dateSeedYYYYMMDD(new Date());
  dailyConfig = generateDailyConfig(seed, dateStr);

  const stored = safeJSONParse(localStorage.getItem(STORAGE_KEYS.dailyState) || "null", null);
  if (stored && stored.date === dateStr && stored.quests && stored.leaderboard) {
    dailyState = stored;
  } else {
    dailyState = {
      date: dateStr,
      quests: {},
      leaderboard: []
    };
  }

  for (const q of dailyConfig.quests) {
    if (!dailyState.quests[q.id]) {
      dailyState.quests[q.id] = { progress: 0, completed: false, claimed: false };
    }
  }
  for (const id in dailyState.quests) {
    if (!dailyConfig.quests.some(q => q.id === id)) delete dailyState.quests[id];
  }
  if (!Array.isArray(dailyState.leaderboard)) dailyState.leaderboard = [];

  saveDailyState();
}

function updateDailyOnRunEnd(ctx) {
  if (!dailyConfig || !dailyState) return;
  if (dailyState.date !== dailyConfig.dateStr) return;

  for (const q of dailyConfig.quests) {
    const st = dailyState.quests[q.id];
    if (!st || st.completed) continue;

    switch (q.type) {
      case "runs":
        st.progress += 1;
        break;
      case "campaign_win":
        if (ctx.isWin && ctx.activeSet === "DEFAULT") st.progress += 1;
        break;
      case "coins":
        st.progress += ctx.coinsRun;
        break;
      case "daily_distance_best":
        if (ctx.mode === "DAILY") st.progress = Math.max(st.progress, ctx.distanceRun);
        break;
      case "score_single":
        if (ctx.scoreRun >= q.target) st.progress = q.target;
        break;
    }

    if (!st.completed) {
      if (q.type === "daily_distance_best") {
        if (st.progress >= q.target) st.completed = true;
      } else if (st.progress >= q.target) {
        st.progress = q.target;
        st.completed = true;
      }
    }
  }

  if (ctx.mode === "DAILY") {
    if (!Array.isArray(dailyState.leaderboard)) dailyState.leaderboard = [];
    dailyState.leaderboard.push({
      distance: ctx.distanceRun,
      time: ctx.levelTime,
      score: ctx.scoreRun,
      ts: Date.now()
    });
    dailyState.leaderboard.sort((a, b) => b.distance - a.distance);
    if (dailyState.leaderboard.length > 20) dailyState.leaderboard.length = 20;
  }

  saveDailyState();
}

function renderDailyUI() {
  if (!el.dailyChallengeSummary) return;

  if (!dailyConfig || !dailyState) {
    el.dailyChallengeSummary.textContent = "Daily Challenge chưa sẵn sàng.";
    el.dailyQuestList.innerHTML = "";
    el.dailyLeaderboardInfo.textContent = "";
    el.dailyLeaderboard.innerHTML = "";
    return;
  }

  el.dailyChallengeSummary.innerHTML =
    `Ngày: ${dailyConfig.dateStr} • Seed: ${dailyConfig.seed}<br/>` +
    dailyConfig.modifierList
      .map(m => `• <b>${m.label}</b>: ${m.desc}`)
      .join("<br/>");

  // Quests
  el.dailyQuestList.innerHTML = "";
  for (const q of dailyConfig.quests) {
    const st = dailyState.quests[q.id] || { progress: 0, completed: false, claimed: false };
    const li = document.createElement("li");
    li.className = "quest-item";
    if (st.completed) li.classList.add("done");
    if (st.claimed) li.classList.add("claimed");

    let progressText;
    if (q.type === "daily_distance_best") progressText = `${Math.floor(st.progress)} / ${q.target} m`;
    else progressText = `${Math.min(Math.floor(st.progress), q.target)} / ${q.target}`;

    let status = "";
    if (st.claimed) status = "Đã nhận thưởng";
    else if (st.completed) status = "Hoàn thành – chờ nhận";

    li.innerHTML = `
      <div class="q-title">${q.title}</div>
      <div class="q-desc">${q.desc}</div>
      <div class="q-meta">
        <span>Tiến độ: ${progressText}</span>
        <span>Thưởng: +${q.reward} coins</span>
        <span>${status}</span>
      </div>
    `;
    el.dailyQuestList.appendChild(li);
  }

  // Leaderboard
  el.dailyLeaderboardInfo.textContent =
    `Daily Endless – best hôm nay: ${Math.floor(stats.dailyBestDistance)} m`;

  el.dailyLeaderboard.innerHTML = "";
  const list = Array.isArray(dailyState.leaderboard) ? dailyState.leaderboard.slice() : [];
  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "leader-empty";
    li.textContent = "Chưa có run nào. Chơi Daily Endless để ghi vào bảng.";
    el.dailyLeaderboard.appendChild(li);
  } else {
    list.sort((a, b) => b.distance - a.distance);
    list.slice(0, 10).forEach((r, idx) => {
      const li = document.createElement("li");
      li.className = "leader-item";
      const d = new Date(r.ts || Date.now());
      li.innerHTML =
        `#${idx + 1} • <b>${Math.floor(r.distance)}m</b> • ` +
        `${r.time.toFixed(1)}s • score ${r.score} • ${d.toLocaleTimeString()}`;
      el.dailyLeaderboard.appendChild(li);
    });
  }
}

// ===== Owned skins + Level stars =====
let ownedSkins = {};     // id -> boolean
let levelStars = {};     // levelId -> 0..3

function loadPersisted() {
  const savedSkin = localStorage.getItem(STORAGE_KEYS.skin);
  if (savedSkin) skinId = savedSkin;

  const rawStats = safeJSONParse(localStorage.getItem(STORAGE_KEYS.stats) || "{}", {});
  stats.runs = rawStats.runs || 0;
  stats.distance = rawStats.distance || 0;
  stats.runCoins = rawStats.runCoins || 0;
  stats.crashes = rawStats.crashes || 0;
  stats.bestScore = rawStats.bestScore || 0;

  const daily = Number(localStorage.getItem(STORAGE_KEYS.dailyBest) || "0");
  stats.dailyBestDistance = Number.isFinite(daily) ? daily : 0;

  const w = Number(localStorage.getItem(STORAGE_KEYS.wallet) || "0");
  stats.wallet = Number.isFinite(w) ? w : 0;

  const a = safeJSONParse(localStorage.getItem(STORAGE_KEYS.ach) || "{}", {});
  for (const def of achievementsDef) achState[def.id] = !!a[def.id];

  ownedSkins = safeJSONParse(localStorage.getItem(STORAGE_KEYS.ownedSkins) || "{}", {});
  ownedSkins["yellow"] = true;
  ownedSkins["white"] = true;

  levelStars = safeJSONParse(localStorage.getItem(STORAGE_KEYS.levelStars) || "{}", {});
}

function savePersisted() {
  localStorage.setItem(STORAGE_KEYS.skin, skinId);
  localStorage.setItem(STORAGE_KEYS.dailyBest, String(Math.floor(stats.dailyBestDistance)));
  localStorage.setItem(STORAGE_KEYS.wallet, String(Math.floor(stats.wallet)));
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
    runs: stats.runs,
    distance: Math.floor(stats.distance),
    runCoins: stats.runCoins,
    crashes: stats.crashes,
    bestScore: stats.bestScore
  }));
  localStorage.setItem(STORAGE_KEYS.ach, JSON.stringify(achState));
  localStorage.setItem(STORAGE_KEYS.ownedSkins, JSON.stringify(ownedSkins));
  localStorage.setItem(STORAGE_KEYS.levelStars, JSON.stringify(levelStars));
}

function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.skin);
  localStorage.removeItem(STORAGE_KEYS.stats);
  localStorage.removeItem(STORAGE_KEYS.ach);
  localStorage.removeItem(STORAGE_KEYS.customLevels);
  localStorage.removeItem(STORAGE_KEYS.dailyBest);
  localStorage.removeItem(STORAGE_KEYS.wallet);
  localStorage.removeItem(STORAGE_KEYS.ownedSkins);
  localStorage.removeItem(STORAGE_KEYS.levelStars);
  localStorage.removeItem(STORAGE_KEYS.dailyState);
  for (let i = 0; i < 200; i++) {
    localStorage.removeItem(STORAGE_KEYS.ghostPrefix + i);
    localStorage.removeItem(STORAGE_KEYS.bestTimePrefix + i);
  }
  location.reload();
}

// ===== Levels =====
const defaultLevels = [
  {
    id: "c1",
    name: "Hills 101",
    startX: 80, finishX: 1120, parTime: 30, endless: false,
    terrain: [
      {x: 0, y: 420}, {x: 260, y: 380}, {x: 420, y: 410},
      {x: 620, y: 360}, {x: 870, y: 400}, {x: 1120, y: 420}
    ],
    coins: [{x: 150, yOffset: -70}, {x: 350, yOffset: -90}, {x: 560, yOffset: -85}],
    hazards: [{x: 720}], // ít hazard để dễ win
    fuelPacks: [{x: 420, yOffset: -35}],
    checkpoints: []
  },
  {
    id: "c2",
    name: "Downhill Rush",
    startX: 80, finishX: 1250, parTime: 36, endless: false,
    terrain: [
      {x: 0, y: 390}, {x: 220, y: 350}, {x: 430, y: 320},
      {x: 560, y: 360}, {x: 760, y: 430}, {x: 1250, y: 420}
    ],
    coins: [{x: 240, yOffset: -85}, {x: 430, yOffset: -70}, {x: 720, yOffset: -100}],
    hazards: [{x: 610}],
    fuelPacks: [{x: 650, yOffset: -40}],
    checkpoints: [560]
  },
  {
    id: "c3",
    name: "Bridge Gap",
    startX: 80, finishX: 1300, parTime: 42, endless: false,
    terrain: [
      {x: 0, y: 420}, {x: 140, y: 420},
      {x: 210, y: 470}, {x: 290, y: 470},
      {x: 360, y: 390}, {x: 560, y: 350},
      {x: 760, y: 390}, {x: 880, y: 430},
      {x: 980, y: 430}, {x: 1060, y: 470},
      {x: 1140, y: 470}, {x: 1220, y: 420}, {x: 1300, y: 420}
    ],
    coins: [{x: 360, yOffset: -75}, {x: 560, yOffset: -85}, {x: 980, yOffset: -75}],
    hazards: [{x: 250}, {x: 1090}],
    fuelPacks: [{x: 900, yOffset: -40}],
    checkpoints: [360, 980]
  },
  {
    id: "c4",
    name: "Crazy Slopes",
    startX: 80, finishX: 1500, parTime: 50, endless: false,
    terrain: [
      {x: 0, y: 410}, {x: 200, y: 340}, {x: 380, y: 470},
      {x: 560, y: 320}, {x: 740, y: 390}, {x: 920, y: 330},
      {x: 1100, y: 450}, {x: 1250, y: 340}, {x: 1380, y: 430},
      {x: 1500, y: 410}
    ],
    coins: [{x: 200, yOffset: -85}, {x: 560, yOffset: -95}, {x: 1100, yOffset: -100}],
    hazards: [{x: 450}, {x: 1280}],
    fuelPacks: [{x: 650, yOffset: -50}, {x: 1200, yOffset: -45}],
    checkpoints: [380, 920, 1250]
  },
  {
    id: "c5",
    name: "Tight Balance",
    startX: 70, finishX: 1600, parTime: 58, endless: false,
    terrain: [
      {x: 0, y: 430}, {x: 180, y: 430},
      {x: 260, y: 360}, {x: 360, y: 360},
      {x: 470, y: 460}, {x: 580, y: 460},
      {x: 710, y: 345}, {x: 865, y: 430},
      {x: 1020, y: 390}, {x: 1160, y: 470},
      {x: 1310, y: 350}, {x: 1460, y: 430},
      {x: 1600, y: 430}
    ],
    coins: [{x: 260, yOffset: -70}, {x: 560, yOffset: -90}, {x: 1020, yOffset: -85}, {x: 1310, yOffset: -80}],
    hazards: [{x: 505}, {x: 1185}],
    fuelPacks: [{x: 930, yOffset: -45}],
    checkpoints: [710, 1160]
  }
];

function makeDailyEndlessLevel(seed) {
  return {
    id: "daily_" + String(seed),
    name: "Daily Endless",
    startX: 60,
    finishX: null,
    parTime: 999,
    endless: true,
    terrain: [{x: 0, y: 420}, {x: 140, y: 380}, {x: 280, y: 420}],
    coins: [],
    hazards: [],
    fuelPacks: [],
    checkpoints: []
  };
}

// Custom levels
function loadCustomLevels() {
  const raw = localStorage.getItem(STORAGE_KEYS.customLevels);
  const arr = safeJSONParse(raw || "[]", []);
  if (!Array.isArray(arr)) return [];
  return arr.map(lv => sanitizeLevel(lv, true)).filter(Boolean);
}
function saveCustomLevels(levelsArr) {
  localStorage.setItem(STORAGE_KEYS.customLevels, JSON.stringify(levelsArr));
}

function sanitizeLevel(lv, isCustom) {
  if (!lv || typeof lv !== "object") return null;
  const out = {
    id: String(lv.id || (isCustom ? ("c_" + Math.random().toString(16).slice(2)) : "x")),
    name: String(lv.name || "Untitled"),
    startX: Number(lv.startX ?? 80),
    finishX: (lv.finishX === null || lv.finishX === undefined) ? (lv.endless ? null : Number(lv.finishX ?? 1100)) : Number(lv.finishX),
    parTime: Number(lv.parTime ?? 35),
    endless: !!lv.endless,
    terrain: Array.isArray(lv.terrain) ? lv.terrain.map(p => ({x: Number(p.x), y: Number(p.y)})) : [],
    coins: Array.isArray(lv.coins) ? lv.coins.map(c => ({x: Number(c.x), yOffset: Number(c.yOffset ?? -70)})) : [],
    hazards: Array.isArray(lv.hazards) ? lv.hazards.map(h => ({x: Number(h.x)})) : [],
    fuelPacks: Array.isArray(lv.fuelPacks) ? lv.fuelPacks.map(f => ({x: Number(f.x), yOffset: Number(f.yOffset ?? -40)})) : [],
    checkpoints: Array.isArray(lv.checkpoints) ? lv.checkpoints.map(x => Number(x)) : []
  };

  if (!Number.isFinite(out.startX)) out.startX = 80;
  if (!Number.isFinite(out.parTime) || out.parTime < 5) out.parTime = 35;

  if (out.endless) out.finishX = null;
  if (!out.endless && (!Number.isFinite(out.finishX) || out.finishX < out.startX + 100)) out.finishX = out.startX + 1000;

  if (!Array.isArray(out.terrain) || out.terrain.length < 2) {
    out.terrain = [{x: 0, y: 420}, {x: 400, y: 420}, {x: 900, y: 420}];
  }
  out.terrain.sort((a,b) => a.x - b.x);
  for (let i = 1; i < out.terrain.length; i++) {
    if (out.terrain[i].x <= out.terrain[i-1].x) out.terrain[i].x = out.terrain[i-1].x + 20;
    out.terrain[i].y = clamp(out.terrain[i].y, 260, 560);
  }
  out.terrain[0].y = clamp(out.terrain[0].y, 260, 560);
  return out;
}

// ===== Runtime level state =====
let activeLevel = null;
let activeLevelId = "";
let activeLevelIndex = 0;
let activeSet = "DEFAULT"; // DEFAULT, DAILY, CUSTOM, TEST
let coinTaken = [];
let fuelTaken = [];
let checkpointReached = null;

// ===== Run state =====
let levelTime = 0;
let lives = 4;
const MAX_LIVES = 4;
let nitro = 1.0;
let fuel = 1.0;
let coinsRun = 0;
let scoreRun = 0;
let distanceRun = 0;
let lastCarX = 0;

// ===== Replay/Ghost =====
let ghostFrames = null;    // best ghost for this level
let runFrames = [];        // current run record
let lastRunFrames = null;  // last finished run (win/lose)
let replayT = 0;
let replayFrames = null;

// ===== Editor =====
let customLevels = [];
let editor = {
  tool: "terrain",
  snap: true,
  showGrid: true,
  draggingPointRef: null,
  hoveredPointRef: null,
  terrain: [{x: 0, y: 420}, {x: 300, y: 380}, {x: 650, y: 420}, {x: 1100, y: 420}],
  coins: [{x: 350, yOffset: -80}],
  hazards: [{x: 720}],
  fuelPacks: [{x: 500, yOffset: -40}],
  checkpoints: [650],
  startX: 80,
  finishX: 1100,
  parTime: 35,
  name: "My Custom Level"
};

// ===== Terrain sampling + endless extension =====
function sampleTerrain(level, x, rngForEndless) {
  if (level.endless && rngForEndless) {
    while (x > level.terrain[level.terrain.length - 1].x - 220) {
      const last = level.terrain[level.terrain.length - 1];
      const dx = 140 + Math.floor(rngForEndless() * 60);
      let ny = last.y + (rngForEndless() * 140 - 70);
      ny = clamp(ny, 300, 520);
      level.terrain.push({ x: last.x + dx, y: ny });

      const baseX = last.x + dx;
      if (rngForEndless() < 0.35) { level.coins.push({ x: baseX + 10, yOffset: -70 - rngForEndless() * 50 }); coinTaken.push(false); }
      if (rngForEndless() < 0.22) { level.fuelPacks.push({ x: baseX + 30, yOffset: -40 }); fuelTaken.push(false); }
      if (rngForEndless() < 0.22) { level.hazards.push({ x: baseX + 20 }); }
    }
  }

  const pts = level.terrain;
  if (x <= pts[0].x) return { x, y: pts[0].y, angle: 0 };
  if (x >= pts[pts.length - 1].x) return { x, y: pts[pts.length - 1].y, angle: 0 };

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      const y = a.y + (b.y - a.y) * t;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      return { x, y, angle };
    }
  }
  return { x, y: pts[0].y, angle: 0 };
}

// ===== Difficulty =====
function applyDifficulty() {
  if (difficulty === "easy") { GRAVITY = 900; BASE_ACCEL = 900; TURBO_ACCEL = 1600; }
  else if (difficulty === "normal") { GRAVITY = 1100; BASE_ACCEL = 950; TURBO_ACCEL = 1800; }
  else { GRAVITY = 1250; BASE_ACCEL = 1000; TURBO_ACCEL = 2000; }
}

// ===== Camera =====
function updateCamera(dt) {
  const look = clamp(car.vx * 0.35, -180, 220);
  const tx = car.x + look;
  const ty = car.y - 80;

  camX += (tx - camX) * 0.12;
  camY += (ty - camY) * 0.12;

  const speed = Math.abs(car.vx);
  const tz = 1 - Math.min(speed / 900, 0.42);
  targetZoom += (tz - targetZoom) * 0.08;
  camZoom = targetZoom;

  if (camShake > 0.1) camShake *= 0.9;
}
function snapCamera() {
  camX = car.x; camY = car.y - 80;
  camZoom = 1; targetZoom = 1; camShake = 0;
}

// ===== Audio (simple synth) =====
let audioCtx = null;
let engineOsc = null;
let engineGain = null;

function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  engineOsc = audioCtx.createOscillator();
  engineGain = audioCtx.createGain();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 0;
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain);
  engineGain.connect(audioCtx.destination);
  engineOsc.start();
}
function beep(freq, dur, vol = 0.18) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  g.gain.value = vol;
  osc.connect(g); g.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  osc.start(t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.stop(t + dur);
}
function updateEngine() {
  if (!audioCtx || !engineOsc || !engineGain) return;
  if (!engineSoundEnabled || !soundEnabled || (gameState !== "playing")) {
    engineGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.06);
    return;
  }
  const s = Math.abs(car.vx);
  const freq = 70 + s * 0.55;
  const vol = Math.min(0.25, 0.05 + s / 1600);
  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.06);
  engineGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.06);
}

// ===== HUD =====
function setModeLabel() { el.hudMode.textContent = mode; }
function setLevelLabel(text) { el.hudLevelName.textContent = text; }
function setHudStarsFromLevel() {
  if (!activeLevel || activeLevel.endless || activeSet !== "DEFAULT") {
    el.hudStars.textContent = "★☆☆";
    return;
  }
  const s = Number(levelStars[activeLevelId] || 0);
  el.hudStars.textContent = (s >= 1 ? "★" : "☆") + (s >= 2 ? "★" : "☆") + (s >= 3 ? "★" : "☆");
}
function updateHud() {
  el.hudTime.textContent = levelTime.toFixed(1);
  el.hudSpeed.textContent = String(Math.round(Math.abs(car.vx) / 4));
  el.hudLives.textContent = String(lives);
  el.hudNitro.textContent = String(Math.round(nitro * 100)) + "%";
  el.hudFuel.textContent = String(Math.round(fuel * 100)) + "%";
  el.hudCoins.textContent = String(coinsRun);
  el.hudWallet.textContent = String(Math.floor(stats.wallet));
  el.hudScore.textContent = String(scoreRun);
}

// ===== Storage keys per level =====
function levelStorageKeyGhost() { return STORAGE_KEYS.ghostPrefix + activeLevelId; }
function levelStorageKeyBestTime() { return STORAGE_KEYS.bestTimePrefix + activeLevelId; }
function loadGhostBestForLevel() {
  const gf = safeJSONParse(localStorage.getItem(levelStorageKeyGhost()) || "null", null);
  ghostFrames = Array.isArray(gf) ? gf : null;
}
function saveGhostBestForLevel(frames) { localStorage.setItem(levelStorageKeyGhost(), JSON.stringify(frames)); }
function loadBestTimeForLevel() {
  const t = Number(localStorage.getItem(levelStorageKeyBestTime()) || "0");
  return Number.isFinite(t) && t > 0 ? t : null;
}
function saveBestTimeForLevel(t) { localStorage.setItem(levelStorageKeyBestTime(), String(t)); }

// ===== Campaign unlock rule =====
function isCampaignLevelUnlocked(index) {
  if (index <= 0) return true;
  const prevId = defaultLevels[index - 1].id;
  const prevStars = Number(levelStars[prevId] || 0);
  return prevStars >= 1;
}
function totalCampaignStars() {
  let sum = 0;
  for (const lv of defaultLevels) sum += Number(levelStars[lv.id] || 0);
  return sum;
}

// ===== Level start =====
function levelTitleText() {
  if (!activeLevel) return "LEVEL";
  const tag =
    activeSet === "DEFAULT" ? "Campaign" :
    activeSet === "CUSTOM" ? "Custom" :
    activeSet === "DAILY" ? "Daily" : "Test";
  return `${tag} • ${activeLevel.name || "Level"}`;
}

function startLevel(level, setName, index = 0) {
  activeLevel = sanitizeLevel(level, setName === "CUSTOM");
  activeSet = setName;
  activeLevelIndex = index;
  activeLevelId = activeLevel.id;

  if (setName === "DAILY") activeDailyConfig = dailyConfig;
  else activeDailyConfig = null;

  coinTaken = activeLevel.coins.map(() => false);
  fuelTaken = activeLevel.fuelPacks.map(() => false);
  checkpointReached = null;

  levelTime = 0;
  lives = MAX_LIVES;
  nitro = 1.0;
  fuel = 1.0;
  coinsRun = 0;
  scoreRun = 0;
  distanceRun = 0;
  lastCarX = 0;
  runFrames = [];
  replayFrames = null;
  replayT = 0;

  grounded = true;
  jumpOffset = 0;
  jumpVel = 0;
  jumpRequested = false;

  const g = sampleTerrain(activeLevel, activeLevel.startX, null);
  car.x = activeLevel.startX;
  car.y = g.y - 30;
  car.vx = 0;
  car.vy = 0;
  car.angle = g.angle;
  car.angularVel = 0;

  setModeLabel();
  setLevelLabel(levelTitleText());
  setHudStarsFromLevel();
  loadGhostBestForLevel();

  snapCamera();
  drawMinimapBase();

  gameState = "playing";
  hideAllPanels();
  lastT = nowMs();
}

// ===== Panels =====
function hideAllPanels() {
  el.menuPanel.classList.add("hidden");
  el.levelPanel.classList.add("hidden");
  el.settingsPanel.classList.add("hidden");
  el.storePanel.classList.add("hidden");
  el.pausePanel.classList.add("hidden");
  el.resultPanel.classList.add("hidden");
  el.statsPanel.classList.add("hidden");
  el.editorPanel.classList.add("hidden");
}

// ===== Levels UI =====
let levelTab = "DEFAULT"; // DEFAULT, DAILY, CUSTOM
function setTab(tab) {
  levelTab = tab;
  el.tabDefault.classList.toggle("active", tab === "DEFAULT");
  el.tabDaily.classList.toggle("active", tab === "DAILY");
  el.tabCustom.classList.toggle("active", tab === "CUSTOM");
  renderLevelList();
}
function renderLevelList() {
  el.levelList.innerHTML = "";

  const mk = (title, descLines, meta, onPlay, onDelete, disabled) => {
    const card = document.createElement("div");
    card.className = "level-card";

    const t = document.createElement("div");
    t.className = "title";
    const left = document.createElement("span");
    left.textContent = title;
    const right = document.createElement("span");
    right.className = "level-badge " + (disabled ? "locked" : "");
    right.textContent = meta;
    t.appendChild(left);
    t.appendChild(right);

    const d = document.createElement("div");
    d.className = "desc";
    d.innerHTML = descLines.join("<br/>");

    const actions = document.createElement("div");
    actions.className = "actions";

    const b1 = document.createElement("button");
    b1.className = "btn small";
    b1.textContent = disabled ? "Locked" : "Play";
    b1.disabled = !!disabled;
    b1.addEventListener("click", onPlay);
    actions.appendChild(b1);

    if (onDelete) {
      const b2 = document.createElement("button");
      b2.className = "btn small secondary";
      b2.textContent = "Delete";
      b2.addEventListener("click", onDelete);
      actions.appendChild(b2);
    }

    card.appendChild(t);
    card.appendChild(d);
    card.appendChild(actions);
    return card;
  };

  if (levelTab === "DEFAULT") {
    defaultLevels.forEach((lv, i) => {
      const unlocked = isCampaignLevelUnlocked(i);
      const stars = Number(levelStars[lv.id] || 0);
      const starsText = `<span class="level-stars">${(stars>=1?"★":"☆")}${(stars>=2?"★":"☆")}${(stars>=3?"★":"☆")}</span>`;
      const best = Number(localStorage.getItem(STORAGE_KEYS.bestTimePrefix + lv.id) || "0");
      const bestTxt = best > 0 ? `${best.toFixed(1)}s` : "—";
      const desc = [
        `Finish: ${lv.finishX} • Par: ${lv.parTime}s • Best: ${bestTxt}`,
        `Objects: ${lv.coins.length} coins, ${lv.hazards.length} hazards, ${lv.fuelPacks.length} fuel`,
        `Stars: ${starsText} • Unlock: cần ≥1★ ở level trước`
      ];
      el.levelList.appendChild(mk(
        lv.name,
        desc,
        unlocked ? "CAMPAIGN" : "LOCKED",
        () => { if (!unlocked) return; mode = "PLAY"; startLevel(lv, "DEFAULT", i); },
        null,
        !unlocked
      ));
    });
  }

  if (levelTab === "DAILY") {
    const seed = dateSeedYYYYMMDD(new Date());
    const dl = makeDailyEndlessLevel(seed);
    const desc = [
      `Seed: ${seed} • Endless • Today best: ${Math.floor(stats.dailyBestDistance)}m`,
      `Daily Modifiers + Quests + Local leaderboard (xem trong Stats).`
    ];
    el.levelList.appendChild(mk(
      dl.name,
      desc,
      "DAILY",
      () => { mode = "DAILY"; startLevel(dl, "DAILY", 0); },
      null,
      false
    ));
  }

  if (levelTab === "CUSTOM") {
    customLevels = loadCustomLevels();
    if (customLevels.length === 0) {
      el.levelList.appendChild(mk(
        "No custom levels",
        ["Mở Editor để tạo level rồi Save."],
        "CUSTOM",
        () => openEditor(),
        null,
        false
      ));
      return;
    }
    customLevels.forEach((lv, i) => {
      const desc = [
        `Finish: ${lv.finishX} • Par: ${lv.parTime}s • Terrain pts: ${lv.terrain.length}`,
        `Objects: ${lv.coins.length} coins, ${lv.hazards.length} hazards, ${lv.fuelPacks.length} fuel`
      ];
      el.levelList.appendChild(mk(
        lv.name,
        desc,
        "CUSTOM",
        () => { mode = "CUSTOM"; startLevel(lv, "CUSTOM", i); },
        () => {
          const arr = loadCustomLevels();
          const next = arr.filter(x => x.id !== lv.id);
          saveCustomLevels(next);
          renderLevelList();
          checkAchievements({ customCount: next.length });
        },
        false
      ));
    });
  }
}

// ===== Store UI =====
function renderStore() {
  el.storeGrid.innerHTML = "";
  el.storeWallet.textContent = String(Math.floor(stats.wallet));

  for (const s of skins) {
    const owned = !!ownedSkins[s.id];
    const active = (skinId === s.id);

    const item = document.createElement("div");
    item.className = "store-item";

    const nameRow = document.createElement("div");
    nameRow.className = "store-row";
    nameRow.innerHTML = `<b>${s.id.toUpperCase()}</b><span>${owned ? "Owned" : ("Cost: " + s.cost)}</span>`;

    const sw = document.createElement("div");
    sw.className = "store-swatch";
    sw.style.background = `linear-gradient(135deg, ${s.body}, ${s.accent})`;

    const info = document.createElement("div");
    info.className = "store-row";
    info.innerHTML = `<span>Body</span><span>${s.body}</span>`;

    const actions = document.createElement("div");
    actions.className = "store-actions";

    const btnEquip = document.createElement("button");
    btnEquip.className = "btn small";
    btnEquip.textContent = active ? "Equipped" : "Equip";
    btnEquip.disabled = !owned || active;
    btnEquip.addEventListener("click", () => {
      if (!ownedSkins[s.id]) return;
      skinId = s.id;
      localStorage.setItem(STORAGE_KEYS.skin, skinId);
      renderStore();
    });

    const btnBuy = document.createElement("button");
    btnBuy.className = "btn small secondary";
    if (owned) {
      btnBuy.textContent = "Owned";
      btnBuy.disabled = true;
    } else if (s.cost <= 0) {
      btnBuy.textContent = "Free";
      btnBuy.disabled = false;
    } else {
      btnBuy.textContent = "Buy";
      btnBuy.disabled = stats.wallet < s.cost;
    }
    btnBuy.addEventListener("click", () => {
      if (ownedSkins[s.id]) return;
      if (s.cost > 0 && stats.wallet < s.cost) return;

      if (s.cost > 0) stats.wallet -= s.cost;
      ownedSkins[s.id] = true;
      skinId = s.id;

      savePersisted();
      beep(1000, 0.10, 0.12);
      renderStore();
    });

    item.appendChild(nameRow);
    item.appendChild(sw);
    item.appendChild(info);
    item.appendChild(actions);
    actions.appendChild(btnEquip);
    actions.appendChild(btnBuy);

    el.storeGrid.appendChild(item);
  }
}

// ===== Achievements & Stats =====
function renderStats() {
  el.statsRuns.textContent = String(stats.runs);
  el.statsDistance.textContent = String(Math.floor(stats.distance));
  el.statsCoins.textContent = String(stats.runCoins);
  el.statsWallet.textContent = String(Math.floor(stats.wallet));
  el.statsCrashes.textContent = String(stats.crashes);
  el.statsBestScore.textContent = String(stats.bestScore);
  el.statsDailyBest.textContent = String(Math.floor(stats.dailyBestDistance));

  el.achievements.innerHTML = "";
  for (const def of achievementsDef) {
    const unlocked = !!achState[def.id];
    const item = document.createElement("div");
    item.className = "ach " + (unlocked ? "unlocked" : "locked");
    const n = document.createElement("div");
    n.className = "name";
    n.textContent = unlocked ? `✓ ${def.name}` : def.name;
    const info = document.createElement("div");
    info.className = "info";
    info.textContent = def.info;
    item.appendChild(n);
    item.appendChild(info);
    el.achievements.appendChild(item);
  }

  renderDailyUI();
}

function checkAchievements(extraCtx = {}) {
  const ctx = {
    firstWin: !!extraCtx.firstWin,
    totalRunCoins: stats.runCoins,
    wallet: stats.wallet,
    totalCrashes: stats.crashes,
    runScore: extraCtx.runScore ?? 0,
    dailyDistance: extraCtx.dailyDistance ?? 0,
    customCount: loadCustomLevels().length,
    totalStars: totalCampaignStars()
  };

  let changed = false;
  for (const def of achievementsDef) {
    if (!achState[def.id] && def.test(ctx)) {
      achState[def.id] = true;
      changed = true;
      beep(1200, 0.12, 0.12);
    }
  }
  if (changed) savePersisted();
}

// ===== Input =====
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["ArrowLeft","ArrowRight","Space","KeyR","KeyP","ShiftLeft","ShiftRight","ArrowUp","KeyW"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === "KeyR") restart();
  if (e.code === "KeyP") togglePause();
  if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
    jumpRequested = true;
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Touch
el.btnLeft.addEventListener("pointerdown", () => touchLeft = true);
el.btnLeft.addEventListener("pointerup", () => touchLeft = false);
el.btnLeft.addEventListener("pointercancel", () => touchLeft = false);
el.btnRight.addEventListener("pointerdown", () => touchRight = true);
el.btnRight.addEventListener("pointerup", () => touchRight = false);
el.btnRight.addEventListener("pointercancel", () => touchRight = false);
el.btnNitro.addEventListener("pointerdown", () => touchNitro = true);
el.btnNitro.addEventListener("pointerup", () => touchNitro = false);
el.btnNitro.addEventListener("pointercancel", () => touchNitro = false);
el.btnJump.addEventListener("pointerdown", () => { jumpRequested = true; });

// Tilt
window.addEventListener("deviceorientation", (e) => {
  if (!tiltEnabled) return;
  const g = Number(e.gamma);
  if (!Number.isFinite(g)) return;
  tiltValue = clamp(g / 35, -1, 1);
});

// ===== Buttons wiring =====
el.btnMenu.addEventListener("click", () => openMenu());
el.btnRestart.addEventListener("click", () => restart());
el.btnPause.addEventListener("click", () => togglePause());
el.btnReplayBest.addEventListener("click", () => startReplayBest());
el.btnReplayLast.addEventListener("click", () => startReplayLast());
el.btnStore.addEventListener("click", () => { el.storePanel.classList.remove("hidden"); renderStore(); });
el.btnLevels.addEventListener("click", () => { el.levelPanel.classList.remove("hidden"); setTab(levelTab); });
el.btnEditor.addEventListener("click", () => openEditor());
el.btnFullscreen.addEventListener("click", () => toggleFullscreen());
el.btnSettings.addEventListener("click", () => el.settingsPanel.classList.remove("hidden"));
el.btnStats.addEventListener("click", () => { renderStats(); el.statsPanel.classList.remove("hidden"); });

el.btnSound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  el.btnSound.textContent = soundEnabled ? "SFX: ON" : "SFX: OFF";
});

el.btnPlayCampaign.addEventListener("click", () => startCampaignFromMenu());
el.btnPlayDaily.addEventListener("click", () => startDailyFromMenu());
el.btnOpenLevels.addEventListener("click", () => { el.levelPanel.classList.remove("hidden"); setTab("DEFAULT"); });
el.btnOpenStore.addEventListener("click", () => { el.storePanel.classList.remove("hidden"); renderStore(); });
el.btnOpenEditor.addEventListener("click", () => openEditor());

el.btnCloseLevels.addEventListener("click", () => el.levelPanel.classList.add("hidden"));
el.tabDefault.addEventListener("click", () => setTab("DEFAULT"));
el.tabDaily.addEventListener("click", () => setTab("DAILY"));
el.tabCustom.addEventListener("click", () => setTab("CUSTOM"));

el.btnCloseSettings.addEventListener("click", () => el.settingsPanel.classList.add("hidden"));
el.difficultySelect.addEventListener("change", () => { difficulty = el.difficultySelect.value; applyDifficulty(); });
el.toggleGhost.addEventListener("change", () => { ghostEnabled = el.toggleGhost.checked; });
el.toggleEngine.addEventListener("change", () => { engineSoundEnabled = el.toggleEngine.checked; });
el.toggleTilt.addEventListener("change", () => {
  tiltEnabled = el.toggleTilt.checked;
  if (tiltEnabled) {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().catch(() => {}).then(() => {});
    } else {
      // không cần gì thêm
    }
  } else {
    tiltValue = 0;
  }
});
el.tiltSensitivity.addEventListener("input", () => { tiltSensitivity = Number(el.tiltSensitivity.value) || 1.2; });

el.btnCloseStore.addEventListener("click", () => el.storePanel.classList.add("hidden"));

el.btnResume.addEventListener("click", () => resume());
el.btnRetry.addEventListener("click", () => { el.resultPanel.classList.add("hidden"); restart(); });
el.btnNext.addEventListener("click", () => nextLevel());

el.btnResetData.addEventListener("click", () => resetAllData());
el.btnCloseStats.addEventListener("click", () => el.statsPanel.classList.add("hidden"));

el.btnClaimDailyQuests.addEventListener("click", () => {
  if (!dailyConfig || !dailyState) return;
  let gained = 0;
  for (const q of dailyConfig.quests) {
    const st = dailyState.quests[q.id];
    if (!st) continue;
    if (st.completed && !st.claimed) {
      st.claimed = true;
      gained += q.reward;
    }
  }
  if (gained > 0) {
    stats.wallet += gained;
    savePersisted();
    saveDailyState();
    renderStats();
    beep(1100, 0.12, 0.12);
  } else {
    beep(400, 0.06, 0.1);
  }
});

// ===== Menu/Start =====
function openMenu() {
  gameState = "menu";
  mode = "PLAY";
  setModeLabel();
  setLevelLabel("LEVEL");
  setHudStarsFromLevel();
  hideAllPanels();
  el.menuPanel.classList.remove("hidden");
}

function startCampaignFromMenu() {
  mode = "PLAY";
  let idx = 0;
  for (let i = 0; i < defaultLevels.length; i++) {
    if (isCampaignLevelUnlocked(i)) idx = i;
  }
  startLevel(defaultLevels[idx], "DEFAULT", idx);
}

function startDailyFromMenu() {
  mode = "DAILY";
  const seed = dateSeedYYYYMMDD(new Date());
  const daily = makeDailyEndlessLevel(seed);
  startLevel(daily, "DAILY", 0);
}

// ===== Pause =====
function togglePause() {
  if (gameState === "playing") {
    gameState = "paused";
    el.pausePanel.classList.remove("hidden");
  } else if (gameState === "paused") {
    resume();
  }
}
function resume() {
  el.pausePanel.classList.add("hidden");
  gameState = "playing";
  lastT = nowMs();
}

// ===== Restart/Next =====
function restart() {
  if (!activeLevel) { openMenu(); return; }
  startLevel(activeLevel, activeSet, activeLevelIndex);
}
function nextLevel() {
  if (activeSet === "DEFAULT") {
    const next = activeLevelIndex + 1;
    if (next < defaultLevels.length && isCampaignLevelUnlocked(next)) {
      mode = "PLAY";
      startLevel(defaultLevels[next], "DEFAULT", next);
      return;
    }
    openMenu();
    return;
  }
  if (activeSet === "CUSTOM") {
    const list = loadCustomLevels();
    if (list.length === 0) return openMenu();
    const idx = (activeLevelIndex + 1) % list.length;
    mode = "CUSTOM";
    startLevel(list[idx], "CUSTOM", idx);
    return;
  }
  startDailyFromMenu();
}

// ===== Fullscreen =====
function toggleFullscreen() {
  const root = document.documentElement;
  const isFs = !!document.fullscreenElement;
  if (!isFs) {
    if (root.requestFullscreen) root.requestFullscreen().catch(()=>{});
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  }
}

// ===== Score =====
function computeScore() {
  if (!activeLevel) return 0;
  let base = 0;
  if (!activeLevel.endless) {
    const timeBonus = Math.max(0, Math.floor((activeLevel.parTime - levelTime) * 10));
    base = coinsRun * 100 + timeBonus;
  } else {
    base = coinsRun * 100 + Math.floor(distanceRun / 10);
  }

  const dailyMods = (activeSet === "DAILY" && activeDailyConfig && activeDailyConfig.modifiers)
    ? activeDailyConfig.modifiers
    : null;

  if (dailyMods && dailyMods.scoreMul && activeSet === "DAILY") {
    base = Math.floor(base * dailyMods.scoreMul);
  }
  return base;
}

// ===== Crash/Win =====
function crash(reason = "CRASH") {
  stats.crashes += 1;
  lives -= 1;
  camShake = 10;
  beep(220, 0.18, 0.18);

  grounded = true;
  jumpOffset = 0;
  jumpVel = 0;
  jumpRequested = false;

  if (lives > 0) {
    nitro = 1.0;
    fuel = 1.0;
    const sx = checkpointReached != null ? checkpointReached : activeLevel.startX;
    const g = sampleTerrain(activeLevel, sx, null);
    car.x = sx; car.y = g.y - 30; car.vx = 0; car.vy = 0; car.angle = g.angle; car.angularVel = 0;
    lastCarX = car.x;
    snapCamera();
    return;
  }

  if (reason === "FUEL") showResult(false, "Hết xăng + hết mạng!");
  else showResult(false, "Hết mạng!");
}

function win() {
  beep(920, 0.16, 0.14);
  showResult(true, "Tới đích!");
}

// ===== Result + Campaign stars + Wallet coins =====
function calcStarsForCampaign() {
  if (!activeLevel || activeLevel.endless) return 0;
  let stars = 1;
  if (levelTime <= activeLevel.parTime * 0.8) stars = 3;
  else if (levelTime <= activeLevel.parTime * 1.1) stars = 2;
  return stars;
}

function walletBonus(isWin, stars) {
  if (!activeLevel) return 0;
  if (activeSet === "DEFAULT") {
    if (!isWin) return 0;
    return 10 + stars * 8;
  }
  if (activeSet === "DAILY") {
    const b = Math.floor(distanceRun / 250);
    return clamp(b, 0, 20);
  }
  if (activeSet === "CUSTOM") {
    if (!isWin) return 0;
    return 6;
  }
  return 0;
}

function showResult(isWin, title) {
  gameState = "result";
  el.resultPanel.classList.remove("hidden");
  el.resultTitle.textContent = title;
  el.starRow.innerHTML = "";

  scoreRun = computeScore();
  lastRunFrames = runFrames.slice();

  let stars = 0;
  if (isWin && !activeLevel.endless && activeSet === "DEFAULT") {
    stars = calcStarsForCampaign();
    const prev = Number(levelStars[activeLevelId] || 0);
    levelStars[activeLevelId] = Math.max(prev, stars);
  }

  for (let i = 0; i < 3; i++) {
    const s = document.createElement("span");
    s.className = "star" + ((i < stars) ? " filled" : "");
    s.textContent = "★";
    el.starRow.appendChild(s);
  }

  if (isWin && !activeLevel.endless) {
    const best = loadBestTimeForLevel();
    let bestNow = best;
    if (best === null || levelTime < best) {
      bestNow = levelTime;
      saveBestTimeForLevel(levelTime);
      if (runFrames.length > 10) saveGhostBestForLevel(runFrames.slice());
    }
    const bestTxt = bestNow === null ? "—" : bestNow.toFixed(1) + "s";
    el.resultText.textContent = `Time: ${levelTime.toFixed(1)}s • Par: ${activeLevel.parTime}s • Best: ${bestTxt}`;
  } else if (activeLevel.endless) {
    el.resultText.textContent = `Endless distance: ${Math.floor(distanceRun)}m • Time: ${levelTime.toFixed(1)}s`;
  } else {
    const best = loadBestTimeForLevel();
    const bestText = best === null ? "chưa có" : best.toFixed(1) + "s";
    el.resultText.textContent = `Bạn đã thua ở: ${activeLevel.name} • Best: ${bestText}`;
  }

  const bonus = walletBonus(isWin, stars);
  const earned = coinsRun + bonus;

  el.resultExtra.textContent =
    `Run Coins: ${coinsRun} • Bonus: ${bonus} • Wallet +${earned} • Score: ${scoreRun}`;

  stats.runs += 1;
  stats.distance += distanceRun;
  stats.runCoins += coinsRun;
  stats.wallet += earned;

  if (activeLevel.endless && mode === "DAILY") {
    stats.dailyBestDistance = Math.max(stats.dailyBestDistance, distanceRun);
  }
  stats.bestScore = Math.max(stats.bestScore, scoreRun);

  updateDailyOnRunEnd({
    isWin,
    mode,
    activeSet,
    distanceRun,
    coinsRun,
    scoreRun,
    levelTime
  });

  savePersisted();
  setHudStarsFromLevel();

  checkAchievements({
    firstWin: isWin && !activeLevel.endless && activeSet === "DEFAULT",
    runScore: scoreRun,
    dailyDistance: (activeLevel.endless && mode === "DAILY") ? distanceRun : 0
  });
}

// ===== Replay (Best ghost / Last run) =====
function startReplayBest() {
  if (!activeLevel || activeLevel.endless) return;
  loadGhostBestForLevel();
  if (!ghostFrames || ghostFrames.length < 10) return;

  replayFrames = ghostFrames;
  replayT = 0;
  gameState = "replay_best";
  el.resultPanel.classList.add("hidden");
  el.pausePanel.classList.add("hidden");
  lastT = nowMs();
}

function startReplayLast() {
  if (!activeLevel || activeLevel.endless) return;
  if (!lastRunFrames || lastRunFrames.length < 10) return;

  replayFrames = lastRunFrames;
  replayT = 0;
  gameState = "replay_last";
  el.resultPanel.classList.add("hidden");
  el.pausePanel.classList.add("hidden");
  lastT = nowMs();
}

function updateReplay(dt) {
  if (!replayFrames || replayFrames.length === 0) { gameState = "playing"; return; }
  replayT += dt;
  const lastFrame = replayFrames[replayFrames.length - 1];
  if (replayT >= lastFrame.t) {
    replayT = lastFrame.t;
    gameState = "playing";
    return;
  }
  let i = 0;
  while (i < replayFrames.length - 1 && replayFrames[i + 1].t < replayT) i++;
  const f = replayFrames[Math.min(i, replayFrames.length - 1)];
  car.x = f.x; car.y = f.y; car.angle = f.angle;
  car.vx = 0; car.vy = 0;
}

// ===== Gameplay update – LOGIC MỚI + JUMP =====
function updatePlaying(dt, rngForEndless) {
  const dxDist = Math.abs(car.x - lastCarX);
  distanceRun += dxDist / 10;
  lastCarX = car.x;

  const dailyMods = (activeSet === "DAILY" && activeDailyConfig && activeDailyConfig.modifiers)
    ? activeDailyConfig.modifiers
    : null;

  const accelMul = dailyMods ? (dailyMods.accelMul || 1) : 1;
  const nitroUseMul = dailyMods ? (dailyMods.nitroUseMul || 1) : 1;
  const nitroRegenMul = dailyMods ? (dailyMods.nitroRegenMul || 1) : 1;
  const fuelMul = dailyMods ? (dailyMods.fuelDrainMul || 1) : 1;
  const hazardRadius = 32 * (dailyMods ? (dailyMods.hazardRadiusMul || 1) : 1); // hơi nhỏ hơn bản cũ cho dễ tránh

  // input
  const keyLeft = keys["ArrowLeft"] || keys["KeyA"] || touchLeft;
  const keyRight = keys["ArrowRight"] || keys["KeyD"] || touchRight;
  const nitroKey = keys["ShiftLeft"] || keys["ShiftRight"] || touchNitro;

  let steer = 0;
  if (keyLeft) steer -= 1;
  if (keyRight) steer += 1;

  if (tiltEnabled) {
    steer += tiltValue * tiltSensitivity;
    steer = clamp(steer, -1, 1);
  }

  let accel = steer * BASE_ACCEL * accelMul;

  // jump
  let usedJump = false;
  if (jumpRequested && grounded && fuel > 0.05) {
    jumpVel = JUMP_SPEED;
    grounded = false;
    usedJump = true;
    beep(700, 0.08, 0.12);
  }
  jumpRequested = false; // luôn reset, phải bấm lại khi muốn nhảy lần nữa

  // nitro
  if (nitroKey && nitro > 0.05 && fuel > 0.05) {
    accel += (steer !== 0 ? Math.sign(steer) : 1) * TURBO_ACCEL * accelMul;
    nitro = Math.max(0, nitro - 0.65 * nitroUseMul * dt);
  } else {
    nitro = Math.min(1, nitro + 0.22 * nitroRegenMul * dt);
  }

  // fuel
  const speedFactor = 0.3 + Math.abs(car.vx) / 900;
  fuel = Math.max(0, fuel - dt * 0.05 * speedFactor * fuelMul);

  if (fuel <= 0.01) {
    accel = 0;
    car.vx *= 0.97;
    if (Math.abs(car.vx) < 20) {
      crash("FUEL");
      return;
    }
  }

  // apply accel
  car.vx += accel * dt;
  car.vx *= FRICTION;
  car.vx = clamp(car.vx, MAX_REV_SPEED, MAX_SPEED);

  // terrain sample
  const leftX = car.x - car.wheelOffsetX;
  const rightX = car.x + car.wheelOffsetX;
  const lg = sampleTerrain(activeLevel, leftX, rngForEndless);
  const rg = sampleTerrain(activeLevel, rightX, rngForEndless);
  const baseAngle = Math.atan2(rg.y - lg.y, rg.x - lg.x);
  const baseY = Math.min(lg.y, rg.y) - car.wheelOffsetY;

  // jump vertical offset
  if (!grounded) {
    jumpVel -= JUMP_GRAVITY * dt;
    jumpOffset += jumpVel * dt;
    if (jumpOffset <= 0) {
      jumpOffset = 0;
      jumpVel = 0;
      grounded = true;
    }
  }

  const targetY = baseY - jumpOffset;
  car.y += (targetY - car.y) * 0.35;

  // rotation
  if (grounded) {
    const delta = baseAngle - car.angle;
    car.angularVel += delta * 10 * dt;
    car.angularVel *= 0.4;
  } else {
    // trên không: cho phép xoay nhẹ theo steer
    car.angularVel += steer * 2.0 * dt;
    car.angularVel *= 0.99;
  }
  car.angle += car.angularVel;

  // move x
  car.x += car.vx * dt;

  const pts = activeLevel.terrain;
  if (!activeLevel.endless) {
    car.x = clamp(car.x, pts[0].x, pts[pts.length - 1].x);
  }

  // time
  levelTime += dt;

  // coins
  for (let i = 0; i < activeLevel.coins.length; i++) {
    if (coinTaken[i]) continue;
    const c = activeLevel.coins[i];
    const g = sampleTerrain(activeLevel, c.x, null);
    const cy = g.y + c.yOffset;
    if (dist(car.x, car.y, c.x, cy) < 40) {
      coinTaken[i] = true;
      let add = 1;
      const dm = dailyMods;
      if (dm && dm.coinValueMul) add = Math.max(1, Math.round(add * dm.coinValueMul));
      coinsRun += add;
      beep(1200, 0.08, 0.14);
    }
  }

  // fuel packs
  for (let i = 0; i < activeLevel.fuelPacks.length; i++) {
    if (fuelTaken[i]) continue;
    const f = activeLevel.fuelPacks[i];
    const g = sampleTerrain(activeLevel, f.x, null);
    const fy = g.y + f.yOffset;
    if (dist(car.x, car.y, f.x, fy) < 40) {
      fuelTaken[i] = true;
      fuel = Math.min(1, fuel + 0.35);
      beep(600, 0.08, 0.14);
    }
  }

  // hazards
  for (const hz of activeLevel.hazards) {
    const g = sampleTerrain(activeLevel, hz.x, null);
    const hx = hz.x, hy = g.y - 10;
    if (dist(car.x, car.y, hx, hy) < hazardRadius) {
      crash("CRASH");
      return;
    }
  }

  // checkpoint
  for (const cpX of activeLevel.checkpoints) {
    if (checkpointReached === cpX) continue;
    if (Math.abs(car.x - cpX) < 25) {
      checkpointReached = cpX;
      beep(900, 0.10, 0.14);
      break;
    }
  }

  // crash conditions
  if (Math.abs(car.angle) > ANGLE_CRASH_LIMIT && Math.abs(car.vx) > 80) {
    crash("CRASH");
    return;
  }
  if (car.y > canvas.height + 160) {
    crash("CRASH");
    return;
  }

  // finish
  if (!activeLevel.endless && activeLevel.finishX != null) {
    const distFinish = Math.abs(activeLevel.finishX - car.x);
    if (distFinish < 20 && Math.abs(car.vx) < 120) {
      win();
      return;
    }
  }

  // record frames
  runFrames.push({ t: levelTime, x: car.x, y: car.y, angle: car.angle });

  // score
  scoreRun = computeScore();
}

// ===== Rendering =====
function drawBackground() {
  const w = canvas.width, h = canvas.height;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8dd3ff");
  g.addColorStop(0.55, "#cdeeff");
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#6ca4d9";
  ctx.beginPath();
  ctx.moveTo(-80, h * 0.78);
  ctx.lineTo(w * 0.22, h * 0.42);
  ctx.lineTo(w * 0.52, h * 0.78);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.82);
  ctx.lineTo(w * 0.78, h * 0.36);
  ctx.lineTo(w + 100, h * 0.82);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const cloud = (x, y, cw, ch) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, cw, ch, ch / 2);
    else ctx.rect(x, y, cw, ch);
    ctx.fill();
  };
  cloud(80, 60, 120, 30);
  cloud(410, 90, 150, 34);
  cloud(780, 55, 130, 30);

  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(0, 0, w, h);
}

function withCamera(fn) {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  let sx = 0, sy = 0;
  if (camShake > 0.1) { sx = (Math.random() - 0.5) * camShake; sy = (Math.random() - 0.5) * camShake; }
  ctx.translate(sx, sy);

  ctx.scale(camZoom, camZoom);
  ctx.translate(-camX, -camY);

  fn();
  ctx.restore();
}

function drawTerrain(level) {
  const pts = level.terrain;
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#3f4f60";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#cfd9e5";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y - 4);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y - 4);
  ctx.stroke();
}

function drawFinish(level) {
  if (level.endless || level.finishX == null) return;
  const fg = sampleTerrain(level, level.finishX, null);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(level.finishX - 5, fg.y - 70, 10, 70);
  ctx.fillRect(level.finishX - 40, fg.y - 70, 80, 12);
}

function drawCheckpoints(level) {
  ctx.fillStyle = "#ffb347";
  for (const cpX of level.checkpoints) {
    const cp = sampleTerrain(level, cpX, null);
    ctx.fillRect(cpX - 3, cp.y - 40, 6, 40);
    ctx.beginPath();
    ctx.moveTo(cpX + 3, cp.y - 38);
    ctx.lineTo(cpX + 25, cp.y - 30);
    ctx.lineTo(cpX + 3, cp.y - 22);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHazards(level) {
  for (const hz of level.hazards) {
    const g = sampleTerrain(level, hz.x, null);
    const hx = hz.x, hy = g.y;
    ctx.fillStyle = "#ff5252";
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy);
    ctx.lineTo(hx, hy - 30);
    ctx.lineTo(hx + 10, hy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFuelPacks(level) {
  for (let i = 0; i < level.fuelPacks.length; i++) {
    if (fuelTaken[i]) continue;
    const f = level.fuelPacks[i];
    const g = sampleTerrain(level, f.x, null);
    const fx = f.x, fy = g.y + f.yOffset;
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(fx, fy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a5d6a7";
    ctx.fillRect(fx - 3, fy - 6, 6, 12);
  }
}

function drawCoins(level) {
  const t = performance.now() / 380;
  const pulse = Math.sin(t) * 4;
  for (let i = 0; i < level.coins.length; i++) {
    if (coinTaken[i]) continue;
    const c = level.coins[i];
    const g = sampleTerrain(level, c.x, null);
    const cx = c.x, cy = g.y + c.yOffset + pulse;
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGhost(level) {
  if (!ghostEnabled || level.endless || !ghostFrames || ghostFrames.length < 10) return;
  if (gameState !== "playing") return;

  const t = levelTime;
  let i = 0;
  while (i < ghostFrames.length - 1 && ghostFrames[i + 1].t < t) i++;
  const f = ghostFrames[Math.min(i, ghostFrames.length - 1)];
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.angle);
  ctx.globalAlpha = 0.35;
  drawCar(true);
  ctx.restore();
}

function drawCar(isGhost) {
  const skin = skins.find(s => s.id === skinId) || skins[0];
  const body = isGhost ? "#ffffff" : skin.body;
  const acc = isGhost ? "#d0d0d0" : skin.accent;

  ctx.fillStyle = body;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-car.width/2, -car.height/2, car.width, car.height, 8);
  else ctx.rect(-car.width/2, -car.height/2, car.width, car.height);
  ctx.fill();

  ctx.fillStyle = acc;
  ctx.fillRect(-car.width/2, -car.height/2 + 8, car.width, 6);

  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-car.width/2 + 14, -car.height/2 - 18, car.width*0.5, 24, 6);
  else ctx.rect(-car.width/2 + 14, -car.height/2 - 18, car.width*0.5, 24);
  ctx.fill();

  ctx.fillStyle = "#c7e6ff";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-car.width/2 + 18, -car.height/2 - 16, car.width*0.42, 18, 4);
  else ctx.rect(-car.width/2 + 18, -car.height/2 - 16, car.width*0.42, 18);
  ctx.fill();

  const wy = car.height / 2;
  drawWheel(-car.wheelOffsetX, wy);
  drawWheel(car.wheelOffsetX, wy);
}
function drawWheel(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#20222a";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111318";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#d0d5e4";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#9ca3b5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
  ctx.moveTo(0, -7); ctx.lineTo(0, 7);
  ctx.stroke();
  ctx.restore();
}

// ===== Minimap =====
function drawMinimapBase() {
  mctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  mctx.fillStyle = "rgba(0,0,0,0.45)";
  mctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
}
function drawMinimapDynamic() {
  if (!activeLevel) return;
  drawMinimapBase();

  if (activeLevel.endless) {
    const range = 1200;
    const minX = car.x - range / 2;
    const sx = minimapCanvas.width / range;

    mctx.strokeStyle = "#9fb7ff";
    mctx.lineWidth = 2;
    mctx.strokeRect(6, 8, minimapCanvas.width - 12, minimapCanvas.height - 16);

    mctx.fillStyle = "#ff5252";
    for (const hz of activeLevel.hazards) {
      const x = (hz.x - minX) * sx;
      if (x < 0 || x > minimapCanvas.width) continue;
      mctx.fillRect(x - 1, 14, 2, 10);
    }
    mctx.fillStyle = "#ffd54f";
    for (let i = 0; i < activeLevel.coins.length; i++) {
      if (coinTaken[i]) continue;
      const c = activeLevel.coins[i];
      const x = (c.x - minX) * sx;
      if (x < 0 || x > minimapCanvas.width) continue;
      mctx.fillRect(x - 1, 30, 2, 8);
    }

    const cx = (car.x - minX) * sx;
    mctx.fillStyle = "#46ff7a";
    mctx.beginPath();
    mctx.arc(cx, minimapCanvas.height / 2, 4, 0, Math.PI * 2);
    mctx.fill();
    return;
  }

  const pts = activeLevel.terrain;
  const minX = pts[0].x;
  const maxX = pts[pts.length - 1].x;
  const sx = minimapCanvas.width / (maxX - minX);

  mctx.strokeStyle = "#9fb7ff";
  mctx.lineWidth = 2;
  mctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = (pts[i].x - minX) * sx;
    const py = minimapCanvas.height - 6;
    if (i === 0) mctx.moveTo(px, py);
    else mctx.lineTo(px, py);
  }
  mctx.stroke();

  const fx = (activeLevel.finishX - minX) * sx;
  mctx.fillStyle = "#ffffff";
  mctx.fillRect(fx - 2, 10, 4, minimapCanvas.height - 20);

  mctx.fillStyle = "#ffb347";
  for (const cpX of activeLevel.checkpoints) {
    const cx = (cpX - minX) * sx;
    mctx.fillRect(cx - 2, 12, 4, minimapCanvas.height - 24);
  }

  const cx = (car.x - minX) * sx;
  mctx.fillStyle = "#46ff7a";
  mctx.beginPath();
  mctx.arc(cx, minimapCanvas.height / 2, 4, 0, Math.PI * 2);
  mctx.fill();
}

// ===== Editor (y như bản trước, giữ nguyên) =====
function openEditor() {
  mode = "CUSTOM";
  setModeLabel();
  gameState = "editor";
  hideAllPanels();
  el.editorPanel.classList.remove("hidden");

  customLevels = loadCustomLevels();
  syncEditorFormFromState();
  editorWriteJson();

  activeLevel = sanitizeLevel(editorToLevelObject(false), true);
  activeSet = "TEST";
  activeLevelId = "editor_preview";
  activeDailyConfig = null;
  coinTaken = activeLevel.coins.map(() => false);
  fuelTaken = activeLevel.fuelPacks.map(() => false);
  checkpointReached = null;

  const g = sampleTerrain(activeLevel, activeLevel.startX, null);
  car.x = activeLevel.startX;
  car.y = g.y - 30;
  car.vx = 0; car.vy = 0;
  car.angle = g.angle; car.angularVel = 0;

  grounded = true;
  jumpOffset = 0; jumpVel = 0; jumpRequested = false;

  setLevelLabel("Editor Preview");
  setHudStarsFromLevel();
  snapCamera();
  drawMinimapBase();
}

function closeEditor() { openMenu(); }

function syncEditorFormFromState() {
  el.editorName.value = editor.name;
  el.editorStartX.value = String(editor.startX);
  el.editorFinishX.value = String(editor.finishX);
  el.editorParTime.value = String(editor.parTime);
  el.editorSnap.checked = editor.snap;
  el.editorGrid.checked = editor.showGrid;
  for (const b of el.toolButtons) b.classList.toggle("active", b.dataset.tool === editor.tool);
}

function syncEditorStateFromForm() {
  editor.name = el.editorName.value.trim() || "My Custom Level";
  editor.startX = Number(el.editorStartX.value || 80);
  editor.finishX = Number(el.editorFinishX.value || 1100);
  editor.parTime = Number(el.editorParTime.value || 35);
  editor.snap = el.editorSnap.checked;
  editor.showGrid = el.editorGrid.checked;
}

function editorToLevelObject(withId) {
  const id = withId ? ("c_" + Math.random().toString(16).slice(2)) : "editor_preview";
  return {
    id,
    name: editor.name,
    startX: editor.startX,
    finishX: editor.finishX,
    parTime: editor.parTime,
    endless: false,
    terrain: editor.terrain.slice().map(p => ({x: p.x, y: p.y})),
    coins: editor.coins.slice().map(c => ({x: c.x, yOffset: c.yOffset})),
    hazards: editor.hazards.slice().map(h => ({x: h.x})),
    fuelPacks: editor.fuelPacks.slice().map(f => ({x: f.x, yOffset: f.yOffset})),
    checkpoints: editor.checkpoints.slice()
  };
}

function editorWriteJson() {
  const obj = editorToLevelObject(false);
  el.editorJson.value = JSON.stringify(obj, null, 2);
}

function editorLoadFromJson(jsonText) {
  const obj = safeJSONParse(jsonText, null);
  if (!obj) return false;
  const lv = sanitizeLevel(obj, true);

  editor.name = lv.name;
  editor.startX = lv.startX;
  editor.finishX = lv.finishX;
  editor.parTime = lv.parTime;
  editor.terrain = lv.terrain;
  editor.coins = lv.coins;
  editor.hazards = lv.hazards;
  editor.fuelPacks = lv.fuelPacks;
  editor.checkpoints = lv.checkpoints;

  syncEditorFormFromState();
  editorWriteJson();
  return true;
}

function editorNew() {
  editor = {
    tool: "terrain",
    snap: true,
    showGrid: true,
    draggingPointRef: null,
    hoveredPointRef: null,
    terrain: [{x: 0, y: 420}, {x: 300, y: 380}, {x: 650, y: 420}, {x: 1100, y: 420}],
    coins: [{x: 350, yOffset: -80}],
    hazards: [{x: 720}],
    fuelPacks: [{x: 500, yOffset: -40}],
    checkpoints: [650],
    startX: 80,
    finishX: 1100,
    parTime: 35,
    name: "My Custom Level"
  };
  syncEditorFormFromState();
  editorWriteJson();
}

function editorSaveCustom() {
  syncEditorStateFromForm();
  const lv = sanitizeLevel(editorToLevelObject(true), true);
  const list = loadCustomLevels();
  list.push(lv);
  saveCustomLevels(list);
  customLevels = list;
  editorWriteJson();
  checkAchievements({ customCount: list.length });
  beep(1000, 0.10, 0.12);
}

function editorTestPlay() {
  syncEditorStateFromForm();
  const lv = sanitizeLevel(editorToLevelObject(false), true);
  mode = "TEST_EDITOR";
  setModeLabel();
  startLevel(lv, "TEST", 0);
}

// Editor helper transforms
function screenToWorld(sx, sy) {
  const rect = canvas.getBoundingClientRect();
  const cx = sx - rect.left;
  const cy = sy - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = cx * scaleX;
  const py = cy * scaleY;
  return {
    x: (px - canvas.width / 2) / camZoom + camX,
    y: (py - canvas.height / 2) / camZoom + camY
  };
}
function snapValue(v, grid = 20) { return Math.round(v / grid) * grid; }
function editorHitPoint(wx, wy) {
  let best = null;
  let bestD = 9999;
  for (const p of editor.terrain) {
    const d = dist(wx, wy, p.x, p.y);
    if (d < 18 && d < bestD) { bestD = d; best = p; }
  }
  return best;
}
function sampleEditorTerrainY(x) {
  const pts = editor.terrain.slice().sort((a,b)=>a.x-b.x);
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i+1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[0].y;
}
function editorEraseAt(wx, wy) {
  const near = (x, y) => dist(wx, wy, x, y) < 22;

  for (let i = 0; i < editor.coins.length; i++) {
    const c = editor.coins[i];
    const y = sampleEditorTerrainY(c.x) + c.yOffset;
    if (near(c.x, y)) { editor.coins.splice(i, 1); return true; }
  }
  for (let i = 0; i < editor.fuelPacks.length; i++) {
    const f = editor.fuelPacks[i];
    const y = sampleEditorTerrainY(f.x) + f.yOffset;
    if (near(f.x, y)) { editor.fuelPacks.splice(i, 1); return true; }
  }
  for (let i = 0; i < editor.hazards.length; i++) {
    const h = editor.hazards[i];
    const y = sampleEditorTerrainY(h.x) - 10;
    if (near(h.x, y)) { editor.hazards.splice(i, 1); return true; }
  }
  for (let i = 0; i < editor.checkpoints.length; i++) {
    const x = editor.checkpoints[i];
    const y = sampleEditorTerrainY(x) - 20;
    if (near(x, y)) { editor.checkpoints.splice(i, 1); return true; }
  }
  const fy = sampleEditorTerrainY(editor.finishX) - 40;
  if (near(editor.finishX, fy)) {
    editor.finishX = editor.startX + 1000;
    el.editorFinishX.value = String(editor.finishX);
    return true;
  }
  return false;
}

let pointerDown = false;
let pointerId = null;

canvas.addEventListener("pointerdown", (e) => {
  if (gameState !== "editor") return;
  pointerDown = true;
  pointerId = e.pointerId;
  canvas.setPointerCapture(pointerId);

  syncEditorStateFromForm();
  const {x: wx, y: wy} = screenToWorld(e.clientX, e.clientY);
  const shift = e.shiftKey;

  if (editor.tool === "terrain") {
    const hit = editorHitPoint(wx, wy);
    if (hit) {
      if (shift) {
        if (editor.terrain.length > 2) editor.terrain = editor.terrain.filter(p => p !== hit);
      } else {
        editor.draggingPointRef = hit;
      }
    } else {
      const nx = editor.snap ? snapValue(wx) : wx;
      const ny = editor.snap ? snapValue(wy) : wy;
      editor.terrain.push({ x: nx, y: clamp(ny, 260, 560) });
      editor.terrain.sort((a,b)=>a.x-b.x);
      editor.draggingPointRef = editorHitPoint(nx, ny);
    }
    editorWriteJson();
    activeLevel = sanitizeLevel(editorToLevelObject(false), true);
    return;
  }

  if (editor.tool === "erase") {
    if (editorEraseAt(wx, wy)) {
      editorWriteJson();
      activeLevel = sanitizeLevel(editorToLevelObject(false), true);
    }
    return;
  }

  const placeX = editor.snap ? snapValue(wx) : wx;

  if (editor.tool === "coin") { editor.coins.push({ x: placeX, yOffset: -80 }); }
  if (editor.tool === "hazard") { editor.hazards.push({ x: placeX }); }
  if (editor.tool === "fuel") { editor.fuelPacks.push({ x: placeX, yOffset: -40 }); }
  if (editor.tool === "checkpoint") {
    editor.checkpoints.push(placeX);
    editor.checkpoints = Array.from(new Set(editor.checkpoints)).sort((a,b)=>a-b);
  }
  if (editor.tool === "finish") {
    editor.finishX = placeX;
    el.editorFinishX.value = String(editor.finishX);
  }

  editorWriteJson();
  activeLevel = sanitizeLevel(editorToLevelObject(false), true);
});

canvas.addEventListener("pointermove", (e) => {
  if (gameState !== "editor") return;
  const {x: wx, y: wy} = screenToWorld(e.clientX, e.clientY);
  editor.hoveredPointRef = editorHitPoint(wx, wy);

  if (!pointerDown) return;
  if (editor.tool !== "terrain") return;
  if (!editor.draggingPointRef) return;

  let nx = editor.snap ? snapValue(wx) : wx;
  let ny = editor.snap ? snapValue(wy) : wy;
  ny = clamp(ny, 260, 560);

  const sorted = editor.terrain.slice().sort((a,b)=>a.x-b.x);
  const idx = sorted.indexOf(editor.draggingPointRef);
  const left = sorted[idx - 1];
  const right = sorted[idx + 1];
  if (left) nx = Math.max(nx, left.x + 20);
  if (right) nx = Math.min(nx, right.x - 20);

  editor.draggingPointRef.x = nx;
  editor.draggingPointRef.y = ny;
  editor.terrain.sort((a,b)=>a.x-b.x);

  editorWriteJson();
  activeLevel = sanitizeLevel(editorToLevelObject(false), true);
});

canvas.addEventListener("pointerup", () => {
  if (gameState !== "editor") return;
  pointerDown = false;
  editor.draggingPointRef = null;
  if (pointerId != null) { try { canvas.releasePointerCapture(pointerId); } catch {} }
  pointerId = null;
});

function editorRenderOverlay() {
  if (gameState !== "editor") return;

  withCamera(() => {
    if (editor.showGrid) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = "#cfe7ff";
      ctx.lineWidth = 1;

      const step = 40;
      const left = camX - canvas.width / 2 / camZoom;
      const right = camX + canvas.width / 2 / camZoom;
      const top = camY - canvas.height / 2 / camZoom;
      const bottom = camY + canvas.height / 2 / camZoom;

      const startX = Math.floor(left / step) * step;
      const endX = Math.floor(right / step) * step;
      const startY = Math.floor(top / step) * step;
      const endY = Math.floor(bottom / step) * step;

      for (let x = startX; x <= endX; x += step) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
      for (let y = startY; y <= endY; y += step) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
      ctx.restore();
    }

    for (const p of editor.terrain) {
      ctx.save();
      ctx.fillStyle = (p === editor.hoveredPointRef) ? "rgba(59,224,255,0.95)" : "rgba(70,255,122,0.85)";
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const sy = sampleEditorTerrainY(editor.startX);
    ctx.fillStyle = "#46ff7a";
    ctx.fillRect(editor.startX - 3, sy - 40, 6, 40);

    const fy = sampleEditorTerrainY(editor.finishX);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(editor.finishX - 4, fy - 70, 8, 70);
    ctx.fillRect(editor.finishX - 30, fy - 70, 60, 10);
  });
}

// Editor tool UI
for (const b of el.toolButtons) {
  b.addEventListener("click", () => {
    editor.tool = b.dataset.tool;
    for (const x of el.toolButtons) x.classList.toggle("active", x === b);
  });
}
el.editorSnap.addEventListener("change", () => { editor.snap = el.editorSnap.checked; });
el.editorGrid.addEventListener("change", () => { editor.showGrid = el.editorGrid.checked; });
el.editorName.addEventListener("input", () => { editor.name = el.editorName.value; editorWriteJson(); });
el.editorStartX.addEventListener("input", () => { editor.startX = Number(el.editorStartX.value || 80); editorWriteJson(); });
el.editorFinishX.addEventListener("input", () => { editor.finishX = Number(el.editorFinishX.value || 1100); editorWriteJson(); });
el.editorParTime.addEventListener("input", () => { editor.parTime = Number(el.editorParTime.value || 35); editorWriteJson(); });

el.btnEditorNew.addEventListener("click", () => editorNew());
el.btnEditorTest.addEventListener("click", () => editorTestPlay());
el.btnEditorSave.addEventListener("click", () => editorSaveCustom());
el.btnEditorExport.addEventListener("click", () => { syncEditorStateFromForm(); editorWriteJson(); });
el.btnEditorImport.addEventListener("click", () => { if (editorLoadFromJson(el.editorJson.value)) beep(900, 0.10, 0.12); });
el.btnEditorClose.addEventListener("click", () => closeEditor());

// ===== Main loop =====
function loop(t) {
  if (!lastT) lastT = t;
  const dt = clamp((t - lastT) / 1000, 0, 0.05);
  lastT = t;

  drawBackground();

  if (activeLevel) {
    let rng = null;
    if (activeSet === "DAILY" && activeLevel.endless) {
      const base = dateSeedYYYYMMDD(new Date());
      rng = makeRng(base);
    }

    if (gameState === "playing") {
      updatePlaying(dt, rng);
      updateCamera(dt);
      updateEngine();
      drawMinimapDynamic();
      updateHud();
    } else if (gameState === "replay_best" || gameState === "replay_last") {
      updateReplay(dt);
      updateCamera(dt);
      updateEngine();
      drawMinimapDynamic();
      updateHud();
    } else {
      updateEngine();
      drawMinimapDynamic();
      updateHud();
    }

    withCamera(() => {
      drawTerrain(activeLevel);
      drawFinish(activeLevel);
      drawCheckpoints(activeLevel);
      drawHazards(activeLevel);
      drawFuelPacks(activeLevel);
      drawCoins(activeLevel);
      drawGhost(activeLevel);

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      drawCar(false);
      ctx.restore();
    });

    editorRenderOverlay();
  }
  requestAnimationFrame(loop);
}

// ===== Boot =====
function init() {
  loadPersisted();
  initDailySystem();
  applyDifficulty();

  el.difficultySelect.value = difficulty;
  el.toggleGhost.checked = ghostEnabled;
  el.toggleEngine.checked = engineSoundEnabled;
  el.toggleTilt.checked = tiltEnabled;
  el.tiltSensitivity.value = String(tiltSensitivity);

  customLevels = loadCustomLevels();
  setTab("DEFAULT");

  openMenu();
  activeLevel = sanitizeLevel(defaultLevels[0], false);
  activeSet = "DEFAULT";
  activeLevelId = activeLevel.id;
  activeDailyConfig = null;
  coinTaken = activeLevel.coins.map(() => false);
  fuelTaken = activeLevel.fuelPacks.map(() => false);
  checkpointReached = null;

  const g = sampleTerrain(activeLevel, activeLevel.startX, null);
  car.x = activeLevel.startX;
  car.y = g.y - 30;
  car.vx = 0; car.vy = 0;
  car.angle = g.angle; car.angularVel = 0;

  grounded = true;
  jumpOffset = 0; jumpVel = 0; jumpRequested = false;

  snapCamera();
  drawMinimapBase();
  updateHud();
  requestAnimationFrame(loop);
}

init();
