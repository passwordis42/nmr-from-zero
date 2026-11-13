import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Download, Wrench } from 'lucide-react';
import { buildSteps, type BuildStep } from '../content/buildGuide';
import { sources } from '../content/resources';
import { stages } from '../content/course';
import './build-guide.css';

const lessons = stages.flatMap(stage => stage.lessons);

function downloadWorksheet(step?: BuildStep) {
  const selected = step ? [step] : buildSteps;
  const text = ['# 核磁硬件制造与验证记录', '', '这是记录模板，不是加工图纸或通用验收规格。请先选定一个项目版本。', '',
    '- 系统用途与样品：', '- 项目 / 版本 / 提交号：', '- 制造日期 / 操作者：', '- 图纸、BOM、固件与软件版本：', '- 机械孔径 / 安装后净空 / 均匀场区域 / FOV（分开填写，注明单位）：', '- 测试仪器 / 校准日期：', '- 预先约定的验收指标及来源：', '',
    ...selected.flatMap(s => [`## ${s.title}`, '', s.goal, '', '### 开始前', ...s.prerequisites.map(x => `- [ ] ${x}`), '', '### 文件与工具', ...s.files.map(x => `- 文件：${x}`), ...s.tools.map(x => `- 工具：${x}`), '', '### 制造与联调', ...s.actions.map(x => `- [ ] ${x}`), '', '### 测量验收', ...s.checks.map(x => `- [ ] ${x}`), '', '### 本步交付', s.deliverable, '', '- 测试条件与单位：', '- 原始数据路径：', '- 预期 / 实测 / 误差：', '- 判定及依据：', '- 故障、修改与复测：', '- 与参考版本的差异：', '', '### 公开参考', ...s.sourceIds.map(id => sources.find(x => x.id === id)).filter(x => !!x).map(x => `- ${x.title}：${x.url}`), ''])].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `核磁制造记录${step ? `-${step.id}` : ''}.md`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BuildGuide({ stepId }: { stepId?: string }) {
  const step = buildSteps.find(s => s.id === stepId);
  const [answer, setAnswer] = useState<number>();
  const [downloaded, setDownloaded] = useState(false);
  const download = () => { downloadWorksheet(step); setDownloaded(true); };
  if (stepId && !step) return <section className="page-heading"><h1>没有找到这一步。</h1><a className="primary-button" href="#/build">回到硬件工坊<ArrowLeft size={16}/></a></section>;
  if (!step) return <section className="build-guide">
    <div className="page-heading build-hero"><span className="build-eyebrow">硬件工坊 · 原理之后，开始理解制造</span><h1>让原理，<br/>落到工作台。</h1><p>从一份配套图纸，到一个可信的核磁信号。<br/>10 个步骤，把加工、装配、标定和验收连成一条路线。</p><div className="button-row"><a className="primary-button" href={`#/build/${buildSteps[0].id}`}>从确定目标开始<ArrowRight size={17}/></a><button className="secondary-button" onClick={download}><Download size={16}/>下载制造记录模板</button></div>{downloaded && <p role="status" className="download-note">模板已生成，请查看浏览器下载记录；填写真实测试结果后再判断是否合格。</p>}</div>
    <div className="build-milestones" aria-label="制造路线的四个里程碑">{[['01', '文件齐全', '锁定版本与接口'], ['02', '模块合格', '逐件加工与测量'], ['03', '可信回波', '先走通 NMR'], ['04', '模体图像', '再加入空间编码']].map(([n, title, body]) => <div key={n}><span>{n}</span><strong>{title}</strong><small>{body}</small></div>)}</div>
    <div className="build-scope"><Wrench size={22}/><div><h2>先学会验收，再决定买什么。</h2><p>这里提供制造学习与验证流程。实际加工尺寸、材料、绕线表、接线与额定值，须来自同一选定版本的工程文件；教学动画不能直接当作加工设计。各步骤可以自由学习，实际联调应先确认前置条件。</p><p>弛豫仪可以先完成到“可信 FID 与回波”；MRI 还需要梯度、空间编码和模体成像验收。课程用于研究样品和测试模体的学习。</p></div></div>
    <div className="build-roadmap">{buildSteps.map((s, i) => <a href={`#/build/${s.id}`} className="build-step-card" key={s.id}><span className="build-step-number">{String(i + 1).padStart(2, '0')}</span><div><h2>{s.title}</h2><p>{s.goal}</p><small><span>留下的证据</span>{s.deliverable}</small></div><ArrowUpRight size={20}/></a>)}</div>
    <a className="build-audit-link" href="#/projects"><div><span className="build-eyebrow">动手之前 · 先读项目审计</span><h2>开源了，就能照着复刻吗？</h2><p>查看 ezyMRI、OSI² ONE、MaRCoS 与 Shimmer 已提供的材料，以及仍需完成的适配与核验。</p></div><ArrowRight size={24}/></a>
  </section>;
  const index = buildSteps.indexOf(step), previous = buildSteps[index - 1], next = buildSteps[index + 1];
  return <article className="build-guide build-detail">
    <a className="text-button" href="#/build"><ArrowLeft size={15}/>硬件工坊总览</a>
    <div className="page-heading"><span className="build-eyebrow">制造学习 · 第 {String(index + 1).padStart(2, '0')} / {buildSteps.length} 步</span><h1>{step.title}</h1><p>{step.goal}</p></div>
    <nav className="build-step-nav" aria-label="制造步骤">{buildSteps.map((s, i) => <a key={s.id} href={`#/build/${s.id}`} aria-label={`第 ${i + 1} 步：${s.title}`} aria-current={s.id === step.id ? 'step' : undefined} title={s.title}>{String(i + 1).padStart(2, '0')}</a>)}</nav>
    <section className="build-why"><h2 className="accent-heading">为什么先做这件事</h2><p>{step.why}</p></section>
    <section className="build-prerequisites"><h2>开始前，需要确认</h2><ul>{step.prerequisites.map(p => <li key={p}>{p}</li>)}</ul></section>
    <div className="build-preparation"><section><h2>要找齐的文件</h2><ul>{step.files.map(p => <li key={p}>{p}</li>)}</ul></section><section><h2>会用到的工具</h2><ul>{step.tools.map(p => <li key={p}>{p}</li>)}</ul></section></div>
    <section className="build-actions"><h2 className="accent-heading">怎样制造与联调</h2><ol>{step.actions.map((p, i) => <li key={p}><span>{String(i + 1).padStart(2, '0')}</span><p>{p}</p></li>)}</ol></section>
    <section className="build-checks"><h2><Check size={21}/>怎样判断这一步完成</h2><p className="build-checks-note">判据必须对应选定系统的设计与测试条件。下列是检查方法，不是所有机器通用的合格数值。</p><ul>{step.checks.map(p => <li key={p}>{p}</li>)}</ul><div className="build-deliverable"><strong>本步应留下</strong><p>{step.deliverable}</p></div></section>
    <section className="build-failures"><h2 className="accent-heading">结果不对时，从哪里查</h2>{step.failures.map(f => <details className="reading" key={f.symptom}><summary>{f.symptom}<ChevronDown size={17}/></summary><p><strong>可能原因：</strong>{f.cause}</p><p><strong>下一步验证：</strong>{f.action}</p></details>)}</section>
    <section className="quiz"><h2><Check size={20}/>制造前，检查一次理解</h2><fieldset><legend>{step.quiz.question}</legend>{step.quiz.options.map((option, i) => <label key={option} className={`quiz-option ${answer === i ? 'chosen' : ''}`}><input type="radio" name={`build-${step.id}`} checked={answer === i} onChange={() => setAnswer(i)}/><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span></label>)}</fieldset>{answer !== undefined && <div className={`quiz-feedback ${answer === step.quiz.answer ? 'correct' : ''}`} role="status"><strong>{answer === step.quiz.answer ? '理解正确。' : '再想一步。'}</strong> {step.quiz.explanation}<span className="answer-line">正确答案：{String.fromCharCode(65 + step.quiz.answer)} · {step.quiz.options[step.quiz.answer]}</span></div>}<p className="build-quiz-note">工坊自测用于练习，不计入 36 节基础课的完成进度；离开本页或刷新后重置。</p></section>
    <section className="build-references"><h2>回到原理与原始文件</h2><div className="related-lessons">{step.lessonIds.map(id => <a href={`#/learn/${id}`} key={id}><span>{id}</span>{lessons.find(l => l.id === id)?.title}<ArrowUpRight size={14}/></a>)}</div><div className="source-links">{step.sourceIds.map(id => sources.find(s => s.id === id)).filter(s => !!s).map(s => <a href={s.url} key={s.id} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={13}/></a>)}</div></section>
    <div className="build-download"><button className="secondary-button" onClick={download}><Download size={15}/>下载本步记录模板</button>{downloaded && <span role="status">模板已生成，请查看浏览器下载记录。</span>}</div>
    <nav className="lesson-pagination" aria-label="前后制造步骤">{previous ? <a href={`#/build/${previous.id}`}><ArrowLeft size={18}/><span><small>上一步</small>{previous.title}</span></a> : <a href="#/projects"><ArrowLeft size={18}/><span><small>开工前阅读</small>开源项目审计</span></a>}{next ? <a href={`#/build/${next.id}`}><span><small>下一步</small>{next.title}</span><ArrowRight size={18}/></a> : <a href="#/build">回顾制造路线<ArrowRight size={18}/></a>}</nav>
  </article>;
}
