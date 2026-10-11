import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var firebaseConfig = {
  apiKey: "AIzaSyBFd3-V9Z5ZUoY88stkrKDDogRw8vS1HtE",
  authDomain: "solo-leveling-65764.firebaseapp.com",
  projectId: "solo-leveling-65764",
  storageBucket: "solo-leveling-65764.firebasestorage.app",
  messagingSenderId: "506804094047",
  appId: "1:506804094047:web:6932fe9cf26697811607ea"
};

var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);

var MAX_ACTIVE = 10;
var GATE_XP = { E: 50, D: 100, C: 150, B: 250, A: 400, S: 600 };
var STAT_NAMES = ["STR", "AGI", "INT", "VIT"];

var SHADOWS = [
  { level: 5, name: "Igris", role: "Shadow Knight" },
  { level: 10, name: "Iron", role: "Shadow Soldier" },
  { level: 15, name: "Tusk", role: "Shadow Mage" },
  { level: 20, name: "Beru", role: "Shadow Beast" },
  { level: 25, name: "Bellion", role: "Shadow Marshal" },
  { level: 30, name: "Kaisel", role: "Shadow Dragon" }
];

var TITLES = [
  { id: "first", name: "Awakened", desc: "Complete your first quest", test: function () { return data.totalQuests >= 1; } },
  { id: "q100", name: "Relentless", desc: "Complete 100 quests", test: function () { return data.totalQuests >= 100; } },
  { id: "s7", name: "Early Riser", desc: "Reach a 7-day streak", test: function () { return data.streak >= 7; } },
  { id: "s30", name: "Iron Will", desc: "Reach a 30-day streak", test: function () { return data.streak >= 30; } },
  { id: "g1", name: "Gate Breaker", desc: "Clear your first gate", test: function () { return data.gatesCleared >= 1; } },
  { id: "g10", name: "Dungeon Master", desc: "Clear 10 gates", test: function () { return data.gatesCleared >= 10; } },
  { id: "str", name: "Mighty", desc: "Reach 20 STR", test: function () { return data.stats.STR >= 20; } },
  { id: "agi", name: "Swift", desc: "Reach 20 AGI", test: function () { return data.stats.AGI >= 20; } },
  { id: "int", name: "Scholar", desc: "Reach 20 INT", test: function () { return data.stats.INT >= 20; } },
  { id: "vit", name: "Unbreakable", desc: "Reach 20 VIT", test: function () { return data.stats.VIT >= 20; } },
  { id: "l10", name: "Rising Hunter", desc: "Reach Level 10", test: function () { return data.level >= 10; } },
  { id: "l25", name: "Shadow Monarch", desc: "Reach Level 25", test: function () { return data.level >= 25; } }
];

function defaultData() {
  return {
    level: 1,
    xp: 0,
    stats: { STR: 0, AGI: 0, INT: 0, VIT: 0 },
    active: [],
    completed: {},
    totalQuests: 0,
    gates: [],
    gatesDone: [],
    gatesCleared: 0,
    titles: [],
    equipped: "",
    lastDate: "",
    streak: 0,
    sound: true
  };
}

var data = defaultData();
var user = null;
var loaded = false;
var filter = "ALL";
var saveTimer = null;

/* ---------- small helpers ---------- */

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  $(id).innerText = text;
}

