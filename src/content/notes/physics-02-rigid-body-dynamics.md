---
title: 'P02 · 刚体动力学：姿态、转动惯量与力矩'
description: '从质量分布解释转动惯量，先建立力矩和角动量，再为分析力学准备一个单摆模型。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 2
readTime: 23
chapters: 7
demo: false
draft: false
---

先修：[P01 · 物理模型](/notes/physics-01-physical-models/)、[26 · Jacobian](/notes/foundations-26-jacobians/)、[56 · 牛顿与冲量](/notes/foundations-56-newton-momentum/)、[57 · 功与能](/notes/foundations-57-work-energy/)。三维坐标约定可补读 [R01 · 坐标系与旋转](/notes/robotics-01-frames-rotations/)，本章单摆推导不依赖其未说明的符号。

[方向总入口](/notes/direction-foundations/) · [上一章：P01 · 物理模型：系统边界、状态与约束](/notes/physics-01-physical-models/) · [下一章：P03 · Lagrange 动力学：从能量到广义力](/notes/physics-09-lagrangian-dynamics/)

## 1. 本章问题：同样重的物体为什么不一样好转

平动质量相同的细杆与小球，绕同一点转动时并不具有相同惯性。刚体的假设是各材料点之间距离保持不变；刚体仍能平移和转动。质心位置 $x\in\mathbb R^3$ 单位米，姿态矩阵 $R\in\mathbb R^{3\times3}$ 满足 $R^TR=I,\det R=1$，将本体坐标向量转为世界坐标。角速度 $\omega\in\mathbb R^3$ 单位弧度每秒，方向按右手规则。

三维转动并不是三个彼此独立的平移。姿态有三个自由度，却可用九个带约束的矩阵元素或四个带单位范数约束的四元数表示；姿态参数的时间导数不能直接当角速度。下文先用固定轴角度 $\theta$，此时才有标量 $\omega=\dot\theta$。

## 2. 从质量分布得到转动惯量

以质心为原点，材料点位置为 $r$，单位米，质量微元为 $dm$。纯转动的点速度是 $\omega\times r$，所以

$$
T_{\rm rot}=\frac12\int\|\omega\times r\|^2dm
=\frac12\omega^TI\omega,
$$
$$
I=\int(\|r\|^2I_3-rr^T)dm.
$$

其中 $I_3$ 是单位矩阵，$I$ 是 $3\times3$ 惯量张量，单位 $\mathrm{kg\,m^2}$。叉积恒等式 $\|\omega\times r\|^2=\|\omega\|^2\|r\|^2-(\omega^Tr)^2$ 给出第二步。质量离转轴越远，对该轴惯量的贡献越大。

惯量和角速度必须在同一坐标系表示。本体系惯量为常数 $I_b$，世界系为 $I_w=RI_bR^T$。在随刚体转动的本体系，角动量方程为

$$
\tau_b=I_b\dot\omega_b+\omega_b\times(I_b\omega_b).
$$

力矩 $\tau_b$ 单位牛顿米；第二项来自坐标系自身转动。固定单轴且该轴为主轴时，这一交叉项为零，才可化为 $\tau=I\ddot\theta$。把该标量公式直接用于任意三维运动会遗漏陀螺项。

## 3. 单摆：用一个坐标消去杆长约束

取质量 $m$ 集中于无质量刚杆末端，杆长 $\ell$，转轴固定且无摩擦。$\theta=0$ 指竖直向下，逆时针为正。末端平面位置为 $(\ell\sin\theta,-\ell\cos\theta)$；求导后速率平方为 $\ell^2\dot\theta^2$。因此

$$
T=\tfrac12m\ell^2\dot\theta^2,\quad V=mg\ell(1-\cos\theta),\quad L=T-V.
$$

$L$ 称 Lagrangian，单位焦耳。对理想固定轴约束，Lagrange 方程为 $d(\partial L/\partial\dot\theta)/dt-\partial L/\partial\theta=\tau$。逐项计算：前项为 $m\ell^2\ddot\theta$，后项为 $-mg\ell\sin\theta$，得到

