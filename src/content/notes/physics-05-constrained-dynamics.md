---
title: 'P07 · 约束动力学：Jacobian、反力与 KKT 系统'
description: '从位置等式逐次求导构造加速度约束，用二维粒子完整求出约束反力和加速度。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 7
readTime: 24
chapters: 7
demo: false
draft: false
---

先修：[P03 · Lagrange 动力学](/notes/physics-09-lagrangian-dynamics/)、[P06 · 摩擦](/notes/physics-10-friction/)、[26 · Jacobian](/notes/foundations-26-jacobians/)、[31 · Lagrange 乘子](/notes/foundations-31-lagrange-multipliers/)、[64 · 线性求解器](/notes/foundations-64-linear-solvers/)。

[方向总入口](/notes/direction-foundations/) · [上一章：P06 · 摩擦：粘着、滑动与摩擦锥](/notes/physics-10-friction/) · [下一章：P08 · 约束优化：硬可行性、投影与软惩罚](/notes/physics-06-constraint-optimization/)

## 1. 本章问题：保留冗余坐标时，反力怎样求

单摆可以用一个角度消掉杆长，也可以保留二维位置并约束到圆上。后一种表达更方便组合多个连接，但需要同时求加速度与反力。本章只处理已确定、理想、光滑的双边等式约束，不自动覆盖接触激活与摩擦模式选择。

令 $q,v,a\in\mathbb R^d$ 分别为位置、速度、加速度，暂取全部为平移坐标。质量矩阵 $M\in\mathbb R^{d\times d}$ 对称正定，单位千克；已知非约束合力为 $f\in\mathbb R^d$，单位牛顿。约束 $c(q)\in\mathbb R^r$ 满足 $c(q)=0$。

## 2. 对约束求导不能遗漏曲率项

定义 $J(q)=\partial c/\partial q\in\mathbb R^{r\times d}$。沿运动轨迹求导，先得速度约束 $Jv=0$，再求导得到

$$
Ja+\dot Jv=0.
$$

$\dot J$ 表示 Jacobian 沿轨迹的时间导数；并不是把矩阵简单置零。若圆约束写为 $c(q)=\tfrac12(q^Tq-\ell^2)$，则 $J=q^T$，$\dot J=v^T$，故 $q^Ta+v^Tv=0$。后一项要求径向加速度维持弯曲运动，正是向心加速度的来源。

若约束显含时间，速度式还要加 $\partial c/\partial t$，本章定常公式不能原样照搬。约束函数可任意乘非零常数，但 Jacobian 和乘子要同步变化；物理反力不应随表示缩放而改变。

## 3. 联立系统与 Schur 补推导

约定约束反力为 $J^T\lambda$。$\lambda\in\mathbb R^r$ 是乘子，单位取决于 $c$ 的定义，不总是牛顿。动力学与约束组成

$$
\begin{bmatrix}M&-J^T\\J&0\end{bmatrix}
\begin{bmatrix}a\\\lambda\end{bmatrix}
=\begin{bmatrix}f\\-\dot Jv\end{bmatrix}.
$$

这是一个鞍点线性系统，与约束二次问题的 KKT 结构相通。先由第一行得 $a=M^{-1}(f+J^T\lambda)$，代入第二行，得到

$$
JM^{-1}J^T\lambda=-\dot Jv-JM^{-1}f.
$$

若 $J$ 满行秩，$JM^{-1}J^T$ 正定，可以求乘子再回代。实现时解线性方程而不显式形成所有逆矩阵。若约束重复导致 $J$ 行相关，乘子可能不唯一；这不是通过多加迭代次数必能解决的问题。[Modern Robotics 作者教材 §8.7](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-7-constrained-dynamics/)可用于对照约束力与运动方程。

## 4. 手算：圆周运动需要多大反力

质量 $m=2\,\mathrm{kg}$，$M=2I_2$，圆半径 $\ell=1\,\mathrm m$。当前 $q=(1,0)^T\,\mathrm m$，$v=(0,3)^T\,\mathrm{m/s}$，外力 $f=(0,-20)^T\,\mathrm N$。约束函数取上一节圆函数，则 $J=[1,0]$，$\dot Jv=9\,\mathrm{m^2/s^2}$。

计算 $JM^{-1}J^T=0.5\,\mathrm{kg^{-1}m^2}$，$JM^{-1}f=0$，故 $\lambda=-9/0.5=-18\,\mathrm{N/m}$。反力 $J^T\lambda=(-18,0)^T\,\mathrm N$，加速度为 $a=M^{-1}(f+J^T\lambda)=(-9,-10)^T\,\mathrm{m/s^2}$。

核验一：$q^Ta+v^Tv=-9+9=0$。核验二：径向加速度大小为 $v^2/\ell=9\,\mathrm{m/s^2}$，方向指向圆心。若错误省略 $\dot Jv$，会求出零径向反力，让物体沿切线离开圆。

## 5. 漂移、稳定化与可复现实验

即使每步满足加速度约束，离散积分后也可能出现 $c(q_n)\ne0$。加速度层正确不自动保证位置层正确。可选方法包括投影位置和速度、使用专门约束积分器，或加入稳定化目标 $Ja+\dot Jv=-2\alpha Jv-\beta^2c$。$\alpha,\beta$ 单位每秒；它们引入额外时间尺度，需要和步长一起检查。

先复算上例，随后将 $c$ 改写为 $2c$，检查 $J$ 变为两倍、$\lambda$ 变为一半、$J^T\lambda$ 不变。再在表格中添加第二条与第一条完全相同的约束，检查秩不足；不要伪称乘子唯一。最后实现10步自由积分，记录 $|c|$ 与 $|Jv|$，分别比较不投影和投影版本。每版必须写出投影次序和求解容差；这里不预报未运行结果。

## 6. 独立自测与步骤答案

1. 上例把速度改为 $(0,2)$，径向加速度与反力分别是多少？
2. 为什么 $c=0$ 但 $Jv\ne0$ 的初值不一致？
3. 两条相同约束是否给了系统更多独立限制？

答案1：$v^Tv=4$，约束要求 $a_x=-4$；质量2，所以反力 $F_x=-8\,\mathrm N$，其余重力加速度仍为 $-10$。

答案2：初始位置在允许曲面上，但初速指向曲面之外；对 $c=0$ 求导必须满足 $Jv=0$。只修位置不能修复该初速问题。

答案3：没有。Jacobian 行重复，秩未增加，乘子可能互相分摊同一反力；应删除冗余或使用适当秩处理，并报告处理方式。

## 7. 出口：分开记录三个层次的残差

能同时检查 $c(q)$、$Jv$ 和 $Ja+\dot Jv$，并解释乘子单位后，进入 [P08](/notes/physics-06-constraint-optimization/)。下一章把轨迹或参数作为优化变量，研究硬约束与软惩罚之间的差别。
