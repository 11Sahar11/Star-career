---
name: STAR
description: A football career told as a run of club signing announcements. Your club's colours on kit black, the player large, the name in condensed caps, one white action.
colors:
  kit-black: "#0e0e10"
  kit-black-deep: "#09090a"
  panel: "#17171a"
  panel-raised: "#212125"
  hairline: "#2c2c31"
  outline: "#3d3d44"
  chalk: "#f4f4f5"
  fog: "#a3a3ab"
  dim: "#6c6c75"
  nav-idle: "#8b8b94"
  paper-white: "#ffffff"
  club-field: "#ff5a1f"
  club-stripe: "#ffffff"
  club-ink: "#0e0e10"
  club-text: "#ff6a2b"
  coin-gold: "#f5c542"
  coin-gold-light: "#ffdf85"
  coin-gold-deep: "#c89a1c"
  on-gold: "#1c1400"
  good: "#36d27b"
  bad: "#ff4f5e"
  bad-text: "#ff8a93"
  tier-bronze: "#c98a52"
  tier-silver: "#cfd5dc"
  tier-gold: "#f5c542"
  band-low: "#8f8f99"
  band-mid: "#e4e4e7"
  band-good: "#b9e46a"
  band-high: "#36d27b"
  band-elite: "#4fd6e8"
  gear-plate: "#e4e4e7"
typography:
  display:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 13vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0.005em"
  score:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "4rem"
    fontWeight: 400
    lineHeight: 0.9
    fontFeature: "tnum"
  headline:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 0.95
  title:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  button:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  figure:
    fontFamily: "STAR Display, Rubik, Arial Narrow, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: "Rubik, Segoe UI, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.15
rounded:
  hairline: "2px"
  sm: "3px"
  md: "4px"
  round: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.kit-black}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "48px"
  button-primary-hover:
    backgroundColor: "#e7e7ea"
  button-primary-active:
    backgroundColor: "#d4d4d8"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.panel-raised}"
  button-price:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.figure}"
    rounded: "{rounded.md}"
    height: "48px"
  button-club:
    backgroundColor: "{colors.club-field}"
    textColor: "{colors.club-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "48px"
  button-rewarded:
    backgroundColor: "{colors.coin-gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.md}"
    height: "48px"
  button-rewarded-hover:
    backgroundColor: "{colors.coin-gold-light}"
  button-rewarded-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.coin-gold}"
    rounded: "{rounded.md}"
    height: "48px"
  chip:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.fog}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "2px 7px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px"
  hero-band:
    backgroundColor: "{colors.club-field}"
    textColor: "{colors.club-ink}"
    typography: "{typography.display}"
    padding: "16px"
  ovr-block:
    backgroundColor: "{colors.kit-black}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  bottom-nav:
    backgroundColor: "{colors.kit-black-deep}"
    textColor: "{colors.nav-idle}"
    typography: "{typography.caption}"
    height: "66px"
  gear-well:
    backgroundColor: "{colors.gear-plate}"
    rounded: "{rounded.sm}"
    size: "48px"
---

# Design System: STAR

## Overview

**Creative North Star: "The Signing"**

Every screen is an official club announcement about you. Clubs post a graphic when they sign a player: a full-bleed field in the club colour, cut on a diagonal, the player large, the name in ultra-condensed capitals, the shirt number huge behind him. STAR wears that graphic as its interface. Your current club's colours paint the hero of home and the hub, the league table row, a goal in the match feed and the key moment. A transfer repaints the whole game in the new club's colours, so the reward of moving up is visible everywhere. Other clubs appear in their own colours too: an offer arrives as that club's announcement, and you sign in its colours.

Around those fields sits kit black: a neutral near-black (never blue-black) with hairline panels one step up, small square corners and no glow. It reads like a club's matchday graphics or a broadcast lower third, not a toy, which is the point for a 14+ audience. The system was chosen to replace a neon-on-navy look with glossy pill buttons that read as made for young children. Hebrew and English are equal first languages: the display face is two scripts under one family name, and every composition mirrors cleanly in RTL.

Density follows the screen's job. The hero bands are pure announcement (Experience); tables, the store and gear are compact Operate surfaces with hairline rows and tabular numerals. Each screen ends in one clear next action, in white.

