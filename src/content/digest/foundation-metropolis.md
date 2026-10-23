---
title: 'Metropolis 等 1953：为什么采样可以接受更差的候选'
description: '基础导读：从对称提议的接受与拒绝开始，理解相关采样及为什么拒绝后仍须记录当前状态。'
date: '2026-10-15'
tags: ['Foundations', 'Probability', 'Statistical Physics', 'Numerical Methods']
demo: false
draft: false
curated: true
foundationOrder: 4
originalTitle: 'Equation of State Calculations by Fast Computing Machines'
authors: 'Nicholas Metropolis; Arianna W. Rosenbluth; Marshall N. Rosenbluth; Augusta H. Teller; Edward Teller'
lab: '以原文首页署名为准'
venue: 'The Journal of Chemical Physics'
year: 1953
rating: 'must-read'
stars: 5
method: '对称提议新配置，按目标权重比接受候选，拒绝时保留旧配置，用相关样本估计平均。'
verdict: '先分清目标分布、提议分布与接受规则；接受率本身不能证明已经充分采样。'
readTime: 6
week: '2026-W42'
originalUrl: 'https://doi.org/10.1063/1.1699114'
related: ['foundation-shannon', 'foundation-robbins-monro']
citations:
  count: 39811
  source: 'SciSpace'
  url: 'https://scispace.com/papers/equation-of-state-calculations-by-fast-computing-machines-3uajhlns3j'
  accessed: '2026-10-15'
---

**状态：已提供基础导读；个人阅读、推导与验证进度私下保存。引用量尚未统一核验。** 本页只安排有限选读。整体次序见[公共基础路线](/notes/research-foundations-roadmap/)，阅读产物与自测方法见[基础论文阅读入口](/notes/foundations-paper-reading/)。

## 从什么问题出发

物理系统的可能配置很多，逐个列举并计算平均往往不可行。能否通过一连串局部随机移动，逐步取得符合目标权重的样本，再估计平均量？这篇论文提供了理解相关采样的历史入口。它的物理背景可以在公共概率基础之后作为例子学习，不要求先选择物理研究方向。

读前先掌握概率密度、积分与期望、条件概率、马尔可夫链。对应[第36章随机变量](/notes/foundations-36-random-variables/)、[第37章期望](/notes/foundations-37-expectation-variance/)与[第53章Markov链](/notes/foundations-53-markov-chains/)；连续状态链的一般理论需进一步学习。如果要逐行追踪物理部分，还需补能量、温度与Boltzmann分布。本页的标准正态例子是现代教学改写，不是原文的二维粒子实验。

## 核心概念：对称提议与接受概率

用对称随机游走提议采样标准正态时，可以写成：

$$
\alpha(x,x')=\min\!\left(1,\frac{\pi(x')}{\pi(x)}\right)
=\min\!\left(1,\exp\!\left[-\frac{x'^2-x^2}{2}\right]\right).
$$

$x$ 是当前状态，$x'$ 是新提议，$\pi$ 是目标标准正态密度，$\alpha$ 是接受概率，$\min$ 取两个数的较小者，$\exp$ 是自然指数函数。比例中的共同归一化常数相消。对称提议是指正反向提议的密度相同，例如 $x'=x+\delta$ 且 $\delta$ 在 $[-s,s]$ 上均匀分布，$s>0$ 是提议尺度。

生成独立的均匀随机数 $u\in[0,1]$，若 $u<\alpha$ 则接受 $x'$，否则下一状态仍为 $x$。目标密度较低的候选并非总被拒绝。这种移动用于构造采样过程，不能直接解释成一个总想减小损失的优化器。

## 原文先读哪里

先读 **§I Introduction**，重点读 **§II The General Method for an Arbitrary Potential Between the Particles** 中“提出新配置—接受或拒绝—拒绝后保留旧配置”的步骤。先整理完整的一次更新，不要求立即追完物理推导。§III 的二维刚性粒子结果留给统计物理拓展。

## 最小验证：把拒绝也写进轨迹

从 $x=0$ 提议 $x'=2$，接受概率为 $e^{-2}\approx0.1353$。若 $u=0.2$，应拒绝，记录的下一状态还是 **0**。再次从 0 提议 2，若 $u=0.1$，应接受，记录 **2**。随后从 2 提议 1，接受概率为 **1**，因此记录 **1**。三次更新后的轨迹为 **0、0、2、1**，含初始状态。

请独立计算三次提议各自的接受概率，并故意对比“只记录接受状态”的轨迹。后者把停留次数丢掉，通常会改变所估计的分布。这组指定候选与随机数是检查更新逻辑的手算任务，不代表随机数发生器的一次实际运行，实际作答与验证结果另行私存。

可选编程拓展：取 $s=1$，运行 20,000 步，暂去掉前 2,000 步作为初始诊断，检查样本均值、方差和自相关。充分探索时均值与方差应接近 0 和 1；这些步数本身不保证混合充分，应比较多次运行与不同提议尺度。

## 边界与原始资料

上述简单权重比依赖**对称提议**；一般非对称提议需要额外校正，属于后来的 Metropolis–Hastings 形式。详细平衡可用于核验目标分布的不变性，但有限时间逼近还要检查可达性、周期性与混合。样本存在相关性，不能直接按同数量的独立样本估计误差。

正式书目为 **21(6), 1087–1092 (1953)**，五位作者与顺序见上方元数据。[AIP 原始 DOI](https://doi.org/10.1063/1.1699114) 用于核对出版信息；[UMass 机构公开 PDF](https://people.umass.edu/bvs/The_1953_paper.pdf) 用于阅读原文。完成后分享自己的状态轨迹、诊断图和未解决问题，而不把一条好看的直方图当成普遍正确性证明。

影响记录补充：2026-10-15 读取的 [SciSpace 原始 DOI 对应记录](https://scispace.com/papers/equation-of-state-calculations-by-fast-computing-machines-3uajhlns3j) 返回引用数 **39,811**。这是该数据库的记录计数，未执行排除自引审计；其他经典条目的统一口径仍待核验，不能据此组成跨库排名。
