import type { GlossaryTerm, HardwareModule, Source } from '../types';

export const sources: Source[] = [
  {
    id: 'keeler3', title: 'Keeler · 第 3 章：向量模型',
    url: 'https://www-keeler.ch.cam.ac.uk/lectures/understanding/chapter_3.pdf', kind: '大学讲义 · 基础',
    description: '从宏观磁化、进动到旋转坐标系、有效磁场和射频脉冲。适合对照动画理解箭头代表什么，也说明向量模型的适用范围；这里链接的是讲义章节，编号不同于部分印刷版教材。',
    license: '作者保留版权；提供原文链接，不转载讲义或插图。', chapters: [2, 3, 4, 5], status: '已读取剑桥大学作者站 PDF；基础原理参考。',
  },
  {
    id: 'keeler4', title: 'Keeler · 第 4 章：傅里叶变换与数据处理',
    url: 'https://www-keeler.ch.cam.ac.uk/lectures/understanding/chapter_4.pdf', kind: '大学讲义 · 信号',
    description: '讲解 FID 如何变成频谱，以及相位、线形、加窗和分辨率的关系。重点是理解处理改变了什么，不能把平滑或补零误认为新测到了信息。',
    license: '作者保留版权；提供原文链接。', chapters: [2, 6, 11], status: '已读取作者站 PDF；与本课频域实验配套。',
  },
  {
    id: 'keeler5', title: 'Keeler · 第 5 章：波谱仪怎样工作',
    url: 'https://www-keeler.ch.cam.ac.uk/lectures/understanding/chapter_5.pdf', kind: '大学讲义 · 仪器',
    description: '把仪器拆成磁体、探头、发射器、接收器、数字化和脉冲时序。原文包含高场超导仪器背景；低场永磁系统可沿用功能分解，不能照搬其磁体和低温条件。',
    license: '作者保留版权；提供原文链接。', chapters: [1, 6, 7, 8, 9, 12], status: '已读取作者站 PDF；硬件功能参考，非本项目装配手册。',
  },
  {
    id: 'keeler8', title: 'Keeler · 第 8 章：弛豫',
    url: 'https://www-keeler.ch.cam.ac.uk/lectures/understanding/chapter_8.pdf', kind: '大学讲义 · 物理',
    description: '从回到热平衡的过程出发，解释弛豫速率、测量实验及分子运动。适合进一步理解为什么 T₁、T₂ 依赖样品和测量条件。',
    license: '作者保留版权；提供原文链接。', chapters: [3, 5, 12], status: '已读取作者站 PDF；定量测量的基础参考。',
  },
  {
    id: 'keeler2', title: 'Keeler · 能级与 NMR',
    url: 'https://www-keeler.ch.cam.ac.uk/lectures/Irvine/chapter2.pdf', kind: '大学讲义 · 进阶',
    description: '从自旋能级和跃迁理解简单频谱，进一步讨论耦合自旋。与向量模型结合阅读，避免只用“两个能级间跳跃”解释整个脉冲实验。',
    license: '作者保留版权；提供原文链接。', chapters: [3, 4, 6], status: '已核验作者站课程目录与 PDF。',
  },
  {
    id: 'stanford', title: 'Stanford · MRI Principles Videos',
    url: 'https://med.stanford.edu/bmrgroup/education/mri-physics.html', kind: '大学课程 · 直观解释',
    description: '按主题提供短视频：硬件、激发、梯度、空间频率、视野、分辨率、对比度和序列。适合学完一小节后换一种讲法复习；工程深入学习可继续查看该校 EE369B 课程。',
    license: '页面允许视频用于教育；本站提供链接，不搬运视频。', chapters: [1, 3, 4, 5, 10, 11], status: '已核验斯坦福官方教学页及主题目录。',
  },
  {
    id: 'ezymri', title: 'ezyMRI · 从零搭建 MRI 的团队实践',
    url: 'https://arxiv.org/abs/2411.11365', kind: '工程论文 · 整机',
    description: '记录 2024 年工作坊中磁体、梯度、RF、控制台和系统集成的分工与困难，适合把原理对应到真实工程。论文所述四天包含团队协作和准备条件，不代表个人零基础四天即可造好整机。',
    license: '该 arXiv 版本为非独占分发许可；不据此推定全部硬件文件许可。', chapters: [1, 7, 8, 9, 10, 12], status: '已读取 49 页公开论文中的制造与联调章节，并核验 2025 年发表信息；未复现实验。',
  },
  {
    id: 'osii', title: 'OSI² ONE · 模块化低场 MRI',
    url: 'https://gitlab.com/osii/mri-scanners/osii-one', kind: '开源工程 · 整机',
    description: '约 50 mT 永磁 MRI 的整机入口，组织磁体、梯度、射频、控制与系统版本。用于了解各模块怎样组成可成像仪器；具体参数和设计文件须按同一版本配套阅读。',
    license: '整机入口：CERN-OHL-W-2.0；各模块按各自许可证。', chapters: [1, 7, 8, 9, 10, 11, 12], status: '已核验整机版本索引、磁体 BOM、制造与装配指南和质量指南；未逐一验证全部 CAD／PCB，也未复现实机。',
  },
  {
    id: 'osii-manufacture', title: 'OSI² ONE 磁体 · 制造与加工指南',
    url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/manufacturing-guide.md', kind: '工程指南 · 制造',
    description: '具体说明磁体支架环的材料、公差、夹持、铣削和后处理。结合相同版本的 BOM、CAD 与材料表阅读；页面给出的加工设置属于其案例，不能直接当作其他材料或机床的参数。',
    license: '按磁体仓库对应版本的 LICENSE 使用；本站提供链接。', chapters: [7, 12], status: '已读取指南全文及实际目录；未执行加工或验证全部 CAD。',
  },
  {
    id: 'osii-assembly', title: 'OSI² ONE 磁体 · 装配指南',
    url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/assembly-guide.md', kind: '工程指南 · 制造',
    description: '沿指定零件、极性标记和装配顺序理解磁块与支架如何组成磁体。使用前先固定仓库版本，核对材料、工装与质量记录。',
    license: '按磁体仓库对应版本的 LICENSE 使用；本站提供链接。', chapters: [7, 12], status: '已读取公开装配步骤；本站未实施实体装配。',
  },
  {
    id: 'osii-quality', title: 'OSI² ONE 磁体 · 质量检查指南',
    url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/qm-guide.md', kind: '工程指南 · 测量',
    description: '检查磁块缺陷、支架尺寸、口袋位置与方向，附测量表例子。开头仍标有 TBD；已有检查内容，但不能当作完整整机验收规程。',
    license: '按磁体仓库对应版本的 LICENSE 使用；本站提供链接。', chapters: [7, 12], status: '已核验指南内容与待完善标记；区分文档存在和完整性。',
  },
  {
    id: 'osii-paper', title: '低场 MRI 参考系统：校准与跨站点比较',
    url: 'https://arxiv.org/abs/2608.19062', kind: '研究预印本 · 验证',
    description: '2026 年预印本介绍约 50 mT 系统、校准、噪声、涡流、几何准确性及定量映射。它展示了“得到图像”之后还必须检查什么，也报告了实测 T₂ 与参考值的偏差。',
    license: '论文 CC-BY-4.0；软件和硬件许可需分别核对。', chapters: [5, 7, 9, 11, 12], status: '已核验 arXiv v2 摘要与许可；预印本结论不等于所有设备的性能保证。',
  },
  {
    id: 'marcos', title: 'MaRCoS · 磁共振控制系统',
    url: 'https://github.com/marcos-mri', kind: '开源工程 · 控制台',
    description: '包括 FPGA、嵌入式服务和计算机端软件，协调 RF 波形、采样和梯度时序。官方主路线采用 Red Pitaya SDRLab 122–16；它提供控制台，不包含一整套可直接成像的磁体、线圈和功放。',
    license: '已核实 marcos_server、marcos_extras 为 MIT；配套项目逐项核对。', chapters: [1, 6, 9, 10, 12], status: '已核验官方组织、架构说明、Wiki 与公开多站点研究。',
  },
  {
    id: 'shimmer', title: 'Shimmer · 低场磁体的被动匀场',
    url: 'https://arxiv.org/abs/2608.22351', kind: '研究预印本 · 磁体',
    description: '把实测场图、磁场模拟、补偿磁块优化和支架生成串成闭环。适合理解匀场为什么需要先测量、再计算、再复测；论文结果对应其测试磁体和指定测量区域。',
    license: '论文 CC-BY-4.0；已核验 Shimmer 仓库代码 GPL-3.0。', chapters: [7, 12], status: '已读取方法全文、GitLab README、教程流程和 LICENSE；未运行优化或检查全部 STL 的可制造性。',
  },
  {
    id: 'halbach', title: 'HalbachMRIDesigner · 磁体几何与场模拟',
    url: 'https://github.com/menkueclab/HalbachMRIDesigner', kind: '开源工具 · 磁体',
    description: '根据 JSON 中的磁块、环和切片几何生成 OpenSCAD，并支持场图和 FEM 文件。实际字段包括 radius、innerRadius 等；不是输入一个孔径就自动获得满足指标的磁体。',
    license: 'GPL-3.0。', chapters: [7, 12], status: '已核验 README、参数解析与 --scad 输出逻辑；未安装执行。',
  },
  {
    id: 'halbach-code', title: 'HalbachMRIDesigner · 固定版本源码核对',
    url: 'https://github.com/menkueclab/HalbachMRIDesigner/blob/22cb72a3d95e52a9e78b212f32a9115d7227ce19/HalbachMRIDesigner.py', kind: '工程源码 · 制造前核对',
    description: '对照 README 与实际入口：--scad 才写出几何文件；--fem 分支中的 generateONELABfile=False 不会默认输出 .pro。程序打印的均匀度基于 z=0 平面的 |Bx|，不能替代三维 DSV 场图验收。',
    license: 'GPL-3.0。', chapters: [7, 12], status: '已读取固定提交 22cb72a 的入口逻辑；静态核验，未执行或检验加工可行性。',
  },
  {
    id: 'gradient', title: 'GradientDesignTool · 梯度线圈设计',
    url: 'https://github.com/LUMC-LowFieldMRI/GradientDesignTool', kind: '开源工具 · 梯度',
    description: '基于目标场法，GUI 输入线圈尺寸与目标线性区域，计算导线路径、模拟磁场并导出 CSV。入口为 gradientDesignTool.py；计算结果仍需检查闭合、连接、发热和实测线性度。',
    license: 'MIT。', chapters: [10, 12], status: '已核验入口源码；官方标为早期 beta，并列出开路导线导致导出循环的已知问题。',
  },
  {
    id: 'magtetris', title: 'MagTetris · 磁块阵列的磁场与受力',
    url: 'https://github.com/BioMed-EM-Lab/MagTetris', kind: '开源工具 · 磁场',
    description: 'MATLAB 工具，以磁块位置、姿态、尺寸、剩磁为输入，计算磁场和磁力。MagTetris_main.m 提供示例；用于理解磁体布局的结果，不代替机械结构校核和实际场测量。',
    license: 'MIT。', chapters: [7, 12], status: '已核验官方仓库、示例接口和许可证；未执行数值计算。',
  },
  {
    id: 'nmrduino', title: 'NMRduino · 低频 NMR 控制与采集',
    url: 'https://github.com/NMRduino/NMRduino', kind: '开源工程 · NMR',
    description: '面向亚 MHz 磁共振的模块化电子平台，公开固件、原理图、PCB、BOM 与外壳，GUI 在独立仓库。适合认识脉冲和采集链路；电子板尺寸不等于完整仪器尺寸，也不自带 MRI 空间编码。',
    license: '软件 GPL-3.0；硬件 CC-BY-SA-4.0。', chapters: [1, 6, 8, 9, 12], status: '已核验 v1.2.0 发布清单中的 Gerber、原理图 PDF、外壳 STL、固件 HEX 及 GUI 3.37+ 要求；未逐一检查制造附件质量或搭建实机。',
  },
  {
    id: 'magnethical', title: 'magnETHical · 25 MHz 桌面 NMR 波谱仪',
    url: 'https://github.com/M4a1x/nmr-spectrometer', kind: '开源工程 · 波谱',
    description: '约 0.6 T 永磁、Red Pitaya 与自制硬件的波谱仪研究项目，包含 CAD、控制软件和研究资料。用它理解高分辨波谱对匀场与温稳的要求；仓库 README 仍有占位段，不能当作完整新手装配教程。',
    license: '所链接仓库根许可证 GPL-3.0；其他发布材料另行核对。', chapters: [1, 6, 7, 8, 12], status: '已核验仓库及 ETH 官方项目说明；不同版本成本口径不混用。',
  },
  {
    id: 'pulseq', title: 'PyPulseq · 用 Python 描述脉冲序列',
    url: 'https://github.com/pulseq/pypulseq', kind: '开源工具 · 序列',
    description: '用于构建、检查、绘制和保存 Pulseq 序列，连接抽象实验设计与时序文件。序列能够导出，并不表示任意扫描仪都能执行；仍需兼容解释器和真实硬件限制。',
    license: '当前仓库 MIT；具体版本以 LICENSE 为准。', chapters: [9, 10, 12], status: '已核验官方仓库与现行许可证；旧 imr-framework 地址现重定向至此。',
  },
  {
    id: 'marge', title: 'MaRGE · MaRCoS 的图形实验环境',
    url: 'https://github.com/mriLab-i3M/MaRGE', kind: '开源工具 · 实验控制',
    description: '图形化组织磁共振实验、序列、采集与处理，是理解控制软件层的具体例子。使用前须匹配控制台配置与硬件参数，界面存在不代表整套设备已经校准。',
    license: '所链接仓库 MIT。', chapters: [9, 11, 12], status: '已核验仓库和许可；该地址为 MaRGE 的公开分支，未连接设备测试。',
  },
  {
    id: 'video', title: '老奇好好奇 · 核磁共振为何知道',
    url: 'https://www.bilibili.com/video/BV1di4y1y7au/', kind: '中文视频 · 总览',
    description: '以磁共振现象、弛豫、加权、梯度、k 空间和傅里叶重建串起 MRI。可作整体复习；课程中的定量公式和硬件判断另以大学讲义、原始论文及项目源码核对。',
    license: '视频页声明未经作者授权禁止转载；本站仅提供原始链接。', chapters: [1, 3, 4, 5, 10, 11], status: '已核验视频标题、作者及公开简介；未获得逐字字幕，不提供未经核对的时间戳。',
  },
];

