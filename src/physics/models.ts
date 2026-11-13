/** Teaching models use SI internally. They describe hydrogen-1, not an instrument specification. */
export const GAMMA_H_HZ_T = 42.57747892e6;
export const TAU = 2 * Math.PI;
export type Vec3 = [number, number, number];
export interface Complex { re: number; im: number }
export const larmorHz = (b0MilliTesla: number) => GAMMA_H_HZ_T * b0MilliTesla * 1e-3;
/** B1 is the co-rotating component, not the peak of a linearly oscillating field. */
export const flipAngleDegrees = (b1MicroTesla: number, durationMicroseconds: number) =>
  360 * GAMMA_H_HZ_T * b1MicroTesla * 1e-6 * durationMicroseconds * 1e-6;
export const linspace = (start: number, end: number, count = 301) =>
  Array.from({ length: count }, (_, i) => start + (end - start) * i / Math.max(1, count - 1));

/** Right-handed axes, positive gamma; dM/dt = gamma M cross B. +Bx turns +Mz toward +My. */
export function rotateMagnetization(v: Vec3, axis: Vec3, angleRadians: number): Vec3 {
  const length = Math.hypot(...axis);
  if (length === 0) return [...v];
  const [x, y, z] = axis.map(value => value / length);
  const c = Math.cos(angleRadians), s = Math.sin(angleRadians), dot = v[0] * x + v[1] * y + v[2] * z;
  const cross: Vec3 = [v[1] * z - v[2] * y, v[2] * x - v[0] * z, v[0] * y - v[1] * x];
  return [0, 1, 2].map(i => v[i] * c + cross[i] * s + [x, y, z][i] * dot * (1 - c)) as Vec3;
}
export function rotatingFrameVector(flipDeg: number, offsetHz: number, timeMs: number): Vec3 {
  const afterPulse = rotateMagnetization([0, 0, 1], [1, 0, 0], flipDeg * Math.PI / 180);
  return rotateMagnetization(afterPulse, [0, 0, 1], TAU * offsetHz * timeMs / 1000);
}
export function waveAt(timeSeconds: number, frequencyHz: number, phaseDegrees = 0) {
  return Math.sin(TAU * frequencyHz * timeSeconds + phaseDegrees * Math.PI / 180);
}
export const longitudinalRecovery = (timeMs: number, t1Ms: number, initialMz = 0) =>
  1 + (initialMz - 1) * Math.exp(-timeMs / t1Ms);
export const transverseDecay = (timeMs: number, t2Ms: number) => Math.exp(-timeMs / t2Ms);
/** Static Gaussian-weighted frequency offsets. Ideal instantaneous 180° at tau; T2 loss is irreversible. */
export function ensembleSignal(timeMs: number, tauMs: number, t2Ms: number, spreadHz: number, echo = true): Complex {
  const phaseTime = echo && timeMs >= tauMs ? timeMs - 2 * tauMs : timeMs;
  let re = 0, im = 0, weightSum = 0;
  const count = spreadHz === 0 ? 1 : 257;
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : -3 + 6 * i / (count - 1);
    const weight = Math.exp(-offset * offset / 2);
    const phase = -TAU * offset * spreadHz * phaseTime / 1000;
    re += weight * Math.cos(phase); im += weight * Math.sin(phase); weightSum += weight;
  }
  const decay = transverseDecay(timeMs, t2Ms) / weightSum;
  return { re: re * decay, im: im * decay };
}
export function aliasedFrequency(frequencyHz: number, sampleRateHz: number) {
  const wrapped = ((frequencyHz + sampleRateHz / 2) % sampleRateHz + sampleRateHz) % sampleRateHz - sampleRateHz / 2;
  return Math.abs(wrapped);
}
/** Radix-two complex FFT. Forward unnormalised, inverse divided by N. */
export function fft(input: Complex[], inverse = false): Complex[] {
  const n = input.length;
  if (!n || (n & (n - 1))) throw new Error('FFT 长度必须是非零的 2 的幂。');
  const out = input.map(v => ({ ...v }));
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [out[i], out[j]] = [out[j], out[i]];
  }
  for (let length = 2; length <= n; length <<= 1) {
    const phase = (inverse ? 1 : -1) * TAU / length;
    for (let start = 0; start < n; start += length) {
      for (let j = 0; j < length / 2; j++) {
        const c = Math.cos(phase * j), s = Math.sin(phase * j);
        const even = out[start + j], odd = out[start + j + length / 2];
        const re = odd.re * c - odd.im * s, im = odd.re * s + odd.im * c;
        out[start + j] = { re: even.re + re, im: even.im + im };
        out[start + j + length / 2] = { re: even.re - re, im: even.im - im };
      }
    }
  }
  return inverse ? out.map(v => ({ re: v.re / n, im: v.im / n })) : out;
}
export function fft2D(input: Complex[], size: number, inverse = false): Complex[] {
  if (input.length !== size * size) throw new Error('二维数组尺寸不匹配。');
  const out: Complex[] = [];
  for (let y = 0; y < size; y++) out.push(...fft(input.slice(y * size, (y + 1) * size), inverse));
  for (let x = 0; x < size; x++) {
    const column = fft(Array.from({ length: size }, (_, y) => out[y * size + x]), inverse);
    column.forEach((value, y) => { out[y * size + x] = value; });
  }
  return out;
}
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + .5) / 4294967296; };
}
export function gaussianNoise(seed = 20261113) {
  const random = seededRandom(seed);
  return () => Math.sqrt(-2 * Math.log(random())) * Math.cos(TAU * random());
}
/** Deliberately simple 2D field error; not a Halbach/FEM prediction. x,y in mm. */
export function fieldErrorPpm(xMm: number, yMm: number, linearCorrection: number) {
  return (1 - linearCorrection) * (12 * xMm + 8 * yMm) + .09 * (xMm * xMm - yMm * yMm) + .035 * xMm * yMm;
}
export function fieldStatistics(diameterMm: number, linearCorrection: number) {
  const values: number[] = [], radius = diameterMm / 2;
  for (const y of linspace(-radius, radius, 41)) for (const x of linspace(-radius, radius, 41)) {
    if (x * x + y * y <= radius * radius + 1e-8) values.push(fieldErrorPpm(x, y, linearCorrection));
  }
  return { peakToPeakPpm: Math.max(...values) - Math.min(...values), meanPpm: values.reduce((a, b) => a + b, 0) / values.length };
}
export const lcFrequencyHz = (inductanceMicroHenry: number, capacitancePicoFarad: number) =>
  1 / (TAU * Math.sqrt(inductanceMicroHenry * 1e-6 * capacitancePicoFarad * 1e-12));
