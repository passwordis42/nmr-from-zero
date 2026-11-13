import { describe, expect, it } from 'vitest';
import { larmorHz, flipAngleDegrees, rotatingFrameVector, ensembleSignal, transverseDecay, longitudinalRecovery, aliasedFrequency, fft, fft2D, reconstructPhantom, fieldStatistics, capacitanceForFrequencyPf, lcFrequencyHz, checkTiming } from '../src/physics/models';

describe('氢核与旋转坐标', () => {
  it('50 mT 对应约 2.128874 MHz，单位换算正确', () => expect(larmorHz(50) / 1e6).toBeCloseTo(2.128873946, 8));
  it('同向旋转的 B1 分量产生预期的翻转角', () => {
    const b1 = 1e6 / (4 * 42.57747892e6 * 100e-6);
    expect(flipAngleDegrees(b1, 100)).toBeCloseTo(90, 10);
    expect(rotatingFrameVector(90, 0, 0)[1]).toBeCloseTo(1, 10);
    expect(rotatingFrameVector(180, 0, 0)[2]).toBeCloseTo(-1, 10);
  });
  it('自由进动保持磁化长度', () => expect(Math.hypot(...rotatingFrameVector(72, 17, 33))).toBeCloseTo(1, 10));
});
describe('弛豫和回波', () => {
  it('在 2τ 静态频偏重新聚相，幅度仍受 T2 限制', () => {
    const tau = 40, t2 = 200;
    const echo = ensembleSignal(2 * tau, tau, t2, 80);
    expect(echo.re).toBeCloseTo(Math.exp(-80 / 200), 10);
    expect(echo.im).toBeCloseTo(0, 10);
    expect(echo.re).toBeGreaterThan(Math.abs(ensembleSignal(2 * tau - 8, tau, t2, 80).re));
    expect(echo.re).toBeGreaterThan(Math.abs(ensembleSignal(2 * tau + 8, tau, t2, 80).re));
    expect(Math.abs(ensembleSignal(2 * tau, tau, t2, 80, false).re)).toBeLessThan(.01);
  });
  it('T2 衰减和 T1 恢复是不同过程', () => {
    expect(transverseDecay(200, 200)).toBeCloseTo(1 / Math.E, 10);
    expect(longitudinalRecovery(200, 200)).toBeCloseTo(1 - 1 / Math.E, 10);
    expect(longitudinalRecovery(0, 200)).toBe(0);
  });
});
describe('采样与傅里叶变换', () => {
  it('高于奈奎斯特的实信号折叠到低频', () => {
    expect(aliasedFrequency(45, 64)).toBe(19);
    expect(aliasedFrequency(128 + 7, 64)).toBe(7);
    expect(aliasedFrequency(8, 64)).toBe(8);
  });
  it('FFT 与逆 FFT 保留复数和相位', () => {
    const original = Array.from({ length: 16 }, (_, i) => ({ re: Math.sin(i * .4), im: Math.cos(i * .7) }));
    const result = fft(fft(original), true);
    result.forEach((v, i) => { expect(v.re).toBeCloseTo(original[i].re, 10); expect(v.im).toBeCloseTo(original[i].im, 10); });
    expect(() => fft([{ re: 1, im: 0 }, { re: 2, im: 0 }, { re: 3, im: 0 }])).toThrow();
  });
  it('已知三周期余弦只落在正负第 3 个频点', () => {
    const spectrum = fft(Array.from({ length: 16 }, (_, i) => ({ re: Math.cos(2 * Math.PI * 3 * i / 16), im: 0 })));
    spectrum.forEach((v, i) => {
      expect(v.re).toBeCloseTo(i === 3 || i === 13 ? 8 : 0, 10);
      expect(v.im).toBeCloseTo(0, 10);
    });
  });
  it('二维 FFT 往返和完全采样重建一致', () => {
    const values = Array.from({ length: 64 }, (_, i) => ({ re: i / 64, im: 0 }));
    fft2D(fft2D(values, 8), 8, true).forEach((v, i) => expect(v.re).toBeCloseTo(values[i].re, 10));
    expect(reconstructPhantom(32).rmse).toBeLessThan(1e-12);
  });
  it('低通实际丢掉高频，隔行采样实际产生误差', () => {
    const full = reconstructPhantom(32), low = reconstructPhantom(32, 'lowpass', .25), alternate = reconstructPhantom(32, 'alternate');
    expect(low.sampledCount).toBeLessThan(full.sampledCount);
    expect(low.rmse).toBeGreaterThan(.03);
    expect(alternate.rmse).toBeGreaterThan(.03);
    expect(low.sampled[16 * 32 + 16]).toEqual({ re: 0, im: 0 });
    expect(low.sampled[0].re).toBeCloseTo(full.sampled[0].re, 8);
  });
  it('噪声固定种子可复现；逐行采样有真实数据变化', () => {
    expect(reconstructPhantom(16, 'full', 1, .03).image).toEqual(reconstructPhantom(16, 'full', 1, .03).image);
    expect(reconstructPhantom(32, 'full', 1, 0, .5).sampledCount).toBe(512);
  });
});
describe('工程教学模型', () => {
  it('缩小测量区域、校正线性项会改善这个示例的均匀性', () => {
    expect(fieldStatistics(100, 0).peakToPeakPpm).toBeLessThan(fieldStatistics(200, 0).peakToPeakPpm);
    expect(fieldStatistics(200, 1).peakToPeakPpm).toBeLessThan(fieldStatistics(200, 0).peakToPeakPpm);
  });
  it('LC 调谐反算一致', () => expect(lcFrequencyHz(8, capacitanceForFrequencyPf(8, larmorHz(50)))).toBeCloseTo(larmorHz(50), 6));
  it('线圈实验的所有电感设置都能在 100–3000 pF 内调谐', () => {
    for (let inductance = 2; inductance <= 20; inductance += .5) {
      const capacitance = Math.round(capacitanceForFrequencyPf(inductance, larmorHz(50)));
      expect(capacitance).toBeGreaterThanOrEqual(100);
      expect(capacitance).toBeLessThanOrEqual(3000);
    }
  });
  it('区分发射重叠、恢复期与正常接收', () => {
    const base = { txStartUs: 40, txDurationUs: 100, ringdownUs: 80, rxStartUs: 100, rxDurationUs: 300 };
    expect(checkTiming(base).kind).toBe('overlap');
    expect(checkTiming({ ...base, rxStartUs: 180 }).kind).toBe('ringdown');
    expect(checkTiming({ ...base, rxStartUs: 220 }).valid).toBe(true);
  });
});
