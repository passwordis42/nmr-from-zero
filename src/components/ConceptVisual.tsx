import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { ConceptVisualKind } from '../content/concepts';
import './concept-visual.css';

const LAST_FRAME = 24;
const TAU = Math.PI * 2;
const C = { green: '#356b58', blue: '#3d6f9d', orange: '#ba6535', grey: '#84908a', light: '#e5ece6', ink: '#243c32' };

const descriptions: Record<ConceptVisualKind, { title: string; summary: string; boundary: string }> = {
  coil: {
    title: '同一只线圈，怎样发射和接收？',
    summary: '样品放在绕成圈的导线里面。磁体持续提供竖直方向的磁场；电路先让线圈中的电流往返变化，线圈便产生另一份短暂磁场。随后切换到接收，读取线圈两根引线之间的电压。',
    boundary: '这是部件功能示意，未画真实接线所需的保护电路。曲线数值按各自最大值缩放，1 不是 1 伏；未加入真实信号逐渐减弱、电路恢复和样品对电路的影响。',
  },
  electric: {
    title: '电流经过哪里，电压量在哪里？',
    summary: '左侧电源让电压交替改变正负，导线接成闭合回路，电流通过上方电阻。电压表的两根测量线接在电阻的两端；读数变号时，电流箭头也反向。',
    boundary: '只计算理想电阻，所以电压与电流一起增减、同时变号；数值按各自最大值缩放。箭头按正电荷移动方向约定，与金属中电子的移动方向相反。真实线圈还有电感、电容等储存能量的作用。',
  },
  'field-moment': {
    title: '磁场、磁矩与整体磁化，不是同一支箭头',
    summary: '左侧标出样品在磁体中的位置。右侧用橙色箭头 M 表示样品整体的磁性方向，绿色箭头表示外部主磁场 B₀。橙色箭头绕绿色方向转动；蓝色部分表示它在垂直于主场的平面内还剩多少。',
    boundary: '只演示理想进动（磁性方向绕主场转动），不加入弛豫（随时间恢复或衰减）。箭头不是粒子的运动路线，播放速度也不是真实转速。μ 表示一个对象的磁矩；M 表示许多磁矩按体积合成的量。',
  },
  cycle: {
    title: '一圈相位，对应一段完整波形',
    summary: '左边指针走到一圈中的哪个位置，叫相位。右边记录指针尖端相对中心有多高：转完一圈，曲线就完成一次完整重复，也就是一个周期。',
    boundary: '指针长度固定，用它画出一个正弦波。数值按最大高度缩放到 −1 至 1；这不是原子核的运动路线。真实信号可以同时包含不同快慢的变化，大小也可能改变。',
  },
  shimming: {
    title: '先知道哪里偏，再补偿，最后复测',
    summary: '沿样品从左到右测量，检查各位置的磁场比目标值偏强还是偏弱。灰线是原来的偏差，橙线是额外加入的补偿，绿线是相加后仍然剩下的偏差。',
    boundary: '用假设数据演示，所有曲线始终采用同一比例尺。补偿只消除随位置成正比的部分，弯曲的误差仍留下。只看一条测量线，不能证明整个样品体积的磁场都足够均匀。',
  },
  gradient: {
    title: '让位置留下频率和相位的记号',
    summary: '上方标出样品左、中、右三个位置，竖直磁场从左向右变强，所以它们转动的快慢不同。下方跟着中心的节奏比较：中心指针不动，左侧逐渐落后，右侧逐渐超前。指针走到哪里就是相位。',
    boundary: '假定磁场沿位置均匀递增，称为线性梯度；只改变强弱，不把主场方向转向左右。没有加入样品移动或信号衰减；实际成像需要重复、配套的编码和采样，不能只靠这一张相位图。',
  },
};

function wavePath(left: number, top: number, width: number, amplitude: number, cycles = 1) {
  return Array.from({ length: 121 }, (_, i) => `${i ? 'L' : 'M'}${left + width * i / 120},${top - amplitude * Math.sin(TAU * cycles * i / 120)}`).join(' ');
}

function Arrow({ x1, y1, x2, y2, color = C.green, marker }: { x1: number; y1: number; x2: number; y2: number; color?: string; marker: string }) {
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return <circle cx={x1} cy={y1} r={2} fill={color}/>;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} markerEnd={`url(#${marker})`}/>;
}

