// SRT times are integer milliseconds. Convert once, then shift without rounding drift.
function milliseconds(clock) {
  const m = /^(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})$/.exec(clock);
  if (!m) throw Error("Expected an SRT timestamp such as 00:00:01,500.");
  const value = ((Number(m[1]) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + Number(m[4]);
  if (!Number.isSafeInteger(value) || value > 360000000) throw Error("A cue is outside the supported time range.");
  return value;
}

export function clock(ms) {
  const pad = (n, digits = 2) => String(n).padStart(digits, "0");
  return pad(Math.floor(ms / 3600000)) + ":" + pad(Math.floor(ms / 60000) % 60) + ":" +
    pad(Math.floor(ms / 1000) % 60) + "," + pad(ms % 1000, 3);
}

export function parseSRT(source) {
  const blocks = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim().split(/\n[ \t]*\n+/);
  if (blocks.length > 2000) throw Error("Use a subtitle file with no more than 2,000 cues.");
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    if (/^\d+$/.test(lines[0].trim())) lines.shift();
    const times = (lines.shift() || "").trim().split(/\s+-->\s+/);
    if (times.length !== 2 || !lines.length) throw Error("Check the time range and text in cue " + (i + 1) + ".");
    const start = milliseconds(times[0]), end = milliseconds(times[1]);
    if (end <= start) throw Error("Cue " + (i + 1) + " ends before it starts.");
    return { start, end, text: lines.join("\n") };
  });
}

export function shiftCues(cues, offset) {
  // Discard cues entirely before the clip and trim only a partially overlapping start.
  return cues.filter(c => c.end + offset > 0).map(c => ({
    start: Math.max(0, c.start + offset), end: c.end + offset, text: c.text
  }));
}
export function serialize(cues) {
  return cues.map((c, i) => (i + 1) + "\r\n" + clock(c.start) + " --> " + clock(c.end) + "\r\n" +
    c.text.replace(/\n/g, "\r\n")).join("\r\n\r\n") + "\r\n";
}
