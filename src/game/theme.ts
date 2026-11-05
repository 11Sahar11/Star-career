// Source: star-art/ui-v2/gen.py Direction 2 "Matchday Paper".
// STAR — Matchday Paper design tokens. Numbers are px (dp).
// CSS variables in styles.css mirror these values.
export const tokens = {
  "colors": {
    "bg": "#F3F1EC",
    "bgAlt": "#ECE9E1",
    "surface": "#FFFFFF",
    "surfaceAlt": "#F3F1EC",
    "navBg": "#FFFFFF",
    "primary": "#0B6B3A",
    "primaryLight": "#0B6B3A",
    "primaryDark": "#08522C",
    "accent": "#111418",
    "accentDark": "#111418",
    "ad": "#FFB020",
    "onAd": "#1A1200",
    "gold": "#B07A0C",
    "goldLight": "#FFD27A",
    "goldDark": "#E09A12",
    "onGold": "#1A1200",
    "text": "#111418",
    "textMuted": "#6B6F76",
    "textDim": "#9A9EA5",
    "onPrimary": "#FFFFFF",
    "success": "#0B6B3A",
    "danger": "#C8323C",
    "draw": "#9A9EA5",
    "divider": "#E2DFD7",
    "tierBronze": "#A8662C",
    "tierSilver": "#8F99A3",
    "tierGold": "#D9A21B",
    "bandLow": "#9A9EA5",
    "bandMid": "#B07A0C",
    "bandGood": "#5C8A1A",
    "bandHigh": "#0B6B3A",
    "bandElite": "#1F5FBF"
  },
  "fonts": {
    "headline": "'Oswald', 'Assistant', sans-serif",
    "body": "'Inter', 'Assistant', sans-serif",
    "hebrew": "'Assistant', 'Inter', sans-serif",
    "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&family=Assistant:wght@400;500;600;700;800&display=swap"
  },
  "fontSizes": {
    "caption": 10.5,
    "label": 12,
    "small": 13,
    "body": 14.5,
    "bodyLg": 15,
    "title": 18,
    "h3": 20,
    "h2": 22,
    "h1": 28,
    "cta": 17,
    "coinTotal": 15
  },
  "fontWeights": {
    "regular": 400,
    "medium": 500,
    "semibold": 600,
    "bold": 700,
    "headline": 700
  },
  "radii": {
    "sm": 6,
    "md": 10,
    "lg": 12,
    "slot": 14,
    "card": 16,
    "shop": 18,
    "pill": 999
  },
  "spacing": {
    "xxs": 2,
    "xs": 4,
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 16,
    "xxl": 22,
    "screenX": 20,
    "navHeight": 84
  },
  "shadows": {
    "card": "none",
    "primaryGlow": "none",
    "goldGlow": "none",
    "coinChip": "0 1px 2px rgba(17,20,24,0.06)",
    "tierGoldGlow": "none",
    "nav": "none",
    "shop": "0 6px 16px rgba(11,107,58,0.3)"
  },
  "cards": {
    "default": {
      "background": "#FFFFFF",
      "border": "1px solid #E2DFD7",
      "radius": 16,
      "padding": 18,
      "boxShadow": "none"
    },
    "alt": {
      "background": "#FFFFFF",
      "border": "1px solid #E2DFD7",
      "radius": 16,
      "padding": 18,
      "boxShadow": "none"
    },
    "fixture": {
      "background": "#111418",
      "color": "#FFFFFF",
      "radius": 20,
      "padding": 22
    },
    "gearSlot": {
      "background": "#FFFFFF",
      "border": "1px solid #E2DFD7",
      "radius": 14,
      "iconWell": "#F7F5F0",
      "equippedBorder": "2px solid #0B6B3A",
      "goldBoxShadow": "none"
    },
    "coinChip": {
      "background": "#FFFFFF",
      "border": "0",
      "radius": 999,
      "color": "#111418",
      "boxShadow": "0 1px 2px rgba(17,20,24,0.06)"
    }
  },
  "background": {
    "screen": "#F3F1EC",
    "myPlayerStage": "linear-gradient(#E9E5DB, #F3F1EC)",
    "tile": "none",
    "floodlights": "none"
  }
} as const;

export type Tokens = typeof tokens;
export default tokens;
