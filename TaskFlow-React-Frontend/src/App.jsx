import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDown, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCheck, ChevronDown, CircleHelp, Clock3, Command, Filter,
  LayoutDashboard, ListTodo, Menu, MoreHorizontal, Plus, Search,
  Settings2, Sparkles, Trash2, X, Zap
} from "lucide-react";
import CalendarView from "./CalendarView";
import SettingsView from "./SettingsView";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const STORAGE_KEY = "taskflow_tasks_v1";

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayIso = toLocalDateString(new Date());
const tomorrowObj = new Date();
tomorrowObj.setDate(tomorrowObj.getDate() + 1);
const tomorrowIso = toLocalDateString(tomorrowObj);
const inThreeDaysObj = new Date();
inThreeDaysObj.setDate(inThreeDaysObj.getDate() + 3);
const inThreeDaysIso = toLocalDateString(inThreeDaysObj);

const starterTasks = [
  { id: "demo-1", title: "Review project requirements", completed: false, priority: "High", due_date: todayIso, created_at: new Date().toISOString() },
  { id: "demo-2", title: "Sketch the dashboard layout", completed: true, priority: "Medium", due_date: todayIso, created_at: new Date().toISOString() },
  { id: "demo-3", title: "Set up React components", completed: false, priority: "Medium", due_date: tomorrowIso, created_at: new Date().toISOString() },
  { id: "demo-4", title: "Write down ideas for the demo", completed: false, priority: "Low", due_date: inThreeDaysIso, created_at: new Date().toISOString() },
];

function readLocalTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterTasks;
  } catch {
    return starterTasks;
  }
}

