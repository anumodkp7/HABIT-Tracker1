/*********************
 * HABIT TRACKER v1.5
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

const STORAGE_KEY = "habitTracker_v1_data";
const MOTIVATION_NOTE_KEY = "habitTracker_v1_notes";
const MOTIVATION_QUOTE_KEY = "habitTracker_v1_quoteState";

const MOTIVATION_QUOTES = [
  { text: "You don’t have to be extreme, just consistent.", author: "Unknown" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Unknown" },
  { text: "Small daily actions compound into big results.", author: "Unknown" },
  { text: "Win the day by winning your habits.", author: "Unknown" },
  { text: "Your future is built from what you do today, not someday.", author: "Unknown" },
  { text: "Missing one day is normal. Missing two creates a new habit.", author: "James Clear (paraphrased)" },
  { text: "Show up especially on the days you don’t feel like it.", author: "Unknown" },
  { text: "Tiny wins today beat perfect plans you never start.", author: "Unknown" },
  { text: "You’re not starting from zero, you’re starting from experience.", author: "Unknown" },
  { text: "Consistency turns actions into identity.", author: "Unknown" },
];

/* ---------- HELPERS ---------- */
const $ = (id) => document.getElementById(id);
const today = new Date();
const todayKey = today.toISOString().split("T")[0];

const loadJSON = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let habitData = loadJSON(STORAGE_KEY, {});
let motivationNotes = loadJSON(MOTIVATION_NOTE_KEY, {});
let motivationQuoteState = loadJSON(MOTIVATION_QUOTE_KEY, {});

/* ---------- DOM ---------- */
let habitListEl,
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

/* ---------- MOTIVATION ---------- */
function getTodayQuoteIndex() {
  if (motivationQuoteState.last === todayKey) return motivationQuoteState.index;
  const last = typeof motivationQuoteState.index === "number" ? motivationQuoteState.index : -1;
  const next = (last + 1) % MOTIVATION_QUOTES.length;
  motivationQuoteState = { last: todayKey, index: next };
  saveJSON(MOTIVATION_QUOTE_KEY, motivationQuoteState);
  return next;
}

function renderMotivation() {
  const idx = getTodayQuoteIndex();
  const quote = MOTIVATION_QUOTES[idx];
  motivationTextEl.textContent = quote.text;
  motivationAuthorEl.textContent = `— ${quote.author}`;
  motivationNoteEl.value = motivationNotes[todayKey] || "";
  motivationNoteEl.oninput = () => {
    motivationNotes[todayKey] = motivationNoteEl.value;
    saveJSON(MOTIVATION_NOTE_KEY, motivationNotes);
  };
}

/* ---------- HABITS ---------- */
function renderHabits() {
  if (!habitData[todayKey]) habitData[todayKey] = {};
  const day = habitData[todayKey];

  habitListEl.innerHTML = "";
  HABITS.forEach((h) => {
    const row = document.createElement("div");
    row.className = "habit-item";

    const label = document.createElement("label");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "habit-check";
    check.checked = !!day[h.id];

    const span = document.createElement("span");
    span.className = "habit-name" + (check.checked ? " done" : "");
    span.textContent = h.label;

    check.onchange = () => {
      day[h.id] = check.checked;
      saveJSON(STORAGE_KEY, habitData);
      span.classList.toggle("done", check.checked);
      updateProgress();
    };

    label.append(check, span);
    row.append(label);
    habitListEl.append(row);
  });
}

/* ---------- PROGRESS & STREAK ---------- */
const CIRCUMFERENCE = 2 * Math.PI * 48;

function computePercent(key) {
  const d = habitData[key] || {};
  const done = HABITS.filter((h) => d[h.id]).length;
  return Math.round((done / HABITS.length) * 100);
}

function computeStreaks() {
  let best = 0,
    current = 0,
    streak = 0,
    prev = null;

  Object.keys(habitData)
    .sort()
    .forEach((key) => {
      const pct = computePercent(key);
      if (pct === 100) {
        if (!prev) streak = 1;
        else streak = new Date(key) - new Date(prev) === 86400000 ? streak + 1 : 1;
        best = Math.max(best, streak);
        prev = key;
      } else streak = 0;
    });

  current = computePercent(todayKey) === 100 ? streak : 0;
  return { current, best };
}

function updateProgress() {
  const pct = computePercent(todayKey);
  const done = HABITS.filter((h) => habitData[todayKey]?.[h.id]).length;
  const pending = HABITS.length - done;

  progressCircleEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct / 100);
  progressPercentEl.textContent = pct + "%";
  chipTotalEl.textContent = HABITS.length + " habits";
  chipDoneEl.textContent = done + " done";
  chipPendingEl.textContent = pending + " pending";

  if (pct === 0) {
    progressHeadlineEl.textContent = "No habits completed yet.";
    progressDetailEl.textContent = "Start by ticking your first habit.";
  } else if (pct < 100) {
    progressHeadlineEl.textContent = "Good progress.";
    progressDetailEl.textContent = `You’ve completed ${done} of ${HABITS.length} habits.`;
  } else {
    progressHeadlineEl.textContent = "Perfect day! 🎉";
    progressDetailEl.textContent = "All habits completed today.";
  }

  const { current, best } = computeStreaks();
  currentStreakEl.textContent = `${current} day${current === 1 ? "" : "s"}`;
  bestStreakEl.textContent = `${best} day${best === 1 ? "" : "s"}`;

  renderHistoryChart();
}

/* ---------- HISTORY CHART ---------- */
function renderHistoryChart() {
  historyChartEl.innerHTML = "";
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const pct = computePercent(key);
    const letter = d.toLocaleDateString("en-US", { weekday: "short" })[0];

    const bar = document.createElement("div");
    bar.className = "history-bar";

    const fill = document.createElement("div");
    fill.className = "history-bar-fill";
    fill.style.height = `${pct}%`;

    if (pct >= 80) fill.style.backgroundColor = "rgba(74, 222, 128, 0.9)";
    else if (pct <= 40) fill.style.backgroundColor = "rgba(248, 113, 113, 0.9)";
    else fill.style.backgroundColor = "rgba(56, 189, 248, 0.9)";

    const val = document.createElement("div");
    val.className = "history-bar-label-value";
    val.textContent = pct ? pct + "%" : "";

    const date = document.createElement("div");
    date.className = "history-bar-label-date";
    date.textContent = letter;

    bar.append(fill, val, date);
    historyChartEl.append(bar);
  }
}

/* ---------- INIT ---------- */
function init() {
  habitListEl = $("habitList");
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
  $("todayDate").textContent = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  renderMotivation();
  renderHabits();
  updateProgress();
}

document.addEventListener("DOMContentLoaded", init);
