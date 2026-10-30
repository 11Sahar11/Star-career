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

OWN-WORLD: Kit-black neutral ground (#0e0e10, never blue-black), hairline panels one step up, 4px corners, no glows, no gradients except the club field's single shade. The player's current club colour is the dominant field of every hero band, its secondary a stripe; text on the field takes the computed club ink. Display: Anton for Latin and digits, Karantina for Hebrew, uppercase, tight. Body: Rubik. Primary button: solid white, black ink, condensed caps, at most one per view. Gold only for coins and rewards, at most one solid gold clip per view (a second clip is a gold outline). Signing for a club is done in that club's colours. Signature: the 8-degree diagonal cut (tan 8° × the band's own width, via container units) and a giant outline shirt number behind the player.

STORY: The player opens the app and sees himself as the club's signing, taps one white CONTINUE. A transfer repaints the whole game in the new club's colours: the reward is visible everywhere.

FIRST VIEWPORT: Home with a career: black top bar (STAR wordmark, language, sound); hero band ~320px in club colour with a diagonal bottom edge: crest, name 56px condensed caps, then club, league and the player line under the name (no label above it), OVR in a black block, all on the start side; the character large on the end side, cropped by the cut, with the giant outline shirt number behind him; season strip (matchday, board target, league place); full-width white CONTINUE; daily race row with countdown; menu as a hairline ledger in condensed caps; bottom nav. Amended from "character on the start side": the name keeps the start side so it begins at the reading edge in Hebrew and in Latin scripts, and the cut falls toward the end side, so the character there is the part the cut crops. The hub opens on the same full hero.

FORM: My top grounded candidate (club signing-announcement graphics), chosen by the owner over the assigned stadium-LED-board direction after a degraded roll (no challengers). seed:9b5c18adbeea72fa

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
