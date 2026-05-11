import { useState } from "react";
import { useNavigate } from "react-router";
import { saveCurrentUser } from "../lib/storage";

type AuthMode = "login" | "register";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const submitAuth = async () => {
    if (!username.trim()) {
      alert("请输入用户名。");
      return;
    }

    if (!password.trim()) {
      alert("请输入密码。");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/${mode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "操作失败");
      }

      saveCurrentUser(data.user);
      showMessage(data.message || "操作成功");

      window.setTimeout(() => {
        navigate("/");
      }, 600);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("请求失败，请确认后端已启动。");
      }
    } finally {
      setLoading(false);
    }
  };

  const enterGuestMode = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/guest", {
        method: "POST",
      });

      const data = await response.json();

      saveCurrentUser(data.user);
      showMessage("已进入游客模式");

      window.setTimeout(() => {
        navigate("/");
      }, 600);
    } catch {
      saveCurrentUser({
        id: 0,
        username: "游客用户",
        isGuest: true,
      });

      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack">
      {message && <div className="toast">{message}</div>}

      <div className="login-card">
        <p className="section-kicker">Account</p>

        <h2>{mode === "login" ? "登录账号" : "注册账号"}</h2>

        <p className="muted">
          登录后可以保存你的偏好、菜单和历史记录。第一版先做轻量账号系统。
        </p>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => setMode("login")}
          >
            登录
          </button>

          <button
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>

        <input
          className="text-input"
          placeholder="用户名"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <input
          className="text-input"
          placeholder="密码，至少 6 位"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="primary-wide" onClick={submitAuth}>
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
        </button>

        <button className="outline-wide" onClick={enterGuestMode}>
          游客模式进入
        </button>
      </div>
    </section>
  );
}

export default Login;