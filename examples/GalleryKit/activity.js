// Small, nonmodal loading feedback. A newer job owns the indicator; an older
// promise finishing late cannot clear it. Unknown totals stay indeterminate.
const GalleryActivity = (() => {
  const jobs = new Map(), renders = new WeakMap();
  let view;
  function show(message, done, total) {
    if (!view) return;
    view.querySelector("span").textContent = message;
    const bar = view.querySelector("progress");
    if (Number.isFinite(total) && total > 0) {
      bar.max = total;
      bar.value = Math.min(total, Math.max(0, done));
    } else bar.removeAttribute("value");
  }
  function begin(message) {
    view ||= document.querySelector("[data-gallery-activity]");
    const job = {
      update(label, done, total) {
        if (!jobs.has(job)) return;
        jobs.set(job, [label, done, total]);
        if (Array.from(jobs.keys()).pop() === job) show(label, done, total);
      },
      end() {
        if (!jobs.delete(job) || !view) return;
        const previous = Array.from(jobs.values()).pop();
        if (previous) show(...previous); else view.hidden = true;
      }
    };
    jobs.set(job, [message]);
    show(message);
    if (view) view.hidden = false;
    return job;
  }
  // Yield a paint before CPU work. A hidden WebView may suspend animation frames.
  function paint() {
    return new Promise(resolve => {
      const frame = requestAnimationFrame(() => { clearTimeout(fallback); setTimeout(resolve, 0); });
      const fallback = setTimeout(() => { cancelAnimationFrame(frame); resolve(); }, 45);
    });
  }
  async function run(label, work) {
    const job = begin(label);
    try { await paint(); return await work(job); } finally { job.end(); }
  }
  // Fill a large list incrementally. Small lists remain synchronous.
  async function rows(container, list, label, append) {
    const token = {};
    renders.set(container, token);
    const job = list.length > 100 ? begin(label) : null;
    try {
      let start = performance.now();
      for (let i = 0; i < list.length; i++) {
        if (job && (i === 0 || performance.now() - start >= 10)) {
          job.update(label + " / " + i + " of " + list.length, i, list.length);
          await paint();
          if (renders.get(container) !== token) return;
          start = performance.now();
        }
        append(list[i], i);
      }
    } finally { job?.end(); }
  }
  // Capture handles during the drop event. DataTransfer becomes protected after it returns.
  async function dropped(transfer, makeItem, accepts = () => true) {
    const roots = Array.from(transfer.items || []).filter(i => i.kind === "file")
      .map(i => i.webkitGetAsEntry?.() || i.getAsFile()).filter(Boolean);
    if (!roots.length) for (const file of transfer.files || []) roots.push(file);
    const found = [], job = begin("Scanning dropped files..."); let scanned = 0;
    async function visit(entry) {
      if (entry.isDirectory) {
        const reader = entry.createReader();
        for (;;) {
          job.update("Scanning " + entry.name + " / " + scanned + " files checked");
          const batch = await new Promise((ok, fail) => reader.readEntries(ok, fail));
          if (!batch.length) break;
          for (const child of batch) {
            try { await visit(child); } catch (error) { console.warn("Could not read dropped entry", child.name, error); }
          }
        }
      } else {
        scanned++;
        if (scanned % 64 === 0) { job.update("Checking dropped files / " + scanned + " checked"); await paint(); }
        if (!accepts(entry.name)) return;
        const file = entry.isFile ? await new Promise((ok, fail) => entry.file(ok, fail)) : entry;
        if (file) found.push(makeItem(file, entry.fullPath || file.webkitRelativePath || file.name));
      }
    }
    try {
      await paint();
      for (const root of roots) {
        try { await visit(root); } catch (error) { console.warn("Could not read dropped entry", root.name, error); }
      }
      return found;
    } finally { job.end(); }
  }
  function media(element, label) {
    let job;
    const finish = () => { job?.end(); job = null; };
    const loading = event => {
      if (!element.getAttribute("src") && !element.querySelector("source[src]")) return;
      // A paused player that preloads only metadata is idle, not stuck buffering.
      if (event.type === "stalled" && element.paused && element.readyState >= 1 && !element.seeking) return;
      const text = (event.type === "waiting" || event.type === "stalled" ? "Buffering " : "Opening ") + label() + "...";
      if (!job) job = begin(text); else job.update(text);
    };
    const starts = ["loadstart", "waiting", "stalled"];
    const ends = ["loadedmetadata", "loadeddata", "canplay", "playing", "error", "abort", "emptied", "ended"];
    for (const event of starts) element.addEventListener(event, loading);
    for (const event of ends) element.addEventListener(event, finish);
    return () => {
      for (const event of starts) element.removeEventListener(event, loading);
      for (const event of ends) element.removeEventListener(event, finish);
      finish();
    };
  }
  function image(element, url, name) {
    const job = begin("Opening " + name + "...");
    const finish = () => { job.end(); element.removeEventListener("load",finish); element.removeEventListener("error",finish); };
    element.addEventListener("load",finish); element.addEventListener("error",finish);
    element.src = url;
    if (element.complete) finish();
    return finish;
  }
  return { begin, paint, run, rows, cancelRows: container => renders.delete(container), dropped, media, image };
})();
