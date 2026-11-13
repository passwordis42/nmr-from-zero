import { describe, expect, it } from 'vitest';
import { emptyProgress, mergeProgress, parseProgress } from '../src/progress';
import { contextText, buildPrompt, snapshotText } from '../src/help';
import { lessonLocation, parseRoute, stripTerms, type LabSnapshot } from '../src/learning';
const ids = new Set(['1-1','1-2','1-3']);
describe('revision-aware progress and deep links',()=>{
  it('archives old answers without assigning them to new questions and round-trips the archive',()=>{
    const old={version:1,completed:['1-1'],answers:{'1-2':2},lastLesson:'1-2'};
    const migrated=parseProgress(old,ids);
    expect(migrated.completed).toEqual([]);expect(migrated.answers).toEqual({});
    expect(migrated.legacy).toEqual({completed:['1-1'],answers:{'1-2':2}});
    expect(parseProgress(JSON.parse(JSON.stringify(migrated)),ids)).toEqual(migrated);
  });
  it('merges old imports without losing current completions, answers or step positions',()=>{
    const current={...emptyProgress(),completed:['1-3'],answers:{'1-3':1},positions:{'1-3':'activity'}};
    const old=parseProgress({version:1,completed:['1-1'],answers:{'1-1':0},lastLesson:'1-1'},ids);
    const merged=mergeProgress(current,old);
    expect(merged.completed).toEqual(['1-3']);expect(merged.answers).toEqual({'1-3':1});
    expect(merged.positions['1-3']).toBe('activity');expect(merged.legacy.answers['1-1']).toBe(0);
  });
  it('preserves current reading preference and stable step links across export/import',()=>{
    const current={...emptyProgress(),readingMode:'all' as const,positions:{'1-2':'cause'},lastLesson:'1-2'};
    const imported=parseProgress(JSON.parse(JSON.stringify(current)),ids);
    expect(imported.readingMode).toBe('all');expect(imported.positions).toEqual({'1-2':'cause'});
    const link=lessonLocation('1-2','cause','all');
    const route=parseRoute(link.slice(1));expect(route.path).toBe('/learn/1-2');expect(route.params.get('step')).toBe('cause');expect(route.params.get('view')).toBe('all');
  });
});
describe('portable question context',()=>{
  const snapshot:LabSnapshot={id:'spin',title:'激发',capturedAt:'2026-11-13T00:00:00.000Z',time:{value:12,unit:'μs'},parameters:[{label:'B₀',value:50,unit:'mT'}],readings:[{label:'频率',value:2.128874,unit:'MHz'}],model:'教学模型'};
  it('exports clean text, the exact step and sources without answer or history fields',()=>{
    const context=contextText({title:'一课',location:lessonLocation('1-2','cause'),quote:'测量[[线圈]]两端的[[电压|电位差]]。',sources:['keeler5']},'https://passwordis42.github.io/nmr-from-zero/#/learn/1-1');
    expect(context).toContain('#/learn/1-2?step=cause');expect(context).toContain('测量线圈两端的电位差。');
    expect(context).not.toContain('[[');expect(context).not.toContain('answers');expect(context).toContain('chapter_5.pdf');
    expect(stripTerms('[[横向弛豫时间|T₂]]')).toBe('T₂');
  });
  it('includes units and a frozen snapshot only when requested',()=>{
    const report=snapshotText(snapshot);expect(report).toContain('50 mT');expect(report).toContain('2.128874 MHz');expect(report).toContain('12 μs');
    expect(buildPrompt('为何？','背景',snapshot)).toContain(report);
    expect(buildPrompt('为何？','背景')).not.toContain('快照时间');
  });
});
