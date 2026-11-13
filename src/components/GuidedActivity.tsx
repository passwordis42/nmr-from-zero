import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { ActivityHandle, GuidedId, LabSnapshot, SnapshotValue } from '../learning';
import { linspace, TAU } from '../physics/models';
import { echoSequence, exponentialState, frequencyOffsetHz, inductionState, phaseEncodingRadians, populationState, precessionState, PRECESSION_TIME_SCALE, sliceSelection, spinEchoSignal, vectorProjection } from '../physics/teaching';
import './guided-activity.css';

const C = { b: '#386fb1', rf: '#c77932', m: '#218e82', ink: '#173b3a', muted: '#84938e' };
const titles: Record<GuidedId, string> = {
  apparatus: '先找到真实物体与测量位置', 'signal-path': '从磁场到电脑：追踪作用路径', 'measurement-cycle': '一次测量，按什么顺序发生？', induction: '磁通改变，线圈才产生感应电压', vectors: '一个箭头，两个投影', exponential: '用一个时间常数，比较恢复与衰减', precession: '在实验室里观察进动', 'net-magnetization': '许多核的贡献，怎样形成净磁化？', iq: '同时记录两个正交投影', 'frequency-encoding': '位置不同，频率不同', 'phase-encoding': '梯度关掉后，相位标签还在', 'slice-selection': '用频率窗口选中一层', 'echo-sequence': '分清 τ、TE 与 TR 的起止点', contrast: '同样两个材料，亮暗可以改变',
};
const defaults: Record<GuidedId, number[]> = {
  apparatus: [], 'signal-path': [], 'measurement-cycle': [], induction: [], vectors: [35, 1], exponential: [2], precession: [50, 55], 'net-magnetization': [3], iq: [0, 1], 'frequency-encoding': [1, 10], 'phase-encoding': [.5, 2], 'slice-selection': [2, 0, 1000], 'echo-sequence': [20, 240], contrast: [600, 30],
};
const cycleLabels = ['准备：样品准备好', '发送：短暂作用', '恢复：等待电路安静', '接收：记录电压', '重复前：等待样品恢复'];
const cycleStarts = [0, .2, .3, .42, .7];
const cycleIndex = (p: number) => p < .2 ? 0 : p < .3 ? 1 : p < .42 ? 2 : p < .7 ? 3 : 4;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const n = (label: string, value: number | string, unit?: string): SnapshotValue => ({ label, value: typeof value === 'number' ? Number(value.toFixed(6)) : value, ...(unit ? { unit } : {}) });

function Control({ label, value, min, max, step = 1, unit = '', change }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; change: (value: number) => void }) {
  const id = useId();
  return <label className="guided-control" htmlFor={id}><span>{label}<output htmlFor={id}>{Number(value.toFixed(3))} {unit}</output></span><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => change(Number(e.target.value))} /><small>{min}–{max} {unit}</small></label>;
}
function Arrow({ x, y, dx, dy, color = C.m, width = 3 }: { x: number; y: number; dx: number; dy: number; color?: string; width?: number }) {
  const length = Math.hypot(dx, dy); if (length < .001) return <circle cx={x} cy={y} r="3" fill={color} />;
  const ux = dx / length, uy = dy / length, tipX = x + dx, tipY = y + dy, head = Math.min(10, length * .35);
  return <g><line x1={x} y1={y} x2={tipX} y2={tipY} stroke={color} strokeWidth={width} /><polygon points={`${tipX},${tipY} ${tipX - head * ux - head * .45 * uy},${tipY - head * uy + head * .45 * ux} ${tipX - head * ux + head * .45 * uy},${tipY - head * uy - head * .45 * ux}`} fill={color} /></g>;
}
function Plane({ x, y, label = 'M', axisX = 'x', axisY = 'y', projections = true }: { x: number; y: number; label?: string; axisX?: string; axisY?: string; projections?: boolean }) {
  const ox = 170, oy = 150, scale = 95;
  return <svg viewBox="0 0 340 295" className="guided-graphic guided-plane" role="img" aria-label={`${label} 的 ${axisX} 投影 ${x.toFixed(2)}，${axisY} 投影 ${y.toFixed(2)}`}><circle cx={ox} cy={oy} r={scale} fill="#f6f8f5" stroke="#dce5df" /><Arrow x={45} y={oy} dx={250} dy={0} color={C.muted} width={1} /><Arrow x={ox} y={275} dx={0} dy={-250} color={C.muted} width={1} /><text x="303" y="155">{axisX}</text><text x="180" y="30">{axisY}</text>{projections && <><line x1={ox + scale * x} x2={ox + scale * x} y1={oy} y2={oy - scale * y} stroke={C.rf} strokeDasharray="4 4" /><line x1={ox} x2={ox + scale * x} y1={oy - scale * y} y2={oy - scale * y} stroke={C.b} strokeDasharray="4 4" /><Arrow x={ox} y={oy} dx={scale * x} dy={0} color={C.b} /><Arrow x={ox} y={oy} dx={0} dy={-scale * y} color={C.rf} /></>}<Arrow x={ox} y={oy} dx={scale * x} dy={-scale * y} /><text x={clamp(ox + scale * x + 10, 20, 308)} y={clamp(oy - scale * y - 10, 20, 280)}>{label}</text></svg>;
}
type Curve = { label: string; color: string; values: { x: number; y: number }[]; dashed?: boolean };
function Chart({ curves, maxX, minY = -1.1, maxY = 1.1, xLabel, yLabel, cursor, marks = [] }: { curves: Curve[]; maxX: number; minY?: number; maxY?: number; xLabel: string; yLabel: string; cursor?: number; marks?: { x: number; label: string }[] }) {
  const px = (x: number) => 50 + x / maxX * 560, py = (y: number) => 35 + (maxY - y) / (maxY - minY) * 170;
  return <div className="guided-chart"><svg viewBox="0 0 640 260" className="guided-graphic" role="img" aria-label={`${yLabel} 随 ${xLabel} 变化`}>
    {linspace(minY, maxY, 5).map((y, i) => <g key={i}><line x1="50" x2="610" y1={py(y)} y2={py(y)} stroke="#e1e8e2" /><text x="42" y={py(y) + 4} textAnchor="end">{Number(y.toFixed(2))}</text></g>)}
    {linspace(0, maxX, 5).map((x, i) => <text key={i} x={px(x)} y="227" textAnchor="middle">{Number(x.toFixed(2))}</text>)}<text x="50" y="19">{yLabel}</text><text x="610" y="251" textAnchor="end">{xLabel}</text>
    {curves.map(c => <path key={c.label} d={c.values.map((v, i) => `${i ? 'L' : 'M'}${px(v.x)},${py(v.y)}`).join(' ')} stroke={c.color} strokeWidth="2.5" strokeDasharray={c.dashed ? '5 4' : undefined} fill="none" />)}
    {marks.map(m => <g key={m.label}><line x1={px(m.x)} x2={px(m.x)} y1="35" y2="205" stroke={C.muted} strokeDasharray="3 4" /><text x={Math.min(570, px(m.x) + 5)} y="49">{m.label}</text></g>)}{cursor !== undefined && <line x1={px(cursor)} x2={px(cursor)} y1="35" y2="205" stroke={C.ink} strokeDasharray="3 3" />}
  </svg><div className="guided-legend">{curves.map(c => <span key={c.label}><i style={{ background: c.color }} />{c.label}</span>)}</div></div>;
}

