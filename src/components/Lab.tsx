import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import type { LabId } from '../types';
import type { ActivityHandle, LabSnapshot, SnapshotValue } from '../learning';
import { GAMMA_H_HZ_T, TAU, aliasedFrequency, capacitanceForFrequencyPf, checkTiming, ensembleSignal, fft, fieldErrorPpm, fieldStatistics, larmorHz, lcFrequencyHz, linspace, longitudinalRecovery, reconstructPhantom, resonatorResponse, rotatingFrameVector, shiftedIndex, transverseDecay, waveAt } from '../physics/models';
import type { SamplingMask, Vec3 } from '../physics/models';
import './labs.css';

const COLORS = { blue: '#386fb1', orange: '#c77932', teal: '#218e82', ink: '#173b3a', grey: '#7b8790' };
type Point = { x: number; y: number };
type Series = { label: string; color: string; values: Point[]; dashed?: boolean };
type SnapshotData = Omit<LabSnapshot, 'id' | 'title' | 'capturedAt'>;
type Playback = { progress: number; advanced: boolean; resetTime: () => void; mode?: string; report: (data: SnapshotData) => void };
function useReport(report: Playback['report'], parameters: SnapshotValue[], readings: SnapshotValue[], model: string, time: LabSnapshot['time'], view?: string) {
  useLayoutEffect(() => { report({ parameters, readings, model, time, view }); });
}
const descriptors: Record<LabId, { title: string; description: string }> = {
  waves: { title: '两列波，为什么会增强或消失？', description: '把频率和相位分开调。先看单条波，再看它们逐点相加的结果。' },
  spin: { title: '把磁化矢量翻过来', description: '静磁场决定共振频率，射频脉冲改变磁化方向。这里观察旋转坐标系中的净磁化。' },
  relaxation: { title: '散开的相位，能找回来多少？', description: '同一个样品里，不同频偏的自旋先散开，再被理想的 180° 脉冲重新聚相。' },
  sampling: { title: '电脑看到的频率，一定是真的吗？', description: '把连续波变成一串数字，再真正计算 FFT。采样太慢时，高频会伪装成低频。' },
  field: { title: '放得进去，不等于都能成像', description: '观察一个简化场图：缩小目标区域、补偿线性误差，分别怎样改变磁场均匀性。' },
  coil: { title: '把线圈调到正确的频率', description: '改变电感、电容与品质因数 Q，观察共振峰位置和带宽，而不只是追求更高的峰。' },
  timing: { title: '什么时候才可以开始接收？', description: '发射很强，核磁信号很弱。移动接收窗口，检查是否撞上发射脉冲或恢复期。' },
  imaging: { title: '从 k 空间，算回一张图', description: '左边是人工构造的已知模体，中间是真正的二维 FFT，右边是掩膜采样后的逆 FFT 重建。' },
};

function Slider({ label, value, min, max, step = 1, unit = '', onChange, disabled = false }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (n: number) => void; disabled?: boolean }) {
  const id = useId();
  return <label className="lab-slider" htmlFor={id}><span>{label}<output htmlFor={id}>{Number(value.toFixed(3))} <small>{unit}</small></output></span><input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => onChange(Number(e.target.value))} /><span className="lab-range-ends"><span>{min} {unit}</span><span>{max} {unit}</span></span></label>;
}
function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="lab-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
function Legend({ series }: { series: Pick<Series, 'label' | 'color' | 'dashed'>[] }) {
  return <div className="lab-legend">{series.map(s => <span key={s.label}><i style={{ borderColor: s.color, borderStyle: s.dashed ? 'dashed' : 'solid' }} />{s.label}</span>)}</div>;
}
function Plot({ series, xMin = 0, xMax, yMin = -1, yMax = 1, xLabel, yLabel, cursor, points = [], markers = [] }: { series: Series[]; xMin?: number; xMax: number; yMin?: number; yMax?: number; xLabel: string; yLabel: string; cursor?: number; points?: Point[]; markers?: { x: number; label: string; color?: string }[] }) {
  const width = 640, height = 260, left = 54, right = 24, top = 27, bottom = 44;
  const px = (x: number) => left + (x - xMin) / (xMax - xMin) * (width - left - right);
  const py = (y: number) => top + (yMax - y) / (yMax - yMin) * (height - top - bottom);
  const tick = (n: number) => Number(n.toFixed(Math.abs(n) < 3 ? 2 : 1)).toString();
  return <div className="lab-chart"><svg className="lab-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${yLabel}随${xLabel}的曲线`}><title>{`${yLabel}随${xLabel}的曲线`}</title>
    {linspace(yMin, yMax, 5).map((y, i) => <g key={`y${i}`}><line x1={left} x2={width - right} y1={py(y)} y2={py(y)} stroke="#e5ebe9" /><text x={left - 9} y={py(y) + 4} textAnchor="end">{tick(y)}</text></g>)}
    {linspace(xMin, xMax, 5).map((x, i) => <g key={`x${i}`}><line x1={px(x)} x2={px(x)} y1={top} y2={height - bottom} stroke="#edf0ef" /><text x={px(x)} y={height - bottom + 21} textAnchor="middle">{tick(x)}</text></g>)}
    <text x={left} y={15} className="lab-axis-label">{yLabel}</text><text x={width - right} y={height - 5} textAnchor="end" className="lab-axis-label">{xLabel}</text>
    {series.map(s => <path key={s.label} d={s.values.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(2)},${py(p.y).toFixed(2)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.label.includes('合成') ? 2.8 : 2} strokeDasharray={s.dashed ? '6 5' : undefined} />)}
    {markers.filter(m => m.x >= xMin && m.x <= xMax).map(m => <g key={m.label}><line x1={px(m.x)} x2={px(m.x)} y1={top} y2={height - bottom} stroke={m.color || COLORS.grey} strokeDasharray="4 4" /><text x={Math.min(width - 70, Math.max(left + 40, px(m.x)))} y={top + 15} textAnchor="middle" fill={m.color || COLORS.ink}>{m.label}</text></g>)}
    {points.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r="3.3" fill={COLORS.ink} stroke="white" strokeWidth=".6" />)}
    {cursor !== undefined && <line x1={px(cursor)} x2={px(cursor)} y1={top} y2={height - bottom} stroke={COLORS.ink} strokeWidth="1.5" strokeDasharray="3 3" />}
  </svg><Legend series={series} /></div>;
}