$$
m\ell^2\ddot\theta+mg\ell\sin\theta=\tau.
$$

这里的 $\tau$ 是施加在转轴上的驱动力矩。杆约束力无需作为未知量出现在这个方程中，因为位置参数化已经保证杆长不变；若要求杆张力，还需恢复沿杆方向的力平衡。Lagrange 方程本身是此处使用的力学原理，并非只由链式法则证明。

多关节形式通常为 $M(q)\ddot q+c(q,\dot q)+g(q)=\tau$。$M$ 的形状为自由度数乘自由度数；包含平移和转动坐标时不同块的单位不同。关于动能与质量矩阵的对应可参照 [Modern Robotics 作者教材 §8.1.3](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-1-3-understanding-the-mass-matrix/)。

## 4. 手算与两个独立核验

取 $m=2\,\mathrm{kg},\ell=0.5\,\mathrm m,g=10\,\mathrm{m/s^2}$，$\theta=\pi/6,\dot\theta=0,\tau=0$。惯量 $I=m\ell^2=0.5\,\mathrm{kg\,m^2}$；重力矩为 $-mg\ell\sin\theta=-5\,\mathrm{N\,m}$，故 $\ddot\theta=-5/0.5=-10\,\mathrm{rad/s^2}$。负号表示向最低点加速。

核验一：直接计算位置叉重力。$r_x=0.25\,\mathrm m,F_y=-20\,\mathrm N$，平面力矩 $r_xF_y-r_yF_x=-5\,\mathrm{N\,m}$，符号和大小一致。核验二：将方程乘 $\dot\theta$，得到 $d(T+V)/dt=\tau\dot\theta$；无驱动时连续机械能守恒。此时初始能量为 $10(1-\sqrt3/2)\approx1.339746\,\mathrm J$。

若改为相同质量、长度的均匀细杆，绕端点惯量为 $m\ell^2/3$，质心距轴 $\ell/2$；重力势能和转动惯量都改变。只换惯量而保留末端点质量势能，是两个模型的混搭。

## 5. 可复现实验与边界

先用计算器复算上例。再取 $\theta=0,\pi/6,\pi/2$，分别比较精确角加速度 $-(g/\ell)\sin\theta$ 与小角近似 $-(g/\ell)\theta$，报告绝对误差。最后在无驱动时检查能量公式的导数是否为零，而不是通过修改轨迹人为保证能量恒定。

小角近似只在角度足够小时适用；例如$\pi/2$时$\sin\theta=1$与$\theta\approx1.571$差别明显。无质量杆、集中质量、固定转轴也是模型假设。真实柔性杆、转轴摩擦和电机转子惯量需要额外项。本章先给模型入口，下一章展开Lagrange推导，随后在[时间积分](/notes/physics-03-time-integration/)设计离散核验；未声称已运行完整摆仿真。

## 6. 独立自测与步骤答案

1. 轴上有两个 $1\,\mathrm{kg}$ 质点，离轴距离分别为 $0.2,0.4\,\mathrm m$。固定轴惯量多少？
2. 上节单摆若加 $+2\,\mathrm{N\,m}$ 力矩，瞬时角加速度是多少？
3. 无驱动但存在力矩 $-b\dot\theta$ 时，总机械能导数是什么？

答案1：逐点求 $mr^2$ 后相加，$I=0.04+0.16=0.20\,\mathrm{kg\,m^2}$。距离必须平方，不能用总质量乘平均距离。

答案2：净力矩为 $2-5=-3\,\mathrm{N\,m}$；除以惯量 $0.5$，得 $-6\,\mathrm{rad/s^2}$。

答案3：将运动方程乘 $\dot\theta$，左边为 $\dot E$，右边为 $-b\dot\theta^2\le0$。$b$ 单位为牛顿米秒每弧度；耗散不是数值错误。

## 7. 出口：从连续力学进入计算

能够区分质量与惯量、用力矩检查符号后，进入 [P03 · Lagrange 动力学](/notes/physics-09-lagrangian-dynamics/)，在那里把本章单摆预览展开为广义坐标与多自由度推导。连续守恒不等于离散算法守恒，稍后还要单独检查时间积分。
