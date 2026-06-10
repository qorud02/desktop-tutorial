/* ════════════════════════════════════════════
   BIZ map — 상권분석 데모 앱
   ════════════════════════════════════════════ */

/* ── 지도 초기화 ─────────────────────────── */
const map = L.map("map", { zoomControl: false }).setView([37.5665, 126.978], 12);

const LAYERS = {
  base: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }),
  satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles © Esri" }
  ),
  terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17,
    attribution: '© OpenTopoMap (CC-BY-SA)',
  }),
};
LAYERS.base.addTo(map);

document.querySelectorAll(".map-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    Object.values(LAYERS).forEach((l) => map.removeLayer(l));
    LAYERS[btn.dataset.type].addTo(map);
  });
});

document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());

/* ── 시드 기반 의사난수 (지역+업종이 같으면 항상 같은 보고서) ── */
function hashStr(s) {
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── 상태 ───────────────────────────────── */
let selectedRegion = null;
let selectedCategory = null;
let regionShape = null; // 지도 위 하이라이트 폴리곤
const charts = {};      // Chart.js 인스턴스 (재생성 시 destroy)

/* ── 자동완성 ────────────────────────────── */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function highlightMatch(name, q) {
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escapeHtml(name);
  return (
    escapeHtml(name.slice(0, idx)) +
    "<mark>" + escapeHtml(name.slice(idx, idx + q.length)) + "</mark>" +
    escapeHtml(name.slice(idx + q.length))
  );
}

function setupAutocomplete({ inputEl, listEl, search, render, onSelect }) {
  let items = [];
  let focusIdx = -1;

  function close() {
    listEl.classList.remove("open");
    listEl.innerHTML = "";
    items = [];
    focusIdx = -1;
  }

  function open(results, q) {
    items = results;
    focusIdx = -1;
    listEl.innerHTML = results.map((it, i) => `<li data-i="${i}">${render(it, q)}</li>`).join("");
    listEl.classList.add("open");
    listEl.querySelectorAll("li").forEach((li) => {
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        pick(items[+li.dataset.i]);
      });
    });
  }

  function pick(item) {
    onSelect(item);
    close();
  }

  inputEl.addEventListener("input", () => {
    const q = inputEl.value.trim();
    onSelect(null); // 입력이 바뀌면 선택 해제
    if (!q) return close();
    const results = search(q).slice(0, 8);
    results.length ? open(results, q) : close();
  });

  inputEl.addEventListener("keydown", (e) => {
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      focusIdx = (focusIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      listEl.querySelectorAll("li").forEach((li, i) => li.classList.toggle("focused", i === focusIdx));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(items[focusIdx >= 0 ? focusIdx : 0]);
    } else if (e.key === "Escape") {
      close();
    }
  });

  inputEl.addEventListener("blur", () => setTimeout(close, 120));
}

const regionInput = document.getElementById("region-input");
const categoryInput = document.getElementById("category-input");

setupAutocomplete({
  inputEl: regionInput,
  listEl: document.getElementById("region-suggest"),
  search: (q) => REGIONS.filter((r) => r.name.includes(q) || r.gu.includes(q)),
  render: (r, q) =>
    `<span>${highlightMatch(r.name, q)}<span class="s-sub">${escapeHtml(r.gu)}</span></span><span class="s-type">${r.type}</span>`,
  onSelect: (r) => {
    selectedRegion = r;
    if (r) {
      regionInput.value = r.name;
      focusRegion(r);
    }
    updateButton();
  },
});

setupAutocomplete({
  inputEl: categoryInput,
  listEl: document.getElementById("category-suggest"),
  search: (q) => CATEGORIES.filter((c) => c.name.includes(q) || c.group.includes(q)),
  render: (c, q) => `<span>${highlightMatch(c.name, q)}</span><span class="s-type">${c.group}</span>`,
  onSelect: (c) => {
    selectedCategory = c;
    if (c) categoryInput.value = c.name;
    updateButton();
  },
});

/* ── 지역 하이라이트 (불규칙 폴리곤) ───────── */
function focusRegion(r) {
  if (regionShape) map.removeLayer(regionShape);
  const rand = mulberry32(hashStr(r.name));
  const points = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const radius = 0.004 + rand() * 0.004; // 약 400~800m
    points.push([r.lat + Math.sin(angle) * radius, r.lng + Math.cos(angle) * radius * 1.25]);
  }
  regionShape = L.polygon(points, {
    color: "#2f6bff",
    weight: 2,
    fillColor: "#2f6bff",
    fillOpacity: 0.18,
  }).addTo(map);
  map.flyTo([r.lat, r.lng], 15, { duration: 0.8 });
}

/* ── 일일 무료 생성 횟수 (localStorage) ────── */
const QUOTA_MAX = 5;
const QUOTA_KEY = "bizmap-quota";

function getQuota() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const saved = JSON.parse(localStorage.getItem(QUOTA_KEY));
    if (saved && saved.date === today) return saved.used;
  } catch (_) {}
  return 0;
}
function setQuota(used) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: today, used }));
  document.getElementById("quota-used").textContent = used;
}

const generateBtn = document.getElementById("generate-btn");

function updateButton() {
  const used = getQuota();
  document.getElementById("quota-used").textContent = used;
  generateBtn.disabled = !(selectedRegion && selectedCategory) || used >= QUOTA_MAX;
}
updateButton();

/* ── 토스트 ─────────────────────────────── */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ── 보고서 생성 ─────────────────────────── */
generateBtn.addEventListener("click", () => {
  const used = getQuota();
  if (used >= QUOTA_MAX) {
    showToast("오늘의 무료 보고서 생성 횟수를 모두 사용했어요. 내일 다시 이용해주세요.");
    return;
  }
  setQuota(used + 1);
  updateButton();
  buildReport(selectedRegion, selectedCategory);
});

