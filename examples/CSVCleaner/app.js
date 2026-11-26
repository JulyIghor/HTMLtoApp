import { parseCSV, detectDelimiter, cleanRows, parseSteps, delimiterSteps, cleanSteps, serializeCSV, LIMITS } from "./csv.js";
import { bindFilePicker, browserDrops, observeOpened, saveCopy, textOf } from "../GalleryKit/files.js";

const $ = id => document.getElementById(id);
const files = new Map();
let input = null, filename = "", revision = 0, processing = 0, current = null;

function preview(target, rows, labels, numbers) {
  const table = document.createElement("table"), body = document.createElement("tbody");
  rows.slice(0, 30).forEach((row,i) => {
    const tr = document.createElement("tr"), head = document.createElement("th");
    head.scope = "row";
    head.textContent = "#" + numbers[i] + (labels ? " / " + labels[i] : "");
    tr.append(head);
    for (const cell of row.slice(0, 12)) {
      const td = document.createElement("td");
      td.textContent = cell.length > 180 ? cell.slice(0, 179) + "…" : cell;
      tr.append(td);
    }
    body.append(tr);
  });
  table.append(body); target.replaceChildren(table);
}
function readOptions() {
  return Object.fromEntries(["trim","dedupe","empty","protect"].map(key => [key,$(key).checked]));
}
async function refresh() {
  const token = ++processing;
  current = null; $("save").disabled = true;
  if (input === null) { $("before").replaceChildren(); $("after").replaceChildren(); return; }
  const large = input.length > 32768, job = large ? GalleryActivity.begin("Inspecting CSV...") : null;
  async function consume(steps, label, total) {
    job.update(label);
    await GalleryActivity.paint();
    let start = performance.now();
    for (;;) {
      if (token !== processing) throw Error("Selection changed.");
      const part = steps.next();
      if (part.done) return part.value;
      if (performance.now() - start >= 10) {
        job.update(label, part.value, total);
        await GalleryActivity.paint(); start = performance.now();
      }
    }
  }
  try {
    const selection = $("delimiter").value;
    const delimiter = selection === "auto" ? (large ? await consume(delimiterSteps(input), "Detecting delimiter...") : detectDelimiter(input)) : selection === "tab" ? "\t" : selection;
    const rows = large ? await consume(parseSteps(input, delimiter), "Reading CSV rows...", input.length) : parseCSV(input, delimiter);
    if (!rows.length) throw Error("There are no rows to clean.");
    const clean = large ? await consume(cleanSteps(rows, readOptions()), "Cleaning rows...", rows.length) : cleanRows(rows, readOptions());
    if (token !== processing) return;
    preview($("before"), rows, clean.changes, rows.map((_,i) => i + 1));
    preview($("after"), clean.rows, null, clean.originalRows);
    current = { rows: clean.rows, delimiter };
    $("save").disabled = false;
    $("status").textContent = filename + " / " + rows.length + " rows → " + clean.rows.length +
      ". Removed " + clean.emptyRemoved + " blank and " + clean.duplicatesRemoved + " duplicate. " +
      clean.changes.filter(x => x === "Edited").length + " edited. Preview shows up to 30 rows and 12 columns.";
  } catch (e) {
    if (token !== processing) return;
    $("before").replaceChildren(); $("after").replaceChildren();
    $("status").textContent = e.message;
  } finally { job?.end(); }
}
async function select(file) {
  const token = ++revision;
  input = null; refresh(); $("status").textContent = "Reading CSV...";
  const job = GalleryActivity.begin("Reading " + (file?.name || "sample.csv") + "...");
  try {
    await GalleryActivity.paint(); if (token !== revision) return;
    let text;
    if (file) text = await textOf(file, LIMITS.bytes);
    else {
      const r = await fetch(new URL("./sample.csv", import.meta.url));
      if (!r.ok) throw Error("The sample CSV could not be read.");
      text = await r.text();
    }
    if (token !== revision) return;
    if (text.length > LIMITS.bytes) throw Error("Use a CSV under 2 MiB.");
    input = text; filename = file?.name || "sample.csv";
    $("delimiter").value = filename.toLowerCase().endsWith(".tsv") ? "tab" : "auto";
    refresh();
  } catch (e) { if (token === revision) $("status").textContent = e.message; }
  finally { job.end(); }
}
function opened(items, replace = false) {
  if (replace) files.clear();
  const first = items.find(f => !f.isDirectory && /\.(csv|tsv)$/i.test(f.name));
  if (!first) {
    if (replace) { $("queue").replaceChildren(); $("queueLabel").hidden = true; }
    return;
  }
  // Show a chooser for multiple inputs; never combine their contents implicitly.
  const key = f => f.itemId || f.id || [f.name, f.size, f.lastModified].join("/");
  for (const file of items.filter(f => !f.isDirectory && /\.(csv|tsv)$/i.test(f.name))) {
    if (files.size < 128 || files.has(key(file))) files.set(key(file), file);
  }
  const chosen = files.has(key(first)) ? key(first) : files.keys().next().value;
  $("queue").replaceChildren(...Array.from(files, ([id,f]) => new Option(f.name,id)));
  $("queue").value = chosen; $("queueLabel").hidden = files.size < 2;
  select(files.get(chosen));
}
bindFilePicker($("openFile"), $("file"), items => opened(items, true));
$("queue").onchange = () => select(files.get($("queue").value));
$("sample").onclick = () => { files.clear(); $("queue").replaceChildren(); $("queueLabel").hidden = true; select(null); };
for (const id of ["delimiter","trim","empty","dedupe","protect"]) $(id).onchange = refresh;
$("save").onclick = () => {
  if (!current) return;
  // CSV serialization quotes embedded delimiters and preserves newlines inside quoted fields.
  const sep = $("lineEnds").value === "lf" ? "\n" : "\r\n";
  const text = serializeCSV(current.rows, current.delimiter, sep);
  const ext = current.delimiter === "\t" ? ".tsv" : ".csv";
  saveCopy(new Blob([text], { type: "text/csv;charset=utf-8" }), filename.replace(/\.(csv|tsv)$/i, "") + "-clean" + ext);
};
select(null);
observeOpened(opened);
browserDrops(items => opened(items,true));
