/* ============================================================
   Mc_comer Mod · 前端逻辑 v6.3 (双模块 + 热键 + Toast动画)
   ============================================================ */

let _state = {
  connected: false,
  hackStates: {},
  hacks: [],        // 完整配置（从后端获取）
  autoIds: [],
  manualIds: [],
  hotkeys: {},      // {id: {vk, name}}
  stateTimer: null,
  // VIP 状态
  isVip: false,
  userNickname: "",
  userType: "",
  vipDaysLeft: 0,
};

/* ── 工具 ─────────────────────────────────────────────── */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ── Canvas 背景动效（与之前相同）─────────────────────── */
function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  const N = 50;
  const MAX_LINK = 140;
  const pts = [];
  for (let i = 0; i < N; i++) { pts.push({ x: Math.random() * 2000, y: Math.random() * 1200, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.25 }); }
  const bubbles = [];
  for (let i = 0; i < 8; i++) { bubbles.push({ x: Math.random() * (W || window.innerWidth), y: Math.random() * (H || window.innerHeight), r: 30 + Math.random() * 50, vx: (Math.random() - 0.5) * 0.15, vy: -0.12 - Math.random() * 0.18, alpha: 0.015 + Math.random() * 0.025, phase: Math.random() * Math.PI * 2 }); }
  let mouseX = -1000, mouseY = -1000;
  canvas.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  canvas.addEventListener("mouseleave", () => { mouseX = -1000; mouseY = -1000; });
  let scanY = 0, tick = 0;
  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(99,102,241,0.04)"; ctx.lineWidth = 1;
    const gs = 60;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(99,102,241,0.12)"; ctx.fillRect(0, scanY, W, 2);
    ctx.fillStyle = "rgba(99,102,241,0.03)"; ctx.fillRect(0, scanY + 4, W, 5);
    scanY = (scanY + 2) % H;
    for (const b of bubbles) {
      const dx = mouseX - b.x, dy = mouseY - b.y, dist = Math.hypot(dx, dy);
      if (dist < 200 && dist > 0) { const push = (200 - dist) / 200 * 0.5; b.vx -= (dx / dist) * push; b.vy -= (dy / dist) * push; }
      b.x += b.vx + Math.sin(tick * 0.005 + b.phase) * 0.15; b.y += b.vy;
      b.vx *= 0.999; b.vy *= 0.999;
      if (b.y + b.r < 0) { b.y = H + b.r; b.x = Math.random() * W; }
      if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 1.5);
      glow.addColorStop(0, `rgba(59,130,246,${b.alpha * 0.3})`); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.5, 0, Math.PI * 2); ctx.fill();
      const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `rgba(255,255,255,${b.alpha * 0.8})`); grad.addColorStop(0.5, `rgba(99,102,241,${b.alpha * 0.4})`); grad.addColorStop(1, `rgba(59,130,246,${b.alpha * 0.1})`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${b.alpha * 0.6})`; ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, b.r * 0.15, -0.5, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of pts) {
      p.x += p.vx + Math.sin(tick * 0.01 + p.x * 0.001) * 0.1; p.y += p.vy + Math.cos(tick * 0.008 + p.y * 0.001) * 0.1;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
        if (d < MAX_LINK) { const alpha = (1 - d / MAX_LINK) * 0.25; ctx.strokeStyle = `rgba(99,102,241,${alpha})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
    }
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(99,102,241,0.4)"; ctx.fill(); }
    tick++; requestAnimationFrame(frame);
  }
  frame();
}

/* ── 鼠标追踪卡片光效 ────────────────────────────── */
function initCardMouseGlow() {
  const card = document.getElementById("login-card");
  if (!card) return;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--glow-x", x + "%"); card.style.setProperty("--glow-y", y + "%");
  });
  card.addEventListener("mouseleave", () => { card.style.setProperty("--glow-x", "50%"); card.style.setProperty("--glow-y", "50%"); });
}

/* ── 打字机效果 ──────────────────────────────────────── */
async function typeTitle(el, text, speed) {
  el.textContent = "";
  for (let i = 0; i <= text.length; i++) { el.textContent = text.slice(0, i) + "│"; await sleep(speed); }
  let show = true;
  const interval = setInterval(() => {
    if (el.textContent.endsWith("│")) { el.textContent = el.textContent.slice(0, -1); show = false; }
    else if (!show) { el.textContent += "│"; show = true; }
  }, 530);
  return () => clearInterval(interval);
}

