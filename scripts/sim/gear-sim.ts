// Economy/gear simulation: no ads, no IAP. Bundle with esbuild and run in node (see report).
import { createCareer, playStep, answerCamp, answerBreak, resolveMoment, finishBigMatch, afterReport, startSummer, playSummer, commitSeason, acceptOffer, isTopLeague, leagueOf, primaryKeys } from "../../src/game/engine";
import { answerStory } from "../../src/game/stories";
import { GEAR_SLOTS, GEAR_TIERS, buyGear, canBuyGear } from "../../src/game/gear";
import { ECONOMY } from "../../src/game/economy";
import { POSITIONS } from "../../src/game/data";
import type { Career } from "../../src/game/types";

const CAREERS = Number(process.env.CAREERS ?? 200);
const SEASONS = 10;
const earnBySeason: number[][] = Array.from({ length: SEASONS }, () => []);
const itemsBySeason: number[][] = Array.from({ length: SEASONS }, () => []);
const bronzeS1: number[] = [];

function shop(c: Career, today: string) {
  let bought = 0;
  const top = isTopLeague(leagueOf(c, c.clubId));
  for (const tier of GEAR_TIERS) {
    for (const slot of GEAR_SLOTS) {
      if (canBuyGear(c, slot.id, tier, today, top) === "ok") {
        c = buyGear(c, slot.id, tier, today, top);
        bought += 1;
      }
    }
  }
  return { c, bought };
}

for (let n = 0; n < CAREERS; n += 1) {
  const pos = POSITIONS[n % POSITIONS.length].id;
  let c = createCareer(`Sim${n}`, pos, n % 2 ? "esp" : "eng", n * 7919 + 13, "normal");
  const keys = primaryKeys(pos);
  let season = 0;
  let earned = 0;
  let items = 0;
  let lastCoins = c.coins;
  let guard = 0;
  while (season < SEASONS && !c.retired && guard < 20000) {
    guard += 1;
    // coins earned = balance increase from game actions; shopping happens after the delta is taken
    if (c.coins > lastCoins) earned += c.coins - lastCoins;
    lastCoins = c.coins;
    if (c.story) { c = answerStory(c, "a"); continue; }
    switch (c.screen) {
      case "camp": c = answerCamp(c, keys[guard % keys.length]); break;
      case "break": c = answerBreak(c, keys[guard % keys.length]); break;
      case "bigmatch": {
        const p = c.pending!;
        const i = p.moments.findIndex((m) => !m.picked);
        if (i < 0) c = finishBigMatch(c);
        else {
          const best = [...p.moments[i].options].sort((a, b) => b.odds - a.odds)[0];
          c = resolveMoment(c, i, best.id);
        }
        break;
      }
      case "report": case "match": c = afterReport(c); break;
      case "season": c = startSummer(c); break;
      case "summer": {
        const next = playSummer(c);
        if (next === c || c.summer?.done) {
          c = commitSeason(c);
          if (c.coins > lastCoins) earned += c.coins - lastCoins;
          if (season === 0) bronzeS1.push(Math.floor(earned / ECONOMY.gear.tiers.bronze.price));
          earnBySeason[season].push(earned);
          // buy gear at season end with what the player has (season 1 also mid-season below)
          const r = shop(c, `d${season}`);
          c = r.c; items += r.bought; lastCoins = c.coins;
          itemsBySeason[season].push(items);
          items = 0; earned = 0; season += 1;
        } else c = next;
        break;
      }
      case "offers": {
        const offers = c.pendingOffers ?? [];
        const pick = offers.find((o) => o.kind === "up") ?? offers.find((o) => o.kind === "stay") ?? offers[0];
        c = pick ? acceptOffer(c, pick.clubId) : { ...c, screen: "camp" };
        break;
      }
      default: {
        c = playStep(c);
        if (c.coins > lastCoins) earned += c.coins - lastCoins;
        // a no-ads player buys gear as soon as they can afford it
        const r = shop(c, `d${season}`);
        c = r.c; items += r.bought; lastCoins = c.coins;
      }
    }
  }
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)] ?? 0; };
console.log(`careers=${CAREERS} (no ads)`);
console.log(`season1 bronze affordable from season-1 earnings: avg ${avg(bronzeS1).toFixed(2)} · p10 ${pct(bronzeS1, 0.1)} · median ${pct(bronzeS1, 0.5)} · p90 ${pct(bronzeS1, 0.9)} · share in 2-3: ${((bronzeS1.filter((x) => x >= 2 && x <= 3).length / bronzeS1.length) * 100).toFixed(0)}%`);
for (let s = 0; s < SEASONS; s += 1) {
  if (!earnBySeason[s].length) continue;
  console.log(`season ${s + 1}: n=${earnBySeason[s].length} coins avg ${avg(earnBySeason[s]).toFixed(0)} (p10 ${pct(earnBySeason[s], 0.1)}, p90 ${pct(earnBySeason[s], 0.9)}) · gear items bought avg ${avg(itemsBySeason[s]).toFixed(2)}`);
}
