import { GAMMA_H_HZ_T, TAU, larmorHz } from './models';

/** Fixed time scaling: changing B0 changes both the measured and displayed rate. */
export const PRECESSION_TIME_SCALE = 5_000_000;
export function precessionState(b0MilliTesla: number, displaySeconds: number, tiltDegrees = 55) {
  const frequencyHz = larmorHz(b0MilliTesla), displayedHz = frequencyHz / PRECESSION_TIME_SCALE;
  const angle = -TAU * displayedHz * displaySeconds, tilt = tiltDegrees * Math.PI / 180;
  return { frequencyHz, displayedHz, angle, x: Math.sin(tilt) * Math.cos(angle), y: Math.sin(tilt) * Math.sin(angle), z: Math.cos(tilt) };
}
export function vectorProjection(angleDegrees: number, magnitude = 1) {
  const angle = angleDegrees * Math.PI / 180;
  return { x: magnitude * Math.cos(angle), y: magnitude * Math.sin(angle) };
}
export function exponentialState(time: number, constant: number) {
  const decay = Math.exp(-Math.max(0, time) / constant);
  return { decay, recovery: 1 - decay };
}
/** Ordinary moving-magnet induction, arbitrary flux units, eight display seconds. */
export function inductionState(progress: number) {
  const p = Math.max(0, Math.min(1, progress)), duration = 8;
  let distance = .6, velocity = 0;
  const smooth = (u: number) => u * u * (3 - 2 * u);
  if (p < .35) { const u = p / .35; distance = 2.5 - 1.9 * smooth(u); velocity = -1.9 * 6 * u * (1 - u) / (.35 * duration); }
  else if (p > .65) { const u = (p - .65) / .35; distance = .6 + 1.9 * smooth(u); velocity = 1.9 * 6 * u * (1 - u) / (.35 * duration); }
  const flux = (1 + distance * distance) ** -1.5;
  const voltage = 3 * distance * (1 + distance * distance) ** -2.5 * velocity;
  return { distance, velocity, flux, voltage, phase: p < .35 ? '靠近' : p <= .65 ? '停住' : '离开' };
}
/** Only the frequency offset from a uniform B0; mT/m and mm converted to SI. */
export const frequencyOffsetHz = (gradientMilliTeslaPerMetre: number, positionMm: number) =>
  GAMMA_H_HZ_T * gradientMilliTeslaPerMetre * 1e-3 * positionMm * 1e-3;
/** Positive proton gamma, dM/dt = gamma M cross B; angle decreases about +z. */
export const phaseEncodingRadians = (gradientMilliTeslaPerMetre: number, positionMm: number, durationMs: number) =>
  -TAU * frequencyOffsetHz(gradientMilliTeslaPerMetre, positionMm) * durationMs / 1000;
export function sliceSelection(gradientMilliTeslaPerMetre: number, offsetHz: number, bandwidthHz: number) {
  const slopeHzPerMm = frequencyOffsetHz(gradientMilliTeslaPerMetre, 1);
  return { centreMm: offsetHz / slopeHzPerMm, thicknessMm: Math.abs(bandwidthHz / slopeHzPerMm), slopeHzPerMm };
}
export function echoSequence(tauMs: number, trMs: number) {
  return { pulse90Ms: 0, pulse180Ms: tauMs, echoMs: 2 * tauMs, next90Ms: trMs, valid: trMs > 2 * tauMs };
}
/** Ideal spin echo, equal proton density, no flow, diffusion, or imperfect pulses. */
export const spinEchoSignal = (trMs: number, teMs: number, t1Ms: number, t2Ms: number, density = 1) =>
  density * (1 - Math.exp(-trMs / t1Ms)) * Math.exp(-teMs / t2Ms);
/** Fixed illustrative populations; count exaggerates the tiny thermal imbalance. */
export function populationState(excessPairs: number) {
  const count = 48, parallel = 24 + excessPairs, antiparallel = count - parallel;
  return { count, parallel, antiparallel, net: parallel - antiparallel, fraction: (parallel - antiparallel) / count };
}