/* ── Toast 通知（右下角滑出动画） ──────────────────── */
function showToast(msg, type) {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast-item " + (type || "");
  el.innerHTML = `<span class="toast-icon">${type === "ok" ? "✓" : type === "err" ? "✕" : "ℹ"}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  // 触发入场动画
  requestAnimationFrame(() => el.classList.add("show"));
  // 3.5 秒后滑出 + 移除
  setTimeout(() => {
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

/* ── 状态栏 ──────────────────────────────────────────── */
function setStatusBar(text, type) {
  const dot = document.getElementById("status-dot");
  const textEl = document.getElementById("status-text");
  textEl.textContent = text; textEl.className = "status-text " + (type || "");
  dot.className = "status-dot " + (type || "");
}

/* ── 时钟 ────────────────────────────────────────────── */
function startClock() {
  function tick() {
    const el = document.getElementById("header-clock");
    if (el) { el.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false }); }
    setTimeout(tick, 1000);
  }
  tick();
}

/* ═══════════════════════════════════════════
   登录页逻辑（保持原有功能）
   ═══════════════════════════════════════════ */
let titleCursorTimer = null;

function switchLoginTab(tab) {
  document.getElementById("tab-password").classList.toggle("active", tab === "password");
  document.getElementById("tab-qq").classList.toggle("active", tab === "qq");
  document.getElementById("panel-password").classList.toggle("hidden", tab !== "password");
  document.getElementById("panel-qq").classList.toggle("hidden", tab !== "qq");
  document.getElementById("err-msg").textContent = "";
  document.getElementById("qq-err-msg").textContent = "";
}

async function verifyPassword() {
  const input = document.getElementById("pwd-input");
  const errEl = document.getElementById("err-msg");
  const wrap = document.getElementById("input-wrap");
  const btn = document.getElementById("login-btn");
  const pwd = input.value.trim();
  if (!pwd) { errEl.textContent = "请输入密码"; return; }
  btn.disabled = true; btn.textContent = "验证中…";
  let ok = false;
  try { ok = await window.pywebview.api.verify_password(pwd); }
  catch (e) { btn.disabled = false; btn.textContent = "▶  登  录"; errEl.textContent = "调用失败"; return; }
  if (ok) {
    // 密码登录 → 开发者 → VIP
    try { await window.pywebview.api.set_login_info("password", "0", "开发者"); } catch(e) {}
    enterMainPage(btn, errEl, null);
  }
  else {
    btn.disabled = false; btn.textContent = "▶  登  录";
    errEl.textContent = "✕ 密码错误"; wrap.classList.add("error");
    setTimeout(() => wrap.classList.remove("error"), 500);
    input.value = ""; input.focus();
  }
}

let _codeCountdown = 0;
let _qqPollTimer = null;

async function onQQScanLogin() {
  const btn = document.getElementById("qq-login-btn");
  const errEl = document.getElementById("qq-err-msg");
  const statusText = document.getElementById("qq-status-text");
  const qrImg = document.getElementById("qq-qr-img");
  const placeholder = document.getElementById("qq-qr-placeholder");
  if (btn.dataset.scanning === "1") return;
  btn.disabled = true; btn.textContent = "获取中…"; errEl.textContent = ""; btn.dataset.scanning = "1";
  if (_qqPollTimer) { clearInterval(_qqPollTimer); _qqPollTimer = null; }
  await window.pywebview.api.reset_qq_session();
  try {
    const result = await window.pywebview.api.get_qq_qr_code();
    if (!result.ok) { btn.disabled = false; btn.textContent = "📷  获取二维码"; btn.dataset.scanning = "0"; errEl.textContent = "✕ " + (result.msg || "获取失败"); return; }
    placeholder.classList.add("hidden"); qrImg.classList.remove("hidden");
    qrImg.src = "data:image/png;base64," + result.qr_base64; qrImg.style.display = "block";
    btn.textContent = "等待扫码…"; statusText.textContent = "📱 请用手机 QQ 扫描二维码"; statusText.className = "qq-status-text scanning";
    _qqPollTimer = setInterval(async () => {
      try {
        const status = await window.pywebview.api.check_qq_login();
        if (status.ok) { clearInterval(_qqPollTimer); _qqPollTimer = null; btn.dataset.scanning = "0"; statusText.className = "qq-status-text"; statusText.textContent = "✓ 登录成功";
          try { await window.pywebview.api.set_login_info("qq", status.qq || "", status.nickname || "QQ用户"); } catch(e) {}
          enterMainPage(btn, errEl, (status.nickname || "QQ用户") + " (" + (status.qq || "") + ")"); }
        else if (status.ready === false) {}
        else { clearInterval(_qqPollTimer); _qqPollTimer = null; btn.dataset.scanning = "0"; qrImg.classList.add("hidden"); placeholder.classList.remove("hidden"); btn.disabled = false; btn.textContent = "📷  重新获取"; statusText.className = "qq-status-text expired"; statusText.textContent = status.msg || "二维码已过期"; }
      } catch (e) {}
    }, 3000);
  } catch (e) { btn.disabled = false; btn.textContent = "📷  获取二维码"; btn.dataset.scanning = "0"; errEl.textContent = "✕ 请求失败: " + e.message; }
}

/* ═══════════════════════════════════════════
   进入主界面
   ═══════════════════════════════════════════ */
function enterMainPage(btn, errEl, userEmail) {
  btn.textContent = "✓ 验证成功"; btn.style.background = "var(--success)"; errEl.textContent = "";
  document.getElementById("login-page").classList.remove("active");
  if (titleCursorTimer) titleCursorTimer();
  sleep(400).then(async () => {
    try {
      initMainPage();
      if (userEmail) {
        const userEl = document.getElementById("header-user");
        document.getElementById("header-user-label").textContent = userEmail;
        userEl.classList.remove("hidden");
      }

      // 获取VIP状态
      try {
        const userInfo = await window.pywebview.api.get_user_info();
        _state.isVip = userInfo.is_vip || false;
        _state.userNickname = userInfo.nickname || "";
        _state.userType = userInfo.user_type || "";
        _state.vipDaysLeft = userInfo.vip_days_left || 0;
        applyVipEffects();
      } catch(e) {
        console.warn("get_user_info error", e);
        _state.isVip = false;
      }

      document.getElementById("main-page").classList.add("active");
      startClock();
      await loadHackConfig();
      renderHackList();
      startStatePolling();
    } catch (e) {
      console.error("enterMainPage error:", e);
      showToast("加载主页面失败: " + e.message, "err");
    }
  });
}

function visitOfficialWebsite() {
  window.pywebview.api.open_browser('https://mc-omer-hub.github.io/Mc_comer_Mod_Web/');
  window.pywebview.api.exit_app();
}

/* ── 检查更新 ─────────────────────────────────────
   返回 true 表示弹出了更新/维护遮罩（拦截后续流程） */
async function checkUpdate() {
  try {
    const result = await window.pywebview.api.check_update();
    if (!result) return false;

    // 维护模式
    const maint = await window.pywebview.api.check_maintenance();
    if (maint && maint.maintenance) {
      document.getElementById("maintenance-msg").textContent = maint.message || "系统维护中，请稍后再试";
      document.getElementById("maintenance-overlay").classList.remove("hidden");
      return true;
    }

    if (result.has_update) {
      document.getElementById("update-ver").textContent = "发现新版本!";
      // 更新日志
      const logUl = document.querySelector("#update-log ul");
      if (logUl && result.log) {
        logUl.innerHTML = (Array.isArray(result.log) ? result.log : [result.log])
          .map((line) => "<li>" + line + "</li>").join("");
      }
      // 直接下载按钮
      document.getElementById("btn-dl-direct").onclick = onDirectDownload;
      document.getElementById("update-overlay").classList.remove("hidden");
      return true;
    }
  } catch (e) {
    console.warn("checkUpdate error", e);
  }
  return false;
}

/* ── 直接下载 ───────────────────────────────── */
function onDirectDownload() {
  window.pywebview.api.open_browser(
    "https://gh-proxy.org/https://github.com/Mc-omer-hub/Mc_comer_Mod-./releases/download/Mod/Mc_comer_Mod_Setup.exe"
  );
}

/* ═══════════════════════════════════════════
   主界面初始化
   ═══════════════════════════════════════════ */

/* ── 从后端加载配置 ────────────────────────────── */
async function loadHackConfig() {
  try {
    const info = await window.pywebview.api.get_hack_config();
    _state.hacks = info.hacks || [];
    _state.autoIds = info.auto_ids || [];
    _state.manualIds = info.manual_ids || [];
    // 加载热键
    const hkResp = await window.pywebview.api.get_hotkeys();
    _state.hotkeys = hkResp || {};
  } catch (e) {
    console.error("loadHackConfig error", e);
    // fallback
    _state.hacks = [];
    _state.autoIds = [];
    _state.manualIds = [];
  }
}

function getHack(id) { return _state.hacks.find((h) => h.id === id); }

function getHotkeyName(id) {
  const hk = _state.hotkeys[id];
  return hk ? hk.name : null;
}

/* ── 渲染 Hack 列表（两区，含VIP过滤） ───────────── */
function renderHackList() {
  const container = document.getElementById("hack-list");
  container.innerHTML = "";

  // VIP用户显示所有功能，非VIP只显示碰撞修改
  const filteredAutoIds = _state.isVip
    ? [..._state.autoIds]
    : _state.autoIds.filter(id => id === "hitbox");
  const filteredManualIds = _state.isVip
    ? [..._state.manualIds]
    : [];

  function createSection(title, ids, isAuto) {
    const section = document.createElement("div");
    section.className = "hack-section";

    const titleRow = document.createElement("div");
    titleRow.className = "hack-section-title";
    titleRow.innerHTML = `<span class="section-icon">${isAuto ? "⚡" : "⌨"}</span> ${title} <span class="section-badge">${ids.length}</span>`;
    section.appendChild(titleRow);

    for (const hid of ids) {
      const h = getHack(hid);
      if (!h) continue;
      const card = document.createElement("div");
      card.className = "hack-card";
      card.id = "hack-card-" + hid;

      const info = document.createElement("div");
      info.className = "hack-info";

      const nameRow = document.createElement("div");
      nameRow.className = "hack-name-row";

      const name = document.createElement("span");
      name.className = "hack-name";
      name.textContent = h.name;

      nameRow.appendChild(name);

      // 热键 badge（仅手动模块）
      if (!isAuto) {
        const hkName = getHotkeyName(hid);
        const badge = document.createElement("span");
        badge.className = "hotkey-badge";
        badge.id = "hk-badge-" + hid;
        badge.textContent = hkName || "未绑定";
        badge.title = "点击设置热键";
        badge.onclick = (e) => { e.stopPropagation(); openHotkeyConfig(hid); };
        nameRow.appendChild(badge);
      }

      info.appendChild(nameRow);

      const desc = document.createElement("div");
      desc.className = "hack-desc";
      desc.textContent = h.desc || "";
      info.appendChild(desc);

      const toggleWrap = document.createElement("label");
      toggleWrap.className = "toggle-switch";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "hack-" + hid;
      checkbox.addEventListener("change", () => onToggleHack(hid, checkbox.checked));

      const slider = document.createElement("span");
      slider.className = "toggle-slider";

      toggleWrap.appendChild(checkbox);
      toggleWrap.appendChild(slider);

      const status = document.createElement("span");
      status.className = "hack-status off";
      status.id = "hack-status-" + hid;
      status.textContent = "● 关闭";

      const right = document.createElement("div");
      right.className = "hack-right";
      right.appendChild(toggleWrap);
      right.appendChild(status);

      card.appendChild(info);
      card.appendChild(right);
      section.appendChild(card);
    }

    return section;
  }

  if (filteredAutoIds.length > 0) {
    container.appendChild(createSection("自启动模块", filteredAutoIds, true));
  }
  if (filteredManualIds.length > 0) {
    container.appendChild(createSection("手动模块", filteredManualIds, false));
  }

  // 非VIP用户显示升级VIP提示
  if (!_state.isVip) {
    const upgradeBanner = document.createElement("div");
    upgradeBanner.className = "upgrade-banner";
    upgradeBanner.innerHTML = `
      <div class="upgrade-banner-inner">
        <div class="upgrade-icon">👑</div>
        <div class="upgrade-text">
          <div class="upgrade-title">解锁全部功能</div>
          <div class="upgrade-desc">升级VIP会员，畅享所有高级功能</div>
        </div>
        <button class="upgrade-btn" onclick="onUpgradeVIP()">立即升级</button>
      </div>
    `;
    container.appendChild(upgradeBanner);
  }
}

function initMainPage() {
  document.getElementById("btn-connect").onclick = onConnect;
  document.getElementById("btn-disconnect").onclick = onDisconnect;
  document.getElementById("btn-settings").onclick = openSettings;
}

/* ── VIP 效果应用 ────────────────────────────────── */
function applyVipEffects() {
  const userEl = document.getElementById("header-user");
  const userLabel = document.getElementById("header-user-label");
  const vipBadge = document.getElementById("vip-badge");
  const vipCountdown = document.getElementById("vip-countdown");

  if (_state.isVip) {
    // VIP用户 — 显示尊敬称呼
    let displayName = _state.userNickname;
    if (_state.userType === "password") {
      displayName = "开发者";
    }
    let labelText = `尊敬的VIP用户 ${displayName}`;

    // 显示VIP剩余天数（有时限的VIP）
    if (_state.vipDaysLeft > 0) {
      labelText += ` · VIP剩余 ${_state.vipDaysLeft} 天`;
      if (vipCountdown) {
        vipCountdown.textContent = `您的VIP还有 ${_state.vipDaysLeft} 天到期`;
        vipCountdown.classList.remove("hidden");
      }
    } else if (_state.vipDaysLeft === -1) {
      if (vipCountdown) {
        vipCountdown.textContent = "永久VIP · 无限制使用";
        vipCountdown.classList.remove("hidden");
      }
    }

    userLabel.textContent = labelText;
    userEl.classList.remove("hidden");
    if (vipBadge) vipBadge.classList.remove("hidden");

    // VIP豪华主题
    document.getElementById("main-page").classList.add("vip");
    document.getElementById("main-header").classList.add("vip-header");

    // VIP欢迎Toast
    setTimeout(() => {
      showToast("👑 欢迎回来，尊敬的VIP用户！", "ok");
    }, 1500);

    // 显示隐藏的VIP专属装饰
    document.querySelectorAll(".vip-only").forEach(el => el.classList.remove("hidden"));
  } else {
    // 普通用户
    if (vipBadge) vipBadge.classList.add("hidden");
    if (vipCountdown) vipCountdown.classList.add("hidden");
    document.getElementById("main-page").classList.remove("vip");
    document.getElementById("main-header").classList.remove("vip-header");
    document.querySelectorAll(".vip-only").forEach(el => el.classList.add("hidden"));

    // 确保用户信息仍显示（昵称）
    if (userLabel.textContent) {
      userEl.classList.remove("hidden");
    }
  }
}

/* ── 升级VIP ─────────────────────────────────────── */
function onUpgradeVIP() {
  window.pywebview.api.open_browser('https://mc-omer-hub.github.io/Mc_comer_Mod_Web/');
  showToast("正在打开VIP购买页面...", "ok");
}

/* ── 状态轮询（供热键同步 UI） ────────────────────── */
function startStatePolling() {
  if (_state.stateTimer) clearInterval(_state.stateTimer);
  _state.stateTimer = setInterval(async () => {
    if (!_state.connected) return;
    try {
      const states = await window.pywebview.api.get_hack_states();
      _state.hackStates = states;
      for (const [id, enabled] of Object.entries(states)) {
        const cb = document.getElementById("hack-" + id);
        const st = document.getElementById("hack-status-" + id);
        if (cb && cb.checked !== enabled) cb.checked = enabled;
        if (st) { st.textContent = enabled ? "● 开启" : "● 关闭"; st.className = "hack-status " + (enabled ? "on" : "off"); }
      }
      // 刷新热键状态
      const hkResp = await window.pywebview.api.get_hotkeys();
      _state.hotkeys = hkResp || {};
      for (const hid of _state.manualIds) {
        const badge = document.getElementById("hk-badge-" + hid);
        if (badge) {
          const hkName = getHotkeyName(hid);
          badge.textContent = hkName || "未绑定";
        }
      }
    } catch (e) {}
  }, 2000);
}

/* ── 进程连接 ────────────────────────────────────────── */
async function onConnect() {
  const btn = document.getElementById("btn-connect");
  const status = document.getElementById("conn-status");
  btn.disabled = true; btn.textContent = "连接中…";
  status.textContent = "正在连接…"; status.className = "conn-status";
  setStatusBar("正在连接游戏…", "warn");
  try {
    const res = await window.pywebview.api.connect_game();
    if (res.ok) {
      _state.connected = true;
      document.getElementById("btn-disconnect").disabled = false;
      status.textContent = "✓ " + res.msg;
      status.className = "conn-status ok";
      setStatusBar(res.msg, "ok");
      showToast("连接成功", "ok");
      // 显示自启动结果
      if (res.auto_results) {
        for (const [hid, ok] of Object.entries(res.auto_results)) {
          if (ok) showToast(`${getHack(hid)?.name || hid} 已自动启动`, "ok");
        }
      }
      refreshHackStates();
    } else {
      _state.connected = false;
      status.textContent = "✕ " + res.msg;
      status.className = "conn-status err";
      setStatusBar(res.msg, "err");
      showToast(res.msg, "err");
    }
  } catch (e) {
    status.textContent = "✕ 连接失败"; status.className = "conn-status err";
    setStatusBar("连接出错", "err");
  }
  btn.disabled = false; btn.textContent = "🔗  连接游戏";
}

async function onDisconnect() {
  const status = document.getElementById("conn-status");
  status.textContent = "断开中…";
  try { await window.pywebview.api.disconnect_game(); } catch (e) {}
  _state.connected = false;
  document.getElementById("btn-disconnect").disabled = true;
  status.textContent = "未连接"; status.className = "conn-status";
  setStatusBar("已断开", "");
  refreshHackStates();
}

async function refreshHackStates() {
  try {
    const states = await window.pywebview.api.get_hack_states();
    _state.hackStates = states;
    for (const [id, enabled] of Object.entries(states)) {
      const cb = document.getElementById("hack-" + id);
      const st = document.getElementById("hack-status-" + id);
      if (cb) cb.checked = enabled;
      if (st) { st.textContent = enabled ? "● 开启" : "● 关闭"; st.className = "hack-status " + (enabled ? "on" : "off"); }
    }
  } catch (e) {}
}

/* ── Hack 切换 ────────────────────────────────────────── */
async function onToggleHack(id, enable) {
  if (!_state.connected) {
    showToast("请先连接游戏进程", "err");
    const cb = document.getElementById("hack-" + id);
    if (cb) cb.checked = !enable;
    return;
  }
  try {
    const res = await window.pywebview.api.toggle_hack(id, enable);
    if (res.ok) {
      _state.hackStates[id] = enable;
      const st = document.getElementById("hack-status-" + id);
      if (st) { st.textContent = enable ? "● 开启" : "● 关闭"; st.className = "hack-status " + (enable ? "on" : "off"); }
      const h = getHack(id);
      showToast(`${h?.name || id} ${enable ? "已启用" : "已禁用"}`, "ok");
    } else {
      showToast(res.msg || "操作失败", "err");
      const cb = document.getElementById("hack-" + id);
      if (cb) cb.checked = !enable;
    }
  } catch (e) {
    showToast("操作异常: " + e.message, "err");
    const cb = document.getElementById("hack-" + id);
    if (cb) cb.checked = !enable;
  }
}

async function onEnableAll() {
  if (!_state.connected) { showToast("请先连接游戏", "err"); return; }
  try {
    const res = await window.pywebview.api.enable_all_hacks();
    showToast(res.ok ? "全部已启用" : "部分启用失败", res.ok ? "ok" : "err");
    refreshHackStates();
  } catch (e) { showToast("异常: " + e.message, "err"); }
}

async function onDisableAll() {
  try {
    await window.pywebview.api.disable_all_hacks();
    showToast("全部已禁用", "ok"); refreshHackStates();
  } catch (e) { showToast("异常: " + e.message, "err"); }
}

/* ═══════════════════════════════════════════
   热键设置面板
   ═══════════════════════════════════════════ */

let _recordingHackId = null;

function openSettings() {
  document.getElementById("settings-overlay").classList.remove("hidden");
  renderHotkeySettings();
  document.addEventListener("keydown", _settingsKeyHandler);
}

function closeSettings() {
  document.getElementById("settings-overlay").classList.add("hidden");
  _recordingHackId = null;
  document.removeEventListener("keydown", _settingsKeyHandler);
}

function renderHotkeySettings() {
  const list = document.getElementById("settings-hk-list");
  list.innerHTML = "";
  for (const hid of _state.manualIds) {
    const h = getHack(hid);
    if (!h) continue;
    const hkName = getHotkeyName(hid);
    const row = document.createElement("div");
    row.className = "hk-config-row";
    row.innerHTML = `
      <span class="hk-config-name">${h.name}</span>
      <button class="hk-record-btn" data-hid="${hid}">${hkName ? `当前: ${hkName}` : "点击绑定"}</button>
      <button class="hk-clear-btn" data-hid="${hid}" ${hkName ? "" : "disabled"}>✕</button>
    `;
    row.querySelector(".hk-record-btn").onclick = () => startRecording(hid);
    row.querySelector(".hk-clear-btn").onclick = () => clearHotkey(hid);
    list.appendChild(row);
  }
}

function startRecording(hid) {
  _recordingHackId = hid;
  const allBtns = document.querySelectorAll(".hk-record-btn");
  allBtns.forEach((b) => { b.textContent = b.dataset.hid === hid ? "按下按键..." : (getHotkeyName(b.dataset.hid) || "点击绑定"); b.classList.toggle("recording", b.dataset.hid === hid); });
}

function _settingsKeyHandler(e) {
  if (!_recordingHackId) return;
  e.preventDefault();
  const vk = e.keyCode;
  const hid = _recordingHackId;
  _recordingHackId = null;
  // 重置所有按钮状态
  document.querySelectorAll(".hk-record-btn").forEach((b) => b.classList.remove("recording"));
  // 调用后端
  window.pywebview.api.set_hotkey(hid, vk).then((res) => {
    if (res.ok) {
      showToast(`热键设置成功: ${getHack(hid)?.name || hid}`, "ok");
      // 刷新热键
      window.pywebview.api.get_hotkeys().then((hk) => { _state.hotkeys = hk || {}; renderHotkeySettings(); });
      // 也更新主界面的 badge
      const badge = document.getElementById("hk-badge-" + hid);
      if (badge) badge.textContent = _state.hotkeys[hid]?.name || "未绑定";
    } else {
      showToast(res.msg || "设置失败", "err");
      renderHotkeySettings();
    }
  });
}

function clearHotkey(hid) {
  window.pywebview.api.remove_hotkey(hid).then((res) => {
    if (res.ok) {
      showToast(`热键已清除`, "ok");
      window.pywebview.api.get_hotkeys().then((hk) => { _state.hotkeys = hk || {}; renderHotkeySettings(); });
      const badge = document.getElementById("hk-badge-" + hid);
      if (badge) badge.textContent = "未绑定";
    }
  });
}

/* ═══════════════════════════════════════════
   入口：先检查更新，再显示登录页
   ═══════════════════════════════════════════ */
async function initApp() {
  initBgCanvas();
  initCardMouseGlow();
  try {
    const info = await window.pywebview.api.get_app_info();
    document.getElementById("header-ver").textContent = "v" + info.version;
    document.getElementById("status-meta").textContent = "Mc_comer Mod-py V" + info.version;
  } catch (e) {}

  // 显示 "检查更新中" 遮罩，然后调用后端检查
  document.getElementById("checking-overlay").classList.remove("hidden");
  const blocked = await checkUpdate();
  document.getElementById("checking-overlay").classList.add("hidden");

  if (blocked) return;  // 有更新/维护，弹窗接管，不再进入登录页

  _showLoginPage();
}

async function _showLoginPage() {
  document.getElementById("login-page").classList.add("active");
  const titleEl = document.getElementById("title-typewriter");
  titleCursorTimer = await typeTitle(titleEl, "Mc_comer Mod", 60);
  setTimeout(() => { document.getElementById("sub-label").textContent = "请输入访问密码以继续"; }, 1400);
  document.getElementById("login-page").addEventListener("click", (e) => { const inp = document.getElementById("pwd-input"); if (e.target !== inp) inp.focus(); });
  setTimeout(() => document.getElementById("pwd-input").focus(), 300);
  document.getElementById("pwd-input").addEventListener("keydown", (e) => { if (e.key === "Enter") verifyPassword(); });
  const qqBtn = document.getElementById("qq-login-btn");
  if (qqBtn) qqBtn.addEventListener("click", onQQScanLogin);
  document.getElementById("login-btn").addEventListener("click", verifyPassword);
}

function waitForPywebview(callback, maxRetries = 100) {
  let retries = 0;
  function check() {
    if (window.pywebview && window.pywebview.api) { callback(); }
    else if (retries < maxRetries) { retries++; setTimeout(check, 100); }
    else { callback(); }
  }
  check();
}

document.addEventListener("DOMContentLoaded", () => { waitForPywebview(() => { initApp(); }); });
