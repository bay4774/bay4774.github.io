---
title: 'P10 · 增广 Lagrange：让乘子记住约束违规'
description: '通过逐轮可手算的一维等式问题理解乘子更新、内外迭代与收敛条件。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 10
readTime: 21
chapters: 7
demo: false
draft: false
---

先修：[P08 · 硬约束与惩罚](/notes/physics-06-constraint-optimization/)、[31 · Lagrange 乘子](/notes/foundations-31-lagrange-multipliers/)、[70 · 凸性](/notes/foundations-70-convexity-smoothness/)。

[方向总入口](/notes/direction-foundations/) · [上一章：P09 · 约束什么时候起作用：不等式KKT与互补](/notes/physics-13-inequality-kkt/) · [下一章：P11 · 物理信息学习：方程残差与初边值](/notes/physics-07-physics-informed-learning/)

## 1. 本章问题：除了不断加大惩罚，还有什么信息可用

二次惩罚只看当前违规量，有限权重下可能一直偏离可行集。乘子法增加一个随迭代变化的变量，用持续违规更新约束施加的线性代价。本章只推导光滑等式约束，避免把不等式投影、接触模式和多块 ADMM 混在一起。

目标是 $\min_x f(x)$，满足 $c(x)=0$；$x\in\mathbb R^d,c\in\mathbb R^r$。采用无量纲变量。普通 Lagrangian 为 $L(x,\lambda)=f(x)+\lambda^Tc(x)$，其中 $\lambda\in\mathbb R^r$。符号约定若改为减号，乘子更新也必须随之改变。

## 2. 从 KKT 到增广项

在适当约束资格条件下，等式约束局部最优点满足 $\nabla f(x)+J(x)^T\lambda=0,c(x)=0$，其中 $J=\partial c/\partial x$。加入二次项得

$$
L_\rho(x,\lambda)=f(x)+\lambda^Tc(x)+\tfrac\rho2\|c(x)\|^2,\quad \rho>0.
$$

在可行点二次项及其梯度都为零，所以不会改变可行点处的 KKT 站立条件；它改变的是不可行区域的子问题形状。最基本的乘子法迭代为

$$
x^{k+1}\approx\arg\min_x L_\rho(x,\lambda^k),\qquad
\lambda^{k+1}=\lambda^k+\rho c(x^{k+1}).
$$

先求 $x$，再用新违规量更新乘子；二者不是同时对普通损失做梯度下降。子问题若仅近似求解，需要记录站立残差，不能把一次随意梯度步当精确最小化。原理入口见 [Boyd 等作者论文 §2.2 增广 Lagrangian](https://web.stanford.edu/~boyd/papers/pdf/admm_distr_stats.pdf)。该文还讨论 ADMM，但本章未推导其分块更新。

## 3. 完整手算：三轮都保留中间值

仍取 $f(x)=\tfrac12(x-2)^2,c(x)=x-1$，硬解 $x^*=1$。KKT 条件为 $(x-2)+\lambda=0,x-1=0$，所以 $\lambda^*=1$。

固定 $\rho=1,\lambda^0=0$。子问题导数为 $(x-2)+\lambda^k+(x-1)=0$，故 $x^{k+1}=(3-\lambda^k)/2$。第一轮 $x^1=1.5,c=0.5,\lambda^1=0.5$；第二轮 $x^2=1.25,c=0.25,\lambda^2=0.75$；第三轮 $x^3=1.125,c=0.125,\lambda^3=0.875$。

核验一般递推：$\lambda^{k+1}=\lambda^k+(1-\lambda^k)/2=(1+\lambda^k)/2$。于是 $\lambda^k=1-2^{-k}$，$x^{k+1}-1=2^{-(k+1)}$。这证明了本一维、精确内层求解的小例收敛；不是对任意神经网络约束问题的全局保证。

第3轮的子问题站立残差为 $(1.125-2)+0.75+(1.125-1)=0$；硬约束残差仍为0.125。内层已经解对、外层尚未可行，两件事可同时成立。

## 4. 乘子表示什么，不能表示什么

在满足正规性、且解随约束右端平滑变化的条件下，乘子可描述最优目标对约束阈值的局部敏感性。物理动力学中某些乘子对应约束反力；但在任意损失和无量纲化之后，乘子不自动具有牛顿单位。不能看到数值 $\lambda=1$ 就称其为1牛顿。

若把约束改成 $100c$，乘子尺度也改变，二次项更改变一万倍。若目标非凸、约束不一致或内层未充分求解，乘子可能振荡、增大而不改善可行性。增加外层轮数不能修复不存在的可行解。

## 5. 可复现实验：同时画三条残差

按上例做10轮，记录 $x^k,\lambda^k,f(x^k),|c(x^k)|$，逐轮与闭式递推比较。然后将子问题改为每轮仅做一次梯度步，保留不同步长，记录内层站立残差，观察它与外层违规量不再完全一致。

再构造不一致条件 $c_1=x-1=0,c_2=x-2=0$。任何实数都不能同时满足，应先报告不可行性。最后将 $\rho$ 改为0.5和2，分析精确子问题的递推变化；不以“最大权重结果最好”作为实验预设。

## 6. 独立自测与步骤答案

1. 主例第4轮的 $x^4,\lambda^4$ 是多少？
2. 为何不能让 $x$ 与 $\lambda$ 都对 $L_\rho$ 做下降？
3. $c(x)=0$ 时，增广项是否改变目标值？

答案1：用 $\lambda^3=0.875$，得 $x^4=(3-0.875)/2=1.0625$；再更新 $\lambda^4=0.875+0.0625=0.9375$。

答案2：等式乘子用于推动约束满足，基本更新对乘子是加上违规量；盲目下降会把线性乘子项往相反方向驱动，甚至无界。应从所用算法推导更新符号。

答案3：不改变，线性与二次约束项都为零；但离开可行集后的子问题曲率与优化路径已经改变。

## 7. 出口：把算法层次写进记录

能说明内层求解、外层乘子更新和可行性检查的不同任务后，进入 [P11](/notes/physics-07-physics-informed-learning/)。物理残差学习常从软惩罚开始，也必须继承这些尺度和可行性边界。
