/*********************
 * Habit Tracker v1  *
 *********************/

/* ---------- CONFIG ---------- */

const HABITS = [
  { id: "wake6", label: "Wake up 6 am" },
  { id: "water3l", label: "Drink 3L water" },
  { id: "pushups100", label: "100 pushups" },
  { id: "skill1_5h", label: "Skill development 1.5 hrs" },
  { id: "makebed", label: "Make bed" },
  { id: "chia", label: "Chia water" },
  { id: "meditate", label: "Meditate" },
  { id: "pray", label: "Pray" },
  { id: "youtube", label: "YouTube" },
  { id: "read20", label: "Read 20 min" },
  { id: "journal", label: "Journaling" },
  { id: "brain", label: "Brain challenge" },
];

const STORAGE_KEY = "habitTracker_v1_data"; // { "YYYY-MM-DD": { habitId: true/false } }
const MOTIVATION_QUOTES = [
  {
    text: "You don’t have to be extreme, just consistent.",
    author: "Unknown",
  },
  {
    text: "Discipline is choosing what you want most over what you want now.",
    author: "Unknown",
  },
  {
    text: "Small daily actions compound into big results.",
    author: "Unknown",
  },
  {
    text: "Win the day by winning your habits.",
    author: "Unknown",
  },
  {
    text: "Your future is built from what you do today, not someday.",
    author: "Unknown",
  },
  {
    text: "Missing one day is normal. Missing two creates a new habit.",
    author: "James Clear (paraphrased)",
  },
  {
    text: "Show up especially on the days you don’t feel like it.",
    author: "Unknown",
  },
  {
    text: "Tiny wins today beat perfect plans you never start.",
    author: "Unknown",
  },
  {
    text: "You’re not starting from zero, you’re starting from experience.",
    author: "Unknown",
  },
  {
    text: "Consistency turns actions into identity: “I am the person who does this.”",
    author: "Unknown",
  },
];

const MOTIVATION_QUOTE_KEY = "habitTracker_v1_quoteState";
const MOTIVATION_NOTE_KEY = "habitTracker_v1_motivationNotes";

/* ---------- HELPERS ---------- */

const $ = (id) => document.getElementById(id);

