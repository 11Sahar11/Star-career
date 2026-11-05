import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Moment } from "@/game/types";
import { ACTION_MS, TENSION_MS, RESULT_HOLD_MS, pitchFrame } from "./pitch-timing";

/*
 * Pitch board: a top-down tactics board that plays a decisive moment, then a result card.
 * Presentation only. The outcome comes from the resolved moment and the report line the engine wrote.
 */

type Pt = [number, number];
type Seg = { to: Pt; c?: Pt; t0: number; t1: number; lift?: number };
type Side = "us" | "them";
type ActorSpec = { id: string; side: Side; num: number; at: Pt; me?: boolean; gk?: boolean };
export type Outcome = "goal" | "miss" | "stop" | "beaten" | "close";
type Scene = { actors: (ActorSpec & { segs: Seg[] })[]; ball: { at: Pt; segs: Seg[] }; net?: number; burst?: { at: Pt; t: number; good: boolean } };

/* ---------- geometry ---------- */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4);
function quad(a: Pt, b: Pt, c: Pt | undefined, s: number): Pt {
  if (!c) return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const u = 1 - s;
  return [u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]];
}
/** Position (and lift 0..1) along a chain of segments at time t. */
function along(at: Pt, segs: Seg[], t: number, curve: (s: number) => number): { p: Pt; lift: number } {
  let from = at;
  for (const seg of segs) {
    if (t < seg.t0) return { p: from, lift: 0 };
    if (t < seg.t1) {
      const s = curve((t - seg.t0) / (seg.t1 - seg.t0));
      return { p: quad(from, seg.to, seg.c, s), lift: seg.lift ? seg.lift * Math.sin(Math.PI * s) : 0 };
    }
    from = seg.to;
  }
  return { p: from, lift: 0 };
}

/* ---------- scenes ---------- */
const GK: Pt = [170, 34];
function build(layout: ActorSpec[], ball: Pt, moves: Record<string, Seg[]>, ballSegs: Seg[], extra: Partial<Scene> = {}): Scene {
  return { actors: layout.map((a) => ({ ...a, segs: moves[a.id] ?? [] })), ball: { at: ball, segs: ballSegs }, ...extra };
}
const seg = (to: Pt, t0: number, t1: number, c?: Pt, lift?: number): Seg => ({ to, t0, t1, c, lift });

