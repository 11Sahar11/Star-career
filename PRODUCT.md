# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Football fans aged 14 and up (owner, 2026-10-30: "not for 5-year-olds, made for 14+"), playing on a phone in short sessions. They want the feeling of a whole football career without managing a squad: pick a country at 16, grow one player, move clubs, chase trophies.

## Product Purpose
STAR is a single-player football career game. One player, one career: train, play through simulated seasons, take contract offers, retire. Success is a player who comes back every day, mainly for the daily race, and starts a new career after the last one ends.

## Positioning
The daily race: every player starts the same day from the same position, club and attributes, and races to the Golden Star Award in the fewest seasons. The result is comparable and shareable between friends. The main career mode and the legacy system feed the habit; the daily race is the reason to open the game today.

## Operating Context
- Phone browser or an installed web app (planned Google Play release as a Trusted Web Activity).
- One-handed play in short sessions; a season runs in minutes, matches auto-simulate with optional live viewing.
- Four languages: Hebrew (right-to-left), English, Spanish, French. Hebrew is a first-class language, not a translation afterthought.
- Career saves on the device (localStorage). Accounts are optional.
- Ad-funded: a menu banner, a skippable break after a season, and optional rewarded clips. No ad during a match, no clips in the daily race.

## Capabilities and Constraints
- 8 countries, 24 leagues; club, league, competition and award names are fictional (switched before the store release).
- Economy: coins per career, a store, gear (6 slots, bronze/silver/gold) on a My Player screen, rewarded ads with caps.
- Stack: TanStack Start + React + Tailwind v4, deployed through Grok App Builder to Vercel; Better Auth for optional accounts. Owner admin tools are gated server-side to a verified owner email.
- Engine in `src/game/engine.ts`; UI in `src/components/game/GameApp.tsx`; strings in `src/game/i18n.ts`.
- Key matches open live with decisive moments; the rest auto-simulate.

## Brand Commitments
- The name STAR stays.
- Kept from the owner's build (2026-10-30): the layered player character art, the gear images, the procedural club crests, and the five-tab bottom navigation.
- Visual world: the owner asked for a full redesign (2026-10-30) that reads as made for 14+, not for small children, and gave a free hand on everything else. The earlier Football Manager standard and the "Night Stadium" look are both superseded.

## Evidence on Hand
No players, reviews, metrics or press yet. Do not invent player counts, ratings or testimonials.

## Product Principles
1. The daily race is the front door: one tap from opening the game to today's race and to sharing a result.
2. Sessions are short and complete: every screen should end in a clear next action.
3. Hebrew and English are equal: layouts work right-to-left and left-to-right without compromise.
4. Fair to the player: ads never interrupt a match, the daily race stays a level start, and nothing pressures a teenage player.

## Accessibility & Inclusion
Audience is 14+ (teens included): no pressure mechanics, no loot boxes, honest odds; the Play listing targets 13+ so the Families programme does not apply. Touch targets sized for one-handed phone use; readable contrast on small screens.
