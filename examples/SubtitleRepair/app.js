import { bindFilePicker, browserDrops, observeOpened, saveCopy, textOf } from "../GalleryKit/files.js";
import { clock, parseSRT, serialize, shiftCues } from "./captions.js";

const $ = id => document.getElementById(id);
let original = [], shifted = [], subtitle = "late.srt", movieURL, generation = 0;

function caption() {
  const now = $("video").currentTime * 1000;
  $("caption").textContent = shifted.filter(c => now >= c.start && now < c.end).map(c => c.text).join("\n");
}
function update() {
  const offset = Math.round($("offset").valueAsNumber);
  const valid = Number.isFinite(offset) && Math.abs(offset) <= 3600000;
  shifted = valid ? shiftCues(original, offset) : [];
  $("save").disabled = !shifted.length;
  const rows = shifted.slice(0, 100).map(c => {
    const tr = document.createElement("tr");
    for (const value of [clock(c.start), clock(c.end), c.text]) {
      const td = document.createElement("td"); td.textContent = value; tr.append(td);
    }
    return tr;
  });
  $("cues").replaceChildren(...rows);
  if (original.length) $("status").textContent = valid
    ? subtitle + " / " + shifted.length + " cues / " + offset + " ms" +
      (shifted.length > rows.length ? " / first 100 shown" : "") +
      (original.length > shifted.length ? " / cues before zero omitted" : "")
    : "Enter a timing shift within one hour.";
  caption();
}

async function loadSRT(file) {
  const token = ++generation;
  original = []; update();
  $("status").textContent = "Reading subtitles...";
  const job = GalleryActivity.begin("Reading " + (file?.name || "late.srt") + "...");
  try {
    await GalleryActivity.paint(); if (token !== generation) return;
    const text = file ? await textOf(file, 1024 * 1024) : await (await fetch(new URL("./late.srt", import.meta.url))).text();
    job.update("Preparing subtitle cues...");
    await GalleryActivity.paint(); if (token !== generation) return;
    const cues = parseSRT(text);
    if (token !== generation) return;
    original = cues; subtitle = file?.name || "late.srt"; $("offset").value = "0";
    update();
  } catch (e) { if (token === generation) $("status").textContent = e.message; }
  finally { job.end(); }
}

function opened(items) {
  const movie = items.find(f => !f.isDirectory && /\.(mp4|mov|m4v)$/i.test(f.name));
  const subs = items.find(f => !f.isDirectory && /\.srt$/i.test(f.name));
  if (movie) {
    const old = movieURL;
    movieURL = movie instanceof Blob ? URL.createObjectURL(movie) : null;
    $("video").src = movieURL || movie.url;
    if (old) URL.revokeObjectURL(old);
  }
  if (subs) loadSRT(subs);
  else if (items.length && !movie) $("status").textContent = "Choose an SRT subtitle file or a compatible local movie.";
}
GalleryActivity.media($("video"), () => "the reference movie");
$("video").addEventListener("timeupdate", caption);
$("video").addEventListener("seeked", caption);
$("video").addEventListener("error", () => { $("status").textContent = "This video could not be played. You can still edit and save subtitles."; });
$("offset").oninput = update;
for (const [id, step] of [["earlier", -1000], ["later", 1000]]) {
  $(id).onclick = () => { $("offset").value = Math.max(-3600000, Math.min(3600000, (Number($("offset").value) || 0) + step)); update(); };
}
bindFilePicker($("openFile"), $("file"), opened);
$("save").onclick = () => {
  if (shifted.length) saveCopy(new Blob([serialize(shifted)], { type: "application/x-subrip;charset=utf-8" }),
    subtitle.replace(/\.srt$/i, "") + "-corrected.srt");
};
loadSRT(null);
observeOpened(opened);
browserDrops(opened);
