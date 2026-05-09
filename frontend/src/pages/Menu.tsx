import { useEffect, useMemo, useState } from "react";
import { loadMenu, saveMenu } from "../lib/storage";

function Menu() {
  const [menuText, setMenuText] = useState(() => loadMenu());
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageSize, setImageSize] = useState("");

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

  const handleImageUpload = (file?: File) => {
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

    showMessage("菜单图片已上传，可以在右侧预览。");
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
    setImageName("");
    setImageSize("");
    showMessage("图片预览已移除。");
  };

  const appendDemoRecognizedText = () => {
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
    showMessage("已加入示例识别结果。后面会替换成真实 OCR。");
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
            <span className="pill">Preview</span>
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
                <p>支持 jpg、png、webp。当前阶段先做图片预览，下一步接 OCR 识别。</p>
              </div>
            ) : (
              <img src={imagePreview} alt="菜单图片预览" />
            )}
          </label>

          {imagePreview && (
            <div className="image-info">
              <div>
                <strong>{imageName}</strong>
                <p>{imageSize}</p>
              </div>

              <button className="outline-btn" onClick={removeImage}>
                移除图片
              </button>
            </div>
          )}

          <div className="ocr-placeholder">
            <p className="section-kicker">OCR Result</p>
            <h3>识别结果区域</h3>
            <p className="muted">
              后面接入 OCR 后，图片里的菜名会自动显示在这里。你可以手动修改后保存为今日菜单。
            </p>

            <button className="outline-wide" onClick={appendDemoRecognizedText}>
              先加入一组示例识别结果
            </button>
          </div>
        </div>
      </div>

      <div className="split-grid">
        <div className="section-card">
          <p className="section-kicker">Preview</p>
          <h3>菜单预览</h3>

          {menuList.length === 0 ? (
            <p className="muted">暂无菜单，请先输入或等待 OCR 识别结果。</p>
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
            下一步可以接后端图片上传接口，再接 PaddleOCR 或其他 OCR 工具，把菜单图片自动转换成菜名文本。
          </p>
        </div>
      </div>
    </section>
  );
}

export default Menu;