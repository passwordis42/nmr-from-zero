import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Circle, Download, FlaskConical, List, Menu, Search, Settings2, Upload, X } from 'lucide-react';
import katex from 'katex';
import { stages } from './content/course';
import { sources, glossary, advancedReadings, corrections } from './content/resources';
import Hardware from './components/Hardware';
import { emptyProgress, parseProgress, STORAGE_KEY } from './progress';
import type { LabId, Lesson, Progress, Stage } from './types';

const Lab = lazy(() => import('./components/Lab'));
const lessons = stages.flatMap(s=>s.lessons);
const ids = new Set(lessons.map(l=>l.id));
const labList: { id: LabId; title: string; description: string }[] = [
  {id:'waves',title:'波与相位叠加',description:'让两道波同声相应，或彼此抵消。'},
  {id:'spin',title:'磁化进动与激发',description:'用磁场和射频脉冲转动磁化矢量。'},
  {id:'relaxation',title:'弛豫与回波',description:'分开观察失相、恢复与不可逆的衰减。'},
  {id:'sampling',title:'采样与频谱',description:'从随时间变化的波，找到组成它的频率。'},
  {id:'field',title:'磁场与匀场',description:'场越均匀，样品的进动频率越接近。'},
  {id:'coil',title:'线圈调谐',description:'让线圈在目标频率有效交换能量。'},
  {id:'timing',title:'收发时序',description:'协调发射、保护和接收的时间窗口。'},
  {id:'imaging',title:'空间编码与重建',description:'把位置写进相位，再从数据还原图像。'},
];
function SourceLinks({ values }: { values: string[] }) { return <div className="source-links">{values.map(id=>{const s=sources.find(x=>x.id===id);return s?<a key={id} href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={13}/></a>:null;})}</div>; }
function Formula({lesson}:{lesson:Lesson}) { return <details className="formula"><summary><span className="sigma">∑</span>把直觉写成公式<ChevronDown size={18}/></summary><div className="formula-body"><div className="math" dangerouslySetInnerHTML={{__html:katex.renderToString(lesson.formula.tex,{displayMode:true,throwOnError:false,trust:false})}}/><p>{lesson.formula.explanation}</p><ul>{lesson.formula.symbols.map(s=><li key={s}>{s}</li>)}</ul></div></details>; }
function Quiz({lesson,answer,onAnswer}:{lesson:Lesson;answer?:number;onAnswer:(value:number)=>void}) { const q=lesson.quiz;return <section className="quiz"><h2><Check size={21}/>理解检查</h2><fieldset><legend>{q.question}</legend>{q.options.map((option,i)=><label key={option} className={`quiz-option ${answer===i?'chosen':''}`}><input type="radio" name={`quiz-${lesson.id}`} checked={answer===i} onChange={()=>onAnswer(i)}/><span className="option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span></label>)}</fieldset>{answer!==undefined&&<div className={`quiz-feedback ${answer===q.answer?'correct':''}`} role="status"><strong>{answer===q.answer?'理解正确。':'再想一步。'}</strong> {q.explanation}<span className="answer-line">正确答案：{String.fromCharCode(65+q.answer)} · {q.options[q.answer]}</span></div>}</section>; }

export default function App() {
  const [progress,setProgress] = useState<Progress>(()=>{try{const p=localStorage.getItem(STORAGE_KEY);return p?parseProgress(JSON.parse(p),ids):emptyProgress();}catch{return emptyProgress();}});
  const [route,setRoute]=useState(()=>location.hash.slice(1)||'/path');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('');
  const [sourceFilter,setSourceFilter]=useState('全部');
  const fileInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{const update=()=>{setRoute(location.hash.slice(1)||'/path');setMobileOpen(false);setQuery('');window.scrollTo({top:0});};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{setStatus('浏览器暂时无法保存进度，你仍可学习并导出进度。');}},[progress]);
  const current = lessons.find(l=>route===`/learn/${l.id}`);
  const stage=stages.find(s=>s.lessons.some(l=>l.id===current?.id));
  useEffect(()=>{if(current){setProgress(p=>p.lastLesson===current.id?p:{...p,lastLesson:current.id,updatedAt:new Date().toISOString()});document.title=`${current.title} · 从零看懂核磁共振`;}else document.title='从零看懂核磁共振';},[current]);
  const patchProgress=(patch:Partial<Progress>)=>setProgress(p=>({...p,...patch,updatedAt:new Date().toISOString()}));
  const complete=(id:string)=>patchProgress({completed:progress.completed.includes(id)?progress.completed.filter(x=>x!==id):[...progress.completed,id]});
  const exportProgress=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(progress,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='核磁学习进度.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('进度已导出，可在另一台设备导入。');};
  const importProgress=async(file?:File)=>{if(!file)return;try{if(file.size>1000000)throw new Error('进度文件过大，请选择本站导出的 JSON 文件。');const imported=parseProgress(JSON.parse(await file.text()),ids);setProgress(p=>({...p,completed:[...new Set([...p.completed,...imported.completed])],answers:{...p.answers,...imported.answers},lastLesson:imported.lastLesson,updatedAt:new Date().toISOString()}));setStatus('进度已合并导入。');}catch(e){setStatus(e instanceof Error?e.message:'导入失败，请检查文件。');}if(fileInput.current)fileInput.current.value='';};
  const normalized=query.trim().toLocaleLowerCase();
  const searchLessons=normalized?lessons.filter(l=>[l.title,l.question,...l.intuition,l.hardware,l.misconception].join(' ').toLocaleLowerCase().includes(normalized)):[];
  const searchTerms=normalized?glossary.filter(g=>`${g.term} ${g.english} ${g.definition}`.toLocaleLowerCase().includes(normalized)):[];
  const title=stage?.title??({'/path':'学习路线','/resources':'资料库','/glossary':'术语表','/hardware':'整机地图','/advanced':'进阶阅读','/progress':'学习进度'}[route]??'交互实验室');
  const renderLab=(id:LabId)=><Suspense fallback={<div className="loading-lab">正在准备实验…</div>}><Lab key={id} id={id}/></Suspense>;
  const activeLab=labList.find(l=>route===`/labs/${l.id}`);
  return <>
    <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>跳到正文</a>
    <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
      <a className="brand" href="#/path"><Activity size={30} strokeWidth={1.4}/><span>核磁<span className="brand-dot">·</span>从零开始</span></a>
      <div className="sidebar-search"><Search size={17}/><input aria-label="搜索课程与概念" placeholder="搜索课程与概念" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')setMobileOpen(false);}}/>{query&&<><button aria-label="清空搜索" onClick={()=>setQuery('')}><X size={15}/></button><button className="mobile-search-go" aria-label="查看搜索结果" onClick={()=>setMobileOpen(false)}><ArrowRight size={15}/></button></>}</div>
      <a href="#/path" className="sidebar-caption"><List size={17}/>学习路线<span>12 阶段</span></a>
      <nav className="stage-navigation" aria-label="学习阶段">{stages.map(s=>{const n=s.lessons.filter(l=>progress.completed.includes(l.id)).length;return <a key={s.id} className={stage?.id===s.id?'active':''} href={`#/learn/${s.id}-1`} aria-current={stage?.id===s.id?'page':undefined}><span className={`stage-dot ${n===3?'done':''}`}>{n===3?<Check size={11}/>:null}</span><span className="stage-number">{String(s.id).padStart(2,'0')}</span><span>{s.title}</span><small>{n}/3</small></a>;})}</nav>
      <nav className="sidebar-extra" aria-label="学习工具"><a href="#/labs/waves"><FlaskConical size={17}/>交互实验室</a><a href="#/hardware"><Settings2 size={17}/>整机地图</a><a href="#/advanced"><BookOpen size={17}/>进阶阅读</a></nav>
      <div className="sidebar-progress"><div><span>我的学习进度</span><strong>{progress.completed.length} / 36</strong></div><progress max="36" value={progress.completed.length}/><a href="#/progress">管理与迁移进度 <ArrowUpRight size={13}/></a></div>
    </aside>
    {mobileOpen&&<button className="sidebar-backdrop" aria-label="关闭目录" onClick={()=>setMobileOpen(false)}/>}
    <div className="workspace">
      <header className="topbar"><button className="menu-toggle" aria-label={mobileOpen?'关闭学习目录':'打开学习目录'} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={20}/>:<Menu size={20}/>}</button><div className="breadcrumb"><a href="#/path">学习路线</a><span>/</span><span>{stage?`${String(stage.id).padStart(2,'0')} `:''}{title}</span></div><nav><a href="#/resources"><BookOpen size={16}/>资料库</a><a href="#/glossary"><List size={17}/>术语表</a></nav></header>
      <main id="main-content" tabIndex={-1}>
      {normalized?<section className="search-page"><div className="page-heading"><h1>找到一个概念，再接着往前</h1><p>“{query}” · {searchLessons.length} 节课程，{searchTerms.length} 个术语</p><button className="text-button" onClick={()=>setQuery('')}>返回学习 <X size={15}/></button></div>{searchLessons.map(l=><a className="search-result" href={`#/learn/${l.id}`} onClick={()=>setQuery('')} key={l.id}><span className="mono">{l.id}</span><div><h3>{l.title}</h3><p>{l.question}</p></div><ArrowUpRight size={18}/></a>)}{searchTerms.map(t=><div className="term-row" key={t.term}><h3>{t.term}<small>{t.english}</small></h3><p>{t.definition}</p><a href={`#/learn/${t.stage}-1`} onClick={()=>setQuery('')}>前往第 {t.stage} 阶段</a></div>)}{!searchLessons.length&&!searchTerms.length&&<div className="empty-state">还没有匹配的内容。试试“相位”“回波”或“线圈”。</div>}</section>
      :current&&stage?<LessonPage lesson={current} stage={stage} progress={progress} onAnswer={value=>patchProgress({answers:{...progress.answers,[current.id]:value}})} onComplete={()=>complete(current.id)} renderLab={renderLab}/>
      :route==='/path'?<section><div className="page-heading journey-heading"><div><h1>从一杯水，<br/>走进核磁共振。</h1><p>把看不见的物理，变成可以理解的信号。<br/>36 节短课，8 组交互实验，一条从原理通向仪器的学习路线。</p><a className="primary-button" href={`#/learn/${progress.lastLesson}`}>{progress.completed.length?'继续学习':'开始第一课'}<ArrowRight size={18}/></a></div><div className="intro-signal" aria-hidden="true"><svg viewBox="0 0 400 210"><line x1="10" x2="390" y1="105" y2="105" stroke="#e3e8df"/><path d={Array.from({length:380},(_,i)=>`${i?'L':'M'}${i+10},${105-85*Math.exp(-i/110)*Math.sin(i/6)}`).join(' ')} fill="none" stroke="#3d6b58" strokeWidth="2"/></svg><span>一个信号，一整套物理。</span></div></div><div className="learning-note"><BookOpen size={19}/><p>不需要预先懂量子力学或电路。先观察，再动手，最后才看公式。每个阶段都可以自由进入，也可以按顺序慢慢学。</p></div><div className="roadmap">{stages.map(s=><div className="roadmap-stage" key={s.id}><span className="roadmap-number">{String(s.id).padStart(2,'0')}</span><div><h2><a href={`#/learn/${s.id}-1`}>{s.title}</a></h2><p>{s.description}</p><div className="roadmap-lessons">{s.lessons.map((l,i)=><a href={`#/learn/${l.id}`} key={l.id}>{progress.completed.includes(l.id)?<Check size={14}/>:<span>{i+1}</span>}{l.title}<ArrowUpRight size={13}/></a>)}</div></div></div>)}</div></section>
      :route==='/hardware'?<section><div className="page-heading"><h1>把原理，放回机器里。</h1><p>点击部件，沿着能量、信号与时序走一遍。</p></div><Hardware/><div className="learning-note"><Settings2 size={20}/><p>这是功能示意图。完整仪器还需要电源、屏蔽、机械固定、散热与标定。图像来自位置编码后的测量，单独测到 FID 并不等于已经能成像。</p></div></section>
      :route==='/resources'?<section><div className="page-heading"><h1>每一步，都有来处。</h1><p>从直观课程到原始论文，再到真实的开源硬件。先看“用来学什么”，再决定读多深。</p></div><div className="filter-row">{['全部',...new Set(sources.map(s=>s.kind))].map(kind=><button className={sourceFilter===kind?'selected':''} key={kind} onClick={()=>setSourceFilter(kind)}>{kind}</button>)}</div><div className="resource-list">{sources.filter(s=>sourceFilter==='全部'||s.kind===sourceFilter).map(s=><article key={s.id} className="resource" id={`source-${s.id}`}><div className="resource-meta">{s.kind}<span>阶段 {s.chapters.join(' · ')}</span></div><h2><a href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={19}/></a></h2><p>{s.description}</p><dl><div><dt>核验</dt><dd>{s.status}</dd></div>{s.license&&<div><dt>许可</dt><dd>{s.license}</dd></div>}</dl></article>)}</div><h2 className="section-heading">读开源资料时，容易踩的坑</h2>{corrections.map((c,i)=><details className="reading" key={i}><summary>{c.claim}<ChevronDown size={17}/></summary><p>{c.correction}</p><SourceLinks values={[c.sourceId]}/></details>)}</section>
      :route==='/glossary'?<section><div className="page-heading"><h1>陌生名词，在这里停一下。</h1><p>中文解释、英文名称和对应课程。左侧搜索也能查找这里的全部概念。</p></div>{glossary.map(t=><div className="term-row" key={t.term}><h3>{t.term}<small>{t.english}</small></h3><p>{t.definition}</p><a href={`#/learn/${t.stage}-1`}>到第 {t.stage} 阶段理解它 <ArrowUpRight size={14}/></a></div>)}</section>
      :route==='/advanced'?<section><div className="page-heading"><h1>当你想再往深处走。</h1><p>基础模型是起点。这里解释它的边界，以及下一步可以探索什么。</p></div>{advancedReadings.map((r,i)=><article className="advanced-reading" key={r.title}><span className="mono">0{i+1}</span><h2>{r.title}</h2><p className="reading-summary">{r.summary}</p>{r.body.map((p,j)=><p key={j}>{p}</p>)}<SourceLinks values={r.sources}/></article>)}</section>
      :route==='/progress'?<section><div className="page-heading"><h1>按自己的节奏，慢慢学。</h1><p>已完成 {progress.completed.length} / 36 节课。完成标记由你决定，小测不会挡住学习。</p></div><div className="progress-management"><progress max="36" value={progress.completed.length}/><a className="primary-button" href={`#/learn/${progress.lastLesson}`}>继续上次的课程<ArrowRight size={17}/></a><h2>在另一台设备接着学</h2><p>网站随时可以打开；进度只保存在当前浏览器，不会自动同步。导出文件，再到另一台设备导入。导入会合并完成记录，保留已有进度。</p><div className="button-row"><button className="secondary-button" onClick={exportProgress}><Download size={16}/>导出进度</button><button className="secondary-button" onClick={()=>fileInput.current?.click()}><Upload size={16}/>导入进度</button></div><input className="sr-only" ref={fileInput} type="file" accept="application/json,.json" aria-label="选择学习进度文件" onChange={e=>void importProgress(e.target.files?.[0])}/><p className="notice" role="status">{status}</p></div><div className="completion-list">{stages.map(s=><div key={s.id}><h3>{String(s.id).padStart(2,'0')} · {s.title}</h3>{s.lessons.map(l=><a key={l.id} href={`#/learn/${l.id}`}>{progress.completed.includes(l.id)?<Check size={16}/>:<Circle size={16}/>} {l.title}</a>)}</div>)}</div></section>
      :activeLab?<section><div className="page-heading"><h1>在实验里，看懂变化。</h1><p>先猜会发生什么，再调整一个参数，观察结果。所有实验均为教学模型。</p></div><div className="lab-tabs">{labList.map(l=><a key={l.id} href={`#/labs/${l.id}`} className={l.id===activeLab.id?'selected':''}>{l.title}</a>)}</div>{renderLab(activeLab.id)}<h2 className="section-heading">把实验接回课程</h2><div className="related-lessons">{lessons.filter(l=>l.experiment.lab===activeLab.id).map(l=><a key={l.id} href={`#/learn/${l.id}`}><span>{l.id}</span>{l.title}<ArrowUpRight size={16}/></a>)}</div></section>
      :<section className="page-heading"><h1>这一页还没有找到。</h1><p>链接可能不完整。可以从学习路线重新出发。</p><a className="primary-button" href="#/path">返回学习路线<ArrowRight size={16}/></a></section>}
      </main>
      <footer className="footer"><span>核磁 · 从零开始</span><span>理解物理，也理解它的边界。</span><a href="https://github.com/passwordis42/nmr-from-zero" target="_blank" rel="noreferrer">源代码<ArrowUpRight size={13}/></a></footer>
    </div>
  </>;
}

function LessonPage({lesson,stage,progress,onAnswer,onComplete,renderLab}:{lesson:Lesson;stage:Stage;progress:Progress;onAnswer:(v:number)=>void;onComplete:()=>void;renderLab:(id:LabId)=>React.ReactNode}) {
  const index=lessons.findIndex(l=>l.id===lesson.id), next=lessons[index+1], prev=lessons[index-1];
  const done=progress.completed.includes(lesson.id);
  return <article key={lesson.id} className="lesson-page">
    <div className="page-heading lesson-heading"><h1>{lesson.id==='1-1'?'我们怎样看见一个信号？':lesson.title}</h1><p>{stage.description}</p></div>
    <nav className="lesson-tabs" aria-label="本阶段课程">{stage.lessons.map((l,i)=><a href={`#/learn/${l.id}`} key={l.id} className={l.id===lesson.id?'active':''}><span>0{i+1}</span>{l.title}{progress.completed.includes(l.id)&&<Check size={14}/>}</a>)}</nav>
    <nav className="lesson-guide" aria-label="本课导航"><span>这一课</span>{[['读概念','.lesson-intuition'],['做实验','.lesson-experiment'],['看公式','.formula'],['检验理解','.quiz']].map(([label,selector],i)=><button key={label} onClick={e=>{const target=e.currentTarget.closest('article')?.querySelector<HTMLElement>(selector);if(target){if(target instanceof HTMLDetailsElement)target.open=true;target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}}><span>0{i+1}</span>{label}<ArrowRight size={12}/></button>)}</nav>
    <div className={lesson.id==='1-1'?'lesson-opening':''}><section className="lesson-intuition"><h2 className="accent-heading">先抓住一个问题</h2><p className="lesson-question">{lesson.question}</p>{lesson.intuition.map((p,i)=><p key={i}>{p}</p>)}</section>
    {lesson.id==='1-1'&&<section className="intro-machine"><Hardware compact/></section>}</div>
    <section className="example"><span>想一想这个例子</span><p>{lesson.example}</p></section>
    <section className="lesson-experiment"><div className="experiment-intro"><h2><FlaskConical size={21}/>动手试一试</h2><p>{lesson.experiment.instruction}</p></div>{renderLab(lesson.experiment.lab)}</section>
    <Formula lesson={lesson}/>
    <section className="hardware-connection"><h2 className="accent-heading">在真实仪器里</h2><p>{lesson.hardware}</p><a className="text-button" href="#/hardware">查看整机地图 <ArrowUpRight size={15}/></a></section>
    <aside className="misconception"><strong>别被这个直觉带偏</strong><p>{lesson.misconception}</p></aside>
    <Quiz lesson={lesson} answer={progress.answers[lesson.id]} onAnswer={onAnswer}/>
    <details className="lesson-sources"><summary>本课依据与延伸资料<ChevronDown size={15}/></summary><SourceLinks values={lesson.sources}/></details>
    <div className="lesson-completion"><button className={done?'secondary-button':'primary-button'} onClick={onComplete}><Check size={17}/>{done?'已完成本课 · 点击撤销':'我理解了，标记完成'}</button><span>{stage.outcome}</span></div>
    <nav className="lesson-pagination" aria-label="前后课程">{prev?<a href={`#/learn/${prev.id}`}><ArrowLeft size={18}/><span><small>上一课</small>{prev.title}</span></a>:<span/>}{next?<a href={`#/learn/${next.id}`}><span><small>下一课</small>{next.title}</span><ArrowRight size={18}/></a>:<a href="#/path"><span><small>已走完整条路线</small>回顾学习地图</span><ArrowRight size={18}/></a>}</nav>
  </article>;
}
