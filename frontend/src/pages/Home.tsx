import { Link } from "react-router";
import { loadLocalHistory, loadMenu, loadPreferences } from "../lib/storage";

function Home() {
  const menuCount = loadMenu()
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean).length;

  const historyCount = loadLocalHistory().length;
  const preferences = loadPreferences();

  return (
    <section className="page-stack">
      <div className="home-hero">
        <div>
          <div className="eyebrow">
            <span className="pulse-dot" />
            面向大学生的智能饮食推荐系统
          </div>

          <h2>
            不知道吃什么？
            <br />
            让系统替你做决定。
          </h2>

          <p>
            根据今日菜单、饮食偏好、推荐模式、反馈记录和简单健康倾向，
            为你生成今天适合吃的一餐。
          </p>

          <div className="hero-actions">
            <Link to="/recommend" className="primary-large">
              立即开始推荐
            </Link>
            <Link to="/menu" className="secondary-large">
              先录入菜单
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="food-orb">🍜</div>
          <div className="floating-card card-a">
            <span>今日候选</span>
            <strong>{menuCount}</strong>
          </div>
          <div className="floating-card card-b">
            <span>健康权重</span>
            <strong>{preferences.health}</strong>
          </div>
          <div className="floating-card card-c">
            <span>历史记录</span>
            <strong>{historyCount}</strong>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        <Link to="/recommend" className="feature-card">
          <span>✨</span>
          <h3>今日推荐</h3>
          <p>根据推荐模式和偏好权重，从今日菜单中选出最合适的一餐。</p>
        </Link>

        <Link to="/menu" className="feature-card">
          <span>🍱</span>
          <h3>今日菜单</h3>
          <p>手动输入食堂今日可能供应的饭餐，后续可接入 OCR 菜单识别。</p>
        </Link>

        <Link to="/preferences" className="feature-card">
          <span>⚙️</span>
          <h3>偏好设置</h3>
          <p>设置辣度、健康、价格、饱腹感、新鲜感和南北方饮食倾向。</p>
        </Link>

        <Link to="/history" className="feature-card">
          <span>🕒</span>
          <h3>历史记录</h3>
          <p>查看最近选择和吃后反馈，后期可用于优化推荐模型。</p>
        </Link>
      </div>
    </section>
  );
}

export default Home;