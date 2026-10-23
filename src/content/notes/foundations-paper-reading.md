---
title: '基础论文阅读路径 · 六篇公共经典与两篇方向选读'
description: '用概率、线代、微积分与建模能力接住经典思想：先看问题，再推核心公式，满足先修后精读原文。'
date: '2026-10-15'
tags: ['Foundations', 'Reading Guide', 'Research Methods']
category: 'tutorial'
foundationOrder: 2
demo: false
draft: false
readTime: 15
chapters: 7
---

## 1. 现在就能查看，但按先修逐步深入

这组文献面向科研公共基础：几何表示、不确定性、随机迭代、采样、状态估计与梯度学习。另列决策和机器人控制两篇选修，供后续分支使用。**这是经典论文导读与原文入口，个人精读、推导和验证进度另行私存。**

论文的任务是让你看到基础概念怎样组成一个有用的方法；连续教学由00–79章承担，[40周阅读路径](/notes/foundations-course-index/)安排每两周读哪些章，[公共路线](/notes/research-foundations-roadmap/)说明阶段和回补规则。历史论文常有旧记号和省略步骤，第一遍不懂并不意味着基础学习失败。

前两周读[00数学热身](/notes/foundations-00-math-language/)、[01逻辑](/notes/foundations-01-logic/)、[02证明](/notes/foundations-02-proof-methods/)和[03三角基础](/notes/foundations-03-trigonometry/)。线代从第04章开始。论文可花10–20分钟看题目、引言和图，辨认“作者在解决什么”；不同时布置八篇全文精读。

## 2. 六篇公共基础：按概念依赖配对

以下顺序用于组织资料，不是引用排名，也不是必须依次读完的任务单。选读从相应先修通过时开始，论文完整精读需要更多准备。

| 论文与导读 | 正式发表 | 学到什么 | 进入选读前至少会什么 |
| --- | --- | --- | --- |
| [Pearson：从点云到主方向](/digest/foundation-pca/) | Philosophical Magazine, 1901 | 正交拟合、投影、低维结构，理解 PCA 的几何来源 | 中心化、内积、投影；深入推导需协方差和特征值 |
| [Shannon：给不确定性定量](/digest/foundation-shannon/) | Bell System Technical Journal, 1948 | 概率、熵、编码与通信问题 | 离散概率、期望、对数；信道部分另需条件概率 |
| [Robbins–Monro：带噪声的逐步求解](/digest/foundation-robbins-monro/) | Annals of Mathematical Statistics, 1951 | 随机逼近、步长、噪声与迭代 | 期望、方差、导数、数列与级数的基本收敛概念 |
| [Metropolis 等：用采样计算平均](/digest/foundation-metropolis/) | Journal of Chemical Physics, 1953 | 接受/拒绝、马尔可夫链、相关样本 | 概率密度、期望、积分、状态转移；原物理应用另补能量与温度 |
| [Kalman：预测与观测如何结合](/digest/foundation-kalman/) | ASME Journal of Basic Engineering, 1960 | 动态模型、噪声、协方差与递推估计 | 矩阵、协方差、线性差分系统；最优条件均值另需线性高斯模型 |
| [Rumelhart 等：链式法则怎样训练网络](/digest/foundation-backprop/) | Nature, 1986 | 复合计算、参数梯度与隐藏表示 | 多元链式法则、偏导、矩阵维度、平方损失和梯度下降 |

系统先修对应为：Pearson几何选读接[第15章PCA](/notes/foundations-15-pca/)，Shannon离散熵接[第34章条件概率](/notes/foundations-34-conditional-probability/)与[第37章期望](/notes/foundations-37-expectation-variance/)，Metropolis有限状态例接[第53章Markov链](/notes/foundations-53-markov-chains/)，Robbins–Monro与反向传播分别接[第73章随机逼近](/notes/foundations-73-stochastic-approximation/)和[第74章反向求导](/notes/foundations-74-reverse-mode/)。Kalman可接线性高斯与递推模型，但完整滤波推导仍需专门补课；连续状态MCMC及随机逼近的一般收敛证明也不由本课程替代。

