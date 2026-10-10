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

var data = {
  level: 1,
  xp: 0,
  stats: { STR: 0, AGI: 0, INT: 0, VIT: 0 },
  quests: [],
  gates: [],
  gatesCleared: 0,
  totalQuests: 0,
  titles: [],
  equipped: "",
  lastDate: "",
  streak: 0,
  sound: true
};

/* ---------- saving and loading ---------- */

function today() {
  return new Date().toDateString();
}

function load() {
  try {
    var saved = JSON.parse(localStorage.getItem("system-data"));
    if (saved) {
      for (var k in saved) { data[k] = saved[k]; }
    }
  } catch (e) {}

  if (!data.stats) data.stats = {};
  for (var n = 0; n < STAT_NAMES.length; n++) {
    if (!data.stats[STAT_NAMES[n]]) data.stats[STAT_NAMES[n]] = 0;
  }
  if (!data.quests) data.quests = [];
  if (!data.gates) data.gates = [];
  if (!data.titles) data.titles = [];
  for (var i = 0; i < data.quests.length; i++) {
    if (!data.quests[i].stat) data.quests[i].stat = "INT";
  }
}

function save() {
  try {
    localStorage.setItem("system-data", JSON.stringify(data));
  } catch (e) {}
}

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
  var box = document.getElementById("notices");
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
  var bar = document.getElementById("bar");
  bar.classList.add("pulse");
  setTimeout(function () { bar.classList.remove("pulse"); }, 700);
}

function showLevelUp() {
  document.getElementById("luLevel").innerText = "Level " + data.level;
  document.getElementById("luRank").innerText = getRank();
  document.getElementById("levelup").style.display = "flex";
}

function closeLevelUp() {
  document.getElementById("levelup").style.display = "none";
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

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  var total = data.quests.length;
  var missed = 0;
  for (var i = 0; i < data.quests.length; i++) {
    if (!data.quests[i].done) missed++;
    data.quests[i].done = false;
  }

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

/* ---------- quests ---------- */

function addQuest() {
  var box = document.getElementById("newQuest");
  var text = box.value.trim();
  if (text === "") return;
  var stat = document.getElementById("questStat").value;
  data.quests.push({ text: text, stat: stat, done: false });
  box.value = "";
  save();
  draw();
}

function completeQuest(i) {
  var q = data.quests[i];
  if (!q || q.done) return;
  q.done = true;
  data.totalQuests = data.totalQuests + 1;
  data.stats[q.stat] = (data.stats[q.stat] || 0) + 1;
  var leveled = addXP(20);
  if (!leveled) playSound("quest");
  pulseBar();
  checkTitles();
  save();
  draw();
}

function removeQuest(i) {
  data.quests.splice(i, 1);
  save();
  draw();
}

/* ---------- gates ---------- */

function addGate() {
  var box = document.getElementById("newGate");
  var text = box.value.trim();
  if (text === "") return;
  var rank = document.getElementById("gateRank").value;
  var stat = document.getElementById("gateStat").value;
  data.gates.push({ text: text, rank: rank, stat: stat });
  box.value = "";
  save();
  draw();
}

function clearGate(i) {
  var g = data.gates[i];
  if (!g) return;
  var xp = GATE_XP[g.rank] || 50;
  data.gates.splice(i, 1);
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

function removeGate(i) {
  data.gates.splice(i, 1);
  save();
  draw();
}

/* ---------- reset ---------- */

function resetAll() {
  if (!confirm("Delete all progress and start over?")) return;
  try { localStorage.removeItem("system-data"); } catch (e) {}
  location.reload();
}

/* ---------- drawing the screen ---------- */

function draw() {
  var need = data.level * 100;
  document.getElementById("level").innerText = data.level;
  document.getElementById("rank").innerText = getRank();
  document.getElementById("xp").innerText = data.xp;
  document.getElementById("need").innerText = need;
  document.getElementById("streak").innerText = data.streak;
  document.getElementById("fill").style.width = (data.xp / need * 100) + "%";
  document.getElementById("gatesCleared").innerText = data.gatesCleared;
  document.getElementById("soundBtn").innerText = "Sound: " + (data.sound ? "ON" : "OFF");

  var titleName = "No title yet";
  for (var ti = 0; ti < TITLES.length; ti++) {
    if (TITLES[ti].id === data.equipped) titleName = "[ " + TITLES[ti].name + " ]";
  }
  document.getElementById("titleLine").innerText = titleName;

  for (var n = 0; n < STAT_NAMES.length; n++) {
    document.getElementById(STAT_NAMES[n]).innerText = data.stats[STAT_NAMES[n]] || 0;
  }

  /* daily quests */
  var html = "";
  for (var i = 0; i < data.quests.length; i++) {
    var q = data.quests[i];
    html += '<div class="quest ' + (q.done ? "done" : "") + '">';
    html += '<div><span>' + esc(q.text) + '</span><small>+1 ' + q.stat + '</small></div>';
    html += '<div>';
    if (!q.done) html += '<button onclick="completeQuest(' + i + ')">Done</button> ';
    html += '<button onclick="removeQuest(' + i + ')">X</button>';
    html += '</div></div>';
  }
  document.getElementById("list").innerHTML = html;

  /* gates */
  var gh = "";
  for (var j = 0; j < data.gates.length; j++) {
    var g = data.gates[j];
    gh += '<div class="quest">';
    gh += '<div><span>[' + g.rank + '] ' + esc(g.text) + '</span>';
    gh += '<small>+' + (GATE_XP[g.rank] || 50) + ' XP, +3 ' + g.stat + '</small></div>';
    gh += '<div><button onclick="clearGate(' + j + ')">Clear</button> ';
    gh += '<button onclick="removeGate(' + j + ')">X</button></div></div>';
  }
  document.getElementById("gateList").innerHTML = gh;

  /* titles */
  var th = "";
  for (var k = 0; k < TITLES.length; k++) {
    var t = TITLES[k];
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
  document.getElementById("titleList").innerHTML = th;
  document.getElementById("titleCount").innerText = data.titles.length + "/" + TITLES.length;

  /* shadow army */
  var sh = "";
  var owned = 0;
  for (var m = 0; m < SHADOWS.length; m++) {
    var s = SHADOWS[m];
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
  document.getElementById("shadowList").innerHTML = sh;
  document.getElementById("shadowCount").innerText = owned + "/" + SHADOWS.length;
}

/* ---------- start ---------- */

load();
dailyCheck();
checkTitles();
save();
draw();

document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    dailyCheck();
    checkTitles();
    save();
    draw();
  }
});