const apparatusItems = [
  ['sample', '样品', '水或油里的大量氢核会对磁场作出响应；样品本身不会直接输出一张图片。'],
  ['magnet', '主磁体', '提供持续的磁场。准备、发送、接收和等待时，这个磁场都存在。'],
  ['coil', '样品周围的线圈', '这段绕着样品的导线可以先发送短电信号，再接收样品响应带来的微弱电压。'],
  ['voltage', '线圈端电压', '真正测量的是线圈两根引线之间的电压。图中的 V 标出这两根线之间的测量位置。'],
  ['circuit', '收发与接收电路', '切换发送和接收，保护接收电路，再把微弱电压放大并记录下来。'],
  ['computer', '电脑', '显示随时间变化的一串数字。经过后面的分析，才能得到测量结果或图像。'],
];
const pathItems = [
  ['field', '持续磁场作用于样品', '主磁体在样品处提供持续的磁场，让氢核处于可以开展这项测量的环境中。'],
  ['moment', '氢核的整体磁性', '样品里的大量氢核共同表现出微小的整体磁性；并不是每个核都整齐地朝同一方向。'],
  ['drive', '线圈短暂发送', '电路让线圈短暂发送电信号，改变氢核的整体磁性。主磁体提供的磁场仍然存在。'],
  ['response', '样品继续回应', '停止发送后，氢核的整体磁性仍继续变化，让周围的线圈产生微弱电压。'],
  ['pickup', '两根引线间的电压被记录', '线圈两根引线之间的电压被接收电路放大、记录，再交给电脑；这时得到的是一串数字。'],
];
function Apparatus({ selected, cycle, path, layered = false, earlyReceive = false }: { selected: string; cycle?: number; path?: number; layered?: boolean; earlyReceive?: boolean }) {
  const highlight = (id: string) => selected === id || selected === 'circuit' && id === 'receiver';
  const tx = cycle === 1 || path === 2, rx = cycle === (earlyReceive ? 2 : 3) || path === 4;
  const obscured = earlyReceive && cycle === 2;
  const level = layered ? Math.max(0, ['sample', 'magnet', 'coil', 'circuit', 'voltage', 'computer'].indexOf(selected)) : 5;
  return <svg viewBox="0 0 700 310" className="guided-graphic guided-apparatus" role="img" aria-label={`仪器示意，当前观察${selected}`}>
    {level >= 1 && <g><rect x="20" y="40" width="330" height="230" rx="6" fill="#f1f5f2" stroke={highlight('magnet') ? C.b : '#cad9d2'} strokeWidth={highlight('magnet') ? 3 : 1} /><text x="35" y="28">主磁体及内部空间</text><Arrow x={65} y={225} dx={0} dy={-125} color={C.b} /><text x="35" y="80" style={{ fill: C.b }}>持续磁场</text></g>}
    {level >= 2 && <g><ellipse cx="220" cy="150" rx="70" ry="56" fill="none" stroke={highlight('coil') || tx ? C.rf : '#b2a18b'} strokeWidth="6" /><text x="220" y="235" textAnchor="middle">样品周围的线圈</text></g>}
    <rect x="197" y="117" width="46" height="65" rx="8" fill="#e6f3ee" stroke={highlight('sample') ? C.m : '#87b4a5'} strokeWidth={highlight('sample') ? 3 : 1} /><text x="220" y="155" textAnchor="middle">样品</text>
    {level === 0 && <g><text x="320" y="140">先放入一小瓶水或油。</text><text x="320" y="170">它是我们要研究的对象。</text></g>}
    {level >= 3 && <g><path d="M275 115H355V130H430M275 185H355V170H430" stroke={C.ink} strokeWidth="2" fill="none" /><rect x="430" y="100" width="115" height="100" rx="5" fill={highlight('receiver') ? '#e3efe9' : '#f8faf7'} stroke={highlight('receiver') ? C.m : '#b9cbc1'} strokeWidth="2" /><text x="487" y="130" textAnchor="middle">发送 / 接收切换</text><text x="487" y="153" textAnchor="middle">放大 · 记录</text><text x="487" y="180" textAnchor="middle">{tx ? '正在发送' : obscured ? '残余遮盖回应' : rx ? '记录电压' : '电子电路'}</text></g>}
    {level >= 4 && <g><circle cx="355" cy="130" r="4" fill={C.ink} /><circle cx="355" cy="170" r="4" fill={C.ink} /><line x1="375" x2="375" y1="130" y2="170" stroke={highlight('voltage') ? C.m : C.muted} strokeWidth="2" /><circle cx="375" cy="150" r="13" fill="white" stroke={highlight('voltage') ? C.m : C.muted} strokeWidth="2" /><text x="375" y="155" textAnchor="middle">V</text><text x="343" y="218">两根引线之间</text></g>}
    {level >= 5 && <g><line x1="545" x2="580" y1="150" y2="150" stroke={rx ? C.m : C.muted} strokeWidth="2" /><rect x="580" y="112" width="100" height="76" rx="4" fill="#f5f8f4" stroke={highlight('computer') ? C.m : '#b9cbc1'} strokeWidth="2" /><path d={obscured ? "M590 151L600 122L610 180L620 126L630 175L640 132L650 167L668 151" : "M590 151L600 139L610 165L620 137L630 161L640 144L650 156L668 151"} stroke={obscured ? C.rf : rx ? C.m : '#adbcb4'} strokeWidth="2" fill="none" /><text x="630" y="214" textAnchor="middle">电脑：数字波形</text></g>}
    {tx && <Arrow x={420} y={85} dx={-130} dy={0} color={C.rf} />}{rx && <Arrow x={295} y={85} dx={125} dy={0} color={C.m} />}
    {!layered && <text x="22" y="297">{tx ? '橙色：电路向线圈发送电信号；此时不接收。' : obscured ? '已经开始记录，但橙色电路残余遮住了微弱的样品回应。' : rx ? '青色：记录样品响应；测量的是线圈两根引线之间的电压。' : '蓝色箭头：磁场持续存在；只有对应阶段才发送或记录电信号。'}</text>}
  </svg>;
}

