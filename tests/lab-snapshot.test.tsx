// @vitest-environment jsdom
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import Lab from '../src/components/Lab';
import GuidedActivity from '../src/components/GuidedActivity';
import type { ActivityHandle } from '../src/learning';
let root:Root,host:HTMLDivElement;
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.useFakeTimers();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.unstubAllGlobals();});
it('pauses real lab playback and keeps its snapshot equal to the displayed time and readings',async()=>{
  const ref=createRef<ActivityHandle>();await act(async()=>root.render(<Lab id="timing" ref={ref}/>));
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="播放实验动画"]')!.click());
  await act(async()=>vi.advanceTimersByTime(300));
  await act(async()=>ref.current!.pause());const frozen=ref.current!.getSnapshot();
  expect(frozen.time!.value).toBeGreaterThan(0);expect(frozen.time!.unit).toBe('μs');
  expect(frozen.parameters.find(p=>p.label==='接收开始')).toEqual({label:'接收开始',value:240,unit:'μs'});
  expect(frozen.readings.find(p=>p.label==='最早允许接收')?.value).toBe(220);
  await act(async()=>vi.advanceTimersByTime(500));expect(ref.current!.getSnapshot().time).toEqual(frozen.time);
  expect(host.querySelector('[aria-label="播放实验动画"]')).not.toBeNull();
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="实验动画前进一步"]')!.click());expect(ref.current!.getSnapshot().time!.value).toBeGreaterThan(frozen.time!.value);
});
it('lesson sampling view cannot reveal an unintroduced FFT and t1/t2 view has no echo switch',async()=>{
  await act(async()=>root.render(<Lab id="sampling" mode="time"/>));
  expect(host.querySelectorAll('svg.lab-plot')).toHaveLength(1);expect(host.textContent).not.toMatch(/FFT|傅里叶/);
  await act(async()=>root.render(<Lab id="relaxation" mode="t1t2"/>));
  expect(host.querySelectorAll('input[type="radio"],select option')).toHaveLength(0);
  expect(host.textContent).not.toContain('180°');
});
it('guided encoding exports physical units and finite derived readings',async()=>{
  const ref=createRef<ActivityHandle>();await act(async()=>root.render(<GuidedActivity id="frequency-encoding" ref={ref}/>));
  const snapshot=ref.current!.getSnapshot();
  expect(snapshot.parameters.some(p=>p.unit==='mT/m')).toBe(true);
  expect(snapshot.readings.some(p=>p.unit==='Hz')).toBe(true);
  expect(JSON.stringify(snapshot)).not.toContain('NaN');
});
