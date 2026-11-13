import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { stages } from '../src/content/course';
import { sources, glossary, hardwareModules, advancedReadings, corrections } from '../src/content/resources';
import { concepts, conceptById } from '../src/content/concepts';
import { parseProgress } from '../src/progress';
import { buildSteps } from '../src/content/buildGuide';
import { projectAudits } from '../src/content/projectAudit';
import { labGuides } from '../src/content/labGuides';
import { CONTENT_REVISION, lessonLocation, parseRoute, type ActivitySpec, type GuidedId } from '../src/learning';
import type { LabId } from '../src/types';

const lessons = stages.flatMap(stage => stage.lessons);
const ids = new Set(lessons.map(lesson => lesson.id));
const sourceIds = new Set(sources.map(source => source.id));
const lessonIndex = new Map(lessons.map((lesson, index) => [lesson.id, index]));
const reservedStepIds = new Set(['activity', 'formula', 'check']);
const labs: Record<LabId, true> = { waves: true, spin: true, relaxation: true, sampling: true, field: true, coil: true, timing: true, imaging: true };
// Keep this runtime contract exhaustive when GuidedId gains a new renderer.
const guided: Record<GuidedId, true> = {
  apparatus: true, 'signal-path': true, 'measurement-cycle': true, induction: true,
  vectors: true, exponential: true, precession: true, 'net-magnetization': true,
  iq: true, 'frequency-encoding': true, 'phase-encoding': true, 'slice-selection': true,
  'echo-sequence': true, contrast: true,
};
const reasoning = new Set(['model-boundaries', 'workflow', 'source-audit', 'fault-finding']);

function* stringsIn(value: unknown, path = 'content'): Generator<{ text: string; path: string }> {
  if (typeof value === 'string') yield { text: value, path };
  else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* stringsIn(value[i], `${path}[${i}]`);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) yield* stringsIn(child, `${path}.${key}`);
  }
}

function checkActivity(activity: ActivitySpec, label: string) {
  expect(['guided', 'lab', 'reasoning'], label).toContain(activity.kind);
  if (activity.kind === 'guided') expect(Object.hasOwn(guided, activity.id), `${label}: missing guided activity ${activity.id}`).toBe(true);
  if (activity.kind === 'lab') expect(Object.hasOwn(labs, activity.id), `${label}: missing lab ${activity.id}`).toBe(true);
  if (activity.kind === 'reasoning') expect(reasoning.has(activity.id), `${label}: missing reasoning activity ${activity.id}`).toBe(true);
  expect(activity.actions.length, `${label}: actions`).toBeGreaterThan(0);
  for (const text of [activity.title, activity.purpose, activity.setup, activity.prediction, ...activity.actions, activity.observe, activity.explain, activity.modelScope]) {
    expect(text.trim().length, `${label}: empty activity field`).toBeGreaterThan(3);
  }
}