function CoilDiagram({ p, marker }: { p: number; marker: string }) {
  const receiving = p >= .5;
  const local = receiving ? (p - .5) * 2 : p * 2;
  const projection = Math.cos(TAU * local);
  const fluxVoltage = Math.sin(TAU * local);
  const sampleAxisValue = receiving ? projection : Math.sin(TAU * local);
  return <>
    <text x={18} y={23} className="cv-svg-heading">{receiving ? '② 接收：线圈端口 → 接收器' : '① 发射：驱动器 → 线圈端口'}</text>
    <rect x={126} y={88} width={113} height={54} rx={12} fill="#dcecdf" stroke={C.green}/>
    {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={111 + i * 24} cy={115} rx={10} ry={49} fill="none" stroke={C.blue} strokeWidth={2}/>)}
    <rect x={161} y={103} width={42} height={24} rx={3} fill="#dcecdf"/>
    <text x={182} y={120} textAnchor="middle">样品</text>
    <text x={182} y={63} textAnchor="middle" fill={C.blue}>导线绕成线圈</text>
    <Arrow x1={52} y1={138} x2={52} y2={65} marker={marker}/><text x={25} y={53} className="cv-svg-small">主磁场</text>
    <line x1={115} y1={177} x2={250} y2={177} stroke={C.light}/>
    <Arrow x1={182} y1={177} x2={182 + sampleAxisValue * 59} y2={177} marker={marker} color={C.orange}/>
    <text x={182} y={199} textAnchor="middle" className="cv-svg-small">{receiving ? '样品整体磁性的方向分量' : '线圈短暂产生的另一磁场'}</text>
    <path d="M111 164V221H340V153 M255 164V236H432V153" fill="none" stroke={C.grey} strokeWidth={2}/>
    <circle cx={340} cy={153} r={4} fill={C.orange}/><circle cx={432} cy={153} r={4} fill={C.orange}/>
    <rect x={309} y={77} width={143} height={76} rx={9} fill={receiving ? '#e9f0f7' : '#f6eee6'} stroke={receiving ? C.blue : C.orange}/>
    <text x={380} y={104} textAnchor="middle">{receiving ? '接收电路' : '发射电路'}</text>
    <text x={380} y={128} textAnchor="middle" className="cv-svg-small">{receiving ? '量两根引线间的电压' : '让电流在线圈内变化'}</text>
    <text x={18} y={263} className="cv-svg-small">{receiving ? '引线间电压（缩放后的数值）' : '电流（缩放后的数值）'}</text>
    <line x1={235} y1={277} x2={449} y2={277} stroke={C.light}/>
    <path d={wavePath(235, 277, 214, 23)} fill="none" stroke={C.blue} strokeWidth={2}/>
    <circle cx={235 + 214 * local} cy={277 - fluxVoltage * 23} r={4} fill={C.orange}/>
    <text x={18} y={289} className="cv-svg-small">{`此刻：${fluxVoltage.toFixed(2)}；正负表示方向`}</text>
    <text x={449} y={314} textAnchor="end" className="cv-svg-small">一个示意周期 →</text>
  </>;
}

function ElectricDiagram({ p, marker }: { p: number; marker: string }) {
  const v = Math.cos(TAU * p);
  return <>
    <text x={18} y={25} className="cv-svg-heading">闭合回路中的约定电流与跨两端电压</text>
    <path d="M65 138V80H232 M356 80H427V250H65V192" fill="none" stroke={C.blue} strokeWidth={3}/>
    <circle cx={65} cy={165} r={27} fill="#fff" stroke={C.blue} strokeWidth={2}/>
    <path d={wavePath(47, 165, 36, 10)} fill="none" stroke={C.blue} strokeWidth={2}/>
    <text x={24} y={214}>交流源</text>
    <path d="M232 80L240 69 252 91 264 69 276 91 288 69 300 91 312 69 324 91 336 69 348 91 356 80" fill="none" stroke={C.orange} strokeWidth={2.5}/>
    <text x={291} y={54} textAnchor="middle">电阻 R（固定）</text>
    <Arrow x1={159 - v * 28} y1={80} x2={159 + v * 28} y2={80} color={C.green} marker={marker}/>
    <text x={156} y={111} textAnchor="middle">I</text>
    <path d="M232 80V166H270 M356 80V166H314" fill="none" stroke={C.grey} strokeWidth={1.5}/>
    <circle cx={232} cy={80} r={4} fill={C.orange}/><circle cx={356} cy={80} r={4} fill={C.orange}/>
    <text x={219} y={145}>＋</text><text x={359} y={145}>−</text>
    <circle cx={292} cy={166} r={23} fill="#fff" stroke={C.ink} strokeWidth={1.5}/><text x={292} y={173} textAnchor="middle">V</text>
    <text x={292} y={211} textAnchor="middle">测量位置：电阻两端</text>
    <text x={18} y={289}>缩放后的电压 {v.toFixed(2)} · 电流 {v.toFixed(2)}</text>
    <text x={18} y={315} className="cv-svg-small">正负随时间改变；箭头没有表示电子的运动方向。</text>
  </>;
}

