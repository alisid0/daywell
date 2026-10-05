export const daywellStyles = [
  { id: "nook", name: "Nook", description: "Furry company, soft colours", detail: "Cosy & companion-led" },
  { id: "stillwater", name: "Stillwater", description: "An open lake and a little calm", detail: "Immersive & unhurried" },
  { id: "cloud", name: "Cloud", description: "Rose-coloured everyday tools", detail: "Rounded & playful" },
  { id: "grove", name: "Grove", description: "A green personal journal", detail: "Natural & thoughtful" },
  { id: "moonlight", name: "Moonlight", description: "A quieter, darker workspace", detail: "Dim & spacious" },
] as const;
export type DaywellStyle = typeof daywellStyles[number]["id"];
const tokenNames = ["canvas","surface","ink","accent","on-accent","muted","soft","line","positive","positive-ink","luma","halo"];
function colours(values: string[]) {
  return Object.fromEntries(tokenNames.map((name, i) => [`--dw-${name}`, values[i]]));
}
export const palettes = {
  butter: { name: "Butter", scheme: "light", swatches: ["#fff2d7","#f6c96d","#67456c"], tokens: colours(["#fff2d7","#fffcf4","#49334c","#67456c","#fffaf6","#756278","#f4e3eb","#ded0c6","#dce7ca","#415638","#e9e0f3","#f6c96d"]) },
  berry: { name: "Berry", scheme: "light", swatches: ["#fae7ef","#dca7bf","#803c65"], tokens: colours(["#fae7ef","#fff7fb","#522d46","#803c65","#fff7fb","#7d536e","#edd0e2","#d8b7cc","#dce8d8","#365a42","#e3d9f0","#efb4ad"]) },
  sage: { name: "Sage", scheme: "light", swatches: ["#eef3df","#cedcaa","#365c47"], tokens: colours(["#eef3df","#fafcf2","#2f4536","#365c47","#fcfff6","#5c715b","#e0e9c8","#c5d1b9","#d3e5bc","#365536","#e0e4e9","#e8cb76"]) },
  dusk: { name: "Dusk", scheme: "dark", swatches: ["#2d2943","#c4afe6","#f4c3b5"], tokens: colours(["#2d2943","#3b3552","#fbf4ff","#d6b9ee","#362342","#d0c2da","#51445e","#76667f","#364d49","#ddf1d9","#4a3f63","#efcbb0"]) },
  lake: { name: "Lake", scheme: "dark", swatches: ["#123d50","#9bd6ca","#dbece2"], tokens: colours(["#123d50","#1c4857","#f8fcfa","#a9dfd4","#123d43","#d2e5e3","#285b65","#547d86","#2c5555","#ddf4e5","#424e69","#b7e8d8"]) },
} as const;
export const backdrops = ["plain", "gingham", "speckle", "lake"] as const;
export const lettering = ["rounded", "journal", "clean"] as const;
export const buttonLooks = ["pillowy", "pebble", "simple"] as const;
export const companyLooks = ["huddle", "perch", "quiet"] as const;
export const compositions = ["original", "breathing", "cove", "beside"] as const;
export type Appearance = {
  style: DaywellStyle;
  palette: keyof typeof palettes;
  backdrop: typeof backdrops[number];
  lettering: typeof lettering[number];
  buttons: typeof buttonLooks[number];
  company: typeof companyLooks[number];
  composition: typeof compositions[number];
};
export type FavouriteLook = { id: string; name: string; look: Appearance };
export type AppearanceProfile = { version: 1; current: Appearance; favourites: FavouriteLook[] };
export const appearanceKey = "daywell-appearance-studio";
export const legacyStyleKey = "daywell-visual-style";
export const maxFavourites = 12;

export function originalLook(style: DaywellStyle = "nook"): Appearance {
  const common = { style, backdrop: "plain", lettering: "rounded", buttons: "pillowy", company: "quiet", composition: "original" } as const;
  if (style === "stillwater") return { ...common, palette: "lake", backdrop: "lake", lettering: "clean", buttons: "pebble" };
  if (style === "cloud") return { ...common, palette: "berry" };
  if (style === "grove") return { ...common, palette: "sage", lettering: "journal", buttons: "simple" };
  if (style === "moonlight") return { ...common, palette: "dusk", lettering: "clean", buttons: "pebble" };
  return { ...common, palette: "butter", company: "huddle" };
}
export const starterLooks = [
  { name: "Original Nook", look: originalLook() },
  { name: "Berry blanket", look: { ...originalLook(), palette: "berry", backdrop: "gingham" } as Appearance },
  { name: "Moonlit den", look: { ...originalLook(), palette: "dusk", backdrop: "speckle", buttons: "pebble", company: "perch" } as Appearance },
  { name: "Lakeside friends", look: { ...originalLook(), palette: "lake", backdrop: "lake", lettering: "clean", buttons: "pebble" } as Appearance },
  { name: "Sage journal", look: { ...originalLook(), palette: "sage", backdrop: "speckle", lettering: "journal", buttons: "simple", company: "perch" } as Appearance },
  { name: "Original Stillwater", look: originalLook("stillwater") },
];