export function sceneFor(moment: Moment, picked: string | undefined, outcome: Outcome | null, num: number): Scene {
  const sit = moment.situation ?? (moment.kind === "chance" ? "oneonone" : moment.kind === "defend" ? "defend" : "gkdive");
  const won = outcome === "goal" || outcome === "stop";
  const me = (at: Pt): ActorSpec => ({ id: "me", side: "us", num, at, me: true, gk: moment.kind === "keeper" });
  const gkThem: ActorSpec = { id: "gk", side: "them", num: 1, at: GK, gk: true };
  const gkUs: ActorSpec = { id: "kp", side: "us", num: 1, at: GK, gk: true };
  const o = outcome;
  const p = picked;
  switch (sit) {
    case "penalty": {
      const L = [me([170, 120]), gkThem, { id: "t1", side: "us", num: 7, at: [104, 126] }, { id: "t2", side: "us", num: 10, at: [238, 128] }, { id: "d1", side: "them", num: 4, at: [124, 132] }, { id: "d2", side: "them", num: 5, at: [218, 134] }] as ActorSpec[];
      const runIn = { t1: [seg([112, 76], 0.36, 0.85, [100, 104])], t2: [seg([228, 76], 0.38, 0.88, [240, 104])], d1: [seg([128, 84], 0.38, 0.86)], d2: [seg([212, 84], 0.38, 0.86)] };
      const meRun = [seg([166, 95], 0, 0.3, [176, 110])];
      if (!o) return build(L, [170, 88], {}, []);
      if (o === "goal") return build(L, [170, 88], { ...runIn, me: [...meRun, seg([170, 70], 0.55, 0.85)], gk: [seg([198, 31], 0.32, 0.55)] }, [seg(p === "power" ? [176, 13] : [151, 15], 0.31, 0.56)], { net: 0.56 });
      if (p === "power") return build(L, [170, 88], { ...runIn, me: meRun, gk: [seg([150, 32], 0.32, 0.55)] }, [seg([184, -12], 0.31, 0.62, undefined, 0.9)]);
      return build(L, [170, 88], { ...runIn, me: meRun, gk: [seg([152, 31], 0.32, 0.52)] }, [seg([154, 28], 0.31, 0.52), seg([112, 6], 0.52, 0.78, undefined, 0.5)], { burst: { at: [153, 29], t: 0.52, good: false } });
    }
    case "freekick": {
      const L = [me([214, 170]), gkThem, { id: "w1", side: "them", num: 4, at: [178, 118] }, { id: "w2", side: "them", num: 5, at: [188, 115] }, { id: "w3", side: "them", num: 6, at: [198, 112] }, { id: "t1", side: "us", num: 8, at: [156, 158] }, { id: "t2", side: "us", num: 9, at: [134, 80] }, { id: "d1", side: "them", num: 3, at: [142, 70] }] as ActorSpec[];
      const B: Pt = [196, 146];
      const meRun = [seg([201, 151], 0, 0.28)];
      const jump = { w1: [seg([178, 114], 0.3, 0.42), seg([178, 118], 0.42, 0.56)], w2: [seg([188, 111], 0.3, 0.42), seg([188, 115], 0.42, 0.56)], w3: [seg([198, 108], 0.3, 0.42), seg([198, 112], 0.42, 0.56)] };
      if (!o) return build(L, B, {}, []);
      if (p === "curl") {
        if (o === "goal") return build(L, B, { me: meRun, ...jump, gk: [seg([186, 31], 0.42, 0.66)] }, [seg([188, 15], 0.3, 0.68, [116, 54], 0.6)], { net: 0.68 });
        return build(L, B, { me: meRun, ...jump }, [seg([188, 118], 0.3, 0.44, undefined, 0.2), seg([238, 176], 0.44, 0.78)], { burst: { at: [188, 116], t: 0.44, good: false } });
      }
      if (o === "goal") return build(L, B, { me: meRun, t1: [seg([152, 150], 0.3, 0.44)], gk: [seg([150, 32], 0.48, 0.7)] }, [seg([154, 150], 0.28, 0.42), seg([150, 15], 0.46, 0.7)], { net: 0.7 });
      return build(L, B, { me: meRun, t1: [seg([152, 150], 0.3, 0.44)], w1: [seg([166, 134], 0.36, 0.56)] }, [seg([154, 150], 0.28, 0.42), seg([166, 132], 0.46, 0.58), seg([104, 214], 0.58, 0.86)], { burst: { at: [166, 132], t: 0.58, good: false } });
    }
    case "runbehind": {
      const L = [me([140, 172]), gkThem, { id: "t1", side: "us", num: 8, at: [226, 226] }, { id: "t2", side: "us", num: 9, at: [238, 156] }, { id: "d1", side: "them", num: 4, at: [128, 150] }, { id: "d2", side: "them", num: 5, at: [196, 148] }] as ActorSpec[];
      const B: Pt = [217, 211];
      const run = [seg([142, 106], 0.06, 0.46, [114, 140])];
      const ballIn = seg([142, 102], 0.1, 0.46, [196, 140]);
      if (!o) return build(L, B, {}, []);
      if (p === "sprint") {
        if (o === "goal") return build(L, B, { me: [...run, seg([150, 84], 0.46, 0.62)], d1: [seg([136, 122], 0.16, 0.6)], d2: [seg([170, 116], 0.2, 0.6)], gk: [seg([158, 46], 0.42, 0.6), seg([176, 40], 0.6, 0.74)] }, [ballIn, seg([186, 15], 0.6, 0.76)], { net: 0.76 });
        return build(L, B, { me: [seg([140, 124], 0.06, 0.52, [118, 150])], d1: [seg([142, 104], 0.1, 0.44, [120, 120])] }, [ballIn, seg([60, 168], 0.5, 0.8, undefined, 0.5)], { burst: { at: [142, 104], t: 0.46, good: false } });
      }
      const cross: Pt = [196, 74];
      if (o === "goal") return build(L, B, { me: run, t2: [seg([196, 76], 0.06, 0.6, [236, 110])], d2: [seg([178, 104], 0.2, 0.62)], gk: [seg([152, 42], 0.46, 0.62), seg([186, 36], 0.62, 0.76)] }, [ballIn, seg(cross, 0.48, 0.62), seg([178, 15], 0.66, 0.78)], { net: 0.78 });
      return build(L, B, { me: run, t2: [seg([204, 82], 0.06, 0.62, [236, 110])], d2: [seg([170, 92], 0.2, 0.58)] }, [ballIn, seg([168, 92], 0.48, 0.58), seg([252, 206], 0.58, 0.86)], { burst: { at: [168, 92], t: 0.58, good: false } });
    }
    case "aerial": {
      const L = [me([146, 130]), gkThem, { id: "t1", side: "us", num: 11, at: [306, 96] }, { id: "t2", side: "us", num: 10, at: [214, 124] }, { id: "d1", side: "them", num: 5, at: [170, 98] }, { id: "d2", side: "them", num: 4, at: [126, 92] }] as ActorSpec[];
      const B: Pt = [293, 106];
      const cross = seg([160, 68], 0.05, 0.5, [250, 6], 0.9);
      if (!o) return build(L, B, {}, []);
      if (p === "header") {
        if (o === "goal") return build(L, B, { me: [seg([160, 72], 0.06, 0.48, [140, 100])], d1: [seg([166, 80], 0.1, 0.48)], gk: [seg([188, 32], 0.5, 0.7)] }, [cross, seg([192, 15], 0.52, 0.68)], { net: 0.68 });
        return build(L, B, { me: [seg([156, 86], 0.06, 0.5, [140, 104])], d1: [seg([160, 72], 0.08, 0.46)] }, [cross, seg([92, 214], 0.52, 0.86, undefined, 0.7)], { burst: { at: [160, 70], t: 0.5, good: false } });
      }
      if (o === "goal") return build(L, B, { me: [seg([160, 72], 0.06, 0.48, [140, 100])], t2: [seg([196, 96], 0.08, 0.52)], gk: [seg([150, 32], 0.62, 0.78)] }, [cross, seg([194, 92], 0.52, 0.62), seg([180, 15], 0.64, 0.78)], { net: 0.78 });
      return build(L, B, { me: [seg([160, 72], 0.06, 0.48, [140, 100])], t2: [seg([200, 104], 0.08, 0.52)], d1: [seg([182, 96], 0.3, 0.6)] }, [cross, seg([184, 94], 0.52, 0.62), seg([264, 220], 0.64, 0.9, undefined, 0.6)], { burst: { at: [184, 94], t: 0.62, good: false } });
    }
    case "keypass": {
      const L = [me([170, 226]), gkThem, { id: "t1", side: "us", num: 9, at: [234, 178] }, { id: "t2", side: "us", num: 11, at: [104, 182] }, { id: "d1", side: "them", num: 6, at: [146, 172] }, { id: "d2", side: "them", num: 5, at: [206, 156] }, { id: "d3", side: "them", num: 4, at: [176, 128] }] as ActorSpec[];
      const B: Pt = [170, 211];
      if (!o) return build(L, B, {}, []);
      if (p === "through") {
        if (o === "goal") return build(L, B, { t1: [seg([202, 96], 0.04, 0.52, [244, 130])], d2: [seg([194, 116], 0.2, 0.56)], gk: [seg([184, 46], 0.4, 0.6), seg([166, 40], 0.6, 0.74)] }, [seg([202, 100], 0.12, 0.52, [196, 156]), seg([156, 15], 0.56, 0.72)], { net: 0.72 });
        return build(L, B, { t1: [seg([206, 110], 0.04, 0.6, [244, 140])], gk: [seg([176, 52], 0.3, 0.62)] }, [seg([176, 54], 0.12, 0.62, [198, 150])], { burst: { at: [176, 54], t: 0.62, good: false } });
      }
      if (o === "goal") return build(L, B, { me: [seg([174, 172], 0, 0.3, [198, 204]), seg([168, 112], 0.3, 0.6, [138, 142])], d1: [seg([162, 170], 0.18, 0.4)], d3: [seg([182, 122], 0.36, 0.58)], gk: [seg([168, 52], 0.46, 0.64), seg([152, 40], 0.64, 0.78)] }, [seg([174, 166], 0, 0.3, [198, 198]), seg([168, 106], 0.3, 0.6, [138, 136]), seg([188, 15], 0.63, 0.78)], { net: 0.78 });
      return build(L, B, { me: [seg([172, 176], 0, 0.32, [196, 206])], d3: [seg([171, 166], 0.12, 0.34)] }, [seg([172, 170], 0, 0.32, [196, 200]), seg([244, 236], 0.36, 0.66)], { burst: { at: [172, 168], t: 0.34, good: false } });
    }
    case "defend": {
      const L = [me([150, 150]), gkUs, { id: "s", side: "them", num: 9, at: [222, 214] }, { id: "o2", side: "them", num: 11, at: [92, 184] }, { id: "t1", side: "us", num: 5, at: [214, 120] }, { id: "t2", side: "us", num: 3, at: [112, 128] }] as ActorSpec[];
      const B: Pt = [213, 199];
      if (!o) return build(L, B, {}, []);
      if (won) {
        if (p === "block") return build(L, B, { s: [seg([196, 142], 0, 0.42, [224, 176])], me: [seg([182, 120], 0.18, 0.46)] }, [seg([196, 136], 0, 0.42, [222, 170]), seg([184, 120], 0.44, 0.52), seg([268, 86], 0.52, 0.78)], { burst: { at: [184, 120], t: 0.52, good: true } });
        if (p === "track") return build(L, B, { s: [seg([190, 122], 0, 0.52, [226, 166])], me: [seg([188, 128], 0.1, 0.52, [146, 112])] }, [seg([190, 116], 0, 0.5, [224, 160]), seg([104, 176], 0.54, 0.8)], { burst: { at: [189, 120], t: 0.52, good: true } });
        return build(L, B, { s: [seg([198, 152], 0, 0.44, [224, 186]), seg([206, 164], 0.5, 0.7)], me: [seg([196, 152], 0.24, 0.5, [168, 166])] }, [seg([198, 146], 0, 0.44, [222, 180]), seg([110, 212], 0.5, 0.78)], { burst: { at: [197, 150], t: 0.5, good: true } });
      }
      const moves = { s: [seg([194, 142], 0, 0.36, [224, 178]), seg([180, 96], 0.36, 0.6, [216, 110])], me: [seg([198, 150], 0.18, 0.42), seg([194, 132], 0.42, 0.62)], kp: [seg([178, 42], 0.4, 0.6), seg(o === "beaten" ? [188, 32] : [158, 32], 0.62, 0.76)] };
      const ball = [seg([194, 136], 0, 0.36, [222, 172]), seg([180, 90], 0.36, 0.6, [214, 104])];
      if (o === "beaten") return build(L, B, moves, [...ball, seg([152, 15], 0.62, 0.78)], { net: 0.78 });
      return build(L, B, moves, [...ball, seg([210, 2], 0.62, 0.82)]);
    }
    case "gkstand": {
      const L = [me(GK), { id: "s", side: "them", num: 9, at: [170, 206] }, { id: "t1", side: "us", num: 4, at: [132, 172] }, { id: "o2", side: "them", num: 7, at: [246, 160] }] as ActorSpec[];
      const B: Pt = [170, 191];
      const run = { s: [seg([174, 100], 0, 0.42, [154, 150])], t1: [seg([150, 118], 0.04, 0.5, [130, 140])] };
      const ballRun = seg([174, 94], 0, 0.42, [154, 144]);
      if (!o) return build(L, B, {}, []);
      if (won) return build(L, B, { ...run, me: [seg(p === "dive" ? [160, 54] : [172, 54], 0.1, 0.44)] }, [ballRun, seg([170, 58], 0.44, 0.54), seg([254, 64], 0.54, 0.8, undefined, 0.5)], { burst: { at: [170, 58], t: 0.54, good: true } });
      if (o === "beaten") return build(L, B, { ...run, me: [seg(p === "dive" ? [150, 52] : [166, 54], 0.1, 0.5)] }, [ballRun, seg([190, 15], 0.46, 0.64)], { net: 0.64 });
      return build(L, B, { ...run, me: [seg([162, 54], 0.1, 0.5)] }, [ballRun, seg([194, 24], 0.46, 0.6), seg([232, 6], 0.6, 0.8)], { burst: { at: [194, 24], t: 0.6, good: false } });
    }
    case "gkcomeoff": {
      const L = [me(GK), { id: "s", side: "them", num: 9, at: [214, 168] }, { id: "o3", side: "them", num: 6, at: [170, 228] }, { id: "t1", side: "us", num: 5, at: [138, 150] }, { id: "t2", side: "us", num: 2, at: [70, 176] }] as ActorSpec[];
      const B: Pt = [170, 212];
      const lob = seg([176, 96], 0.04, 0.46, [170, 160], 0.9);
      if (!o) return build(L, B, {}, []);
      if (won) {
        const meRun = [seg([176, 94], 0.1, 0.44)];
        const sRun = { s: [seg([184, 108], 0.06, 0.5)], t1: [seg([156, 112], 0.06, 0.5)] };
        if (p === "sweep") return build(L, B, { ...sRun, me: meRun, t2: [seg([78, 160], 0.4, 0.72)] }, [lob, seg([80, 158], 0.5, 0.74)], { burst: { at: [176, 96], t: 0.46, good: true } });
        return build(L, B, { ...sRun, me: meRun }, [lob], { burst: { at: [176, 96], t: 0.46, good: true } });
      }
      const moves = { s: [seg([178, 98], 0.04, 0.42), seg([150, 70], 0.48, 0.66)], me: [seg([174, 72], 0.1, 0.46), seg([182, 84], 0.46, 0.6)] };
      if (o === "beaten") return build(L, B, moves, [lob, seg([152, 66], 0.48, 0.64), seg([162, 15], 0.66, 0.8)], { net: 0.8 });
      return build(L, B, moves, [lob, seg([152, 66], 0.48, 0.64), seg([146, 24], 0.66, 0.78), seg([112, 6], 0.78, 0.92)], { burst: { at: [146, 24], t: 0.78, good: false } });
    }
    case "gkdive":
    default: {
      if (moment.kind === "chance") {
        // one on one
        const L = [me([176, 192]), gkThem, { id: "d1", side: "them", num: 4, at: [130, 210] }, { id: "t1", side: "us", num: 9, at: [236, 178] }] as ActorSpec[];
        const B: Pt = [176, 177];
        if (!o) return build(L, B, {}, []);
        if (p === "dribble") {
          if (o === "goal") return build(L, B, { me: [seg([180, 116], 0, 0.32), seg([186, 52], 0.32, 0.7, [250, 84])], gk: [seg([170, 84], 0.08, 0.4), seg([148, 92], 0.4, 0.56)], d1: [seg([156, 150], 0.1, 0.7)] }, [seg([180, 108], 0, 0.32), seg([184, 46], 0.32, 0.7, [254, 80]), seg([166, 15], 0.72, 0.84)], { net: 0.84 });
          return build(L, B, { me: [seg([178, 112], 0, 0.36), seg([180, 98], 0.36, 0.56)], gk: [seg([178, 92], 0.1, 0.56)], d1: [seg([156, 150], 0.1, 0.7)] }, [seg([178, 106], 0, 0.36), seg([178, 94], 0.38, 0.56)], { burst: { at: [178, 94], t: 0.56, good: false } });
        }
        const shot = [seg([176, 124], 0, 0.32)];
        const ballUp = seg([176, 118], 0, 0.32);
        if (o === "goal") return build(L, B, { me: shot, gk: [seg([172, 62], 0.08, 0.34), seg([192, 56], 0.36, 0.56)], d1: [seg([156, 150], 0.1, 0.7)] }, [ballUp, seg([150, 15], 0.34, 0.58)], { net: 0.58 });
        return build(L, B, { me: shot, gk: [seg([172, 62], 0.08, 0.34), seg([180, 52], 0.36, 0.56)], d1: [seg([156, 150], 0.1, 0.7)] }, [ballUp, seg([186, -12], 0.34, 0.64, undefined, 0.9)]);
      }
      const L = [me(GK), { id: "s", side: "them", num: 10, at: [248, 130] }, { id: "o2", side: "them", num: 9, at: [138, 104] }, { id: "t1", side: "us", num: 4, at: [204, 100] }, { id: "t2", side: "us", num: 5, at: [126, 120] }] as ActorSpec[];
      const B: Pt = [237, 117];
      const curl = (to: Pt, t1: number) => seg(to, 0.12, t1, [206, 44]);
      if (!o) return build(L, B, {}, []);
      if (won) {
        if (p === "stand") return build(L, B, { me: [seg([162, 32], 0.14, 0.42)], t1: [seg([192, 84], 0.1, 0.5)] }, [curl([164, 33], 0.46), seg([226, 92], 0.46, 0.72)], { burst: { at: [164, 33], t: 0.46, good: true } });
        return build(L, B, { me: [seg([150, 28], 0.2, 0.46, [166, 26])], t1: [seg([192, 84], 0.1, 0.5)] }, [curl([150, 24], 0.46), seg([118, 2], 0.46, 0.7)], { burst: { at: [150, 25], t: 0.46, good: true } });
      }
      if (o === "beaten") return build(L, B, { me: [seg(p === "dive" ? [158, 30] : [166, 34], 0.24, 0.52)] }, [curl([150, 15], 0.5)], { net: 0.5 });
      return build(L, B, { me: [seg([160, 30], 0.24, 0.52)] }, [curl([146, 24], 0.46), seg([112, 54], 0.46, 0.7)], { burst: { at: [146, 24], t: 0.46, good: false } });
    }
  }
}

