export type LabId = 'waves' | 'spin' | 'relaxation' | 'sampling' | 'field' | 'coil' | 'timing' | 'imaging';
export interface Quiz { question: string; options: string[]; answer: number; explanation: string }
export interface Lesson { id: string; title: string; question: string; intuition: string[]; example: string; experiment: { lab: LabId; instruction: string }; formula: { tex: string; explanation: string; symbols: string[] }; hardware: string; misconception: string; quiz: Quiz; sources: string[]; revision: number; prerequisiteLessonIds: string[]; introducedConcepts: string[]; steps: import('./learning').LessonStep[]; activity: import('./learning').ActivitySpec }
export interface Stage { id: number; title: string; description: string; outcome: string; lessons: Lesson[] }
export interface Source { id: string; title: string; url: string; kind: string; description: string; license?: string; chapters: number[]; status: string }
export interface GlossaryTerm { term: string; english: string; definition: string; stage: number }
export interface HardwareModule { id: string; name: string; purpose: string; input: string; output: string; failure: string; stage: number }
export interface Progress { version: 2; contentRevision: number; completed: string[]; lastLesson: string; answers: Record<string, number>; updatedAt: string; positions: Record<string,string>; readingMode: 'steps'|'all'; legacy: { completed: string[]; answers: Record<string,number> } }