建议在概率模块先选 Shannon 的离散熵部分；在线代与统计衔接时选 Pearson；在优化模块配 Robbins–Monro 和反向传播；在采样模块选 Metropolis；把 Kalman 留作综合练习或挑战。不要求每篇都完成复杂实验后才能继续学其他公共基础。

## 3. 两篇方向选读：在公共主干之后接上

| 论文 | 分支 | 额外先修 | 第一次看什么 |
| --- | --- | --- | --- |
| [Watkins–Dayan：Q-learning](/digest/foundation-q-learning/) · Machine Learning, 1992 | 决策、强化学习、具身学习 | 有限 MDP、折扣回报、Bellman 方程、随机逼近 | 更新规则与收敛条件，先用有限表格例子，不把结论直接推广到深度网络 |
| [Khatib：操作空间方法](/digest/foundation-operational-space/) · IEEE Journal of Robotics and Automation, 1987 | 机器人、控制、物理交互 | Jacobian、虚功、分析力学、反馈与秩 | 关节与任务空间的关系，先验证力映射，之后再读任务空间惯性与控制 |

这是分支的样本，不要求所有科研方向都优先读它们。以后新增领域时，先补相应专属基础，再建经典论文与前沿论文图谱。

## 4. 每篇论文读三轮，每轮留下不同证据

**第一轮：问题定位，20–40 分钟。** 读引言、问题定义与主要图。写清输入、输出、作者要解决的困难、使用了哪些假设。遇到看不懂的符号，记下位置，不急着追完每条公式。

**第二轮：核心推导，按先修情况分几次完成。** 选一条关键公式，把每个符号、维度、单位和前提写全。改成一维或二维例子手算。原文跳步时，先指出缺的是哪个基础模块，再回补讲义。导读中给出的现代简化例子不等于原论文全部方法。

**第三轮：验证与边界。** 做一个最小练习，明确预期和能推翻自己解释的结果。分别记录原文报告了什么、自己实际观察了什么、还有哪些没有验证。使用相关随机样本时，不能直接套独立样本的不确定性公式。

每一轮都可以提出问题。“精读完成”至少意味着你能解释核心问题、对象、关键推导与条件；“复现完成”还需要说明复现范围、代码、数据、配置和结果。一页导读或一个玩具例子不能自动获得这两个状态。

## 5. 引用影响与版本：怎样理解“经典、高被引”

筛选优先考虑概念的通用性、后续方法的连接和公开可读性，再参考引用影响。这里没有做全领域穷尽检索，不能声称“全球引用最高八篇”，也不能用引用量代替正确性判断。

