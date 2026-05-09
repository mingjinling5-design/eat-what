import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Recommend from "./pages/Recommend";
import Menu from "./pages/Menu";
import Preferences from "./pages/Preferences";
import History from "./pages/History";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/history" element={<History />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;