describe('complete and renderable learning content', () => {
  it('has twelve stages and 36 uniquely addressable complete lessons', () => {
    expect(stages).toHaveLength(12);
    expect(lessons).toHaveLength(36);
    expect(ids.size).toBe(36);
    expect(stages.map(stage => stage.id)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    for (const stage of stages) {
      expect(stage.lessons).toHaveLength(3);
      for (const [index, lesson] of stage.lessons.entries()) {
        expect(lesson.id).toBe(`${stage.id}-${index + 1}`);
        expect(lesson.revision).toBe(CONTENT_REVISION);
        expect(lesson.intuition.join('').length, lesson.id).toBeGreaterThan(180);
        expect(lesson.intuition).toEqual(lesson.steps.flatMap(step => step.body));
        expect(lesson.quiz.options).toHaveLength(4);
        expect(Number.isInteger(lesson.quiz.answer)).toBe(true);
        expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);
        expect(lesson.quiz.answer).toBeLessThan(lesson.quiz.options.length);
        expect(lesson.question.length).toBeGreaterThan(8);
        for (const text of [lesson.example, lesson.hardware, lesson.misconception, lesson.experiment.instruction, lesson.quiz.explanation]) expect(text.length, lesson.id).toBeGreaterThan(15);
        expect(Object.hasOwn(labs, lesson.experiment.lab), lesson.id).toBe(true);
        expect(lesson.sources.length).toBeGreaterThan(0);
        for (const id of lesson.sources) expect(sourceIds.has(id), `missing ${id} in ${lesson.id}`).toBe(true);
      }
    }
  });

  it('keeps stable addressable steps distinct from activity, formula and check routes', () => {
    const allStepIds: string[] = [];
    for (const lesson of lessons) {
      expect(lesson.steps.length, lesson.id).toBeGreaterThanOrEqual(3);
      const stepIds = lesson.steps.map(step => step.id);
      expect(new Set(stepIds).size, lesson.id).toBe(stepIds.length);
      for (const step of lesson.steps) {
        expect(step.id, lesson.id).toMatch(new RegExp(`^${lesson.id}-[a-z0-9-]+$`));
        expect(step.id.length).toBeLessThanOrEqual(64);
        expect(reservedStepIds.has(step.id), lesson.id).toBe(false);
        expect(step.title.trim().length, step.id).toBeGreaterThan(2);
        expect(step.body.length, step.id).toBeGreaterThan(0);
        for (const paragraph of step.body) expect(paragraph.trim().length, step.id).toBeGreaterThan(10);
        if (step.visual) expect(Object.hasOwn(guided, step.visual.id), `${step.id}: missing diagram ${step.visual.id}`).toBe(true);
        if (step.diagram) {
          expect(step.diagram.labels.length, step.id).toBeGreaterThan(0);
          expect(Number.isInteger(step.diagram.active), step.id).toBe(true);
          expect(step.diagram.active, step.id).toBeGreaterThanOrEqual(0);
          expect(step.diagram.active, step.id).toBeLessThan(step.diagram.labels.length);
          expect(step.diagram.caption.trim().length, step.id).toBeGreaterThan(0);
        }
      }
      for (const stepId of [...stepIds, ...reservedStepIds]) {
        const route = parseRoute(lessonLocation(lesson.id, stepId, 'all'));
        expect(route.path).toBe(`/learn/${lesson.id}`);
        expect(route.params.get('step')).toBe(stepId);
        expect(route.params.get('view')).toBe('all');
      }
      allStepIds.push(...stepIds);
    }
    expect(new Set(allStepIds).size).toBe(allStepIds.length);
  });

  it('resolves prerequisites and introduced concepts without circular prerequisites', () => {
    for (const lesson of lessons) {
      expect(new Set(lesson.prerequisiteLessonIds).size, lesson.id).toBe(lesson.prerequisiteLessonIds.length);
      for (const prerequisite of lesson.prerequisiteLessonIds) {
        expect(ids.has(prerequisite), `${lesson.id}: missing prerequisite ${prerequisite}`).toBe(true);
        expect(lessonIndex.get(prerequisite), `${lesson.id}: prerequisite must already be taught`).toBeLessThan(lessonIndex.get(lesson.id)!);
      }
      expect(new Set(lesson.introducedConcepts).size, lesson.id).toBe(lesson.introducedConcepts.length);
      for (const id of lesson.introducedConcepts) expect(conceptById.has(id), `${lesson.id}: missing introduced concept ${id}`).toBe(true);
    }
  });

  it('resolves every explicitly marked concept and rejects malformed markers', () => {
    const collections = { stages, concepts, buildSteps, hardwareModules, advancedReadings, corrections, projectAudits, labGuides };
    let total = 0;
    for (const { text, path } of stringsIn(collections)) {
      const marker = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g;
      for (const match of text.matchAll(marker)) {
        total++;
        expect(match[1].trim(), path).toBe(match[1]);
        expect(conceptById.has(match[1]), `${path}: missing concept ${match[1]}`).toBe(true);
        if (match[2] !== undefined) expect(match[2].trim().length, path).toBeGreaterThan(0);
      }
      const stripped = text.replace(marker, '');
      expect(stripped.includes('[[') || stripped.includes(']]'), `${path}: malformed concept marker`).toBe(false);
    }
    expect(total).toBeGreaterThan(75);
  });

  it('uses activities that have implemented renderers and explicit learning purposes', () => {
    for (const lesson of lessons) checkActivity(lesson.activity, lesson.id);
    expect(Object.keys(labGuides).sort()).toEqual(Object.keys(labs).sort());
    for (const [id, guide] of Object.entries(labGuides)) {
      expect(guide.kind).toBe('lab');
      expect(guide.id).toBe(id);
      checkActivity(guide, `standalone ${id}`);
    }
    expect(lessons.slice(0, 3).map(lesson => [lesson.activity.kind, lesson.activity.id])).toEqual([
      ['guided', 'apparatus'], ['guided', 'signal-path'], ['guided', 'measurement-cycle'],
    ]);
  });

  it('renders every formula strictly and retains definitions of its symbols', () => {
    const formulae = [
      ...lessons.map(lesson => ({ id: lesson.id, formula: lesson.formula })),
      ...concepts.filter(concept => !!concept.formula).map(concept => ({ id: concept.id, formula: concept.formula! })),
    ];
    for (const { id, formula } of formulae) {
      expect(formula.tex.trim().length, id).toBeGreaterThan(0);
      expect(() => katex.renderToString(formula.tex, { throwOnError: true, trust: false }), id).not.toThrow();
      expect(formula.symbols.length, `${id}: definitions`).toBeGreaterThan(0);
      for (const symbol of formula.symbols) expect(symbol.trim().length, id).toBeGreaterThan(2);
    }
    // Rendering verifies notation; numerical physics invariants are tested separately.
  });

  it('gives every glossary concept a usable explanation and resolvable further reading', () => {
    const introduction = new Map<string, string>();
    for (const lesson of lessons) for (const id of lesson.introducedConcepts) if (!introduction.has(id)) introduction.set(id, lesson.id);
    expect(concepts.length).toBeGreaterThan(glossary.length);
    expect(conceptById.size).toBe(concepts.length);
    for (const entry of glossary) expect(conceptById.has(entry.term), entry.term).toBe(true);
    for (const concept of concepts) {
      expect(concept.id).toBe(concept.term);
      expect(concept.english.trim().length, concept.id).toBeGreaterThan(0);
      for (const field of ['plain', 'academic', 'example', 'misconception'] as const) expect(concept[field].trim().length, `${concept.id}: ${field}`).toBeGreaterThan(12);
      expect(concept.example, concept.id).not.toBe(concept.plain);
      expect(concept.misconception, concept.id).not.toBe(concept.academic);
      expect(ids.has(concept.lessonId), `${concept.id}: missing lesson ${concept.lessonId}`).toBe(true);
      if (introduction.has(concept.id)) expect(concept.lessonId, `${concept.id}: link must match the revised introduction`).toBe(introduction.get(concept.id));
      expect(concept.sourceIds.length, concept.id).toBeGreaterThan(0);
      for (const id of concept.sourceIds) expect(sourceIds.has(id), `${concept.id}: missing source ${id}`).toBe(true);
      for (const id of concept.relatedIds) expect(conceptById.has(id), `${concept.id}: missing related concept ${id}`).toBe(true);
      if (concept.visual) expect(['coil', 'electric', 'field-moment', 'cycle', 'shimming', 'gradient']).toContain(concept.visual);
      for (const alias of concept.aliases ?? []) expect(alias.trim().length, concept.id).toBeGreaterThan(0);
    }
  });

  it('resolves hardware, glossary, advanced and correction references', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(40);
    expect(hardwareModules).toHaveLength(9);
    for (const item of [...hardwareModules, ...glossary]) {
      expect(item.stage).toBeGreaterThanOrEqual(1);
      expect(item.stage).toBeLessThanOrEqual(stages.length);
    }
    for (const reading of advancedReadings) for (const id of reading.sources) expect(sourceIds.has(id)).toBe(true);
    for (const correction of corrections) expect(sourceIds.has(correction.sourceId)).toBe(true);
    expect(sourceIds.size).toBe(sources.length);
    for (const source of sources) expect(new URL(source.url).protocol).toBe('https:');
  });

  it('keeps manufacturing routes, lesson references and evidence links usable', () => {
    const buildIds = buildSteps.map(step => step.id);
    expect(new Set(buildIds).size).toBe(buildIds.length);
    for (const step of buildSteps) {
      expect(step.id).toMatch(/^[a-z0-9-]+$/);
      for (const id of step.lessonIds) expect(ids.has(id), `missing lesson ${id} in ${step.id}`).toBe(true);
      for (const id of step.sourceIds) expect(sourceIds.has(id), `missing source ${id} in ${step.id}`).toBe(true);
      expect(step.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(step.quiz.answer).toBeLessThan(step.quiz.options.length);
    }
    for (const project of projectAudits) {
      expect(project.evidence.length).toBeGreaterThan(0);
      for (const evidence of project.evidence) expect(new URL(evidence.url).protocol).toBe('https:');
      for (const gap of project.gaps) expect(gap).toMatch(/作者承认|工程推论|尚未核验/);
    }
  });
});

describe('legacy learning progress remains recoverable', () => {
  it('rejects incompatible or malformed progress', () => {
    for (const value of [null, {}, { version: 3 }, { version: 1, completed: [], lastLesson: '1-1', answers: [] }]) expect(() => parseProgress(value, ids)).toThrow();
  });
  it('migrates valid v1 records into legacy without answering the rewritten lessons', () => {
    const progress = parseProgress({ version: 1, completed: ['1-1', '1-1', 'missing'], lastLesson: 'bad', answers: { '1-1': 2, '1-2': 9, missing: 0 } }, ids);
    expect(progress.version).toBe(2);
    expect(progress.contentRevision).toBe(CONTENT_REVISION);
    expect(progress.completed).toEqual([]);
    expect(progress.answers).toEqual({});
    expect(progress.lastLesson).toBe('1-1');
    expect(progress.legacy).toEqual({ completed: ['1-1'], answers: { '1-1': 2 } });
  });
});