function CycleReception({ early, active }: { early: boolean; active: number }) {
  const labels = ['准备', '发送', '电路恢复', '正常接收', '再次准备'];
  const windowIndex = early ? 2 : 3;
  const points = linspace(0, 1, 241).map(t => {
    const sample = (early ? .18 : .12) * Math.exp(-t * .9) * Math.cos(TAU * 4 * t);
    const residue = (early ? .85 : .012) * Math.exp(-t * 1.7) * Math.sin(TAU * 7 * t);
    return { t, sample, residue, recorded: sample + residue };
  });
  const path = (key: 'sample' | 'residue' | 'recorded') => points.map((p, i) => `${i ? 'L' : 'M'}${30 + p.t * 580},${85 - p[key] * 65}`).join(' ');
  return <div className={`guided-reception ${early ? 'is-early' : ''}`}>
    <h4>把记录时间放在哪里？</h4>
    <svg viewBox="0 0 640 115" className="guided-graphic" role="img" aria-label={early ? '接收窗口落在电路恢复期' : '接收窗口位于电路恢复之后'}>
      {labels.map((label, i) => <g key={label}><rect x={25 + i * 118} y="10" width="114" height="35" rx="3" fill={i === active ? '#e3efe5' : '#f3f6f0'} stroke={i === active ? C.m : '#d9e2d7'} /><text x={82 + i * 118} y="32" textAnchor="middle">{label}</text></g>)}
      <rect x={25 + windowIndex * 118} y="57" width="114" height="27" rx="3" fill={early ? C.rf : C.m} />
      <text x={82 + windowIndex * 118} y="76" textAnchor="middle" style={{ fill: 'white' }}>在这里记录</text>
      <text x="25" y="107">按阶段排列，不代表真实时长；主磁体的磁场一直存在。</text>
    </svg>
    <svg viewBox="0 0 640 165" className="guided-graphic" role="img" aria-label={early ? '记录电压主要被电路残余遮盖，样品回应已经存在' : '较晚窗口中电路残余已减弱，样品回应较容易辨认'}>
      <text x="30" y="18">所选窗口里可能记录到的电压 · 示意</text><line x1="30" x2="610" y1="85" y2="85" stroke="#dbe4da" />
      <path d={path('residue')} fill="none" stroke={C.rf} strokeWidth="2" /><path d={path('recorded')} fill="none" stroke={C.ink} strokeWidth="2" /><path d={path('sample')} fill="none" stroke={C.m} strokeWidth="2.5" strokeDasharray="5 3" />
      <text x="610" y="155" textAnchor="end">窗口内，时间向右前进</text>
    </svg>
    <div className="guided-legend"><span><i style={{ background: C.m }} />样品已经产生的回应</span><span><i style={{ background: C.rf }} />电路自身的残余</span><span><i style={{ background: C.ink }} />两者混在一起的记录</span></div>
    <p role="status" className="guided-reception-feedback">{early ? '过早接收：样品已经有回应，但电路残余把它遮住了，这段记录不能直接当成可信的样品信号。' : '正确顺序：先等电路残余减弱，再记录，更容易辨认样品回应。等待中样品回应也会变弱，因此真实等待时间仍要测量。'}</p>
    <small>曲线由示意的两种衰减振荡相加得到，只说明遮盖关系，不提供实机电压、延迟或通过数值。</small>
  </div>;
}

