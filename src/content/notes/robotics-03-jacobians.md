---
title: 'R03 · 头部如何动、如何受力：Jacobian 与奇异性'
description: '由关节到末端的微分建立速度映射，通过功率推导转置力映射，识别奇异与近奇异姿态。'
date: '2026-10-17'
tags: ['Bionic Robot Head', 'Direction Foundations']
category: 'lecture'
directionTrack: 'robotics'
directionChapter: 3
readTime: 25
chapters: 7
demo: false
draft: false
---

先修：[R02 正逆运动学](/notes/robotics-02-kinematics/)、[26 Jacobian](/notes/foundations-26-jacobians/)、[14 SVD](/notes/foundations-14-svd/)、[57 功与能](/notes/foundations-57-work-energy/)。本章把公共基础中的导数矩阵接到真实的关节速度和转矩上。

## 1. 从有限动作到瞬时动作

设 $q\in\mathbb R^n$ 为转动关节角，单位 rad；$p=f(q)\in\mathbb R^3$ 为某一固定末端点，单位 m。定义位置 Jacobian $J(q)=\partial f/\partial q\in\mathbb R^{3\times n}$，每列表示只动一个关节时该点的瞬时运动方向，单位 m/rad。链式法则给出精确的瞬时关系 $\dot p=J(q)\dot q$。

有限增量 $\Delta p\approx J(q)\Delta q$ 则只是局部一阶近似，步长过大会有曲率误差。姿态也有角速度 Jacobian；把线速度和角速度堆叠成六维量时必须声明排列和坐标系。这里先研究二维位置任务，不能拿位置 Jacobian 去直接控制三个欧拉角。

## 2. 两连杆下颌模型的逐项求导

沿用 R02 的二维两连杆，令 $s_1=\sin q_1$、$c_1=\cos q_1$，$s_{12}=\sin(q_1+q_2)$、$c_{12}=\cos(q_1+q_2)$。这些都是无量纲数。对 $x,y$ 分别求偏导得到

$$
J=\begin{bmatrix}-\ell_1s_1-\ell_2s_{12}&-\ell_2s_{12}\\\ell_1c_1+\ell_2c_{12}&\ell_2c_{12}\end{bmatrix}.
$$

例如第一列第二项来自 $\partial y/\partial q_1$，两根杆的方向都受 $q_1$ 影响；第二列只含第二根杆，因为改变 $q_2$ 不会移动第一根杆末端。这个物理检查能发现漏掉一项的错误。

取 $\ell_1=\ell_2=0.05\,\mathrm m$、$q=(0,\pi/2)$，代入得到 $J=\begin{bmatrix}-0.05&-0.05\\0.05&0\end{bmatrix}\,\mathrm{m/rad}$。若 $\dot q=(0.2,-0.1)^\top\,\mathrm{rad/s}$，第一行给 $-0.01+0.005=-0.005\,\mathrm{m/s}$，第二行给 $0.01\,\mathrm{m/s}$。

## 3. 逆速度与一个完整核验

期望 $v_*=(0,0.005)^\top\,\mathrm{m/s}$。解 $J\dot q=v_*$：第二行 $0.05\dot q_1=0.005$，故 $\dot q_1=0.1\,\mathrm{rad/s}$；第一行 $-0.05(0.1+\dot q_2)=0$，故 $\dot q_2=-0.1\,\mathrm{rad/s}$。代回正好得到期望速度。

还可用 $h=0.01\,\mathrm s$ 做有限增量核验。新角度为 $(0.001,\pi/2-0.001)$，两角和仍为 $\pi/2$；新末端为 $(0.05\cos0.001,0.05\sin0.001+0.05)$。减去原位置 $(0.05,0.05)$ 后除以 $h$，约为 $(-2.5\times10^{-6},0.004999999)^\top\,\mathrm{m/s}$，趋近 $(0,0.005)$。小的横向分量是有限步长曲率，不能因此判 Jacobian 错误。

## 4. 奇异性不是程序异常

