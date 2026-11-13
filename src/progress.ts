import type { Progress } from './types';
export const STORAGE_KEY = 'nmr-from-zero.progress.v1';
export function emptyProgress(): Progress { return { version: 1, completed: [], lastLesson: '1-1', answers: {}, updatedAt: new Date().toISOString() }; }
export function parseProgress(input: unknown, ids: Set<string>): Progress {
  if (!input || typeof input !== 'object') throw new Error('这不是有效的学习进度文件。');
  const p = input as Partial<Progress>;
  if (p.version !== 1 || !Array.isArray(p.completed) || typeof p.lastLesson !== 'string' || !p.answers || typeof p.answers !== 'object' || Array.isArray(p.answers)) throw new Error('进度格式不正确，请选择从本站导出的 JSON 文件。');
  const answers: Record<string, number> = {};
  for (const [id, answer] of Object.entries(p.answers)) if (ids.has(id) && Number.isInteger(answer) && answer >= 0 && answer < 4) answers[id] = answer;
  return { version: 1, completed: [...new Set(p.completed.filter(id => typeof id === 'string' && ids.has(id)))], lastLesson: ids.has(p.lastLesson) ? p.lastLesson : '1-1', answers, updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString() };
}
