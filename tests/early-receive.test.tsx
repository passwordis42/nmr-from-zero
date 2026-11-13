// @vitest-environment jsdom
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GuidedActivity from '../src/components/GuidedActivity';
import type { ActivityHandle } from '../src/learning';

let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const button = (text: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent === text)!;

it('compares early reception, updates the window and snapshot, and restores correct order', async () => {
  const ref = createRef<ActivityHandle>();
  await act(async () => root.render(<GuidedActivity id="measurement-cycle" ref={ref} />));
  expect(ref.current!.getSnapshot().parameters.find(p => p.label === '是否提前接收')?.value).toBe('否');
  await act(async () => button('试试过早接收').click());
  const early = ref.current!.getSnapshot();
  expect(early.view).toBe('恢复：等待电路安静');
  expect(early.parameters.find(p => p.label === '是否提前接收')?.value).toBe('是');
  expect(early.readings.find(p => p.label === '所选接收窗口的可靠性')?.value).toContain('不能可靠辨认');
  expect(host.querySelector('[aria-label="接收窗口落在电路恢复期"]')).not.toBeNull();
  expect(host.textContent).toContain('不是样品还没有信号');
  expect(host.textContent).toContain('磁场一直存在');
  await act(async () => button('恢复正确顺序').click());
  expect(ref.current!.getSnapshot().view).toBe('接收：记录电压');
  expect(ref.current!.getSnapshot().parameters.find(p => p.label === '是否提前接收')?.value).toBe('否');
  expect(host.querySelector('[aria-label="接收窗口位于电路恢复之后"]')).not.toBeNull();
  await act(async () => button('试试过早接收').click());
  await act(async () => button('重置').click());
  expect(ref.current!.getSnapshot().view).toBe('准备：样品准备好');
  expect(ref.current!.getSnapshot().parameters.find(p => p.label === '是否提前接收')?.value).toBe('否');
});

it('does not add the reception challenge to focused reading diagrams', async () => {
  await act(async () => root.render(<GuidedActivity id="measurement-cycle" focus="recover" />));
  expect(button('试试过早接收')).toBeUndefined();
  expect(host.querySelector('.guided-reception')).toBeNull();
});
