// Source: star-art/ui-A-final/tokens.ts (Direction A "Night Stadium"). CSS variables in styles.css mirror these values.
// STAR — Direction A "Night Stadium" design tokens. Numbers are px (dp).
// Shadows/gradients are CSS strings; map to RN/Expo styles as needed.
export const tokens = {
  "colors": {
    "bg": "#0B1433",
    "surface": "#16244F",
    "surfaceAlt": "#1E3166",
    "navBg": "#0A1230",
    "primary": "#2BFF88",
    "primaryLight": "#5CFFA6",
    "primaryDark": "#0FB85C",
    "accent": "#36D6FF",
    "accentDark": "#1B7FA3",
    "gold": "#FFC83D",
    "goldLight": "#FFE08A",
    "goldDark": "#C98F12",
    "onGold": "#3A2600",
    "text": "#F2F6FF",
    "textMuted": "#8C9CC4",
    "onPrimary": "#0B1433",
    "success": "#3DDC6E",
    "danger": "#FF4D5E",
    "draw": "#8C9CC4",
    "divider": "rgba(140,156,196,0.2)",
    "tierBronze": "#C27A3A",
    "tierSilver": "#C9D3DC",
    "tierGold": "#F5C542"
  },
  "fonts": {
    "headline": "'Secular One', sans-serif",
    "body": "'Rubik', sans-serif",
    "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Secular+One&display=swap"
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
    "cta": 26,
    "coinTotal": 30
  },
  "fontWeights": {
    "regular": 400,
    "medium": 500,
    "semibold": 600,
    "bold": 700,
    "headline": 400
  },
  "radii": {
    "sm": 6,
    "md": 10,
    "lg": 12,
    "slot": 14,
    "card": 16,
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
    "screenX": 16,
    "navHeight": 78
  },
  "shadows": {
    "card": "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)",
    "primaryGlow": "0 0 18px rgba(43,255,136,0.45)",
    "goldGlow": "0 0 18px rgba(255,200,61,0.45)",
    "coinChip": "0 0 12px rgba(255,200,61,0.25)",
    "tierGoldGlow": "0 0 14px rgba(245,197,66,0.35)",
    "nav": "0 -8px 24px rgba(0,0,0,0.5)"
  },
  "buttons": {
    "primary": {
      "height": 60,
      "radius": 999,
      "font": "headline",
      "fontSize": 22,
      "default": {
        "background": "linear-gradient(#5CFFA6,#2BFF88)",
        "color": "#0B1433",
        "border": "2px solid #0FB85C",
        "boxShadow": "0 5px 0 #0FB85C, 0 0 18px rgba(43,255,136,0.45)",
        "transform": "none"
      },
      "pressed": {
        "background": "linear-gradient(#2BFF88,#22E57A)",
        "color": "#0B1433",
        "border": "2px solid #0FB85C",
        "boxShadow": "0 1px 0 #0FB85C, 0 0 8px rgba(43,255,136,0.3)",
        "transform": "translateY(4px)"
      },
      "disabled": {
        "background": "#1E3166",
        "color": "#8C9CC4",
        "border": "2px solid #2A3D73",
        "boxShadow": "0 5px 0 #121E45",
        "opacity": 0.7
      }
    },
    "secondary": {
      "height": 48,
      "radius": 999,
      "font": "headline",
      "fontSize": 17,
      "default": {
        "background": "#1E3166",
        "color": "#F2F6FF",
        "border": "2px solid #36D6FF",
        "boxShadow": "0 4px 0 #1B7FA3",
        "transform": "none"
      },
      "pressed": {
        "background": "#16244F",
        "color": "#F2F6FF",
        "border": "2px solid #36D6FF",
        "boxShadow": "0 1px 0 #1B7FA3",
        "transform": "translateY(3px)"
      },
      "disabled": {
        "background": "#16244F",
        "color": "#8C9CC4",
        "border": "2px solid #2A3D73",
        "boxShadow": "0 4px 0 #121E45",
        "opacity": 0.7
      }
    },
    "rewardedAd": {
      "height": 56,
      "radius": 999,
      "font": "headline",
      "fontSize": 17,
      "tag": {
        "background": "#3A2600",
        "color": "#FFC83D",
        "radius": 6
      },
      "default": {
        "background": "linear-gradient(#FFE08A,#FFC83D)",
        "color": "#3A2600",
        "border": "2px solid #C98F12",
        "boxShadow": "0 5px 0 #C98F12, 0 0 18px rgba(255,200,61,0.45)",
        "transform": "none"
      },
      "pressed": {
        "background": "linear-gradient(#FFC83D,#F2B52A)",
        "color": "#3A2600",
        "border": "2px solid #C98F12",
        "boxShadow": "0 1px 0 #C98F12, 0 0 8px rgba(255,200,61,0.3)",
        "transform": "translateY(4px)"
      },
      "disabled": {
        "background": "#1E3166",
        "color": "#8C9CC4",
        "border": "2px solid #5A4A1E",
        "boxShadow": "0 5px 0 #121E45",
        "opacity": 0.7
      }
    }
  },
  "cards": {
    "default": {
      "background": "#16244F",
      "border": "1.5px solid rgba(43,255,136,0.35)",
      "radius": 16,
      "padding": 16,
      "boxShadow": "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)"
    },
    "alt": {
      "background": "#1E3166",
      "border": "1.5px solid rgba(54,214,255,0.3)",
      "radius": 16,
      "padding": 16,
      "boxShadow": "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)"
    },
    "gearSlot": {
      "background": "#16244F",
      "border": "2px solid <tierColor>",
      "radius": 14,
      "iconWell": "radial-gradient(#1E3166,#101C42)",
      "goldBoxShadow": "0 0 14px rgba(245,197,66,0.35)"
    },
    "coinChip": {
      "background": "#16244F",
      "border": "1.5px solid rgba(255,200,61,0.5)",
      "radius": 999,
      "color": "#FFC83D"
    }
  },
  "background": {
    "screen": "radial-gradient(120% 60% at 50% 0%, #1E3166 0%, #0B1433 60%)",
    "tile": "bg-tile.png @ 256px, opacity 0.10",
    "floodlights": "linear-gradient(120deg, rgba(54,214,255,0.16), transparent 35%) + mirrored 240deg"
  }
} as const;

export type Tokens = typeof tokens;
export default tokens;
