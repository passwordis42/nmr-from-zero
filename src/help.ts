import { sources } from './content/resources';
import type { AskContext, LabSnapshot } from './learning';
import { stripTerms } from './learning';
export function contextText(context: AskContext, baseUrl: string): string {
  return [`课程或内容：${stripTerms(context.title)}`, `原文位置：${baseUrl.split('#')[0]}${context.location}`, '', '正在阅读的内容：', stripTerms(context.quote), ...(context.conceptId ? ['', `正在查询：${context.conceptId}`] : []), '', '可核对的公开来源：', ...context.sources.map(id=>sources.find(s=>s.id===id)).filter(s=>!!s).map(s=>`- ${s.title}：${s.url}`)].join('\n');
}
export function snapshotText(snapshot: LabSnapshot): string {
  const values = (rows: LabSnapshot['parameters']) => rows.map(v=>`- ${stripTerms(v.label)}：${typeof v.value==='string'?stripTerms(v.value):v.value}${v.unit ? ` ${v.unit}` : ''}`);
  return ['【实验状态：教学模拟，不是实物测量】', `实验：${snapshot.title}`, `快照时间：${snapshot.capturedAt}`, ...(snapshot.view ? [`视图：${snapshot.view}`] : []), ...(snapshot.time ? [`演示时刻：${snapshot.time.value} ${snapshot.time.unit}`] : []), '参数：', ...values(snapshot.parameters), '读数：', ...values(snapshot.readings), `模型范围：${stripTerms(snapshot.model)}`].join('\n');
}
export function buildPrompt(question: string, background: string, snapshot?: LabSnapshot): string {
  return ['我是从零开始学习核磁共振的读者。', '', `我的问题：${question.trim() || '请逐句解释下面的内容，先告诉我每个对象是什么、在哪里、谁作用于谁。'}`, '', background, ...(snapshot ? ['', snapshotText(snapshot)] : []), '', '请先用白话明确对象和因果关系，解释每个新术语，再给一个具体例子；随后补充正式定义和必要公式。请指出教材或我的理解中可能不严谨的地方，区分事实、教学近似和推断。引用可核对来源，不把教学模拟当作已验证的制造设计。'].join('\n');
}
