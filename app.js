const CATEGORIES = [
  { id: "tisort", label: "Tişört" },
  { id: "gomlek", label: "Gömlek" },
  { id: "sweatshirt", label: "Sweatshirt" },
  { id: "pantolon", label: "Pantolon" },
  { id: "etek", label: "Etek" },
  { id: "elbise", label: "Elbise" },
  { id: "ceket", label: "Ceket" },
  { id: "ayakkabi", label: "Ayakkabı" },
  { id: "aksesuar", label: "Aksesuar" },
];

const SKIN_TONES = [
  { id: "acik-soguk", label: "Açık soğuk", hex: "#f0d5c8", undertone: "cool" },
  { id: "acik-sicak", label: "Açık sıcak", hex: "#efc9a8", undertone: "warm" },
  { id: "orta", label: "Orta", hex: "#d4a574", undertone: "neutral" },
  { id: "bugday", label: "Buğday", hex: "#b07a4a", undertone: "warm" },
  { id: "koyu", label: "Koyu", hex: "#6b3f2a", undertone: "deep" },
];

const BODY_TYPES = [
  {
    id: "kum-saati",
    label: "Kum saati",
    desc: "Bel vurgulu, dengeli üst-alt",
  },
  {
    id: "armut",
    label: "Armut",
    desc: "Üstte dikkat, sade ve dengeli alt",
  },
  {
    id: "elma",
    label: "Elma",
    desc: "Akışkan üst, net hatlı alt",
  },
  {
    id: "dikdortgen",
    label: "Dikdörtgen",
    desc: "Katman ve aksesuarla form",
  },
  {
    id: "ters-ucgen",
    label: "Ters üçgen",
    desc: "Hacimli alt, sade üst",
  },
];

const TOPS = new Set(["tisort", "gomlek", "sweatshirt"]);
const BOTTOMS = new Set(["pantolon", "etek"]);
const STORAGE_KEY = "kombin-dolap-v1";
const PROFILE_KEY = "kombin-profil-v1";
const META_KEY = "kombin-meta-v1";
const MAX_OUTFITS = 8;
// Google Cloud Console → OAuth 2.0 Web Client ID (localhost:5500 origin ekle)
const GOOGLE_CLIENT_ID = "";

const EVENTS = [
  { id: "gunluk", label: "Günlük" },
  { id: "is", label: "İş" },
  { id: "ozel", label: "Özel gün" },
];

const state = {
  activeTab: "kesfet",
  activeCategory: "tisort",
  items: loadItems(),
  profile: loadProfile(),
  meta: loadMeta(),
  outfits: [],
  outfitSeed: Date.now(),
  weather: null,
  weatherLoading: false,
  weatherTimer: null,
  googleReady: false,
  showFavoritesOnly: false,
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  screens: document.querySelectorAll("[data-screen]"),
  chips: document.getElementById("category-chips"),
  categoryLabel: document.getElementById("active-category-label"),
  captureBtn: document.getElementById("capture-btn"),
  cameraInput: document.getElementById("camera-input"),
  itemsGrid: document.getElementById("items-grid"),
  emptyState: document.getElementById("empty-state"),
  totalCount: document.getElementById("total-count"),
  goButtons: document.querySelectorAll("[data-go]"),
  outfitList: document.getElementById("outfit-list"),
  outfitEmpty: document.getElementById("outfit-empty"),
  outfitHint: document.getElementById("outfit-hint"),
  refreshOutfits: document.getElementById("refresh-outfits"),
  skinToneOptions: document.getElementById("skin-tone-options"),
  bodyTypeOptions: document.getElementById("body-type-options"),
  profileNote: document.getElementById("profile-note"),
  weatherTemp: document.getElementById("weather-temp"),
  weatherCity: document.getElementById("weather-city"),
  weatherDesc: document.getElementById("weather-desc"),
  weatherTip: document.getElementById("weather-tip"),
  cityInput: document.getElementById("city-input"),
  saveCityBtn: document.getElementById("save-city-btn"),
  cityHint: document.getElementById("city-hint"),
  authBar: document.getElementById("auth-bar"),
  googleBtnHost: document.getElementById("google-btn-host"),
  eventChips: document.getElementById("event-chips"),
  shopNotesList: document.getElementById("shop-notes-list"),
  notifyToggle: document.getElementById("notify-toggle"),
  notifyHint: document.getElementById("notify-hint"),
  appToast: document.getElementById("app-toast"),
  genderOptions: document.getElementById("gender-options"),
  heightInput: document.getElementById("height-input"),
  weightInput: document.getElementById("weight-input"),
  saveStatsBtn: document.getElementById("save-stats-btn"),
};

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      skinTone: data.skinTone || null,
      bodyType: data.bodyType || null,
      city: data.city || "",
      user: data.user || null,
      gender: data.gender || null,
      height: data.height || null,
      weight: data.weight || null,
    };
  } catch {
    return {
      skinTone: null,
      bodyType: null,
      city: "",
      user: null,
      gender: null,
      height: null,
      weight: null,
    };
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      worn: data.worn && typeof data.worn === "object" ? data.worn : {},
      event: data.event || "gunluk",
      notifications: Boolean(data.notifications),
      lastNotifyDate: data.lastNotifyDate || "",
    };
  } catch {
    return {
      favorites: [],
      worn: {},
      event: "gunluk",
      notifications: false,
      lastNotifyDate: "",
    };
  }
}

function saveMeta() {
  localStorage.setItem(META_KEY, JSON.stringify(state.meta));
}

function showToast(message, ms = 2800) {
  els.appToast.textContent = message;
  els.appToast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.appToast.classList.add("hidden"), ms);
}

function colorNameFromHsl(color) {
  if (!color) return "nötr";
  if (isNeutral(color)) {
    if (color.l > 0.8) return "krem / beyaz";
    if (color.l < 0.2) return "siyah";
    return "gri / nötr";
  }
  const h = color.h;
  if (h < 20 || h >= 340) return "kırmızımsı";
  if (h < 45) return "turuncu";
  if (h < 70) return "hardal / sarı";
  if (h < 160) return "yeşil";
  if (h < 200) return "turkuaz";
  if (h < 260) return "mavi";
  if (h < 290) return "mor";
  return "pembe";
}

function complementaryColorHint(color) {
  if (!color || isNeutral(color)) return "krem, beyaz veya soft pastel";
  const h = (color.h + 180) % 360;
  return colorNameFromHsl({ ...color, h, s: Math.max(color.s, 0.35), l: 0.55 });
}

function analogousColorHint(color) {
  if (!color || isNeutral(color)) return "bej veya açık gri";
  const h = (color.h + 30) % 360;
  return colorNameFromHsl({ ...color, h, s: Math.max(color.s, 0.3), l: 0.6 });
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}

