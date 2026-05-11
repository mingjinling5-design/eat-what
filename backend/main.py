from datetime import datetime
from pathlib import Path
from typing import List, Optional
import hashlib
import hmac
import json
import random
import shutil
import uuid

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import create_db_and_tables, migrate_database, get_session
from models import EatHistory, UserAccount


app = FastAPI(title="今天吃啥 API")

UPLOAD_ROOT = Path("uploads")
MENU_IMAGE_DIR = UPLOAD_ROOT / "menu_images"
MENU_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    migrate_database()


class Preference(BaseModel):
    spicy: int = 3
    health: int = 3
    price: int = 3
    freshness: int = 3
    fullness: int = 3
    mode: str = "fun"
    region: Optional[str] = "四川"
    taste_region: Optional[str] = "无明显倾向"


class RecommendRequest(BaseModel):
    menu: List[str]
    preference: Preference


class SaveHistoryRequest(BaseModel):
    user_id: int = 0
    dish: str
    mode: str
    reason: str
    score: Optional[int] = None
    feedback: List[str] = Field(default_factory=list)


class AuthRequest(BaseModel):
    username: str
    password: str


def analyze_dish_name(name: str):
    spicy_keywords = ["辣", "麻辣", "香锅", "冒菜", "火锅", "酸辣", "剁椒", "干锅"]
    healthy_keywords = ["番茄", "青菜", "菠菜", "白菜", "豆腐", "鸡蛋", "玉米", "粥", "沙拉", "清汤"]
    oily_keywords = ["炸", "烤", "红烧", "干锅", "香锅", "烧烤", "肥牛", "肥肠"]
    cheap_keywords = ["面", "粉", "饭", "包子", "馒头", "粥", "饺子", "盖饭"]
    fullness_keywords = ["米饭", "盖饭", "炒饭", "面", "粉", "饺子", "黄焖鸡", "鸡腿", "牛肉"]
    meat_keywords = ["鸡", "牛", "猪", "肉", "鱼", "虾", "排骨", "鸭"]
    vegetable_keywords = ["菜", "番茄", "白菜", "菠菜", "萝卜", "土豆", "豆腐", "黄瓜", "茄子", "玉米"]

    return {
        "is_spicy": any(k in name for k in spicy_keywords),
        "is_healthy": any(k in name for k in healthy_keywords),
        "is_oily": any(k in name for k in oily_keywords),
        "is_cheap": any(k in name for k in cheap_keywords),
        "is_full": any(k in name for k in fullness_keywords),
        "has_meat": any(k in name for k in meat_keywords),
        "has_vegetable": any(k in name for k in vegetable_keywords),
    }


def get_seasonal_keywords():
    month = datetime.now().month

    if month in [3, 4, 5]:
        return ["春笋", "菠菜", "韭菜", "香椿", "豌豆", "莴笋"]

    if month in [6, 7, 8]:
        return ["黄瓜", "番茄", "茄子", "苦瓜", "丝瓜", "玉米"]

    if month in [9, 10, 11]:
        return ["莲藕", "南瓜", "山药", "土豆", "萝卜", "菌菇"]

    return ["白菜", "萝卜", "菠菜", "土豆", "莲藕", "豆腐"]


def score_dish(name: str, pref: Preference):
    tags = analyze_dish_name(name)
    seasonal_keywords = get_seasonal_keywords()

    score = 50
    reasons = []

    if tags["is_spicy"]:
        if pref.spicy >= 4:
            score += 15
            reasons.append("符合你偏爱辣味或重口味的倾向")
        elif pref.spicy <= 2:
            score -= 18
            reasons.append("这道菜可能偏辣，系统降低了推荐优先级")

    if pref.mode == "healthy":
        if tags["is_healthy"] or tags["has_vegetable"]:
            score += 22
            reasons.append("当前是健康推荐模式，这道菜含有较清爽或蔬菜类元素")

        if tags["is_oily"]:
            score -= 20
            reasons.append("当前是健康推荐模式，偏油菜品会被适当降分")
    else:
        if tags["is_healthy"]:
            score += pref.health * 2
            reasons.append("这道菜有一定健康倾向")

    if pref.mode == "cheap":
        if tags["is_cheap"]:
            score += 24
            reasons.append("当前是省钱推荐模式，这类饭餐通常性价比较高")
    else:
        if tags["is_cheap"]:
            score += pref.price * 2

    if tags["is_full"]:
        score += pref.fullness * 3
        reasons.append("这类饭餐饱腹感较强，适合作为正餐")

    if pref.mode == "craving":
        if tags["is_spicy"] or tags["is_oily"] or tags["has_meat"]:
            score += 20
            reasons.append("当前是解馋推荐模式，这道菜更容易带来满足感")

    if pref.mode == "fun":
        random_bonus = random.randint(0, 18)
        score += random_bonus
        reasons.append("娱乐推荐模式加入了一点随机惊喜，帮助你快速做决定")

    matched_seasonal = [k for k in seasonal_keywords if k in name]
    if matched_seasonal:
        score += 10
        foods = "、".join(matched_seasonal)
        reasons.append(f"包含当前季节较常见的食材：{foods}")

    if tags["has_meat"] and tags["has_vegetable"]:
        score += 8
        reasons.append("菜名中同时包含荤菜和蔬菜元素，搭配相对均衡")

    if pref.taste_region == "偏南方口味":
        if "饭" in name or "米" in name:
            score += 5
            reasons.append("更符合偏南方饮食中米饭类主食的习惯")

    if pref.taste_region == "偏北方口味":
        if "面" in name or "饺子" in name or "馒头" in name:
            score += 5
            reasons.append("更符合偏北方饮食中面食类主食的习惯")

    if not reasons:
        reasons.append("这道菜整体表现比较稳定，适合作为今天的备选饭餐")

    return {
        "dish": name,
        "score": score,
        "reasons": reasons,
        "tags": tags,
    }