function today() {
  return new Date().toDateString();
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showScreen(name) {
  var ids = ["loading", "loginScreen", "app"];
  for (var i = 0; i < ids.length; i++) {
    $(ids[i]).style.display = (ids[i] === name) ? "block" : "none";
  }
}

/* ---------- loading and saving (online) ---------- */

function normalize() {
  var base = defaultData();
  for (var k in base) {
    if (data[k] === undefined || data[k] === null) data[k] = base[k];
  }
  for (var n = 0; n < STAT_NAMES.length; n++) {
    if (!data.stats[STAT_NAMES[n]]) data.stats[STAT_NAMES[n]] = 0;
  }
  if (!Array.isArray(data.active)) data.active = [];
  if (!Array.isArray(data.gates)) data.gates = [];
  if (!Array.isArray(data.gatesDone)) data.gatesDone = [];
  if (!Array.isArray(data.titles)) data.titles = [];
}

function importOld() {
  try {
    var old = JSON.parse(localStorage.getItem("system-data"));
    if (old && old.level) {
      var keep = ["level", "xp", "stats", "streak", "titles", "equipped", "totalQuests", "gatesCleared", "sound", "lastDate"];
      for (var i = 0; i < keep.length; i++) {
        if (old[keep[i]] !== undefined) data[keep[i]] = old[keep[i]];
      }
    }
  } catch (e) {}
}

async function loadData() {
  data = defaultData();
  var snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    var saved = snap.data();
    for (var k in saved) { data[k] = saved[k]; }
  } else {
    importOld();
  }
  normalize();
}

async function flush() {
  clearTimeout(saveTimer);
  if (!user || !loaded) return;
  try {
    await setDoc(doc(db, "users", user.uid), JSON.parse(JSON.stringify(data)));
    setText("saveStatus", "Saved online");
  } catch (e) {
    setText("saveStatus", "Save failed. Check your internet.");
  }
}

function save() {
  if (!user || !loaded) return;
  setText("saveStatus", "Saving...");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 500);
}

/* ---------- login ---------- */

async function signIn() {
  setText("loginError", "");
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
    setText("loginError", "Login failed (" + (e.code || e.message) + "). If you opened this from the Home Screen, open the site in Safari to log in.");
  }
}

async function doSignOut() {
  await flush();
  await signOut(auth);
}

onAuthStateChanged(auth, async function (u) {
  if (u) {
    user = u;
    loaded = false;
    showScreen("loading");
    try {
      await loadData();
      loaded = true;
      dailyCheck();
      checkTitles();
      await flush();
      showScreen("app");
      draw();
    } catch (e) {
      setText("loginError", "Could not load your data (" + (e.code || e.message) + "). Check the Firestore settings.");
      loaded = false;
      await signOut(auth);
    }
  } else {
    user = null;
    loaded = false;
    data = defaultData();
    showScreen("loginScreen");
  }
});

/* ---------- sound ---------- */

var audioCtx = null;