/** The engine's report line for a moment (`@mo.goal.shoot` ...) tells which way it went. */
export function outcomeOf(line: string | undefined): Outcome | null {
  const m = line?.match(/^@mo\.(goal|miss|stop|beaten|close)\./);
  return m ? (m[1] as Outcome) : null;
}

/** Headline key for the result card. */
export function headlineKey(line: string | undefined): string {
  const [, kind = "", id = ""] = line?.split(".") ?? [];
  if (kind === "goal") return ["layoff", "knock", "through", "pass"].includes(id) ? "pb.h.assist" : "pb.h.goal";
  if (kind === "miss") return `pb.h.miss.${id}`;
  if (kind === "stop") return `pb.h.stop.${id}`;
  if (kind === "beaten") return "pb.h.beaten";
  return id === "keeper" ? "pb.h.post" : "pb.h.wide";
}

/* ---------- board ---------- */

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(q.matches);
    const on = () => setReduce(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduce;
}

function Chip({ a, p, t, active }: { a: ActorSpec; p: Pt; t: number; active: boolean }) {
  const r = a.me ? 14 : a.gk ? 12 : 11;
  const fill = a.gk ? (a.side === "us" ? "#e3efe7" : "#f3f1ec") : a.side === "us" ? "#0b6b3a" : "#1b1f25";
  const ink = a.gk ? (a.side === "us" ? "#0b6b3a" : "#111418") : "#ffffff";
  return (
    <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`}>
      <ellipse cx="1.2" cy={r * 0.75} rx={r * 0.95} ry={r * 0.42} fill="#0a2a18" opacity="0.28" />
      {a.me && active ? <circle r={r + 4} className="pb-halo" fill="none" stroke="#ffffff" strokeWidth="1.6" /> : null}
      {a.me && !active && t > 0 ? <circle r={r + 3} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" /> : null}
      {a.me ? <path d={`M-4 ${r + 7} L0 ${r + 2} L4 ${r + 7} Z`} fill="#ffffff" /> : null}
      {a.gk ? <><rect x={-r - 5} y="-4" width="5" height="8" rx="2" fill="#ffdc78" /><rect x={r} y="-4" width="5" height="8" rx="2" fill="#ffdc78" /></> : null}
      <circle r={r} fill={fill} stroke={a.me ? "#ffffff" : a.side === "us" ? "#ffffff" : a.gk ? "#111418" : "#ffffff"} strokeWidth={a.me ? 2.2 : 1.3} />
      <text y="0.5" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display)" fontWeight="700" fontSize={a.me ? 14 : 11} fill={ink}>
        {a.num}
      </text>
    </g>
  );
}

function Pitch() {
  const stripes = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g>
      {stripes.map((i) => (
        <rect key={i} x="0" y={i * 32} width="340" height="32" fill={i % 2 ? "#5a8963" : "#689570"} />
      ))}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.82" strokeWidth="1.4">
        <rect x="12" y="24" width="316" height="300" />
        <rect x="74" y="24" width="192" height="86" />
        <rect x="124" y="24" width="92" height="30" />
        <path d="M137 110 A 40 40 0 0 0 203 110" />
        <path d="M120 268 A 50 50 0 0 1 220 268" opacity="0.9" />
        <path d="M12 268 L328 268" />
        <path d="M12 32 A 8 8 0 0 0 20 24 M328 32 A 8 8 0 0 1 320 24" />
      </g>
      <circle cx="170" cy="88" r="1.8" fill="#ffffff" fillOpacity="0.85" />
      <circle cx="170" cy="268" r="2" fill="#ffffff" fillOpacity="0.85" />
    </g>
  );
}

function Net({ t, at, bx }: { t: number; at?: number; bx: number }) {
  const dt = at !== undefined && t > at ? t - at : -1;
  const amp = dt >= 0 ? 7 * Math.exp(-dt * 7) * Math.cos(dt * 34) : 0;
  const pull = dt >= 0 ? Math.min(1, dt * 12) : 0;
  const cx = Math.max(150, Math.min(190, bx));
  const back = (y: number) => `M146 ${y} Q ${cx} ${(y - amp * pull * 1.6).toFixed(2)} 194 ${y}`;
  const cols = [150, 156, 162, 168, 174, 180, 186, 190];
  return (
    <g>
      <rect x="146" y="8" width="48" height="16" fill="#ffffff" fillOpacity="0.1" />
      <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.6" fill="none">
        {cols.map((x) => {
          const k = Math.exp(-Math.pow((x - cx) / 14, 2));
          return <path key={x} d={`M${x} 24 Q ${x} ${16 - amp * k} ${x} ${(8 - amp * k * pull * 1.6).toFixed(2)}`} />;
        })}
        {[12, 16, 20].map((y) => <path key={y} d={back(y)} />)}
      </g>
      <path d={back(8)} stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.9" fill="none" />
      <path d="M146 24 L146 8 M194 24 L194 8" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M146 24.5 L194 24.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

export function PitchBoard({ moment, picked, outcome, num, play, onDone, label, playerLabel, opponentLabel, keeperLabel, skipLabel }: { moment: Moment; picked?: string; outcome: Outcome | null; num: number; play: boolean; onDone: () => void; label: string; playerLabel: string; opponentLabel: string; keeperLabel: string; skipLabel: string }) {
  const reduce = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(onDone);
  const completed = useRef(false);
  done.current = onDone;
  const frame = pitchFrame(elapsed, play && reduce);
  const t = play ? frame.progress : 0;
  const scene = sceneFor(moment, picked, play ? outcome : null, num);

  useEffect(() => {
    completed.current = false;
    if (!play) {
      setElapsed(0);
      return;
    }
    let raf = 0;
    let hold = 0;
    const finish = () => {
      if (completed.current) return;
      completed.current = true;
      done.current();
    };
    if (reduce) {
      // No camera, trails or movement; keep the final frame briefly, skippable.
      setElapsed(TENSION_MS + ACTION_MS);
      hold = window.setTimeout(finish, 350);
    } else {
      const start = performance.now();
      const tick = (now: number) => {
        if (completed.current) return;
        const ms = Math.min(TENSION_MS + ACTION_MS, now - start);
        setElapsed(ms);
        if (ms < TENSION_MS + ACTION_MS) raf = requestAnimationFrame(tick);
        else hold = window.setTimeout(finish, RESULT_HOLD_MS);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hold);
    };
  }, [play, reduce]);

  function skip() {
    if (!play || completed.current) return;
    // Stop the RAF as well as jumping to the last frame: it must never rewind.
    completed.current = true;
    setElapsed(TENSION_MS + ACTION_MS);
    done.current();
  }

  const ball = along(scene.ball.at, scene.ball.segs, t, easeOut);
  const trail = play && !reduce ? [1, 2, 3, 4, 5, 6, 7, 8].map((k) => along(scene.ball.at, scene.ball.segs, Math.max(0, t - k * 0.011), easeOut)) : [];
  const moving = scene.ball.segs.some((s) => t > s.t0 && t < s.t1 + 0.06);
  const lifted = (q: { p: Pt; lift: number }): Pt => [q.p[0], q.p[1] - q.lift * 16];
  const burst = scene.burst && t >= scene.burst.t ? Math.min(1, (t - scene.burst.t) / 0.18) : 0;
  const goalFlash = scene.net !== undefined && t >= scene.net ? Math.min(1, (t - scene.net) / 0.25) : 0;
  const cameraX = Math.max(140, Math.min(200, scene.ball.at[0]));
  const previewTarget: Pt = moment.kind === "defend" ? (scene.actors.find((a) => a.me)?.at ?? [170, 44]) : [170, 44];

  return (
    <div className="pb-stage">
      <div className={`pb-board ${play && frame.tension && !reduce ? "is-tension" : ""}`} dir="ltr">
        <svg viewBox="0 0 340 240" width="100%" style={{ display: "block" }} role="img" aria-label={label}>
          <g transform={`translate(${cameraX} 95) scale(${play ? frame.zoom : 1}) translate(${-cameraX} -95)`}>
          <Pitch />
          {!play ? <>
            <circle cx={scene.ball.at[0]} cy={scene.ball.at[1]} r="22" fill="#fff4c2" opacity="0.12" />
            <path d={`M${scene.ball.at[0]} ${scene.ball.at[1] - 8} Q170 110 ${previewTarget[0]} ${previewTarget[1]}`} fill="none" stroke="#ffffff" strokeWidth="1.6" strokeDasharray="4 6" opacity="0.42" />
          </> : null}
          <Net t={t} at={scene.net} bx={ball.p[0]} />
          {goalFlash > 0 ? <rect x="0" y="6" width="340" height="234" fill="#ffffff" opacity={(1 - goalFlash) * 0.28} /> : null}
          {scene.actors.map((a) => {
            const q = along(a.at, a.segs, t, ease);
            return <Chip key={a.id} a={a} p={q.p} t={t} active={!play} />;
          })}
          {trail.length && moving ? (
            <g>
              {trail.map((q, i) => {
                const p = lifted(q);
                return <circle key={i} cx={p[0]} cy={p[1]} r={3.2 - i * 0.3} fill="#ffffff" opacity={0.5 - i * 0.06} />;
              })}
            </g>
          ) : null}
          {burst > 0 && scene.burst ? (
            <circle cx={scene.burst.at[0]} cy={scene.burst.at[1]} r={4 + burst * 14} fill="none" stroke={scene.burst.good ? "#ffffff" : "#ffd5d8"} strokeWidth={2.2 * (1 - burst) + 0.2} opacity={1 - burst} />
          ) : null}
          {ball.p[1] > -6 ? (
            <g>
              <ellipse cx={ball.p[0] + 1} cy={ball.p[1] + 3} rx={3.4 - ball.lift} ry={1.5} fill="#0a2a18" opacity={0.35 - ball.lift * 0.15} />
              <circle cx={ball.p[0]} cy={ball.p[1] - ball.lift * 16} r={4.6 + ball.lift * 1.8} fill="#ffffff" stroke="#111418" strokeWidth="1.1" />
              <circle cx={ball.p[0] - 0.8} cy={ball.p[1] - ball.lift * 16 - 0.6} r={1.6} fill="#111418" />
            </g>
          ) : null}
          </g>
        </svg>
        {play ? <button type="button" className="pb-skip" onClick={skip} aria-label={skipLabel}>
          <span>{skipLabel}<span aria-hidden="true"> ▸▸</span></span>
        </button> : null}
        {play && frame.tension && !reduce ? <span className="pb-tension" aria-hidden="true"><i /><i /><i /></span> : null}
      </div>
      <div className="pb-legend">
        <span><i className="pb-key-player" aria-hidden="true" /><bdi>{playerLabel}</bdi></span>
        <span><i className="pb-key-opponent" aria-hidden="true" /><bdi>{opponentLabel}</bdi></span>
        <span><i className="pb-key-keeper" aria-hidden="true" /><bdi>{keeperLabel}</bdi></span>
      </div>
    </div>
  );
}

/* ---------- result card ---------- */

export function ResultCard({ good, kicker, headline, line, score, rating, ratingLabel, children }: { good: boolean; kicker: ReactNode; headline: string; line: string; score: ReactNode; rating?: { value: number; delta: number } | null; ratingLabel?: string; children?: ReactNode }) {
  const sign = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(1)}`;
  return (
    <section className={`pb-card ${good ? "is-good" : "is-bad"}`} aria-live="polite">
      <div className="pb-card-top">
        <div className="pb-card-text">
          <p className="pb-kicker">{kicker}</p>
          <h2 className={`pb-headline ${headline.length > 11 ? "is-long" : headline.length > 7 ? "is-mid" : ""}`}>{headline}</h2>
          <p className="pb-line">{line}</p>
        </div>
        <img className="pb-player" src={good ? "/moments/celebrate.webp" : "/moments/dejected.webp"} alt="" width={good ? 212 : 195} height={520} />
      </div>
      <div className="pb-stats">
        <div className="pb-stat">{score}</div>
        {rating ? (
          <div className="pb-stat pb-rating">
            <span className="pb-stat-label">{ratingLabel}</span>
            <span className="font-num">{rating.value.toFixed(1)}</span>
            <bdi dir="ltr" className={`pb-delta ${rating.delta >= 0 ? "up" : "down"}`}>{sign(rating.delta)}</bdi>
          </div>
        ) : null}
      </div>
      <div className="pb-actions">{children}</div>
    </section>
  );
}