function FieldDiagram({ p, marker }: { p: number; marker: string }) {
  const phase = TAU * p;
  // Project Mx=cos(phase), My=-sin(phase) into the drawn x/y basis.
  // This retains the proton's precession sign for positive Bz.
  const x = 340 + 52 * (Math.cos(phase) + Math.sin(phase));
  const y = 129 + 18 * (Math.cos(phase) - Math.sin(phase));
  return <>
    <text x={18} y={24} className="cv-svg-heading">左：测量位置　右：该位置的磁化方向模型</text>
    <rect x={29} y={62} width={135} height={178} rx={18} fill="#e8ece6" stroke={C.grey}/>
    <text x={96} y={85} textAnchor="middle">主磁体</text>
    <ellipse cx={96} cy={156} rx={47} ry={51} fill="#fff" stroke={C.grey}/>
    <circle cx={96} cy={167} r={19} fill="#dcecdf" stroke={C.green}/>
    <text x={96} y={226} textAnchor="middle">样品位置</text>
    <Arrow x1={96} y1={174} x2={96} y2={112} marker={marker}/><text x={115} y={132}>B₀</text>
    <path d="M164 156H211" fill="none" stroke={C.grey} strokeDasharray="4 4"/>
    <ellipse cx={340} cy={202} rx={101} ry={36} fill="#eff4f0" stroke={C.light}/>
    <line x1={340} y1={202} x2={442} y2={225} stroke={C.grey}/><text x={450} y={229}>x</text>
    <line x1={340} y1={202} x2={247} y2={232} stroke={C.grey}/><text x={231} y={242}>y</text>
    <Arrow x1={340} y1={202} x2={340} y2={53} marker={marker}/><text x={353} y={55}>z，B₀</text>
    <ellipse cx={340} cy={129} rx={74} ry={25} fill="none" stroke={C.grey} strokeDasharray="4 5"/>
    <line x1={x} y1={y} x2={x} y2={y + 73} stroke={C.blue} strokeDasharray="4 4"/>
    <Arrow x1={340} y1={202} x2={x} y2={y + 73} color={C.blue} marker={marker}/>
    <Arrow x1={340} y1={202} x2={x} y2={y} color={C.orange} marker={marker}/>
    <circle cx={x} cy={y} r={4} fill={C.orange}/>
    <text x={230} y={269} fill={C.orange}>橙：总体磁化 M</text>
    <text x={230} y={293} fill={C.blue}>蓝：横向投影</text>
    <text x={18} y={320} className="cv-svg-small">磁矩 μ 描述单个对象；M 是许多磁矩按体积合成的量。</text>
  </>;
}

