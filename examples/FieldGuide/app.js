import { matches, readBirds } from "./birds.js";

const search = document.querySelector("#search");
const status = document.querySelector("#status");
const list = document.querySelector("#birds");
const cards = [];

function element(tag, words) {
  const node = document.createElement(tag);
  node.textContent = words;
  return node;
}

function filter() {
  let count = 0;
  for (const { bird, card } of cards) {
    card.hidden = !matches(bird, search.value);
    if (!card.hidden) count++;
  }
  status.textContent = count ? count + (count === 1 ? " bird in view." : " birds in view.") : "No birds match. Try a habitat or clear the search.";
}

async function openNotebook() {
  // Module-relative URLs work from the app's local origin without an HTTP server.
  const birds = await GalleryActivity.run("Reading the field notebook...", async () => {
    const response = await fetch(new URL("./birds.json", import.meta.url), { cache: "no-store" });
    if (!response.ok) throw Error("The birds.json file could not be opened.");
    return readBirds(await response.json());
  });
  const art = GalleryActivity.begin("Loading illustrations...");
  let done = 0, missing = 0;
  const loaded = [];
  for (const bird of birds) {
    const card = document.createElement("article");
    const image = new Image();
    image.alt = "Illustration of " + bird.name;
    image.src = new URL(bird.art, import.meta.url);
    loaded.push(image.decode().catch(() => { missing++; }).finally(() => {
      done++; art.update("Loading illustrations / " + done + " of " + birds.length, done, birds.length);
    }));
    card.append(image, element("small", bird.habitat), element("h2", bird.name), element("p", bird.mark));
    list.append(card);
    cards.push({ bird, card });
  }
  search.addEventListener("input", filter);
  filter();
  try { await Promise.all(loaded); } finally { art.end(); }
  if (missing) status.textContent += " " + missing + " illustrations could not be loaded.";
}
openNotebook().catch(error => { status.textContent = "Check FieldGuide/birds.json. " + error.message; });
