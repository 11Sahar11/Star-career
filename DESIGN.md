---
name: STAR
description: A one-player football career, run like a manager runs a club — dark lists, readable data, one green Continue.
colors:
  pitch-night: "#14171c"
  slate-panel: "#1d2229"
  slate-raised: "#262c35"
  hairline: "#303844"
  chalk: "#eef1f5"
  fog: "#9aa4b2"
  dim-slate: "#6c7684"
  continue-green: "#2fb463"
  continue-green-light: "#6edc97"
  continue-green-deep: "#23904e"
  green-ink: "#06160c"
  good: "#5cd68f"
  bad: "#f06363"
  trophy-gold: "#e5b84a"
  band-low: "#8f99a7"
  band-mid: "#e5b84a"
  band-good: "#b5d86b"
  band-high: "#5cd68f"
  band-elite: "#3fd0c9"
typography:
  display:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 700
    lineHeight: 1.25
  score:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  figure:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
  title:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.25
  title-row:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
rounded:
  bar: "2px"
  chip: "4px"
  control: "6px"
  container: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  row-y: "9.6px"
  row-x: "14.4px"
components:
  button-primary:
    backgroundColor: "{colors.continue-green}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.control}"
    typography: "{typography.title-row}"
    height: "52px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.continue-green-light}"
  button-primary-active:
    backgroundColor: "{colors.continue-green-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.slate-raised}"
  button-danger:
    backgroundColor: "{colors.bad}"
    textColor: "#1c0505"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.slate-panel}"
    rounded: "{rounded.container}"
  list-row:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.chalk}"
    padding: "9.6px 14.4px"
    height: "56px"
  list-row-hover:
    backgroundColor: "{colors.slate-raised}"
  input:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.slate-raised}"
    textColor: "{colors.fog}"
    rounded: "{rounded.chip}"
    typography: "{typography.label}"
    padding: "2.4px 8px"
  chip-accent:
    backgroundColor: "{colors.continue-green}"
    textColor: "{colors.green-ink}"
  ovr-badge:
    backgroundColor: "{colors.slate-raised}"
    rounded: "{rounded.control}"
    size: "52px"
  segmented-option:
    textColor: "{colors.fog}"
    rounded: "{rounded.chip}"
    height: "44px"
  segmented-option-on:
    backgroundColor: "{colors.slate-raised}"
    textColor: "{colors.chalk}"
  topbar:
    backgroundColor: "{colors.pitch-night}"
    height: "56px"
---

# Design System: STAR

## Overview

**Creative North Star: "The Manager's Clipboard"**

STAR is the football-manager standard played straight, at Football Manager Mobile's craft level. The whole career is read off a dark clipboard: a charcoal-slate ground, flat panels split by hairlines, rows of data that can be scanned in a glance on a phone held in one hand. Nothing glows and nothing is gradient-filled; hierarchy comes from tone steps, weight, and a single action colour.

Density is that of a good sports app: 56px list rows, 14px body text, 12px labels, tabular numerals everywhere a number appears. Every screen resolves into one full-width green Continue (or its equivalent primary action) at the bottom of the flow or in the sticky dock. Hebrew and English are equal citizens: every layout uses logical properties (start/end, inline borders) and directional icons mirror under RTL, while numbers, scores and the wordmark are isolated left-to-right.

The world explicitly refuses the FIFA / Ultimate Team card-and-glow look and the neon esports look.

**Key Characteristics:**
- Charcoal-slate ground with three tonal steps and a 1px hairline; no shadows, no gradients.
- One action green, reserved for the primary action, the player's own table row, and goal moments.
- Attribute and rating numbers coloured by band, FM style (grey, amber, light green, green, teal).
- Ability and potential as five gold stars in halves.
- Rubik for Hebrew and Latin alike, tabular numerals for all data.
- RTL and LTR mirrored through logical properties, numbers always isolated LTR.

## Colors

A cool, low-chroma slate scale (hue ~258) carries everything; saturated colour appears only as signal.