function CycleDiagram({ p, marker }: { p: number; marker: string }) {
  const phase = TAU * p;
  const y = 147 - 58 * Math.sin(phase);
  const x = 103 + 58 * Math.cos(phase);
  const cursor = 235 + 215 * p;
  return <>
    <text x={18} y={25} className="cv-svg-heading">相位指针转一圈，正弦波完成一个周期</text>
    <circle cx={103} cy={147} r={58} fill="#f5f7f2" stroke={C.light}/>
    <line x1={37} y1={147} x2={173} y2={147} stroke={C.grey}/><line x1={103} y1={80} x2={103} y2={214} stroke={C.grey}/>
    <Arrow x1={103} y1={147} x2={x} y2={y} marker={marker} color={C.orange}/>
    <line x1={x} y1={y} x2={cursor} y2={y} stroke={C.orange} strokeDasharray="4 4" opacity={.7}/>
    <text x={103} y={244} textAnchor="middle">抽象相位指针</text>
    <text x={103} y={270} textAnchor="middle">{Math.round(p * 360)}°</text>
    <line x1={235} y1={147} x2={450} y2={147} stroke={C.grey}/><line x1={235} y1={76} x2={235} y2={217} stroke={C.grey}/>
    <text x={217} y={94} textAnchor="end">1</text><text x={217} y={151} textAnchor="end">0</text><text x={217} y={209} textAnchor="end">−1</text>
    <path d={wavePath(235, 147, 215, 58)} fill="none" stroke={C.blue} strokeWidth={2.5}/>
    <line x1={cursor} y1={80} x2={cursor} y2={217} stroke={C.orange} strokeDasharray="3 4"/>
    <circle cx={cursor} cy={y} r={4} fill={C.orange}/>
    {[0, .25, .5, .75, 1].map((v, i) => <text key={v} x={235 + 215 * v} y={238} textAnchor="middle" className="cv-svg-small">{['0', '¼', '½', '¾', '1'][i]}</text>)}
    <text x={342} y={267} textAnchor="middle">横轴：经过的周期数</text>
    <text x={342} y={291} textAnchor="middle" className="cv-svg-small">纵轴：缩放后的信号</text>
    <text x={18} y={321} className="cv-svg-small">指针长短表示幅度；此图固定幅度，只推进相位。</text>
  </>;
}

function ShimmingDiagram({ p }: { p: number }) {
  const original = (x: number) => .6 * x + .25 * x * x;
  const compensation = (x: number) => -.6 * x * p;
  const px = (x: number) => 248 + 180 * x;
  const py = (y: number) => 154 - 67 * y;
  const curve = (fn: (x: number) => number) => Array.from({ length: 61 }, (_, i) => { const x = -1 + i / 30; return `${i ? 'L' : 'M'}${px(x)},${py(fn(x))}`; }).join(' ');
  return <>
    <text x={18} y={24} className="cv-svg-heading">观察同一条测量线：补偿进度 {Math.round(p * 100)}%</text>
    <text x={18} y={53} className="cv-svg-small">纵轴：场误差（任意单位，始终使用同一尺度）</text>
    {[-1, 0, 1].map(y => <g key={y}><line x1={68} y1={py(y)} x2={428} y2={py(y)} stroke={y === 0 ? C.grey : C.light}/><text x={54} y={py(y) + 5} textAnchor="end">{y}</text></g>)}
    <line x1={68} y1={77} x2={68} y2={230} stroke={C.grey}/>
    <path d={curve(original)} fill="none" stroke={C.grey} strokeWidth={2} strokeDasharray="6 4"/>
    <path d={curve(compensation)} fill="none" stroke={C.orange} strokeWidth={2}/>
    <path d={curve(x => original(x) + compensation(x))} fill="none" stroke={C.green} strokeWidth={3}/>
    {[-1, -.5, 0, .5, 1].map(x => <g key={x}><circle cx={px(x)} cy={py(original(x) + compensation(x))} r={4} fill={C.green}/><text x={px(x)} y={248} textAnchor="middle" className="cv-svg-small">{x}</text></g>)}
    <text x={248} y={273} textAnchor="middle">横轴：样品内位置（以半长为单位）</text>
    <line x1={24} y1={300} x2={47} y2={300} stroke={C.grey} strokeDasharray="5 3" strokeWidth={2}/><text x={54} y={305} className="cv-svg-small">原始误差</text>
    <line x1={172} y1={300} x2={195} y2={300} stroke={C.orange} strokeWidth={2}/><text x={202} y={305} className="cv-svg-small">补偿场</text>
    <line x1={305} y1={300} x2={328} y2={300} stroke={C.green} strokeWidth={3}/><text x={335} y={305} className="cv-svg-small">剩余偏差</text>
  </>;
}

