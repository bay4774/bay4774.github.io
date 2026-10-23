---
title: 'Shannon 1948：给离散不确定性一个可计算的尺度'
description: '基础导读：从离散熵与四符号前缀码开始，区分信源、编码和信道，并找到两部分原始论文。'
date: '2026-10-15'
tags: ['Foundations', 'Probability', 'Information Theory']
demo: false
draft: false
curated: true
foundationOrder: 2
originalTitle: 'A Mathematical Theory of Communication'
authors: 'Claude E. Shannon'
lab: '以原文首页署名为准'
venue: 'Bell System Technical Journal'
year: 1948
rating: 'must-read'
stars: 5
method: '从离散事件的概率构造熵，并在信源、编码与信道的模型中讨论信息传输限制。'
verdict: '先把概率与编码算清楚，再使用信息一词；信息量不直接代表语义价值。'
readTime: 6
week: '2026-W42'
originalUrl: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x'
related: ['foundation-pca', 'foundation-metropolis']
---

**状态：已提供基础导读；个人阅读、推导与验证进度私下保存。引用量尚未统一核验。** 本页只安排有限选读。先修与进度记录分别见[公共基础路线](/notes/research-foundations-roadmap/)和[基础论文阅读入口](/notes/foundations-paper-reading/)。

## 从什么问题出发

知道一个符号必定出现，与不知道下一次会出现哪个符号，显然有不同的不确定性。怎样用一个数描述这种差别，并进一步讨论需要多少编码长度、信道能传多少信息？Shannon 的论文把这些问题放进明确的通信模型中。

读前先掌握离散概率分布、对数、期望、联合概率、条件概率与独立性。对应[第34章条件概率](/notes/foundations-34-conditional-probability/)、[第36章分布](/notes/foundations-36-random-variables/)与[第37章期望](/notes/foundations-37-expectation-variance/)。能认出公式还不够，应能解释概率之和为什么等于1；先浏览问题设置，再用离散熵选读连接这些概念。

## 核心概念：离散熵

对有 $m$ 种可能取值的离散随机变量，定义：

$$
H(X)=-\sum_{i=1}^{m}p_i\log_2p_i.
$$

$X$ 是随机变量，$i$ 编号其可能取值，$m$ 是取值数量，$p_i$ 是第 $i$ 种取值的概率，满足 $p_i\ge0$ 且总和为 1。$\sum$ 表示求和，$\log_2$ 是以 2 为底的对数，$H(X)$ 的单位为 bit。对 $p_i=0$，约定该项 $0\log_2 0=0$，与相应极限一致。

它也是“出现一个结果时，其 $-\log_2p_i$ 的平均值”。确定结果的熵为 0；公平二元结果的熵为 1 bit。不要把一次事件的信息量与整个分布的平均不确定性混为一谈。

## 原文先读哪里

先读 **Introduction、§2 The Discrete Source of Information、§3 The Series of Approximations to English、§6 Choice, Uncertainty and Entropy**。一轮阅读只记录信源是什么、概率由谁给定、熵在衡量哪个随机量。§7、离散有噪声信道与编码定理的假设和证明留给第二轮；连续信号部分不在此次范围内。

## 最小验证：算熵，再算一个码

取四符号概率 $(1/2,1/4,1/8,1/8)$，其信息量分别为 $1,2,3,3$ bit。加权平均为 $0.5+0.5+0.375+0.375=\mathbf{1.75}$ bit。

为四个符号依次分配码字 **0、10、110、111**。检查没有一个完整码字是另一个码字的前缀，因此从左到右可以唯一解码；平均码长同样为 **1.75 bit/符号**。请自己编码任意六个符号、再解码，并把四项加权计算完整写出。这是一个可手算的特例，不是声称任意分布都能用单符号码恰好达到熵；目前仍为待完成任务。

若继续编程，可画二元熵曲线，正确预期是两端为 0、在 $p=1/2$ 处为 1。程序应单独处理端点，避免直接计算数值上的 $\log 0$。

## 适用边界与资料

熵描述给定概率模型下的不确定性，不直接衡量意义、真实性或科研价值。把编码极限应用到具体信源和信道时，必须检查相应模型与定理条件；单次编码例子也不能替代一般证明。后续再比较熵、条件熵与互信息。

原论文于 **1948 年分两部分**刊于 **27(3), 379–423** 与 **27(4), 623–656**。[July 部分 DOI](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x)、[October 部分 DOI](https://doi.org/10.1002/j.1538-7305.1948.tb00917.x) 分别对应原始两部分；[MIT 公开完整重印 PDF](https://web.mit.edu/6.976/www/handout/shannon.pdf) 便于连贯阅读。不要与 1949 年书籍版本混为同一书目记录，也不要简单相加不同记录的引用数。
