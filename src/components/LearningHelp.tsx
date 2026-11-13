import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, Copy, HelpCircle, MessageCircle, RefreshCw, X } from 'lucide-react';
import katex from 'katex';
import { conceptById } from '../content/concepts';
import ConceptVisual from './ConceptVisual';
import { sources } from '../content/resources';
import { stripTerms, type AskContext } from '../learning';
import { buildPrompt, contextText, snapshotText } from '../help';
import './learning-help.css';

type HelpValue = { activeConcept: string | null; dialogId: string; page: AskContext; openConcept: (id: string, anchor: HTMLElement, context?: AskContext) => void; ask: (context: AskContext, anchor?: HTMLElement) => void };
const HelpContext = createContext<HelpValue | null>(null);
export function useLearningHelp() { const value = useContext(HelpContext); if (!value) throw new Error('LearningHelpProvider is missing'); return value; }

export function TermText({ text, context }: { text: string; context?: AskContext }) {
  const help = useLearningHelp(); const seen = new Set<string>();
  const result: ReactNode[] = []; const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g; let previous=0; let match: RegExpExecArray | null;
  while ((match=pattern.exec(text))) {
    if (match.index>previous) result.push(text.slice(previous,match.index));
    const [token,id,label]=match; const visible=label||id; const key=`${id}-${match.index}`;
    if (conceptById.has(id)&&!seen.has(id)) { seen.add(id); result.push(<ConceptTrigger key={key} id={id} label={visible} context={{...(context??help.page),quote:stripTerms(text)}}/>); }
    else result.push(visible);
    previous=match.index+token.length;
  }
  if (previous<text.length) result.push(text.slice(previous));
  return <>{result}</>;
}
export function ConceptTrigger({ id, label, context }: {id:string;label?:string;context?:AskContext}) {
  const help=useLearningHelp();
  return <button type="button" className="term-trigger" data-concept-id={id} aria-haspopup="dialog" aria-expanded={help.activeConcept===id} aria-controls={help.activeConcept===id?help.dialogId:undefined} aria-label={`解释：${label??id}`} onClick={e=>help.openConcept(id,e.currentTarget,context)}>{label??id}</button>;
}
export function ExplainedParagraph({ text, context, className='' }: {text:string;context:AskContext;className?:string}) {
  const help=useLearningHelp();
  return <div className={`explained-passage ${className}`} data-passage data-location={context.location} data-title={context.title} data-sources={context.sources.join(',')}><p><TermText text={text} context={context}/></p><button type="button" className="passage-ask" onClick={e=>help.ask({...context,quote:stripTerms(text)},e.currentTarget)} aria-label={`问这一段：${stripTerms(text).slice(0,30)}`}><MessageCircle size={14}/><span>问这一段</span></button></div>;
}

