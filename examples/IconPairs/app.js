// This game never launches another app. Only the optional artwork deck needs listing permission.
const $ = id => document.getElementById(id);
const canvas = $("board"), ctx = canvas.getContext("2d");
const W = 640, H = 404, cols = 4, rows = 3;
const sample = [
  ["Compass", "#317a81", "M32 10L42 39L21 52L23 26Z M32 10L29 34L42 39"],
  ["Leaf", "#53814c", "M15 46Q9 21 47 13Q51 43 15 46Z M15 46L40 22"],
  ["Lantern", "#a3613a", "M18 23H46L42 49H22Z M24 22V16Q32 7 40 16V22 M31 30V41"],
  ["Kite", "#8762a9", "M32 9L48 25L32 45L16 25Z M32 10V45 M17 25H47 M32 45Q41 49 35 55"],
  ["Sail", "#416eaa", "M30 12V43H12Z M35 18L50 41H35Z M11 46H52L45 52H19Z"],
  ["Sun", "#a16c21", "M43 32A11 11 0 1 1 21 32A11 11 0 1 1 43 32 M32 9V15 M32 49V55 M9 32H15 M49 32H55 M16 16L20 20 M44 44L48 48 M48 16L44 20 M20 44L16 48"]
].map(([name, color, path], i) => ({ id: "sample-" + i, name, color, path: new Path2D(path) }));

