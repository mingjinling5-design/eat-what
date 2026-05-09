export type RecommendMode = "fun" | "healthy" | "cheap" | "craving";

export type PreferenceKey =
  | "spicy"
  | "health"
  | "price"
  | "freshness"
  | "fullness";

export type Preferences = Record<PreferenceKey, number> & {
  tasteRegion: string;
  showReason: boolean;
  healthTip: boolean;
  smartLearning: boolean;
};

export type RecommendResult = {
  dish: string | null;
  mode: string;
  reason: string;
  score?: number;
};

export type HistoryItem = {
  id: string;
  dish: string;
  mode: string;
  reason: string;
  score?: number;
  feedback: string[];
  createdAt: string;
};

export const modeMap: Record<
  RecommendMode,
  {
    label: string;
    desc: string;
    emoji: string;
  }
> = {
  fun: {
    label: "娱乐推荐",
    desc: "有一点随机惊喜，帮你快速解决选择困难。",
    emoji: "🎲",
  },
  healthy: {
    label: "健康推荐",
    desc: "更关注清淡、均衡、少油和时令食材。",
    emoji: "🥗",
  },
  cheap: {
    label: "省钱推荐",
    desc: "优先考虑性价比和学生党预算。",
    emoji: "💰",
  },
  craving: {
    label: "解馋推荐",
    desc: "适合今天想吃点满足感强的饭餐。",
    emoji: "🔥",
  },
};

export const preferenceLabels: Record<PreferenceKey, string> = {
  spicy: "辣度偏好",
  health: "健康重视",
  price: "价格敏感",
  freshness: "新鲜感",
  fullness: "饱腹感",
};

export const feedbackOptions = [
  "好吃",
  "一般",
  "不好吃",
  "太贵",
  "太油",
  "太辣",
  "没吃饱",
  "下次还想吃",
  "不想再推荐",
];

export const defaultMenu =
  "黄焖鸡米饭\n麻辣香锅\n番茄鸡蛋盖饭\n牛肉面\n砂锅米线\n鸡腿饭\n酸辣粉\n烤肉拌饭";

export const defaultPreferences: Preferences = {
  spicy: 3,
  health: 3,
  price: 3,
  freshness: 3,
  fullness: 3,
  tasteRegion: "无明显倾向",
  showReason: true,
  healthTip: true,
  smartLearning: true,
};