import type { Progress } from './types';
import { CONTENT_REVISION } from './learning';
export const STORAGE_KEY = 'nmr-from-zero.progress.v2';
export const LEGACY_STORAGE_KEY = 'nmr-from-zero.progress.v1';
export function emptyProgress(): Progress { return { version: 2, contentRevision: CONTENT_REVISION, completed: [], lastLesson: '1-1', answers: {}, updatedAt: new Date().toISOString(), positions: {}, readingMode: 'steps', legacy: { completed: [], answers: {} } }; }
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
export function parseProgress(input: unknown, ids: Set<string>): Progress {
  if (!record(input) || ![1,2].includes(input.version as number) || !Array.isArray(input.completed) || typeof input.lastLesson !== 'string' || !record(input.answers)) throw new Error('进度格式不正确，请选择从本站导出的 JSON 文件。');
  const cleanCompleted = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
  const cleanAnswers = (value: unknown) => Object.fromEntries(Object.entries(record(value) ? value : {}).filter(([id,answer]) => ids.has(id) && typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < 4)) as Record<string,number>;
  const completed = cleanCompleted(input.completed), answers = cleanAnswers(input.answers);
  const result = emptyProgress();
  result.lastLesson = ids.has(input.lastLesson) ? input.lastLesson : '1-1';
  result.updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : result.updatedAt;
  const legacy = record(input.legacy) ? input.legacy : {};
  result.legacy = { completed: cleanCompleted(legacy.completed), answers: cleanAnswers(legacy.answers) };
  if (input.version === 1 || input.contentRevision !== CONTENT_REVISION) {
    result.legacy.completed = [...new Set([...result.legacy.completed,...completed])];
    result.legacy.answers = {...result.legacy.answers,...answers};
  } else {
    result.completed = completed;
    result.answers = answers;
    result.positions = Object.fromEntries(Object.entries(record(input.positions) ? input.positions : {}).filter(([id,value])=>ids.has(id)&&typeof value==='string'&&/^[a-z0-9-]{1,64}$/.test(value))) as Record<string,string>;
    result.readingMode = input.readingMode === 'all' ? 'all' : 'steps';
  }
  return result;
}
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  return {...incoming, completed:[...new Set([...current.completed,...incoming.completed])], answers:{...current.answers,...incoming.answers}, positions:{...current.positions,...incoming.positions}, legacy:{completed:[...new Set([...current.legacy.completed,...incoming.legacy.completed])], answers:{...current.legacy.answers,...incoming.legacy.answers}}, updatedAt:new Date().toISOString()};
}