function getCtx() {
  if (!data.sound) return null;
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function tone(ctx, freq, start, dur, type, vol) {
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  var t = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function playSound(kind) {
  var ctx = getCtx();
  if (!ctx) return;
  if (kind === "quest") {
    tone(ctx, 660, 0, 0.12, "sine", 0.2);
    tone(ctx, 880, 0.1, 0.18, "sine", 0.2);
  } else if (kind === "gate") {
    tone(ctx, 440, 0, 0.15, "triangle", 0.25);
    tone(ctx, 660, 0.13, 0.15, "triangle", 0.25);
    tone(ctx, 990, 0.26, 0.3, "triangle", 0.25);
  } else if (kind === "levelup") {
    tone(ctx, 523, 0, 0.18, "square", 0.12);
    tone(ctx, 659, 0.15, 0.18, "square", 0.12);
    tone(ctx, 784, 0.3, 0.18, "square", 0.12);
    tone(ctx, 1047, 0.45, 0.5, "square", 0.12);
  } else if (kind === "title") {
    tone(ctx, 784, 0, 0.15, "sine", 0.2);
    tone(ctx, 1175, 0.12, 0.35, "sine", 0.2);
  }
}

function toggleSound() {
  data.sound = !data.sound;
  save();
  draw();
  if (data.sound) playSound("quest");
}

/* ---------- notices and effects ---------- */

function notify(text, good) {
  var box = $("notices");
  var d = document.createElement("div");
  d.className = good ? "notice good" : "notice";
  d.innerText = text;
  d.onclick = function () {
    if (d.parentNode) d.parentNode.removeChild(d);
  };
  box.appendChild(d);
  setTimeout(function () {
    if (d.parentNode) d.parentNode.removeChild(d);
  }, 9000);
}

function pulseBar() {
  var bar = $("bar");
  bar.classList.add("pulse");
  setTimeout(function () { bar.classList.remove("pulse"); }, 700);
}

function showLevelUp() {
  setText("luLevel", "Level " + data.level);
  setText("luRank", getRank());
  $("levelup").style.display = "flex";
}

function closeLevelUp() {
  $("levelup").style.display = "none";
}

/* ---------- game logic ---------- */

function getRank() {
  var l = data.level;
  if (l >= 25) return "S-Rank";
  if (l >= 20) return "A-Rank";
  if (l >= 15) return "B-Rank";
  if (l >= 10) return "C-Rank";
  if (l >= 5) return "D-Rank";
  return "E-Rank";
}

function addXP(amount) {
  var oldLevel = data.level;
  data.xp = data.xp + amount;
  while (data.xp >= data.level * 100) {
    data.xp = data.xp - data.level * 100;
    data.level = data.level + 1;
  }
  if (data.level > oldLevel) {
    for (var i = 0; i < SHADOWS.length; i++) {
      var s = SHADOWS[i];
      if (s.level > oldLevel && s.level <= data.level) {
        notify("SHADOW EXTRACTED: " + s.name + " (" + s.role + ")", true);
      }
    }
    showLevelUp();
    playSound("levelup");
    return true;
  }
  return false;
}

function checkTitles() {
  for (var i = 0; i < TITLES.length; i++) {
    var t = TITLES[i];
    if (data.titles.indexOf(t.id) === -1 && t.test()) {
      data.titles.push(t.id);
      if (!data.equipped) data.equipped = t.id;
      notify("TITLE UNLOCKED: " + t.name, true);
      playSound("title");
    }
  }
}

function equipTitle(id) {
  data.equipped = id;
  save();
  draw();
}

function dailyCheck() {
  var t = today();
  if (data.lastDate === "") {
    data.lastDate = t;
    return;
  }
  if (data.lastDate === t) return;

  var total = data.active.length;
  var missed = 0;
  for (var i = 0; i < data.active.length; i++) {
    if (!data.active[i].done) missed++;
  }
  data.active = [];

  if (total > 0 && missed > 0) {
    var loss = missed * 15;
    data.xp = Math.max(0, data.xp - loss);
    data.streak = 0;
    notify("PENALTY: You skipped " + missed + " quest(s). -" + loss + " XP.", false);
  } else if (total > 0) {
    data.streak = data.streak + 1;
    notify("All quests cleared yesterday. Streak: " + data.streak, true);
  }

  data.lastDate = t;
}

/* ---------- quests (accept and finish only) ---------- */

function findActive(id) {
  for (var i = 0; i < data.active.length; i++) {
    if (data.active[i].id === id) return i;
  }
  return -1;
}

function acceptQuest(id) {
  if (!QUEST_MAP[id]) return;
  if (findActive(id) !== -1) return;
  if (data.active.length >= MAX_ACTIVE) {
    notify("You can only accept " + MAX_ACTIVE + " quests per day.", false);
    return;
  }
  data.active.push({ id: id, done: false });
  save();
  draw();
}

function dropQuest(id) {
  var i = findActive(id);
  if (i === -1 || data.active[i].done) return;
  data.active.splice(i, 1);
  save();
  draw();
}

function completeQuest(id) {
  var i = findActive(id);
  if (i === -1 || data.active[i].done) return;
  var q = QUEST_MAP[id];
  if (!q) return;
  data.active[i].done = true;
  data.totalQuests = data.totalQuests + 1;
  data.completed[id] = (data.completed[id] || 0) + 1;
  data.stats[q.stat] = (data.stats[q.stat] || 0) + 1;
  var leveled = addXP(20);
  if (!leveled) playSound("quest");
  pulseBar();
  checkTitles();
  save();
  draw();
}

function setFilter(value) {
  filter = value;
  draw();
}

/* ---------- gates (accept and finish only) ---------- */

function acceptGate(id) {
  if (!GATE_MAP[id]) return;
  if (data.gates.indexOf(id) !== -1 || data.gatesDone.indexOf(id) !== -1) return;
  data.gates.push(id);
  save();
  draw();
}

function dropGate(id) {
  var i = data.gates.indexOf(id);
  if (i === -1) return;
  data.gates.splice(i, 1);
  save();
  draw();
}

function clearGate(id) {
  var i = data.gates.indexOf(id);
  var g = GATE_MAP[id];
  if (i === -1 || !g) return;
  var xp = GATE_XP[g.rank] || 50;
  data.gates.splice(i, 1);
  data.gatesDone.push(id);
  data.gatesCleared = data.gatesCleared + 1;
  data.stats[g.stat] = (data.stats[g.stat] || 0) + 3;
  notify("GATE CLEARED: +" + xp + " XP, +3 " + g.stat, true);
  var leveled = addXP(xp);
  if (!leveled) playSound("gate");
  pulseBar();
  checkTitles();
  save();
  draw();
}

/* ---------- reset ---------- */

async function resetAll() {
  if (!confirm("Delete all progress on your account and start over?")) return;
  data = defaultData();
  data.lastDate = today();
  await flush();
  draw();
}

/* ---------- drawing the screen ---------- */

function draw() {
  if (!user) return;
  var need = data.level * 100;

  setText("playerName", user.displayName || "Player");
  setText("level", data.level);
  setText("rank", getRank());
  setText("xp", data.xp);
  setText("need", need);
  setText("streak", data.streak);
  $("fill").style.width = (data.xp / need * 100) + "%";
  setText("gatesCleared", data.gatesCleared);
  setText("activeCount", data.active.length);
  setText("soundBtn", "Sound: " + (data.sound ? "ON" : "OFF"));

  var titleName = "No title yet";
  for (var ti = 0; ti < TITLES.length; ti++) {
    if (TITLES[ti].id === data.equipped) titleName = "[ " + TITLES[ti].name + " ]";
  }
  setText("titleLine", titleName);

  for (var n = 0; n < STAT_NAMES.length; n++) {
    setText(STAT_NAMES[n], data.stats[STAT_NAMES[n]] || 0);
  }

  /* today's accepted quests */
  var ah = "";
  var activeIds = {};
  for (var i = 0; i < data.active.length; i++) {
    var a = data.active[i];
    var q = QUEST_MAP[a.id];
    if (!q) continue;
    activeIds[a.id] = true;
    ah += '<div class="quest ' + (a.done ? "done" : "") + '">';
    ah += '<div><span>' + esc(q.text) + '</span><small>+1 ' + q.stat + '</small></div><div>';
    if (a.done) {
      ah += '<span class="tag">CLEARED</span>';
    } else {
      ah += '<button onclick="completeQuest(\'' + a.id + '\')">Done</button> ';
      ah += '<button class="ghost" onclick="dropQuest(\'' + a.id + '\')">X</button>';
    }
    ah += '</div></div>';
  }
  if (ah === "") {
    ah = '<p class="hint">No quests accepted yet. Open the Quest Board below and accept some.</p>';
  }
  $("activeList").innerHTML = ah;

  /* quest board */
  var bh = "";
  for (var b = 0; b < QUESTS.length; b++) {
    var bq = QUESTS[b];
    if (filter !== "ALL" && bq.stat !== filter) continue;
    if (activeIds[bq.id]) continue;
    var times = data.completed[bq.id] || 0;
    bh += '<div class="row"><div><span>' + esc(bq.text) + '</span>';
    bh += '<small>+1 ' + bq.stat + (times ? ' | completed ' + times + 'x' : '') + '</small></div>';
    bh += '<button onclick="acceptQuest(\'' + bq.id + '\')">Accept</button></div>';
  }
  if (bh === "") bh = '<p class="hint">Nothing left on the board for this filter.</p>';
  $("boardList").innerHTML = bh;

  /* accepted gates */
  var gh = "";
  for (var j = 0; j < data.gates.length; j++) {
    var g = GATE_MAP[data.gates[j]];
    if (!g) continue;
    gh += '<div class="quest"><div><span>[' + g.rank + '] ' + esc(g.text) + '</span>';
    gh += '<small>+' + (GATE_XP[g.rank] || 50) + ' XP, +3 ' + g.stat + '</small></div><div>';
    gh += '<button onclick="clearGate(\'' + g.id + '\')">Clear</button> ';
    gh += '<button class="ghost" onclick="dropGate(\'' + g.id + '\')">X</button></div></div>';
  }
  if (gh === "") gh = '<p class="hint">No gate accepted.</p>';
  $("activeGates").innerHTML = gh;

  /* gate board */
  var gb = "";
  for (var k = 0; k < GATES.length; k++) {
    var gt = GATES[k];
    if (data.gates.indexOf(gt.id) !== -1 || data.gatesDone.indexOf(gt.id) !== -1) continue;
    gb += '<div class="row"><div><span>[' + gt.rank + '] ' + esc(gt.text) + '</span>';
    gb += '<small>+' + (GATE_XP[gt.rank] || 50) + ' XP, +3 ' + gt.stat + '</small></div>';
    gb += '<button onclick="acceptGate(\'' + gt.id + '\')">Accept</button></div>';
  }
  if (gb === "") gb = '<p class="hint">You cleared every gate. New ones will come.</p>';
  $("gateBoard").innerHTML = gb;

  /* titles */
  var th = "";
  for (var m = 0; m < TITLES.length; m++) {
    var t = TITLES[m];
    var has = data.titles.indexOf(t.id) !== -1;
    th += '<div class="row' + (has ? "" : " locked") + '">';
    th += '<div><b>' + (has ? t.name : "???") + '</b><small>' + t.desc + '</small></div>';
    if (has) {
      if (data.equipped === t.id) {
        th += '<span class="tag">EQUIPPED</span>';
      } else {
        th += '<button onclick="equipTitle(\'' + t.id + '\')">Equip</button>';
      }
    }
    th += '</div>';
  }
  $("titleList").innerHTML = th;
  setText("titleCount", data.titles.length + "/" + TITLES.length);

  /* shadow army */
  var sh = "";
  var owned = 0;
  for (var p = 0; p < SHADOWS.length; p++) {
    var s = SHADOWS[p];
    var unlocked = data.level >= s.level;
    if (unlocked) owned++;
    sh += '<div class="row' + (unlocked ? "" : " locked") + '">';
    if (unlocked) {
      sh += '<div><b>' + s.name + '</b><small>' + s.role + '</small></div>';
      sh += '<span class="tag">LV ' + s.level + '</span>';
    } else {
      sh += '<div><b>???</b><small>Unlocks at Level ' + s.level + '</small></div>';
    }
    sh += '</div>';
  }
  $("shadowList").innerHTML = sh;
  setText("shadowCount", owned + "/" + SHADOWS.length);
}

/* ---------- connect buttons in the page to the code ---------- */

Object.assign(window, {
  signIn: signIn,
  doSignOut: doSignOut,
  acceptQuest: acceptQuest,
  dropQuest: dropQuest,
  completeQuest: completeQuest,
  acceptGate: acceptGate,
  dropGate: dropGate,
  clearGate: clearGate,
  setFilter: setFilter,
  equipTitle: equipTitle,
  toggleSound: toggleSound,
  resetAll: resetAll,
  closeLevelUp: closeLevelUp
});

document.addEventListener("visibilitychange", function () {
  if (!user || !loaded) return;
  if (document.hidden) {
    flush();
  } else {
    dailyCheck();
    checkTitles();
    save();
    draw();
  }
});