计算行列式并合并三角项：$\det J=\ell_1\ell_2(s_{12}c_1-s_1c_{12})=\ell_1\ell_2\sin q_2$。当 $q_2=0$ 或 $\pi$，两杆共线，$J$ 秩下降。以伸直且 $q_1=0$ 为例，$J=\begin{bmatrix}0&0\\0.1&0.05\end{bmatrix}$，任意关节速度都不能产生瞬时 $x$ 速度。这是机构几何限制，换求逆软件不会产生缺失方向。

接近奇异时，小末端速度也可能要求很大关节速度。SVD 中小奇异值表示难以运动的任务方向。实际可用阻尼最小二乘：最小化 $\|J\dot q-v_*\|^2+\lambda^2\|\dot q\|^2$，求导得 $(J^\top J+\lambda^2I)\dot q=J^\top v_*$。对全为转动关节的本例，$\lambda$ 与 $J$ 同单位 m/rad；它用任务残差换取较小速度，不能恢复几何能力。有关节混合单位时应先作尺度归一化。

## 5. 用功率推导力的转置映射

$f\in\mathbb R^2$ 为机构对外输出的末端力，单位 N，坐标与 $v$ 一致；$\tau\in\mathbb R^2$ 为理想传动对应的关节输出转矩，单位 N·m。忽略惯性与损耗，要求对任意虚拟关节速度都有 $\tau^\top\dot q=f^\top v=f^\top J\dot q$，所以 $\tau=J^\top f$。若 $f$ 定义为环境施加给机构的力，静力平衡中驱动抵消它的转矩为 $-J^\top f$，符号来自受力对象。

用第 2 节矩阵、$f=(1,2)^\top\,\mathrm N$，得到 $\tau=(0.05,-0.05)^\top\,\mathrm{N\,m}$。配 $\dot q=(0.2,-0.1)^\top$，关节功率为 $0.01+0.005=0.015\,\mathrm W$；末端功率为 $1(-0.005)+2(0.01)=0.015\,\mathrm W$，两边相等。转置并不是速度逆矩阵，静力关系也不包含加速头部所需的惯性转矩。

## 6. 自测与步骤答案

**题1。** 伸直模型要求 $v_*=(0.001,0)^\top\,\mathrm{m/s}$，能精确求逆速度吗？

**解。** 第一行恒为 0，无法等于 $0.001$，故无精确解。伪逆能返回最小二乘结果，但仍有至少 $0.001\,\mathrm{m/s}$ 的任务残差；不能把一个返回向量称为目标已实现。

**题2。** 在第 2 节姿态，末端输出 $f=(0,1)^\top\,\mathrm N$，需要多少理想关节转矩？

**解。** $J^\top f=(0.05,0)^\top\,\mathrm{N\,m}$。第二关节轴到受力线的垂距为零，所以其转矩为零；第一关节具有 $0.05\,\mathrm m$ 力臂。几何解释与代数相符。

## 7. 可复现实验与出口

固定$\ell_1=\ell_2=0.05$米、$q_1=0$，令$q_2$从$\pi/2$减至0.01 rad，逐点记录最小奇异值、无阻尼逆解的关节速度以及$\lambda=0.005\,\mathrm{m/rad}$的阻尼解。任务速度固定为$(0.001,0)^\top\,\mathrm{m/s}$，每次都记录实现速度$J\dot q$与残差，再用中心差分检查$J$的每列。差分步长可比较$10^{-3},10^{-4},10^{-5}$ rad，不能只看一个步长。流程为合成计算设计，尚非实机验证。

出口：能解释一个任务方向为何困难，能用功率核对力映射。奇异性术语可回查作者教材 [Modern Robotics 5.3](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/)。

[上一章：R02 · 从关节角到注视方向：头部机构的正逆运动学](/notes/robotics-02-kinematics/) · [方向目录](/notes/direction-foundations/) · [下一章：R04 · 两只眼怎样看同一点：会聚、眼头分配与视觉反馈](/notes/robotics-11-binocular-gaze/)