function normalizeTask(task) {
  return {
    ...task,
    id: task.id ?? crypto.randomUUID(),
    title: task.title ?? "",
    completed: Boolean(task.completed ?? task.done),
    priority: task.priority || "Medium",
    due_date: task.due_date ? String(task.due_date).split("T")[0] : null,
  };
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function App() {
  const [tasks, setTasks] = useState(readLocalTasks);
  const [filter, setFilter] = useState("All tasks");
  const [searchTerm, setSearchTerm] = useState("");

  // Settings states with localStorage persistence
  const [theme, setTheme] = useState(() => localStorage.getItem("taskflow_theme") || "light");
  const [defaultPriority, setDefaultPriority] = useState(() => localStorage.getItem("taskflow_default_priority") || "Medium");
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem("taskflow_sort_order") || "newest");
  const [defaultDueDate, setDefaultDueDate] = useState(() => localStorage.getItem("taskflow_default_due_date") || "none");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("taskflow_sound") !== "false");

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(defaultPriority);
  const [newDueDate, setNewDueDate] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [apiError, setApiError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentView, setCurrentView] = useState("Dashboard");

  // Apply and persist dark/light/system theme
  useEffect(() => {
    localStorage.setItem("taskflow_theme", theme);
    function applyTheme() {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    applyTheme();

    if (theme === "system" && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  // Persist settings preferences
  useEffect(() => {
    localStorage.setItem("taskflow_default_priority", defaultPriority);
  }, [defaultPriority]);

  useEffect(() => {
    localStorage.setItem("taskflow_sort_order", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem("taskflow_default_due_date", defaultDueDate);
  }, [defaultDueDate]);

  useEffect(() => {
    localStorage.setItem("taskflow_sound", String(soundEnabled));
  }, [soundEnabled]);

  // Initial fetch from backend if API_URL is set
  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    apiRequest("/tasks")
      .then((data) => {
        if (!cancelled) setTasks((Array.isArray(data) ? data : data.tasks || []).map(normalizeTask));
      })
      .catch((error) => {
        if (!cancelled) setApiError(`Could not connect to the API: ${error.message}. Check your FastAPI server and VITE_API_URL.`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Save to localStorage when in local demo mode
  useEffect(() => {
    if (!API_URL) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const openCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const scheduledCount = tasks.filter((task) => Boolean(task.due_date)).length;

  // Filtered and sorted tasks
  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesFilter =
        filter === "All tasks" ||
        (filter === "Open" && !task.completed) ||
        (filter === "Done" && task.completed);
      return matchesFilter && task.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortOrder === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortOrder === "priority") {
        const weight = { High: 3, Medium: 2, Low: 1 };
        return (weight[b.priority] || 2) - (weight[a.priority] || 2);
      }
      if (sortOrder === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      return 0;
    });
  }, [tasks, filter, searchTerm, sortOrder]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  // Audio feedback for task completion - Celebratory clapping applause
  function playCompletionClap() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Create noise buffer for acoustic clap synthesis
      const bufferSize = Math.floor(ctx.sampleRate * 0.25);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.95;
      }

      // Single clap generator with realistic micro-burst impacts and resonant filtering
      const triggerSingleClap = (time, intensity = 0.35, centerFreq = 1100) => {
        const microBursts = [0, 0.009, 0.02];
        microBursts.forEach((offset, idx) => {
          const isMain = idx === microBursts.length - 1;
          const burstTime = time + offset;

          const source = ctx.createBufferSource();
          source.buffer = noiseBuffer;

          // Bandpass filter to sculpt palm resonance (approx 1000 - 1300 Hz)
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(centerFreq + (idx * 35), burstTime);
          filter.Q.setValueAtTime(2.2, burstTime);

          // Lowpass filter for natural fleshy slap warmth
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = "lowpass";
          lowpass.frequency.setValueAtTime(3400, burstTime);

          // Sharp attack, rapid decay envelope
          const gain = ctx.createGain();
          const burstGain = isMain ? intensity : intensity * 0.35;
          gain.gain.setValueAtTime(0.001, burstTime);
          gain.gain.linearRampToValueAtTime(burstGain, burstTime + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.001, burstTime + (isMain ? 0.08 : 0.035));

          source.connect(filter);
          filter.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(ctx.destination);

          source.start(burstTime);
          source.stop(burstTime + 0.1);
        });
      };

      const now = ctx.currentTime;
      // Celebratory clapping rhythm (5 rapid, organic hand claps)
      const clapSequence = [
        { delay: 0.00, intensity: 0.34, freq: 1080 },
        { delay: 0.11, intensity: 0.40, freq: 1180 },
        { delay: 0.23, intensity: 0.38, freq: 1120 },
        { delay: 0.35, intensity: 0.45, freq: 1220 },
        { delay: 0.48, intensity: 0.50, freq: 1160 },
      ];

      clapSequence.forEach(({ delay, intensity, freq }) => {
        triggerSingleClap(now + delay, intensity, freq);
      });
    } catch {
      // Audio context unavailable
    }
  }

  function handleOpenComposer() {
    setShowComposer((prev) => {
      if (!prev) {
        setNewPriority(defaultPriority);
        if (defaultDueDate === "today") setNewDueDate(todayIso);
        else if (defaultDueDate === "tomorrow") setNewDueDate(tomorrowIso);
        else setNewDueDate("");
      }
      return !prev;
    });
  }

  async function addTask(inputData) {
    let title = "";
    let priority = defaultPriority;
    let dueDate = null;
    let isFromComposer = false;

    if (inputData && inputData.preventDefault) {
      inputData.preventDefault();
      title = newTitle.trim();
      priority = newPriority;
      dueDate = newDueDate || null;
      isFromComposer = true;
    } else if (inputData && typeof inputData === "object") {
      title = (inputData.title || "").trim();
      priority = inputData.priority || defaultPriority;
      dueDate = inputData.due_date || null;
    }

    if (!title) return;

    const localTask = normalizeTask({
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    });

    if (API_URL) {
      try {
        const created = await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify({
            title,
            priority,
            completed: false,
            due_date: dueDate,
          }),
        });
        setTasks((current) => [normalizeTask(created), ...current]);
        setApiError("");
      } catch (error) {
        setApiError(`Could not add task: ${error.message}`);
        return;
      }
    } else {
      setTasks((current) => [localTask, ...current]);
    }

    if (isFromComposer) {
      setNewTitle("");
      setNewPriority(defaultPriority);
      setNewDueDate("");
      setShowComposer(false);
      setFilter("All tasks");
      showNotice("Task added successfully");
    }
  }

  async function toggleTask(task) {
    const updated = { ...task, completed: !task.completed };
    if (!task.completed) {
      playCompletionClap();
    }

    if (API_URL) {
      try {
        const result = await apiRequest(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: updated.completed }),
        });
        setTasks((current) => current.map((item) => item.id === task.id ? normalizeTask(result || updated) : item));
        setApiError("");
      } catch (error) {
        setApiError(`Could not update task: ${error.message}`);
      }
    } else {
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    }
  }

  async function deleteTask(task) {
    if (API_URL) {
      try {
        await apiRequest(`/tasks/${task.id}`, { method: "DELETE" });
        setTasks((current) => current.filter((item) => item.id !== task.id));
        setApiError("");
        showNotice("Task deleted");
      } catch (error) {
        setApiError(`Could not delete task: ${error.message}`);
      }
    } else {
      setTasks((current) => current.filter((item) => item.id !== task.id));
      showNotice("Task deleted");
    }
  }

  // Settings Actions
  async function clearCompletedTasks() {
    const toDelete = tasks.filter((t) => t.completed);
    if (toDelete.length === 0) return;

    if (API_URL) {
      for (const t of toDelete) {
        try {
          await apiRequest(`/tasks/${t.id}`, { method: "DELETE" });
        } catch {
          // ignore
        }
      }
    }
    setTasks((current) => current.filter((t) => !t.completed));
  }

  async function resetTasksToSample() {
    if (API_URL) {
      for (const t of tasks) {
        try {
          await apiRequest(`/tasks/${t.id}`, { method: "DELETE" });
        } catch {
          // ignore
        }
      }
      const created = [];
      for (const t of starterTasks) {
        try {
          const res = await apiRequest("/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: t.title,
              priority: t.priority,
              completed: t.completed,
              due_date: t.due_date,
            }),
          });
          created.push(normalizeTask(res));
        } catch {
          created.push(normalizeTask(t));
        }
      }
      setTasks(created);
    } else {
      setTasks(starterTasks.map(normalizeTask));
    }
  }

  async function importTasksList(importedList) {
    if (!Array.isArray(importedList)) return;
    const normalized = importedList.map(normalizeTask);
    if (API_URL) {
      for (const t of normalized) {
        try {
          await apiRequest("/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: t.title,
              priority: t.priority,
              completed: t.completed,
              due_date: t.due_date,
            }),
          });
        } catch {
          // ignore
        }
      }
      try {
        const fresh = await apiRequest("/tasks");
        setTasks((Array.isArray(fresh) ? fresh : fresh.tasks || []).map(normalizeTask));
      } catch {
        setTasks((curr) => [...normalized, ...curr]);
      }
    } else {
      setTasks((curr) => [...normalized, ...curr]);
    }
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "All tasks", icon: ListTodo, count: tasks.length },
    { label: "Open", icon: Clock3, count: openCount },
    { label: "Done", icon: CheckCheck, count: completedCount },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div
          className="brand"
          style={{ cursor: "pointer" }}
          onClick={() => {
            setCurrentView("Dashboard");
            setFilter("All tasks");
          }}
          title="Go to dashboard"
        >
          <div className="brand-mark"><Check size={21} strokeWidth={3} /></div>
          <span>taskflow<span className="brand-dot">.</span></span>
          <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              className={`nav-item ${currentView === "Dashboard" && filter === (label === "Overview" ? "All tasks" : label) ? "active" : ""}`}
              onClick={() => {
                setCurrentView("Dashboard");
                setFilter(label === "Overview" ? "All tasks" : label);
                setMobileNavOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count !== undefined && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="nav-label tools-label">TOOLS</div>
        <button
          className={`nav-item ${currentView === "Calendar" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("Calendar");
            setMobileNavOpen(false);
          }}
        >
          <CalendarDays size={18} />
          <span>Calendar</span>
          {scheduledCount > 0 && <span className="nav-count">{scheduledCount}</span>}
        </button>
        <button
          className={`nav-item ${currentView === "Settings" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("Settings");
            setMobileNavOpen(false);
          }}
        >
          <Settings2 size={18} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={17} /></div>
            <strong>Make room for what matters.</strong>
            <p>A little progress every day adds up.</p>
            <div className="upgrade-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="upgrade-foot"><span>{completedCount} of {tasks.length} completed</span><strong>{progress}%</strong></div>
          </div>
          <button className="profile-row" onClick={() => setCurrentView("Settings")}>
            <div className="profile-avatar">V</div>
            <div className="profile-copy"><strong>Your preferences</strong><span>Theme & settings</span></div>
            <MoreHorizontal size={18} className="muted-icon" />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="breadcrumbs">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => {
                setCurrentView("Dashboard");
                setFilter("All tasks");
              }}
            >
              Workspace
            </button>
            <span className="crumb-slash">/</span>
            <strong>
              {currentView === "Calendar"
                ? "Calendar"
                : currentView === "Settings"
                  ? "Settings"
                  : "My tasks"}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tasks..." aria-label="Search tasks" />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice("You're all caught up!")}><Bell size={19} /><span /></button>
            <div className="top-avatar" onClick={() => setCurrentView("Settings")} style={{ cursor: "pointer" }} title="Settings">V</div>
          </div>
        </header>

        {currentView === "Calendar" ? (
          <div className="page-wrap">
            {apiError && (
              <div className="api-error">
                <Activity size={17} />
                <span>{apiError}</span>
                <button onClick={() => setApiError("")} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}
            <CalendarView
              tasks={tasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onAddTask={addTask}
              searchTerm={searchTerm}
              showNotice={showNotice}
            />
            <footer className="page-footer">
              <span>© 2026 TaskFlow</span>
              <span><CircleHelp size={14} /> Made for a more focused day</span>
            </footer>
          </div>
        ) : currentView === "Settings" ? (
          <div className="page-wrap">
            {apiError && (
              <div className="api-error">
                <Activity size={17} />
                <span>{apiError}</span>
                <button onClick={() => setApiError("")} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}
            <SettingsView
              theme={theme}
              setTheme={setTheme}
              defaultPriority={defaultPriority}
              setDefaultPriority={setDefaultPriority}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              defaultDueDate={defaultDueDate}
              setDefaultDueDate={setDefaultDueDate}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              tasks={tasks}
              onClearCompleted={clearCompletedTasks}
              onResetTasks={resetTasksToSample}
              onImportTasks={importTasksList}
              showNotice={showNotice}
              isApiMode={Boolean(API_URL)}
            />
            <footer className="page-footer">
              <span>© 2026 TaskFlow</span>
              <span><CircleHelp size={14} /> Made for a more focused day</span>
            </footer>
          </div>
        ) : (
          <div className="page-wrap">
            {filter === "Open" ? (
              <section className="view-hero open-hero">
                <div className="view-hero-content">
                  <div className="view-hero-badge"><Clock3 size={22} /></div>
                  <div>
                    <h1>Focus Mode<span>.</span></h1>
                    <p className="view-hero-sub">{openCount} task{openCount !== 1 ? "s" : ""} waiting for your attention. One step at a time.</p>
                  </div>
                </div>
                <div className="open-priority-summary">
                  <span className="priority-chip high-chip"><Zap size={12} /> {visibleTasks.filter(t => t.priority === "High").length} High</span>
                  <span className="priority-chip medium-chip">{visibleTasks.filter(t => t.priority === "Medium").length} Medium</span>
                  <span className="priority-chip low-chip">{visibleTasks.filter(t => t.priority === "Low").length} Low</span>
                </div>
              </section>
            ) : filter === "Done" ? (
              <section className="view-hero done-hero">
                <div className="view-hero-content">
                  <div className="view-hero-badge"><CheckCheck size={22} /></div>
                  <div>
                    <h1>Completed<span>.</span></h1>
                    <p className="view-hero-sub">You've conquered {completedCount} task{completedCount !== 1 ? "s" : ""}. That's {progress}% of your total!</p>
                  </div>
                </div>
                <div className="done-stats-row">
                  <div className="done-stat"><strong>{completedCount}</strong><span>Done</span></div>
                  <div className="done-stat-divider" />
                  <div className="done-stat"><strong>{progress}%</strong><span>Rate</span></div>
                  <div className="done-stat-divider" />
                  <div className="done-stat"><strong>{tasks.length}</strong><span>Total</span></div>
                </div>
              </section>
            ) : (
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL WORKSPACE</div>
                  <h1>Make today <span>count.</span></h1>
                  <p className="welcome-subtitle">Small steps, big momentum. Here's what's on your plate.</p>
                </div>
                <div className="date-chip"><CalendarDays size={16} /> {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
              </section>
            )}

            {apiError && <div className="api-error"><Activity size={17} /><span>{apiError}</span><button onClick={() => setApiError("")} aria-label="Dismiss error"><X size={16} /></button></div>}

            {filter !== "Open" && filter !== "Done" && (
            <section className="stats-grid" aria-label="Task summary">
              <div className="stat-card stat-total">
                <div className="stat-top"><span className="stat-icon purple"><ListTodo size={18} /></span><span className="stat-label">Total tasks</span></div>
                <div className="stat-number">{tasks.length}<span className="stat-unit"> tasks</span></div>
                <div className="stat-bottom"><span className="stat-note">Everything in one place</span><span className="stat-trend"><ArrowUpRight size={14} /> All time</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-top"><span className="stat-icon orange"><Clock3 size={18} /></span><span className="stat-label">Still to do</span></div>
                <div className="stat-number">{openCount}<span className="stat-unit"> tasks</span></div>
                <div className="stat-bottom"><span className="stat-note">One thing at a time</span><span className="mini-pill open-pill">Open</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-top"><span className="stat-icon green"><CheckCheck size={18} /></span><span className="stat-label">Completed</span></div>
                <div className="stat-number">{completedCount}<span className="stat-unit"> tasks</span></div>
                <div className="stat-bottom"><span className="stat-note">Look at you go!</span><span className="mini-pill done-pill">{progress}% done</span></div>
              </div>
            </section>
            )}

            <section className="tasks-section">
              <div className="section-heading">
                <div>
                  <div className="section-title-row"><h2>{filter === "Open" ? "Tasks to complete" : filter === "Done" ? "Finished tasks" : "Your tasks"}</h2><span className="task-count">{visibleTasks.length}</span></div>
                  <p>{filter === "Open" ? "Focus on the next one — you're making progress." : filter === "Done" ? "Every completed task is a win. Here's your track record." : "Keep your focus on what matters most."}</p>
                </div>
                <div className="section-actions">
                  <button className="filter-button" onClick={() => setMenuOpen((value) => !value)}><Filter size={16} /> Filter <ChevronDown size={15} /></button>
                  {menuOpen && <div className="filter-menu">{["All tasks", "Open", "Done"].map((item) => <button key={item} onClick={() => { setFilter(item); setMenuOpen(false); }} className={filter === item ? "selected" : ""}>{item}{filter === item && <Check size={15} />}</button>)}</div>}
                  <button className="primary-button" onClick={handleOpenComposer}><Plus size={18} /> Add task</button>
                </div>
              </div>

              {showComposer && (
                <form className="task-composer" onSubmit={addTask}>
                  <div className="composer-input-wrap">
                    <Plus size={18} />
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="What needs to get done?"
                      aria-label="New task title"
                      maxLength={180}
                    />
                  </div>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="composer-date-input"
                    aria-label="Scheduled date"
                    title="Scheduled date (optional)"
                  />
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} aria-label="Task priority">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                  <button type="submit" className="primary-button" disabled={!newTitle.trim()}><Plus size={17} /> Create</button>
                  <button type="button" className="icon-button" onClick={() => { setShowComposer(false); setNewTitle(""); setNewDueDate(""); }} aria-label="Cancel"><X size={18} /></button>
                </form>
              )}

              <div className="task-list">
                <div className="task-list-header">
                  <span />
                  <span>TASK NAME</span>
                  <span>PRIORITY</span>
                  <span>STATUS</span>
                  <span />
                </div>
                {loading ? (
                  <div className="empty-state"><div className="empty-icon"><Activity size={22} /></div><h3>Loading your tasks...</h3><p>Connecting to your workspace.</p></div>
                ) : visibleTasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><ListTodo size={23} /></div>
                    <h3>{searchTerm ? "No matching tasks" : "Nothing here just yet"}</h3>
                    <p>{searchTerm ? "Try another search term." : "Add a task and make your next step count."}</p>
                    {!searchTerm && <button className="text-button" onClick={handleOpenComposer}><Plus size={16} /> Create your first task</button>}
                  </div>
                ) : visibleTasks.map((task) => (
                  <article className={`task-row ${task.completed ? "task-completed" : ""}`} key={task.id}>
                    <button className={`task-checkbox ${task.completed ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label={task.completed ? `Mark ${task.title} as open` : `Mark ${task.title} as done`}>{task.completed && <Check size={14} strokeWidth={3} />}</button>
                    <div className="task-main">
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <span className="task-title">{task.title}</span>
                        {task.due_date && (
                          <span className="task-due-badge" title={`Scheduled for ${task.due_date}`}>
                            <CalendarDays size={11} /> {formatDisplayDate(task.due_date)}
                          </span>
                        )}
                      </div>
                      <span className="task-created">{task.completed ? "Completed" : "Added to your list"}</span>
                    </div>
                    <div><span className={`priority priority-${(task.priority || "Medium").toLowerCase()}`}><span />{task.priority || "Medium"}</span></div>
                    <div><span className={`status ${task.completed ? "status-done" : "status-open"}`}><span />{task.completed ? "Done" : "Open"}</span></div>
                    <div className="task-row-menu"><button className="icon-button delete-button" onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={16} /></button></div>
                  </article>
                ))}
              </div>
              <div className="list-footer"><span>Showing <strong>{visibleTasks.length}</strong> of <strong>{tasks.length}</strong> tasks</span><span className="footer-sync"><span className="sync-dot" /> {API_URL ? "API mode" : "Saved in this browser"}</span></div>
            </section>

            {filter !== "Open" && filter !== "Done" && (
              <section className="focus-banner">
                <div className="focus-art"><div className="focus-art-circle"><Zap size={22} fill="currentColor" /></div><span className="sparkle sparkle-one">✦</span><span className="sparkle sparkle-two">✧</span></div>
                <div className="focus-copy"><strong>Progress over perfection.</strong><span>You've got this. Focus on the next small step, not the whole staircase.</span></div>
                <button onClick={() => { setFilter("Open"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="focus-link">Focus on open tasks <ArrowUpRight size={16} /></button>
              </section>
            )}

            <footer className="page-footer"><span>© 2026 TaskFlow</span><span><CircleHelp size={14} /> Made for a more focused day</span></footer>
          </div>
        )}
      </main>
      {notice && <div className="toast"><span className="toast-check"><Check size={15} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

export default App;
