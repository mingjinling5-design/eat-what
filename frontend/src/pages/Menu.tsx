import { useMemo, useState } from "react";
import { loadMenu, saveMenu } from "../lib/storage";

function Menu() {
  const [menuText, setMenuText] = useState(() => loadMenu());
  const [message, setMessage] = useState("");

  const menuList = useMemo(() => {
    return menuText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [menuText]);

  const handleSave = () => {
    saveMenu(menuText);
    setMessage("今日菜单已保存。");

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
            <p className="section-kicker">Step 01</p>
            <h2>录入今日菜单</h2>
          </div>
          <span className="pill">{menuList.length} 个候选</span>
        </div>

        <textarea
          value={menuText}
          onChange={(event) => setMenuText(event.target.value)}
          placeholder="每行输入一个菜名，例如：黄焖鸡米饭"
          rows={14}
        />

        <div className="form-actions">
          <button className="primary-btn" onClick={handleSave}>
            保存今日菜单
          </button>
          <button
            className="outline-btn"
            onClick={() => {
              setMenuText("");
              saveMenu("");
            }}
          >
            清空菜单
          </button>
        </div>
      </div>

      <div className="split-grid">
        <div className="section-card">
          <p className="section-kicker">Preview</p>
          <h3>菜单预览</h3>

          {menuList.length === 0 ? (
            <p className="muted">暂无菜单，请先输入。</p>
          ) : (
            <div className="chip-list">
              {menuList.map((item) => (
                <span key={item} className="food-chip">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="section-card soft">
          <p className="section-kicker">Next</p>
          <h3>后续扩展</h3>
          <p className="muted">
            下一阶段可以加入上传菜单图片、OCR 识别、管理员录入、食堂窗口分类和数据库保存。
          </p>
        </div>
      </div>
    </section>
  );
}

export default Menu;