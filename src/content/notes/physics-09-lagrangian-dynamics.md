---
title: 'P03 · Lagrange 动力学：从能量到广义力'
description: '用完整的单摆和两坐标例子解释广义坐标、虚功、质量矩阵及理想约束。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 3
readTime: 27
chapters: 7
demo: false
draft: false
---

先修：[P02 · 刚体动力学](/notes/physics-02-rigid-body-dynamics/)、[26 · Jacobian](/notes/foundations-26-jacobians/)、[57 · 功与能](/notes/foundations-57-work-energy/)。

[方向总入口](/notes/direction-foundations/) · [上一章：P02 · 刚体动力学：姿态、转动惯量与力矩](/notes/physics-02-rigid-body-dynamics/) · [下一章：P04 · 时间积分：稳定性、能量与步长](/notes/physics-03-time-integration/)

## 1. 本章问题：怎样不逐个求关节反力

上一章预览了单摆方程，这一章解释为什么选一个角度就能替代两个位置加一个杆长条件。广义坐标 $q\in\mathbb R^d$ 是描述允许配置的局部独立参数，不要求每一项都是长度。单摆用 $q=\theta$，滑块用 $q=x$，滑块加摆可用 $q=(x,\theta)^T$。

“局部独立”很关键：坐标可在某些姿态失效，三维旋转也没有一套处处无奇异的三个实数坐标。使用冗余坐标时，应显式保留约束，不能再把所有坐标当独立变量。

## 2. 广义力由功确定，不能凭单位猜

材料点 $r(q)\in\mathbb R^3$，受力 $F\in\mathbb R^3$，小位移 $\delta r=J\delta q$，其中 $J=\partial r/\partial q$ 为 $3\times d$。虚功为

$$
\delta W=F^T\delta r=F^TJ\delta q=(J^TF)^T\delta q.
$$

因此广义力定义为 $Q=J^TF\in\mathbb R^d$。若 $q_i$ 为米，则对应 $Q_i$ 为牛顿；若 $q_i$ 为弧度，对应分量是力矩。多个作用点分别求 $J_a^TF_a$ 再相加。理想约束反力对允许虚位移不做功，所以在独立坐标方程中消失；摩擦约束并不自动满足这个条件。

## 3. 单摆逐步推导：把预览变成可重做的过程

取 $r(\theta)=(\ell\sin\theta,-\ell\cos\theta)$。求导得 $J=(\ell\cos\theta,\ell\sin\theta)^T$，故 $\dot r=J\dot\theta$，$\|\dot r\|^2=\ell^2\dot\theta^2$。令 $T=\tfrac12m\ell^2\dot\theta^2,V=mg\ell(1-\cos\theta)$，则 $L=T-V$。

对固定、理想、完整约束，采用 Lagrange 原理：

$$
\frac{d}{dt}\frac{\partial L}{\partial\dot q_i}-\frac{\partial L}{\partial q_i}=Q_i.
$$

本例 $\partial L/\partial\dot\theta=m\ell^2\dot\theta$，其时间导数为 $m\ell^2\ddot\theta$；$\partial L/\partial\theta=-mg\ell\sin\theta$。所以 $m\ell^2\ddot\theta+mg\ell\sin\theta=\tau$。重力已经进入势能，右侧不可再加一次重力矩，否则会重复计数。

