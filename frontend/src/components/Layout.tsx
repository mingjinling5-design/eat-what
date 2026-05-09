import { NavLink, Outlet, useLocation } from "react-router";

const navItems = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/recommend", label: "今日推荐", icon: "✨" },
  { to: "/menu", label: "今日菜单", icon: "🍱" },
  { to: "/preferences", label: "偏好设置", icon: "⚙️" },
  { to: "/history", label: "历史记录", icon: "🕒" },
  { to: "/admin", label: "管理后台", icon: "🧩" },
];

const pageTitleMap: Record<string, string> = {
  "/": "今天吃啥",
  "/recommend": "今日推荐",
  "/menu": "今日菜单",
  "/preferences": "偏好设置",
  "/history": "历史记录",
  "/login": "登录注册",
  "/admin": "管理后台",
};

function Layout() {
  const location = useLocation();
  const title = pageTitleMap[location.pathname] || "今天吃啥";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">吃</div>
          <div>
            <strong>今天吃啥</strong>
            <span>Campus Meal AI</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p>今日小目标</p>
          <strong>少纠结，多吃饭。</strong>
          <span>先做本校体验版，后期再升级小程序和 App。</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="topbar-kicker">Eat What System</p>
            <h1>{title}</h1>
          </div>

          <div className="topbar-actions">
            <NavLink to="/login" className="outline-btn">
              登录
            </NavLink>
            <NavLink to="/recommend" className="primary-btn">
              开始推荐
            </NavLink>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default Layout;