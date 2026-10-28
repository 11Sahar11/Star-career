let ctx: AudioContext | null = null;
let enabled = true;

export function setAudioEnabled(on: boolean) {
  enabled = on;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gainValue: number, delay = 0) {
  if (!ctx || !enabled) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

export function playWhistle() {
  tone(880, 0.16, "square", 0.035);
  tone(1240, 0.12, "square", 0.025, 0.08);
}

export function playGoal() {
  tone(523, 0.12, "triangle", 0.05);
  tone(659, 0.14, "triangle", 0.05, 0.09);
  tone(784, 0.22, "triangle", 0.045, 0.18);
}
