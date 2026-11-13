export type ProjectAuditId = 'ezymri' | 'osii' | 'marcos' | 'shimmer';

export type ProjectAuditEvidence = {
  title: string;
  url: string;
};

export type ProjectAudit = {
  id: ProjectAuditId;
  title: string;
  url: string;
  role: string;
  provided: string[];
  gaps: string[];
  verdict: string;
  evidence: ProjectAuditEvidence[];
  checkedAt: string;
};

// “尚未核验”描述本站的核验边界，不等于上游项目缺少资料。
// 项目角色不同；论文中的一次成功，也不等于本站已完成硬件复现。
export const projectAudits: ProjectAudit[] = [
  {
    id: 'ezymri',
    title: 'ezyMRI：一次整机搭建的工程记录',
    url: 'https://arxiv.org/abs/2411.11365',
    role: '工作坊经验论文。用于串起磁体、梯度、RF、控制台、联调与失败排查；不是 OSI² ONE 的另一个名字。',
    provided: [
      '已读取 49 页公开论文的制造、控制、RF 和集成章节。第 3–7 节给出磁体装配与测场、梯度支架与绕制、探头调谐、控制安装和链路测试过程，并报告实测结果。',
      '明确指向实际采用的工具：MagTetris、CoilGen、MaRCoS 和 MaRGE。梯度部分说明从导线路径生成带槽支架，再绕制、测场并测量电阻和电感；并非只有一张整机照片。',
      '第 7 节记录接口错误、梯度振荡、收发隔离和噪声排查；第 9 节说明最后获得了两个水瓶的二维投影图像，图像质量仍较低。',
    ],
    gaps: [
      '【作者承认】第 9 节指出，软硬件更新会造成文档滞后，初学者仍可能需要有经验的人协助。四天活动包含培训、导师和六个团队协作，不能当作个人复刻工期。',
      '【作者承认】活动中出现梯度板故障、装配间隙过紧和整机噪声偏高。论文记录的旧版固件兼容问题后来已修复，不能据此断言当前版本仍有该故障。',
      '【工程推论】更换磁体、功放或线圈后，仍需重新核对机械空间、输入输出、调谐、梯度响应和时序；案例参数不能直接成为另一台机器的装配参数。',
      '【尚未核验】尚未核实该次工作坊是否另有覆盖全部部件、固定版本的完整 CAD／PCB／BOM 打包档案。本次核验论文和其中的项目入口，不能把“尚未核实档案”写成“没有制造文件”。',
    ],
    verdict: '适合作为制造与联调的案例主线。能帮助理解如何做、为什么失败；复刻前还要选定具体硬件版本并核对其制造文件。',
    evidence: [
      { title: '论文全文：第 3–7 节制造与联调，第 9 节总结', url: 'https://arxiv.org/pdf/2411.11365' },
      { title: '作者摘要、版本与正式发表信息', url: 'https://arxiv.org/abs/2411.11365' },
      { title: '论文采用的 MagTetris 官方仓库', url: 'https://github.com/BioMed-EM-Lab/MagTetris' },
      { title: '论文采用的 CoilGen 官方仓库', url: 'https://github.com/Philipp-MR/CoilGen' },
    ],
    checkedAt: '2026-11-13',
  },
  {
    id: 'osii',
    title: 'OSI² ONE：有制造资料的模块化整机路线',
    url: 'https://gitlab.com/osii/mri-scanners/osii-one',
    role: '低场 MRI 整机及模块索引。先固定整机版本，再沿对应链接读取磁体、梯度、RF、控制与校准资料。',
    provided: [
      '整机 README 列出 rc/1.0、rc/1.1、rc/2.0、rc/2.1 的模块差异与链接，包括磁体、梯度功放、RF 功放、收发开关和控制台。当前整机入口是 /osii/mri-scanners/osii-one。',
      '磁体仓库已核实有 src/BOM.csv、原生 CAD 目录，以及 doc 下的制造、装配和质量指南。制造指南说明加工、公差和材料；装配指南有步骤、极性标记与检查。CAD 使用 Git LFS，交换格式由发布记录提供。',
      '2026 年参考系统预印本公开校准、噪声、涡流、几何和定量测量方法，并链接数据、序列与笔记本；同时报告 TU Graz 和 INRiM 的异地复刻结果。',
      '整机根许可为 CERN-OHL-W-2.0，各模块许可分别适用。论文的参考配置仍使用包含闭源硬件的工作站和 RF 功放；开放模块路线不意味着每个商业器件的内部设计都开放。',
    ],
    gaps: [
      '【作者承认】参考系统论文第 2.6 节说明，复刻设备不是原机的精确副本；当地资源使团队替换或自制部分模块。TU Graz 的公开资料复刻历时约一年，不能把它当成通用工期承诺。',
      '【作者承认】磁体质量指南仍标有 TBD，虽然已有磁块与加工检查内容，也不能据此视为完整的整机验收规程。',
      '【工程推论】版本之间的主场方向、梯度和收发硬件有变化；不同版本的图纸不能不核对就混装。得到图像后还须核验尺度、噪声、重复性和定量偏差。',
      '【工程推论】便携低场不等于桌面微型：2026 年论文的磁体约 100 kg，整机小于 200 kg。若目标是小样品的小型仪器，应重新确定净空、样品线圈与均匀场区域，不能把这一配置直接当作小型化方案，也不能等比例缩图后沿用性能。',
      '【尚未核验】尚未逐一打开全部版本的 CAD／PCB、检查所有 Git LFS 对象和器件替代关系，也未运行整套校准。现有证据支持“已有制造资料与复刻案例”，不支持“全部文件均已由本站验证可直接制造”。',
    ],
    verdict: '可以作为具体复刻候选，不能简单说“没给步骤，所以造不出来”。已有制造与复刻证据；接下来应锁定一套版本，逐模块加工、检查和联调。',
    evidence: [
      { title: '整机 README：模块版本、复刻列表与许可', url: 'https://gitlab.com/osii/mri-scanners/osii-one/-/blob/main/README.md' },
      { title: '磁体 README：CAD、Git LFS 与目录结构', url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/README.md' },
      { title: '磁体 BOM：自制件、采购件与引用文件', url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/src/BOM.csv' },
      { title: '磁体制造指南', url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/manufacturing-guide.md' },
      { title: '磁体装配指南', url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/assembly-guide.md' },
      { title: '磁体质量指南：含尚待完善标记', url: 'https://gitlab.com/osii/magnet/30cm-halbach-magnet/-/blob/main/doc/qm-guide.md' },
      { title: '参考系统全文：第 2.6、3.3 节复刻与第 4 节局限', url: 'https://arxiv.org/html/2608.19062v2' },
    ],
    checkedAt: '2026-11-13',
  },
  {
    id: 'marcos',
    title: 'MaRCoS：控制与采集，不是完整扫描仪',
    url: 'https://github.com/marcos-mri',
    role: '让射频、梯度、门控和采样按同一时间基准执行的控制生态。可独立学习和仿真，再接入已核对的模拟硬件。',
    provided: [
      '官方组织 README 给出 SDRLab 122–16、FPGA、计算机软件和梯度板的架构，链接 GPA-FHDO、OCRA1、MaRGE 与相关论文。',
      '官方 Wiki 提供无需硬件的软件测试和简单序列仿真教程，以及安装、调试、梯度引脚和内部结构说明；并链接服务端、客户端、固件、SD 镜像和打包仓库。',
      '文档解释发射 I/Q 上变频、接收数字下变频和滤波，以及梯度 SPI 控制。它让“时序代码怎样变成电信号”有可追踪的实现。',
    ],
    gaps: [
      '【作者承认】Wiki 将部分安装说明标为稍旧，将部分使用说明标为 TODO；也提醒某些早期 FPGA 参考仓库内容已过时。应按当前教程和实际版本核对，不把所有入口视为同等新。',
      '【工程推论】控制台之外仍要配套磁体、RF 线圈、发射放大、低噪声接收、保护和梯度驱动。先核对接口电平、单端／差分、功率和门控，不能把数字控制就绪等同于模拟链路合格。',
      '【工程推论】硬件型号、FPGA、服务端、客户端及上层 GUI 必须配套；能运行仿真不证明接线、实际输出幅度、梯度极性和接收恢复已经正确。',
      '【尚未核验】本站未在真实 SDRLab 和梯度板上运行当前版本，也未做功率、隔离或噪声测量；不能提供“接上就能用”的兼容性保证。',
    ],
    verdict: '适合先完成软件仿真和控制链验证。它能成为整机的一部分，但不能独自完成从磁体制造到成像的全部工作。',
    evidence: [
      { title: 'MaRCoS 官方组织 README：角色与架构', url: 'https://github.com/marcos-mri' },
      { title: '官方 Wiki：教程、已有文档与待完善标记', url: 'https://github.com/vnegnev/marcos_extras/wiki' },
      { title: 'ezyMRI 全文第 5、7 节：实际控制台安装及模拟接口联调', url: 'https://arxiv.org/pdf/2411.11365' },
    ],
    checkedAt: '2026-11-13',
  },
  {
    id: 'shimmer',
    title: 'Shimmer：把实测场图变成可制造的补偿方案',
    url: 'https://arxiv.org/abs/2608.22351',
    role: '主磁体造好后的被动匀场工具与方法。它改善场分布，不提供完整 MRI 的全部模块。',
    provided: [
      '已读取 README 与方法论文。仓库提供 field_optimizer_tutorial.ipynb、坐标转换笔记本、OSII_magnet.py、依赖清单，以及托盘、插槽和示例输出的 STL 路径。',
      '教程从装好托盘、输入实测场图开始，优化磁块位置和方向，生成带位置标记的支架 STL，再装配与复测。论文给出多个磁体的验证和不同优化策略的比较。',
      '已进一步核验仓库 README 与 LICENSE：工具代码采用 GPL-3.0；论文为 CC-BY-4.0。两种许可分别对应代码和论文，不能混用。',
    ],
    gaps: [
      '【作者承认】论文讨论了磁块偏差、装配误差、温度与测场不确定度，以及后期逼近更高均匀度时的困难；该托盘结构并非能消除任意空间误差。',
      '【工程推论】优化需要自己的场图、坐标方向、磁体与托盘几何。别人的补偿磁块清单不能直接用于另一台磁体；装好后仍需复测并可能重复迭代。',
      '【尚未核验】本站未实际运行 notebook、核查所有 STL 的可打印性或实测任何补偿效果；论文的改善结果不能转换成对任意新磁体的性能承诺。',
    ],
    verdict: '已有从测场到支架输出的公开流程，可补上制造学习中的“装好后如何修正”。先掌握测场、坐标和加工误差，再按具体磁体使用。',
    evidence: [
      { title: 'Shimmer README：安装、使用与 STL 输出流程', url: 'https://gitlab.com/osii/shimming/shimmer/-/blob/master/README.md' },
      { title: 'Shimmer LICENSE：GPL-3.0', url: 'https://gitlab.com/osii/shimming/shimmer/-/blob/master/LICENSE' },
      { title: '方法全文：流程、验证与讨论中的限制', url: 'https://arxiv.org/html/2608.22351v1' },
    ],
    checkedAt: '2026-11-13',
  },
];