export default function LearningHelpProvider({children,page}:{children:ReactNode;page:AskContext}) {
  const [concept,setConcept]=useState<{id:string;history:string[];context:AskContext}|null>(null);
  const [question,setQuestion]=useState<AskContext|null>(null);
  const [selection,setSelection]=useState<{text:string;x:number;y:number;context:AskContext}|null>(null);
  const [small,setSmall]=useState(()=>matchMedia('(max-width:700px)').matches);
  const [position,setPosition]=useState({left:20,top:90});
  const anchor=useRef<HTMLElement|null>(null), dialog=useRef<HTMLDivElement>(null), drafts=useRef(new Map<string,{question:string;background:string}>());
  const headingId=useId(), dialogId=useId(); const modal=!!question||(!!concept&&small);
  const close=(restoreFocus=true)=>{setConcept(null);setQuestion(null);setSelection(null);const target=anchor.current;if(restoreFocus)requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true});});};
  const openConcept=(id:string,target:HTMLElement,context?:AskContext)=>{
    if(!conceptById.has(id))return;
    if(concept?.id===id&&dialog.current?.contains(target))return;
    if(concept&&target===anchor.current&&id===concept.id){close();return;}
    const nested=!!dialog.current?.contains(target);
    if(!nested)anchor.current=target;
    setQuestion(null);setSelection(null);
    setConcept(old=>({id,history:nested&&old&&old.id!==id?[...old.history,old.id]:[],context:context??old?.context??page}));
  };
  const ask=(context:AskContext,target?:HTMLElement)=>{if(target&&!dialog.current?.contains(target))anchor.current=target;setConcept(null);setSelection(null);setQuestion(context);};
  useEffect(()=>{const media=matchMedia('(max-width:700px)');const change=()=>setSmall(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  useEffect(()=>{setConcept(null);setQuestion(null);setSelection(null);},[page.location]);
  useEffect(()=>{
    if(!concept&&!question)return;
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key!=='Tab'||!modal||!dialog.current)return;
      const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea,summary,[tabindex="0"]')).filter(e=>e.getClientRects().length>0);
      const first=items[0],last=items.at(-1);if(!first)return;
      if(event.shiftKey&&(document.activeElement===first||!dialog.current.contains(document.activeElement))){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.current.contains(document.activeElement))){event.preventDefault();first.focus();}
    };
    const outside=(event:PointerEvent)=>{if(!modal&&!dialog.current?.contains(event.target as Node)&&!anchor.current?.contains(event.target as Node))close(false);};
    document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
    const oldOverflow=document.body.style.overflow;if(modal)document.body.style.overflow='hidden';
    dialog.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus({preventScroll:true});
    return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);document.body.style.overflow=oldOverflow;};
  },[!!concept,!!question,modal]);
  useLayoutEffect(()=>{if(concept){dialog.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus({preventScroll:true});const body=dialog.current?.querySelector<HTMLElement>('.help-body');if(body)body.scrollTop=0;}},[concept?.id]);
  useLayoutEffect(()=>{
    if(!concept||small)return;
    const update=()=>{const rect=anchor.current?.getBoundingClientRect();if(!rect)return;const width=Math.min(460,window.innerWidth-32),height=Math.min(dialog.current?.offsetHeight??520,window.innerHeight-32);setPosition({left:Math.min(window.innerWidth-width-16,Math.max(16,rect.left)),top:Math.max(16,rect.bottom+12+height<window.innerHeight?rect.bottom+12:rect.top-height-12)});};
    update();window.addEventListener('resize',update);window.addEventListener('scroll',update,true);return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
  },[concept?.id,small]);
  useEffect(()=>{
    const detect=()=>{
      if(question||concept)return;
      const value=window.getSelection();const text=value?.toString().trim()??'';const node=value?.anchorNode?.parentElement;
      if(!value||value.isCollapsed||text.length<2||!node?.closest('main')||node.closest('textarea,input,.help-dialog')){setSelection(null);return;}
      const rect=value.getRangeAt(0).getBoundingClientRect();const passage=node.closest<HTMLElement>('[data-passage]');
      setSelection({text,x:Math.min(innerWidth-170,Math.max(12,rect.left)),y:Math.min(innerHeight-54,Math.max(12,rect.bottom+8)),context:{...page,title:passage?.dataset.title??page.title,location:passage?.dataset.location??page.location,sources:passage?.dataset.sources?.split(',').filter(Boolean)??page.sources,quote:text}});
    };
    document.addEventListener('pointerup',detect);document.addEventListener('keyup',detect);return()=>{document.removeEventListener('pointerup',detect);document.removeEventListener('keyup',detect);};
  },[page,!!question,!!concept]);
  const value=concept?conceptById.get(concept.id):undefined;
  return <HelpContext.Provider value={{page,openConcept,ask,activeConcept:concept?.id??null,dialogId}}>
    <div className="learning-app" inert={modal?true:undefined}>{children}</div>
    {selection&&<button className="selection-ask" style={{left:selection.x,top:selection.y}} onPointerDown={e=>e.preventDefault()} onClick={e=>ask(selection.context,e.currentTarget)}><MessageCircle size={15}/>带着选中内容问 AI</button>}
    {modal&&<div className="help-backdrop" onPointerDown={()=>close()}/>}
    {value&&concept&&<div ref={dialog} id={dialogId} className={`help-dialog concept-popover ${small?'mobile-sheet':''}`} role="dialog" aria-modal={modal||undefined} aria-labelledby={headingId} style={!small?position:undefined}>
      <header className="help-header"><span><HelpCircle size={16}/>随文解释</span><button data-initial-focus aria-label="关闭解释" onClick={()=>close()}><X size={19}/></button></header>
      <div className="help-body"><div className="concept-heading">{concept.history.length>0&&<button className="text-button" onClick={()=>setConcept(c=>c?{...c,id:c.history.at(-1)!,history:c.history.slice(0,-1)}:null)}><ArrowLeft size={14}/>返回上一词</button>}<h2 id={headingId}>{value.term}</h2><small>{value.english}</small></div>
        <p className="concept-plain"><TermText context={concept.context} text={value.plain}/></p>
        {concept.context.quote&&<details className="concept-context"><summary>你刚才读到的这句话</summary><p>{concept.context.quote}</p></details>}
        <div className="concept-example"><strong>放进一个例子里</strong><p><TermText context={concept.context} text={value.example}/></p></div>
        {value.visual&&<ConceptVisual key={value.id} kind={value.visual}/>}
        <details className="concept-academic"><summary>正式定义与学术说明<ChevronDown size={16}/></summary><p><TermText context={concept.context} text={value.academic}/></p>{value.formula&&<><div className="math" dangerouslySetInnerHTML={{__html:katex.renderToString(value.formula.tex,{displayMode:true,throwOnError:false,trust:false})}}/><ul>{value.formula.symbols.map(s=><li key={s}>{s}</li>)}</ul></>}</details>
        <div className="concept-misconception"><strong>容易混淆的地方</strong><p><TermText context={concept.context} text={value.misconception}/></p></div>
        {!!value.relatedIds.length&&<div className="concept-related"><span>顺着理解</span>{value.relatedIds.filter(id=>conceptById.has(id)).map(id=><ConceptTrigger key={id} id={id}/>)}</div>}
        <a className="text-button" href={`#/learn/${value.lessonId}`} onClick={()=>close()}>到相关课程继续理解<ArrowUpRight size={14}/></a>
        <div className="source-links">{value.sourceIds.map(id=>sources.find(s=>s.id===id)).filter(s=>!!s).map(s=><a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={12}/></a>)}</div>
      </div><footer className="help-footer"><button className="secondary-button" onClick={e=>ask({...concept.context,title:`${value.term} · ${concept.context.title}`,conceptId:value.id,quote:`${concept.context.quote}\n\n本地解释：${stripTerms(value.plain)}\n学术说明：${stripTerms(value.academic)}`,sources:[...new Set([...concept.context.sources,...value.sourceIds])]},e.currentTarget)}><MessageCircle size={16}/>带着这个词问 AI</button></footer>
    </div>}
    {question&&<div ref={dialog} id={dialogId} className="help-dialog ask-drawer" role="dialog" aria-modal="true" aria-labelledby={headingId}><header className="help-header"><span><MessageCircle size={17}/>带着这段问 AI</span><button data-initial-focus aria-label="关闭提问" onClick={()=>close()}><X size={19}/></button></header><AskPanel key={`${question.location}-${question.conceptId??''}-${question.snapshot?.id??''}-${question.quote}`} context={question} headingId={headingId} drafts={drafts.current} onReturn={()=>close()}/></div>}
  </HelpContext.Provider>;
}

