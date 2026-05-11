import { useMemo, useState } from "react";
import { feedbackOptions, modeMap } from "../data/appData";
import type {
  HistoryItem,
  RecommendMode,
  RecommendResult,
} from "../data/appData";
import {
  loadCurrentUser,
  loadLocalHistory,
  loadMenu,
  loadPreferences,
  saveLocalHistory,
} from "../lib/storage";

function Recommend() {
  const [mode, setMode] = useState<RecommendMode>("fun");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const menuText = loadMenu();
  const preferences = loadPreferences();
  const currentUser = loadCurrentUser();

  const menuList = useMemo(() => {
    return menuText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [menuText]);

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  };

  const handleRecommend = async () => {
    if (menuList.length === 0) {
      alert("请先到“今日菜单”页面录入菜单。");
      return;
    }

    setLoading(true);
    setSelectedFeedback([]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/recommend/today", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu: menuList,
          preference: {
            spicy: preferences.spicy,
            health: preferences.health,
            price: preferences.price,
            freshness: preferences.freshness,
            fullness: preferences.fullness,
            mode,
            region: "四川",
            taste_region: preferences.tasteRegion,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("推荐失败");
      }

      const data: RecommendResult = await response.json();
      setResult(data);
    } catch {
      alert("后端连接失败，请确认 FastAPI 后端已经启动。");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedback = (item: string) => {
    setSelectedFeedback((prev) => {
      if (prev.includes(item)) {
        return prev.filter((value) => value !== item);
      }

      return [...prev, item];
    });
  };

  const handleChoose = async () => {
    if (!result?.dish) {
      alert("请先生成推荐结果。");
      return;
    }

    const localItem: HistoryItem = {
      id: String(Date.now()),
      dish: result.dish,
      mode: result.mode,
      reason: result.reason,
      score: result.score,
      feedback: selectedFeedback,
      createdAt: new Date().toLocaleString(),
    };

    try {
      await fetch("http://127.0.0.1:8000/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser?.id ?? 0,
          dish: localItem.dish,
          mode: localItem.mode,
          reason: localItem.reason,
          score: localItem.score,
          feedback: localItem.feedback,
        }),
      });
    } catch {
      const oldHistory = loadLocalHistory();
      saveLocalHistory([localItem, ...oldHistory].slice(0, 20));
    }

    const oldHistory = loadLocalHistory();
    saveLocalHistory([localItem, ...oldHistory].slice(0, 20));
    showMessage("已保存到历史记录。");
  };

  return (
    <section className="page-stack">
      {message && <div className="toast">{message}</div>}

      <div className="recommend-layout">
        <div className="section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Mode</p>
              <h2>选择今天的推荐模式</h2>
            </div>

            <span className="pill">{menuList.length} 个候选饭餐</span>
          </div>

          <div className="mode-grid">
            {(Object.keys(modeMap) as RecommendMode[]).map((key) => (
              <button
                key={key}
                className={mode === key ? "mode-card selected" : "mode-card"}
                onClick={() => setMode(key)}
              >
                <span>{modeMap[key].emoji}</span>
                <strong>{modeMap[key].label}</strong>
                <small>{modeMap[key].desc}</small>
              </button>
            ))}
          </div>

          <button className="primary-wide" onClick={handleRecommend}>
            {loading ? "正在分析今日菜单..." : "生成今日推荐"}
          </button>
        </div>

        <div className="section-card result-side">
          {!result ? (
            <div className="empty-state">
              <span>🍽️</span>
              <h3>还没有推荐结果</h3>
              <p>选择推荐模式后，点击生成今日推荐。</p>
            </div>
          ) : (
            <div className="result-card">
              <p>今天可以吃</p>
              <h2>{result.dish}</h2>

              {preferences.showReason && <span>{result.reason}</span>}

              <div className="feedback-box">
                <p>吃完可以选择反馈标签</p>

                <div className="feedback-tags">
                  {feedbackOptions.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleFeedback(item)}
                      className={
                        selectedFeedback.includes(item)
                          ? "feedback-tag active"
                          : "feedback-tag"
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn" onClick={handleChoose}>
                  我就吃这个
                </button>

                <button className="outline-btn" onClick={handleRecommend}>
                  再换一个
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Recommend;