// Ali's selected direction remains an explicit reference, independent of later experiments.
export const referenceLook: Appearance = {
  style: "stillwater", palette: "berry", backdrop: "speckle", lettering: "rounded",
  buttons: "pillowy", company: "perch", composition: "original",
};
export const designIterations = [
  { id: "breathing", name: "Breathing room", description: "An open centre with voice first. Small companions rest below, leaving room to think.", detail: "The calmest direction" },
  { id: "cove", name: "Cosy cove", description: "A soft arch holds the companions and your voice control together. A little more shelter.", detail: "Comfort in one soft shape" },
  { id: "beside", name: "Gentle company", description: "Your words on one side, your companions on the other. An unhurried space to settle into.", detail: "A spacious, personal corner" },
] as const;
export function iterationLook(composition: Appearance["composition"]): Appearance { return { ...referenceLook, composition }; }

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function isStyle(value: unknown): value is DaywellStyle { return daywellStyles.some(s => s.id === value); }
function option<T extends string>(value: unknown, options: readonly T[], fallback: T): T { return options.includes(value as T) ? value as T : fallback; }
export function normaliseAppearance(value: unknown): Appearance {
  const source = record(value), base = originalLook(isStyle(source.style) ? source.style : "nook");
  return {
    style: base.style,
    palette: option(source.palette, Object.keys(palettes) as Appearance["palette"][], base.palette),
    backdrop: option(source.backdrop, backdrops, base.backdrop),
    lettering: option(source.lettering, lettering, base.lettering),
    buttons: option(source.buttons, buttonLooks, base.buttons),
    company: option(source.company, companyLooks, base.company),
    composition: base.style === "stillwater" ? option(source.composition, compositions, "original") : "original",
  };
}
export function readAppearanceProfile(raw: string | null, legacy?: string | null): AppearanceProfile {
  const fallback: AppearanceProfile = { version: 1, current: isStyle(legacy) ? originalLook(legacy) : iterationLook("cove"), favourites: [] };
  try {
    const source = record(JSON.parse(raw || "null"));
    if (source.version !== 1) return fallback;
    const ids = new Set<string>();
    const favourites: FavouriteLook[] = [];
    if (Array.isArray(source.favourites)) for (const item of source.favourites) {
      const f = record(item);
      if (typeof f.id !== "string" || !f.id || f.id.length > 80 || ids.has(f.id) || typeof f.name !== "string" || !f.name.trim() || !f.look) continue;
      ids.add(f.id); favourites.push({ id: f.id, name: f.name.trim().slice(0, 40), look: normaliseAppearance(f.look) });
      if (favourites.length === maxFavourites) break;
    }
    return { version: 1, current: normaliseAppearance(source.current), favourites };
  } catch { return fallback; }
}
export function sameLook(a: Appearance, b: Appearance) { return (Object.keys(a) as (keyof Appearance)[]).every(k => a[k] === b[k]); }
export function appearanceTokens(look: Appearance): Record<string, string> {
  const p = palettes[look.palette], v = p.tokens;
  return { ...v, "--dw-wash":v["--dw-soft"], "--dw-muted-soft":v["--dw-muted"], "--dw-focus":v["--dw-accent"], "--dw-mark":v["--dw-accent"], "--dw-tock":v["--dw-soft"], "--dw-note":v["--dw-soft"], "--dw-selected-plan":v["--dw-soft"], "--dw-selected-record":v["--dw-positive"], "--dw-error":p.scheme === "dark" ? "#ffdae0" : "#932b4a", "--dw-error-bg":p.scheme === "dark" ? "#633e4d" : "#ffe9ed" };
}
export function letteringTokens(value: Appearance["lettering"]) {
  return value === "journal" ? { "--dw-display":"Newsreader, Georgia, serif", "--dw-font":"'DM Sans', sans-serif", "--dw-display-weight":"450" } : value === "clean" ? { "--dw-display":"Manrope, sans-serif", "--dw-font":"Manrope, sans-serif", "--dw-display-weight":"550" } : { "--dw-display":"'Bricolage Grotesque', sans-serif", "--dw-font":"'DM Sans', sans-serif", "--dw-display-weight":"650" };
}