function isNeutral({ s, l }) {
  return s < 0.12 || l < 0.12 || l > 0.88;
}

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function extractDominantColor(dataUrl) {
  const img = await loadImage(dataUrl);
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 180) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip near-white backgrounds often seen in product photos
    if (r > 245 && g > 245 && b > 245) continue;
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const prev = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    prev.n += 1;
    prev.r += r;
    prev.g += g;
    prev.b += b;
    buckets.set(key, prev);
  }

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket;
  }

  if (!best) return { r: 160, g: 150, b: 140, h: 30, s: 0.08, l: 0.6, hex: "#a0968c" };

  const r = Math.round(best.r / best.n);
  const g = Math.round(best.g / best.n);
  const b = Math.round(best.b / best.n);
  const hsl = rgbToHsl(r, g, b);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return { r, g, b, ...hsl, hex };
}

async function ensureItemColor(item) {
  if (item.color?.hex) return item;
  try {
    item.color = await extractDominantColor(item.dataUrl);
    return item;
  } catch {
    item.color = { r: 160, g: 150, b: 140, h: 30, s: 0.08, l: 0.6, hex: "#a0968c" };
    return item;
  }
}

async function ensureAllColors() {
  let changed = false;
  for (const item of state.items) {
    if (!item.color?.hex) {
      await ensureItemColor(item);
      changed = true;
    }
  }
  if (changed) saveItems();
}

function colorPairScore(a, b) {
  if (!a || !b) return 40;
  const aN = isNeutral(a);
  const bN = isNeutral(b);
  if (aN && bN) return 88;
  if (aN || bN) return 92;

  const hueDiff = hueDistance(a.h, b.h);
  const satAvg = (a.s + b.s) / 2;
  const lightDiff = Math.abs(a.l - b.l);

  let score = 0;
  // Analogous
  if (hueDiff <= 35) score = 90 - hueDiff * 0.4;
  // Complementary / near-complementary
  else if (hueDiff >= 140 && hueDiff <= 190) score = 86 - Math.abs(hueDiff - 165) * 0.35;
  // Triadic-ish
  else if (hueDiff >= 100 && hueDiff <= 140) score = 72;
  // Clash zone for loud colors
  else score = Math.max(28, 58 - (hueDiff - 35) * 0.25 - satAvg * 20);

  // Contrast in lightness helps outfits read better
  if (lightDiff > 0.18 && lightDiff < 0.7) score += 6;
  if (satAvg > 0.7 && hueDiff > 50 && hueDiff < 130) score -= 12;

  return Math.max(0, Math.min(100, score));
}

function outfitColorScore(pieces) {
  if (pieces.length < 2) return 50;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      total += colorPairScore(pieces[i].color, pieces[j].color);
      pairs += 1;
    }
  }
  return total / pairs;
}

function colorWarmth(color) {
  if (!color || isNeutral(color)) return "neutral";
  // Warm: yellow-red-orange side; cool: blue-green-violet
  if (color.h >= 20 && color.h <= 70) return "warm";
  if (color.h >= 160 && color.h <= 280) return "cool";
  if (color.h < 20 || color.h > 330) return "warm";
  return "cool";
}

function skinToneMatchScore(pieces) {
  const tone = SKIN_TONES.find((t) => t.id === state.profile.skinTone);
  if (!tone || !pieces.length) return 70;

  let total = 0;
  for (const piece of pieces) {
    const c = piece.color;
    if (!c) {
      total += 65;
      continue;
    }
    if (isNeutral(c)) {
      total += 90;
      continue;
    }

    const warmth = colorWarmth(c);
    let score = 68;

    if (tone.undertone === "warm") {
      score = warmth === "warm" ? 94 : warmth === "neutral" ? 86 : 58;
      if (c.l > 0.82 && c.s < 0.25) score -= 8;
    } else if (tone.undertone === "cool") {
      score = warmth === "cool" ? 94 : warmth === "neutral" ? 86 : 56;
      if (c.h >= 40 && c.h <= 65 && c.s > 0.45) score -= 10;
    } else if (tone.undertone === "deep") {
      // Deep skin: jewel tones and strong contrast work well
      if (c.s > 0.35 || c.l < 0.35 || isNeutral(c)) score = 92;
      else if (c.l > 0.75 && c.s < 0.25) score = 62;
      else score = 78;
    } else {
      // medium / neutral undertone
      score = warmth === "neutral" ? 88 : 80;
    }

    total += score;
  }
  return total / pieces.length;
}

function bodyTypeMatchScore(pieces) {
  const bodyId = state.profile.bodyType;
  if (!bodyId || !pieces.length) return 70;

  const cats = new Set(pieces.map((p) => p.category));
  const has = (id) => cats.has(id);
  let score = 70;
  const tags = [];

  if (bodyId === "kum-saati") {
    if (has("etek") || has("elbise") || (pieces.some((p) => TOPS.has(p.category)) && pieces.some((p) => BOTTOMS.has(p.category)))) {
      score += 14;
      tags.push("Bel dengesi");
    }
    if (has("ceket")) score += 4;
  } else if (bodyId === "armut") {
    if (pieces.some((p) => TOPS.has(p.category))) {
      score += 10;
      tags.push("Üst vurgu");
    }
    const bottom = pieces.find((p) => BOTTOMS.has(p.category));
    if (bottom?.color && (isNeutral(bottom.color) || bottom.color.l < 0.45)) {
      score += 12;
      tags.push("Dengeli alt");
    }
    if (has("gomlek") || has("sweatshirt")) score += 4;
  } else if (bodyId === "elma") {
    if (has("gomlek") || has("ceket")) {
      score += 12;
      tags.push("Akışkan üst");
    }
    const bottom = pieces.find((p) => BOTTOMS.has(p.category));
    if (bottom?.color && bottom.color.l > 0.45) {
      score += 8;
      tags.push("Net alt");
    }
    if (has("elbise")) score += 6;
  } else if (bodyId === "dikdortgen") {
    if (has("ceket") || has("aksesuar")) {
      score += 14;
      tags.push("Form veren katman");
    }
    if (has("etek") || has("elbise")) score += 8;
  } else if (bodyId === "ters-ucgen") {
    if (has("etek") || has("pantolon")) {
      score += 10;
      tags.push("Dengeli alt");
    }
    if (has("tisort") && !has("ceket")) score += 8;
    if (has("sweatshirt") && has("ceket")) score -= 6;
    if (has("aksesuar")) score += 4;
  }

  return { score: Math.max(40, Math.min(100, score)), tags };
}

function getBodyMetrics() {
  const height = Number(state.profile.height);
  const weight = Number(state.profile.weight);
  const hasHeight = height >= 100 && height <= 230;
  const hasWeight = weight >= 30 && weight <= 250;
  if (!hasHeight && !hasWeight) return null;

  let heightBand = null;
  if (hasHeight) {
    if (height < 160) heightBand = "short";
    else if (height < 175) heightBand = "average";
    else heightBand = "tall";
  }

  let bmi = null;
  let weightBand = null;
  if (hasHeight && hasWeight) {
    bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5) weightBand = "light";
    else if (bmi < 25) weightBand = "balanced";
    else if (bmi < 30) weightBand = "solid";
    else weightBand = "full";
  } else if (hasWeight) {
    if (weight < 50) weightBand = "light";
    else if (weight < 70) weightBand = "balanced";
    else if (weight < 90) weightBand = "solid";
    else weightBand = "full";
  }

  return {
    height: hasHeight ? height : null,
    weight: hasWeight ? weight : null,
    heightBand,
    weightBand,
    bmi,
    gender: state.profile.gender || null,
  };
}

