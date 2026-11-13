export type GuidedId = 'apparatus' | 'signal-path' | 'measurement-cycle' | 'induction' | 'vectors' | 'exponential' | 'precession' | 'net-magnetization' | 'iq' | 'frequency-encoding' | 'phase-encoding' | 'slice-selection' | 'echo-sequence' | 'contrast';
export interface LessonStep {
  id: string;
  title: string;
  body: string[];
  diagram?: { labels: string[]; active: number; caption: string };
  visual?: { id: GuidedId; focus?: string };
}
export interface ActivitySpec {
  kind: 'guided' | 'lab' | 'reasoning'; id: string; title: string; purpose: string; setup: string; prediction: string; actions: string[]; observe: string; explain: string; modelScope: string; mode?: string;
}
export interface SnapshotValue { label: string; value: string | number; unit?: string }
export interface LabSnapshot { id: string; title: string; capturedAt: string; view?: string; time?: { value: number; unit: string }; parameters: SnapshotValue[]; readings: SnapshotValue[]; model: string }
export interface ActivityHandle { pause(): void; getSnapshot(): LabSnapshot }
export interface AskContext { title: string; location: string; quote: string; conceptId?: string; snapshot?: LabSnapshot; sources: string[]; refreshSnapshot?: () => LabSnapshot }
export const CONTENT_REVISION = 2;
export const stripTerms = (text: string) => text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id: string, label?: string) => label ?? id);
export function lessonLocation(id: string, step?: string, mode?: 'steps' | 'all') {
  const query = new URLSearchParams(); if (step) query.set('step', step); if (mode === 'all') query.set('view', mode);
  return `#/learn/${id}${query.size ? `?${query}` : ''}`;
}
export function parseRoute(hash: string) { const [path, query = ''] = hash.replace(/^#/, '').split('?'); return { path: path || '/path', params: new URLSearchParams(query) }; }
