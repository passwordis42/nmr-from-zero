# 从零看懂核磁共振

中文零基础交互教材：12 个阶段、36 节课程、8 组教学实验。从电磁感应与相位，走到自旋、射频激发、弛豫、接收、空间编码、图像重建和真实仪器搭建。

发布地址：https://passwordis42.github.io/nmr-from-zero/

## 学习功能

- 默认逐步阅读，可自由跳转、切换全文及分享具体步骤。36 课均先解释对象和因果关系，再进入活动、公式、硬件与小测。
- 14 种入门活动分别演示装置测点、信号路径、收发周期、感应、向量、指数、实验室坐标进动、净磁化、I/Q、频率编码、相位编码、选层、回波时序与对比度；课内只开放已学视图。
- 八组实验均在浏览器本地计算。二维实验实际执行复数 FFT、采样掩膜和逆变换；图片为人工模体，不是真实扫描结果。
- 整机地图、统一中英概念库、六组可暂停图解。显式术语标记提供随文解释、正式定义、例子、误区和原始来源；支持键盘关闭及手机底部面板。
- 选中文字、段落、术语或实验均可生成可编辑提问背景。实验会暂停并固定参数快照，只有显式更新才替换；复制和打开 ChatGPT 是两个独立操作。无模型调用、后端、密钥或自动发送。复制被拒绝时可手动复制。
- [硬件工坊](https://passwordis42.github.io/nmr-from-zero/#/build)：10 步制造与验证学习，包含前置条件、文件与工具、操作、测量判据、排障和小测，可下载制造记录模板。额外工坊自测不计入基础课进度，离开页面后重置。
- [开源项目审计](https://passwordis42.github.io/nmr-from-zero/#/projects)：逐项区分公开资料已提供的内容、作者报告的限制、工程适配判断和尚未核验的部分。
- 自动保存本机学习进度、步骤和阅读偏好，支持 JSON 导出与合并导入。v1 记录自动迁入旧版归档，保留旧完成记录和答案，新题不继承旧答案。无需账号，不提供云端进度同步。

## 本地运行

需要 Node.js 24 或更新的兼容版本。

```sh
npm ci
npm run dev
```

打开终端显示的 `/nmr-from-zero/` 地址。检查与构建：

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

仓库 Settings → Pages → Source 选择 **GitHub Actions**。推送到 `main` 后，工作流会先运行测试和构建，再发布 `dist`。网站使用哈希路由，章节链接可以直接打开并刷新。所有运行时依赖和公式字体随站点打包，不依赖外部 CDN。

## 内容与代码

版式与交互参考 [Seeing Theory](https://seeing-theory.brown.edu/) 的概念与实验相邻组织，以及 [Mechanical Watch](https://ciechanow.ski/mechanical-watch/) 的分步讲解和可回看的时间控制。本站采用原创中文内容、SVG 图示和数值模型；白底排版、课内导航与一键对照帮助读者按自己的节奏学习。

- `src/content/course.ts`：课程、例子、小测和来源编号。
- `src/content/resources.ts`：公开参考资料、原始术语索引、硬件模块与纠错。
- `src/content/concepts.ts`：稳定概念 ID、完整解释卡及来源。
- `src/content/labGuides.ts`：八组完整实验的预测、操作、观察及模型范围。
- `src/learning.ts`、`src/help.ts`：步骤、实验快照及可复制提问上下文。
- `src/content/buildGuide.ts`：制造、模块联调和测量验收的学习路线。
- `src/content/projectAudit.ts`：开源项目复刻证据与局限，附核验日期及原始链接。
- `src/physics/models.ts`、`src/physics/teaching.ts`：带单位约定的数值模型。
- `src/components/Lab.tsx`、`GuidedActivity.tsx`：完整实验与分步教学活动。
- `src/components/SteppedLesson.tsx`、`LearningHelp.tsx`：阅读流程、术语卡、选择提问和复制面板。
- `tests`：数值结果、内容完整性、公式渲染和进度解析检查。

教学默认质子共振频率系数为 42.57748 MHz/T；用右手坐标和 `dM/dt = γ M × B` 约定进动。频率读数显示大小，方向由各模型说明。B₁ 定义为同向旋转分量。

## 资料与适用范围

核心参考为 James Keeler 的大学讲义、Stanford MRI 教学、ezyMRI、OSI² ONE、MaRCoS 等原始来源。网站资料库提供逐项链接、用途、许可证说明和核验状态。文章与图示使用原创组织，第三方讲义、视频、源码和设计文件的权利归各自作者。

网页仿真用于建立物理直觉；场图、线圈响应和模体数据都有简化假设，不是可直接加工的工程设计。硬件性能必须由实际测量验证。课程不提供人体扫描操作方案。