export const glossary: GlossaryTerm[] = [
  { term: '核磁共振', english: 'Nuclear Magnetic Resonance · NMR', definition: '具有核磁矩的体系与合适频率的磁场发生相干作用，并产生可测信号的现象；“核”指原子核，不代表核反应。', stage: 1 },
  { term: '磁共振成像', english: 'Magnetic Resonance Imaging · MRI', definition: '在 NMR 信号上加入空间编码，反推出样品内部不同位置的信号分布。', stage: 1 },
  { term: '弛豫测量', english: 'Relaxometry', definition: '通过信号随等待时间或回波时间的变化估计 T₁、T₂ 等参数；可以不生成图像。', stage: 1 },
  { term: '波谱', english: 'Spectroscopy', definition: '分析共振频率、线形、峰面积与耦合等信息，研究样品的化学或物理环境。', stage: 1 },
  { term: '磁场', english: 'Magnetic field · B', definition: '描述磁作用的矢量场。这里用 B 表示磁感应强度，单位为特斯拉 T。', stage: 2 },
  { term: '矢量', english: 'Vector', definition: '同时具有大小和方向的量；图中的磁化箭头表示整体或一组自旋的平均效果。', stage: 2 },
  { term: '频率', english: 'Frequency · f', definition: '每秒完成的周期数，单位 Hz；1 MHz 等于每秒一百万个周期。', stage: 2 },
  { term: '角频率', english: 'Angular frequency · ω', definition: '相位每秒改变多少弧度；ω = 2πf。与 Hz 混用会造成 2π 倍误差。', stage: 2 },
  { term: '相位', english: 'Phase · φ', definition: '一个周期中当前走到的位置，常用角度或弧度表示；频率相同的信号也可能相位不同。', stage: 2 },
  { term: '电磁感应', english: 'Electromagnetic induction', definition: '穿过线圈的磁通量随时间变化时产生电压，是接收 NMR 信号的基础。', stage: 2 },
  { term: '复数', english: 'Complex number', definition: '用实部和虚部同时记录两个正交分量，便于保存信号的幅度与相位。', stage: 2 },
  { term: '自旋', english: 'Spin', definition: '粒子的内禀量子角动量；不能按字面理解为带电小球在机械自转。', stage: 3 },
  { term: '磁矩', english: 'Magnetic moment · μ', definition: '表征一个体系与磁场相互作用的磁性矢量。核磁矩与核自旋角动量有关。', stage: 3 },
  { term: '塞曼分裂', english: 'Zeeman splitting', definition: '磁场使不同自旋投影态具有不同能量；自旋为 1/2 的核具有两个这样的能级。', stage: 3 },
  { term: '主磁场', english: 'Static field · B₀', definition: '建立平衡磁化并决定主要共振频率的静态磁场；通常把它的方向定义为 z。', stage: 3 },
  { term: '旋磁比', english: 'Gyromagnetic ratio · γ', definition: '把磁场与进动角频率联系起来的核种常数；氢核 γ/2π 约为 42.58 MHz/T。', stage: 3 },
  { term: '拉莫尔进动', english: 'Larmor precession', definition: '横向磁化绕主磁场方向转动；频率的大小满足 f₀ = |γ|B₀/(2π)。', stage: 3 },
  { term: '极化', english: 'Polarization', definition: '自旋态占据不平衡的程度。常温常见磁场下热平衡极化很小，并非所有核都排成同一方向。', stage: 3 },
  { term: '宏观磁化', english: 'Bulk magnetization · M', definition: '大量核磁矩在单位体积内的合成平均量，是本课大多数箭头所代表的对象。', stage: 3 },
  { term: '射频场', english: 'Radiofrequency field · B₁', definition: '用于激发自旋的交变磁场；计算翻转角时通常指与进动同向的旋转分量。', stage: 4 },
  { term: '共振', english: 'Resonance', definition: '驱动频率接近体系共振频率时有效作用增强；激发效果还依赖脉冲幅度、时长和频偏。', stage: 4 },
  { term: '旋转坐标系', english: 'Rotating frame', definition: '让坐标轴随参考频率转动的描述方法，使高速进动变成较慢的频偏演化；没有真的移除主磁场。', stage: 4 },
  { term: '频偏', english: 'Off-resonance / Frequency offset', definition: '实际共振频率与参考或驱动频率之差；会造成额外相位累积和非理想激发。', stage: 4 },
  { term: '翻转角', english: 'Flip angle', definition: '脉冲使磁化旋转的角度。理想共振矩形脉冲下为 γB₁tₚ，适用条件需要同时说明。', stage: 4 },
  { term: '有效磁场', english: 'Effective field', definition: '旋转坐标系中，横向驱动与纵向频偏等效场的合成；决定离共振时的旋转轴。', stage: 4 },
  { term: '布洛赫方程', english: 'Bloch equations', definition: '描述宏观磁化进动与纵、横向弛豫的现象学方程；不自动包含所有耦合和交换过程。', stage: 4 },
  { term: '自由感应衰减', english: 'Free induction decay · FID', definition: '激发后接收到的衰减振荡信号，通常同时受弛豫与静态频率分布影响。', stage: 5 },
  { term: '纵向弛豫时间', english: 'Longitudinal relaxation time · T₁', definition: '纵向磁化回到平衡的时间常数；从零恢复的单指数模型中，经过 T₁ 恢复约 63%。', stage: 5 },
  { term: '横向弛豫时间', english: 'Transverse relaxation time · T₂', definition: '横向相干衰减的时间常数；理想单指数模型中经过 T₂ 剩约 37%。', stage: 5 },
  { term: '表观横向衰减时间', english: 'Effective transverse decay time · T₂*', definition: '把静态失相等影响也包含进来的表观时间尺度，通常不长于 T₂；FID 不一定严格呈单指数。', stage: 5 },
  { term: '自旋回波', english: 'Spin echo', definition: '利用重聚焦脉冲在一定条件下重新汇合静态频偏造成的失相；不能恢复所有已经损失的相干。', stage: 5 },
  { term: 'CPMG', english: 'Carr–Purcell–Meiboom–Gill', definition: '使用特定相位关系的一串重聚焦脉冲产生回波列；常用于估计 T₂，仍需考虑脉冲误差与扩散。', stage: 5 },
  { term: '回波时间', english: 'Echo time · TE', definition: '从激发中心到所测回波中心的时间，是控制对比与衰减的重要参数。', stage: 5 },
  { term: '重复时间', english: 'Repetition time · TR', definition: '相邻重复激发之间的时间；与磁化恢复程度、扫描时间和图像对比有关。', stage: 5 },
  { term: '正交解调', english: 'Quadrature demodulation · I/Q', definition: '用相差 90° 的两路参考提取信号的两个正交分量，保留幅度、相位及频偏符号信息。', stage: 6 },
  { term: '模数转换器', english: 'Analog-to-digital converter · ADC', definition: '按时钟采样模拟电压并转成数字。位数、噪声、输入范围和采样率共同限制可用信息。', stage: 6 },
  { term: '采样率', english: 'Sampling rate · fₛ', definition: '每秒记录的样本数。应结合信号频带、滤波器和实数／复数采样方式判断是否足够。', stage: 6 },
  { term: '混叠', english: 'Aliasing', definition: '不同的连续频率采样后变得无法区分；MRI 中不足的空间频率采样也会产生折叠。', stage: 6 },
  { term: '傅里叶变换', english: 'Fourier transform', definition: '把信号表示成不同频率分量的组合；要得到空间图像，还须有把位置编码成相位的实验。', stage: 6 },
  { term: '快速傅里叶变换', english: 'Fast Fourier transform · FFT', definition: '高效计算离散傅里叶变换的算法；算法本身不会补回未采集的物理信息。', stage: 6 },
  { term: '接收带宽', english: 'Receiver bandwidth', definition: '接收链允许通过并记录的频率范围，影响噪声、读出速度和成像失真；须说明总带宽或每像素带宽。', stage: 6 },
  { term: '信噪比', english: 'Signal-to-noise ratio · SNR', definition: '信号与噪声尺度的比值。比较数值前应统一测量方法、带宽、样品和采集条件。', stage: 6 },
  { term: '动态范围', english: 'Dynamic range', definition: '系统能可靠处理的最强与最弱信号范围；强脉冲泄漏可能淹没微弱回波或使放大器饱和。', stage: 6 },
  { term: 'Halbach 阵列', english: 'Halbach array', definition: '按特定方向排列磁块，使磁场在目标区域增强的一类结构；有限尺寸和制造偏差仍会造成不均匀。', stage: 7 },
  { term: '匀场', english: 'Shimming', definition: '通过额外磁块、材料或线圈修正主磁场空间偏差；完成设计后还需测量验证。', stage: 7 },
  { term: '场图', english: 'Field map', definition: '记录不同空间位置的磁场或共振频率，是分析均匀度、失真和匀场效果的依据。', stage: 7 },
  { term: 'DSV', english: 'Diameter of spherical volume', definition: '指定评估磁场均匀度的球形体积直径；机械孔径、DSV 与可用成像视野不是同一个量。', stage: 7 },
  { term: '百万分之一', english: 'Parts per million · ppm', definition: '相对量的单位；用于磁场偏差或化学位移时必须说明参考值和统计口径。', stage: 7 },
  { term: '温漂', english: 'Thermal drift', definition: '温度变化导致磁场、共振频率或电子响应随时间偏移，可能使长时间平均效果变差。', stage: 7 },
  { term: '调谐', english: 'Tuning', definition: '调整线圈与电容组成的谐振电路，使其工作频率接近所需 RF 频率。', stage: 8 },
  { term: '阻抗匹配', english: 'Impedance matching', definition: '使接口阻抗符合传输与负载要求，减少反射；它与调谐相关但不是同一件事。', stage: 8 },
  { term: '品质因数', english: 'Quality factor · Q', definition: '描述谐振电路储能相对于损耗的尺度；较高 Q 常伴随较窄带宽和较长振铃。', stage: 8 },
  { term: '振铃', english: 'Ring-down', definition: '发射停止后谐振电路中储存的能量仍在振荡，可能遮住早期 FID。', stage: 8 },
  { term: '收发切换', english: 'Transmit/receive switching · T/R', definition: '在强发射和弱接收之间切换通路并保护接收器；需要考虑隔离度和恢复时间。', stage: 8 },
  { term: '死时间', english: 'Dead time', definition: '脉冲后到接收链能可靠采集之间的不可用时间，可能来自振铃、开关或放大器恢复。', stage: 8 },
  { term: '低噪声放大器', english: 'Low-noise amplifier · LNA', definition: '接收前端的微弱信号放大器；目标是在增加幅度时尽量少引入噪声。', stage: 8 },
  { term: '脉冲序列', english: 'Pulse sequence', definition: 'RF、梯度、等待与采样按精确时间排列的实验程序，决定如何激发、编码和读取信号。', stage: 9 },
  { term: '现场可编程门阵列', english: 'Field-programmable gate array · FPGA', definition: '可实现确定时序数字逻辑的器件，常用于协调波形、触发和采集。', stage: 9 },
  { term: '相位循环', english: 'Phase cycling', definition: '按规律改变脉冲和接收相位并组合实验，选择需要的相干路径、抑制部分伪信号。', stage: 9 },
  { term: '梯度磁场', english: 'Magnetic field gradient · G', definition: '使主场方向的磁场分量随位置改变。在线性近似下，用 G 描述变化率，单位 T/m。', stage: 10 },
  { term: '选层', english: 'Slice selection', definition: '把 RF 的频率选择性与空间梯度结合，主要激发一个有限厚度的区域。', stage: 10 },
  { term: '频率编码', english: 'Frequency encoding', definition: '采样时施加梯度，让不同位置产生不同频偏，形成一个方向的空间编码。', stage: 10 },
  { term: '相位编码', english: 'Phase encoding', definition: '用一段梯度让不同位置积累不同相位；梯度撤除后，这些相位差仍可留在信号中。', stage: 10 },
  { term: 'k 空间', english: 'k-space', definition: '空间频率的坐标空间。每个采样点通常包含整个被激发区域的加权信息，不对应一个独立像素。', stage: 10 },
  { term: '梯度切换率', english: 'Slew rate', definition: '梯度强度每秒改变的速度；线圈电感和驱动电压限制实际切换速度。', stage: 10 },
  { term: '涡流', english: 'Eddy currents', definition: '变化的磁场在导体中感应出的电流，会产生额外磁场并使实际梯度偏离设定波形。', stage: 10 },
  { term: '视野', english: 'Field of view · FOV', definition: '图像覆盖的空间范围；规则笛卡尔采样时，与 k 空间采样间隔互为倒数。', stage: 11 },
  { term: '体素', english: 'Voxel', definition: '图像中一个三维体积单元；体素尺寸描述采样网格，不自动等于真实可分辨的最小结构。', stage: 11 },
  { term: '点扩散函数', english: 'Point-spread function · PSF', definition: '系统把理想点变成怎样的图像；帮助理解有限采样、加窗和重建造成的模糊。', stage: 11 },
  { term: '伪影', english: 'Artifact', definition: '并非样品真实结构、而由采集或重建条件造成的图像特征，如折叠、条纹和鬼影。', stage: 11 },
  { term: '模体', english: 'Phantom', definition: '具有已知或可重复结构、成分的测试样品，用来校准和评估仪器性能。', stage: 12 },
  { term: '重复性', english: 'Repeatability', definition: '在相近条件下重复测量是否得到接近的结果；稳定重复仍不保证绝对准确。', stage: 12 },
  { term: '测量不确定度', english: 'Measurement uncertainty', definition: '对测量值可信范围的定量描述，需要考虑噪声、校准、模型和条件变化。', stage: 12 },
  { term: '化学位移', english: 'Chemical shift', definition: '电子环境使核感受到的局部磁场不同，从而改变相对共振频率；常以 ppm 表示。', stage: 6 },
  { term: '标量耦合', english: 'Scalar coupling · J coupling', definition: '通过电子介导的核自旋相互作用，可产生多重峰；J 通常用 Hz 表示。', stage: 6 },
];

