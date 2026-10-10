var data = {
  level: 1,
  xp: 0,
  stats: { STR: 0, AGI: 0, INT: 0, VIT: 0 },
  quests: [],
  lastDate: "",
  streak: 0
};

function today() {
  return new Date().toDateString();
}

function load() {
  try {
    var saved = JSON.parse(localStorage.getItem("system-data"));
    if (saved) {
      data.level = saved.level || 1;
      data.xp = saved.xp || 0;
      data.quests = saved.quests || [];
      data.streak = saved.streak || 0;
      data.lastDate = saved.lastDate || "";
      if (saved.stats) data.stats = saved.stats;
    }
  } catch (e) {}

  for (var i = 0; i < data.quests.length; i++) {
    if (!data.quests[i].stat) data.quests[i].stat = "INT";
  }
}

function save() {
  try {
    localStorage.setItem("system-data", JSON.stringify(data));
  } catch (e) {}
}

function showNotice(text, good) {
  var box = document.getElementById("notice");
  box.innerText = text;
  box.className = good ? "notice good" : "notice";
  box.style.display = "block";
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
    showNotice("PENALTY: You skipped " + missed + " quest(s). -" + loss + " XP.", false);
  } else if (total > 0) {
    data.streak = data.streak + 1;
    showNotice("All quests cleared yesterday. Streak: " + data.streak, true);
  }

  data.lastDate = t;
}

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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
  if (q.done) return;
  q.done = true;
  data.xp = data.xp + 20;
  data.stats[q.stat] = (data.stats[q.stat] || 0) + 1;

  while (data.xp >= data.level * 100) {
    data.xp = data.xp - data.level * 100;
    data.level = data.level + 1;
    showNotice("LEVEL UP! You are now Level " + data.level + " (" + getRank() + ")", true);
  }
  save();
  draw();
}

function removeQuest(i) {
  data.quests.splice(i, 1);
  save();
  draw();
}

function resetAll() {
  if (!confirm("Delete all progress and start over?")) return;
  try { localStorage.removeItem("system-data"); } catch (e) {}
  location.reload();
}

function draw() {
  var need = data.level * 100;
  document.getElementById("level").innerText = data.level;
  document.getElementById("rank").innerText = getRank();
  document.getElementById("xp").innerText = data.xp;
  document.getElementById("need").innerText = need;
  document.getElementById("streak").innerText = data.streak;
  document.getElementById("fill").style.width = (data.xp / need * 100) + "%";

  var names = ["STR", "AGI", "INT", "VIT"];
  for (var n = 0; n < names.length; n++) {
    document.getElementById(names[n]).innerText = data.stats[names[n]] || 0;
  }

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
}

load();
dailyCheck();
save();
draw();
