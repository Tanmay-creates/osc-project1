import { useState, useRef } from "react";
import {
  ArrowUpDown,
  Check,
  CheckCheck,
  Download,
  Flame,
  Layers,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function SettingsView({
  theme,
  setTheme,
  defaultPriority,
  setDefaultPriority,
  sortOrder,
  setSortOrder,
  defaultDueDate,
  setDefaultDueDate,
  soundEnabled,
  setSoundEnabled,
  tasks,
  onClearCompleted,
  onResetTasks,
  onImportTasks,
  showNotice,
  isApiMode,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  // Export tasks as JSON file
  function handleExport() {
    try {
      const dataStr = JSON.stringify(tasks, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      link.href = url;
      link.download = `taskflow-export-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotice(`Exported ${tasks.length} tasks successfully`);
    } catch {
      showNotice("Could not export tasks");
    }
  }

  // Handle file import
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          showNotice(`Imported ${parsed.length} tasks successfully`);
        } else if (parsed && Array.isArray(parsed.tasks)) {
          onImportTasks(parsed.tasks);
          showNotice(`Imported ${parsed.tasks.length} tasks successfully`);
        } else {
          showNotice("Invalid file format. Expected a JSON array of tasks.");
        }
      } catch {
        showNotice("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again if needed
    e.target.value = "";
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="settings-view-container">
      {/* Welcome / Header */}
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> WORKSPACE PREFERENCES
          </div>
          <h1>
            Workspace <span>settings.</span>
          </h1>
          <p className="welcome-subtitle">
            Customize your visual theme, set task defaults, and manage your data.
          </p>
        </div>
        <div className="date-chip">
          <ShieldCheck size={16} />
          <span>{isApiMode ? "FastAPI Connected" : "Local Demo Storage"}</span>
        </div>
      </section>

      <div className="settings-grid">
        {/* Card 1: Appearance & Theme */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon purple">
              <Sun size={18} />
            </div>
            <div>
              <h3>Appearance & Theme</h3>
              <p>Choose how TaskFlow looks on your screen.</p>
            </div>
          </div>

          <div className="theme-selector-grid">
            <button
              type="button"
              className={`theme-option-card ${theme === "light" ? "active" : ""}`}
              onClick={() => {
                setTheme("light");
                showNotice("Light mode activated");
              }}
            >
              <div className="theme-icon-wrap light-icon">
                <Sun size={20} />
              </div>
              <div className="theme-option-info">
                <strong>Light</strong>
                <span>Crisp & clean light palette</span>
              </div>
              {theme === "light" && <Check size={16} className="theme-check" />}
            </button>

            <button
              type="button"
              className={`theme-option-card ${theme === "dark" ? "active" : ""}`}
              onClick={() => {
                setTheme("dark");
                showNotice("Dark mode activated");
              }}
            >
              <div className="theme-icon-wrap dark-icon">
                <Moon size={20} />
              </div>
              <div className="theme-option-info">
                <strong>Dark</strong>
                <span>Sleek, low-glare dark theme</span>
              </div>
              {theme === "dark" && <Check size={16} className="theme-check" />}
            </button>

            <button
              type="button"
              className={`theme-option-card ${theme === "system" ? "active" : ""}`}
              onClick={() => {
                setTheme("system");
                showNotice("Matching system appearance");
              }}
            >
              <div className="theme-icon-wrap system-icon">
                <Monitor size={20} />
              </div>
              <div className="theme-option-info">
                <strong>System</strong>
                <span>Syncs with your device theme</span>
              </div>
              {theme === "system" && <Check size={16} className="theme-check" />}
            </button>
          </div>
        </div>

        {/* Card 2: Workflow & Task Defaults */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon orange">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3>Workflow & Task Defaults</h3>
              <p>Configure default behavior when creating and sorting tasks.</p>
            </div>
          </div>

          <div className="settings-rows-list">
            {/* Setting: Default Priority */}
            <div className="settings-row">
              <div className="settings-row-info">
                <strong>Default Priority</strong>
                <span>Pre-selected priority when adding a new task</span>
              </div>
              <div className="priority-pills-selector">
                {["High", "Medium", "Low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-pill-btn priority-${p.toLowerCase()} ${
                      defaultPriority === p ? "selected" : ""
                    }`}
                    onClick={() => {
                      setDefaultPriority(p);
                      showNotice(`Default priority set to ${p}`);
                    }}
                  >
                    <span />
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Setting: Task Sorting Order */}
            <div className="settings-row">
              <div className="settings-row-info">
                <strong>Dashboard Sort Order</strong>
                <span>Determines how tasks are ordered in the dashboard list</span>
              </div>
              <select
                className="settings-select"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  showNotice("Sort order updated");
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="due_date">Due Date (Earliest First)</option>
              </select>
            </div>

            {/* Setting: Default Due Date */}
            <div className="settings-row">
              <div className="settings-row-info">
                <strong>Default Due Date</strong>
                <span>Pre-fill a scheduled date in the task composer</span>
              </div>
              <select
                className="settings-select"
                value={defaultDueDate}
                onChange={(e) => {
                  setDefaultDueDate(e.target.value);
                  showNotice("Default due date preference updated");
                }}
              >
                <option value="none">None (No date)</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
              </select>
            </div>

            {/* Setting: Sound Feedback */}
            <div className="settings-row">
              <div className="settings-row-info">
                <strong>Completion Clapping Sound</strong>
                <span>Play celebratory clapping applause when completing a task</span>
              </div>
              <button
                type="button"
                className={`sound-toggle-btn ${soundEnabled ? "sound-on" : ""}`}
                onClick={() => {
                  setSoundEnabled((prev) => !prev);
                  showNotice(
                    !soundEnabled
                      ? "Completion sound enabled"
                      : "Completion sound muted"
                  );
                }}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 size={16} /> <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={16} /> <span>Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Data & Storage Management */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon green">
              <Layers size={18} />
            </div>
            <div>
              <h3>Data & Backup</h3>
              <p>Export your tasks, import backups, or manage stored data.</p>
            </div>
          </div>

          <div className="data-stats-bar">
            <div className="data-stat-col">
              <span className="data-stat-val">{tasks.length}</span>
              <span className="data-stat-lbl">Total Tasks</span>
            </div>
            <div className="data-stat-col">
              <span className="data-stat-val">{tasks.length - completedCount}</span>
              <span className="data-stat-lbl">Open Tasks</span>
            </div>
            <div className="data-stat-col">
              <span className="data-stat-val">{completedCount}</span>
              <span className="data-stat-lbl">Completed</span>
            </div>
            <div className="data-stat-col">
              <span className="data-stat-val">{isApiMode ? "FastAPI" : "Browser"}</span>
              <span className="data-stat-lbl">Storage Mode</span>
            </div>
          </div>

          <div className="data-actions-grid">
            {/* Export */}
            <button
              type="button"
              className="filter-button data-action-btn"
              onClick={handleExport}
            >
              <Download size={16} />
              <span>Export Tasks (JSON)</span>
            </button>

            {/* Import */}
            <button
              type="button"
              className="filter-button data-action-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>Import Tasks (JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* Clear Completed */}
            {confirmClear ? (
              <div className="confirm-row">
                <span>Clear {completedCount} completed tasks?</span>
                <button
                  type="button"
                  className="danger-btn-small"
                  onClick={() => {
                    onClearCompleted();
                    setConfirmClear(false);
                    showNotice(`Cleared ${completedCount} completed tasks`);
                  }}
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  className="cancel-btn-small"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="filter-button data-action-btn delete-action"
                disabled={completedCount === 0}
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={16} />
                <span>Clear Completed ({completedCount})</span>
              </button>
            )}

            {/* Reset to Sample Tasks */}
            {confirmReset ? (
              <div className="confirm-row">
                <span>Reset tasks to default starter set?</span>
                <button
                  type="button"
                  className="danger-btn-small"
                  onClick={() => {
                    onResetTasks();
                    setConfirmReset(false);
                    showNotice("Reset to default starter tasks");
                  }}
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  className="cancel-btn-small"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="filter-button data-action-btn reset-action"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw size={16} />
                <span>Reset to Sample Tasks</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Tips & Info */}
        <div className="settings-focus-banner">
          <div className="focus-art">
            <div className="focus-art-circle">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="focus-copy">
            <strong>Pro Tip: Dark mode reduces eye strain during late focus sessions.</strong>
            <span>
              All settings are automatically saved and restored whenever you visit TaskFlow.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
