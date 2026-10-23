---
title: 'Robbins–Monro 1951：只有带噪声观测时如何逐步求根'
description: '基础导读：用一维递推理解随机逼近、步长与噪声，先手算确定性基线，再设计重复实验。'
date: '2026-10-15'
tags: ['Foundations', 'Probability', 'Optimization']
demo: false
draft: false
curated: true
foundationOrder: 3
originalTitle: 'A Stochastic Approximation Method'
authors: 'Herbert Robbins; Sutton Monro'
lab: '以原文首页署名为准'
venue: 'The Annals of Mathematical Statistics'
year: 1951
rating: 'must-read'
stars: 5
method: '根据带噪声的函数响应递推调整输入，以衰减步长组织随机求根。'
verdict: '把方向、步长与噪声分别检查；一条看起来变好的随机轨迹不能替代收敛条件或重复实验。'
readTime: 6
week: '2026-W42'
originalUrl: 'https://doi.org/10.1214/aoms/1177729586'
related: ['foundation-shannon', 'adam', 'foundation-metropolis']
---

**状态：已提供基础导读；个人阅读、推导与验证进度私下保存。引用量尚未统一核验。** 本次是有限选读，阅读计划与记录模板见[公共基础路线](/notes/research-foundations-roadmap/)及[基础论文阅读入口](/notes/foundations-paper-reading/)。

## 从什么问题出发

如果每次试验都只能得到有噪声的响应，怎样调整输入，使平均响应接近目标？例如同一个输入重复测试，结果也会上下波动；求一个精确解析函数的根，此时便不再直接可行。随机逼近提供了一种根据新观测不断调整的思路，与随机优化和在线学习有共同基础。

先修包括[第23章局部近似](/notes/foundations-23-taylor-remainders/)、[第37章期望与方差](/notes/foundations-37-expectation-variance/)，以及数列极限和级数。先用[第73章随机逼近](/notes/foundations-73-stochastic-approximation/)区分随机观测、平均响应与待求根；级数条件在该章做局部说明。原文的一般收敛论证仍需更完整的概率理论，首轮只选问题和线性例，不要求追完证明。

## 核心概念：带反馈的递推

用现代记号写一个目标平均响应为零的版本：

$$
x_{n+1}=x_n-a_nY_n,\qquad
Y_n=M(x_n)+\varepsilon_n.
$$

$n=0,1,2,\ldots$ 是迭代编号，$x_n$ 是当前输入，$Y_n$ 是本次观测，$M(x_n)$ 是平均响应，$\varepsilon_n$ 是噪声，$a_n>0$ 是步长。目标是找到 $M(x_*)=0$ 的根 $x_*$。例如在合适的条件无偏设定下，给定当前输入，噪声的条件期望为零。若原问题目标为非零常数，可先从响应中减去该目标。

减号也依赖响应方向：在目标附近平均响应随输入增加的例子中，正响应提示应减小输入。不能不检查方向就照搬递推，更不能把它视为任意非线性问题的通用收敛保证。

## 原文先读哪里

先看 **§1–§2** 的问题设置，再读 **§3 的递推式 (7) 与步长讨论**，最后浏览 **§4 的分位数估计例子**。把原文的目标响应和本页的零目标记号一一对应。第一轮只整理“假设是什么、结论是哪一种收敛”；完整证明留到补齐概率收敛与级数知识后。

## 最小验证：先去噪，再加噪

先取 $M(x)=2x$、噪声为零、$x_0=1$、$a_n=0.4/(n+1)$。连续手算三次，正确结果是 **$x_1=0.2,x_2=0.12,x_3=0.088$**，目标根为 0。若第一步反而远离 0，先检查是否误用了加号。

随后可令每次噪声独立服从均值 0、方差 1 的正态分布，比较恒定步长 $0.1$、$0.4/(n+1)$ 与 $0.4/(n+1)^2$。每种设置运行 100 次、每次 5,000 步，记录各重复的随机种子，再按同一迭代编号计算 $x_n^2$ 的平均。

在这个线性模型中，恒定步长保留长期噪声波动；平方衰减可能因总调整量有限而停得过早；合适的倒数步长有利于逐渐降低噪声影响。正确预期是统计趋势的差异，不能要求每一条轨迹或每一个时间点都单调改善。这些是教学预期；实际运行结果与完成状态请另行私存。

## 收敛条件与资料

常见步长条件 $\sum_n a_n=\infty$ 与 $\sum_n a_n^2<\infty$，分别保留持续调整的可能，并帮助控制累积噪声；还需要检查平均响应、噪声和迭代稳定性等假设。它们单独不能保证任意目标函数、任意噪声或神经网络训练收敛。

正式书目为 **22(3), 400–407 (1951)**。[DOI](https://doi.org/10.1214/aoms/1177729586) 与 [Project Euclid 正式页](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-22/issue-3/A-Stochastic-Approximation-Method/10.1214/aoms/1177729586.full) 用于核对原始记录；[Columbia 课程公开 PDF](https://www.columbia.edu/~ww2040/8100F16/RM51.pdf) 用于阅读原文。
