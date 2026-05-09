import { useEffect, useMemo, useState } from "react";
import { loadMenu, saveMenu } from "../lib/storage";

type UploadResult = {
  message: string;
  originalName: string;
  storedName: string;
  url: string;
  fullUrl: string;
};

function Menu() {
  const [menuText, setMenuText] = useState(() => loadMenu());
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageSize, setImageSize] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const menuList = useMemo(() => {
    return menuText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [menuText]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  };

  const handleSave = () => {
    saveMenu(menuText);
    showMessage("今日菜单已保存。");
  };

  const handleClear = () => {
    setMenuText("");
    saveMenu("");
    showMessage("菜单已清空。");
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件，例如 jpg、png、webp。");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeMB = file.size / 1024 / 1024;

    setImagePreview(previewUrl);
    setImageName(file.name);
    setImageSize(`${sizeMB.toFixed(2)} MB`);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/menu/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上传失败");
      }

      const data: UploadResult = await response.json();
      setUploadResult(data);
      showMessage("菜单图片已上传到后端。");
    } catch {
      showMessage("图片已预览，但后端上传失败。请确认 FastAPI 已启动。");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
    setImageName("");
    setImageSize("");
    setUploadResult(null);
    showMessage("图片预览已移除。");
  };

  const appendExampleMenu = () => {
    const demoText = [
      "番茄鸡蛋盖饭",
      "青椒肉丝盖饭",
      "麻辣香锅",
      "牛肉面",
      "鸡腿饭",
      "砂锅米线",
    ].join("\n");

    const nextText = menuText.trim()
      ? `${menuText.trim()}\n${demoText}`
      : demoText;

    setMenuText(nextText);
    saveMenu(nextText);
    showMessage("已加入示例菜单。");
  };

  return (
    <section className="page-stack">
      {message && <div className="toast">{message}</div>}

      <div className="menu-workspace">
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

            <button className="outline-btn" onClick={handleClear}>
              清空菜单
            </button>
          </div>
        </div>

        <div className="section-card upload-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Step 02</p>
              <h2>上传菜单图片</h2>
            </div>
            <span className="pill">{uploading ? "Uploading" : "Preview"}</span>
          </div>

          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleImageUpload(event.target.files?.[0])}
            />

            {!imagePreview ? (
              <div className="upload-empty">
                <span>📷</span>
                <strong>点击上传菜单图片</strong>
                <p>
                  支持 jpg、png、webp。当前版本只做图片预览和后端保存，
                  菜名请在左侧手动输入。
                </p>
              </div>
            ) : (
              <img src={imagePreview} alt="菜单图片预览" />
            )}
          </label>

          {imagePreview && (
            <div className="image-info">
              <div>
                <strong>{imageName}</strong>

                <p>
                  {imageSize}
                  {uploading ? " · 正在上传到后端..." : ""}
                </p>

                {uploadResult && (
                  <p>
                    后端已保存：
                    <a
                      href={uploadResult.fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-link"
                    >
                      查看图片
                    </a>
                  </p>
                )}
              </div>

              <button className="outline-btn" onClick={removeImage}>
                移除图片
              </button>
            </div>
          )}

          <div className="ocr-placeholder">
            <p className="section-kicker">Manual Input</p>
            <h3>看图手动录入</h3>

            <p className="muted">
              当前版本先去掉 OCR。你可以看着上传的菜单图片，把菜名手动输入到左侧。
              这样系统更稳定，也更适合作为第一版体验版。
            </p>

            <button className="outline-wide" onClick={appendExampleMenu}>
              加入一组示例菜单
            </button>
          </div>
        </div>
      </div>

      <div className="split-grid">
        <div className="section-card">
          <p className="section-kicker">Preview</p>
          <h3>菜单预览</h3>

          {menuList.length === 0 ? (
            <p className="muted">暂无菜单，请先输入菜名。</p>
          ) : (
            <div className="chip-list">
              {menuList.map((item, index) => (
                <span key={`${item}-${index}`} className="food-chip">
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
            后期如果需要，可以改为接入更稳定的付费识图 API，
            或者做成“AI 帮我从图片里提取菜单”。
          </p>
        </div>
      </div>
    </section>
  );
}

export default Menu;