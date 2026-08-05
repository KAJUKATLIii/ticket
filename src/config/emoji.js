/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

/**
 * Unicode fallbacks — kept for API compatibility but the main entries
 * already use Unicode, so these are only needed if you add custom emojis later.
 */
const FALLBACKS = {};

export const emoji = {
  // ── Ticket Actions ─────────────────────────────────────────────────────────
  unlock:       "🔓",
  lock:         "🔒",
  trash:        "🗑️",
  ticket:       "🎫",
  claim:        "🙋",
  unclaim:      "🙅",
  transfer:     "↗️",
  merge:        "🔀",
  reopen:       "🔁",

  // ── Rating ─────────────────────────────────────────────────────────────────
  starFill:     "⭐",
  starEmpty:    "✩",
  rating1:      "1️⃣",
  rating2:      "2️⃣",
  rating3:      "3️⃣",
  rating4:      "4️⃣",
  rating5:      "5️⃣",

  // ── UI Controls ────────────────────────────────────────────────────────────
  settings:     "⚙️",
  remove:       "➖",
  add:          "➕",
  logs:         "📋",
  dashboard:    "📊",
  cross:        "✖️",
  check:        "✅",
  confirm:      "☑️",
  cancel:       "🚫",
  next:         "▶️",
  prev:         "◀️",
  first:        "⏮️",
  last:         "⏭️",

  // ── Status ─────────────────────────────────────────────────────────────────
  open:         "🟢",
  closed:       "🔴",
  pending:      "🟡",
  pinned:       "📌",
  transferred:  "🔄",
  active:       "🔵",
  archived:     "🗂️",
  resolved:     "✅",
  escalated:    "🚨",

  // ── Staff / Roles ──────────────────────────────────────────────────────────
  staff:        "🛡️",
  admin:        "👑",
  mod:          "⚔️",
  support:      "🎧",
  owner:        "💎",

  // ── Categories / Misc ──────────────────────────────────────────────────────
  inbox:        "📥",
  outbox:       "📤",
  note:         "📝",
  warning:      "⚠️",
  info:         "ℹ️",
  bell:         "🔔",
  mute:         "🔕",
  timer:        "⏱️",
  crown:        "👑",
  shield:       "🛡️",
  ban:          "🚫",
  user:         "👤",
  users:        "👥",
  link:         "🔗",
  search:       "🔍",
  refresh:      "♻️",
  success:      "✅",
  error:        "❌",
  arrow:        "➜",
  dot:          "•",
  line:         "─",
  reply:        "↩️",
  mention:      "@",
  tag:          "🏷️",
  category:     "📂",
  channel:      "#️⃣",
  panel:        "📋",
  transcript:   "📄",
  image:        "🖼️",
  attachment:   "📎",
  time:         "🕒",
  date:         "📅",
  id:           "🪪",
  stats:        "📈",
  boost:        "🚀",
  heart:        "❤️",

  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Returns the emoji for `name`.
   * If `unicode` is true and the emoji is a custom Discord emoji,
   * returns the Unicode fallback instead (useful in plain-text contexts).
   * @param {string}  name
   * @param {string}  [fallback=""]
   * @param {boolean} [unicode=false]
   */
  get(name, fallback = "", unicode = false) {
    if (unicode && FALLBACKS[name]) return FALLBACKS[name];
    return this[name] ?? fallback;
  },

  /**
   * Returns the Unicode fallback for `name` (always safe for any server).
   * @param {string} name
   * @param {string} [fallback=""]
   */
  unicode(name, fallback = "") {
    return FALLBACKS[name] ?? this[name] ?? fallback;
  },

  /**
   * Build a star rating string, e.g. "⭐⭐⭐✩✩" for 3/5.
   * @param {number} stars  1–5
   * @param {number} [max=5]
   */
  stars(stars, max = 5) {
    const filled  = this.starFill;
    const empty   = this.starEmpty;
    return filled.repeat(stars) + empty.repeat(Math.max(0, max - stars));
  },
};

export default emoji;