function bodyMetricsMatchScore(pieces) {
  const m = getBodyMetrics();
  if (!m || !pieces.length) return { score: 70, tags: [] };

  const cats = new Set(pieces.map((p) => p.category));
  const has = (id) => cats.has(id);
  let score = 70;
  const tags = [];

  if (m.heightBand === "short") {
    if (has("etek") || (has("pantolon") && has("tisort"))) {
      score += 10;
      tags.push("Boyuna uygun");
    }
    if (has("sweatshirt") && has("ceket")) score -= 8;
    if (has("elbise")) score += 6;
    const colors = pieces.map((p) => p.color).filter(Boolean);
    if (colors.length >= 2 && colors.every((c) => isNeutral(c) || colorPairScore(colors[0], c) >= 75)) {
      score += 6;
    }
  } else if (m.heightBand === "tall") {
    if (has("pantolon") || has("elbise") || has("ceket")) {
      score += 12;
      tags.push("Uzun siluet");
    }
    if (has("etek")) score += 4;
    if (has("tisort") && !has("ceket") && !has("gomlek") && pieces.length <= 2) score -= 4;
  } else if (m.heightBand === "average") {
    score += 4;
  }

  if (m.weightBand === "light") {
    if (has("sweatshirt") || has("ceket") || has("aksesuar")) {
      score += 10;
      tags.push("Hacim dengesi");
    }
    if (has("tisort") && pieces.length === 2 && !has("ceket")) score -= 4;
  } else if (m.weightBand === "solid" || m.weightBand === "full") {
    if (has("gomlek") || has("ceket")) {
      score += 12;
      tags.push("Yapılandırılmış kesim");
    }
    const bottom = pieces.find((p) => BOTTOMS.has(p.category));
    if (bottom?.color && (isNeutral(bottom.color) || bottom.color.l < 0.45)) {
      score += 8;
      tags.push("Toparlayan alt");
    }
    if (has("sweatshirt") && !has("ceket")) score -= 6;
  } else if (m.weightBand === "balanced") {
    score += 6;
  }

  if (m.gender === "erkek") {
    if (has("pantolon") || has("gomlek")) score += 4;
    if (has("etek") || has("elbise")) score -= 10;
  } else if (m.gender === "kiz") {
    if (has("etek") || has("elbise") || has("aksesuar")) score += 3;
  }

  return { score: Math.max(40, Math.min(100, score)), tags: [...new Set(tags)].slice(0, 2) };
}

function weatherMatchScore(pieces) {
  const w = state.weather;
  if (!w || w.temp == null || !pieces.length) {
    return { score: 70, tags: [] };
  }

  const cats = pieces.map((p) => p.category);
  const has = (id) => cats.includes(id);
  let score = 70;
  const tags = [];
  const band = w.band;
  const wet = w.wet;

  if (band === "hot") {
    if (has("tisort") || has("etek") || has("elbise")) {
      score += 16;
      tags.push("Sıcak havaya uygun");
    }
    if (has("ceket") || has("sweatshirt")) score -= 14;
    if (has("gomlek")) score += 4;
  } else if (band === "mild") {
    if (has("gomlek") || has("tisort")) score += 10;
    if (has("ceket")) score += 4;
    tags.push("Ilıman gün");
  } else if (band === "cool") {
    if (has("sweatshirt") || has("gomlek") || has("ceket")) {
      score += 14;
      tags.push("Serin havaya uygun");
    }
    if (has("etek") && !has("ceket")) score -= 6;
    if (has("tisort") && !has("ceket") && !has("sweatshirt")) score -= 8;
  } else if (band === "cold") {
    if (has("ceket") || has("sweatshirt")) {
      score += 18;
      tags.push("Soğuk havaya uygun");
    }
    if (has("tisort") && !has("ceket") && !has("sweatshirt")) score -= 16;
    if (has("etek") && !has("ceket")) score -= 10;
    if (has("pantolon")) score += 4;
  }

  if (wet) {
    if (has("ceket") || has("pantolon")) {
      score += 10;
      tags.push("Yağmura hazır");
    }
    if (has("etek") && !has("ceket")) score -= 8;
  }

  return { score: Math.max(35, Math.min(100, score)), tags };
}

function eventMatchScore(pieces) {
  const event = state.meta.event || "gunluk";
  const cats = new Set(pieces.map((p) => p.category));
  const has = (id) => cats.has(id);
  let score = 70;
  const tags = [];

  if (event === "is") {
    if (has("gomlek") || has("pantolon") || has("ceket")) {
      score += 16;
      tags.push("İşe uygun");
    }
    if (has("sweatshirt")) score -= 12;
    if (has("etek") && has("gomlek")) score += 6;
    if (has("tisort") && !has("ceket")) score -= 8;
  } else if (event === "ozel") {
    if (has("elbise") || has("etek") || has("aksesuar")) {
      score += 16;
      tags.push("Özel gün");
    }
    if (has("ceket")) score += 6;
    if (has("sweatshirt")) score -= 10;
  } else {
    score += 8;
    tags.push("Günlük");
  }

  return { score: Math.max(40, Math.min(100, score)), tags };
}

function wornPenalty(outfitId) {
  const ts = state.meta.worn?.[outfitId];
  if (!ts) return 0;
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (days < 1) return 28;
  if (days < 3) return 16;
  if (days < 7) return 8;
  return 0;
}

function totalOutfitScore(pieces, outfitId = null) {
  const color = outfitColorScore(pieces);
  const skin = skinToneMatchScore(pieces);
  const body = bodyTypeMatchScore(pieces);
  const metrics = bodyMetricsMatchScore(pieces);
  const weather = weatherMatchScore(pieces);
  const event = eventMatchScore(pieces);
  const bodyScore = typeof body === "object" ? body.score : body;
  const tags = [
    ...(typeof body === "object" ? body.tags : []),
    ...metrics.tags,
    ...weather.tags,
    ...event.tags,
  ];

  const hasProfile = Boolean(state.profile.skinTone || state.profile.bodyType);
  const hasMetrics = Boolean(getBodyMetrics());
  const hasWeather = Boolean(state.weather?.temp != null);

  let score;
  if (hasProfile && hasMetrics && hasWeather) {
    score =
      color * 0.34 +
      skin * 0.12 +
      bodyScore * 0.12 +
      metrics.score * 0.14 +
      weather.score * 0.14 +
      event.score * 0.14;
  } else if (hasMetrics && hasWeather) {
    score = color * 0.4 + metrics.score * 0.25 + weather.score * 0.2 + event.score * 0.15;
  } else if (hasMetrics && hasProfile) {
    score =
      color * 0.4 +
      skin * 0.15 +
      bodyScore * 0.15 +
      metrics.score * 0.15 +
      event.score * 0.15;
  } else if (hasMetrics) {
    score = color * 0.55 + metrics.score * 0.25 + event.score * 0.2;
  } else if (hasProfile && hasWeather) {
    score =
      color * 0.4 +
      skin * 0.15 +
      bodyScore * 0.12 +
      weather.score * 0.15 +
      event.score * 0.18;
  } else if (hasWeather) {
    score = color * 0.5 + weather.score * 0.25 + event.score * 0.25;
  } else if (hasProfile) {
    score = color * 0.45 + skin * 0.2 + bodyScore * 0.15 + event.score * 0.2;
  } else {
    score = color * 0.75 + event.score * 0.25;
  }

  if (outfitId) score -= wornPenalty(outfitId);

  if (state.profile.skinTone && skin >= 85) tags.push("Tene yakışır");
  if (color >= 80) tags.push("Renk uyumu");

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    color: Math.round(color),
    tags: [...new Set(tags)].slice(0, 3),
  };
}

