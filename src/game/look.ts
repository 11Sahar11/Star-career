/** Free character look: skin tone, hair style and hair colour (data from star-art hair/hair.json). */
export const SKIN_TONES = ["#f6d7bf", "#e8b892", "#c98f66", "#a8724f", "#7d4e33", "#4e2f1f"] as const;
/** Skin used for the art when the save has none (closest to the original player art). */
export const DEFAULT_SKIN = 3;

export const HAIR_STYLES = ["buzz", "short", "curly", "afro", "long", "mohawk"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const DEFAULT_HAIR: HairStyle = "short";

export const HAIR_COLORS = {
  black: "#1A1614",
  dark_brown: "#3B2417",
  brown: "#6B4226",
  blond: "#D9B25F",
  red: "#A8432A",
  grey: "#9A9A9E",
} as const;
export type HairColor = keyof typeof HAIR_COLORS;
export const HAIR_COLOR_IDS = Object.keys(HAIR_COLORS) as HairColor[];
export const DEFAULT_HAIR_COLOR: HairColor = "dark_brown";

export function isSkin(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= SKIN_TONES.length;
}
export function isHairStyle(v: unknown): v is HairStyle {
  return typeof v === "string" && (HAIR_STYLES as readonly string[]).includes(v);
}
export function isHairColor(v: unknown): v is HairColor {
  return typeof v === "string" && v in HAIR_COLORS;
}

/** Resolved look with every fallback applied; never throws on odd saves. */
export function resolveLook(player: { skin?: unknown; hair?: unknown; hairColor?: unknown }) {
  return {
    skin: isSkin(player.skin) ? player.skin : DEFAULT_SKIN,
    hair: isHairStyle(player.hair) ? player.hair : DEFAULT_HAIR,
    hairColor: isHairColor(player.hairColor) ? player.hairColor : DEFAULT_HAIR_COLOR,
  };
}
