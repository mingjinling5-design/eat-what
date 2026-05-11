import { Link } from "react-router";

function Login() {
  return (
    <section className="page-stack">
      <div className="login-card">
        <p className="section-kicker">Account</p>
        <h2>登录或游客体验</h2>
        <p className="muted">
          第一版先做静态入口，后面再接注册登录、用户偏好云端保存和多用户数据。
        </p>

        <input className="text-input" placeholder="手机号 / 邮箱 / 用户名" />
        <input className="text-input" placeholder="密码" type="password" />

        <button className="primary-wide">登录</button>
        <button className="outline-wide">注册账号</button>

        <Link to="/recommend" className="text-link">
          先用游客模式体验 →
        </Link>
      </div>
    </section>
  );
}

export default Login;