type Props = { id: GuidedId; focus?: string };
const GuidedSession = forwardRef<ActivityHandle, Props>(function GuidedSession({ id, focus }, ref) {
  const [progress, setProgress] = useState(0), [running, setRunning] = useState(false), [params, setParams] = useState(defaults[id]);
  const [curveView, setCurveView] = useState<'all' | 'decay' | 'recovery'>('all');
  const [earlyReceive, setEarlyReceive] = useState(false);
  const timeline = useId(), snapshot = useRef<LabSnapshot>({ id, title: titles[id], capturedAt: '', parameters: [], readings: [], model: '' });
  const change = (i: number, value: number) => { setRunning(false); if (id === 'exponential' && i === 0) setProgress(p => Math.min(1, p * params[0] / value)); setParams(p => p.map((v, j) => i === j ? value : v)); };
  const select = (i: number) => { setRunning(false); setProgress(id === 'measurement-cycle' ? cycleStarts[i] : i / (id === 'apparatus' ? 5 : 4)); };
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setProgress(p => Math.min(1, p + 1 / 160)), 50);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => { if (progress >= 1) setRunning(false); }, [progress]);
  useEffect(() => {
    if (!focus) return;
    setRunning(false);
    const aliases: Record<string, string> = { terminals: 'voltage', receiver: 'circuit', prepare: 'ready', excite: id === 'signal-path' ? 'drive' : 'transmit', field: id === 'apparatus' ? 'magnet' : 'field', receive: id === 'signal-path' ? 'pickup' : 'receive', data: 'pickup' };
    const key = aliases[focus] || focus;
    const keys = id === 'apparatus' ? apparatusItems.map(v => v[0]) : id === 'signal-path' ? pathItems.map(v => v[0]) : id === 'measurement-cycle' ? ['ready', 'transmit', 'recover', 'receive', 'repeat'] : [];
    const index = keys.indexOf(key);
    if (index >= 0) { setProgress(id === 'measurement-cycle' ? cycleStarts[index] : index / Math.max(1, keys.length - 1)); return; }
    if (id === 'echo-sequence') { const events: Record<string, number> = { pulse90: 0, pulse180: params[0] / params[1], echo: 2 * params[0] / params[1], te: 2 * params[0] / params[1], tr: 1, repeat: 1 }; if (key in events) { setProgress(events[key]); return; } }
    const positions: Record<string, number> = { start: 0, approach: .175, still: .5, stop: .5, withdraw: .825, one: 1 / 3, three: 1, x: 0, y: .25, i: 0, q: .25, pulse90: 0, pulse180: .25, echo: .5, repeat: 1, before: 0, during: .3, after: .8 };
    if (key in positions) setProgress(positions[key]);
  }, [focus, id]);
  useImperativeHandle(ref, () => ({ pause: () => setRunning(false), getSnapshot: () => ({ ...snapshot.current, capturedAt: new Date().toISOString() }) }), []);
  let controls: ReactNode = null, figure: ReactNode = null, explanation = '', model = '', view = '';
  let parameters: SnapshotValue[] = [], readings: SnapshotValue[] = [], time = { value: progress * 8, unit: '演示 s' };
  const control = (i: number, label: string, min: number, max: number, step: number, unit: string) => <Control label={label} value={params[i]} min={min} max={max} step={step} unit={unit} change={v => change(i, v)} />;

  if (id === 'apparatus' || id === 'signal-path' || id === 'measurement-cycle') {
    const items = id === 'apparatus' ? apparatusItems : id === 'signal-path' ? pathItems : cycleLabels.map((label, i) => [String(i), label, '']);
    const focusAliases: Record<string, string> = { terminals: 'voltage', receiver: 'circuit', prepare: 'ready', excite: id === 'signal-path' ? 'drive' : 'transmit', receive: id === 'signal-path' ? 'pickup' : 'receive', data: 'pickup' };
    const focusKeys = id === 'measurement-cycle' ? ['ready', 'transmit', 'recover', 'receive', 'repeat'] : items.map(v => v[0]);
    const focusIndex = focus ? focusKeys.indexOf(focusAliases[focus] || focus) : -1;
    const active = focusIndex >= 0 ? focusIndex : id === 'measurement-cycle' ? cycleIndex(progress) : Math.min(items.length - 1, Math.floor(progress * items.length));
    const selectedObject = id === 'apparatus' ? items[active][0] : id === 'signal-path' ? ['magnet', 'sample', 'coil', 'sample', 'voltage'][active] : ['magnet', 'coil', 'circuit', 'voltage', 'sample'][active];
    controls = focus ? null : <div className="guided-choices" role="group" aria-label="选择物体或阶段">{items.map((v, i) => <button key={v[0]} type="button" aria-pressed={active === i} onClick={() => select(i)}>{i + 1}. {v[1]}</button>)}</div>;
    figure = <><Apparatus selected={selectedObject} layered={id === 'apparatus' && !!focus} cycle={id === 'measurement-cycle' ? active : undefined} earlyReceive={id === 'measurement-cycle' && !focus && earlyReceive} path={id === 'signal-path' ? active : undefined} />{id === 'measurement-cycle' && !focus && <div className="guided-cycle">{cycleLabels.map((label, i) => <div key={label} className={active === i ? 'is-active' : ''}><b>{i + 1}</b>{label}</div>)}</div>}</>;
    explanation = id === 'measurement-cycle' ? ['先让样品准备好，再开始一次实验。这是样品状态的准备，和发送后等待电路安静是两件事。', '短暂向线圈发送电信号，此时不接收。主磁体的磁场仍然存在，磁体没有被关掉。', '发送结束后，线圈和电路还没有立刻安静下来，需要稍等再记录。这段等待期间，样品的一部分回应也可能变弱。', '在规定的接收时间里，记录线圈两根引线之间的电压。电脑显示它随时间怎样变化。', '记录结束不意味着样品已经恢复。再次测量之前，还要按样品和实验目标安排等待；它不同于刚才发送后短暂等待电路安静。'][active] : items[active][2];
    view = items[active][1]; readings = [n('当前对象或阶段', view), n('主磁体的磁场', '持续存在'), n('测量位置', '线圈两根引线之间')];
    if (id === 'measurement-cycle' && !focus) {
      const chooseReception = (early: boolean) => { setRunning(false); setEarlyReceive(early); setProgress(early ? .35 : .5); };
      controls = <>{controls}<div className="guided-choices guided-reception-choices" role="group" aria-label="比较接收安排"><button type="button" aria-pressed={earlyReceive} onClick={() => chooseReception(true)}>试试过早接收</button><button type="button" aria-pressed={!earlyReceive} onClick={() => chooseReception(false)}>恢复正确顺序</button></div></>;
      figure = <>{figure}<CycleReception early={earlyReceive} active={active} /></>;
      parameters = [n('是否提前接收', earlyReceive ? '是' : '否'), n('接收安排', earlyReceive ? '电路恢复期就开始' : '电路恢复后再开始')];
      readings.push(n('所选接收窗口的可靠性', earlyReceive ? '不能可靠辨认样品回应：电路残余遮盖' : '示意中可辨认；实机仍需测量验证'), n('样品何时回应', '发送后已经开始，并不等到接收才出现'));
      if (earlyReceive) explanation = '样品在发送结束后已经开始回应；过早记录时，电路还没有安静下来，它自己的残余电压可能遮住样品的微弱回应。不是样品还没有信号。主磁体的磁场一直存在。恢复正确顺序后，再比较较晚窗口里的记录。';
    }
    model = focus ? '逐步认识对象与作用的示意图；不是装配图、接线图或真实测量记录。' : '功能与顺序示意，不是接线图；元件形状、时间比例和电压曲线不是实机参数。同一线圈通过电路切换，可以先发送，再接收。';
  } else if (id === 'induction') {
    const state = inductionState(progress), times = linspace(0, 8, 241);
    controls = <div className="guided-choices" role="group" aria-label="选择磁铁运动阶段">{[['靠近', .175], ['停住', .5], ['离开', .825]].map(([label, value]) => <button type="button" key={label} onClick={() => { setRunning(false); setProgress(Number(value)); }}>{label}</button>)}</div>;
    figure = <><svg viewBox="0 0 640 190" className="guided-graphic" role="img" aria-label={`普通磁铁${state.phase}，感应电压${state.voltage.toFixed(3)}相对单位`}><rect x={60 + (2.5 - state.distance) * 85} y="60" width="90" height="45" fill="#d2dfeb" stroke={C.b} /><text x={80 + (2.5 - state.distance) * 85} y="88">S　　N</text>{[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={385 + i * 8} cy="82" rx="20" ry="47" fill="none" stroke={C.rf} strokeWidth="3" />)}<path d="M425 45H530V65M425 120H530V100" stroke={C.ink} fill="none" /><circle cx="530" cy="82" r="23" stroke={C.m} fill="#f4faf6" /><text x="530" y="87" textAnchor="middle">V</text><text x="95" y="150">普通条形磁铁 · {state.phase}</text><text x="365" y="150">线圈</text><text x="485" y="150">两端电压</text></svg><Chart curves={[{ label: '穿过线圈的磁通 Φ', color: C.b, values: times.map(x => ({ x, y: inductionState(x / 8).flux })) }, { label: '感应电压 −dΦ/dt', color: C.m, values: times.map(x => ({ x, y: inductionState(x / 8).voltage })) }]} maxX={8} minY={-.5} maxY={.8} xLabel="演示时间 / s" yLabel="磁通与电压 / 各自相对单位" cursor={progress * 8} /></>;
    view = state.phase; readings = [n('运动阶段', state.phase), n('磁通', state.flux, '相对单位'), n('感应电压', state.voltage, '相对单位')];
    explanation = '先预测停住时电压会不会保持。磁铁停住后，磁通仍不为零，但磁通变化率为零，电压回到零；离开时运动反向，电压反号。';
    model = '普通电磁感应演示，不涉及核磁共振。用平滑移动和简化距离函数计算磁通，再解析求导得到电压；单匝、归一化单位，正负号依赖端子约定。';
  } else if (id === 'vectors' || id === 'iq') {
    const degrees = params[0] + progress * 360, v = vectorProjection(degrees, params[1]), iq = id === 'iq';
    controls = <div className="guided-controls">{control(0, iq ? '初始相位' : '起始角度', 0, 360, 5, '°')}{control(1, '箭头长度', .2, 1, .1, '相对单位')}</div>;
    figure = <div className="guided-two-columns"><Plane x={v.x} y={v.y} label={iq ? '信号' : '向量'} axisX={iq ? 'I' : 'x'} axisY={iq ? 'Q' : 'y'} projections={iq || focus !== 'vector'} />{(iq || focus !== 'vector') && <Chart curves={[{ label: iq ? 'I = A cos φ' : 'x = A cos θ', color: C.b, values: linspace(0, 360, 181).map(x => ({ x, y: vectorProjection(x + params[0], params[1]).x })) }, { label: iq ? 'Q = A sin φ' : 'y = A sin θ', color: C.rf, values: linspace(0, 360, 181).map(x => ({ x, y: vectorProjection(x + params[0], params[1]).y })) }]} maxX={360} xLabel="累计显示转角 / °" yLabel="投影 / 相对单位" cursor={progress * 360} />}</div>;
    parameters = [n('初始角度', params[0], '°'), n('长度', params[1], '相对单位')]; readings = [n('当前角度', degrees, '°'), n(iq ? 'I' : 'x', v.x), n(iq ? 'Q' : 'y', v.y)]; time = { value: progress * 360, unit: '° 累计转角' }; view = iq ? 'I/Q 双投影' : focus === 'vector' ? '向量的长度与方向' : '向量及坐标投影';
    explanation = iq ? 'I 和 Q 同时描述同一个信号的两种正交投影。I 相同而 Q 不同时，信号的相位可以不同；两路一起保留幅度与相位信息。' : '箭头长度不变，投影却随角度变化。指向竖直时，水平投影为零；越过竖直方向后，水平投影变成负数。';
    model = iq ? '理想基带双投影，约定 I=A cosφ、Q=A sinφ；真实接收器的 Q 符号依混频约定，需要校准。此处没有模拟 MHz 载波或电子混频器。' : '二维几何投影；角度从 +x 朝 +y 增加。它是数学工具，不把核自旋解释为机械小球。';
  } else if (id === 'exponential') {
    const constant = params[0], end = 3 * constant, current = exponentialState(progress * end, constant), times = linspace(0, end, 181);
    const curve = focus === 'decay' || focus === 'recovery' ? focus : curveView;
    controls = <><div className="guided-choices" role="group" aria-label="选择指数变化">{!focus && (['all', 'decay', 'recovery'] as const).map(v => <button type="button" key={v} aria-pressed={curve === v} onClick={() => { setRunning(false); setCurveView(v); }}>{v === 'all' ? '两条一起对照' : v === 'decay' ? '只看衰减' : '只看恢复'}</button>)}</div><div className="guided-controls">{control(0, '时间常数 T', .5, 5, .5, 's')}<div className="guided-choices"><button type="button" onClick={() => { setRunning(false); setProgress(1 / 3); }}>看到 1 × T</button><button type="button" onClick={() => { setRunning(false); setProgress(1); }}>看到 3 × T</button></div></div></>;
    figure = <Chart curves={[{ label: '剩余量 exp(−t/T)', color: C.rf, values: times.map(x => ({ x, y: exponentialState(x, constant).decay })) }, { label: '恢复量 1−exp(−t/T)', color: C.m, values: times.map(x => ({ x, y: exponentialState(x, constant).recovery })) }].filter((_, i) => curve === 'decay' ? i === 0 : curve === 'recovery' ? i === 1 : true)} maxX={end} minY={0} maxY={1.05} xLabel="时间 / s" yLabel="归一化数量" cursor={progress * end} marks={[{ x: constant, label: '1 × T' }, { x: 3 * constant, label: '3 × T' }]} />;
    time = { value: progress * end, unit: 's' }; parameters = [n('时间常数 T', constant, 's')]; readings = [n('剩余量', current.decay * 100, '%'), n('已恢复量', current.recovery * 100, '%')]; view = curve === 'decay' ? '单指数衰减' : curve === 'recovery' ? '单指数恢复' : '恢复与衰减对照';
    explanation = '一个时间常数后，衰减剩 36.8%，恢复完成 63.2%。它每经过相同时间缩小相同比例，不是每秒减去同一个数量。';
    model = '通用单指数数学模型，初值 1 或 0；这里的 T 尚不代表某一种核磁弛豫时间。横轴随 T 调整到三个时间常数。';
  } else if (id === 'precession') {
    const s = precessionState(params[0], progress * 8, params[1]), project = (x: number, y: number, z: number) => ({ x: 310 + 135 * x + 65 * y, y: 205 + 42 * y - 130 * z }), tip = project(s.x, s.y, s.z);
    controls = <div className="guided-controls">{control(0, '静磁场 B₀', 10, 100, 5, 'mT')}{control(1, '初始倾角', 20, 90, 5, '°')}<div className="guided-choices"><button type="button" onClick={() => change(0, 25)}>B₀ = 25 mT</button><button type="button" onClick={() => change(0, 50)}>B₀ = 50 mT</button></div></div>;
    const orbit = linspace(0, TAU, 121).map(a => project(Math.sin(params[1] * Math.PI / 180) * Math.cos(a), Math.sin(params[1] * Math.PI / 180) * Math.sin(a), s.z));
    figure = <svg viewBox="0 0 640 330" className="guided-graphic" role="img" aria-label={`实验室系进动，实际频率${s.frequencyHz.toFixed(0)}Hz，显示频率${s.displayedHz.toFixed(3)}转每秒`}><path d={orbit.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')} fill="none" stroke="#b8d4c9" strokeDasharray="5 4" />{[[1.3, 0, 0, '+x'], [0, 1.5, 0, '+y'], [0, 0, 1.3, '+z']].map(([x, y, z, label]) => { const p = project(Number(x), Number(y), Number(z)); return <g key={String(label)}><Arrow x={310} y={205} dx={p.x - 310} dy={p.y - 205} color={C.muted} width={1} /><text x={p.x + 8} y={p.y}>{label}</text></g>; })}<Arrow x={105} y={205} dx={0} dy={-130} color={C.b} /><text x="70" y="52" style={{ fill: C.b }}>B₀ 沿 +z</text><Arrow x={310} y={205} dx={tip.x - 310} dy={tip.y - 205} width={5} /><text x={tip.x + 10} y={tip.y - 8}>M</text><text x="55" y="305">实验室坐标系固定；从 +z 朝原点看，正氢核 γ 的进动为顺时针。</text></svg>;
    parameters = [n('B₀', params[0], 'mT'), n('倾角', params[1], '°'), n('固定时间慢放倍率', PRECESSION_TIME_SCALE)]; readings = [n('真实拉莫尔频率', s.frequencyHz / 1e6, 'MHz'), n('显示转速', s.displayedHz, '转/s')];
    explanation = '把 B₀ 从 25 mT 改到 50 mT：真实读数和屏幕转速都翻倍。B₀ 决定进动速度，不是在这里把箭头越拉越长。';
    model = '实验室系，右手坐标，dM/dt=γM×B，氢核 γ>0；初始给定倾角，不演示激励过程。时间固定慢放 500 万倍，无弛豫。没有使用跟着转动的坐标系。';
  } else if (id === 'net-magnetization') {
    const pop = populationState(params[0]), counted = Math.round(progress * pop.count);
    controls = <div className="guided-controls">{control(0, '示意的向上人数偏置', 0, 6, 1, '对')}<p className="guided-small">每加 1 对：一个向下改为向上，总差额增加 2。</p></div>;
    const directions = Array.from({ length: 48 }, (_, i) => (i * 17 % 48) < pop.parallel ? 1 : -1);
    const partial = directions.slice(0, counted).reduce((a, b) => a + b, 0);
    figure = <svg viewBox="0 0 640 330" className="guided-graphic" role="img" aria-label={`${pop.parallel}个向上、${pop.antiparallel}个向下投影，净差${pop.net}`}><Arrow x={35} y={260} dx={0} dy={-175} color={C.b} /><text x="15" y="55">B₀</text>{directions.map((d, i) => <g key={i} opacity={i < counted ? 1 : .35}><circle cx={95 + i % 8 * 42} cy={67 + Math.floor(i / 8) * 40} r="17" fill={i < counted ? '#edf5ef' : '#f8faf7'} /><Arrow x={95 + i % 8 * 42} y={67 + Math.floor(i / 8) * 40 + d * 10} dx={0} dy={-d * 20} color={d > 0 ? C.m : C.muted} width={2} /></g>)}<text x="455" y="85">向上 {pop.parallel}</text><text x="455" y="113">向下 {pop.antiparallel}</text><text x="455" y="150">总差额 {pop.net}</text><Arrow x={500} y={255} dx={0} dy={-pop.net * 7} color={C.m} width={5} /><text x="440" y="300">净磁化是总体差额</text></svg>;
    parameters = [n('总示意数量', 48), n('偏置', params[0], '对')]; readings = [n('向上投影', pop.parallel), n('向下投影', pop.antiparallel), n('最终差额', pop.net), n('当前已计数', counted), n('当前累计差额', partial)];
    explanation = '播放会逐个计数。向上和向下都很多，净磁化来自小小的数量差。偏置设为零时，图中仍有磁矩贡献，但总体差额为零。';
    model = '用两种 z 投影状态作数量示意，48 个箭头与偏置被大幅夸张；真实热平衡偏置远小于此图。不是所有核朝同一方向，也不是描述每个核的经典轨迹或机械转动。';
  } else if (id === 'frequency-encoding' || id === 'phase-encoding') {
    const phase = id === 'phase-encoding', gradient = params[0], position = phase ? 10 : params[1], duration = phase ? params[1] : 10, elapsed = phase ? progress * duration * 3 : progress * 10;
    const positionA = phase ? -position : -position / 2;
    const applied = phase ? Math.min(elapsed, duration) : elapsed, fA = frequencyOffsetHz(gradient, positionA), fB = frequencyOffsetHz(gradient, position), angleA = phaseEncodingRadians(gradient, positionA, applied), angleB = phaseEncodingRadians(gradient, position, applied);
    controls = <div className="guided-controls">{control(0, '梯度强度 G', 0, phase ? 1 : 3, .1, 'mT/m')}{phase ? control(1, '梯度打开时长', .5, 5, .5, 'ms') : control(1, '位置 B 的坐标（A 在 −B/2）', 2, 20, 2, 'mm')}</div>;
    figure = <><div className="guided-location-strip"><span>A：{positionA} mm</span><span>中心：0 mm</span><span>B：+{position} mm</span></div><div className="guided-two-columns"><div><Plane x={Math.cos(angleA)} y={Math.sin(angleA)} label="位置 A" /><p className="guided-centre">A 当前频偏 {(phase && elapsed >= duration ? 0 : fA).toFixed(1)} Hz</p></div><div><Plane x={Math.cos(angleB)} y={Math.sin(angleB)} label="位置 B" /><p className="guided-centre">B 当前频偏 {(phase && elapsed >= duration ? 0 : fB).toFixed(1)} Hz</p></div></div>{phase ? <div className="guided-gate"><span>梯度 G</span><div><i style={{ width: '33.333%' }} /><b style={{ left: `${progress * 100}%` }} /></div><span>{elapsed < duration ? '打开：相位差正在积累' : '关闭：相位差保留'}</span></div> : <Chart curves={[{ label: '位置 A 的投影', color: C.b, values: linspace(0, 10, 401).map(x => ({ x, y: Math.cos(TAU * fA * x / 1000) })) }, { label: '位置 B 的投影', color: C.rf, values: linspace(0, 10, 401).map(x => ({ x, y: Math.cos(TAU * fB * x / 1000) })) }]} maxX={10} xLabel="时间 / ms" yLabel="基带投影 / 相对单位" cursor={elapsed} />}</>;
    time = { value: elapsed, unit: 'ms' }; parameters = [n('梯度', gradient, 'mT/m'), n('位置 A', positionA, 'mm'), n('位置 B', position, 'mm'), ...(phase ? [n('梯度时长', duration, 'ms')] : [])]; readings = [n('A 频偏', phase && elapsed >= duration ? 0 : fA, 'Hz'), n('B 频偏', phase && elapsed >= duration ? 0 : fB, 'Hz'), n('相位差 B−A（不折回）', (angleB - angleA) * 180 / Math.PI, '°')]; view = phase ? elapsed < duration ? '梯度打开' : '梯度关闭、保留相位' : '读出梯度持续打开';
    explanation = phase ? '先播放到梯度结束，再单步：两位置不再因这个梯度继续分开转，但已经积累的相位差保留下来。改强度或时长都会改相位标签。' : '相同的主磁场上叠加位置相关的小变化，就有位置相关频率。正负频偏表示相对中心参考转动的方向；A 在 −B/2，因此此例两条波的快慢也不同。';
    model = '两个理想点、线性梯度、均匀 B₀，无弛豫或扩散；显示相对中心频率的参考坐标系。Δf=(γ/2π)Gx，φ=−2πΔf·t。'+ (phase ? '梯度后假定无其他频偏。' : '两条曲线初相位相同；仅一个实数余弦不能分辨频偏正负，箭头保留了转动方向。');
  } else if (id === 'slice-selection') {
    const [gradient, offset, bandwidth] = params, s = sliceSelection(gradient, offset, bandwidth), low = s.centreMm - s.thicknessMm / 2, high = s.centreMm + s.thicknessMm / 2;
    controls = <div className="guided-controls">{control(0, '选层梯度', .5, 5, .5, 'mT/m')}{control(1, 'RF 中心相对频偏', -1500, 1500, 100, 'Hz')}{control(2, 'RF 激发带宽', 200, 2000, 100, 'Hz')}</div>;
    const position = -40 + progress * 80, selected = position >= low && position <= high;
    figure = <svg viewBox="0 0 640 300" className="guided-graphic" role="img" aria-label={`选层中心${s.centreMm.toFixed(1)}毫米，厚度${s.thicknessMm.toFixed(1)}毫米`}><text x="50" y="25">位置与共振频偏一一对应；橙色带为 RF 频率窗口对应的位置</text><rect x="60" y="90" width="520" height="100" fill="#f1f5f2" stroke="#c5d7cc" /><rect x={60 + (clamp(low, -40, 40) + 40) / 80 * 520} y="90" width={Math.max(0, (clamp(high, -40, 40) - clamp(low, -40, 40)) / 80 * 520)} height="100" fill={C.rf} opacity=".35" /><line x1={60 + (position + 40) / 80 * 520} x2={60 + (position + 40) / 80 * 520} y1="65" y2="205" stroke={selected ? C.m : C.b} strokeWidth="3" />{[-40, -20, 0, 20, 40].map(x => <g key={x}><text x={60 + (x + 40) / 80 * 520} y="225" textAnchor="middle">{x} mm</text><text x={60 + (x + 40) / 80 * 520} y="253" textAnchor="middle">{frequencyOffsetHz(gradient, x).toFixed(0)} Hz</text></g>)}<text x="60" y="285">扫描位置：{position.toFixed(1)} mm → {selected ? '在理想激发带内' : '在激发带外'}</text></svg>;
    parameters = [n('梯度', gradient, 'mT/m'), n('RF 中心偏移', offset, 'Hz'), n('RF 带宽', bandwidth, 'Hz')]; readings = [n('层中心', s.centreMm, 'mm'), n('理想层厚', s.thicknessMm, 'mm'), n('当前扫描位置', position, 'mm'), n('是否在带内', selected ? '是' : '否')];
    explanation = '保持带宽不变，将梯度加倍，理想层厚减半；只改 RF 中心频率，选中的层会移动。播放的竖线只是检查位置，不是样品真的移动。';
    model = '理想线性梯度与矩形激发频带，层厚=带宽/频率空间斜率；真实 RF 有有限时长、过渡带与选层轮廓。此图不模拟翻转角或选层后重聚相梯度。';
  } else if (id === 'echo-sequence') {
    const [tau, tr] = params, seq = echoSequence(tau, tr), x = (ms: number) => 75 + ms / 600 * 500, elapsed = progress * tr;
    controls = <div className="guided-controls">{control(0, '90° 到 180° 的间隔 τ', 10, 60, 5, 'ms')}{control(1, '两次 90° 的间隔 TR', 150, 600, 25, 'ms')}</div>;
    figure = <svg viewBox="0 0 640 345" className="guided-graphic" role="img" aria-label={`90度在0毫秒，180度在${tau}毫秒，TE=${2 * tau}毫秒，TR=${tr}毫秒`}><text x="15" y="90">RF</text><line x1="75" x2="590" y1="110" y2="110" stroke="#cad8ce" />{[[0, '90°', 35], [tau, '180°', 60], [tr, '90°', 35]].map(([t, label, h]) => <g key={String(label) + String(t)}><rect x={x(Number(t)) - 4} y={110 - Number(h)} width="8" height={Number(h)} fill={C.rf} /><text x={x(Number(t))} y={100 - Number(h)} textAnchor="middle">{label}</text></g>)}<text x="15" y="167">信号</text><path d={linspace(0, tr, 401).map((t, i) => `${i ? 'L' : 'M'}${x(t)},${185 - 40 * Math.exp(-(((t - seq.echoMs) / 8) ** 2))}`).join(' ')} fill="none" stroke={C.m} strokeWidth="3" /><line x1={x(seq.echoMs)} x2={x(seq.echoMs)} y1="125" y2="205" stroke={C.m} strokeDasharray="4 4" /><text x={x(seq.echoMs) + 8} y="137">回波中心</text><line x1="75" x2={x(seq.echoMs)} y1="224" y2="224" stroke={C.b} strokeWidth="2" /><text x={(75 + x(seq.echoMs)) / 2} y="245" textAnchor="middle">TE = 2τ = {seq.echoMs} ms</text><line x1="75" x2={x(tr)} y1="265" y2="265" stroke={C.ink} strokeWidth="2" /><text x={(75 + x(tr)) / 2} y="288" textAnchor="middle">TR = {tr} ms：这次 90° → 下次 90°</text><line x1={x(elapsed)} x2={x(elapsed)} y1="25" y2="205" stroke={C.b} strokeWidth="1.5" /><line x1="75" x2="575" y1="310" y2="310" stroke="#d1ded3" />{[0, 150, 300, 450, 600].map(t => <text key={t} x={x(t)} y="331" textAnchor="middle">{t}</text>)}<text x="620" y="331" textAnchor="end">ms</text></svg>;
    parameters = [n('τ', tau, 'ms'), n('TR', tr, 'ms')]; readings = [n('180° 中心', tau, 'ms'), n('TE', seq.echoMs, 'ms'), n('下次 90° 中心', tr, 'ms')]; time = { value: elapsed, unit: 'ms' };
    explanation = '先固定 τ 只改 TR：回波的时刻不变，下一次激励更晚。再固定 TR 改 τ：回波移动。TE 不是采集窗长度，TR 也不是发射后保护等待。';
    model = '理想 Hahn 回波的脉冲中心时序；图中脉宽和高斯回波形状只是示意，不用于真实序列执行。实际采集窗应围绕回波，还要满足硬件保护与恢复时间。';
  } else if (id === 'contrast') {
    const [tr, te] = params, materials = [{ label: '材料 A', t1: 400, t2: 50, color: C.b }, { label: '材料 B', t1: 1000, t2: 150, color: C.rf }], signals = materials.map(m => spinEchoSignal(tr, te, m.t1, m.t2)), effectiveTe = progress * te;
    controls = <><div className="guided-controls">{control(0, '重复时间 TR', 200, 3000, 100, 'ms')}{control(1, '回波时间 TE', 5, 150, 5, 'ms')}</div><div className="guided-choices"><button type="button" onClick={() => { setParams([400, 10]); setProgress(0); setRunning(false); }}>短 TR、短 TE</button><button type="button" onClick={() => { setParams([3000, 120]); setProgress(0); setRunning(false); }}>长 TR、长 TE</button></div></>;
    figure = <><div className="guided-materials">{materials.map((m, i) => <div key={m.label}><div className="guided-material" style={{ background: `rgb(${Math.round(signals[i] * 255)},${Math.round(signals[i] * 255)},${Math.round(signals[i] * 255)})` }} /><b>{m.label}</b><span>T₁={m.t1} ms · T₂={m.t2} ms</span><strong>回波信号 {signals[i].toFixed(3)}</strong></div>)}</div><Chart curves={materials.map(m => ({ label: m.label, color: m.color, values: linspace(0, te, 181).map(x => ({ x, y: spinEchoSignal(tr, x, m.t1, m.t2) })) }))} maxX={te} minY={0} maxY={1} xLabel="激励后时间 / ms（终点 TE）" yLabel="横向信号 / 相对单位" cursor={effectiveTe} /></>;
    parameters = [n('TR', tr, 'ms'), n('TE', te, 'ms'), n('材料 A 的 T₁/T₂', '400 / 50', 'ms'), n('材料 B 的 T₁/T₂', '1000 / 150', 'ms')]; readings = [n('A 的 TE 处信号', signals[0]), n('B 的 TE 处信号', signals[1]), n('光标处 A 信号', spinEchoSignal(tr, effectiveTe, 400, 50)), n('光标处 B 信号', spinEchoSignal(tr, effectiveTe, 1000, 150))]; time = { value: effectiveTe, unit: 'ms' };
    explanation = '先预测哪个更亮，再切换两个预设。短 TR 时较短 T₁ 有恢复优势；长 TE 时较长 T₂ 保留更多横向信号。灰块始终显示 TE 处的信号，播放光标解释信号怎样衰减到那里。';
    model = '两种人工材料，质子密度相同；理想自旋回波 S∝(1−e^(−TR/T₁))e^(−TE/T₂)。不代表特定组织，也不包括仪器增益、噪声、流动、扩散和脉冲误差。';
  }
  useLayoutEffect(() => { snapshot.current = { id, title: titles[id], capturedAt: '', view, parameters, readings, model, time }; });
  const focusedScene = !!focus && ['apparatus', 'signal-path', 'measurement-cycle'].includes(id);
  const reset = () => { setRunning(false); setProgress(0); setParams([...defaults[id]]); setCurveView('all'); setEarlyReceive(false); };
  return <section className={`guided-activity ${focusedScene ? 'is-focused' : ''}`} aria-label={titles[id]}><header><span className="guided-kicker">{focusedScene ? '跟着这一步看' : '分步观察'}</span><h3>{focusedScene ? view : titles[id]}</h3></header>{!focusedScene && <div className="guided-transport"><div><button type="button" className="guided-play" aria-label={running ? '暂停教学动画' : '播放教学动画'} onClick={() => { if (progress >= 1) setProgress(0); setRunning(v => !v); }}>{running ? <Pause size={14} /> : <Play size={14} />}{running ? '暂停' : '播放'}</button><button type="button" onClick={() => { setRunning(false); setProgress(p => Math.min(1, p + .05)); }}><StepForward size={14} />单步</button><button type="button" onClick={reset}><RotateCcw size={14} />重置</button></div><label htmlFor={timeline}>演示进度 <output>{(progress * 100).toFixed(0)}%</output><input id={timeline} type="range" min="0" max="1" step=".001" value={progress} aria-label="教学演示进度，拖动即暂停" onPointerDown={() => setRunning(false)} onKeyDown={() => setRunning(false)} onChange={e => { setRunning(false); setProgress(Number(e.target.value)); }} /></label></div>}<div className="guided-body">{controls}{figure}{!focusedScene && <div className="guided-readings">{readings.slice(0, 5).map((r, i) => <div key={`${r.label}-${i}`}><span>{r.label}</span><strong>{typeof r.value === 'number' ? Number(r.value.toFixed(3)) : r.value}{r.unit && <small> {r.unit}</small>}</strong></div>)}</div>}<p className="guided-explanation">{explanation}</p><p className="guided-model">模型范围：{model}</p></div></section>;
});

const GuidedActivity = forwardRef<ActivityHandle, Props>(function GuidedActivity(props, ref) { return <GuidedSession key={props.id} {...props} ref={ref} />; });
export default GuidedActivity;
