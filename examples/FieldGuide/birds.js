// Local ES module. Keeping search separate makes it easy to add another field.
export function matches(bird, query) {
  const words = query.trim().toLowerCase().split(/\s+/);
  const text = [bird.name, bird.habitat, bird.mark].join(" ").toLowerCase();
  return words.every(word => text.includes(word));
}

export function readBirds(data) {
  if (!Array.isArray(data) || data.length > 200) throw Error("Use a JSON array with up to 200 birds.");
  for (const bird of data) {
    if (!bird || !["name", "habitat", "mark", "art"].every(key => typeof bird[key] === "string") ||
        !/^[a-z0-9_-]+\.(svg|png|jpe?g|webp)$/i.test(bird.art))
      throw Error("Each bird needs a name, habitat, field mark, and a local image filename.");
  }
  return data;
}