export const hardwareModules: HardwareModule[] = [
  { id: 'magnet', name: '01 · 主磁体、测场与匀场', purpose: '建立静态主场，测量真实场图，再用补偿磁块或线圈修正偏差并复测。永磁体断电后仍有磁场，支架必须约束磁块受力。', input: '磁体几何、机械支撑、场测量与温度条件', output: '经验证的 B₀ 场、均匀区域与残余频偏', failure: '不均匀、温漂会展宽信号并造成失真；理想仿真或机械孔径不能代替实测可用区域。', stage: 7 },
  { id: 'console', name: '02 · 时钟与脉冲控制', purpose: '在同一时间基准下安排发射、梯度、开关和接收，使相位与时间保持一致。', input: '实验序列、硬件上限、公共参考时钟', output: '同步的 RF、梯度、触发和采样控制', failure: '触发抖动、时钟不一致或时序重叠会让平均信号抵消、回波错位或接收器暴露于发射。', stage: 9 },
  { id: 'transmitter', name: '03 · 射频生成与功率放大', purpose: '把数字设定变成幅度、相位和频率受控的 RF 脉冲，驱动发射线圈。', input: 'RF 波形、相位设定与发射门控', output: '规定时间内的 RF 电压与电流', failure: '失真、幅度漂移或功率压缩会改变实际翻转角；需用衰减后的测量信号校准，不能直连超量程仪器。', stage: 8 },
  { id: 'coil', name: '04 · RF 线圈、调谐与匹配', purpose: '把电流变成样品附近的 B₁，并把横向磁化变化耦合成接收电压；收发可共用或使用不同线圈。', input: 'RF 驱动、样品负载、与 B₀ 的几何关系', output: '样品激发与微弱感应电压', failure: '失谐、负载变化、B₁ 不均或长振铃会降低信号；应在实际样品条件下检查调谐和脉冲响应。', stage: 8 },
  { id: 'gradient', name: '05 · 梯度线圈与电流驱动', purpose: '按时序让共振频率随空间位置变化，完成选层和空间编码；这是与 RF 通路并行的编码支路。', input: '梯度波形、线圈标定、电流和电压限制', output: '随时间变化的空间编码梯度', failure: '线性误差、涡流、升温和切换延迟会使 k 空间轨迹偏离预期；应测量实际响应。', stage: 10 },
  { id: 'switch', name: '06 · 收发隔离与接收保护', purpose: '发射时隔离或限制强信号，接收时把微弱回波送入前端。接收使能须等待电路恢复。', input: '线圈信号、发射门控、保护电路', output: '可供接收器处理的信号窗口', failure: '隔离不足可能损坏或压饱和前端；仅在软件里暂停记录不能代替硬件保护。', stage: 8 },
  { id: 'receiver', name: '07 · 低噪声接收与滤波', purpose: '放大微弱信号、限制不需要的频带，并按架构完成模拟或数字正交解调。', input: '受保护的微弱 RF 信号与参考频率', output: '增益、带宽和相位受控的接收信号', failure: '外部干扰、接地问题、噪声或饱和会损坏可测信息；加大增益不能恢复已丢失的信噪比。', stage: 6 },
  { id: 'adc', name: '08 · 数字化与数据记录', purpose: '采样并保存数据、时间、序列和校准信息，形成可以重复分析的原始记录。', input: '接收信号、采样时钟、增益和滤波设置', output: '带单位与采集参数的原始样本或复数 I/Q 数据', failure: '混叠、截幅、漏样和缺失参数会使后处理失去依据；检查空载噪声和已知测试信号。', stage: 6 },
  { id: 'reconstruction', name: '09 · 处理、重建与验证', purpose: '把采样对应到频率或 k 空间，获得频谱、图像或参数，再用已知样品检查结果。', input: '原始数据、编码坐标、序列与校准记录', output: '可解释的频谱、图像、参数及质量指标', failure: '错轴、错误相位、错误单位或不合适的拟合模型都可能生成看似合理的结果；保留原始数据并验证重复性。', stage: 11 },
];

