import { observeOpened, saveCopy } from "../GalleryKit/files.js";

const $ = id => document.getElementById(id);
const limit = 24;
const maxBytes = 8 * 1024 * 1024;
const pixelsPerPoint = 2; // Export the same sharp PNG on standard and Retina displays.
const imageFile = name => /\.(png|jpe?g|webp|svg)$/i.test(name);
let photos = [], generation = 0, busy = false, note = "";

async function imageSource(item) {
  if (item.sample) {
    const response = await fetch(new URL(item.name, import.meta.url));
    if (!response.ok) throw Error("The sample print was not found.");
    return URL.createObjectURL(await response.blob());
  }
  if (item instanceof Blob) {
    if (item.size > maxBytes) throw Error("Image exceeds 8 MiB.");
    return URL.createObjectURL(item);
  }
  // A folder entry's itemId and relativePath are the scoped read capability.
  // Bringing a bounded file into a data URL also keeps the export canvas origin-clean.
  const fs = window.HTMLtoApp?.fs;
  if (typeof fs?.stat !== "function" || typeof fs?.readData !== "function")
    throw Error("Native file reading is unavailable. Choose pictures with the file picker.");
  const stat = Number.isFinite(item.size) ? item : await fs.stat(item);
  if (!Number.isFinite(stat.size) || stat.size > maxBytes) throw Error("Image exceeds 8 MiB.");
  const data = await fs.readData(item);
  const extension = item.name.split(".").pop().toLowerCase();
  const mime = ({ svg: "image/svg+xml", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" })[extension];
  return "data:" + mime + ";base64," + data.base64Data;
}

async function thumbnail(item) {
  const url = await imageSource(item);
  try {
    const image = new Image();
    image.src = url; await image.decode();
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 32000000) throw Error("Image dimensions are too large.");
    // Keep only a thumbnail, not 24 full-size decoded photographs.
    const tile = document.createElement("canvas");
    const scale = Math.min(1, 456/image.naturalWidth, 252/image.naturalHeight);
    tile.width = Math.max(1, Math.round(image.naturalWidth*scale));
    tile.height = Math.max(1, Math.round(image.naturalHeight*scale));
    const pen = tile.getContext("2d");
    pen.drawImage(image, 0, 0, tile.width, tile.height);
    // Detect an unsupported SVG here rather than failing the whole PNG export later.
    pen.getImageData(0, 0, 1, 1);
    return { name: item.name, tile };
  } finally { if (url.startsWith("blob:")) URL.revokeObjectURL(url); }
}

function paint() {
  const columns = Number($("columns").value), board = $("sheet");
  const cols = Math.max(1, Math.min(columns, photos.length)), rows = Math.max(1, Math.ceil(photos.length/cols));
  const cellW = 236, cellH = 160, margin = 16;
  const width = cols*cellW + margin*2, height = rows*cellH + margin*2;
  board.width = width*pixelsPerPoint;
  board.height = height*pixelsPerPoint;
  // CSS may shrink a wide sheet, but a single column must not stretch to fill the window.
  board.style.width = width + "px";
  const g = board.getContext("2d");
  g.scale(pixelsPerPoint,pixelsPerPoint);
  g.fillStyle = "#f5eee1"; g.fillRect(0,0,width,height);
  g.font = "13px system-ui"; g.textAlign = "center";
  photos.forEach(({name,tile}, i) => {
    const x = margin + (i%cols)*cellW, y = margin + Math.floor(i/cols)*cellH;
    g.fillStyle = "#e5ded0"; g.fillRect(x+4,y+4,cellW-8,cellH-34);
    const ratio = Math.min((cellW-8)/tile.width,(cellH-34)/tile.height);
    const w = tile.width*ratio, h = tile.height*ratio;
    g.drawImage(tile,x+(cellW-w)/2,y+4+(cellH-34-h)/2,w,h);
    g.fillStyle = "#443c32";
    let label = name;
    while (label.length > 1 && g.measureText(label).width > cellW-12) label = label.slice(0,-2) + "…";
    g.fillText(label,x+cellW/2,y+cellH-10);
  });
  board.setAttribute("aria-label", photos.length ? photos.map(p => p.name).join(", ") : "Empty contact sheet");
}

// Only the current operation can publish a result. The previous finished sheet
// stays available if the user cancels an import or the folder cannot be read.
function progress(label, completed, total) {
  $("status").textContent = label;
  if (total > 0) { $("progress").max = total; $("progress").value = completed; }
  else $("progress").removeAttribute("value");
}
function begin(label) {
  const token = ++generation;
  busy = true;
  $("chooseFiles").disabled = $("folder").disabled = false; $("save").disabled = true; $("work").hidden = false;
  $("feedback").classList.add("running");
  $("preview").setAttribute("aria-busy", "true");
  progress(label);
  return token;
}
function finish(token, message) {
  if (token !== generation) return;
  busy = false; $("work").hidden = true; $("save").disabled = !photos.length; $("chooseFiles").disabled = $("folder").disabled = false;
  $("feedback").classList.remove("running");
  $("preview").setAttribute("aria-busy", "false");
  $("status").textContent = message;
}
function stop() {
  if (!busy) return;
  const restoreFocus = document.activeElement === $("cancel");
  finish(++generation, photos.length ? "Cancelled. " + note : "Cancelled. Choose pictures to start a sheet.");
  if (restoreFocus) $("folder").focus({preventScroll: true});
}
$("cancel").onclick = stop;

// Check entries in small batches. The folder picker may give WebKit a FileList
// containing an entire tree. Never copy it to an array or visit subfolders here.
async function load(items, token = begin("Scanning pictures...")) {
  const current = () => token === generation;
  const candidates = []; let checked = 0, limited = false, skipped = 0;
  let lastPaint = performance.now();
  function consider(item) {
    checked++;
    const path = item.webkitRelativePath || "";
    if (!item.isDirectory && (!path || path.indexOf("/", path.indexOf("/") + 1) < 0) && imageFile(item.name)) {
      if (candidates.length === limit) limited = true;
      else candidates.push(item);
    }
  }
  async function checkpoint(name, knownTotal) {
    if (!current()) return;
    const count = knownTotal > 0 ? checked + " of " + knownTotal : checked;
    progress("Scanning " + name + " / " + count + " entries checked", checked, knownTotal);
    await GalleryActivity.paint(); lastPaint = performance.now();
  }
  async function scan(entries, name) {
    const total = entries instanceof FileList ? entries.length : undefined;
    if (total) await checkpoint(name, total);
    for (let i = 0; i < entries.length && current() && !limited; i++) {
      const entry = entries[i];
      if (entry.isDirectory && entry.createReader) {
        const reader = entry.createReader();
        await checkpoint(entry.name);
        while (current() && !limited) {
          const batch = await new Promise((ok, fail) => reader.readEntries(ok, fail));
          if (!current() || !batch.length) break;
          for (const child of batch) {
            consider(child); if (limited) break;
            if (performance.now() - lastPaint >= 16) { await checkpoint(entry.name); if (!current()) return; }
          }
          await checkpoint(entry.name);
        }
      } else if (entry.kind === "directory" && entry.values) {
        await checkpoint(entry.name);
        for await (const child of entry.values()) {
          if (!current()) return;
          if (child.kind === "file") consider(child); else checked++;
          if (limited) break;
          if (performance.now() - lastPaint >= 16) await checkpoint(entry.name);
        }
      } else if (entry.isDirectory) {
        await checkpoint(entry.name);
        if (!current()) return;
        const fs = window.HTMLtoApp?.fs;
        if (!fs?.list) throw Error("Folder access is unavailable. Choose individual pictures instead.");
        const listing = await fs.list(entry);
        if (!current()) return;
        for (const child of listing.entries) {
          consider(child); if (limited) break;
          if (performance.now() - lastPaint >= 16) { await checkpoint(entry.name); if (!current()) return; }
        }
        if (listing.truncated) truncated = true;
      } else consider(entry);
      if (performance.now() - lastPaint >= 16) await checkpoint(name, total);
    }
  }
  let truncated = false;
  try {
    await GalleryActivity.paint();
    if (!current()) return;
    await scan(items, "selection");
    const next = [];
    for (let i = 0; i < candidates.length; i++) {
      if (!current()) return;
      const candidate = candidates[i];
      progress("Preparing picture " + (i + 1) + " of " + candidates.length + " / " + candidate.name, i, candidates.length);
      await GalleryActivity.paint(); if (!current()) return;
      try {
        const item = candidate.isFile ? await new Promise((ok, fail) => candidate.file(ok, fail))
          : candidate.kind === "file" && candidate.getFile ? await candidate.getFile() : candidate;
        if (!current()) return;
        next.push(await thumbnail(item));
      } catch { skipped++; }
      if (!current()) return;
      $("progress").value = i + 1;
    }
    if (!current()) return;
    if (!next.length && photos.length) {
      const reason = candidates.length ? "The selected pictures could not be read or exceeded the image limits."
        : "No PNG, JPEG, WebP, or SVG pictures found. Only pictures directly inside a selected folder are included.";
      finish(token, reason + " Your previous sheet was kept.");
      return;
    }
    photos = next; paint();
    note = photos.length ? photos.length + (photos.length === 1 ? " picture ready." : " pictures ready.") : "No readable pictures. Choose PNG, JPEG, WebP, or SVG files.";
    if (skipped) note += " Skipped " + skipped + " unreadable or oversized.";
    if (limited) note += " Only the first 24 pictures were processed.";
    if (truncated) note += " The folder listing was incomplete.";
    finish(token, note);
  } catch (error) { finish(token, "Could not open the pictures. " + error.message); }
}

function beginPicking(label) {
  if ($("folder").disabled) return;
  const token = begin(label);
  $("chooseFiles").disabled = $("folder").disabled = true;
  return token;
}

function openInput(id, token) {
  // WebKit can retain webkitEntries even after input.value is cleared. A fresh
  // hidden input keeps the visible button stable and can reopen the same folder.
  const previous = $(id), picker = previous.cloneNode(false);
  previous.replaceWith(picker);
  picker.oncancel = () => { if (token === generation) stop(); };
  picker.onchange = () => {
    if (token !== generation) return;
    // Choose Files can return a folder as a single File. Its directory entry,
    // unlike that File, lets us read the children just as we do for a drop.
    // The dedicated folder picker and ordinary browsers may supply only files.
    const entries = picker.webkitEntries;
    const items = entries?.some(entry => entry.isDirectory) ? entries : picker.files;
    if (items.length) load(items, token); else stop();
  };
  picker.click(); // Keep the original user gesture for the system picker.
}

$("chooseFiles").onclick = () => {
  const token = beginPicking("Waiting for a picture selection...");
  if (token) openInput("files", token);
};
$("folder").onclick = async () => {
  // Show activity before opening the picker. WebKit may enumerate the folder
  // before it fires change, and cannot report a total during that interval.
  const token = beginPicking("Waiting for folder selection or scanning its contents...");
  if (!token) return;
  if (typeof window.showDirectoryPicker === "function") {
    try { const directory = await window.showDirectoryPicker(); if (token === generation) await load([directory], token); }
    catch (error) { if (token === generation) { if (error.name === "AbortError") stop(); else finish(token, error.message); } }
    return;
  }
  openInput("folderFiles", token);
};
window.addEventListener("dragover", e => { if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault(); });
window.addEventListener("drop", e => {
  if (!Array.from(e.dataTransfer.types).includes("Files")) return;
  e.preventDefault();
  const entries = Array.from(e.dataTransfer.items || [], i => i.webkitGetAsEntry?.() || i.getAsFile()).filter(Boolean);
  load(entries.length ? entries : Array.from(e.dataTransfer.files));
});
$("columns").onchange = paint;
$("sample").onclick = () => load(["cove.svg", "dunes.svg", "peaks.svg"].map(name => ({name, sample:true})));
$("save").onclick = async () => {
  if (busy || !photos.length) return;
  const token = begin("Preparing the PNG...");
  try {
    await GalleryActivity.paint(); if (token !== generation) return;
    const blob = await new Promise(resolve => $("sheet").toBlob(resolve, "image/png"));
    if (token !== generation) return;
    if (!blob) throw Error("The PNG could not be created.");
    saveCopy(blob, "Contact Sheet.png"); finish(token, note);
  } catch (error) { finish(token, error.message); }
};
$("sample").click();
observeOpened(items => { if (items.length) load(items); });
