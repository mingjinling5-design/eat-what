import { useEffect, useState } from "react";
import { modeMap } from "../data/appData";
import type { HistoryItem, RecommendMode } from "../data/appData";
import {
  clearLocalHistory,
  loadCurrentUser,
  loadLocalHistory,
  saveLocalHistory,
} from "../lib/storage";

function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  const currentUser = loadCurrentUser();
  const userId = currentUser?.id ?? 0;

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/history?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error("读取失败");
      }

      const data = await response.json();
      setHistory(data);
      saveLocalHistory(data);
    } catch {
      setHistory(loadLocalHistory());
    }
  };

  const clearHistory = async () => {
    const ok = confirm("确定清空当前用户的历史记录吗？");

    if (!ok) {
      return;
    }

    try {
      await fetch(`http://127.0.0.1:8000/api/history?user_id=${userId}`, {
        method: "DELETE",
      });
    } catch {
      // 后端失败时只清本地
    }

    clearLocalHistory();
    setHistory([]);
    showMessage("历史记录已清空。");
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <section className="page-stack">
      {message && <div className="toast">{message}</div>}

      <div className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">History</p>
            <h2>最近选择记录</h2>

            {currentUser && (
              <p className="muted">
                当前用户：{currentUser.isGuest ? "游客" : currentUser.username}
              </p>
            )}
          </div>

          <div className="form-actions inline">
            <button className="outline-btn" onClick={loadHistory}>
              刷新
            </button>

            <button className="danger-btn" onClick={clearHistory}>
              清空
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <span>🕒</span>
            <h3>暂无历史记录</h3>
            <p>推荐后点击“我就吃这个”，记录会显示在这里。</p>
          </div>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="history-top">
                  <strong>{item.dish}</strong>
                  <span>{item.score ? `${item.score} 分` : "未评分"}</span>
                </div>

                <p>{item.createdAt}</p>

                <small>
                  {modeMap[item.mode as RecommendMode]?.label || "推荐模式"}
                </small>

                {item.feedback.length > 0 && (
                  <div className="chip-list">
                    {item.feedback.map((tag) => (
                      <em className="feedback-chip" key={tag}>
                        {tag}
                      </em>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default History;