const overlay = document.getElementById("report-overlay");
document.getElementById("report-close").addEventListener("click", () => (overlay.hidden = true));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.hidden) overlay.hidden = true;
});

const MONTHS = ["7월", "8월", "9월", "10월", "11월", "12월", "1월", "2월", "3월", "4월", "5월", "6월"];
const HOURS = ["06시", "08시", "10시", "12시", "14시", "16시", "18시", "20시", "22시", "24시"];
const AGES = ["10대", "20대", "30대", "40대", "50대", "60대+"];
const GRADES = ["A", "B+", "B", "C+", "C"];

function fmtMoney(v) {
  return v >= 10000 ? (v / 10000).toFixed(1) + "억" : Math.round(v).toLocaleString() + "만";
}

function makeChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function buildReport(region, category) {
  const rand = mulberry32(hashStr(region.name + "|" + category.name));

  /* 데이터 생성 */
  const baseSales = 1800 + rand() * 8200; // 월 추정 매출 (만원)
  const sales = MONTHS.map((_, i) => Math.round(baseSales * (0.82 + rand() * 0.36 + i * 0.012)));
  const baseTraffic = 18000 + rand() * 90000;
  const trafficCurve = [0.25, 0.55, 0.7, 1.0, 0.85, 0.8, 0.95, 0.75, 0.5, 0.3];
  const traffic = trafficCurve.map((w) => Math.round(baseTraffic * w * (0.85 + rand() * 0.3) / 10));
  const ageWeights = [0.5 + rand(), 1.2 + rand() * 1.5, 1.0 + rand() * 1.2, 0.9 + rand(), 0.7 + rand() * 0.8, 0.4 + rand() * 0.6];
  const ageSum = ageWeights.reduce((a, b) => a + b, 0);
  const ages = ageWeights.map((w) => Math.round((w / ageSum) * 100));
  const storeBase = 8 + Math.round(rand() * 60);
  const stores = MONTHS.map((_, i) => Math.max(2, Math.round(storeBase + (rand() - 0.45) * 6 + i * (rand() > 0.5 ? 0.4 : -0.2))));
  const grade = GRADES[Math.floor(rand() * GRADES.length)];
  const salesDelta = Math.round((rand() - 0.4) * 18);
  const evalScores = {
    "유동인구": 40 + Math.round(rand() * 60),
    "주거인구": 40 + Math.round(rand() * 60),
    "직장인구": 40 + Math.round(rand() * 60),
    "경쟁 수준": 40 + Math.round(rand() * 60),
    "교통 접근성": 40 + Math.round(rand() * 60),
    "성장성": 40 + Math.round(rand() * 60),
  };

  /* 헤더 */
  document.getElementById("report-title").textContent = `${region.name} · ${category.name}`;
  document.getElementById("report-sub").textContent =
    `${region.type} 기준 반경 상권 · ${new Date().toLocaleDateString("ko-KR")} 생성`;

  /* 요약 카드 */
  document.getElementById("summary-grid").innerHTML = `
    <div class="summary-card">
      <div class="sc-label">상권 등급</div>
      <div class="sc-value grade">${grade}</div>
    </div>
    <div class="summary-card">
      <div class="sc-label">월 추정 매출</div>
      <div class="sc-value">${fmtMoney(sales[sales.length - 1])}원</div>
      <div class="sc-extra ${salesDelta >= 0 ? "up" : "down"}">전월 대비 ${salesDelta >= 0 ? "▲" : "▼"} ${Math.abs(salesDelta)}%</div>
    </div>
    <div class="summary-card">
      <div class="sc-label">일평균 유동인구</div>
      <div class="sc-value">${Math.round(baseTraffic / 30).toLocaleString()}명</div>
    </div>
    <div class="summary-card">
      <div class="sc-label">동일업종 업소 수</div>
      <div class="sc-value">${stores[stores.length - 1]}개</div>
    </div>`;

  document.getElementById("sales-desc").textContent =
    `${region.name} 상권 내 ${category.name} 업종의 최근 12개월 추정 매출 추이입니다.`;
  document.getElementById("traffic-desc").textContent =
    `시간대별 평균 유동인구(천 명 단위)로, 피크 시간대는 ${HOURS[traffic.indexOf(Math.max(...traffic))]} 전후입니다.`;

  /* 차트 */
  const blue = "#2f6bff";
  makeChart("chart-sales", {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "추정 매출(만원)",
        data: sales,
        borderColor: blue,
        backgroundColor: "rgba(47,107,255,0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  makeChart("chart-traffic", {
    type: "bar",
    data: {
      labels: HOURS,
      datasets: [{ label: "유동인구(백 명)", data: traffic, backgroundColor: "rgba(47,107,255,0.75)", borderRadius: 6 }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  makeChart("chart-age", {
    type: "doughnut",
    data: {
      labels: AGES,
      datasets: [{
        data: ages,
        backgroundColor: ["#bcd2ff", "#2f6bff", "#5c8aff", "#89aaff", "#1f51d6", "#dfe9ff"],
      }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "right" } } },
  });

  makeChart("chart-stores", {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "업소 수",
        data: stores,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        fill: true,
        stepped: true,
        pointRadius: 2,
      }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  /* 입지 평가 */
  document.getElementById("eval-list").innerHTML = Object.entries(evalScores)
    .map(([label, score]) => `
      <li>
        <span class="ev-label">${label}</span>
        <span class="ev-bar"><span class="ev-fill" style="width:${score}%"></span></span>
        <span class="ev-score">${score}</span>
      </li>`)
    .join("");

  overlay.hidden = false;
  document.querySelector(".report-body").scrollTop = 0;
}
