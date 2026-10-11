var QUEST_TEXT = {
  STR: [
    "Do 10 push-ups",
    "Do 15 squats",
    "Hold a plank for 30 seconds",
    "Do 10 sit-ups",
    "Do 10 lunges on each leg",
    "Do 10 chair dips",
    "Do 10 glute bridges",
    "Do 15 calf raises",
    "Do a wall sit for 30 seconds",
    "Do 5 slow push-ups",
    "Do 20 bicycle crunches",
    "Do 10 superman holds",
    "Do 10 wide-stance squats",
    "Do 10 incline push-ups on a table or wall",
    "Carry something heavy for 1 minute",
    "Hold a squat for 20 seconds",
    "Do 15 leg raises",
    "Do 10 curls with water bottles",
    "Do 10 shoulder presses with water bottles",
    "Do 20 mountain climbers",
    "Do 10 reverse crunches",
    "Hold a side plank for 20 seconds on each side",
    "Do 10 step-ups on a stair",
    "Do 10 slow chair squats",
    "Do 10 bird-dog reps on each side"
  ],
  AGI: [
    "Do 20 jumping jacks",
    "Jog in place for 1 minute",
    "Take a 10-minute walk",
    "Skip rope (or pretend to) for 1 minute",
    "Do 20 high knees",
    "Stretch your legs for 3 minutes",
    "Do 20 butt kicks",
    "Balance on one leg for 30 seconds each side",
    "Touch your toes 10 times",
    "Do 10 hip circles in each direction",
    "Stretch for 5 minutes",
    "Shuffle side to side for 30 seconds",
    "Do 10 arm circles in each direction",
    "Take the stairs instead of the elevator",
    "Walk 3000 steps",
    "Shadow box for 1 minute",
    "Do 5 slow burpees",
    "Dance to one full song",
    "Do 10 side-to-side skater hops",
    "Stretch your neck and shoulders for 2 minutes",
    "Walk around your block once",
    "Do 20 quick toe taps",
    "Do 10 cat-cow stretches",
    "Stand up and stretch for 1 minute",
    "Hold a child's pose for 1 minute"
  ],
  INT: [
    "Read for 10 minutes",
    "Learn 5 new words",
    "Write down 3 goals for the week",
    "Do a 5-minute puzzle or brain game",
    "Watch a short educational video",
    "Write in a journal for 5 minutes",
    "Plan tomorrow in 5 minutes",
    "Learn one new fact and write it down",
    "Meditate for 5 minutes",
    "Practice a language for 10 minutes",
    "Read 5 pages of a book",
    "Delete 10 unneeded photos or apps",
    "Write down 3 things you are grateful for",
    "Solve 5 math problems",
    "Listen to an educational podcast for 10 minutes",
    "Write down one idea for your future",
    "Review your spending for 5 minutes",
    "Organize your to-do list",
    "Practice typing for 5 minutes",
    "Learn one thing about a skill you want",
    "Explain something you learned to a friend",
    "Study for 10 minutes without your phone",
    "Memorize one short quote",
    "Draw or doodle for 5 minutes",
    "Review what you learned today for 3 minutes"
  ],
  VIT: [
    "Drink a glass of water now",
    "Drink 8 glasses of water today",
    "Eat one fruit or vegetable",
    "Go to bed on time tonight",
    "Stretch for 5 minutes after waking up",
    "Take a 10-minute walk outside",
    "Take 10 deep breaths",
    "Make your bed",
    "Eat a healthy breakfast",
    "Skip sugary drinks today",
    "Spend 10 minutes in sunlight",
    "Brush your teeth twice today",
    "Eat a vegetable with dinner",
    "Put your phone down 30 minutes before bed",
    "Clean your room for 10 minutes",
    "Do the dishes",
    "Prepare a healthy snack",
    "Sit up straight for 5 minutes",
    "Shower and put on clean clothes",
    "Wake up at your planned time",
    "Spend 10 minutes away from screens",
    "Eat one meal slowly",
    "Do 5 minutes of deep breathing before bed",
    "Pack tomorrow's bag or clothes tonight",
    "Drink water before every meal today"
  ]
};

var QUESTS = [];
var QUEST_MAP = {};

(function () {
  var stats = ["STR", "AGI", "INT", "VIT"];
  for (var s = 0; s < stats.length; s++) {
    var list = QUEST_TEXT[stats[s]];
    for (var j = 0; j < list.length; j++) {
      var q = { id: stats[s] + (j + 1), text: list[j], stat: stats[s] };
      QUESTS.push(q);
      QUEST_MAP[q.id] = q;
    }
  }
})();

var GATES = [
  { id: "g1", rank: "E", stat: "VIT", text: "Walk or jog for 30 minutes" },
  { id: "g2", rank: "E", stat: "INT", text: "Read 30 pages of a book" },
  { id: "g3", rank: "D", stat: "STR", text: "Do 50 push-ups in one day" },
  { id: "g4", rank: "D", stat: "INT", text: "Study or practice a skill for 1 hour" },
  { id: "g5", rank: "C", stat: "AGI", text: "Run or fast-walk 3 km" },
  { id: "g6", rank: "C", stat: "VIT", text: "Go a full day without social media" },
  { id: "g7", rank: "B", stat: "STR", text: "Do 100 squats in one day" },
  { id: "g8", rank: "B", stat: "VIT", text: "Cook a healthy meal from scratch" },
  { id: "g9", rank: "A", stat: "AGI", text: "Run 5 km" },
  { id: "g10", rank: "A", stat: "INT", text: "Study a new skill for 3 hours in one day" },
  { id: "g11", rank: "S", stat: "AGI", text: "Walk or run 10 km" },
  { id: "g12", rank: "S", stat: "INT", text: "Finish a project you have been putting off" }
];

var GATE_MAP = {};
for (var gi = 0; gi < GATES.length; gi++) {
  GATE_MAP[GATES[gi].id] = GATES[gi];
}
