import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { stages } from '../src/content/course';
import { sources, glossary, hardwareModules, advancedReadings, corrections } from '../src/content/resources';
import { parseProgress } from '../src/progress';
import { buildSteps } from '../src/content/buildGuide';
import { projectAudits } from '../src/content/projectAudit';
const lessons=stages.flatMap(s=>s.lessons);
const ids=new Set(lessons.map(l=>l.id));
const sourceIds=new Set(sources.map(s=>s.id));
describe('complete and renderable learning content',()=>{
  it('has twelve stages and 36 uniquely addressable complete lessons',()=>{
    expect(stages).toHaveLength(12); expect(lessons).toHaveLength(36); expect(ids.size).toBe(36);
    for(const stage of stages){expect(stage.lessons).toHaveLength(3);for(const lesson of stage.lessons){
      expect(lesson.intuition.join('').length).toBeGreaterThan(180);
      expect(lesson.quiz.options).toHaveLength(4);expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);expect(lesson.quiz.answer).toBeLessThan(4);
      expect(lesson.question.length).toBeGreaterThan(8);
      for(const text of [lesson.example,lesson.hardware,lesson.misconception,lesson.experiment.instruction,lesson.quiz.explanation])expect(text.length).toBeGreaterThan(15);
      expect(()=>katex.renderToString(lesson.formula.tex,{throwOnError:true})).not.toThrow();
      expect(lesson.sources.length).toBeGreaterThan(0);for(const id of lesson.sources)expect(sourceIds.has(id),`missing ${id} in ${lesson.id}`).toBe(true);
    }}
  });
  it('resolves hardware, glossary, advanced and correction references',()=>{
    expect(glossary.length).toBeGreaterThanOrEqual(40);expect(hardwareModules).toHaveLength(9);
    for(const m of [...hardwareModules,...glossary])expect(m.stage).toBeGreaterThanOrEqual(1);
    for(const r of advancedReadings)for(const id of r.sources)expect(sourceIds.has(id)).toBe(true);
    for(const r of corrections)expect(sourceIds.has(r.sourceId)).toBe(true);
    for(const s of sources)expect(new URL(s.url).protocol).toBe('https:');
  });
  it('keeps manufacturing routes, lesson references and evidence links usable',()=>{
    const buildIds = buildSteps.map(step => step.id);
    expect(new Set(buildIds).size).toBe(buildIds.length);
    for(const step of buildSteps){
      expect(step.id).toMatch(/^[a-z0-9-]+$/);
      for(const id of step.lessonIds)expect(ids.has(id),`missing lesson ${id} in ${step.id}`).toBe(true);
      for(const id of step.sourceIds)expect(sourceIds.has(id),`missing source ${id} in ${step.id}`).toBe(true);
      expect(step.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(step.quiz.answer).toBeLessThan(step.quiz.options.length);
    }
    for(const project of projectAudits){
      expect(project.evidence.length).toBeGreaterThan(0);
      for(const evidence of project.evidence)expect(new URL(evidence.url).protocol).toBe('https:');
      for(const gap of project.gaps)expect(gap).toMatch(/作者承认|工程推论|尚未核验/);
    }
  });
});
describe('portable learning progress',()=>{
  it('rejects incompatible or malformed progress',()=>{
    for(const value of [null,{}, {version:2}, {version:1,completed:[],lastLesson:'1-1',answers:[]}])expect(()=>parseProgress(value,ids)).toThrow();
  });
  it('keeps valid records and discards unknown lessons and invalid answers',()=>{
    const p=parseProgress({version:1,completed:['1-1','1-1','missing'],lastLesson:'bad',answers:{'1-1':2,'1-2':9,'missing':0}},ids);
    expect(p.completed).toEqual(['1-1']);expect(p.lastLesson).toBe('1-1');expect(p.answers).toEqual({'1-1':2});
  });
});