### Primary
- **Continue Green** (`continue-green`): the one action colour. Fills the primary button, the accent chip, attribute preview bars, meters, and tints (14%) the player's own league-table row and goal events in the match feed.
- **Continue Green Light** (`continue-green-light`): hover state of the primary button, focus rings, caret, and accent text on dark (player's row text, goal minute, highlight figures).
- **Continue Green Deep** (`continue-green-deep`): pressed state of the primary button only.
- **Green Ink** (`green-ink`): text and icons on green fills (6.9:1 on Continue Green).

### Secondary
- **Trophy Gold** (`trophy-gold`): stars, trophies, legacy points, the daily-race icon, and the trophy chip. It is the reward colour, never an action colour.

### Tertiary
- **Good / Bad** (`good`, `bad`): outcome signals only — wins, form "hot/cold", attribute gains and losses, the live dot and live tag, error text and the destructive button. Tinted backgrounds use 15–20% mixes; red text on red tints lifts to `#ff8a8a` for legibility.
- **Attribute bands** (`band-low` → `band-elite`): grey, amber, light green, green, teal. Applied to attribute values, the overall badge and match ratings by threshold.

### Neutral
- **Pitch Night** (`pitch-night`): page ground, top bar and bottom dock.
- **Slate Panel** (`slate-panel`): cards, lists, inputs, score box, offers.
- **Slate Raised** (`slate-raised`): hover rows, selected segments and choices, chips, badges, empty bar tracks.
- **Hairline** (`hairline`): every border and divider; inner dividers mix it to 60–70%.
- **Chalk** (`chalk`): primary text (15.9:1 on ground).
- **Fog** (`fog`): secondary text, labels, `dt` terms (6.3:1 on panel).
- **Dim Slate** (`dim-slate`): tertiary, past or missing values only (out-of-squad rate, the "before" overall); never body copy.

### Named Rules
**The One Green Rule.** Continue Green is the only action colour. If something is green-filled it is the primary action on that screen, or it is the player themself. One green fill per screen.

**The Signal-Only Rule.** Gold, good-green, red and the band colours mean something (reward, outcome, rating). They never decorate.

## Typography

**Display Font:** Rubik (with Segoe UI, system-ui)
**Body Font:** Rubik
**Label/Mono Font:** Rubik with `tabular-nums`

**Character:** One rounded-geometric family that sets Hebrew and Latin with the same voice; weight (400/500/600/700) does all the ranking.

### Hierarchy
- **Display** (700, 1.7rem, 1.25): the home title for a new player; one per screen at most.
- **Score** (700, 2.75rem, 1, tabular): the match score in the score box.
- **Figure** (600–700, 1.5–2.25rem, tabular): headline numbers — overall on report and create, legacy points, match rating.
- **Title** (700, 1.05rem, 1.25): the top-bar screen title; 1.125rem bold for the player name in the profile header.
- **Row title** (600, 1rem): list-row labels, section headings (`h2` at 1rem/600 or 0.875rem/600 above a table).
- **Body** (400, 0.875rem, 1.45): rows, events, terms, attributes; 0.95rem / 1.5rem leading for the one intro paragraph.
- **Label** (600, 0.75rem; chips at 0.72rem): row sublines, stat terms, chips, the segmented control text. Sentence case, no letter-spacing.

### Named Rules
**The Tabular Rule.** Every number that can change — ratings, scores, minutes, money, counts — is set in tabular numerals and isolated left-to-right, so columns align and RTL never reorders digits.

**The Weight-Not-Case Rule.** Hierarchy is made with weight and size. No uppercase labels, no tracked small caps, no small coloured label stacked above a heading.

## Layout

A single phone column: max width 32rem, centred, 16px side gutters and 20px top/bottom. The top bar is sticky at the safe-area top (56px, ground-coloured, hairline below); when a screen has a primary action that must stay reachable, a sticky bottom dock (ground-coloured, hairline above, safe-area padded) holds it.

Vertical rhythm runs on 4px steps: 12px between related blocks, 16px between sections, 20px before a section heading or the final primary button. Rows pad 9.6px × 14.4px; attribute and term rows are tighter (8px × 16px, 7.2px vertical). Data is laid out as two-column attribute grids, four-column stat rows, and fixed-column league-table rows (position, team, played, points). Touch targets are 44px minimum; primary buttons 52px, secondary 48px.

## Elevation & Depth

Flat by construction. There are no box-shadows anywhere in the system; depth is tonal — ground, panel, raised — with a 1px hairline wherever two surfaces meet. Sticky bars separate from content with a hairline, not a shadow.

### Named Rules
**The Hairline Rule.** Surfaces separate by a 1px hairline and a tone step, never by a shadow, blur or glow.

## Shapes

Quietly squared. Containers (cards, lists, score box, offers, stat rows) use 8px corners; controls (buttons, inputs, choice tiles, icon wells, overall badge, segmented track) use 6px; chips, form squares, rate pills and segment options use 4px; progress bars 2px. Only the live dot is round. Lists clip their rows so dividers meet the container border cleanly. Dashed hairlines are reserved for two meanings: the gap in a truncated league table and the ad slot.

## Components

### Buttons
Confident and plain: solid fill, no icon-only primaries, 120ms colour transition.
- **Shape:** gently squared (6px).
- **Primary:** Continue Green fill, Green Ink text, 600 weight, full width, 52px tall on flow-ending actions (48px / 40–44px when inline in a row).
- **Hover / Focus:** hover lifts to Continue Green Light, press drops to Continue Green Deep; focus is a 2px Continue Green Light outline offset 2px. Disabled is 45% opacity.
- **Ghost:** transparent with a hairline border, Chalk text, 500 weight; hover fills Slate Raised. Used for the secondary choice next to a primary (stay at club, sign out, Google sign-in).
- **Danger:** Bad fill with near-black red text; destructive confirmations only.

### Chips
- **Style:** 4px corners, 0.72rem/600, Slate Raised with Fog text by default.
- **State:** tinted variants for trophy (gold 16%), good (15%) and bad (16%); the accent chip is solid green for the player's own status (e.g. admin).

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** Slate Panel.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px horizontal, 12–20px vertical; inner sections split by full-bleed hairlines.

### Inputs / Fields
- **Style:** 48px tall, Slate Panel, 1px Hairline, 6px corners, 16px side padding, 1rem text; label above in 0.875rem/600.
- **Focus:** 2px Continue Green Light outline, caret in the same colour.
- **Error / Disabled:** error text in Bad below the form (`role="alert"`).

### Choice Tiles
Selectable country, nation, position and difficulty options: 6px Slate Panel tiles with a hairline; the selected tile takes a Continue Green border on Slate Raised.

### Navigation
- **Top bar:** back chevron (44px, mirrors in RTL) at start, title + one-line subline, optional actions at end.
- **Menu list:** the home menu is a list of 56px rows — 32px icon well, title with optional subline, value or chevron at end.
- **Segmented control:** Slate Panel track with 2px inset, 44px options; the pressed option fills Slate Raised with Chalk text. The language switch is the same pattern, compact.

### Player Header (signature)
The profile card: overall badge (52px, 6px corners, number coloured by band), name/position/club/age, a two-cell ability/potential row of five gold half-stars, and a two-column attribute grid with band-coloured values. It is the "who am I" of every hub screen.

### League Table and Results (signature)
Fixed-column rows split by 70% hairlines; the player's club row is tinted green 14% with Continue Green Light 600 text. Result rows lead with a 24px W/D/L square (good tint, raised neutral, solid dark red). The four-cell stat row (8px container, inline hairline dividers) replaces any tile grid for season totals.

### Match Feed (signature)
Score box (8px panel) with the 2.75rem score; events as hairline-split rows with a tabular minute column. Goals tint green 14% and bold; a new event flashes a faint chalk wash for 260ms. The live dot pulses at 1.4s; both animations stop under reduced motion.

### Offer Card
Plain 8px panel with a terms list (`dt` in Fog, `dd` 600) between hairlines, read like contract lines to compare. The offer to move is the primary button; staying is ghost.

## Do's and Don'ts

### Do:
- **Do** end every screen with one full-width Continue Green primary action (52px), in the sticky dock when the content scrolls.
- **Do** separate every surface with a 1px Hairline and a tone step (ground, panel, raised).
- **Do** colour attribute values, the overall badge and match ratings by band, and show ability/potential as five gold half-stars.
- **Do** set every changing number in tabular numerals, isolated left-to-right.
- **Do** use logical properties (start/end, inline borders) and mirror directional icons under RTL so Hebrew and English get identical layouts.
- **Do** keep touch targets at 44px minimum.

### Don't:
- **Don't** use gradients, glows, box-shadows or blur; this is not the FIFA card look or a neon esports look.
- **Don't** fill anything green that is not the primary action or the player themself.
- **Don't** use gold, good-green, red or band colours as decoration.
- **Don't** put a small coloured or uppercase label above a heading or title; rank with weight and size.
- **Don't** use Dim Slate for readable copy; it is for past or missing values only.
- **Don't** use dashed borders except for the league-table gap and the ad slot.