export interface AdvancedReading {
  title: string;
  summary: string;
  body: string[];
  sources: string[];
}

export const advancedReadings: AdvancedReading[] = [
  {
    title: '量子图景：箭头背后是什么？',
    summary: '向量模型足以解释许多基础实验，但不是每个原子核真实运动的录像。',
    body: [
      '核自旋是内禀量子性质。对自旋 1/2 的核，沿选定方向测量自旋投影有两个可能结果；这不表示一个核只能像小磁针那样永久指向上或下。量子态还可包含叠加和相干，很多核组成的样品又通常是混合态。宏观磁化是这些状态的统计期望值，所以我们才能用一个平均箭头追踪实验。',
      '静态磁场带来能级差，热平衡中两能级的占据略不相等，形成纵向磁化。射频脉冲的作用不能只描述成“把粒子搬上高能级”：它还建立可观测的横向相干。脉冲的相位决定相干的方向，后续演化决定接收信号相位。',
      '当独立自旋和现象学弛豫近似足够时，布洛赫方程很实用。研究 J 耦合、相干转移、多量子过程时，则要引入哈密顿量、密度矩阵或乘积算符。进阶学习的目标是知道什么时候该换模型，而非否定已经学会的箭头。',
    ], sources: ['keeler2', 'keeler3', 'keeler8'],
  },
  {
    title: '化学位移与 J 耦合：为什么会出现多个峰？',
    summary: '看到水样回波，与分辨分子结构所需的精细波谱，是不同的性能目标。',
    body: [
      '电子会改变原子核附近的局部磁场，同一种核处于不同化学环境时，共振频率也略有区别。化学位移用相对频率差的 ppm 表示；同样 1 ppm，在 25 MHz 上对应约 25 Hz，在约 2.13 MHz 上只对应约 2.13 Hz。因此低场并非不能做波谱，而是要分开这些峰时，对线宽、漂移与信噪比有具体要求。',
      'J 耦合是通过电子介导的核自旋相互作用，常用 Hz 表示。在相同化学体系下，它通常不像化学位移的 Hz 间距那样随 B₀ 成比例变化。降低场强可能让频率差接近 J，使简单的一阶裂分规则失效。多个峰也不应直接解释成多个空间位置。',
      '把桌面仪器用于波谱，需要控制磁场均匀度、样品负载、温度、相位和线形。成像则主动加入已知空间梯度；两者都使用频率和相位，却是在回答不同的问题。先明确要测什么，再判断所需的仪器性能。',
    ], sources: ['keeler2', 'keeler4', 'magnethical', 'stanford'],
  },
  {
    title: '复杂序列：从一条时间线到一组实验',
    summary: '序列名称不是黑箱按钮；逐段追踪磁化、相位与采样，才能理解它的作用。',
    body: [
      '读序列图时，先沿时间轴标出 RF、三个梯度和 ADC 窗口，再追问每一段在改变什么。反转恢复在激发前加入反转和等待，利用纵向恢复产生对比；自旋回波用 RF 重聚焦；梯度回波用梯度改变相位累积，但不等同于消除静态 B₀ 失相。',
      '快速自旋回波在一次激发后采集多个回波，并把它们安排到不同的 k 空间位置，节约时间的同时改变信号加权。扩散实验利用梯度让位移影响相位，在合适模型下推断运动。复杂序列还可能需要处理不完全翻转、受激回波、交换和稳态，不能只套单个指数公式。',
      'PyPulseq 之类工具可以描述波形、检查时序和导出序列；执行仍依赖控制台解释器、梯度标定、RF 校准以及电压、电流和时间分辨率。一个文件语法正确，与一个实验物理正确，是两层验证。先用仿真和测试样品逐步检查。',
    ], sources: ['stanford', 'pulseq', 'marcos', 'keeler8'],
  },
  {
    title: '定量测量：拟合出一个数，还不算测准',
    summary: '区分模型参数、实测估计值和可用于解释样品的结论。',
    body: [
      '将回波峰值拟合成 A·exp(−t/T₂) 很直观，但这个模型假设单一衰减过程和合适的观测条件。多个组分、交换、扩散、背景梯度以及不理想重聚焦都可能改变曲线。拟合线看起来贴合，不足以证明结果就是样品固有的单一 T₂。',
      '应先记录温度、场强、TR、回波间隔、接收带宽和样品位置，再检查噪声、残差与重复测量。扫描时间改变或增益变化时，也要确认比较仍公平。含噪复数数据取模后会产生噪声底，直接把尾部当成真实长寿命信号，可能让衰减时间估计偏大。',
      '用已知模体检验准确性，用重复测量检验稳定性，并报告拟合模型、误差范围与失败条件。公开低场参考系统研究也报告了 T₂ 实测偏差；这说明“图像清楚”和“参数准确”需要各自验证。由参数推断成分或品质，还要建立独立校准关系。',
    ], sources: ['keeler8', 'osii-paper', 'ezymri'],
  },
];

