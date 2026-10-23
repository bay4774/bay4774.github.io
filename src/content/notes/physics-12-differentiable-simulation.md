---
title: 'P13 · 可微模拟：离散轨迹、敏感度与梯度核验'
description: '用两步衰减模拟手推参数梯度，区分连续导数与离散导数，并检查碰撞带来的不可微边界。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 13
readTime: 27
chapters: 7
demo: false
draft: false
---

先修：[P04 · 时间积分](/notes/physics-03-time-integration/)、[P05 · 接触冲量](/notes/physics-04-contact-friction/)、[P11 · 物理信息学习](/notes/physics-07-physics-informed-learning/)、[66 · 有限差分](/notes/foundations-66-finite-differences/)、[74 · 反向求导](/notes/foundations-74-reverse-mode/)。

[方向总入口](/notes/direction-foundations/) · [上一章：P12 · 从时间方程到空间场：热方程、边界与残差](/notes/physics-14-spatial-boundaries/) · [下一章：P14 · 综合实验：单摆、约束残差与失败报告](/notes/physics-08-evaluation/)

## 1. 本章问题：参数变一点，最终状态会怎样变

物理残差学习近似整条函数；可微模拟通常先固定求解器，再对它产生的离散轨迹求导。设状态 $z_n\in\mathbb R^d$、参数 $\theta\in\mathbb R^p$，一步更新为 $z_{n+1}=\Phi_h(z_n,\theta)$。损失可能只看终点，也可能累积整段代价。

“可微”描述计算映射局部可求导，不等于模拟器精确、优化问题凸或接触处处光滑。应先说明导数针对连续物理系统还是针对具体离散程序。

## 2. 敏感度递推与反向传播

定义 $S_n=\partial z_n/\partial\theta\in\mathbb R^{d\times p}$，链式法则给

$$
S_{n+1}=A_nS_n+B_n,\quad A_n=\frac{\partial\Phi_h}{\partial z_n},\quad B_n=\frac{\partial\Phi_h}{\partial\theta}.
$$

若初值与参数无关，$S_0=0$；若初值也由参数决定，则不能置零。对终点损失 $L=\ell(z_N)$，参数梯度为 $S_N^T\nabla_{z_N}\ell$。这叫前向敏感度思路。

当参数多、标量损失少时，可以从终点向后传伴随变量。先在$L=\ell(z_N)$、初值独立于参数的情形，设$a_N=\nabla_{z_N}\ell$，用$a_n=A_n^Ta_{n+1}$，并累积$\nabla_\theta L=\sum_{n=0}^{N-1}B_n^Ta_{n+1}$。这是把同一条链式法则从另一端计算。

若初值也依赖参数，不能遗漏$S_0^Ta_0$。更一般地，若$L=\ell_N(z_N,\theta)+\sum_{n=0}^{N-1}\ell_n(z_n,\theta)$，则

$$
a_N=\partial_{z_N}\ell_N,\qquad
a_n=\partial_{z_n}\ell_n+A_n^Ta_{n+1},
$$

$$
\nabla_\theta L=S_0^Ta_0+
\sum_{n=0}^{N-1}B_n^Ta_{n+1}
+\sum_{n=0}^{N}\partial_\theta\ell_n.
$$

最后一项对$\theta$取偏导时固定状态，表示损失直接依赖参数的路径；状态间接依赖参数的路径已由前两项计算，不能重复相加。每个加数都是$p$维向量。

检验遗漏初值项的后果：取一步$z_1=(1-h\theta)z_0$、$z_0=\theta$、$h=0.1$、$L=z_1$。直接求导为$1-0.2\theta$，在$\theta=1$时为0.8；反向计算$S_0^Ta_0=0.9$、$B_0^Ta_1=-0.1$，和也是0.8。只累积更新式的参数项会错得$-0.1$，甚至反转梯度方向。本章不推导连续伴随法，也不声称不同离散化顺序总给相同梯度。

## 3. 两步完整手算

考虑 $\dot x=-\kappa x$，$x_0=1$，时间已按尺度无量纲化。显式 Euler 步长 $h=0.1$，做两步：$x_1=(1-h\kappa)$，$x_2=(1-h\kappa)^2$。在 $\kappa=1$ 时 $x_1=0.9,x_2=0.81$。

直接求导得到 $\partial x_2/\partial\kappa=-2h(1-h\kappa)=-0.18$。用敏感度递推核验：$A=1-h\kappa=0.9,B_n=-hx_n$；$S_1=-0.1$，$S_2=0.9(-0.1)-0.1(0.9)=-0.18$，两种计算一致。

若目标终点为 $y=0.8$，损失 $L=\tfrac12(x_2-y)^2$，则 $dL/d\kappa=(0.81-0.8)(-0.18)=-0.0018$。小幅增加 $\kappa$ 应先减小损失；这给梯度符号的物理核验。

连续真解在 $T=0.2$ 时为 $e^{-0.2\kappa}$，其参数导数在1处为 $-0.2e^{-0.2}\approx-0.163746$，与离散导数不同。自动微分若返回 $-0.18$，不表示它算错；它对两步 Euler 程序求了正确导数。

## 4. 接触分支为什么改变梯度解释

把穿透修正简化为 $y^+=\max(0,y^-)$。在 $y^->0$ 导数为1，$y^-<0$ 为0，而在零点没有唯一普通导数。参数扰动可能改变“接触还是分离”的分支，因此同一个步长下的有限差分也可能不稳定。

采用平滑近似可得到连续梯度，却改变接触模型；只对固定模式求导则只描述该模式内部的敏感度。真正带碰撞时还可能涉及事件时间变化，不能只跳过速度更新而宣称获得完整物理梯度。接触模型的选择应与 [MuJoCo 官方计算说明](https://mujoco.readthedocs.io/en/stable/computation/index.html)的模型定义逐项核对，不能依据“引擎可微”一句话推断所有边界行为。

## 5. 可复现实验：先核验梯度，再优化参数

对两步程序取 $\epsilon=10^{-2},10^{-4},10^{-6}$，计算中心差分 $[L(\kappa+\epsilon)-L(\kappa-\epsilon)]/(2\epsilon)$，与 $-0.0018$ 比较绝对误差和符号。再把 $h$ 减半、步数加倍以保持 $T=0.2$，比较离散状态和梯度与连续解析值。

随后将终点 $y=0.8$ 固定，从 $\kappa=0.5$ 做少量梯度下降，每次记录状态误差、参数、损失与梯度；不把离散最优参数当成真实系统已识别。最后对 $\max$ 分支在零点两侧各做差分，解释梯度跳变来源。不要把差分步长越小越好当一般规律，浮点相消也会影响检查。

## 6. 独立自测与步骤答案

1. 只做一步、$h=0.2,\kappa=1$ 时，状态和状态对参数导数是多少？
2. 如果初值 $x_0=\kappa$，敏感度 $S_0$ 应是多少？
3. 为什么“参数梯度检查通过”不能证明模拟物理正确？

答案1：$x_1=1-0.2=0.8$，导数 $-0.2$。它与两步终点不同，虽总时间相同，离散程序不同。

答案2：$S_0=dx_0/d\kappa=1$；仍设0会遗漏初值路径。

答案3：它只说明梯度与所实现映射一致；错误的力、单位、接触规则和粗步长程序也可能有完全正确的程序导数。

## 7. 出口：把三类误差分别命名

能区分模型误差、离散误差和求导实现误差，完成一个解析—递推—差分三方核验后，进入 [P14](/notes/physics-08-evaluation/)。综合评价需要同时保留物理、数值和学习目标的证据。