def build_reason(best_item, pref: Preference):
    mode_name = {
        "fun": "娱乐推荐",
        "healthy": "健康推荐",
        "cheap": "省钱推荐",
        "craving": "解馋推荐",
    }.get(pref.mode, "普通推荐")

    reasons = best_item["reasons"][:3]
    reason_text = "；".join(reasons)

    return (
        f"当前使用的是{mode_name}模式。"
        f"系统从今日菜单中综合比较后，认为「{best_item['dish']}」更适合你。"
        f"主要原因是：{reason_text}。"
        f"本次推荐分为 {best_item['score']} 分。"
    )


def history_to_dict(item: EatHistory):
    try:
        feedback = json.loads(item.feedback)
    except Exception:
        feedback = []

    return {
        "id": str(item.id),
        "userId": item.user_id,
        "dish": item.dish,
        "mode": item.mode,
        "reason": item.reason,
        "score": item.score,
        "feedback": feedback,
        "createdAt": item.created_at.strftime("%Y/%m/%d %H:%M:%S"),
    }


def hash_password(password: str, salt: str):
    raw = f"{salt}:{password}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def user_to_dict(user: UserAccount):
    return {
        "id": user.id,
        "username": user.username,
        "isGuest": False,
        "createdAt": user.created_at.strftime("%Y/%m/%d %H:%M:%S"),
    }


@app.get("/")
def root():
    return {"message": "今天吃啥后端启动成功"}


@app.post("/api/auth/register")
def register(data: AuthRequest, session: Session = Depends(get_session)):
    username = data.username.strip()
    password = data.password.strip()

    if len(username) < 2:
        raise HTTPException(status_code=400, detail="用户名至少需要 2 个字符")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="密码至少需要 6 位")

    statement = select(UserAccount).where(UserAccount.username == username)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")

    salt = uuid.uuid4().hex
    password_hash = hash_password(password, salt)

    user = UserAccount(
        username=username,
        password_hash=password_hash,
        salt=salt,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "message": "注册成功",
        "user": user_to_dict(user),
    }


@app.post("/api/auth/login")
def login(data: AuthRequest, session: Session = Depends(get_session)):
    username = data.username.strip()
    password = data.password.strip()

    statement = select(UserAccount).where(UserAccount.username == username)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    input_hash = hash_password(password, user.salt)

    if not hmac.compare_digest(input_hash, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    return {
        "message": "登录成功",
        "user": user_to_dict(user),
    }


@app.post("/api/auth/guest")
def guest_login():
    return {
        "message": "游客模式进入成功",
        "user": {
            "id": 0,
            "username": "游客用户",
            "isGuest": True,
        },
    }


@app.post("/api/recommend/today")
def recommend_today(data: RecommendRequest):
    menu = [item.strip() for item in data.menu if item.strip()]

    if not menu:
        return {
            "dish": None,
            "mode": data.preference.mode,
            "reason": "今日菜单为空，请先输入可选饭餐。",
            "score": 0,
        }

    scored_items = [score_dish(name, data.preference) for name in menu]
    scored_items.sort(key=lambda item: item["score"], reverse=True)

    best_item = scored_items[0]

    return {
        "dish": best_item["dish"],
        "mode": data.preference.mode,
        "score": best_item["score"],
        "reason": build_reason(best_item, data.preference),
        "top_list": scored_items[:5],
    }


@app.post("/api/history")
def save_history(data: SaveHistoryRequest, session: Session = Depends(get_session)):
    item = EatHistory(
        user_id=data.user_id,
        dish=data.dish,
        mode=data.mode,
        reason=data.reason,
        score=data.score,
        feedback=json.dumps(data.feedback, ensure_ascii=False),
    )

    session.add(item)
    session.commit()
    session.refresh(item)

    return {
        "message": "保存成功",
        "item": history_to_dict(item),
    }


@app.get("/api/history")
def get_history(user_id: int = 0, session: Session = Depends(get_session)):
    statement = (
        select(EatHistory)
        .where(EatHistory.user_id == user_id)
        .order_by(EatHistory.created_at.desc())
    )
    items = session.exec(statement).all()

    return [history_to_dict(item) for item in items]


@app.delete("/api/history")
def clear_history(user_id: int = 0, session: Session = Depends(get_session)):
    statement = select(EatHistory).where(EatHistory.user_id == user_id)
    items = session.exec(statement).all()

    for item in items:
        session.delete(item)

    session.commit()

    return {"message": "当前用户历史记录已清空"}


@app.post("/api/menu/upload")
async def upload_menu_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="请上传图片文件")

    original_suffix = Path(file.filename or "").suffix.lower()
    allowed_suffixes = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

    if original_suffix not in allowed_suffixes:
        original_suffix = ".jpg"

    stored_name = f"{uuid.uuid4().hex}{original_suffix}"
    save_path = MENU_IMAGE_DIR / stored_name

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    image_url = f"/uploads/menu_images/{stored_name}"

    return {
        "message": "菜单图片上传成功",
        "originalName": file.filename,
        "storedName": stored_name,
        "url": image_url,
        "fullUrl": f"http://127.0.0.1:8000{image_url}",
    }