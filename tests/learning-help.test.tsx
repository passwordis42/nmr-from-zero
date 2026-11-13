// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LearningHelpProvider, { ExplainedParagraph, TermText, useLearningHelp } from '../src/components/LearningHelp';
import type { AskContext, LabSnapshot } from '../src/learning';
vi.mock('../src/components/ConceptVisual',()=>({default:()=>null}));
const context:AskContext={title:'对象',location:'#/learn/1-1?step=coil',quote:'线圈两端',sources:['keeler5']};
let root:Root, host:HTMLDivElement;
const buttons=()=>Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
const button=(text:string)=>buttons().find(b=>b.textContent===text||b.getAttribute('aria-label')===text)!;
const click=async(element:HTMLElement)=>{await act(async()=>element.click());};
beforeEach(()=>{
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{cb(0);return 0;});
  vi.stubGlobal('fetch',vi.fn());
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
describe('explanations and user-controlled AI handoff',()=>{
  it('offers selected text with its precise paragraph location',async()=>{
    await act(async()=>root.render(<LearningHelpProvider page={context}><main><ExplainedParagraph text="只询问这一句的含义。" context={context}/></main></LearningHelpProvider>));
    const range=document.createRange();range.selectNodeContents(host.querySelector('p')!);
    Object.defineProperty(range,'getBoundingClientRect',{value:()=>({left:20,bottom:120})});
    const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);
    await act(async()=>document.dispatchEvent(new Event('pointerup',{bubbles:true})));
    await click(button('带着选中内容问 AI'));await click(button('复制问题和背景'));
    const copied=vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];expect(copied).toContain('只询问这一句的含义。');expect(copied).toContain('#/learn/1-1?step=coil');
    selection.removeAllRanges();
  });
  it('closes on Escape, restores focus, and opens only one card including related terms',async()=>{
    await act(async()=>root.render(<LearningHelpProvider page={context}><main><TermText text="这是[[线圈]]。"/></main></LearningHelpProvider>));
    const trigger=button('解释：线圈');await click(trigger);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const related=document.querySelector<HTMLElement>('.concept-related button')!;await click(related);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);expect(button('返回上一词')).toBeDefined();
    await click(button('返回上一词'));
    await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    expect(document.querySelector('[role="dialog"]')).toBeNull();expect(document.activeElement).toBe(trigger);
  });
  it('retains the correct paragraph, offers manual copy on failure, and never sends a request',async()=>{
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('denied'));
    await act(async()=>root.render(<LearningHelpProvider page={context}><main><ExplainedParagraph text="第一段[[线圈]]" context={context}/><ExplainedParagraph text="第二段[[电压]]" context={context}/></main></LearningHelpProvider>));
    await click(document.querySelectorAll<HTMLElement>('.passage-ask')[0]);await click(button('关闭提问'));
    await click(document.querySelectorAll<HTMLElement>('.passage-ask')[1]);await click(button('复制问题和背景'));
    const fallback=document.querySelector<HTMLTextAreaElement>('.ask-label textarea[readonly]')!;
    expect(fallback.value).toContain('第二段电压');expect(fallback.value).not.toContain('第一段');expect(fallback.value).not.toContain('[[');
    expect(document.querySelector<HTMLAnchorElement>('a[href="https://chatgpt.com/"]')?.search).toBe('');expect(fetch).not.toHaveBeenCalled();
    await click(document.querySelector<HTMLElement>('.ask-location a')!);expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it('keeps a snapshot fixed until the explicit refresh button is pressed',async()=>{
    let value=50;
    const getSnapshot=():LabSnapshot=>({id:'sample',title:'场强',capturedAt:'fixed',parameters:[{label:'B₀',value,unit:'mT'}],readings:[],model:'教学'});
    function Launcher(){const help=useLearningHelp();return <button onClick={e=>help.ask({...context,snapshot:getSnapshot(),refreshSnapshot:getSnapshot},e.currentTarget)}>问实验</button>;}
    await act(async()=>root.render(<LearningHelpProvider page={context}><Launcher/></LearningHelpProvider>));
    await click(button('问实验'));value=80;
    await click(button('复制问题和背景'));expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('50 mT');
    await click(button('更新实验状态'));await click(button('复制问题和背景'));
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[1][0]).toContain('80 mT');
  });
});
