import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getTodayKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatReadableDate(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskDate(task) {
  if (!task || !task.due_date) return null;
  return String(task.due_date).split("T")[0];
}

export default function CalendarView({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  searchTerm = "",
  showNotice,
}) {
  const todayKey = useMemo(() => getTodayKey(), []);
  const todayDate = useMemo(() => new Date(), []);

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Quick task creation for the selected date
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks if search term is active
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(term));
  }, [tasks, searchTerm]);

  // Map tasks by date key
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of filteredTasks) {
      const key = getTaskDate(task);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [filteredTasks]);

  // Unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => !getTaskDate(t));
  }, [filteredTasks]);

  // Selected date tasks
  const selectedDayTasks = useMemo(() => {
    return tasksByDate[selectedDateKey] || [];
  }, [tasksByDate, selectedDateKey]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    // Correct month lengths including leap years
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const key = toDateKey(prevYear, prevMonth, dayNum);
      days.push({
        dayNum,
        dateKey: key,
        isCurrentMonth: false,
        year: prevYear,
        month: prevMonth,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const key = toDateKey(currentYear, currentMonth, day);
      days.push({
        dayNum: day,
        dateKey: key,
        isCurrentMonth: true,
        year: currentYear,
        month: currentMonth,
      });
    }

    // Trailing days from next month to complete the grid (multiples of 7, 35 or 42 cells)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const key = toDateKey(nextYear, nextMonth, day);
      days.push({
        dayNum: day,
        dateKey: key,
        isCurrentMonth: false,
        year: nextYear,
        month: nextMonth,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Month navigation
  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleGoToToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateKey(todayKey);
  }

  // Quick task submit for the selected date
  async function handleQuickAddSubmit(e) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title,
        priority: quickPriority,
        due_date: selectedDateKey,
      });
      setQuickTitle("");
      setShowQuickAdd(false);
      if (showNotice) showNotice("Task scheduled for selected date");
    } finally {
      setIsSubmitting(false);
    }
  }

  const monthLabel = useMemo(() => {
    return new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentYear, currentMonth]);

  const selectedDateIsToday = selectedDateKey === todayKey;

  // Monthly stats
  const currentMonthTaskCount = useMemo(() => {
    return calendarDays
      .filter((d) => d.isCurrentMonth)
      .reduce((acc, d) => acc + (tasksByDate[d.dateKey]?.length || 0), 0);
  }, [calendarDays, tasksByDate]);

  return (
    <div className="calendar-view-container">
      {/* Top Banner / Welcome Row */}
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> SCHEDULE & MILESTONES
          </div>
          <h1>
            Plan your <span>month.</span>
          </h1>
          <p className="welcome-subtitle">
            Visualize deadlines, track commitments, and stay organized day by day.
          </p>
        </div>
        <div className="date-chip">
          <CalendarDays size={16} />
          <span>{monthLabel}</span>
          <span className="task-count" title="Tasks scheduled this month">
            {currentMonthTaskCount}
          </span>
        </div>
      </section>

      {/* Main Calendar Layout */}
      <div className="calendar-layout">
        {/* Left / Main Calendar Grid Card */}
        <div className="calendar-main-card">
          {/* Calendar Header with Navigation */}
          <div className="calendar-nav-bar">
            <div className="calendar-title-wrap">
              <h2>{monthLabel}</h2>
              <span className="calendar-month-badge">
                {currentMonthTaskCount} {currentMonthTaskCount === 1 ? "task" : "tasks"}
              </span>
            </div>

            <div className="calendar-nav-controls">
              <button
                type="button"
                className="filter-button today-btn"
                onClick={handleGoToToday}
                title="Jump to today"
              >
                <RotateCcw size={14} />
                <span>Today</span>
              </button>
              <div className="nav-arrow-group">
                <button
                  type="button"
                  className="icon-button calendar-arrow-btn"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-button calendar-arrow-btn"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="calendar-weekdays-row">
            {WEEKDAYS.map((day) => (
              <div key={day} className="calendar-weekday-header">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="calendar-grid">
            {calendarDays.map((cell) => {
              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDateKey;
              const cellTasks = tasksByDate[cell.dateKey] || [];
              const hasTasks = cellTasks.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  className={`calendar-cell ${
                    !cell.isCurrentMonth ? "other-month" : ""
                  } ${isToday ? "is-today" : ""} ${
                    isSelected ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedDateKey(cell.dateKey);
                    // If clicked day is from another month, navigate to that month
                    if (!cell.isCurrentMonth) {
                      setCurrentMonth(cell.month);
                      setCurrentYear(cell.year);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedDateKey(cell.dateKey);
                    }
                  }}
                  aria-label={`${formatReadableDate(cell.dateKey)}, ${cellTasks.length} tasks`}
                >
                  <div className="cell-top-bar">
                    <span className="cell-day-number">
                      {cell.dayNum}
                      {isToday && <span className="today-dot" title="Today" />}
                    </span>
                    {hasTasks && (
                      <span className="cell-task-counter" title={`${cellTasks.length} tasks`}>
                        {cellTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task preview chips */}
                  <div className="cell-task-previews">
                    {cellTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`cell-task-chip ${
                          task.completed ? "chip-completed" : ""
                        } chip-${(task.priority || "Medium").toLowerCase()}`}
                        title={`${task.title} (${task.priority})`}
                      >
                        <span className="chip-priority-dot" />
                        <span className="chip-title">{task.title}</span>
                      </div>
                    ))}
                    {cellTasks.length > 3 && (
                      <span className="cell-more-badge">
                        +{cellTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Selected Day Details Panel */}
        <aside className="calendar-side-panel">
          <div className="selected-day-card">
            <div className="selected-day-header">
              <div className="selected-day-title-wrap">
                <span className="selected-day-eyebrow">
                  {selectedDateIsToday ? "TODAY'S SCHEDULE" : "SELECTED DATE"}
                </span>
                <h3>{formatReadableDate(selectedDateKey)}</h3>
                <span className="selected-count-label">
                  {selectedDayTasks.length}{" "}
                  {selectedDayTasks.length === 1 ? "task scheduled" : "tasks scheduled"}
                </span>
              </div>
              <button
                type="button"
                className="primary-button add-for-date-btn"
                onClick={() => setShowQuickAdd((prev) => !prev)}
              >
                <Plus size={16} />
                <span>Add task</span>
              </button>
            </div>

            {/* Quick Task Composer for Selected Date */}
            {showQuickAdd && (
              <form className="quick-task-composer" onSubmit={handleQuickAddSubmit}>
                <div className="composer-input-wrap">
                  <Plus size={16} />
                  <input
                    autoFocus
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Task scheduled for this date..."
                    maxLength={180}
                    aria-label="Task title for selected date"
                  />
                </div>
                <div className="quick-composer-actions">
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value)}
                    aria-label="Priority"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={!quickTitle.trim() || isSubmitting}
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickTitle("");
                    }}
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Tasks for Selected Date */}
            <div className="selected-day-tasks-list">
              {selectedDayTasks.length === 0 ? (
                <div className="empty-state calendar-empty-state">
                  <div className="empty-icon">
                    <Clock3 size={22} />
                  </div>
                  <h3>No tasks scheduled</h3>
                  <p>
                    {selectedDateIsToday
                      ? "You have a clear schedule today! Enjoy the time or plan your next step."
                      : "Nothing is planned for this day. Click 'Add task' to schedule one."}
                  </p>
                  {!showQuickAdd && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setShowQuickAdd(true)}
                    >
                      <Plus size={15} /> Schedule a task for this date
                    </button>
                  )}
                </div>
              ) : (
                <div className="day-task-items">
                  {selectedDayTasks.map((task) => (
                    <article
                      key={task.id}
                      className={`day-task-card ${
                        task.completed ? "task-completed" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className={`task-checkbox ${
                          task.completed ? "checked" : ""
                        }`}
                        onClick={() => onToggleTask(task)}
                        aria-label={
                          task.completed
                            ? `Mark ${task.title} as open`
                            : `Mark ${task.title} as completed`
                        }
                      >
                        {task.completed && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="day-task-info">
                        <span className="task-title">{task.title}</span>
                        <div className="day-task-meta">
                          <span
                            className={`priority priority-${(
                              task.priority || "Medium"
                            ).toLowerCase()}`}
                          >
                            <span />
                            {task.priority || "Medium"}
                          </span>
                          <span
                            className={`status ${
                              task.completed ? "status-done" : "status-open"
                            }`}
                          >
                            <span />
                            {task.completed ? "Done" : "Open"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => onDeleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unscheduled Tasks Summary Banner */}
          {unscheduledTasks.length > 0 && (
            <div className="unscheduled-banner">
              <div className="unscheduled-header">
                <div className="unscheduled-icon">
                  <ListTodo size={16} />
                </div>
                <div>
                  <strong>{unscheduledTasks.length} unscheduled tasks</strong>
                  <p>Tasks without a set due date.</p>
                </div>
              </div>
              <div className="unscheduled-chips-scroll">
                {unscheduledTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="unscheduled-pill" title={t.title}>
                    <span
                      className={`priority-dot dot-${(
                        t.priority || "Medium"
                      ).toLowerCase()}`}
                    />
                    <span className="pill-text">{t.title}</span>
                  </div>
                ))}
                {unscheduledTasks.length > 5 && (
                  <span className="more-unscheduled">
                    +{unscheduledTasks.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Inspirational Focus Card */}
          <div className="calendar-focus-card">
            <div className="focus-art">
              <div className="focus-art-circle">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="focus-copy">
              <strong>Consistency is key.</strong>
              <span>
                Schedule tasks evenly across days to keep momentum steady and avoid burnout.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
