---
name: STAR
description: A football career on cream paper. Ink type, one green, amber for rewarded videos, the next match in a dark card.
colors:
  paper: "#f3f1ec"
  paper-band: "#eae6dc"
  card: "#ffffff"
  card-pressed: "#f6f4ef"
  hairline: "#e2dfd7"
  hairline-strong: "#d3cfc4"
  ink: "#111418"
  ink-muted: "#62666d"
  ink-dim: "#9a9da3"
  on-ink-muted: "#a9adb4"
  pitch-green: "#0b6b3a"
  pitch-green-deep: "#08552e"
  pitch-green-tint: "#e3efe7"
  reward-amber: "#ffb020"
  reward-amber-light: "#ffc24d"
  reward-amber-deep: "#e89c10"
  on-amber: "#1d1300"
  coin-gold: "#f2c443"
  good: "#0e7a42"
  bad: "#c8232f"
  alert-dot: "#ff4d4f"
typography:
  display:
    fontFamily: "STAR Display, Heebo, Arial Narrow, sans-serif"
    fontSize: "2.15rem"
    fontWeight: 700
    lineHeight: 1
  score:
    fontFamily: "STAR Display, Heebo, Arial Narrow, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 0.95
    fontFeature: "tnum"
  title:
    fontFamily: "STAR Display, Heebo, Arial Narrow, sans-serif"
    fontSize: "1.95rem"
    fontWeight: 700
    lineHeight: 1
  section:
    fontFamily: "STAR Display, Heebo, Arial Narrow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
  status:
    fontFamily: "STAR Display, Heebo, Arial Narrow, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  body:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.4
  row-title:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  label:
    fontFamily: "Heebo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  chip: "8px"
  button: "12px"
  tile: "12px"
  card: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.row-title}"
    rounded: "{rounded.button}"
    height: "56px"
  button-on-dark:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "56px"
  button-ghost:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "48px"
  button-reward:
    backgroundColor: "{colors.reward-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.button}"
    height: "52px"
  coin-pill:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "40px"
  match-card:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "20px"
  list-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 20px"
  gear-tile:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.tile}"
    size: "88px"
  shop-tab:
    backgroundColor: "{colors.pitch-green}"
    textColor: "{colors.card}"
    rounded: "18px"
    size: "56px"
---

# Design System: STAR

## Overview

**Creative North Star: "The Matchday Programme"**

STAR reads like a printed matchday programme: cream paper, ink headlines in condensed capitals, one green for the club, and the next fixture set in a dark block you cannot miss. This world was chosen by the owner from his own reference screens (home and My Player) over a dark club-colour direction. It is calm and grown-up for a 14+ audience. The excitement comes from the content (the next match, your name, your gear), not from effects.

Hebrew and English are equal. The display face is two scripts under one family name, so headlines keep their condensed voice in both. Every layout mirrors with the reading direction.

**Key Characteristics:**
- Cream paper ground, white cards with hairline borders and 20px corners.
- One dark ink card per screen for what matters most: the next match, the score, an offer head, the decisive moment.
- Green is the accent: active tab, raised Shop button, owned gear, progress, your table row.
- Amber marks rewarded videos only, always with the camera mark.
- Condensed caps (Oswald + condensed Noto Sans Hebrew) for names, codes, titles and statuses; Heebo for everything read as a sentence.

## Colors

Paper and ink with one green, and amber held back for rewards.

### Primary
- **Pitch Green** (pitch-green): the active tab, the raised Shop button, owned-gear borders, progress bars, status lines, your league-table row (on its tint), the target-met verdict.

### Secondary
- **Reward Amber** (reward-amber): rewarded-video buttons only. A second video on the same view uses the amber outline.
- **Coin Gold** (coin-gold): the coin itself, a shaded gold disc in the coin pill and on prices.

### Neutral
- **Paper** is the ground; **Paper Band** is the darker band behind the My Player gear stage.
- **Card** is white cards, tiles and the nav bar; **Hairline** is every border and divider.
- **Ink** is text, the primary button and the dark match card. **Ink Muted** is secondary text (4.5:1 or better on paper).