function GradientDiagram({ p, marker }: { p: number; marker: string }) {
  return <>
    <text x={18} y={25} className="cv-svg-heading">梯度保持开启，相位差逐渐累积</text>
    <rect x={35} y={89} width={410} height={39} rx={12} fill="#edf2eb" stroke={C.light}/>
    <text x={240} y={151} textAnchor="middle" className="cv-svg-small">同一样品中的三个位置；主场方向均为 z</text>
    {[-1, 0, 1].map((position, i) => {
      const x = 90 + i * 150, angle = position * p * Math.PI / 2;
      return <g key={position}>
        <circle cx={x} cy={109} r={6} fill={C.blue}/>
        <Arrow x1={x} y1={109} x2={x} y2={64 - 15 * position} marker={marker}/>
        <text x={x} y={178} textAnchor="middle">{['左：较低频率', '中：参考频率', '右：较高频率'][i]}</text>
        <circle cx={x} cy={232} r={33} fill="#fbfcf8" stroke={C.light}/>
        <line x1={x - 37} y1={232} x2={x + 37} y2={232} stroke={C.light}/>
        <Arrow x1={x} y1={232} x2={x + 29 * Math.cos(angle)} y2={232 - 29 * Math.sin(angle)} marker={marker} color={C.orange}/>
        <text x={x} y={284} textAnchor="middle">{Math.round(angle * 180 / Math.PI)}°</text>
      </g>;
    })}
    <text x={28} y={65} className="cv-svg-small">Bz</text>
    <text x={240} y={319} textAnchor="middle" className="cv-svg-small">下方：各位置相对于中心的相位（旋转坐标）</text>
  </>;
}

function VisualPlayer({ kind }: { kind: ConceptVisualKind }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  const marker = `${uid}-arrow`;
  const info = descriptions[kind];
  const p = frame / LAST_FRAME;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(media.matches); if (media.matches) setPlaying(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || frame >= LAST_FRAME) return;
    const timer = window.setTimeout(() => setFrame(value => value + 1), 180);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, frame]);

  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', stopWhenHidden);
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) setPlaying(false);
    });
    if (container.current) observer?.observe(container.current);
    return () => { document.removeEventListener('visibilitychange', stopWhenHidden); observer?.disconnect(); };
  }, []);

  const active = playing && frame < LAST_FRAME && !reducedMotion;
  const toggle = () => {
    if (active) { setPlaying(false); return; }
    if (frame >= LAST_FRAME) setFrame(0);
    setPlaying(true);
  };
  const step = () => { setPlaying(false); setFrame(value => value >= LAST_FRAME ? 0 : value + 1); };
  const reset = () => { setPlaying(false); setFrame(0); };

  return <div className="concept-visual" ref={container}>
    <div className="cv-heading"><span>可逐步观察的图解</span><h4>{info.title}</h4></div>
    <svg className="cv-diagram" viewBox="0 0 480 338" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>{info.title}，第 {frame} 步，共 {LAST_FRAME} 步</title>
      <desc id={`${uid}-desc`}>{info.summary} {info.boundary}</desc>
      <defs><marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
      {kind === 'coil' && <CoilDiagram p={p} marker={marker}/>}
      {kind === 'electric' && <ElectricDiagram p={p} marker={marker}/>}
      {kind === 'field-moment' && <FieldDiagram p={p} marker={marker}/>}
      {kind === 'cycle' && <CycleDiagram p={p} marker={marker}/>}
      {kind === 'shimming' && <ShimmingDiagram p={p}/>}
      {kind === 'gradient' && <GradientDiagram p={p} marker={marker}/>}
    </svg>
    <div className="cv-controls" role="group" aria-label={`${info.title}的播放控制`}>
      <button type="button" onClick={toggle} disabled={reducedMotion} aria-label={active ? '暂停图解' : '播放图解'}>{active ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}{active ? '暂停' : '播放'}</button>
      <button type="button" onClick={step}><StepForward size={15} aria-hidden="true"/>单步</button>
      <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true"/>重置</button>
      <span className="cv-frame" aria-live="off">{frame} / {LAST_FRAME}</span>
    </div>
    {reducedMotion && <p className="cv-motion-note">已遵循系统“减少动态效果”设置。可以单步查看每一帧。</p>}
    <p className="cv-equivalent"><strong>静态读图：</strong>{info.summary}</p>
    <p className="cv-boundary"><strong>模型边界：</strong>{info.boundary}</p>
  </div>;
}

export default function ConceptVisual({ kind }: { kind: ConceptVisualKind }) {
  return <VisualPlayer key={kind} kind={kind}/>;
}
