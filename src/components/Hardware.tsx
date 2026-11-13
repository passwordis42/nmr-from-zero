import { useState } from 'react';
import { ArrowUpRight, Cpu } from 'lucide-react';
import { hardwareModules } from '../content/resources';
import { ExplainedParagraph, useLearningHelp } from './LearningHelp';
import { stripTerms } from '../learning';

const buildRoutes: Record<string, string> = { magnet: 'magnet', gradient: 'gradient', coil: 'coil', transmitter: 'rf-chain', switch: 'rf-chain', receiver: 'rf-chain', adc: 'console', console: 'console', reconstruction: 'imaging' };
const moduleSources: Record<string, string[]> = { magnet: ['halbach', 'shimmer'], console: ['marcos'], transmitter: ['keeler5', 'ezymri'], coil: ['keeler5', 'osii'], gradient: ['gradient', 'stanford'], switch: ['keeler5', 'osii'], receiver: ['keeler5', 'marcos'], adc: ['keeler5', 'marcos'], reconstruction: ['stanford', 'osii-paper'] };

export default function Hardware({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState('magnet');
  const item = hardwareModules.find(m => m.id === selected) ?? hardwareModules[0];
  const { page } = useLearningHelp();
  const context = { ...page, title: `整机地图 · ${stripTerms(item.name)}`, quote: '', sources: moduleSources[item.id] };
  const activate = (id: string) => ({ onClick: () => setSelected(id), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(id); } }, role: 'button', tabIndex: 0, 'aria-label': `查看${hardwareModules.find(m => m.id === id)?.name ?? id}`, 'aria-pressed': id === selected });
  return <div className={`hardware ${compact ? 'compact' : ''}`}>
    <div className="machine-viewport"><svg className="machine-diagram" viewBox="0 0 800 350" role="group" aria-label="核磁仪器结构，点击部件查看作用">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="none" stroke="#7b8880" strokeWidth="1.5"/></marker><linearGradient id="magnet-shade" x1="0" x2="1"><stop offset="0" stopColor="#f1f3ed"/><stop offset="1" stopColor="#d9e1d8"/></linearGradient></defs>
      <g {...activate('magnet')} className="machine-part">
        <ellipse cx="205" cy="164" rx="111" ry="125" fill="url(#magnet-shade)" stroke="#acb8ab" strokeWidth="1.5"/>
        <ellipse cx="205" cy="164" rx="76" ry="94" fill="#fff" stroke="#b7c2b2" strokeWidth="1.5"/>
        <path d="M101 130h-27m27 68h-27" stroke="#a8b2a3"/><text x="22" y="153" className="svg-label">主磁场 B₀</text><text x="27" y="178" className="svg-small">建立磁化</text>
        <text x="200" y="61" fill="#3166ac" fontSize="16">B₀</text><path d="M202 88v-19" stroke="#3166ac" markerEnd="url(#arrow)"/>
      </g>
      <g {...activate('gradient')} className="machine-part"><path d="M159 96q-60 72 0 141 M249 96q60 72 0 141" fill="none" stroke="#87a795" strokeWidth="8"/><text x="103" y="304" className="svg-label">梯度：给位置编码</text><path d="M157 241l-10 43" stroke="#87a795"/></g>
      <g {...activate('coil')} className="machine-part">
        {[0,1,2,3,4].map(i => <ellipse key={i} cx={181+i*12} cy="168" rx="28" ry="63" fill="none" stroke="#c97e43" strokeWidth="2"/>)}
        <path d="M191 154v47q14 9 29 0v-47" fill="#cce6ef" stroke="#8bb4c3"/><ellipse cx="205.5" cy="154" rx="14.5" ry="4" fill="#eef9fb" stroke="#8bb4c3"/>
        <text x="180" y="250" className="svg-small">样品与线圈</text>
      </g>
      <g {...activate('transmitter')} className="machine-part"><rect x="365" y="30" width="150" height="52" rx="5" fill="#fff6e9" stroke="#d0b18c"/><text x="440" y="52" textAnchor="middle" className="svg-label">射频发射</text><text x="440" y="70" textAnchor="middle" className="svg-small">把磁化推离平衡</text><path d="M365 55H290v65h-43" fill="none" stroke="#c97e43" markerEnd="url(#arrow)"/></g>
      <g {...activate('switch')} className="machine-part"><path d="M250 173h68" stroke="#c97e43" markerEnd="url(#arrow)"/><rect x="320" y="151" width="80" height="44" rx="4" fill="#f5f6f2" stroke="#acb8ab"/><text x="360" y="178" textAnchor="middle" className="svg-label">收发切换</text></g>
      <g {...activate('receiver')} className="machine-part"><path d="M400 173h27" stroke="#7b8880" markerEnd="url(#arrow)"/><rect x="431" y="125" width="146" height="96" rx="6" fill="#fff" stroke="#56816a" strokeWidth="1.5"/><path d="M444 174l7-30 8 58 8-51 8 44 8-37 8 32 8-26 8 21 8-17 8 13 8-9 8 6 8-3h14" fill="none" stroke="#487653" strokeWidth="2"/><text x="504" y="106" textAnchor="middle" className="svg-label">接收微弱信号</text></g>
      <g {...activate('adc')} className="machine-part"><path d="M577 173h30" stroke="#7b8880" markerEnd="url(#arrow)"/><text x="593" y="245" textAnchor="middle" className="svg-small">ADC 数字化</text></g>
      <g {...activate('reconstruction')} className="machine-part"><rect x="616" y="125" width="135" height="96" rx="5" fill="#173b3a"/>{Array.from({length:120},(_,i)=>{const x=i%12,y=Math.floor(i/12);const v=((x-5.5)/4.3)**2+((y-4.5)/3.8)**2;return <rect key={i} x={625+x*10} y={131+y*8} width="9" height="7" fill={v<1?(v<.23?'#8da497':'#e1e6d5'):'#234340'}/>;})}<text x="683" y="106" textAnchor="middle" className="svg-label">重建图像</text><text x="683" y="245" textAnchor="middle" className="svg-small">合成模体示意</text></g>
      <g {...activate('console')} className="machine-part"><path d="M440 285V230m0 55h230v-20" fill="none" stroke="#88948c" strokeDasharray="4 4"/><text x="420" y="314" className="svg-label">控制台：让所有模块按时协作</text></g>
    </svg></div><p className="diagram-hint">点选部件，沿着信号走一遍。<span>图示可左右滑动。</span></p>
    <div className="hardware-select" aria-label="选择仪器部件">{hardwareModules.map(m=><button key={m.id} className={m.id===selected?'selected':''} onClick={()=>setSelected(m.id)}>{stripTerms(m.name)}</button>)}</div>
    {item && <div className="module-detail" aria-live="polite"><div className="module-heading"><h3><Cpu size={18}/>{stripTerms(item.name)}</h3><a href={`#/learn/${item.stage}-1`}>相关课程 <ArrowUpRight size={15}/></a></div><ExplainedParagraph text={item.purpose} context={{ ...context, title: `${context.title} · 作用` }} /><dl><div><dt>输入</dt><dd><ExplainedParagraph text={item.input} context={{ ...context, title: `${context.title} · 输入` }} /></dd></div><div><dt>输出</dt><dd><ExplainedParagraph text={item.output} context={{ ...context, title: `${context.title} · 输出` }} /></dd></div><div><dt>故障线索</dt><dd><ExplainedParagraph text={item.failure} context={{ ...context, title: `${context.title} · 故障线索` }} /></dd></div></dl>{!compact&&<a className="text-button" href={`#/build/${buildRoutes[item.id]}`}>学习这个模块的制造与验收 <ArrowUpRight size={14}/></a>}</div>}
  </div>;
}
