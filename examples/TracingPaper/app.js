import { bindFilePicker, browserDrops, observeOpened } from "../GalleryKit/files.js";

const $ = id => document.getElementById(id);
const api = window.HTMLtoApp;
const win = api?.window;
const menu = api?.menuBar;
const canFloat = typeof win?.configure === "function" && typeof win?.reset === "function";
const canLock = canFloat && typeof menu?.configure === "function" && typeof menu?.onItemClick === "function";
const menuTitle = "Trace";
const unlockItem = { id: "edit", title: "Unlock and edit reference" };
const unlockDirections = `To unlock, click the "${menuTitle}" menu bar icon and choose "${unlockItem.title}".`;
let busy = false;
let floating = false;
let locked = false;
let watchdog;
let noticeTimer;
let imageURL;
let request = 0;

function status(text) { $("status").textContent = text; }
function controls() {
  document.documentElement.classList.toggle("overlay", floating);
  document.body.classList.toggle("overlay", floating);
  $("floatingBar").hidden = !floating || locked;
  $("float").disabled = !canFloat || busy;
  $("lock").disabled = $("lockFloating").disabled = !canLock || busy;
}

async function useImage(file) {
  const serial = ++request;
  const local = file instanceof Blob;
  if (local && file.size > 12 * 1024 * 1024) throw Error("Choose an image under 12 MiB.");
  const src = local ? URL.createObjectURL(file) : file.url;
  if (!src) throw Error("Choose a readable picture.");
  const probe = new Image();
  try {
    probe.src = src;
    await GalleryActivity.run("Opening " + (file.name || "reference image") + "...", () => probe.decode());
    if (serial !== request) { if (local) URL.revokeObjectURL(src); return; }
    if (imageURL) URL.revokeObjectURL(imageURL);
    imageURL = local ? src : null;
    $("reference").src = src;
    status(file.name || "Reference ready.");
  } catch (error) { if (local) URL.revokeObjectURL(src); throw error; }
}

function clearLockFeedback() {
  clearTimeout(noticeTimer);
  clearTimeout(watchdog);
  $("lockNotice").textContent = "";
}

async function edit() {
  // Reset restores the native window frame, decoration and mouse handling together.
  if (canFloat) await win.reset();
  clearLockFeedback();
  locked = floating = false;
  menu?.hideIcon?.();
  controls();
  status("Reference ready. Float it again when you want to trace.");
}

async function floatReference(lock) {
  if (busy || !canFloat || (lock && !canLock)) return;
  busy = true;
  controls();
  try {
    if (lock) {
      // Install a reachable escape route BEFORE passing through every mouse click.
      menu.configure({ visible: true, title: menuTitle, tooltip: "Tracing Paper", openMenuOn: "any",
        menu: [unlockItem] });
    }
    await win.configure({ titleBar: "borderless", level: "floating", transparent: true,
      clickThrough: lock ? "always" : "never" });
    floating = true;
    locked = lock;
    clearLockFeedback();
    if (locked) {
      // Both toolbars are now hidden. Show the actual menu names over the drawing briefly.
      $("lockNotice").textContent = "Overlay locked. " + unlockDirections;
      noticeTimer = setTimeout(() => { $("lockNotice").textContent = ""; }, 10000);
      // A second recovery path also works if the system menu bar is hidden.
      watchdog = setTimeout(() => edit().catch(e => status(e.message)), 90000);
    }
  } catch (error) {
    await edit().catch(() => {});
    status(error.message || "The overlay could not be placed.");
  } finally { busy = false; controls(); }
}

function opened(items) {
  const image = items.find(f => !f.isDirectory && /\.(png|jpe?g|webp)$/i.test(f.name));
  if (image) useImage(image).catch(() => status("The picture could not be opened. Try a smaller PNG or JPEG."));
}
bindFilePicker($("openFile"), $("file"), opened);
$("sample").onclick = () => {
  request++;
  if (imageURL) URL.revokeObjectURL(imageURL);
  imageURL = null;
  $("reference").src = new URL("./lighthouse.svg", import.meta.url);
  status("Lighthouse sample restored.");
};
function setOpacity(value) {
  $("opacity").value = $("floatingOpacity").value = value;
  $("percent").value = value + "%";
  $("reference").style.opacity = Number(value) / 100;
}
for (const id of ["opacity", "floatingOpacity"]) $(id).oninput = event => setOpacity(event.target.value);
setOpacity($("opacity").value);
$("float").onclick = () => floatReference(false);
$("lock").onclick = $("lockFloating").onclick = () => floatReference(true);
$("edit").onclick = () => edit().catch(e => status(e.message));
menu?.onItemClick?.(item => { if (item.id === unlockItem.id) $("edit").click(); });
window.addEventListener("keydown", e => { if (e.key === "Escape" && floating) $("edit").click(); });
window.addEventListener("htmltoapp-windowchange", e => {
  if (e.detail?.userRestored && floating) {
    clearLockFeedback();
    locked = floating = false;
    menu?.hideIcon?.();
    controls();
  }
});
controls();
if (canLock) $("unlockHelp").textContent = unlockDirections;
if (!canFloat) status("Try opacity here. Run the project in HTML to App to float or lock it.");
observeOpened(opened);
browserDrops(opened);