function WavesLab({ progress, resetTime, report }: Playback) {
  const [frequency, setFrequency] = useState(4), [phase, setPhase] = useState(0);
  const series = useMemo(() => {
    const times = linspace(0, 1, 501);
    return [
      { label: '波 A：4 Hz', color: COLORS.blue, values: times.map(x => ({ x, y: waveAt(x, 4) })) },
      { label: '波 B', color: COLORS.orange, values: times.map(x => ({ x, y: waveAt(x, frequency, phase) })), dashed: true },
      { label: '合成 A + B', color: COLORS.teal, values: times.map(x => ({ x, y: waveAt(x, 4) + waveAt(x, frequency, phase) })) },
    ];
  }, [frequency, phase]);
  const preset = (nextPhase: number) => { setFrequency(4); setPhase(nextPhase); resetTime(); };
  useReport(report, [{ label: '波 A 频率', value: 4, unit: 'Hz' }, { label: '波 B 频率', value: frequency, unit: 'Hz' }, { label: '波 B 初相位', value: phase, unit: '°' }], [{ label: '合成幅度', value: waveAt(progress, 4) + waveAt(progress, frequency, phase), unit: '相对单位' }], '两条等幅理想正弦逐点相加。', { value: progress, unit: 's' });
  return <><div className="lab-presets"><p>先预测，再对照：同频同幅时，相位会怎样改变合成波？</p><div role="group" aria-label="波叠加对照预设"><button type="button" aria-pressed={frequency === 4 && phase === 0} onClick={() => preset(0)}>同相 · 0°</button><button type="button" aria-pressed={frequency === 4 && phase === 180} onClick={() => preset(180)}>反相 · 180°</button></div></div><div className="lab-controls"><Slider label="波 B 的频率" value={frequency} min={1} max={12} unit="Hz" onChange={setFrequency} /><Slider label="波 B 的初始相位" value={phase} min={0} max={360} step={15} unit="°" onChange={setPhase} /></div><Plot series={series} xMax={1} yMin={-2.2} yMax={2.2} xLabel="时间 / s" yLabel="幅度 / 相对单位" cursor={progress} /><div className="lab-metrics"><Metric label="光标时刻" value={`${progress.toFixed(2)} s`} /><Metric label="这一刻的合成值" value={(waveAt(progress, 4) + waveAt(progress, frequency, phase)).toFixed(2)} /></div><p className="lab-observation"><b>试试看：</b>将频率设为 4 Hz，相位设为 180°，两列等幅波逐点抵消。频率不同，即使一开始同相，也会逐渐错开。</p><p className="lab-model-note">模型：理想正弦信号，幅度任意归一化。核磁中的“相位相干”同样取决于各信号的相对相位，但自旋并不是机械振动的小球。</p></>;
}

