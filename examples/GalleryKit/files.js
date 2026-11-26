// A browser File and a Finder-opened item are different kinds of handles.
// Keep native IDs in memory only. Never turn the displayed path into a file URL.
export function observeOpened(deliver, host = window) {
  const seen = new Set();
  function accept(items, replace = false) {
    if (replace) seen.clear();
    const batch = [];
    for (const item of items || []) {
      if (!item || !(item.itemId || item.id)) continue;
      const key = JSON.stringify([item.itemId || item.id, item.relativePath || ""]);
      if (!seen.has(key)) { seen.add(key); batch.push(item); }
    }
    if (batch.length || replace) deliver(batch, replace);
  }
  const opened = event => accept(event.detail?.items, event.detail?.replaceExisting === true);
  host.addEventListener("htmltoapp-open", opened);
  accept(host.HTMLtoApp?.launchItems);
  return () => host.removeEventListener("htmltoapp-open", opened);
}

export async function textOf(file, limit) {
  // Check before reading and after decoding. The bridge returns an object, not a string.
  if (file instanceof Blob) {
    if (file.size > limit) throw Error("This file is too large for the example.");
    return file.text();
  }
  const fs = window.HTMLtoApp?.fs;
  if (!fs?.stat || !fs.readText) throw Error("Choose a local file to continue.");
  const info = await fs.stat(file);
  if (info.isDirectory || !Number.isFinite(info.size) || info.size > limit)
    throw Error("Choose a smaller text file.");
  const result = await fs.readText(file);
  if (typeof result.text !== "string" || result.text.length > limit)
    throw Error("The text could not be read within the size limit.");
  return result.text;
}

export function browserDrops(deliver) {
  // Finder and Dock launches arrive via observeOpened. An ordinary browser
  // supplies File objects through its drop event instead.
  window.addEventListener("dragover", event => {
    if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
  });
  window.addEventListener("drop", event => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    deliver(Array.from(event.dataTransfer.files));
  });
}

// Open the native chooser directly from a real button so mouse, Return and
// Space all use the same user gesture. Cancel keeps the current document.
export function bindFilePicker(button, input, deliver) {
  button.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const files = Array.from(input.files);
    input.value = ""; // Allow reopening the same file after editing it elsewhere.
    if (files.length) deliver(files);
  });
}

export function saveCopy(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // The native save panel can still be cancelled. Never overwrite the input or
  // report that the file was saved merely because the link was clicked.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
