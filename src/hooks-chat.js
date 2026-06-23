const PREFIX = "wfrp4e-ja-slcolor--";
const MODULE_ID = "wfrp4e-ja-jp";

/**
 * hue × SLレベル（marginal→astounding の4段）→ [背景, 枠線, 文字色]。
 * - 背景／枠線: 淡→濃の4段ramp（SLレベルで濃淡が変化）
 * - 文字色: 白地で判読可能な濃色域に写像（テスト名・判定結果の文字用）
 * 色を追加する場合はここに hue を1行足す。
 */
const PALETTE = {
    // 成功系
    blue:      [["#dbeafe", "#93c5fd", "#1d4ed8"], ["#bfdbfe", "#60a5fa", "#1d4ed8"], ["#93c5fd", "#3b82f6", "#1e40af"], ["#1d4ed8", "#1e3a8a", "#1e3a8a"]],
    green:     [["#dcfce7", "#86efac", "#15803d"], ["#bbf7d0", "#4ade80", "#15803d"], ["#4ade80", "#22c55e", "#166534"], ["#15803d", "#14532d", "#14532d"]],
    lightblue: [["#e0f2fe", "#7dd3fc", "#0369a1"], ["#bae6fd", "#38bdf8", "#0369a1"], ["#38bdf8", "#0ea5e9", "#075985"], ["#0369a1", "#0c4a6e", "#0c4a6e"]],
    // 失敗系
    red:       [["#fee2e2", "#fca5a5", "#991b1b"], ["#fecaca", "#f87171", "#991b1b"], ["#fca5a5", "#ef4444", "#7f1d1d"], ["#991b1b", "#7f1d1d", "#7f1d1d"]],
    orange:    [["#ffedd5", "#fdba74", "#9a3412"], ["#fed7aa", "#fb923c", "#9a3412"], ["#fb923c", "#f97316", "#7c2d12"], ["#9a3412", "#7c2d12", "#7c2d12"]],
    yellow:    [["#fef9c3", "#fde047", "#a16207"], ["#fef08a", "#facc15", "#a16207"], ["#facc15", "#eab308", "#854d0e"], ["#a16207", "#713f12", "#713f12"]],
};

/** 設定キー → 付与する箇所クラス（接尾辞）。箇所を追加する場合はここに1行足す。 */
const TARGETS = [
    ["targetSlBg",        "t-slbg"],
    ["targetSlBorder",    "t-slborder"],
    ["targetCardBorder",  "t-cardborder"],
    ["targetTestTitle",   "t-title"],
    ["targetDescription", "t-desc"],
];

const VAR_KEYS = ["--wfrp4e-ja-bg", "--wfrp4e-ja-border", "--wfrp4e-ja-text", "--wfrp4e-ja-sl-fg"];

Hooks.on("renderChatMessageHTML", (app, html) => {
    const card = html.querySelector(".wfrp4e.chat-card");
    if (!card) return;

    // 既存の色分け指定（クラス・CSS変数）をクリアして冪等にする
    card.className = [...card.classList].filter(c => !c.startsWith(PREFIX)).join(" ");
    VAR_KEYS.forEach(v => card.style.removeProperty(v));

    const get = (k) => game.settings.get(MODULE_ID, k);
    const enabled = TARGETS.filter(([key]) => get(key));
    if (enabled.length === 0) return;

    const test = app.system?.test;
    if (!test?.result?.outcome) return;

    const outcome = test.result.outcome; // "success" | "failure"
    const hue = outcome === "success" ? get("successHue") : get("failureHue");
    const ramp = PALETTE[hue];
    if (!ramp) return;

    const absSL = Math.abs(parseInt(test.result.SL ?? "0") || 0);
    const idx =
        absSL <= 1 ? 0 :   // marginal
        absSL <= 3 ? 1 :   // normal
        absSL <= 5 ? 2 :   // impressive
                     3;    // astounding
    const [bg, border, text] = ramp[idx];

    card.style.setProperty("--wfrp4e-ja-bg", bg);
    card.style.setProperty("--wfrp4e-ja-border", border);
    card.style.setProperty("--wfrp4e-ja-text", text);
    // 最濃段は背景が暗いので SLボックスの文字を白に
    if (idx === 3) card.style.setProperty("--wfrp4e-ja-sl-fg", "#fff");

    for (const [, cls] of enabled) card.classList.add(`${PREFIX}${cls}`);
});