export interface Correction {
  claim: string;
  correction: string;
  sourceId: string;
}

export const corrections: Correction[] = [
  { claim: 'Halbach 工具打印了 Homogeneity，就证明整个三维成像区域都足够均匀。', correction: '固定提交 22cb72a 的打印值来自 z=0 平面的 |Bx|。场分量、采样区域和统计定义都影响结果，应另外评估目标三维体积并实测。程序输出不是实机验收。', sourceId: 'halbach-code' },
  { claim: 'NMRduino 公开了制造附件，所以可直接用于 50 mT 的氢核 MRI。', correction: 'NMRduino 的公开定位是 sub-MHz NMR；50 mT 下质子频率约为 2.129 MHz，不能据“有 Gerber”推定其控制与射频链在该频段兼容。还需梯度与成像控制，或另选符合频段的系统。', sourceId: 'nmrduino' },
  { claim: '核自旋就是一个带电小球在自转。', correction: '自旋是量子内禀角动量。小磁针或陀螺只能帮助理解部分行为，不能作为微观结构的机械解释；本课箭头主要代表宏观磁化。', sourceId: 'keeler2' },
  { claim: '有了 NMR 回波，做一次 FFT 就能得到 MRI 图像。', correction: '普通 NMR 回波没有自动携带完整空间坐标。成像需要设计空间编码与采样轨迹，再按模型重建。', sourceId: 'stanford' },
  { claim: 'T₁ 是信号衰减，T₂ 是磁化恢复，二者前后发生。', correction: 'T₁ 描述纵向趋向平衡，T₂ 描述横向相干衰减；两类过程可以同时发生。FID 中的表观失相还可能包含静态场不均匀。', sourceId: 'keeler8' },
  { claim: '180° 脉冲能够把所有已经衰减的信号恢复回来。', correction: '理想回波可重聚焦一部分静态频偏导致的失相，不能恢复全部不可逆弛豫；扩散和脉冲误差也可能留下损失。', sourceId: 'keeler3' },
  { claim: 'k 空间的每一个点，就是图像里的一个像素。', correction: '一个 k 空间点通常是整个被激发区域按某种空间相位模式加权的信号。图像像素来自多个空间频率样本的共同组合。', sourceId: 'stanford' },
  { claim: '只把 bore_radius 设为 175，就能自动设计出指定孔径和场强的 Halbach MRI。', correction: 'HalbachMRIDesigner 的现有入口读取完整 JSON 几何，没有这个命令行参数。环半径、切片孔径、磁块数量和排列需共同设计，场强及均匀区还须计算、实测。', sourceId: 'halbach' },
  { claim: '梯度设计工具输出了导线，就可以直接制造并保证效果。', correction: 'GradientDesignTool 输出设计路径和模拟结果；官方还列出开路导线的已知问题。必须检查连接、场线性、电阻与驱动响应，不能把 CSV 当成已验证硬件。', sourceId: 'gradient' },
  { claim: 'MagTetris 的重量输出就是整台 MRI 的重量。', correction: '示例中的 Weight() 依据磁块体积估算永磁材料重量，不包括支架、线圈、电子系统和外壳。', sourceId: 'magtetris' },
  { claim: 'MaRCoS 是下载后即可使用的一整台开源 MRI。', correction: 'MaRCoS 是控制电子与软件系统；完整仪器还需要磁体、RF、梯度、放大器、保护和校准。', sourceId: 'marcos' },
  { claim: 'NMRduino 的信用卡大小代表整套 NMR 都只有这么大。', correction: '这个尺寸描述电子板。磁场产生、样品线圈、供电和其他实验组件需要另外考虑。', sourceId: 'nmrduino' },
  { claim: '公开演示中几天造好 MRI，说明零基础个人也能在几天内复现。', correction: 'ezyMRI 报告的是经过准备的多人协作工作坊，六个团队分工完成不同子系统。其时间不能脱离经验、设备和预先准备条件解释。', sourceId: 'ezymri' },
  { claim: '公开仓库说明所有图纸都完整，所有参数都已经验证。', correction: '开放程度、文档完整度和性能验证是不同问题。例如 magnETHical 仓库有硬件和研究材料，但 README 部分操作段落仍未完成，阅读时要区分实测结果与待补内容。', sourceId: 'magnethical' },
];
