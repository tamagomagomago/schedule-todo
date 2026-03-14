import React, { useState, useEffect } from "react";

const STORAGE_KEY = "couple-todo-list";

function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("partner1");
  const [isBtnHover, setIsBtnHover] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTask = {
      id: Date.now(),
      text: trimmed,
      owner,
      done: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setText("");
  };

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
            }
          : t
      )
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const ownerLabel = (o) => (o === "partner1" ? "Hiroto" : "Marina");

  const styles = {
    page: {
      minHeight: "100vh",
      margin: 0,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Noto Sans JP", sans-serif',
      background:
        "radial-gradient(circle at top left, #f9e4ff, #f0f4ff 40%, #ffffff)",
      color: "#333",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box",
    },
    card: {
      width: "100%",
      maxWidth: "640px",
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 18px 45px rgba(0,0,0,0.09)",
      borderRadius: "20px",
      padding: "24px 24px 20px",
      boxSizing: "border-box",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.8)",
    },
    titleArea: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    title: {
      fontSize: "22px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#333",
    },
    subtitle: {
      fontSize: "12px",
      color: "#999",
    },
    heart: {
      fontSize: "22px",
      color: "#ff7aa2",
    },
    form: {
      display: "flex",
      gap: "8px",
      marginTop: "8px",
      marginBottom: "16px",
      flexWrap: "wrap",
    },
    select: {
      borderRadius: "999px",
      border: "1px solid #ddd",
      padding: "8px 12px",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "#fff",
    },
    input: {
      flex: 1,
      minWidth: "160px",
      borderRadius: "999px",
      border: "1px solid #ddd",
      padding: "8px 14px",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "#fff",
    },
    button: {
      borderRadius: "999px",
      border: "none",
      padding: "9px 18px",
      fontSize: "14px",
      fontWeight: 600,
      background:
        "linear-gradient(135deg, #ff8fb1, #ffb88f 40%, #ffd39f 80%)",
      color: "#fff",
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: "0 8px 20px rgba(255,143,177,0.45)",
      transition: "transform 0.08s ease, box-shadow 0.08s ease, filter 0.08s",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 12px 26px rgba(255,143,177,0.55)",
      filter: "brightness(1.02)",
    },
    metaRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
      fontSize: "12px",
      color: "#999",
    },
    pillWrapper: {
      display: "flex",
      gap: "8px",
      fontSize: "11px",
    },
    pillA: {
      padding: "3px 10px",
      borderRadius: "999px",
      border: "1px solid #ffd2e3",
      backgroundColor: "#fff5fa",
      color: "#ff7aa2",
    },
    pillB: {
      padding: "3px 10px",
      borderRadius: "999px",
      border: "1px solid #c7dcff",
      backgroundColor: "#f1f5ff",
      color: "#5b7cff",
    },
    counter: {
      fontSize: "11px",
      padding: "3px 10px",
      borderRadius: "999px",
      backgroundColor: "#f5f5f7",
      border: "1px solid #e3e3e8",
      color: "#777",
    },
    list: {
      listStyle: "none",
      margin: 0,
      marginTop: "8px",
      padding: 0,
      maxHeight: "420px",
      overflowY: "auto",
    },
    item: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      padding: "10px 10px 9px 6px",
      borderRadius: "14px",
      backgroundColor: "#fafbff",
      border: "1px solid #edf0ff",
      marginBottom: "6px",
    },
    itemLeft: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: 1,
      minWidth: 0,
    },
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer",
      accentColor: "#ff7aa2",
    },
    badgeA: {
      fontSize: "11px",
      padding: "3px 9px",
      borderRadius: "999px",
      backgroundColor: "#ffe3f0",
      color: "#ff5e9a",
      flexShrink: 0,
    },
    badgeB: {
      fontSize: "11px",
      padding: "3px 9px",
      borderRadius: "999px",
      backgroundColor: "#e0e6ff",
      color: "#4b63ff",
      flexShrink: 0,
    },
    text: (done) => ({
      fontSize: "14px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: done ? "#aaa" : "#333",
      textDecoration: done ? "line-through" : "none",
    }),
    deleteButton: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#ccc",
      fontSize: "16px",
      padding: "0 2px",
      flexShrink: 0,
    },
    emptyState: {
      fontSize: "13px",
      color: "#b5b5c0",
      textAlign: "center",
      padding: "16px 4px 8px",
    },
  };

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleArea}>
          <div>
            <div style={styles.title}>Couple Bucket List</div>
            <div style={styles.subtitle}>
              二人だけの「やりたいこと」を集めよう
            </div>
          </div>
          <div style={styles.heart}>♡</div>
        </div>

        <form style={styles.form} onSubmit={handleAdd}>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            style={styles.select}
          >
            <option value="partner1">Hiroto のやりたいこと</option>
            <option value="partner2">Marina のやりたいこと</option>
          </select>
          <input
            type="text"
            placeholder="例：一緒に京都旅行に行く"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={styles.input}
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isBtnHover ? styles.buttonHover : {}),
            }}
            onMouseEnter={() => setIsBtnHover(true)}
            onMouseLeave={() => setIsBtnHover(false)}
          >
            追加
          </button>
        </form>

        <div style={styles.metaRow}>
          <div style={styles.pillWrapper}>
            <span style={styles.pillA}>Hiroto</span>
            <span style={styles.pillB}>Marina</span>
          </div>
          <span style={styles.counter}>
            {doneCount} / {total} 達成
          </span>
        </div>

        <ul style={styles.list}>
          {tasks.length === 0 && (
            <li style={styles.emptyState}>
              まだ何もありません。まずは一つ目の「やりたい」を追加してみましょう。
            </li>
          )}
          {tasks.map((task) => (
            <li key={task.id} style={styles.item}>
              <div style={styles.itemLeft}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={task.done}
                  onChange={() => toggleDone(task.id)}
                />
                <span
                  style={
                    task.owner === "partner1" ? styles.badgeA : styles.badgeB
                  }
                >
                  {ownerLabel(task.owner)}
                </span>
                <span style={styles.text(task.done)}>{task.text}</span>
              </div>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                style={styles.deleteButton}
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