function AskPanel({context,headingId,drafts,onReturn}:{context:AskContext;headingId:string;drafts:Map<string,{question:string;background:string}>;onReturn:()=>void}) {
  const key=`${context.location}|${context.conceptId??''}|${context.snapshot?.id??''}|${context.quote}`;
  const [question,setQuestion]=useState(()=>drafts.get(key)?.question??'');
  const [background,setBackground]=useState(()=>drafts.get(key)?.background??contextText(context,location.href));
  const [snapshot,setSnapshot]=useState(context.snapshot),[includeSnapshot,setIncludeSnapshot]=useState(true);
  const [status,setStatus]=useState(''),[fallback,setFallback]=useState(false);
  const fallbackRef=useRef<HTMLTextAreaElement>(null);
  const prepared=buildPrompt(question,background,includeSnapshot?snapshot:undefined);
  useEffect(()=>{drafts.set(key,{question,background});},[key,question,background,drafts]);
  const copy=async()=>{try{await navigator.clipboard.writeText(prepared);setStatus('已复制。打开你使用的 AI，粘贴后再发送。');setFallback(false);}catch{setFallback(true);setStatus('浏览器未允许自动复制。请在下方全选后手动复制。');requestAnimationFrame(()=>{fallbackRef.current?.focus();fallbackRef.current?.select();});}};
  return <><div className="help-body"><h2 id={headingId}>把问题和背景，一起带走。</h2><p className="ask-intro">本站只整理与复制，不会自动发送。你可以粘贴到 ChatGPT 或其他 AI。提问草稿仅保留在本次打开网页期间。</p><div className="ask-location">{context.title}<a href={context.location} onClick={onReturn}>原文位置<ArrowUpRight size={13}/></a></div><label className="ask-label">你不明白哪里？<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="例如：线圈两端的电压是怎样产生的？" rows={3}/></label><div className="ask-presets">{['请逐句解释，先说清每个对象。','请用一个具体例子解释因果关系。','请解释图上的变化和读数。'].map(text=><button key={text} onClick={()=>setQuestion(text)}>{text}</button>)}</div><details className="ask-background"><summary>将附带的背景 · 可查看、编辑或删除<ChevronDown size={16}/></summary><textarea aria-label="将附带的课程背景" value={background} onChange={e=>setBackground(e.target.value)} rows={9}/></details>
    {snapshot&&<section className="ask-snapshot"><label><input type="checkbox" checked={includeSnapshot} onChange={e=>setIncludeSnapshot(e.target.checked)}/>附带当前实验快照</label><p>实验已暂停；下方记录固定在提问时刻。</p><pre>{snapshotText(snapshot)}</pre>{context.refreshSnapshot&&<button className="text-button" onClick={()=>{setSnapshot(context.refreshSnapshot!());setStatus('已重新读取实验状态。');}}><RefreshCw size={13}/>更新实验状态</button>}</section>}
    <details className="ask-preview"><summary>查看完整提问文本<ChevronDown size={16}/></summary><pre>{prepared}</pre></details>{fallback&&<label className="ask-label">手动复制完整文本<textarea ref={fallbackRef} value={prepared} readOnly rows={9}/></label>}<p className="copy-status" role="status">{status}</p></div><footer className="help-footer"><button className="primary-button" onClick={()=>void copy()}><Copy size={16}/>复制问题和背景</button><a className="secondary-button" href="https://chatgpt.com/" target="_blank" rel="noreferrer">打开 ChatGPT<ArrowUpRight size={16}/></a></footer></>;
}
