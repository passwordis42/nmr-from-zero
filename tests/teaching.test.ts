import { describe, expect, it } from 'vitest';
import { echoSequence, exponentialState, frequencyOffsetHz, inductionState, phaseEncodingRadians, populationState, precessionState, sliceSelection, spinEchoSignal, vectorProjection } from '../src/physics/teaching';

describe('分阶段教学模型', () => {
  it('固定显示倍率保留 B0 翻倍后的真实频率与转速比例', () => {
    const a = precessionState(50, .1), b = precessionState(100, .1);
    expect(a.frequencyHz).toBeCloseTo(2_128_873.946, 6);
    expect(b.frequencyHz / a.frequencyHz).toBe(2);
    expect(b.displayedHz / a.displayedHz).toBe(2);
    expect(a.y).toBeLessThan(0);
  });
  it('投影保持长度并区分 I 与 Q', () => {
    expect(vectorProjection(90).x).toBeCloseTo(0);
    expect(vectorProjection(90).y).toBeCloseTo(1);
    const v = vectorProjection(37, 2); expect(Math.hypot(v.x, v.y)).toBeCloseTo(2);
  });
  it('普通磁铁停住时通量非零，感应电压为零；反向移动反号', () => {
    expect(inductionState(.5).flux).toBeGreaterThan(0);
    expect(inductionState(.5).voltage).toBe(0);
    expect(inductionState(.175).voltage).toBeLessThan(0);
    expect(inductionState(.825).voltage).toBeGreaterThan(0);
    const p = .2, h = .00001;
    const numerical = -(inductionState(p + h).flux - inductionState(p - h).flux) / (16 * h);
    expect(inductionState(p).voltage).toBeCloseTo(numerical, 6);
  });
  it('通用指数在一个 T 后保留 1/e，恢复与衰减互补', () => {
    const v = exponentialState(4, 4); expect(v.decay).toBeCloseTo(Math.exp(-1));
    expect(v.decay + v.recovery).toBe(1);
  });
  it('空间梯度按位置产生频偏；相位随面积积累', () => {
    expect(frequencyOffsetHz(2, 10)).toBeCloseTo(851.5495784);
    expect(frequencyOffsetHz(2, -10)).toBeCloseTo(-851.5495784);
    expect(phaseEncodingRadians(2, 10, 2)).toBeCloseTo(2 * phaseEncodingRadians(2, 10, 1));
  });
  it('固定 RF 带宽时梯度翻倍使层厚减半，频偏移动层中心', () => {
    const a = sliceSelection(2, 500, 1000), b = sliceSelection(4, 500, 1000);
    expect(b.thicknessMm).toBeCloseTo(a.thicknessMm / 2);
    expect(a.centreMm).toBeGreaterThan(0);
  });
  it('TE 等于 2τ，TR 从一次 90° 到下次 90°', () => {
    expect(echoSequence(20, 300)).toMatchObject({ pulse180Ms: 20, echoMs: 40, next90Ms: 300, valid: true });
    expect(echoSequence(20, 30).valid).toBe(false);
  });
  it('短 TR 偏向较短 T1，长 TE 偏向较长 T2', () => {
    expect(spinEchoSignal(300, 0, 400, 80)).toBeGreaterThan(spinEchoSignal(300, 0, 1000, 80));
    expect(spinEchoSignal(3000, 100, 400, 150)).toBeGreaterThan(spinEchoSignal(3000, 100, 400, 50));
  });
  it('净磁化示意保留双向群体，零偏置时总和为零', () => {
    expect(populationState(0).net).toBe(0);
    expect(populationState(3)).toMatchObject({ parallel: 27, antiparallel: 21, net: 6 });
  });
});
