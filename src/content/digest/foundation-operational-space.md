---
title: '操作空间：怎样把末端任务连接到关节力矩'
description: '用虚功与 Jacobian 理解任务空间控制的入口，作为数学、物理与控制的选修桥梁。'
date: '2026-10-15'
tags: ['Foundations', 'Domain Bridge', 'Mechanics', 'Control', 'Robotics']
demo: false
draft: false
curated: true
foundationOrder: 8
originalTitle: 'A Unified Approach for Motion and Force Control of Robot Manipulators: The Operational Space Formulation'
authors: 'Oussama Khatib'
lab: 'Artificial Intelligence Laboratory, Computer Science Department, Stanford University（原文首页）'
venue: 'IEEE Journal of Robotics and Automation, RA-3(1): 43–53'
year: 1987
rating: 'must-read'
stars: 5
method: '在任务所在的末端空间建立动力学与控制，并把操作空间力映射为关节力矩。'
verdict: '先验证虚功与力矩映射，再讨论任务空间惯性和闭环控制。'
readTime: 8
week: '2026-W42'
originalUrl: 'https://doi.org/10.1109/JRA.1987.1087068'
related: ['foundation-kalman']
citations:
  count: 3138
  source: 'SciSpace'
  url: 'https://scispace.com/papers/a-unified-approach-for-motion-and-force-control-of-robot-1a8rqzyth0'
  accessed: '2026-10-15'
---

本文是**控制/机器人选修的基础导引**。个人逐段阅读与验证进度私存，以下练习不表示已经完成复现。请按[科研基础总路线](/notes/research-foundations-roadmap/)先学习共同主干，再用[论文阅读方法](/notes/foundations-paper-reading/)记录分支问题。

## 先带着一个问题读

任务通常描述为“让机械臂末端往某方向移动或施加某个力”，执行器却位于各个关节。末端要求怎样变成关节力矩？Khatib 的操作空间框架直接围绕末端任务组织动力学与控制。[Stanford 作者原文](https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf)

先修包括[矩阵映射](/notes/foundations-05-matrices-maps/)、[Jacobian](/notes/foundations-26-jacobians/)、虚功、Euler–Lagrange方程和基础反馈控制。后面三项需要方向补课；若还不能解释速度映射$\dot x=J(q)\dot q$，先完成运动学小练习，暂缓整篇动力学推导。

## 先掌握力的映射

采用仅包含平移任务的简化记号：

$$
\tau=J(q)^{\mathsf T}F.
$$

$q$ 是关节坐标，$x(q)$ 是末端位置，$J(q)=\partial x/\partial q$ 是 Jacobian，$F$ 是末端作用力，$\tau$ 是对应广义关节力/力矩。该式来自虚功相等：$F^{\mathsf T}\delta x=\tau^{\mathsf T}\delta q$，以及局部位移关系 $\delta x=J\delta q$。

若加入旋转，末端速度与力矩必须使用一致的广义速度和 wrench 约定。该力映射本身不要求把 Jacobian 取逆；完整操作空间动力学中的某些逆矩阵与解耦推导，则需要相应的秩等条件。仅会乘 $J^{\mathsf T}$ 还不能声称掌握整个控制框架。[正式 DOI](https://doi.org/10.1109/JRA.1987.1087068)

## 原文选读位置

第一轮读摘要与 Introduction，然后找末端/关节运动关系、广义力关系，以及 §IV End-Effector Motion Control。把每个变量的维度写在公式旁边。第二轮再读操作空间惯性、冗余机械臂、奇异位形及混合运动/力控制；这些需要更完整的分析力学和控制基础。

## 平面二连杆最小实验

取两段杆长均为 $1\,\mathrm m$，两关节为平面转动关节、角度用弧度。以米为位置单位，坐标数值为 $x(q)=(\cos q_1+\cos(q_1+q_2),\sin q_1+\sin(q_1+q_2))$，据此求 Jacobian。在 $q=(0,\pi/2)$、$F=(1,0)\,\mathrm N$ 时，应得到 Jacobian 数值 $J=[[-1,-1],[1,0]]$、关节力矩 $\tau=(-1,-1)\,\mathrm{N\,m}$。

选小角位移 $\delta q=(0.01,0.02)$ 弧度，用线性近似得到 $\delta x=(-0.03,0.01)\,\mathrm m$，两侧虚功都为 $-0.03\,\mathrm J$。再缩小位移，用真实位置差与 Jacobian 近似比较，预期一阶近似误差随步长缩小。

随后扫描构型并记录 $J$ 的最小奇异值，观察伸直位形附近的退化。保存推导、维度检查和图；这只验证局部运动/力映射，尚不是原文完整控制算法复现。

## 适用边界

接近奇异位形时某些任务方向难以实现，不能靠对小奇异值无条件求逆解决。真实系统还存在模型误差、执行器限制、离散采样与接触条件；数学上得出的力矩并不自动可执行。研究方向未确定时，本篇用于展示“数学—物理—控制”如何连接，无需作为所有科研方向的先修。

作者、卷页与年份经[Stanford 书目](https://www-cs-faculty.stanford.edu/groups/manips/publications.html)和原文首页核对。引用卡片为 SciSpace 对 **DOI 10.1109/JRA.1987.1087068** 的记录，访问日为 2026-10-15；3,138 是该库返回的总计数，可能延迟更新，不与其他库相加，不是严格他引数。
