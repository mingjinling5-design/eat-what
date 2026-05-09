import { useState } from "react";
import { preferenceLabels } from "../data/appData";
import type {
  PreferenceKey,
  Preferences as PreferencesType,
} from "../data/appData";
import { loadPreferences, savePreferences } from "../lib/storage";

function Preferences() {
  const [preferences, setPreferences] = useState<PreferencesType>(() =>
    loadPreferences()
  );
  const [message, setMessage] = useState("");

  const updateNumber = (key: PreferenceKey, value: number) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSwitch = (key: keyof PreferencesType, value: boolean | string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
    setMessage("偏好设置已保存。");

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  };

  return (
    <section className="page-stack">
      {message && <div className="toast">{message}</div>}

      <div className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Preference</p>
            <h2>我的饮食偏好</h2>
          </div>
          <button className="primary-btn" onClick={handleSave}>
            保存偏好
          </button>
        </div>

        <div className="preference-grid">
          {(Object.keys(preferenceLabels) as PreferenceKey[]).map((key) => (
            <div className="setting-row" key={key}>
              <div>
                <strong>{preferenceLabels[key]}</strong>
                <p>当前权重：{preferences[key]}</p>
              </div>

              <input
                type="range"
                min="1"
                max="5"
                value={preferences[key]}
                onChange={(event) => updateNumber(key, Number(event.target.value))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="split-grid">
        <div className="section-card">
          <p className="section-kicker">Taste Region</p>
          <h3>饮食习惯倾向</h3>

          <select
            value={preferences.tasteRegion}
            onChange={(event) => updateSwitch("tasteRegion", event.target.value)}
            className="select-input"
          >
            <option>无明显倾向</option>
            <option>偏南方口味</option>
            <option>偏北方口味</option>
          </select>
        </div>

        <div className="section-card">
          <p className="section-kicker">Control</p>
          <h3>个性化开关</h3>

          <label className="switch-row">
            <span>
              <strong>显示推荐理由</strong>
              <p>推荐结果中展示为什么推荐这道菜。</p>
            </span>
            <input
              type="checkbox"
              checked={preferences.showReason}
              onChange={(event) => updateSwitch("showReason", event.target.checked)}
            />
          </label>

          <label className="switch-row">
            <span>
              <strong>健康提醒</strong>
              <p>对偏油、偏辣等情况做简单提醒。</p>
            </span>
            <input
              type="checkbox"
              checked={preferences.healthTip}
              onChange={(event) => updateSwitch("healthTip", event.target.checked)}
            />
          </label>

          <label className="switch-row">
            <span>
              <strong>智能学习</strong>
              <p>后期根据反馈自动调整推荐权重。</p>
            </span>
            <input
              type="checkbox"
              checked={preferences.smartLearning}
              onChange={(event) =>
                updateSwitch("smartLearning", event.target.checked)
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}

export default Preferences;