const today = new Date();
const dateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const prettyDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
function loadMotivationNotes() {
  try {
    const raw = localStorage.getItem(MOTIVATION_NOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMotivationNotes(notes) {
  localStorage.setItem(MOTIVATION_NOTE_KEY, JSON.stringify(notes));
}

function loadMotivationQuoteState() {
  try {
    const raw = localStorage.getItem(MOTIVATION_QUOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMotivationQuoteState(state) {
  localStorage.setItem(MOTIVATION_QUOTE_KEY, JSON.stringify(state));
}


let habitData = loadData();
const todayKey = dateKey(today);
let motivationNotes = loadMotivationNotes();
let motivationQuoteState = loadMotivationQuoteState();


/* ---------- DOM ELEMENTS ---------- */

let habitListEl,
  todayDateEl,
  progressCircleEl,
  progressPercentEl,
  progressHeadlineEl,
  progressDetailEl,
  chipTotalEl,
  chipDoneEl,
  chipPendingEl,
  currentStreakEl,
  bestStreakEl,
  motivationTextEl,
  motivationAuthorEl,
  motivationNoteEl,
  historyChartEl;



const CIRCUMFERENCE = 2 * Math.PI * 48; // r=48

/* ---------- RENDER HABITS ---------- */
/* ---------- MOTIVATION (QUOTE + YOUR NOTE) ---------- */

function renderMotivation() {
  if (!motivationTextEl || !motivationAuthorEl) return;

  const idx = getTodayQuoteIndex();
  const quote = MOTIVATION_QUOTES[idx];

  motivationTextEl.textContent = quote.text;
  motivationAuthorEl.textContent = `— ${quote.author}`;

  if (motivationNoteEl) {
    motivationNoteEl.value = motivationNotes[todayKey] || "";
  }
}

function renderHabits() {
  if (!habitListEl) return;
  if (!habitData[todayKey]) habitData[todayKey] = {};
  const todayHabits = habitData[todayKey];

  habitListEl.innerHTML = "";

  HABITS.forEach((h) => {
    const row = document.createElement("div");
    row.className = "habit-item";

    const label = document.createElement("label");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "habit-check";
    check.checked = !!todayHabits[h.id];

    const name = document.createElement("span");
    name.className = "habit-name" + (check.checked ? " done" : "");
    name.textContent = h.label;

    check.addEventListener("change", () => {
      todayHabits[h.id] = check.checked;
      saveData(habitData);
      // update line-through style
      if (check.checked) {
        name.classList.add("done");
      } else {
        name.classList.remove("done");
      }
      // update progress & streak live
      updateProgressAndStreak();
    });

    label.appendChild(check);
    label.appendChild(name);
    row.appendChild(label);
    habitListEl.appendChild(row);
  });
}

/* ---------- PROGRESS & STREAK ---------- */

function computeTodayStats() {
  const total = HABITS.length;
  const todayHabits = habitData[todayKey] || {};
  let done = 0;
  HABITS.forEach((h) => {
    if (todayHabits[h.id]) done++;
  });
  const pending = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pending, percent };
}

function computeDayPercent(key) {
  const total = HABITS.length;
  if (total === 0) return 0;
  const dayHabits = habitData[key] || {};
  let done = 0;
  HABITS.forEach((h) => {
    if (dayHabits[h.id]) done++;
  });
  return Math.round((done / total) * 100);
}
function getTodayQuoteIndex() {
  // if we already picked a quote for today, reuse it
  if (
    motivationQuoteState &&
    motivationQuoteState.lastDate === todayKey &&
    typeof motivationQuoteState.index === "number"
  ) {
    return motivationQuoteState.index;
  }

  // otherwise, move to next quote in list (no repeat until all used)
  const lastIndex =
    motivationQuoteState && typeof motivationQuoteState.index === "number"
      ? motivationQuoteState.index
      : -1;

  const nextIndex = (lastIndex + 1) % MOTIVATION_QUOTES.length;

  motivationQuoteState = { lastDate: todayKey, index: nextIndex };
  saveMotivationQuoteState(motivationQuoteState);
  return nextIndex;
}

function computeStreaks() {
  // current streak: consecutive days up to today with 100%
  let current = 0;
  let d = new Date(today);
  while (true) {
    const key = dateKey(d);
    const pct = computeDayPercent(key);
    if (pct === 100) {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // best streak: across all days
  const keys = Object.keys(habitData).sort(); // ascending
  let best = 0;
  let streak = 0;
  let prev = null;

  keys.forEach((key) => {
    const pct = computeDayPercent(key);
    if (pct === 100) {
      if (!prev) {
        streak = 1;
      } else {
        const prevDate = new Date(prev);
        const currDate = new Date(key);
        const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        streak = diff === 1 ? streak + 1 : 1;
      }
      if (streak > best) best = streak;
      prev = key;
    } else {
      streak = 0;
    }
  });

  return { current, best };
}

/* ---------- HISTORY CHART (LAST 30 DAYS) ---------- */

/* ---------- HISTORY CHART (LAST 30 DAYS) ---------- */

function renderHistoryChart() {
  if (!historyChartEl) return;

  historyChartEl.innerHTML = "";

  const days = 30;
  const labels = [];
  const percents = [];

  // Build last 30 days from oldest → newest
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const pct = computeDayPercent(key);

    // weekday letters: M, T, W, T, F, S, S
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue, etc.
    const letter = weekday[0]; // 'M', 'T', 'W', etc.
    labels.push(letter);
    percents.push(pct);
  }

  percents.forEach((pct, index) => {
    const bar = document.createElement("div");
    bar.className = "history-bar";

    const fill = document.createElement("div");
    fill.className = "history-bar-fill";

    // height based on percentage (0–100)
    const safePct = Math.max(0, Math.min(100, pct || 0));
    fill.style.height = `${safePct}%`;

    // color logic
    if (safePct >= 80) {
      // high performance → green
      fill.style.backgroundColor = "rgba(74, 222, 128, 0.85)"; // green
    } else if (safePct <= 40) {
      // low performance → red
      fill.style.backgroundColor = "rgba(248, 113, 113, 0.9)"; // red
    } else {
      // mid range → blue
      fill.style.backgroundColor = "rgba(56, 189, 248, 0.9)"; // blue
    }

    const valueLabel = document.createElement("div");
    valueLabel.className = "history-bar-label-value";
    valueLabel.textContent = safePct > 0 ? `${safePct}%` : "";

    const dateLabel = document.createElement("div");
    dateLabel.className = "history-bar-label-date";
    dateLabel.textContent = labels[index];

    bar.appendChild(fill);
    bar.appendChild(valueLabel);
    bar.appendChild(dateLabel);
    historyChartEl.appendChild(bar);
  });
}


  percents.forEach((pct, index) => {
    const bar = document.createElement("div");
    bar.className = "history-bar";

    const fill = document.createElement("div");
    fill.className = "history-bar-fill";
    // Height proportional to percentage (0–100)
    fill.style.height = `${pct}%`;

    const valueLabel = document.createElement("div");
    valueLabel.className = "history-bar-label-value";
    valueLabel.textContent = pct > 0 ? `${pct}%` : "";

    const dateLabel = document.createElement("div");
    dateLabel.className = "history-bar-label-date";
    dateLabel.textContent = labels[index];

    bar.appendChild(fill);
    bar.appendChild(valueLabel);
    bar.appendChild(dateLabel);
    historyChartEl.appendChild(bar);
  });
}

function updateProgressAndStreak() {
  const { total, done, pending, percent } = computeTodayStats();

  // ring
  if (progressCircleEl) {
    const offset = CIRCUMFERENCE * (1 - percent / 100);
    progressCircleEl.style.strokeDasharray = CIRCUMFERENCE.toString();
    progressCircleEl.style.strokeDashoffset = offset.toString();
  }
  if (progressPercentEl) {
    progressPercentEl.textContent = `${percent}%`;
  }

  // chips
  if (chipTotalEl) chipTotalEl.textContent = `${total} habits`;
  if (chipDoneEl) chipDoneEl.textContent = `${done} done`;
  if (chipPendingEl) chipPendingEl.textContent = `${pending} pending`;

  // text
  if (progressHeadlineEl && progressDetailEl) {
    if (percent === 0) {
      progressHeadlineEl.textContent = "No habits completed yet.";
      progressDetailEl.textContent = "Start by ticking your first habit.";
    } else if (percent < 100) {
      progressHeadlineEl.textContent = "Good progress.";
      progressDetailEl.textContent = `You’ve completed ${done} of ${total} habits.`;
    } else {
      progressHeadlineEl.textContent = "Perfect day!";
      progressDetailEl.textContent = "All habits completed for today. 🎉";
    }
  }

  // streaks
  const { current, best } = computeStreaks();
  if (currentStreakEl) {
    currentStreakEl.textContent = `${current} day${current === 1 ? "" : "s"}`;
  }
  if (bestStreakEl) {
    bestStreakEl.textContent = `${best} day${best === 1 ? "" : "s"}`;
  }
   renderHistoryChart();
}

/* ---------- INIT ---------- */

function init() {
  // link DOM elements
  habitListEl = $("habitList");
  todayDateEl = $("todayDate");
  progressCircleEl = $("progressCircle");
  progressPercentEl = $("progressPercent");
  progressHeadlineEl = $("progressHeadline");
  progressDetailEl = $("progressDetail");
  chipTotalEl = $("chipTotal");
  chipDoneEl = $("chipDone");
  chipPendingEl = $("chipPending");
  currentStreakEl = $("currentStreak");
  bestStreakEl = $("bestStreak");
  motivationTextEl = $("motivationText");
  motivationAuthorEl = $("motivationAuthor");
  motivationNoteEl = $("motivationNote");
  historyChartEl = $("historyChart");

  if (todayDateEl) {
    todayDateEl.textContent = prettyDate(today);
  }

  renderMotivation();
  renderHabits();
  updateProgressAndStreak();

  if (motivationNoteEl) {
    motivationNoteEl.addEventListener("input", () => {
      motivationNotes[todayKey] = motivationNoteEl.value;
      saveMotivationNotes(motivationNotes);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

