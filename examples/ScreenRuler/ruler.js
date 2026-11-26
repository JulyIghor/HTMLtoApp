(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    win = window.HTMLtoApp?.window;
  let state,
    placed = false,
    working = false,
    seq = 0,
    mouseTimer = 0,
    paintId = 0,
    masking = false,
    dirty = false,
    lastMask = "",
    moving = false,
    queue = [];

  function message(s) {
    $("notice").textContent = s;
  }

  function sample() {
    $("sampleSize").textContent =
      ($("widthPt").value || "—") + " × " + ($("heightPt").value || "—") + " pt";
  }
  $("widthPt").oninput = $("heightPt").oninput = sample;

  // An empty value means the setup window's display at the moment of placement.
  async function screens() {
    const next = await win.getDisplays(),
      select = $("screen"),
      keep = select.value;
    select.replaceChildren(
      new Option("Current display", ""),
      ...next.map((d, i) => new Option(d.name || "Display " + (i + 1), d.id))
    );
    select.value = next.some((d) => d.id === keep) ? keep : "";
    if (!working) $("place").disabled = !next.length;
    return next.length;
  }

  // Paint the two arms on an otherwise clear mask. With click-through enabled, the clear
  // center lets the user work in the app underneath the ruler.
  async function shape(w, h, left, top) {
    const stamp = [w, h, left, top].join("/");
    if (!placed || lastMask === stamp) return;
    if (masking) {
      dirty = true;
      return;
    }
    masking = true;
    const ticket = seq;
    try {
      const mask = document.createElement("canvas"),
        scale = Math.min(1, 800 / Math.max(w, h));
      mask.width = Math.max(1, Math.round(w * scale));
      mask.height = Math.max(1, Math.round(h * scale));
      const g = mask.getContext("2d");
      g.scale(mask.width / w, mask.height / h);
      g.fillRect(0, 0, w, top);
      g.fillRect(0, 0, left, h);
      await win.setShape(mask);
      if (ticket === seq) lastMask = stamp;
    } catch {
      if (placed && ticket === seq) {
        await edit();
        message("The transparent shape could not be applied. Try placing the ruler again.");
      }
    } finally {
      masking = false;
      if (dirty) {
        dirty = false;
        paint();
      }
    }
  }

  // Measure in screen points, but give the canvas extra backing pixels for sharp ticks on Retina displays.
  function paint() {
    if (!placed || paintId) return;
    paintId = requestAnimationFrame(() => {
      paintId = 0;
      if (!placed) return;
      const cv = $("ticks"),
        w = innerWidth,
        h = innerHeight,
        top = $("topArm").offsetHeight,
        left = $("leftArm").offsetWidth;
      if (!w || !h) return;
      const scale = Math.min(devicePixelRatio || 1, 2, 4096 / Math.max(w, h));
      cv.width = Math.max(1, Math.round(w * scale));
      cv.height = Math.max(1, Math.round(h * scale));
      const g = cv.getContext("2d");
      g.scale(cv.width / w, cv.height / h);
      g.fillStyle = "#123d33";
      g.fillRect(0, 0, w, top);
      g.fillRect(0, 0, left, h);
      const sx = w / (state?.bounds.width || w),
        sy = h / (state?.bounds.height || h);
      const readout = $("readout");
      readout.textContent =
        Math.round(state?.bounds.width || w) + " × " + Math.round(state?.bounds.height || h) + " pt";
      const sizeBox = readout.getBoundingClientRect(),
        labelY = top - 11;
      g.fillStyle = "#d8f4df";
      g.font = "10px system-ui";
      // Center numbers on their ticks. At compact widths the size shares the
      // scale row. At higher zoom fewer labels fit, but every tick is preserved.
      let nextLabelX = sizeBox.bottom <= labelY - 10 ? 2 : sizeBox.right + 4;
      for (let i = 10; i <= Math.ceil(w / sx); i += 10) {
        const x = i * sx,
          n = i % 50 === 0 ? 8 : 4;
        if (x < left + 2 || x + 1 > w - 4) continue;
        g.fillRect(x, top - 1 - n, 1, n);
        if (i % 50 === 0) {
          const width = g.measureText(i).width,
            labelX = Math.min(x - width / 2, w - 2 - width);
          if (labelX >= nextLabelX) {
            g.fillText(i, labelX, labelY);
            nextLabelX = labelX + width + 4;
          }
        }
      }
      let nextLabelY = top + 2;
      for (let i = 10; i <= Math.ceil(h / sy); i += 10) {
        const y = i * sy,
          n = i % 50 === 0 ? 8 : 4;
        if (y < top + 2 || y + 1 > h - 4) continue;
        g.fillRect(left - 1 - n, y, n, 1);
        if (i % 50 === 0) {
          const width = g.measureText(i).width,
            end = Math.min(h - 2, Math.max(top + 2 + width, y + width / 2));
          if (end - width < nextLabelY) continue;
          g.save();
          g.translate(left - 14, end);
          g.rotate(-Math.PI / 2);
          g.fillText(i, 0, 0);
          g.restore();
          nextLabelY = end + 4;
        }
      }
      shape(w, h, left, top);
    });
  }

  function show(on) {
    placed = on;
    seq++;
    document.documentElement.classList.toggle("measuring", on);
    $("overlay").classList.toggle("dragCenter", on && !$("through").checked);
    $("setup").hidden = on;
    $("overlay").hidden = !on;
    lastMask = "";
    if (!on) {
      clearTimeout(mouseTimer);
      cancelAnimationFrame(paintId);
      paintId = 0;
      queue = [];
      $("pass").disabled = false;
    } else $("overlay").focus({ preventScroll: true });
  }

  async function edit() {
    if (!placed) return;
    show(false);
    try {
      await win.reset();
    } catch (e) {
      message(e.message || String(e));
    }
    $("place").focus();
  }
  $("settings").onsubmit = async (e) => {
    e.preventDefault();
    if (working || placed || !win) return;
    working = true;
    $("place").disabled = true;
    try {
      const selected = $("screen").value,
        [current, displays] = await Promise.all([win.getState(), win.getDisplays()]),
        d = displays.find((screen) => screen.id === (selected || current.displayId));
      if (!d) throw Error("That display is no longer available. Choose a connected display and try again.");
      // Configure first so reset returns to the original decorated window and display.
      state = await win.configure({
        titleBar: "borderless",
        transparent: true,
        clickThrough: $("through").checked ? "transparent" : "never",
        level: $("level").value,
        allSpaces: $("stationary").checked,
        missionControl: $("stationary").checked ? "stationary" : "normal",
        anchor: "none"
      });
      if (state.displayId !== d.id) state = await win.moveToDisplay(d.id);
      const a = d.visibleBounds;
      const w = Math.min(Number($("widthPt").value), a.width),
        h = Math.min(Number($("heightPt").value), a.height);
      state = await win.setBounds({
        x: Math.round(a.x + (a.width - w) / 2),
        y: Math.round(a.y + (a.height - h) / 2),
        width: w,
        height: h
      });
      show(true);
      paint();
    } catch (e) {
      show(false);
      try {
        await win.reset();
      } catch {}
      message(e.message || String(e));
    } finally {
      working = false;
      $("place").disabled = false;
    }
  };
  // Hand the original press to AppKit before the pointer can leave a thin arm.
  // A button press or a click in the pass-through center belongs to its normal target.
  $("overlay").addEventListener("pointerdown", (e) => {
    if (!placed || !e.isTrusted || !e.isPrimary || e.button !== 0 || e.ctrlKey ||
        e.target.closest("button") || ($("through").checked && !e.target.closest(".dragArm"))) return;
    e.preventDefault();
    $("overlay").focus({ preventScroll: true });
    // Releasing before AppKit receives the request is just a click, not a drag.
    win.startDrag().catch(() => {});
  });
  $("edit").onclick = edit;
  $("pass").onclick = async () => {
    if (!placed || $("pass").disabled) return;
    $("pass").disabled = true;
    const token = seq;
    try {
      await win.configure({ clickThrough: "always" });
      if (!placed || token !== seq) return;
      mouseTimer = setTimeout(async () => {
        if (placed && token === seq) {
          try {
            await win.configure({
              clickThrough: $("through").checked ? "transparent" : "never"
            });
          } catch {
            await edit();
          } finally {
            $("pass").disabled = false;
          }
        }
      }, 5000);
    } catch {
      await edit();
      message("Mouse input was restored.");
    }
  };

  // Apply keyboard steps in order. Each one starts from the native bounds left by the previous step.
  async function nudge() {
    if (moving) return;
    moving = true;
    try {
      while (queue.length && placed) {
        const { dx, dy, grow } = queue.shift(),
          s = await win.getState();
        if (!placed) break;
        state = await win.setBounds(
          grow
            ? {
                width: Math.max(180, s.bounds.width + dx),
                height: Math.max(96, s.bounds.height + dy)
              }
            : { x: s.bounds.x + dx, y: s.bounds.y + dy }
        );
        paint();
      }
    } catch {
      queue = [];
    } finally {
      moving = false;
    }
  }
  addEventListener("keydown", (e) => {
    if (!placed || e.metaKey || e.altKey || e.ctrlKey) return;
    if (e.key === "Escape") {
      e.preventDefault();
      edit();
      return;
    }
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
      e.key
    ];
    if (!d) return;
    e.preventDefault();
    if (queue.length < 12) queue.push({ dx: d[0], dy: d[1], grow: e.shiftKey });
    nudge();
  });
  addEventListener("resize", paint);
  addEventListener("htmltoapp-windowchange", ({ detail: s }) => {
    if (!s) return;
    const resized = state?.bounds.width !== s.bounds.width || state?.bounds.height !== s.bounds.height,
      changedDisplay = state?.displayId !== s.displayId;
    state = s;
    if (placed && s.userRestored) {
      show(false);
      message("Standard window restored. Reload to place a ruler again.");
    } else if (resized || changedDisplay) paint();
  });
  addEventListener("htmltoapp-displayschange", () =>
    screens().catch(() =>
      message("Display arrangement changed. Reopen the ruler to refresh the list.")
    )
  );
  addEventListener("pagehide", () => {
    clearTimeout(mouseTimer);
    cancelAnimationFrame(paintId);
  });
  (async () => {
    const required = [
      "getDisplays",
      "getState",
      "configure",
      "moveToDisplay",
      "setBounds",
      "setShape",
      "startDrag",
      "reset"
    ];
    if (!required.every((method) => typeof win?.[method] === "function")) {
      message(
        "Open this project in HTML to App to place a ruler. Choose Export App to keep a standalone copy."
      );
      return;
    }
    try {
      message("Reading the display arrangement...");
      const count = await screens();
      message(count ? "Choose a display and place the ruler. Choose Export App to keep it as its own tool." : "No displays are available.");
    } catch {
      message(
        "Display placement needs a native project window. Choose Run in HTML to App or Export App."
      );
    }
  })();
})();