let deck = [], faces = [], turns = 0, selected = 0, pairs = 0, request = 0;
let remaining = 0, timeout, focused = false;
const spoken = [];

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Game state is independent of canvas pixels and screen size.
function start(icons, message) {
  clearTimeout(timeout); remaining = 0;
  deck = shuffle([...icons, ...icons]).map(icon => ({ icon, matched: false }));
  turns = pairs = selected = 0; faces = [];
  $("status").textContent = message;
  render();
}
function closeMismatch() {
  clearTimeout(timeout); remaining = 0; faces = [];
  render();
}
function flip(i) {
  if (remaining || deck[i].matched || faces.includes(i)) return;
  selected = i; faces.push(i);
  $("status").textContent = deck[i].icon.name;
  if (faces.length === 2) {
    turns++;
    if (deck[faces[0]].icon.id === deck[i].icon.id) {
      for (const n of faces) deck[n].matched = true;
      faces = []; pairs++;
      $("status").textContent = pairs === 6 ? "All six pairs matched in " + turns + " turns." : "Matched " + deck[i].icon.name + ".";
    } else {
      remaining = 900;
      timeout = setTimeout(closeMismatch, remaining);
      $("status").textContent = "Two different cards. Remember their places.";
    }
  }
  render();
}
function box(i) { return { x: 8 + (i % cols) * 157, y: 8 + Math.floor(i / cols) * 132, w: 150, h: 124 }; }
function rounded(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function render() {
  ctx.fillStyle = "#322645"; ctx.fillRect(0, 0, W, H);
  deck.forEach((card, i) => {
    const b = box(i), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const visible = card.matched || faces.includes(i);
    rounded(b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = visible ? (card.matched ? "#dcead8" : "#fff3d9") : "#5c477b"; ctx.fill();
    ctx.lineWidth = focused && i === selected ? 4 : 1.5;
    ctx.strokeStyle = focused && i === selected ? "#ffd188" : visible ? "#bbb09d" : "#a68cbb"; ctx.stroke();
    if (visible) {
      if (card.icon.image) ctx.drawImage(card.icon.image, cx-27, cy-40, 54, 54);
      else {
        rounded(cx-26, cy-39, 52, 52, 12); ctx.fillStyle = card.icon.color; ctx.fill();
        ctx.save(); ctx.translate(cx-26,cy-39); ctx.scale(52/64,52/64);
        ctx.lineWidth = 3.2; ctx.lineCap = ctx.lineJoin = "round"; ctx.strokeStyle = "#fff7e5"; ctx.stroke(card.icon.path); ctx.restore();
      }
      ctx.fillStyle = "#292539"; ctx.font = "600 14px system-ui"; ctx.textAlign = "center";
      let label = card.icon.name;
      while (label.length > 1 && ctx.measureText(label).width > b.w-22) label = label.slice(0,-2) + "…";
      ctx.fillText(label, cx, cy+38);
    } else {
      // A woven diamond pattern makes face-down cards readable even without color.
      ctx.strokeStyle = "#dfcae8"; ctx.lineWidth = 1.6;
      for (const radius of [24, 17, 10]) {
        ctx.beginPath(); ctx.moveTo(cx,cy-radius); ctx.lineTo(cx+radius,cy); ctx.lineTo(cx,cy+radius); ctx.lineTo(cx-radius,cy); ctx.closePath(); ctx.stroke();
      }
    }
    const btn = spoken[i];
    const label = "Card " + (i+1) + ", " + (visible ? card.icon.name + (card.matched ? ", matched" : "") : "face down");
    btn.textContent = label; btn.setAttribute("aria-disabled", String(card.matched));
  });
  $("score").textContent = pairs + " pairs / " + turns + " turns";
}
for (let i = 0; i < 12; i++) {
  const button = document.createElement("button");
  button.onclick = () => flip(i); spoken.push(button); $("accessible").append(button);
}
canvas.onclick = event => {
  const frame = canvas.getBoundingClientRect(), x = (event.clientX-frame.left)*W/frame.width, y = (event.clientY-frame.top)*H/frame.height;
  const n = deck.findIndex((_, i) => { const b = box(i); return x >= b.x && x < b.x+b.w && y >= b.y && y < b.y+b.h; });
  if (n >= 0) { canvas.focus(); flip(n); }
};
canvas.onfocus = () => { focused = true; render(); };
canvas.onblur = () => { focused = false; render(); };
canvas.onkeydown = event => {
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[event.key];
  if (delta) { selected = (selected + delta + deck.length) % deck.length; event.preventDefault(); render(); }
  else if (event.key === " " || event.key === "Enter") { event.preventDefault(); flip(selected); }
  else if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    const action = document.fullscreenElement ? document.exitFullscreen() : $("game").requestFullscreen?.();
    action?.catch(() => { $("status").textContent = "Fullscreen is unavailable in this window."; });
  }
};
$("restart").onclick = () => {
  request++; $("installed").disabled = false;
  start(sample, "New sample deck. Find six pairs.");
};
$("installed").onclick = async () => {
  const token = ++request, api = window.HTMLtoApp?.apps;
  $("installed").disabled = true;
  const job = GalleryActivity.begin("Reading installed apps...");
  try {
    await GalleryActivity.paint();
    if (token !== request) return;
    if (typeof api?.permissions !== "function" || typeof api.list !== "function" || typeof api.icon !== "function" ||
        !(await api.permissions()).list)
      throw Error("Enable List Installed Apps in HTML to App to use your own icons. The sample deck is ready to play.");
    $("status").textContent = "Finding artwork for six cards...";
    const apps = shuffle(await api.list()).slice(0, 24), icons = [];
    for (const app of apps) {
      if (token !== request) return;
      if (icons.length === 6) break;
      job.update("Finding card artwork / " + icons.length + " of 6 ready / " + app.name, icons.length, 6);
      try {
        const src = await api.icon(app.id);
        if (!src || !src.startsWith("data:image/png;base64,")) continue;
        const image = new Image(); image.src = src; await image.decode();
        icons.push({ id: app.id, name: app.name, image });
      } catch { /* An app may have moved between listing and icon lookup. */ }
    }
    if (token !== request) return;
    if (!icons.length) throw Error("No app artwork was available. You can still play the sample deck.");
    start([...icons, ...sample.slice(0, 6-icons.length)], icons.length + " installed app icons in this deck.");
  } catch (error) { if (token === request) $("status").textContent = error.message; }
  finally { job.end(); if (token === request) $("installed").disabled = false; }
};
// These small hooks make keyboard and mismatch timing reproducible in tests.
// The public text state does not reveal which artwork is behind a closed card.
window.render_game_to_text = () => JSON.stringify({
  coordinates: "Top left origin. Columns run right, rows run down.", columns: cols, rows, turns, pairs,
  selected, mode: pairs === 6 ? "won" : remaining ? "comparing" : "playing",
  cards: deck.map((c,i) => c.matched || faces.includes(i) ? c.icon.name : null)
});
window.advanceTime = ms => {
  if (remaining && (remaining -= Math.max(0,ms)) <= 0) closeMismatch();
  else render();
};
start(sample, "The sample deck is ready. Pick any two cards.");
