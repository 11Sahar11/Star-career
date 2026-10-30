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

THESIS: The owner's own reference (two screens: home and My Player, saved as .impeccable/review/reference-home.png and reference-myplayer.png) pinned as the world for every screen: "The Matchday Programme". Cream paper, ink condensed headlines, one green, the next match in a dark card. Replaces the dark club-colour "Signing" direction, which the owner compared and declined.

OWN-WORLD: Paper #f3f1ec, white cards (#ffffff) with #e2dfd7 hairlines and 20px corners, ink #111418 text and primary buttons, green #0b6b3a for active/owned/progress, amber #ffb020 only for rewarded videos (camera mark), coin as a shaded gold disc in a white pill. Display: Oswald + condensed Noto Sans Hebrew as one family (uppercase); body Heebo. One dark ink card per screen. Raised green Shop tab in the bottom nav.

STORY: Open the app, see yourself and the next match, tap Play; the amber video doubles the daily chest.

FIRST VIEWPORT: Home: STAR wordmark + coin pill; player row (avatar, name, position · club · OVR, season status under it); dark next-match card (crests, 3-letter codes, names, status Next match · Home/Away · round, white Play button); amber daily-chest video; white list (season goal, race, achievements, legacy, trophies); nav with raised Shop. My Player: title + club under it + coin pill; paper band with 3 white gear tiles per side of a large figure, OVR block at his feet; Gear section with stats in two columns.

Deliberate deviations from the reference: no small caps labels above headings (status lines trail instead; craft-floor ban); no invented kickoff day/time (the game has none); the amber video is the existing daily chest; language/sound moved to the home footer.

FORM: seed:9b5c18adbeea72fa (the session's printed roll). The form itself is owner-pinned: his reference screens replace the rolled candidate.

FINISH: independent review against the reference and this contract, then the sidecar is regenerated.