原理的适用条件及多体推导可查 [MIT 作者教材 Multi-Body Dynamics](https://underactuated.mit.edu/multibody.html)；此处只展开有限维机械系统，不将公式无条件推广到耗散材料或非完整约束。

## 4. 两坐标算例：耦合项怎样出现

小车质量 $M$，摆末端质量 $m$，摆长 $\ell$，小车水平位置为 $x$，摆角仍从下垂方向计。末端位置为 $(x+\ell\sin\theta,-\ell\cos\theta)$。展开速率平方得到

$$
T=\tfrac12(M+m)\dot x^2+m\ell\cos\theta\dot x\dot\theta+\tfrac12m\ell^2\dot\theta^2.
$$

将其写为 $\tfrac12\dot q^TM(q)\dot q$，读出

$$
M(q)=\begin{bmatrix}M+m&m\ell\cos\theta\\m\ell\cos\theta&m\ell^2\end{bmatrix}.
$$

仅读出质量矩阵还不够，需要把速度与重力项一起推出。仍取$V=mg\ell(1-\cos\theta)$，小车外力$F$、摆驱动力矩$\tau$。先有$\partial L/\partial\dot x=(M+m)\dot x+m\ell\cos\theta\dot\theta$；对时间求导时，$\cos\theta$也变化，因此

$$
(M+m)\ddot x+m\ell\cos\theta\,\ddot\theta
-m\ell\sin\theta\,\dot\theta^2=F.
$$

对摆角，$\partial L/\partial\dot\theta=m\ell\cos\theta\dot x+m\ell^2\dot\theta$，其时间导数含$-m\ell\sin\theta\dot x\dot\theta$；而$\partial L/\partial\theta=-m\ell\sin\theta\dot x\dot\theta-mg\ell\sin\theta$。相减时两个速度乘积项抵消，剩下

$$
m\ell\cos\theta\,\ddot x+m\ell^2\ddot\theta
+mg\ell\sin\theta=\tau.
$$

这里标量$M$表示车质量，矩阵$M(q)$表示广义质量矩阵，依据自变量和维度区分。上面两式适用于固定杆长、点质量摆和水平无摩擦小车；不能省去速度项后仍用于任意运动姿态。

取 $M=m=1\,\mathrm{kg},\ell=1\,\mathrm m,\theta=0$、静止瞬间。此时重力与速度广义项为零。小车受 $1\,\mathrm N$ 水平力、摆无驱动力矩，方程是 $2\ddot x+\ddot\theta=1,\ddot x+\ddot\theta=0$，其中各数值按对应 SI 单位代入。相减得 $\ddot x=1\,\mathrm{m/s^2},\ddot\theta=-1\,\mathrm{rad/s^2}$。

核验：摆末端水平加速度在该静止姿态为 $\ddot x+\ell\ddot\theta=0$。小车向右运动而摆相对向左倾，符合惯性直觉。非对角项就是这种耦合，不能因两个坐标单位不同而删掉。

## 5. 可复现实验与反例

手工或符号程序依次计算 $r,J,\dot r,T,V$，对单摆重做全部偏导；再对两坐标模型展开平方并从二次型读出质量矩阵。取 $\theta=0,\pi/2$ 检查矩阵的交叉项；用 $\dot q=(1,1)$ 比较直接动能与二次型动能。明确不同坐标分量的单位，避免将矩阵所有元素标成千克。

反例：约束杆长为随时间变化的 $\ell(t)$，则末端速度还含 $\dot\ell$；本章固定杆长动能不再适用。另一个反例是把阻尼塞进保守势能，因阻尼依赖速度且耗散，通常应作为广义非保守力处理。

## 6. 独立自测与步骤答案

1. 单摆末端受水平力 $F_x$，其广义力矩是什么？
2. 上例把 $\theta$ 改为 $\pi/2$，动能质量矩阵的非对角项是多少？是否表示此姿态所有动力学耦合都消失？

答案1：由 $Q=J^TF$ 得 $Q_\theta=\ell F_x\cos\theta$。先算 Jacobian，不能直接写 $\ell F_x$；力臂随角度变化。

答案2：$m\ell\cos(\pi/2)=0$，本姿态的惯量交叉项为零；但速度乘积项含 $\sin\theta$，运动时仍可能耦合，不能只看 $M$ 就断言完整系统解耦。

## 7. 出口：保留一条完整建模链

应能沿“坐标—位置—速度—能量—广义力—方程”重走一个模型，并发现重复计入重力的问题。随后进入 [P04](/notes/physics-03-time-integration/)，研究正确连续方程怎样产生不准确的离散轨迹。
