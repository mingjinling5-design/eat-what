# 今天吃啥 - 校园智能饮食推荐系统

一个面向大学生的智能饮食推荐系统，用来解决“今天吃什么”的选择困难问题。

## 项目功能

- 今日菜单录入
- 菜单图片上传预览
- 菜单图片后端保存
- 偏好设置
- 多模式推荐
- 推荐理由展示
- 吃后反馈
- 历史记录
- 登录注册
- 游客模式
- 管理后台页面

## 技术栈

### 前端

- React
- Vite
- TypeScript
- React Router

### 后端

- Python
- FastAPI
- SQLite
- SQLModel

## 启动后端

```powershell
cd D:\github\eat-what\backend
.\venv\Scripts\activate
uvicorn main:app --reload