### Named Rules
**The One Dark Card Rule.** Each screen has at most one dark ink block: the thing to look at first.

**The Amber Is Video Rule.** Amber means "watch a video for a reward". Nothing else is amber.

## Typography

**Display Font:** STAR Display: Oswald (Latin, digits) plus a condensed bold instance of Noto Sans Hebrew, split by unicode-range. Both faces declare the same weight range (200–900) so the browser keeps them in one family.
**Body Font:** Heebo (variable, Latin and Hebrew).

**Character:** Programme headlines over a neutral, legible grotesque.

### Hierarchy
- **Display** (700, 2.15rem): the player's name.
- **Score** (700, 3.5–3.6rem): club codes in the match card, match scores.
- **Title** (700, 1.95rem): tab screen titles (MY PLAYER, SEASON 2026/27).
- **Section** (700, 1.5rem): section titles (GEAR, RESULTS, TABLE).
- **Status** (600, 0.9rem, tracked 0.12em in Latin only): status lines under a name or in the match card.
- **Row title** (Heebo 600, 1rem) and **Body** (Heebo 400, 0.95rem).
- **Label** (Heebo 600, 0.75rem): chips, nav labels (12px).

### Named Rules
**The Status Trails Rule.** Status lines sit under a name or inside a card's foot, never as a label above a heading.

**The Untracked Hebrew Rule.** Hebrew is never letter-spaced.

## Layout

One 32rem column with a 20px gutter. Tab screens open with a big title and its status line, with the coin pill on the end side. Home: wordmark and coin pill, then the player row (avatar, name, meta, season status), the dark next-match card with a white Play button, the amber daily-chest video, and a white list. My Player: a full-bleed paper band with three gear tiles on each side of a large figure, the OVR block at his feet, then the Gear section with stats in two columns. The bottom nav spans the column and reserves 72px plus the safe area.

## Elevation & Depth

Flat paper with hairline borders. Two lifted elements carry a soft offset shadow: the raised Shop button (`0 8px 18px -8px rgb(11 107 58 / 0.6)`) and the toast (`0 16px 32px -14px rgb(17 20 24 / 0.55)`).

## Shapes

Generous, friendly corners: 20px cards, 12px buttons and tiles, 8px chips, pills for the coin pill and prices, a 56px rounded square (18px) for the Shop tab. The match card and offer heads carry a faint centre-circle ring behind the away side.

## Components

### Buttons
- **Primary:** ink with white Heebo 600 text, 12px corners, 56px (48px compact). On the dark card it inverts to white with ink text.
- **Ghost:** white with a strong hairline.
- **Reward:** amber with the camera mark; quiet variant is an amber outline.
- **Price:** white pill with the coin and the price; in My Player the price is a bare coin + number under the tile.

### Cards / Containers
White, 1px hairline, 20px corners, 12–20px inside. Lists use inset dividers.

### Navigation
White bar, five tabs. Idle tabs are ink-muted, the active tab is green. Store is a raised green rounded square with a white bag and a red new-item dot.

### Match Card (signature)
Dark ink card: both crests, three-letter club codes in display caps, full names under them, a status line (Next match · Home/Away · round), and the white Play button.

### Gear Tile (signature)
A white square holding the gear art; owned tiles take a 2px green border and a green "attribute +N" line; unowned art is greyed with its price under it.

## Do's and Don'ts

### Do:
- **Do** put the next match in the dark card with a white action.
- **Do** keep amber for rewarded videos, with the camera mark.
- **Do** show real game data only (home/away and the round; the game has no kickoff times).
- **Do** keep the owner's assets: the layered character art, gear images, club crests, the five-tab nav.

### Don't:
- **Don't** put a small caps label above a heading.
- **Don't** letter-space Hebrew or set display text in a face without Hebrew.
- **Don't** add a second dark block or a second solid amber button to a view.
- **Don't** paint screens in club colours; identity comes from crests and names.
