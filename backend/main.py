from datetime import datetime
from typing import List, Optional
import json
import random

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from database import create_db_and_tables, get_session
from models import EatHistory


app = FastAPI(title="今天吃啥 API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


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
    dish: str
    mode: str
    reason: str
    score: Optional[int] = None
    feedback: List[str] = []


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
        "dish": item.dish,
        "mode": item.mode,
        "reason": item.reason,
        "score": item.score,
        "feedback": feedback,
        "createdAt": item.created_at.strftime("%Y/%m/%d %H:%M:%S"),
    }


@app.get("/")
def root():
    return {"message": "今天吃啥后端启动成功"}


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
def get_history(session: Session = Depends(get_session)):
    statement = select(EatHistory).order_by(EatHistory.created_at.desc())
    items = session.exec(statement).all()

    return [history_to_dict(item) for item in items]


@app.delete("/api/history")
def clear_history(session: Session = Depends(get_session)):
    statement = select(EatHistory)
    items = session.exec(statement).all()

    for item in items:
        session.delete(item)

    session.commit()

    return {"message": "历史记录已清空"}