function SpinLab({ progress, report }: Playback) {
  const [b0, setB0] = useState(50), [flip, setFlip] = useState(90), [offset, setOffset] = useState(0);
  const marker = useId().replace(/:/g, '');
  const timeMs = progress * 200, vector = rotatingFrameVector(flip, offset, timeMs);
  useReport(report, [{ label: 'B₀', value: b0, unit: 'mT' }, { label: '翻转角', value: flip, unit: '°' }, { label: '频偏', value: offset, unit: 'Hz' }], [{ label: '拉莫尔频率', value: larmorHz(b0), unit: 'Hz' }, ...vector.map((value, i) => ({ label: ['Mx', 'My', 'Mz'][i], value, unit: 'M₀' }))], '旋转坐标系，正氢核 γ，dM/dt=γM×B；理想瞬时脉冲，无弛豫。', { value: timeMs, unit: 'ms' });
  const project = ([x, y, z]: Vec3) => [250 + 118 * x + 62 * y, 180 + 40 * y - 115 * z];
  const origin = project([0, 0, 0]), tip = project(vector);
  const axes: { v: Vec3; label: string }[] = [{ v: [1.2, 0, 0], label: '+x' }, { v: [0, 1.4, 0], label: '+y' }, { v: [0, 0, 1.2], label: '+z' }];
  const xyCircle = linspace(0, TAU, 81).map(t => project([Math.cos(t), Math.sin(t), 0]));
  return <><div className="lab-controls lab-controls-three"><Slider label="静磁场 B₀" value={b0} min={10} max={200} step={5} unit="mT" onChange={setB0} /><Slider label="理想射频翻转角" value={flip} min={0} max={180} step={15} unit="°" onChange={setFlip} /><Slider label="射频结束后的频偏 Δf" value={offset} min={-20} max={20} unit="Hz" onChange={setOffset} /></div>
    <div className="lab-spin-layout"><svg viewBox="0 0 470 290" className="lab-spin" role="img" aria-label={`旋转坐标系磁化矢量，Mx=${vector[0].toFixed(2)}，My=${vector[1].toFixed(2)}，Mz=${vector[2].toFixed(2)}`}><title>右手坐标系中的净磁化矢量</title><defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill={COLORS.teal} /></marker><marker id={`${marker}b`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill={COLORS.blue} /></marker></defs>
      <path d={xyCircle.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} stroke="#d7e3df" fill="#f0f6f3" />
      {axes.map(a => { const end = project(a.v); return <g key={a.label}><line x1={origin[0]} y1={origin[1]} x2={end[0]} y2={end[1]} stroke="#8b9a96" strokeDasharray="4 4" /><text x={end[0] + 8} y={end[1] + 5}>{a.label}</text></g>; })}
      <line x1="70" y1="180" x2="70" y2="65" stroke={COLORS.blue} strokeWidth="3" markerEnd={`url(#${marker}b)`} /><text x="32" y="45" fill={COLORS.blue}>B₀ 沿 +z</text>
      <line x1={origin[0]} y1={origin[1]} x2={tip[0]} y2={tip[1]} stroke={COLORS.teal} strokeWidth="5" markerEnd={`url(#${marker})`} /><circle cx={origin[0]} cy={origin[1]} r="4" fill={COLORS.ink} /><text x={tip[0] + 10} y={tip[1] - 8} fill={COLORS.teal}>M</text>
      <text x="24" y="262" fill={COLORS.orange}>B₁ 脉冲沿 +x，图中脉冲已结束</text>
    </svg><div className="lab-spin-readout"><Metric label="氢核共振频率 f₀" value={`${(larmorHz(b0) / 1e6).toFixed(6)} MHz`} /><Metric label="B₁ = 25 μT 时的理想脉冲时长" value={`${(flip / (360 * GAMMA_H_HZ_T * 25e-6) * 1e6).toFixed(1)} μs`} /><Metric label={`脉冲之后 ${timeMs.toFixed(0)} ms`} value={`M = (${vector.map(n => n.toFixed(2)).join(', ')})`} note="依次为 Mx、My、Mz，M₀ = 1" /></div></div>
    <p className="lab-observation"><b>试试看：</b>90° 时 M 落到横向平面；180° 时 M 指向 −z。频偏为 0 时，M 在这个坐标系里静止；把频偏调到 5 Hz，再播放。</p><p className="lab-model-note">约定：右手坐标，氢核 γ &gt; 0，dM/dt = γ M × B。沿 +x 的正 B₁ 将 +Mz 转向 +My。B₁ 指同向旋转分量；理想瞬时脉冲后只模拟频偏进动，不含弛豫。画面没有按真实 MHz 速度旋转。</p></>;
}

function RelaxationLab({ progress, report, mode, resetTime }: Playback) {
  type View = 'echo' | 'fid' | 't1' | 't2';
  const [view, setView] = useState<View>(mode === 't1t2' ? 't1' : mode === 'fid' ? 'fid' : 'echo');
  const [tau, setTau] = useState(40), [t2, setT2] = useState(200), [spread, setSpread] = useState(40), [t1, setT1] = useState(500);
  const end = view === 'echo' ? 2.8 * tau : view === 'fid' ? 150 : 3 * (view === 't1' ? t1 : t2);
  const labels: Record<View, string> = { echo: 'FID → 回波', fid: 'FID 与静态失相', t1: 'T₁ 恢复', t2: 'T₂ 衰减' };
  const allowed: View[] = mode === 't1t2' ? ['t1', 't2'] : mode === 'fid' ? ['fid'] : ['echo', 'fid', 't2', 't1'];
  const series: Series[] = useMemo(() => {
    const times = linspace(0, end, 361);
    if (view === 't1') return [{ label: '纵向磁化 Mz 恢复', color: COLORS.blue, values: times.map(x => ({ x, y: longitudinalRecovery(x, t1) })) }];
    if (view === 't2') return [{ label: '横向磁化的 T₂ 衰减', color: COLORS.orange, values: times.map(x => ({ x, y: transverseDecay(x, t2) })) }];
    const curves: Series[] = [{ label: 'FID 幅度：含静态频偏', color: COLORS.grey, values: times.map(x => { const s = ensembleSignal(x, tau, t2, spread, false); return { x, y: Math.hypot(s.re, s.im) }; }) }, { label: '仅不可逆 T₂ 衰减', color: COLORS.orange, dashed: true, values: times.map(x => ({ x, y: transverseDecay(x, t2) })) }];
    if (view === 'echo') curves.push({ label: '理想 180° 后的回波幅度', color: COLORS.teal, values: times.map(x => { const s = ensembleSignal(x, tau, t2, spread); return { x, y: Math.hypot(s.re, s.im) }; }) });
    return curves;
  }, [end, view, t1, tau, t2, spread]);
  const time = progress * end;
  const current = view === 't1' ? longitudinalRecovery(time, t1) : view === 't2' ? transverseDecay(time, t2) : (() => { const s = ensembleSignal(time, tau, t2, spread, view === 'echo'); return Math.hypot(s.re, s.im); })();
  const model = view === 't1' || view === 't2' ? '理想单组分单指数模型；T₁ 从 Mz=0 恢复，T₂ 不含静态频偏。' : `257 个高斯权重静态频偏群，独立 T₂ 包络；${view === 'echo' ? '理想瞬时 90°/180° 脉冲。' : '仅初始激励后的自由演化。'}不含扩散、交换或 B₁ 不均匀；不把此高斯 FID 强行当作单指数。`;
  useReport(report, view === 't1' ? [{ label: 'T₁', value: t1, unit: 'ms' }] : [{ label: 'T₂', value: t2, unit: 'ms' }, ...(view === 't2' ? [] : [{ label: '静态频偏标准差', value: spread, unit: 'Hz' }]), ...(view === 'echo' ? [{ label: 'τ', value: tau, unit: 'ms' }] : [])], [{ label: view === 't1' ? 'Mz/M₀' : '|Mxy|/M₀', value: current }, ...(view === 'echo' ? [{ label: '几何聚相时刻', value: 2 * tau, unit: 'ms' }] : [])], model, { value: time, unit: 'ms' }, labels[view]);
  return <>{allowed.length > 1 && <div className="lab-segment" role="group" aria-label="选择弛豫实验">{allowed.map(v => <button key={v} type="button" className={view === v ? 'is-active' : ''} onClick={() => { setView(v); resetTime(); }}>{labels[v]}</button>)}</div>}
    <div className={`lab-controls ${view === 'echo' ? 'lab-controls-three' : ''}`}>{view === 'echo' && <Slider label="180° 脉冲时刻 τ" value={tau} min={20} max={80} step={5} unit="ms" onChange={setTau} />}{view === 't1' ? <Slider label="纵向弛豫时间 T₁" value={t1} min={100} max={1500} step={100} unit="ms" onChange={setT1} /> : <Slider label="横向弛豫时间 T₂" value={t2} min={60} max={600} step={20} unit="ms" onChange={setT2} />}{(view === 'echo' || view === 'fid') && <Slider label="静态频偏分布宽度 σ" value={spread} min={0} max={100} step={5} unit="Hz" onChange={setSpread} />}</div>
    <Plot series={series} xMax={end} yMin={0} yMax={1.05} xLabel="时间 / ms" yLabel={view === 't1' ? 'Mz / M₀' : '|Mxy| / M₀'} cursor={time} markers={view === 'echo' ? [{ x: 0, label: '90° 激励', color: COLORS.orange }, { x: tau, label: '180° 脉冲', color: COLORS.orange }, { x: 2 * tau, label: '2τ 聚相', color: COLORS.teal }] : view === 'fid' ? [] : [{ x: view === 't1' ? t1 : t2, label: view === 't1' ? '1 × T₁' : '1 × T₂' }, { x: end, label: view === 't1' ? '3 × T₁' : '3 × T₂' }]} />
    <div className="lab-metrics"><Metric label="当前时刻" value={`${time.toFixed(1)} ms`} /><Metric label={view === 't1' ? '已恢复的纵向比例' : '剩余横向信号比例'} value={`${(100 * current).toFixed(1)}%`} />{view === 'echo' && <Metric label="2τ 处的理想剩余比例" value={`${(100 * transverseDecay(2 * tau, t2)).toFixed(1)}%`} />}{(view === 't1' || view === 't2') && <Metric label="1 个 / 3 个时间常数后" value={view === 't1' ? '63.2% / 95.0%' : '36.8% / 5.0%'} />}</div>
    <p className="lab-observation"><b>试试看：</b>{view === 'echo' ? '保持 T₂ 不变，增大静态频偏：FID 更快消失，但 2τ 处仍能聚相。缩短 T₂，回波也会变矮；幅度峰可能因包络衰减略早于 2τ。' : view === 'fid' ? '把频偏宽度先设为 0，再增大。相位散开使总信号额外变小，并不意味着每个磁矩同时消失；这里还没有施加再聚相脉冲。' : view === 't1' ? '在一个 T₁ 附近，恢复约 63.2%；三个 T₁ 后仍未完全恢复。改变 T₁ 后，同样恢复比例所需的时间改变。' : '一个 T₂ 后剩约 36.8%，三个 T₂ 后剩约 5%。这是横向磁化的衰减，不是纵向磁化的恢复。'}</p><p className="lab-model-note">模型：{model}</p></>;
}

function SamplingLab({ progress, resetTime, report, mode }: Playback) {
  const [frequency, setFrequency] = useState(45), [sampleRate, setSampleRate] = useState(64);
  const alias = aliasedFrequency(frequency, sampleRate), count = 64, duration = (count - 1) / sampleRate;
  const samples = Array.from({ length: count }, (_, i) => ({ x: i / sampleRate, y: Math.cos(TAU * frequency * i / sampleRate) }));
  const transformed = fft(samples.map(p => ({ re: p.y, im: 0 })));
  const spectrum = transformed.slice(0, count / 2 + 1).map((v, i) => ({ x: i * sampleRate / count, y: Math.hypot(v.re, v.im) / count * (i === 0 || i === count / 2 ? 1 : 2) }));
  const peak = spectrum.reduce((a, b) => b.y > a.y ? b : a);
  const times = linspace(0, duration, 901);
  const series = [{ label: '真实的连续余弦', color: COLORS.orange, values: times.map(x => ({ x, y: Math.cos(TAU * frequency * x) })) }, { label: '与采样点吻合的低频余弦', color: COLORS.blue, dashed: true, values: times.map(x => ({ x, y: Math.cos(TAU * alias * x) })) }];
  const preset = (nextRate: number) => { setFrequency(45); setSampleRate(nextRate); resetTime(); };
  useReport(report, [{ label: '输入频率', value: frequency, unit: 'Hz' }, { label: '采样率', value: sampleRate, unit: '次/s' }, { label: '采样点数', value: count }], [{ label: '折叠频率', value: alias, unit: 'Hz' }, ...(mode === 'time' ? [] : [{ label: 'FFT 峰频点', value: peak.x, unit: 'Hz' }])], '实数单通道余弦采样；不是直接采样 MHz 核磁射频。', { value: progress * duration, unit: 's' }, mode === 'time' ? '时域采样' : '时域与频域');
  return <><div className="lab-presets"><p>先预测，再对照：同一个 45 Hz 信号，采样率翻倍会怎样？</p><div role="group" aria-label="45 Hz 信号的采样率对照"><button type="button" aria-pressed={frequency === 45 && sampleRate === 64} onClick={() => preset(64)}>45 Hz · 64 次/秒</button><button type="button" aria-pressed={frequency === 45 && sampleRate === 128} onClick={() => preset(128)}>45 Hz · 128 次/秒</button></div></div><div className="lab-controls"><Slider label="输入信号频率" value={frequency} min={1} max={90} unit="Hz" onChange={setFrequency} /><Slider label="采样率 fₛ" value={sampleRate} min={16} max={128} step={8} unit="次 / s" onChange={setSampleRate} /></div>
    <Plot series={series} xMax={duration} yMin={-1.15} yMax={1.15} xLabel="时间 / s" yLabel="连续波与 64 个采样点" cursor={progress * duration} points={samples} />
    {mode !== 'time' && <Plot series={[{ label: '64 点 FFT 单边幅度', color: COLORS.teal, values: spectrum }]} xMax={sampleRate / 2} yMin={0} yMax={1.05} xLabel="频率 / Hz" yLabel="幅度 / 归一化" markers={[{ x: alias, label: `${alias.toFixed(1)} Hz` }]} />}
    <div className="lab-metrics"><Metric label="奈奎斯特频率 fₛ / 2" value={`${sampleRate / 2} Hz`} /><Metric label="折叠后频率" value={`${alias.toFixed(1)} Hz`} />{mode !== 'time' && <Metric label="实际 FFT 最大频点" value={`${peak.x.toFixed(1)} Hz`} note={`频点间隔 ${sampleRate / count} Hz`} />}</div>
    <p className="lab-observation"><b>试试看：</b>45 Hz 的信号以 64 次/秒采样，看起来像 19 Hz。仅凭这些点，无法知道它原来是 45 Hz；采样率翻倍后再比较。</p><p className="lab-model-note">演示实数、单通道、低频余弦采样；这里不直接采样 MHz 射频。{mode !== 'time' && '不整周期截取会产生频谱泄漏，FFT 峰值未必刚好落在理论频率。'}</p></>;
}

function fieldColor(ppm: number) {
  const amount = Math.min(1, Math.abs(ppm) / 2500);
  return `hsl(${ppm < 0 ? 211 : 30} ${45 + amount * 15}% ${96 - amount * 54}%)`;
}
function FieldLab({ progress, report }: Playback) {
  const [diameter, setDiameter] = useState(160), [correction, setCorrection] = useState(0);
  const stats = fieldStatistics(diameter, correction / 100), baseStats = fieldStatistics(diameter, 0);
  useReport(report, [{ label: '评估区域直径', value: diameter, unit: 'mm' }, { label: '线性补偿', value: correction, unit: '%' }], [{ label: '峰峰不均匀度', value: stats.peakToPeakPpm, unit: 'ppm' }, { label: '50 mT 下频率跨度', value: larmorHz(50) * stats.peakToPeakPpm * 1e-6, unit: 'Hz' }], '人为二维多项式场，不是 Halbach 仿真、三维 DSV 或漏磁范围。', { value: progress * 100, unit: '% 扫描进度' });
  const tiles = 32, px = (mm: number) => 190 + 1.2 * mm, py = (mm: number) => 153 - 1.2 * mm;
  return <><div className="lab-controls"><Slider label="目标圆形区域直径" value={diameter} min={40} max={200} step={10} unit="mm" onChange={setDiameter} /><Slider label="线性场误差补偿" value={correction} min={0} max={100} step={5} unit="%" onChange={setCorrection} /></div>
    <div className="lab-field-layout"><svg viewBox="0 0 390 325" className="lab-field" role="img" aria-label={`示例二维场图，目标直径${diameter}毫米，峰峰不均匀度${stats.peakToPeakPpm.toFixed(0)}ppm`}><title>示例二维场偏差，不是实际磁体的测量或仿真</title>
      {Array.from({ length: tiles * tiles }, (_, i) => { const ix = i % tiles, iy = Math.floor(i / tiles), x = -100 + (ix + .5) * 200 / tiles, y = 100 - (iy + .5) * 200 / tiles; return <rect key={i} x={70 + ix * 240 / tiles} y={33 + iy * 240 / tiles} width={240 / tiles + .2} height={240 / tiles + .2} fill={fieldColor(fieldErrorPpm(x, y, correction / 100))} />; })}
      <circle cx="190" cy="153" r={diameter * .6} fill="none" stroke={COLORS.ink} strokeWidth="2" strokeDasharray="6 3" />
      <line x1={px(-100 + progress * 200)} x2={px(-100 + progress * 200)} y1={py(100)} y2={py(-100)} stroke="white" strokeWidth="2" />
      <text x="70" y="19">场偏差 / ppm（固定色标）</text><text x="70" y="293">−100</text><text x="190" y="293" textAnchor="middle">0</text><text x="310" y="293" textAnchor="end">100 mm</text><text x="190" y="315" textAnchor="middle">虚线圆：当前评估区域</text>
    </svg><div className="lab-field-details"><div className="lab-colorbar" /><div className="lab-colorbar-labels"><span>−2500 ppm</span><span>0</span><span>+2500 ppm</span></div><Metric label="区域内峰峰场差 ΔB / B₀" value={`${stats.peakToPeakPpm.toFixed(0)} ppm`} /><Metric label="相应氢核频率跨度（50 mT）" value={`${(larmorHz(50) * stats.peakToPeakPpm * 1e-6 / 1000).toFixed(2)} kHz`} /><Metric label="相对同一区域、未补偿时" value={`改善 ${(100 * (1 - stats.peakToPeakPpm / baseStats.peakToPeakPpm)).toFixed(0)}%`} /><button type="button" className="lab-small-button" onClick={() => setCorrection(100)}>补偿所有线性项</button></div></div>
    <p className="lab-observation"><b>试试看：</b>补偿到 100% 后仍有颜色差，因为二次项还在。再缩小评估区域，数字会继续改善。因此“1000 ppm”必须同时说明在哪个体积、按什么指标测得。</p><p className="lab-model-note">模型：B 偏差由人为指定的线性与二次多项式计算，只显示二维截面；虚线不是三维 DSV、磁体净孔或漏磁边界。它不预测具体 Halbach 的重量、场分布或可用成像范围。</p></>;
}

function CoilLab({ progress, report }: Playback) {
  const [inductance, setInductance] = useState(8), [capacitance, setCapacitance] = useState(699), [q, setQ] = useState(60);
  const target = larmorHz(50), resonance = lcFrequencyHz(inductance, capacitance), bandwidth = resonance / q;
  const lower = Math.min(target, resonance) * .86, upper = Math.max(target, resonance) * 1.14;
  useReport(report, [{ label: 'L', value: inductance, unit: 'μH' }, { label: 'C', value: capacitance, unit: 'pF' }, { label: 'Q', value: q }], [{ label: '谐振频率', value: resonance, unit: 'Hz' }, { label: '近似带宽', value: bandwidth, unit: 'Hz' }, { label: '光标频率', value: lower + (upper - lower) * progress, unit: 'Hz' }], '理想 LC 和近谐振响应，不含寄生参数与阻抗匹配。', { value: progress * 100, unit: '% 扫频进度' });
  const points = [...linspace(lower, upper, 601), resonance].sort((a, b) => a - b).map(f => ({ x: f / 1e6, y: resonatorResponse(f, resonance, q) }));
  return <><div className="lab-controls lab-controls-three"><Slider label="线圈电感 L" value={inductance} min={2} max={20} step={.5} unit="μH" onChange={setInductance} /><Slider label="调谐电容 C" value={capacitance} min={100} max={3000} unit="pF" onChange={setCapacitance} /><Slider label="加载后的品质因数 Q" value={q} min={10} max={200} step={5} onChange={setQ} /></div>
    <Plot series={[{ label: '简化谐振响应', color: COLORS.teal, values: points }, { label: '−3 dB 幅度 ≈ 0.707', color: COLORS.grey, dashed: true, values: [{ x: lower / 1e6, y: Math.SQRT1_2 }, { x: upper / 1e6, y: Math.SQRT1_2 }] }]} xMin={lower / 1e6} xMax={upper / 1e6} yMin={0} yMax={1.1} xLabel="频率 / MHz" yLabel="相对幅度" cursor={(lower + (upper - lower) * progress) / 1e6} markers={[{ x: target / 1e6, label: '氢核 f₀', color: COLORS.blue }]} />
    <div className="lab-metrics"><Metric label="LC 共振频率" value={`${(resonance / 1e6).toFixed(4)} MHz`} /><Metric label="近似 −3 dB 带宽 f / Q" value={`${(bandwidth / 1000).toFixed(1)} kHz`} /><Metric label="目标频率" value={`${(target / 1e6).toFixed(4)} MHz`} note="氢核、50 mT" /></div>
    <button type="button" className="lab-small-button" onClick={() => setCapacitance(Math.round(capacitanceForFrequencyPf(inductance, target)))}>按当前电感，调谐到 50 mT 的氢核频率</button>
    <p className="lab-observation"><b>试试看：</b>调准中心频率后，提高 Q，峰会变窄。窄带有利于选择频率，但可能装不下激发带宽，而且振铃时间通常更长。</p><p className="lab-model-note">模型：理想 LC 与近共振单峰响应，幅度归一化。不模拟寄生参数、样品损耗或 50 Ω 阻抗匹配；“调谐到正确频率”和“匹配到 50 Ω”是两项不同的工作。</p></>;
}

function TimingLab({ progress, report }: Playback) {
  const [duration, setDuration] = useState(100), [ringdown, setRingdown] = useState(80), [receive, setReceive] = useState(240);
  const txStart = 40, txEnd = txStart + duration, result = checkTiming({ txStartUs: txStart, txDurationUs: duration, ringdownUs: ringdown, rxStartUs: receive, rxDurationUs: 300 });
  useReport(report, [{ label: '发射脉宽', value: duration, unit: 'μs' }, { label: '设定恢复期', value: ringdown, unit: 'μs' }, { label: '接收开始', value: receive, unit: 'μs' }], [{ label: '最早允许接收', value: result.safeStart, unit: 'μs' }, { label: '时序检查', value: result.message }], '单脉冲与固定接收窗，仅检查时间关系，不证明真实硬件保护合格。', { value: progress * 1000, unit: 'μs' });
  const x = (time: number) => 126 + time / 1000 * 480;
  const rows = [{ label: 'RF 发射', y: 50, start: txStart, end: txEnd, color: COLORS.orange }, { label: '保护 / 恢复', y: 112, start: txStart, end: result.safeStart, color: COLORS.grey }, { label: 'ADC 接收', y: 174, start: receive, end: receive + 300, color: result.valid ? COLORS.teal : '#ae4d43' }];
  return <><div className="lab-controls lab-controls-three"><Slider label="发射脉冲时长" value={duration} min={40} max={240} step={10} unit="μs" onChange={setDuration} /><Slider label="设定的发射后恢复期" value={ringdown} min={20} max={200} step={10} unit="μs" onChange={setRingdown} /><Slider label="接收开始时刻" value={receive} min={40} max={550} step={10} unit="μs" onChange={setReceive} /></div>
    <div className="lab-chart"><svg viewBox="0 0 640 275" className="lab-plot" role="img" aria-label={`收发时序图，${result.valid ? '未发现重叠' : '存在时序冲突'}`}><title>射频、接收保护和 ADC 的相对时序</title>{rows.map(r => <g key={r.label}><text x="10" y={r.y + 18}>{r.label}</text><line x1="126" x2="606" y1={r.y + 32} y2={r.y + 32} stroke="#cdd9d4" /><rect x={x(r.start)} y={r.y} width={x(r.end) - x(r.start)} height="32" rx="3" fill={r.color} opacity=".86" /><text x={x(r.start) + 5} y={r.y - 8}>{r.start}–{r.end} μs</text></g>)}<line x1={x(result.safeStart)} x2={x(result.safeStart)} y1="20" y2="222" stroke={COLORS.ink} strokeDasharray="4 4" /><line x1={x(progress * 1000)} x2={x(progress * 1000)} y1="20" y2="222" stroke={COLORS.blue} strokeWidth="2" />{[0, 250, 500, 750, 1000].map(t => <text key={t} x={x(t)} y="245" textAnchor="middle">{t}</text>)}<text x="606" y="267" textAnchor="end">时间 / μs</text></svg></div>
    <div className={`lab-status ${result.valid ? 'is-valid' : 'is-conflict'}`} role="status"><strong>{result.valid ? '✓ 时序检查通过' : '！发现时序冲突'}</strong><p>{result.message}</p></div>
    <div className="lab-metrics"><Metric label="模型允许的最早接收时刻" value={`${result.safeStart} μs`} /><Metric label="发射结束到接收的间隔" value={`${receive - txEnd} μs`} /></div>
    <p className="lab-observation"><b>试试看：</b>把接收窗口向左移动，依次进入恢复期和发射期。向右移也有代价：等待期间，短 T₂* 信号可能已经衰减。</p><p className="lab-model-note">模型：单脉冲、固定 300 μs 接收窗，恢复时间由你指定。仅检查时间重叠，不代表真实硬件保护合格；不含器件限幅、开关隔离度与功放门控条件。这不是可直接上机的序列。</p></>;
}

function PixelImage({ data, size, label, kspace = false, originalMax = 1 }: { data: number[]; size: number; label: string; kspace?: boolean; originalMax?: number }) {
  const pixel = 224 / size;
  return <figure className="lab-pixel-figure"><svg viewBox="0 0 224 224" role="img" aria-label={label}><title>{label}</title>{data.map((value, i) => { const intensity = Math.max(0, Math.min(1, kspace ? Math.log1p(value) / Math.log1p(originalMax) : value)); const grey = Math.round(intensity * 255); return <rect key={i} x={(i % size) * pixel} y={Math.floor(i / size) * pixel} width={pixel + .04} height={pixel + .04} fill={`rgb(${grey},${grey},${grey})`} />; })}</svg><figcaption>{label}</figcaption></figure>;
}
function ImagingLab({ progress, advanced, report }: Playback) {
  const [mode, setMode] = useState<SamplingMask>('full'), [fraction, setFraction] = useState(40), [noise, setNoise] = useState(0);
  const size = 32, scan = advanced ? progress : 1;
  const result = useMemo(() => reconstructPhantom(size, mode, fraction / 100, noise, scan), [mode, fraction, noise, scan]);
  useReport(report, [{ label: '采样掩膜', value: mode }, { label: '中心区域边长', value: fraction, unit: '%' }, { label: '噪声', value: noise }], [{ label: '已采样点', value: result.sampledCount }, { label: '已扫描行', value: result.acquiredRows }, { label: 'RMSE', value: result.rmse }], '32×32 人工模体，复数二维 FFT/逆 FFT；未采集补零，固定噪声种子。', { value: scan * 100, unit: '% 采集进度' });
  const rawMax = Math.max(...result.spectrum.map(v => Math.hypot(v.re, v.im)));
  const kspace = Array.from({ length: size * size }, (_, i) => { const v = result.sampled[shiftedIndex(i % size, Math.floor(i / size), size)]; return Math.hypot(v.re, v.im); });
  const selectedId = useId();
  return <><div className="lab-controls lab-controls-three"><label className="lab-select" htmlFor={selectedId}><span>保留哪些 k 空间点？</span><select id={selectedId} value={mode} onChange={e => setMode(e.target.value as SamplingMask)}><option value="full">完整采样</option><option value="lowpass">只保留中心区域</option><option value="alternate">每隔一行采样</option></select></label><Slider label="中心区域边长比例" value={fraction} min={10} max={100} step={5} unit="%" disabled={mode !== 'lowpass'} onChange={setFraction} /><Slider label="测量噪声强度" value={noise} min={0} max={.1} step={.005} onChange={setNoise} /></div>
    <div className="lab-images"><PixelImage data={result.phantom} size={size} label="① 已知模体 · 32 × 32" /><PixelImage data={kspace} size={size} label="② 已采集 k 空间 · 对数幅度" kspace originalMax={rawMax} /><PixelImage data={result.image} size={size} label="③ 逆 FFT · 幅度图" /></div>
    <div className="lab-metrics"><Metric label="实际保留的采样点" value={`${result.sampledCount} / ${size * size}`} /><Metric label="已扫描行数" value={`${result.acquiredRows} / ${size}`} note="播放后逐行采集并重新计算图像" /><Metric label="相对已知模体的 RMSE" value={result.rmse.toFixed(4)} note="误差越小，越接近原始模体" /></div>
    <p className="lab-observation"><b>试试看：</b>完整采样且没有噪声时，逆变换恢复原模体。只留中心会模糊边缘，隔行采样会出现折叠。按播放，观察不完整的 k 空间如何逐行变成图像。</p><p className="lab-model-note">模型：人工二维模体、笛卡尔采样、单线圈、真实复数 FFT / 逆 FFT；未采集处补零。显示对数幅度便于看 k 空间，但重建仍保留复数相位。噪声使用固定种子，便于复现比较。未模拟 T₁/T₂ 对比、梯度误差、场不均匀或真实样品组织。</p></>;
}

const components: Record<LabId, ComponentType<Playback>> = { waves: WavesLab, spin: SpinLab, relaxation: RelaxationLab, sampling: SamplingLab, field: FieldLab, coil: CoilLab, timing: TimingLab, imaging: ImagingLab };
const Lab = forwardRef<ActivityHandle, { id: LabId; mode?: string }>(function Lab({ id, mode }, ref) {
  const [progress, setProgress] = useState(0), [running, setRunning] = useState(false), [advanced, setAdvanced] = useState(false), [resetKey, setResetKey] = useState(0);
  const timelineId = useId();
  const snapshot = useRef<SnapshotData>({ parameters: [], readings: [], model: '' });
  const report = useCallback((data: SnapshotData) => { snapshot.current = data; }, []);
  useEffect(() => { setProgress(0); setRunning(false); setAdvanced(false); }, [id, mode]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setProgress(current => Math.min(1, current + 1 / 120)), 50);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => { if (progress >= 1) setRunning(false); }, [progress]);
  const Component = components[id], descriptor = id === 'sampling' && mode === 'time' ? { title: '把连续波变成采样点', description: '先只看时间与电压：改变采样率，比较同一组点可能代表的不同连续波。' } : id === 'relaxation' && mode === 't1t2' ? { title: '恢复与衰减：两个方向的变化', description: '纵向恢复与横向衰减各有自己的时间常数。先分开观察。' } : id === 'relaxation' && mode === 'fid' ? { title: '为什么刚收到的信号很快变小？', description: '比较不可逆的横向衰减与静态频偏造成的相位散开。' } : descriptors[id];
  useImperativeHandle(ref, () => ({ pause: () => setRunning(false), getSnapshot: () => ({ id, title: descriptor.title, capturedAt: new Date().toISOString(), ...snapshot.current }) }), [id, descriptor.title]);
  const resetTime = () => { setRunning(false); setProgress(0); setAdvanced(false); };
  const reset = () => { resetTime(); setResetKey(k => k + 1); };
  const seek = (value: number) => { setRunning(false); setAdvanced(true); setProgress(value); };
  return <section className="lab-surface" aria-label={descriptor.title}>
    <div className="lab-heading"><span className="lab-kicker"><i /> 教学模拟</span><h3>{descriptor.title}</h3><p>{descriptor.description}</p></div>
    <div className="lab-transport"><div className="lab-transport-buttons"><button type="button" className="lab-play" aria-label={running ? '暂停实验动画' : '播放实验动画'} onClick={() => { if (progress >= 1) setProgress(0); setAdvanced(true); setRunning(v => !v); }}>{running ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{running ? '暂停' : '播放'}</button><button type="button" aria-label="实验动画前进一步" onClick={() => { setRunning(false); setAdvanced(true); setProgress(p => Math.min(1, p + .05)); }}><StepForward size={14} aria-hidden="true" />单步</button><button type="button" aria-label="重置实验参数和动画" onClick={reset}><RotateCcw size={14} aria-hidden="true" />重置</button></div><div className="lab-timeline"><div className="lab-timeline-label"><label htmlFor={timelineId}>拖动演示时间</label><output htmlFor={timelineId}>{(progress * 100).toFixed(1)}%</output></div><input id={timelineId} type="range" min={0} max={1} step={.001} value={progress} aria-label="演示时间进度，拖动或使用方向键调整并暂停" aria-valuetext={`${(progress * 100).toFixed(1)}% 的演示时间`} onPointerDown={() => setRunning(false)} onKeyDown={() => setRunning(false)} onChange={e => seek(Number(e.target.value))} /><span className="lab-playback-label">{running ? '正在演示' : progress >= 1 ? '演示完成' : advanced ? '已暂停' : '可随时开始'}<span className="lab-progress-track" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></span></span></div></div>
    <div className="lab-body"><Component key={`${id}-${mode}-${resetKey}`} progress={progress} advanced={advanced} resetTime={resetTime} mode={mode} report={report} /></div>
  </section>;
});
export default Lab;
