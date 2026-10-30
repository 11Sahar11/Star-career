---
version: 1
slug: "src-components-game-gameapp-tsx"
primary_target: "src/components/game/GameApp.tsx"
related_targets: ["src/routes/login.tsx"]
---

# STAR game screens

Scope: every in-game screen (home, create, hub, training, key match, report, season review, summer, offers, my player, store, trophies, achievements, legacy, admin, retired, daily lobby) and /login. Mode: Experience on the hero bands (the player is inside the game), Operate density on data screens (tables, store, gear).

Audience and job: football fans 14+ on a phone, short sessions, Hebrew and English equal. Each screen ends in one clear next action. The daily race stays one tap from home. Kept from the owner's build: player character art, gear images, club crests, five-tab bottom nav. Code-led (no image generation in this session).

## Direction contract

THESIS: Your career is a run of official club announcements: each screen opens on the club's signing graphic for your player — a full-bleed club-colour field cut on a diagonal, the player large, the name in ultra-condensed caps. Refuses the incumbent neon-on-navy pills-and-glow game UI and the generic dark card list.

OWN-WORLD: Kit-black neutral ground (#0e0e10, never blue-black), hairline panels one step up, 4px corners, no glows, no gradients except the club field's single shade. The player's current club colour is the dominant field of every hero band, its secondary a stripe; text on the field takes the computed club ink. Display: Anton for Latin and digits, Karantina for Hebrew, uppercase, tight. Body: Rubik. Primary button: solid white, black ink, condensed caps. Gold only for coins and rewards. Signature: the 8-degree diagonal cut and a giant outline shirt number behind the player.

STORY: The player opens the app and sees himself as the club's signing, taps one white CONTINUE. A transfer repaints the whole game in the new club's colours: the reward is visible everywhere.

FIRST VIEWPORT: Home with a career: black top bar (STAR wordmark, language, sound); hero band ~300px in club colour with a diagonal bottom edge: giant outline shirt number behind, character on the start side, name 56px condensed caps, position and club, OVR in a black block; season strip (matchday, place, target); full-width white CONTINUE; daily race row with countdown; menu list; bottom nav.

FORM: My top grounded candidate (club signing-announcement graphics), chosen by the owner over the assigned stadium-LED-board direction after a degraded roll (no challengers). seed:9b5c18adbeea72fa

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