**Key Characteristics:**
- The player's club colour is the only large field of colour on a screen; everything else is kit black.
- Hero bands are cut at 8° (tan 8° × the band's own width), with the club's second colour as a 6px stripe along the cut.
- Display text is ultra-condensed caps (Anton for Latin and digits, Karantina for Hebrew); sentences are Rubik.
- One solid white action per view. Gold means coins and rewards, never decoration.
- Flat: 4px corners, hairlines, one surface step for depth. No glows, no gradients, no pills.

## Colors

A neutral kit-black ground carrying one runtime club colour, with gold held back for money.

### Primary
- **Club Field** (`club-field`, the STAR orange default): the player's current club colour, set at runtime as `--club` on the root element from the club's crest palette, so this hex is the default before a career exists. It fills hero bands, the player's league-table row, goal events, the key-moment head, the season verdict when the target is met, and the My Player stage.
- **Club Stripe** (`club-stripe`, white by default): the club's second colour (`--club-2`), shown as a 6px edge along every cut and under the verdict band. It is resolved to be visible: the first of the club's second colour, trim, ink or white that differs from the field and reaches 1.5:1 against kit black.
- **Club Ink** (`club-ink`): text and marks on the field (`--club-ink`), white or near-black, whichever contrasts more with the field.
- **Club Text** (`club-text`): the club colour as text on kit black (`--club-text`): links, the active-tab bar, progress fills, the goal strip. It is the field lifted in OKLCH (same hue, as much chroma as sRGB allows) until it reaches 4.5:1 against kit black.

### Secondary
- **Coin Gold** (`coin-gold`, light `coin-gold-light`, deep `coin-gold-deep`, ink `on-gold`): coins, prices and rewarded clips only: the coin mark, coin chips, the store-tab dot, the solid rewarded button, the gold outline of a quiet clip, and the toast that announces a reward.

### Tertiary
- **Result Green / Result Red** (`good`, `bad`, `bad-text` for red text on dark): wins, on-track targets, gains; losses, injuries, missed targets. Red on the dark ground is set in the lighter `bad-text` for 4.5:1.
- **Gear Tiers** (`tier-bronze`, `tier-silver`, `tier-gold`): the 3px top edge of a gear slot and its tier label. They mark tiers only.
- **Rating Ramp** (`band-low` grey, `band-mid` white, `band-good` lime, `band-high` green, `band-elite` cyan): attribute values and bars, weak to elite. The ramp never uses coin gold.

### Neutral
- **Kit Black** (`kit-black`): the ground of every screen, the OVR block, the offer chip.
- **Kit Black Deep** (`kit-black-deep`): the bottom navigation bar.
- **Panel** (`panel`) and **Panel Raised** (`panel-raised`): cards and lists; chips, rate tiles, pressed rows and hover.
- **Hairline** (`hairline`): every divider and card border. **Outline** (`outline`): the 1px border of ghost and price buttons.
- **Chalk** (`chalk`): primary text. **Fog** (`fog`): secondary text. **Dim** (`dim`): disabled and large de-emphasised numerals only, never 11px text. **Nav Idle** (`nav-idle`): inactive tab labels (5.6:1 on the bar).
- **Paper White** (`paper-white`): the primary button and the selected segment. **Gear Plate** (`gear-plate`): the light well behind the owner's dark gear art.

### Named Rules
**The Club Field Rule.** The player's club colour is the only large field of colour on a screen. Another club appears in its own colours only inside its own announcement (an offer, a trial, the far half of a score box).

**The Gold Is Money Rule.** Gold marks coins and rewarded clips. Stars, ratings, trophies on display and decoration never use coin gold.

**The Lift, Don't Wash Rule.** Club colour used as text is lifted in OKLCH at the same hue; mixing it with white turns dark reds salmon and is not allowed.

## Typography

**Display Font:** STAR Display, a single family name over two self-hosted OFL faces split by `unicode-range`: Anton for Latin, digits and punctuation; Karantina Bold for Hebrew. Falls back to Rubik.
**Body Font:** Rubik (variable, 300–900, self-hosted), with Segoe UI and system-ui as fallbacks.

**Character:** Ultra-condensed poster capitals, the lettering of club announcements and kit numbers, against a round, friendly grotesque for everything people read in sentences. Both scripts share one display voice, so Hebrew is never a fallback.

### Hierarchy
- **Display** (400, clamp(2.6rem, 13vw, 3.6rem), 0.88, uppercase): the player's name in the hero; the first name sits above at 0.62em.
- **Score** (400, 4rem, 0.9, tabular): match scores. The OVR block numeral (2.6rem) and the season verdict band (2.4rem) sit between Score and Headline.
- **Headline** (400, 1.75rem, 0.95, uppercase): an offer or trial club's name in its announcement head.
- **Title** (400, 1.3–1.45rem, 1, uppercase): section titles (1.35rem), the top-bar title (1.45rem) and home ledger labels (1.3rem).
- **Button** (400, 1.3rem, 1, uppercase, 0.02em): primary and club buttons.
- **Figure** (400, 1.2–1.6rem, 1, tabular): attribute values, season stat values, prices on price buttons.
- **Body** (Rubik 400, 0.875rem, 1.45): sentences, notes, offer copy; 0.95rem for the intro paragraph on home.
- **Label** (Rubik 600–700, 0.75rem): chips, data labels, meta lines (the hero meta is 0.875rem, 800 for the club name).
- **Caption** (Rubik 600, 0.6875rem = 11px): tab labels, the OVR caption, gear-slot status lines. This is the floor.

### Named Rules
**The Two-Script Display Rule.** Display text is always STAR Display. Never set display text in a face that has no Hebrew, and never letter-space Hebrew.

**The Caps for Names Rule.** Condensed caps carry names, numbers, scores and actions. Anything read as a sentence is Rubik in sentence case.

**The 11px Floor.** No functional text below 11px (0.6875rem).

## Layout

One column, 32rem (512px) wide, centred, with a 16px gutter (`max(1rem, safe-area)` on notched phones). The bottom navigation spans the same column at every width and gains hairline sides once the viewport is wider than the column. Hero bands bleed to the column edges with a -1rem margin under the top bar. Screens reserve 66px plus the safe area plus 16px at the bottom for the fixed nav.

Rhythm: 4/8/12/16/24px. Cards use 12–16px inside, sections are separated by 12px (16–24px before a section title), and rows in lists and tables are hairline-divided at a 48–60px minimum height so every row is a tap target. Interactive targets are at least 48px tall (44px for the compact gear-slot buttons and look chips).

The hero composition is fixed in logical terms so it mirrors with the language: the name block (crest, name, club, league, player line, OVR) holds the start side at up to 60% of the band; the player stands on the end side at 64% of the band width, offset 13% past the edge, top-anchored and cropped by the cut at about mid-thigh; the outline shirt number stands behind him, offset toward the name so its shape reads past his shoulder.

## Elevation & Depth

Flat by construction. Depth is one tonal step (kit black → panel → panel raised) plus a hairline border; nothing lifts at rest. The only drop shadow belongs to the toast, which floats above content (`0 12px 28px -12px rgb(0 0 0 / 0.8)`). Two zero-blur rings separate a small mark from what is under it: the 2px ring around the store dot and the 3px ring on a selected swatch. The loading screen carries the only gradient, a scrim that keeps type legible over the boot art.

### Named Rules
**The Flat Kit Rule.** No glows, no coloured halos, no gradients on surfaces. If something needs emphasis, it takes the club field, the white action or gold, not light effects.

## Shapes

Small, square corners: 4px on cards, panels, buttons and inputs; 3px on the OVR block, gear wells and segment buttons; 2px on chips, rate tiles and result marks. Circles (999px) are reserved for marks that are round by nature: the coin, status dots and colour swatches.

The signature shape is the cut. Hero bands and offer heads end in a straight diagonal whose drop is the band's own width × tan 8° (`--cut: 14.054cqw`; bands are inline-size query containers, so the angle holds at 360px, 390px and in the 512px column). The cut falls toward the end side, under the player, so the name keeps the full depth of the field. A 6px stripe in the club's second colour runs along the cut. The My Player stage repeats the diagonal at its foot.

### Named Rules
**The 8° Rule.** Every announcement edge is cut at 8°, measured from its own width, and mirrors with the reading direction. A fixed pixel drop is not allowed: it flattens on wide bands.

**The No-Pill Rule.** Buttons, chips and cards are square-cornered. A pill-shaped control does not belong to this world.

## Components

### Buttons
Decisive and graphic: condensed caps on flat fills.
- **Shape:** square-cornered (4px), 48px tall; the home CONTINUE is 56px.
- **Primary:** paper white with kit-black condensed caps (1.3rem). Hover #e7e7ea, active #d4d4d8 with a 0.985 press scale (no scale under reduced motion). Disabled turns panel-raised with fog text. One per view.
- **Ghost:** transparent with a 1px outline (#3d3d44) and chalk Rubik 600; hover fills panel raised. Secondary actions, navigation links, choices, "open" and "pause".
- **Price:** the ghost shape carrying a CSS-drawn gold coin (0.72em disc, deep-gold rim) and the price in display numerals; a discounted price shows the old price struck in fog. Hover tints the outline gold. Every coin purchase uses it.
- **Club:** the signing club's field and ink, condensed caps, a 1px border mixed from its ink. Signing, staying or going to a trial. Hover brightens slightly.
- **Rewarded:** solid coin gold with on-gold Rubik 700, the only solid gold control. **Rewarded quiet:** transparent, 1px gold outline at 70%, gold text. The second clip on a view, and attribute picks after a clip was chosen.

### Chips
- **Style:** panel-raised fill, fog text, Rubik 700 at 0.72rem, 2px corners, 2px × 7px padding.
- **State:** tinted variants at 16% for gold (coins, legend tag), good and bad; the coin chip carries the coin mark. The offer chip (role or trial chance) is kit black with chalk text on the club field.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** panel; panel raised for nested emphasis and hover.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 12–16px. Lists and tables are cards whose rows divide with hairlines; the player's own table row takes the club field.

### Inputs / Fields
- **Style:** panel fill, 1px hairline, 4px corners, 48px tall, 16px inline padding, chalk text; the caret is club text.
- **Focus:** a 2px chalk outline at 2px offset, shared by every focusable control.
- **Choice tiles:** the input's shape as a button; selected takes a club-text border on panel raised.

### Navigation
- **Top bar:** sticky, kit black with a hairline bottom edge; back button (48px), a one-line title in display caps (1.45rem) and at most one control on the end side.
- **Bottom nav:** five tabs (Home, My Player, Store, Season, Trophies) on kit black deep, 66px plus safe area, the 32rem column wide. Icons are 22px masks painted in currentColor; labels are 11px Rubik 600. Idle tabs are nav idle; the active tab is chalk with a 3px club-text bar on its top edge. The store tab is gold only when active; otherwise only its new-item dot is gold.
- **Segments:** a panel strip of 48px buttons; the pressed one is paper white with kit-black text.

### Signing Hero (signature)
The announcement band at the top of home, the hub and the season summary. Club field, minimum 20rem tall, cut at 8° with the stripe. On the start side: the crest (44px), the first name over the last name in display caps, then the club (Rubik 800), the league and the player line (position · #number · age) in the ink at 86%, then the OVR block (kit black, display numeral, "OVR" caption). On the end side: the player, large and cropped by the cut, with the shirt number in 17rem outline (2px stroke of the ink at 40%) behind him. No label sits above the name.

### Offer Announcement
An offer or a big-club trial is the other club's own graphic: its field and ink on the head, cut at 8°, crest and club name (headline), league and country on the meta line, the role or chance in a kit-black chip. The body is a hairline terms table and a club-colour sign button. A rewarded boost sits below that button, never above it.

### Verdict Band
The season review opens with a full-bleed band in display caps (2.4rem): the club field over its stripe when the board target is met, a dark band in red text when it is missed.

### Ledger
The home menu is a hairline ledger, not a card list: transparent, hairlines top and bottom, labels in display caps (1.3rem), bare 24px icons in dim with no tiles, the count or status trailing on the end side.

## Do's and Don'ts

### Do:
- **Do** paint large fields only in the player's club colour (`--club`), with `--club-ink` on top and `--club-2` as the 6px stripe.
- **Do** cut announcement edges at tan 8° × their own width (`--cut: 14.054cqw` inside an inline-size container), falling toward the end side.
- **Do** give each view exactly one paper-white action; make every other action ghost, price, club or rewarded.
- **Do** place a rewarded clip after the action it relates to, with at most one solid gold per view; any further clip is the quiet gold outline.
- **Do** price everything bought with coins on the price button, with the CSS coin mark and display numerals.
- **Do** isolate Latin names inside Hebrew lines with `<bdi>`, and join hyphenated club names (hyphen + U+2060) so they wrap between words.
- **Do** keep the owner's assets as they are: the layered character art, gear images on the light gear plate, procedural club crests and the five-tab bottom nav.

### Don't:
- **Don't** put a kicker or eyebrow label above a heading. Fold it into the heading or a trailing status.
- **Don't** use coin gold for stars, ratings, tiers on display or decoration.
- **Don't** use pill-shaped buttons, glows, coloured halos, glossy fills or surface gradients.
- **Don't** use blue-black grounds; the ground is the neutral `kit-black` (#0e0e10).
- **Don't** set display text in a face without Hebrew glyphs, or letter-space Hebrew.
- **Don't** go below 11px for functional text, or use `dim` for text at that size.
- **Don't** let the bottom nav or any bar span wider than the 32rem column.