部分原始记录已取得 SciSpace 引用快照，例如 Metropolis 等 1953 年原始 DOI 对应记录为 **39,811 次**，查阅于 **2026-10-15**；数据库可能有更新延迟。[SciSpace 对应作品记录](https://scispace.com/papers/equation-of-state-calculations-by-fast-computing-machines-3uajhlns3j)提供可追溯入口。其他可靠计数在单篇详情列出，未确认的保留“待核验”。**目前没有得到覆盖八篇、版本一致的统一引用计量表。**

计数是索引对某条作品记录的引用总量，不是排除自引后的严格他引。不同数据库、扫描版、选集重印和预印本可能分裂或合并，不能简单相加：

- Shannon 的 1948 年原文分为 July 和 October 两部分，拥有两个 DOI；1949 年相关书籍另属一个版本。
- Kalman 的 1960 年原始期刊文章与后来选集重印章不是同一个 DOI；重印章计数不移植到原文。
- 同名 Q-learning 记录也需要按作者、年份、期刊和 DOI 核对。

具体书目信息与原文入口核验于 2026-10-15，正式出版页优先用于确认年份与卷页，作者或机构公开稿用于阅读。无法取得的计量数据不填零。

## 6. 原文入口与参考文献文件

以下均为出版、作者、机构或历史档案的公开入口。本站提供原创导读，不把论文全文打包转载。

1. **Karl Pearson (1901).** *LIII. On lines and planes of closest fit to systems of points in space.* Philosophical Magazine, 2(11), 559–572。[DOI](https://doi.org/10.1080/14786440109462720) · [Zenodo 历史扫描](https://zenodo.org/records/1430636)。
2. **Claude E. Shannon (1948).** *A Mathematical Theory of Communication.* Bell System Technical Journal, 27, 379–423、623–656。[July DOI](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x) · [October DOI](https://doi.org/10.1002/j.1538-7305.1948.tb00917.x) · [MIT 完整重印 PDF](https://web.mit.edu/6.976/www/handout/shannon.pdf)。
3. **Herbert Robbins & Sutton Monro (1951).** *A Stochastic Approximation Method.* Annals of Mathematical Statistics, 22(3), 400–407。[DOI](https://doi.org/10.1214/aoms/1177729586) · [Columbia 公开 PDF](https://www.columbia.edu/~ww2040/8100F16/RM51.pdf)。
4. **Nicholas Metropolis, Arianna W. Rosenbluth, Marshall N. Rosenbluth, Augusta H. Teller & Edward Teller (1953).** *Equation of State Calculations by Fast Computing Machines.* Journal of Chemical Physics, 21(6), 1087–1092。[DOI](https://doi.org/10.1063/1.1699114) · [UMass 公开 PDF](https://people.umass.edu/bvs/The_1953_paper.pdf)。
5. **R. E. Kalman (1960).** *A New Approach to Linear Filtering and Prediction Problems.* Journal of Basic Engineering, 82(1), 35–45。[原始 DOI](https://doi.org/10.1115/1.3662552) · [选读和机构公开版本说明](/digest/foundation-kalman/)。
6. **David E. Rumelhart, Geoffrey E. Hinton & Ronald J. Williams (1986).** *Learning representations by back-propagating errors.* Nature, 323, 533–536。[Nature 正式页](https://www.nature.com/articles/323533a0) · [作者公开 PDF](https://www.cs.toronto.edu/~hinton/absps/naturebp.pdf)。
7. **Christopher J. C. H. Watkins & Peter Dayan (1992).** *Q-learning.* Machine Learning, 8, 279–292。[原始 DOI](https://doi.org/10.1007/BF00992698) · [作者公开 PDF](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf)。
8. **Oussama Khatib (1987).** *A Unified Approach for Motion and Force Control of Robot Manipulators: The Operational Space Formulation.* IEEE Journal of Robotics and Automation, RA-3(1), 43–53。[DOI](https://doi.org/10.1109/JRA.1987.1087068) · [Stanford 作者 PDF](https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf)。

[下载 BibTeX 参考文献](/research-foundations/references.bib)：共八项工作、九条记录，Shannon 两部分分别列出；这是文献元数据，不包含论文全文。

## 7. 第一篇基础阅读笔记可以这样写

先从已经满足先修的某一节开始，沿用以下小模板：

~~~text
论文、版本、阅读日期：
当前状态：浏览 / 选读中 / 推导中 / 验证中 / 待复测
本次只读：具体章节、页码或公式
作者的问题，用两句话表达：
我已会的先修：
还不会的概念：
关键公式：每个符号、维度、单位、假设
我的手算例子：
实际验证：未做就写“未做”，不填写预计结果当实测
原文结果与自己的解释分别是什么：
适用边界或一个反例：
下一次只解决的一个问题：
~~~

如果看不懂，可以把这份笔记中的一个卡点交回来。后续补充讲义、图示和练习时，就能精确回到知识链的缺口。你的原始作答、阅读状态与实际结果只保存在本地私有学习记录中；公开内容使用独立教学例子，不自动展示个人成果。

[开始第00章](/notes/foundations-00-math-language/) · [章节与40周阅读路径](/notes/foundations-course-index/) · [Paper Digest基础条目](/digest/?topic=Foundations)