export const capacitanceForFrequencyPf = (inductanceMicroHenry: number, frequencyHz: number) =>
  1 / (TAU * frequencyHz) ** 2 / (inductanceMicroHenry * 1e-6) * 1e12;
export const resonatorResponse = (frequencyHz: number, resonanceHz: number, q: number) =>
  1 / Math.sqrt(1 + (2 * q * (frequencyHz / resonanceHz - 1)) ** 2);
export interface Timing { txStartUs: number; txDurationUs: number; ringdownUs: number; rxStartUs: number; rxDurationUs: number }
export function checkTiming(t: Timing) {
  const txEnd = t.txStartUs + t.txDurationUs, safeStart = txEnd + t.ringdownUs;
  if (t.rxStartUs < txEnd) return { valid: false, kind: 'overlap' as const, safeStart, message: '接收窗口与发射重叠：强发射信号可能使接收链饱和或损坏。' };
  if (t.rxStartUs < safeStart) return { valid: false, kind: 'ringdown' as const, safeStart, message: '发射已结束，但仍在设定的恢复期：线圈振铃和接收器恢复可能遮住弱信号。' };
  return { valid: true, kind: 'ready' as const, safeStart, message: '在这个简化模型中，接收避开了发射和恢复期。真正的死时间仍需测量。' };
}
export function createPhantom(size = 32): number[] {
  return Array.from({ length: size * size }, (_, i) => {
    const x = (i % size + .5 - size / 2) / (size / 2), y = (Math.floor(i / size) + .5 - size / 2) / (size / 2);
    if ((x / .83) ** 2 + (y / .9) ** 2 > 1) return 0;
    let value = .35;
    if ((x / .72) ** 2 + (y / .79) ** 2 > 1) value = .8;
    if (((x + .28) / .23) ** 2 + ((y + .12) / .43) ** 2 < 1) value = .95;
    if (((x - .27) / .21) ** 2 + ((y - .12) / .39) ** 2 < 1) value = .65;
    if (((x + .25) / .08) ** 2 + ((y + .1) / .19) ** 2 < 1) value = .12;
    if (x > .14 && x < .5 && y > .37 && y < .45) value = .05;
    return value;
  });
}
export type SamplingMask = 'full' | 'lowpass' | 'alternate';
export function reconstructPhantom(size = 32, mode: SamplingMask = 'full', keepFraction = .4, noiseLevel = 0, scanFraction = 1) {
  const phantom = createPhantom(size);
  const spectrum = fft2D(phantom.map(re => ({ re, im: 0 })), size);
  const noise = gaussianNoise(), cutoff = Math.max(0, Math.floor(size / 2 * keepFraction));
  const acquiredRows = Math.max(0, Math.min(size, Math.round(size * scanFraction)));
  const mask = spectrum.map((_, i) => {
    const x = i % size, y = Math.floor(i / size), kx = x < size / 2 ? x : x - size, ky = y < size / 2 ? y : y - size;
    const rowOrder = (y + size / 2) % size;
    return rowOrder < acquiredRows && (mode === 'full' || (mode === 'lowpass' ? Math.abs(kx) <= cutoff && Math.abs(ky) <= cutoff : y % 2 === 0));
  });
  const sampled = spectrum.map((value, i) => {
    const re = value.re + noise() * noiseLevel * size, im = value.im + noise() * noiseLevel * size;
    return mask[i] ? { re, im } : { re: 0, im: 0 };
  });
  const complexImage = fft2D(sampled, size, true);
  const image = complexImage.map(v => Math.hypot(v.re, v.im));
  const rmse = Math.sqrt(image.reduce((sum, v, i) => sum + (v - phantom[i]) ** 2, 0) / image.length);
  return { phantom, spectrum, sampled, mask, image, rmse, acquiredRows, sampledCount: mask.filter(Boolean).length };
}
export function shiftedIndex(x: number, y: number, size: number) {
  return ((y + size / 2) % size) * size + (x + size / 2) % size;
}
