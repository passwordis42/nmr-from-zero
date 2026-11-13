import { ArrowRight, ArrowUpRight, Check, Search } from 'lucide-react';
import { projectAudits } from '../content/projectAudit';
import './build-guide.css';

const orderedProjects = ['osii', 'ezymri', 'marcos', 'shimmer'].map(id => projectAudits.find(p => p.id === id)!);

export default function ProjectAudit() {
  return <section className="project-audit build-guide">
    <div className="page-heading"><span className="build-eyebrow">公开资料审计 · 从开源文件到自己的仪器</span><h1>开源了，<br/>离复刻还差多远？</h1><p>关键不只在“有没有图纸”，还在版本能否配套、接口是否匹配，以及测量结果能否重现。</p></div>
    <div className="build-scope"><Search size={22}/><div><h2>先把几个项目分清楚。</h2><p>本站用 ezyMRI 学习团队搭建与联调，用 OSI² ONE 学习模块化整机，用 MaRCoS 学习控制与采集，用 Shimmer 学习匀场。它们各自有用途，不能据此认为是一套无需适配就能组合的设备。</p><p>原视频作为原理总览保留。尚未确认视频唯一对应哪一个开源工程，因此不把下面某个项目冒称为“视频同款”。</p></div></div>
    <div className="audit-evidence-key"><strong>怎样读审计结论</strong><p><b>作者承认</b>：原文明确报告的限制。<b>工程推论</b>：结合接口与测量要求得出的判断。<b>尚未核验</b>：此次没有验证到，不能当作项目没有提供。</p></div>
    <nav className="audit-index" aria-label="审计项目">{orderedProjects.map(p => <button key={p.id} onClick={() => { const node = document.getElementById(`audit-${p.id}`); node?.focus({ preventScroll: true }); node?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }}>{p.title}</button>)}</nav>
    {orderedProjects.map(p => <article key={p.id} className="audit-project" id={`audit-${p.id}`} tabIndex={-1}><div className="audit-meta"><span>{p.role}</span><span>核验日期 {p.checkedAt}</span></div><h2><a href={p.url} target="_blank" rel="noreferrer">{p.title}<ArrowUpRight size={19}/></a></h2><p className="audit-verdict">{p.verdict}</p><section><h3><Check size={17}/>公开资料已提供</h3><ul>{p.provided.map(x => <li key={x}>{x}</li>)}</ul></section><section><h3><Search size={17}/>复刻前还要解决或核验</h3><ul>{p.gaps.map(x => <li key={x}>{x}</li>)}</ul></section><div className="source-links">{p.evidence.map(e => <a key={e.url} href={e.url} target="_blank" rel="noreferrer">{e.title}<ArrowUpRight size={13}/></a>)}</div></article>)}
    <div className="build-audit-link"><div><h2>把不确定性，变成下一次测量。</h2><p>从文件清单、加工与装配，走到调谐、回波、梯度和成像验收。每一步都留下可检查的证据。</p><a className="primary-button" href="#/build">进入硬件工坊<ArrowRight size={17}/></a></div></div>
  </section>;
}