function pickBestMatch(basePieces, candidates, minScore = 62) {
  if (!candidates.length) return null;
  let best = null;
  let bestScore = -1;
  for (const cand of candidates) {
    const { score } = totalOutfitScore([...basePieces, cand]);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return bestScore >= minScore ? best : null;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, rand) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function outfitTitle(score, tags) {
  if (tags.includes("Tene yakışır") && score >= 82) return "Sana özel uyum";
  if (score >= 85) return "Çok yakışır";
  if (score >= 72) return "Güzel uyum";
  return "Uyumlu öneri";
}

function buildOutfits() {
  const tops = state.items.filter((i) => TOPS.has(i.category));
  const bottoms = state.items.filter((i) => BOTTOMS.has(i.category));
  const dresses = state.items.filter((i) => i.category === "elbise");
  const jackets = state.items.filter((i) => i.category === "ceket");
  const shoes = state.items.filter((i) => i.category === "ayakkabi");
  const accessories = state.items.filter((i) => i.category === "aksesuar");

  const rand = mulberry32(state.outfitSeed);
  const outfits = [];
  const seen = new Set();

  const classicPairs = [];
  for (const top of shuffled(tops, rand)) {
    for (const bottom of shuffled(bottoms, rand)) {
      const pairScore = totalOutfitScore([top, bottom]).score;
      if (pairScore >= 55) classicPairs.push({ top, bottom, score: pairScore });
    }
  }
  classicPairs.sort((a, b) => b.score - a.score);

  for (const pair of classicPairs) {
    if (outfits.length >= MAX_OUTFITS * 2) break;
    const pieces = [pair.top, pair.bottom];
    const jacket = pickBestMatch(pieces, jackets, 58);
    if (jacket) pieces.push(jacket);
    const shoe = pickBestMatch(pieces, shoes, 52);
    if (shoe) pieces.push(shoe);
    const acc = pickBestMatch(pieces, accessories, 55);
    if (acc) pieces.push(acc);

    const key = pieces.map((p) => p.id).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const result = totalOutfitScore(pieces, key);
    outfits.push({
      id: key,
      pieces,
      score: result.score,
      colorScore: result.color,
      tags: result.tags,
      title: outfitTitle(result.score, result.tags),
    });
  }

  for (const dress of shuffled(dresses, rand)) {
    if (outfits.length >= MAX_OUTFITS * 2) break;
    const pieces = [dress];
    const jacket = pickBestMatch(pieces, jackets, 58);
    if (jacket) pieces.push(jacket);
    const shoe = pickBestMatch(pieces, shoes, 52);
    if (shoe) pieces.push(shoe);
    const acc = pickBestMatch(pieces, accessories, 55);
    if (acc) pieces.push(acc);

    const key = pieces.map((p) => p.id).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const result = totalOutfitScore(pieces, key);
    outfits.push({
      id: key,
      pieces,
      score: result.score,
      colorScore: result.color,
      tags: result.tags,
      title: outfitTitle(result.score, result.tags),
    });
  }

  outfits.sort((a, b) => {
    const aFav = state.meta.favorites.includes(a.id) ? 1 : 0;
    const bFav = state.meta.favorites.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return b.score - a.score;
  });
  state.outfits = outfits.slice(0, MAX_OUTFITS);
}

function updateOutfitHint() {
  const skin = SKIN_TONES.find((t) => t.id === state.profile.skinTone);
  const body = BODY_TYPES.find((t) => t.id === state.profile.bodyType);
  const event = EVENTS.find((e) => e.id === state.meta.event);
  const m = getBodyMetrics();
  const parts = [];
  if (event) parts.push(event.label);
  if (m?.height) parts.push(`${m.height} cm`);
  if (m?.weight) parts.push(`${m.weight} kg`);
  if (state.weather?.temp != null) parts.push(`${state.weather.city} hava`);
  if (skin) parts.push(skin.label + " ten");
  if (body) parts.push(body.label);
  if (parts.length) {
    els.outfitHint.textContent = `${parts.join(" · ")} ve renk uyumuna göre öneriler.`;
  } else {
    els.outfitHint.textContent =
      "Renk uyumuna göre birbirine yakışan otomatik kombinler. Profil ve şehir ekle, daha kişisel olsun.";
  }
}

function weatherCodeLabel(code) {
  if (code === 0) return "Açık";
  if (code <= 3) return "Parçalı bulutlu";
  if (code <= 48) return "Sisli";
  if (code <= 57) return "Çisenti";
  if (code <= 67) return "Yağmurlu";
  if (code <= 77) return "Karlı";
  if (code <= 82) return "Sağanak";
  if (code <= 86) return "Kar sağanağı";
  return "Fırtınalı";
}

function weatherBand(temp) {
  if (temp >= 26) return "hot";
  if (temp >= 18) return "mild";
  if (temp >= 10) return "cool";
  return "cold";
}

function weatherTipFor(weather) {
  if (!weather) return "Bugünkü öneriler havaya göre şekillenir.";
  if (weather.wet) return "Yağmur var: kapalı ayakkabı/ceketli kombinler öne çıkar.";
  if (weather.band === "hot") return "Sıcak gün: hafif üstler ve ferah altlar önerilir.";
  if (weather.band === "mild") return "Ilıman gün: dengeli, rahat kombinler uygun.";
  if (weather.band === "cool") return "Serin: sweatshirt veya hafif ceket iyi gider.";
  return "Soğuk: katmanlı ve ceketli kombinler önerilir.";
}

function daySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

async function fetchWeatherForCity(city) {
  const query = city.trim();
  if (!query) {
    state.weather = null;
    return null;
  }

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=1&language=tr&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error("geo");
  const geoData = await geoRes.json();
  const place = geoData.results?.[0];
  if (!place) throw new Error("not-found");

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error("weather");
  const weatherData = await weatherRes.json();
  const temp = Math.round(weatherData.current.temperature_2m);
  const code = weatherData.current.weather_code;
  const wet =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

  state.weather = {
    city: place.name,
    temp,
    code,
    label: weatherCodeLabel(code),
    band: weatherBand(temp),
    wet,
    fetchedAt: Date.now(),
  };
  return state.weather;
}

function outfitCardHtml(outfit, extraClass = "", style = "") {
  const isFav = state.meta.favorites.includes(outfit.id);
  const isWorn = Boolean(state.meta.worn[outfit.id]);
  const wornClass = isWorn ? "is-worn" : "";
  return `
    <article class="outfit-card ${extraClass} ${wornClass}" data-outfit-id="${outfit.id}" ${
      style ? `style="${style}"` : ""
    }>
      <div class="outfit-meta">
        <div>
          <p class="outfit-title">${outfit.title}${isWorn ? " · Giyildi" : ""}</p>
          <p class="outfit-score">Uyum %${outfit.score} · Renk %${outfit.colorScore}</p>
          ${
            outfit.tags?.length
              ? `<div class="outfit-tags">${outfit.tags
                  .map((t) => `<span class="outfit-tag">${t}</span>`)
                  .join("")}</div>`
              : ""
          }
        </div>
        <div class="outfit-swatches" aria-hidden="true">
          ${outfit.pieces
            .map((p) => `<span class="swatch" style="background:${p.color?.hex || "#ccc"}"></span>`)
            .join("")}
        </div>
      </div>
      <div class="outfit-pieces">
        ${outfit.pieces
          .map(
            (p) => `
          <figure class="outfit-piece">
            <img src="${p.dataUrl}" alt="${categoryLabel(p.category)}" />
            <figcaption>${categoryLabel(p.category)}</figcaption>
          </figure>
        `
          )
          .join("")}
      </div>
      <div class="outfit-actions">
        <button type="button" class="outfit-action ${isFav ? "active" : ""}" data-action="fav" data-id="${outfit.id}">
          ${isFav ? "★ Favori" : "☆ Favori"}
        </button>
        <button type="button" class="outfit-action ${isWorn ? "active" : ""}" data-action="worn" data-id="${outfit.id}">
          ${isWorn ? "Giyildi ✓" : "Giyildi"}
        </button>
        <button type="button" class="outfit-action" data-action="share" data-id="${outfit.id}">
          Paylaş
        </button>
      </div>
    </article>
  `;
}

function renderEventChips() {
  els.eventChips.querySelectorAll("[data-event]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.event === state.meta.event && !state.showFavoritesOnly);
  });
  const favBtn = els.eventChips.querySelector("[data-filter='favorites']");
  favBtn?.classList.toggle("active", state.showFavoritesOnly);
}

function buildShoppingNotes() {
  const notes = [];
  const bottoms = state.items.filter((i) => BOTTOMS.has(i.category) || i.category === "elbise");
  const tops = state.items.filter((i) => TOPS.has(i.category));
  const m = getBodyMetrics();

  if (m) {
    if (m.heightBand === "short") {
      notes.push(
        `<strong>${m.height} cm</strong> boyuna göre yüksek bel pantolon, kısa ceket veya tek renk kombinler boyunu uzatır.`
      );
    } else if (m.heightBand === "tall") {
      notes.push(
        `<strong>${m.height} cm</strong> boyuna uzun ceket, maxi etek veya dikey çizgili parçalar silueti tamamlar.`
      );
    }

    if (m.weightBand === "light") {
      notes.push(
        "Kilo / boy oranına göre <strong>katmanlı üstler</strong>, sweatshirt veya aksesuar hacim dengesi sağlar."
      );
    } else if (m.weightBand === "solid" || m.weightBand === "full") {
      notes.push(
        "Kilo / boy oranına göre <strong>yapılandırılmış ceket</strong>, gömlek ve koyu nötr altlar daha toparlayıcı durur."
      );
    } else if (m.weightBand === "balanced" && m.height && m.weight) {
      notes.push(
        `<strong>${m.height} cm · ${m.weight} kg</strong> için dengeli kesimler iyi gider — eksik rengi tamamlayan bir üst düşün.`
      );
    }

    if (m.gender === "erkek") {
      const hasPants = state.items.some((i) => i.category === "pantolon");
      const hasShirt = state.items.some((i) => i.category === "gomlek");
      if (!hasPants) notes.push("Erkek profiline göre klasik <strong>pantolon</strong> çoğu kombini oturtur.");
      if (!hasShirt) notes.push("İş / günlük için nötr bir <strong>gömlek</strong> alışveriş listene eklenebilir.");
    } else if (m.gender === "kiz") {
      const hasSkirtOrDress = state.items.some((i) => i.category === "etek" || i.category === "elbise");
      if (!hasSkirtOrDress) {
        notes.push("Kız profiline göre bir <strong>etek</strong> veya <strong>elbise</strong> özel gün kombinlerini zenginleştirir.");
      }
    }
  }

  for (const item of bottoms.slice(0, 3)) {
    const label = categoryLabel(item.category).toLowerCase();
    const own = colorNameFromHsl(item.color);
    const comp = complementaryColorHint(item.color);
    const ana = analogousColorHint(item.color);

    const hasGoodTop = tops.some((t) => colorPairScore(item.color, t.color) >= 72);
    if (!hasGoodTop) {
      let extra = "";
      if (m?.heightBand === "short") extra = " Kısa boy için üstü biraz crop veya belde biten olsun.";
      if (m?.heightBand === "tall") extra = " Uzun boy için üstü biraz uzun veya katmanlı seç.";
      if (m?.weightBand === "solid" || m?.weightBand === "full") {
        extra += " Akışkan kumaş / V yaka daha rahat durur.";
      }
      notes.push(
        `Bu <strong>${own} ${label}</strong> için dolabında uyumlu üst az. <strong>${comp}</strong> veya <strong>${ana}</strong> bir üst yakışır.${extra}`
      );
    }
  }

  const hasJacket = state.items.some((i) => i.category === "ceket");
  if (!hasJacket && state.items.length >= 2) {
    if (m?.weightBand === "solid" || m?.weightBand === "full") {
      notes.push("Dolabında <strong>ceket</strong> yok — yapılandırılmış blazer tipi bir ceket formu netleştirir.");
    } else if (m?.heightBand === "tall") {
      notes.push("Dolabında <strong>uzun ceket</strong> yok — boyuna oranlı uzun kesim iyi tamamlar.");
    } else {
      notes.push("Dolabında <strong>ceket</strong> yok — serin gün ve iş kombinleri için nötr bir ceket iyi tamamlar.");
    }
  }

  const hasShoes = state.items.some((i) => i.category === "ayakkabi");
  if (!hasShoes && state.items.length >= 2) {
    notes.push(
      m?.heightBand === "short"
        ? "Henüz <strong>ayakkabı</strong> yok — hafif topuklu veya sivri burun boy uzatır."
        : "Henüz <strong>ayakkabı</strong> yok — siyah veya bej bir çift çoğu kombini toparlar."
    );
  }

  if (!notes.length && state.items.length) {
    notes.push("Dolabın dengeli görünüyor. Eksik renk için <strong>krem</strong> veya <strong>soft mavi</strong> bir üst ekleyebilirsin.");
  }
  if (!state.items.length) {
    notes.push(
      m
        ? "Kıyafet ekledikçe boy / kilona göre kişiselleştirilmiş alışveriş notları gelir."
        : "Kıyafet ekledikçe buraya kişiselleştirilmiş alışveriş notları gelir."
    );
  }

  return notes.slice(0, 4);
}

function renderShoppingNotes() {
  const notes = buildShoppingNotes();
  els.shopNotesList.innerHTML = notes.map((n) => `<p class="shop-note">${n}</p>`).join("");
}

function toggleFavorite(id) {
  const set = new Set(state.meta.favorites);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  state.meta.favorites = [...set];
  saveMeta();
  renderOutfits();
  showToast(set.has(id) ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
}

function toggleWorn(id) {
  if (state.meta.worn[id]) {
    delete state.meta.worn[id];
    showToast("Giyildi işareti kaldırıldı");
  } else {
    state.meta.worn[id] = Date.now();
    showToast("Giyildi olarak işaretlendi — bir süre daha az önerilir");
  }
  saveMeta();
  buildOutfits();
  renderOutfits();
}

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function shareOutfit(id) {
  const outfit = state.outfits.find((o) => o.id === id);
  if (!outfit) return;

  const w = 720;
  const pad = 28;
  const pieceW = Math.floor((w - pad * 2 - (outfit.pieces.length - 1) * 12) / outfit.pieces.length);
  const pieceH = Math.floor(pieceW * 1.3);
  const h = pad + 70 + pieceH + 70;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const grd = ctx.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, "#f7f2fc");
  grd.addColorStop(1, "#e8d9f7");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#4a3572";
  ctx.font = "600 28px Fredoka, sans-serif";
  ctx.fillText("AuraFit", pad, pad + 28);
  ctx.font = "600 20px Nunito, sans-serif";
  ctx.fillStyle = "#8e7aa8";
  ctx.fillText(outfit.title, pad, pad + 56);

  let x = pad;
  for (const piece of outfit.pieces) {
    try {
      const img = await loadImageEl(piece.dataUrl);
      const scale = Math.max(pieceW / img.width, pieceH / img.height);
      const sw = pieceW / scale;
      const sh = pieceH / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      roundRect(ctx, x, pad + 70, pieceW, pieceH, 18);
      ctx.save();
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, pad + 70, pieceW, pieceH);
      ctx.restore();
    } catch {
      ctx.fillStyle = "#ddd";
      roundRect(ctx, x, pad + 70, pieceW, pieceH, 18);
      ctx.fill();
    }
    x += pieceW + 12;
  }

  ctx.fillStyle = "#7a4fb0";
  ctx.font = "600 16px Nunito, sans-serif";
  ctx.fillText(`Uyum %${outfit.score}`, pad, h - 24);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const file = new File([blob], "aurfit-kombin.png", { type: "image/png" });
  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "AuraFit kombin",
        text: `${outfit.title} · AuraFit`,
      });
      showToast("Kombin paylaşıldı");
      return;
    }
  } catch {
    /* user cancelled or share failed → download */
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aurfit-kombin.png";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Kombin görseli indirildi");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function maybeSendMorningNotification({ force = false } = {}) {
  if (!state.meta.notifications && !force) return;
  if (!force && state.meta.lastNotifyDate === todayKey()) return;

  const hour = new Date().getHours();
  if (!force && (hour < 6 || hour > 11)) return;

  await ensureAllColors();
  if (state.profile.city && !state.weather) {
    try {
      await fetchWeatherForCity(state.profile.city);
    } catch {
      /* ignore */
    }
  }

  state.outfitSeed = daySeed();
  buildOutfits();
  const daily = state.outfits[0];
  const weatherPart = state.weather
    ? `${state.weather.city} ${state.weather.temp}° · ${state.weather.label}`
    : "Hava için şehir ekle";
  const outfitPart = daily
    ? `Günün kombini: ${daily.title} (%${daily.score})`
    : "Dolaba kıyafet ekleyince kombin önerilir";
  const body = `${weatherPart}\n${outfitPart}`;

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("AuraFit · Günaydın", { body, tag: "aurfit-morning" });
    } catch {
      /* ignore */
    }
  }

  showToast(`Günaydın · ${weatherPart} · ${outfitPart}`, 4500);
  state.meta.lastNotifyDate = todayKey();
  saveMeta();
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Bu tarayıcı bildirimi desteklemiyor — uygulama içi hatırlatma açık");
    state.meta.notifications = true;
    saveMeta();
    return;
  }
  const permission = await Notification.requestPermission();
  state.meta.notifications = permission === "granted" || permission === "default";
  if (permission === "denied") {
    state.meta.notifications = true;
    showToast("Sistem bildirimi kapalı; sabah uygulama içi hatırlatma kullanılacak");
  } else {
    showToast("Sabah bildirimi açıldı");
  }
  saveMeta();
  await maybeSendMorningNotification({ force: true });
}

function renderOutfits() {
  updateOutfitHint();
  renderEventChips();
  renderShoppingNotes();

  let list = state.outfits;
  if (state.showFavoritesOnly) {
    list = state.outfits.filter((o) => state.meta.favorites.includes(o.id));
  }

  if (!list.length) {
    els.outfitList.innerHTML = "";
    els.outfitEmpty.classList.remove("hidden");
    els.outfitEmpty.textContent = state.showFavoritesOnly
      ? "Henüz favori kombin yok. Bir kombine ★ Favori de."
      : "En az bir üst (tişört/gömlek/sweatshirt) ve bir alt (pantolon/etek) veya bir elbise ekle.";
    return;
  }

  els.outfitEmpty.classList.add("hidden");
  els.outfitList.innerHTML = list
    .map((outfit, index) => outfitCardHtml(outfit, "", `animation-delay: ${index * 0.05}s`))
    .join("");
}

function renderWeatherCard() {
  if (!state.profile.city) {
    els.weatherTemp.textContent = "—°";
    els.weatherCity.textContent = "Şehir seçilmedi";
    els.weatherDesc.textContent = "Profil’den şehir ekle";
    els.weatherTip.textContent = "Hava, kombin önerilerini etkiler.";
    return;
  }

  if (state.weatherLoading) {
    els.weatherTemp.textContent = "…";
    els.weatherCity.textContent = state.profile.city;
    els.weatherDesc.textContent = "Yükleniyor";
    els.weatherTip.textContent = "Bir saniye…";
    return;
  }

  if (!state.weather) {
    els.weatherTemp.textContent = "—°";
    els.weatherCity.textContent = state.profile.city;
    els.weatherDesc.textContent = "Hava alınamadı";
    els.weatherTip.textContent = "Şehir adını kontrol edip tekrar kaydet.";
    return;
  }

  els.weatherTemp.textContent = `${state.weather.temp}°`;
  els.weatherCity.textContent = state.weather.city;
  els.weatherDesc.textContent = state.weather.label;
  els.weatherTip.textContent = weatherTipFor(state.weather);
}

async function refreshWeather({ silent = false } = {}) {
  const city = state.profile.city?.trim();
  if (!city) {
    state.weather = null;
    renderWeatherCard();
    return;
  }
  if (state.weatherLoading) return;

  state.weatherLoading = true;
  if (!silent) renderWeatherCard();
  try {
    await fetchWeatherForCity(city);
  } catch {
    // Keep last successful weather if poll fails
    if (!state.weather) state.weather = null;
  } finally {
    state.weatherLoading = false;
  }
  renderWeatherCard();
}

async function refreshKesfet() {
  await refreshWeather({ silent: false });
}

function startWeatherPolling() {
  if (state.weatherTimer) clearInterval(state.weatherTimer);
  state.weatherTimer = setInterval(() => {
    if (!state.profile.city?.trim()) return;
    refreshWeather({ silent: true });
  }, 1000);
}

function parseJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function setUser(user) {
  state.profile.user = user;
  saveProfile();
  renderAuthBar();
  renderProfile();
}

function signOutUser() {
  state.profile.user = null;
  saveProfile();
  if (window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }
  renderAuthBar();
}

function gmailIconSvg() {
  return `<svg class="auth-g-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4z"/>
    <path fill="#fff" d="M5 7.2 12 12l7-4.8V7l-7 4.8L5 7v.2z"/>
  </svg>`;
}

function renderAuthBar() {
  const user = state.profile.user;
  if (user) {
    const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    const avatar = user.picture
      ? `<img class="auth-avatar" src="${user.picture}" alt="" />`
      : `<span class="auth-avatar">${initial}</span>`;
    els.authBar.innerHTML = `
      <div class="auth-row">
        ${avatar}
        <div class="auth-meta">
          <p class="auth-name">${user.name || "Hesap"}</p>
          <p class="auth-email">${user.email || ""}</p>
        </div>
        <button type="button" class="auth-out" id="sign-out-btn">Çıkış</button>
      </div>
    `;
    els.googleBtnHost.classList.add("hidden");
    els.googleBtnHost.innerHTML = "";
    document.getElementById("sign-out-btn")?.addEventListener("click", signOutUser);
    return;
  }

  els.authBar.innerHTML = `
    <button type="button" class="auth-gmail-btn" id="gmail-sign-in-btn">
      ${gmailIconSvg()}
      Gmail ile giriş
    </button>
    <div class="auth-email-fallback hidden" id="auth-email-fallback">
      <input type="email" class="city-input" id="gmail-fallback-input" placeholder="ornek@gmail.com" />
      <button type="button" class="capture-btn" id="gmail-fallback-save">Gir</button>
    </div>
  `;

  document.getElementById("gmail-sign-in-btn")?.addEventListener("click", startGmailSignIn);
  document.getElementById("gmail-fallback-save")?.addEventListener("click", submitGmailFallback);
  document.getElementById("gmail-fallback-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitGmailFallback();
  });
}

function submitGmailFallback() {
  const input = document.getElementById("gmail-fallback-input");
  const email = input?.value.trim().toLowerCase() || "";
  if (!email.endsWith("@gmail.com") && !email.endsWith("@googlemail.com")) {
    if (els.cityHint) {
      /* keep quiet */
    }
    input?.focus();
    input?.setCustomValidity("Gmail adresi gir");
    input?.reportValidity();
    return;
  }
  input?.setCustomValidity("");
  const name = email.split("@")[0];
  setUser({
    email,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    picture: null,
    provider: "gmail-local",
  });
}

function handleGoogleCredential(response) {
  const payload = parseJwtPayload(response.credential);
  if (!payload?.email) return;
  setUser({
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split("@")[0],
    picture: payload.picture || null,
    provider: "google",
    sub: payload.sub,
  });
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector("script[data-google-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.googleGis = "1";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initGoogleSignIn() {
  if (!GOOGLE_CLIENT_ID) return false;
  try {
    await loadGoogleScript();
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    state.googleReady = true;
    return true;
  } catch {
    state.googleReady = false;
    return false;
  }
}

async function startGmailSignIn() {
  if (GOOGLE_CLIENT_ID) {
    const ok = state.googleReady || (await initGoogleSignIn());
    if (ok && window.google?.accounts?.id) {
      els.googleBtnHost.classList.remove("hidden");
      els.googleBtnHost.innerHTML = "";
      google.accounts.id.renderButton(els.googleBtnHost, {
        theme: "outline",
        size: "medium",
        text: "signin_with",
        shape: "pill",
        width: 280,
      });
      google.accounts.id.prompt();
      return;
    }
  }

  // Yerel önizleme: Google Client ID yoksa kompakt Gmail e-posta girişi
  const fallback = document.getElementById("auth-email-fallback");
  fallback?.classList.toggle("hidden");
  document.getElementById("gmail-fallback-input")?.focus();
}

function renderProfile() {
  renderAuthBar();
  els.cityInput.value = state.profile.city || "";
  els.cityHint.textContent = state.profile.city
    ? `${state.profile.city} için hava durumu Keşfet’te kullanılır.`
    : "Hava durumuna göre kombin önerilir.";

  if (els.notifyToggle) {
    els.notifyToggle.checked = Boolean(state.meta.notifications);
  }
  if (els.notifyHint) {
    els.notifyHint.textContent = state.meta.notifications
      ? "Sabah hatırlatması açık (hava + günün kombini)."
      : "Açıkken her sabah bir hatırlatma gönderilir.";
  }

  els.genderOptions.querySelectorAll("[data-gender]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.gender === state.profile.gender);
    btn.setAttribute("aria-checked", String(btn.dataset.gender === state.profile.gender));
  });

  els.heightInput.value = state.profile.height || "";
  els.weightInput.value = state.profile.weight || "";

  els.skinToneOptions.innerHTML = SKIN_TONES.map(
    (tone) => `
    <button
      type="button"
      class="tone-option ${state.profile.skinTone === tone.id ? "active" : ""}"
      data-skin="${tone.id}"
      role="radio"
      aria-checked="${state.profile.skinTone === tone.id}"
    >
      <span class="tone-swatch" style="background:${tone.hex}"></span>
      <span>${tone.label}</span>
    </button>
  `
  ).join("");

  els.bodyTypeOptions.innerHTML = BODY_TYPES.map(
    (body) => `
    <button
      type="button"
      class="body-option ${state.profile.bodyType === body.id ? "active" : ""}"
      data-body="${body.id}"
      role="radio"
      aria-checked="${state.profile.bodyType === body.id}"
    >
      <span class="body-name">${body.label}</span>
      <span class="body-desc">${body.desc}</span>
    </button>
  `
  ).join("");

  const skin = SKIN_TONES.find((t) => t.id === state.profile.skinTone);
  const body = BODY_TYPES.find((t) => t.id === state.profile.bodyType);
  const bits = [];
  if (state.profile.user?.email) bits.push(state.profile.user.email);
  if (state.profile.gender === "kiz") bits.push("Kız");
  if (state.profile.gender === "erkek") bits.push("Erkek");
  if (state.profile.height) bits.push(`${state.profile.height} cm`);
  if (state.profile.weight) bits.push(`${state.profile.weight} kg`);
  if (state.profile.city) bits.push(state.profile.city);
  if (skin) bits.push(skin.label);
  if (body) bits.push(body.label);
  if (bits.length) {
    els.profileNote.textContent = `${bits.join(" · ")} kaydedildi. Öneriler buna göre güncellenir.`;
  } else {
    els.profileNote.textContent = "Seçimlerin kaydedilir; Keşfet ve Kombin’de kullanılır.";
  }
}

async function refreshOutfits({ reshuffle = false } = {}) {
  await ensureAllColors();
  if (state.profile.city && !state.weather && !state.weatherLoading) {
    try {
      await fetchWeatherForCity(state.profile.city);
    } catch {
      state.weather = null;
    }
  }
  if (reshuffle) state.outfitSeed = Date.now();
  buildOutfits();
  renderOutfits();
}

function setTab(tabId) {
  state.activeTab = tabId;

  els.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  els.screens.forEach((screen) => {
    screen.classList.toggle("hidden", screen.dataset.screen !== tabId);
  });

  if (tabId === "kesfet") refreshKesfet();
  if (tabId === "dolap") renderDolap();
  if (tabId === "kombin") refreshOutfits();
  if (tabId === "profil") renderProfile();
}

function itemsForCategory(categoryId) {
  return state.items.filter((item) => item.category === categoryId);
}

function renderChips() {
  els.chips.innerHTML = CATEGORIES.map((cat) => {
    const count = itemsForCategory(cat.id).length;
    const active = cat.id === state.activeCategory ? "active" : "";
    return `
      <button
        type="button"
        class="chip ${active}"
        data-category="${cat.id}"
        role="tab"
        aria-selected="${cat.id === state.activeCategory}"
      >
        ${cat.label}
        <span class="chip-count">${count}</span>
      </button>
    `;
  }).join("");
}

function renderItems() {
  const category = CATEGORIES.find((c) => c.id === state.activeCategory);
  const items = itemsForCategory(state.activeCategory);

  els.categoryLabel.textContent = category.label;
  els.totalCount.textContent = `${state.items.length} parça`;

  if (items.length === 0) {
    els.itemsGrid.innerHTML = "";
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.itemsGrid.innerHTML = items
    .map(
      (item) => `
      <article class="item-card" data-id="${item.id}">
        <img src="${item.dataUrl}" alt="${category.label}" />
        ${item.color?.hex ? `<span class="item-swatch" style="background:${item.color.hex}"></span>` : ""}
        <button type="button" class="item-delete" data-delete="${item.id}" aria-label="Sil">×</button>
      </article>
    `
    )
    .join("");
}

function renderDolap() {
  renderChips();
  renderItems();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const dataUrl = await fileToDataUrl(file);
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: state.activeCategory,
    dataUrl,
    createdAt: Date.now(),
  };
  await ensureItemColor(item);
  state.items.unshift(item);
  saveItems();
  renderDolap();
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  saveItems();
  renderDolap();
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
});

els.goButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.go));
});

els.chips.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-category]");
  if (!chip) return;
  state.activeCategory = chip.dataset.category;
  renderDolap();
});

(function enableChipDragScroll() {
  const track = els.chips;
  let active = false;
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  const THRESHOLD = 8;

  track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    active = true;
    dragging = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
  });

  track.addEventListener("pointermove", (e) => {
    if (!active) return;
    const dx = e.clientX - startX;
    if (!dragging && Math.abs(dx) < THRESHOLD) return;
    if (!dragging) {
      dragging = true;
      track.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = startScroll - dx;
  });

  function endDrag(e) {
    if (!active) return;
    active = false;
    if (dragging) {
      track.classList.remove("is-dragging");
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      // Prevent the synthetic click after a drag
      const blockClick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        track.removeEventListener("click", blockClick, true);
      };
      track.addEventListener("click", blockClick, true);
    }
    dragging = false;
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
})();

els.captureBtn.addEventListener("click", () => {
  els.cameraInput.value = "";
  els.cameraInput.click();
});

els.cameraInput.addEventListener("change", async () => {
  const file = els.cameraInput.files?.[0];
  if (file) await addPhoto(file);
});

els.itemsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete]");
  if (!btn) return;
  deleteItem(btn.dataset.delete);
});

els.refreshOutfits.addEventListener("click", () => {
  refreshOutfits({ reshuffle: true });
});

els.skinToneOptions.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-skin]");
  if (!btn) return;
  state.profile.skinTone =
    state.profile.skinTone === btn.dataset.skin ? null : btn.dataset.skin;
  saveProfile();
  renderProfile();
});

els.bodyTypeOptions.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-body]");
  if (!btn) return;
  state.profile.bodyType =
    state.profile.bodyType === btn.dataset.body ? null : btn.dataset.body;
  saveProfile();
  renderProfile();
});

async function saveCityFromInput() {
  const city = els.cityInput.value.trim();
  state.profile.city = city;
  saveProfile();
  state.weather = null;
  els.cityHint.textContent = city ? "Hava durumu güncelleniyor…" : "Hava durumuna göre kombin önerilir.";
  renderProfile();
  if (city) {
    state.weatherLoading = true;
    try {
      await fetchWeatherForCity(city);
      els.cityHint.textContent = `${state.weather.city}: ${state.weather.temp}° · ${state.weather.label}`;
    } catch {
      state.weather = null;
      els.cityHint.textContent = "Şehir bulunamadı. Örn. İstanbul yazıp tekrar dene.";
    } finally {
      state.weatherLoading = false;
    }
  }
  renderProfile();
}

els.saveCityBtn.addEventListener("click", () => {
  saveCityFromInput();
});

els.cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveCityFromInput();
  }
});

els.eventChips.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-filter='favorites']");
  if (fav) {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    renderOutfits();
    return;
  }
  const eventBtn = e.target.closest("[data-event]");
  if (!eventBtn) return;
  state.showFavoritesOnly = false;
  state.meta.event = eventBtn.dataset.event;
  saveMeta();
  buildOutfits();
  renderOutfits();
});

els.outfitList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === "fav") toggleFavorite(id);
  if (action === "worn") toggleWorn(id);
  if (action === "share") shareOutfit(id);
});

els.notifyToggle?.addEventListener("change", async () => {
  if (els.notifyToggle.checked) {
    await enableNotifications();
  } else {
    state.meta.notifications = false;
    saveMeta();
    showToast("Sabah bildirimi kapatıldı");
  }
  renderProfile();
});

els.genderOptions.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-gender]");
  if (!btn) return;
  state.profile.gender =
    state.profile.gender === btn.dataset.gender ? null : btn.dataset.gender;
  saveProfile();
  renderProfile();
  buildOutfits();
  renderShoppingNotes();
  showToast(state.profile.gender === "kiz" ? "Kız seçildi" : state.profile.gender === "erkek" ? "Erkek seçildi" : "Cinsiyet kaldırıldı");
});

function saveBodyStats() {
  const height = Number(els.heightInput.value);
  const weight = Number(els.weightInput.value);
  state.profile.height = height >= 100 && height <= 230 ? height : null;
  state.profile.weight = weight >= 30 && weight <= 250 ? weight : null;
  saveProfile();
  renderProfile();
  if (state.profile.height || state.profile.weight) {
    buildOutfits();
    renderShoppingNotes();
    showToast("Boy / kilo kaydedildi — öneriler güncellendi");
  } else {
    showToast("Geçerli boy (cm) ve kilo (kg) gir");
  }
}

els.saveStatsBtn.addEventListener("click", saveBodyStats);
els.heightInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveBodyStats();
  }
});
els.weightInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveBodyStats();
  }
});

renderDolap();
renderProfile();
refreshKesfet();
startWeatherPolling();
maybeSendMorningNotification();
