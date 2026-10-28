---
version: 1
slug: "src-components-game-gameapp-tsx"
primary_target: "src/components/game/GameApp.tsx"
related_targets: ["src/routes/login.tsx"]
---

# STAR game screens

Scope: every in-game screen (home, create, hub, training, live match, report, season review, summer, offers, trophies, legacy, admin, retired, daily lobby) and /login. Mode: Operate (the player runs a career; scanability first).

Audience and job: football fans of all ages on a phone, short sessions, Hebrew and English equal. Each screen ends in one clear next action. The daily race stays one tap from the menu.

Owner chose the category standard, played straight, at Football Manager Mobile's craft level. Code-led (no image generation in this session).

## Direction contract

THESIS: A career run like a football manager runs a club: clean dark lists, data you can read at a glance, one green Continue. Refuses the FIFA card-and-glow look and the neon esports look.

OWN-WORLD: Charcoal-slate ground, flat panels separated by hairlines, 6px corners, no gradients or glows. One action green for Continue/primary. Attribute numbers coloured by band like FM (grey, amber, light green, green). Ability and potential shown as stars. Rubik for Hebrew and Latin, tabular numerals.

STORY: The player sees who they are (profile header with rating stars), where the season stands (fixtures, form, table), and taps Continue. Offers read like contract lines to compare, not ads.

FIRST VIEWPORT: Home: top bar with STAR wordmark and settings; profile header (name, position, club, age, ability/potential stars, overall); season status row; full-width green Continue; daily race row; menu list (trophies, season, legacy).

FORM: Category standard (canon) chosen by the owner after a degraded roll; FM Mobile is the bar. seed:db4e76e44f514597

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
