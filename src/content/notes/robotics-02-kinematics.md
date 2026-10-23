---
title: 'R02 · 从关节角到注视方向：头部机构的正逆运动学'
description: '为颈部 yaw-pitch 和下颌串联机构建立前向模型，再解释逆解、分支、可达性与关节限位。'
date: '2026-10-17'
tags: ['Bionic Robot Head', 'Direction Foundations']
category: 'lecture'
directionTrack: 'robotics'
directionChapter: 2
readTime: 24
chapters: 7
demo: false
draft: false
---

先修：[R01 坐标与旋转](/notes/robotics-01-frames-rotations/)、[16 函数与反函数](/notes/foundations-16-functions-inverses/)、[30 约束极值](/notes/foundations-30-constrained-extrema/)。本章不重讲三角函数，而是把关节的物理连接关系写成可反算的模型。

## 1. 关节空间与任务空间

$q=(\psi,\phi)^\top\in\mathbb R^2$ 是颈部两个关节角，单位 rad：$\psi$ 绕底座 $z$ 轴偏航，$\phi$ 绕随偏航转动后的 $y$ 轴俯仰。任务可以是前向单位向量 $d\in\mathbb R^3$，也可以是鼻尖位置 $p\in\mathbb R^3$。两者不能混为一谈：同一注视方向可以配不同眼球位置，不同位置也可能朝同一方向。

正运动学（FK）已知 $q$ 求任务量 $f(q)$；逆运动学（IK）已知期望任务量求满足它的 $q$。逆问题可以无解、多解或只有近似解。真实关节还有上下限和机械碰撞；数学上存在的角度未必能执行。

## 2. 从机构顺序写出正运动学

假设两个转轴相交，头前向为局部 $e_x$，由 R01 的约定

$$
d(q)=R_z(\psi)R_y(\phi)e_x
=\begin{bmatrix}\cos\psi\cos\phi\\\sin\psi\cos\phi\\-\sin\phi\end{bmatrix}.
$$

推导时先做 $R_y e_x=(\cos\phi,0,-\sin\phi)^\top$，再用 $R_z$ 旋转前两个分量。平方和为 $\cos^2\phi(\cos^2\psi+\sin^2\psi)+\sin^2\phi=1$，因此输出确为方向。若鼻尖距交点为 $\ell$ 米，且恰在局部前轴上，鼻尖为 $p=t+\ell d$。

若转轴并不相交，不能只乘旋转。以眼球系 $E$ 为例，应将每一段写成 $T_{B1}(q_1)T_{12}(q_2)T_{2E}$，固定安装偏移也放进矩阵链。锁定关节逐段转动、测量末端位置，是确定乘法次序的物理检查。

## 3. 注视方向的解析逆解

期望单位方向 $d_*=(d_x,d_y,d_z)^\top$，限制 $|\phi|<\pi/2$，使 $\cos\phi>0$。从上式得到

$$
\psi=\operatorname{atan2}(d_y,d_x),\qquad
\phi=\operatorname{atan2}(-d_z,\sqrt{d_x^2+d_y^2}).
$$

$\operatorname{atan2}(y,x)$ 根据两分量保留象限；用 $\arctan(y/x)$ 会把前后方混淆，也不能处理 $x=0$。假设目标位置为 $p_*$、转轴交点为 $t$，应先算 $r=p_*-t$，再归一化 $d_*=r/\|r\|$。若 $r=0$，方向无定义，不能让除零产生的数冒充逆解。

完整算例：目标相对交点为 $(0.3,0.3,0.3)^\top\,\mathrm m$。长度 $\sqrt{0.27}=0.3\sqrt3$，故 $d_*=(1,1,1)^\top/\sqrt3$。先算 $\psi=\pi/4$，再算 $\phi=-\arctan(1/\sqrt2)\approx-0.61548$ rad。由 $\cos\phi=\sqrt{2/3}$、$\sin\phi=-1/\sqrt3$，代回三个分量均为 $1/\sqrt3$，核验完成。如果俯仰限位为 $[-0.5,0.5]$ rad，本目标不可精确达到；截断到 $-0.5$ 是近似策略，应重新计算方向误差，不能报告“已解出”。

## 4. 下颌连杆说明多解如何出现

用二维两连杆作为下颌连杆的教学简化，不代表所有机器人嘴部结构。杆长 $\ell_1,\ell_2>0$，单位 m；关节角 $q_1,q_2$ 为 rad。末端

$$
x=\ell_1\cos q_1+\ell_2\cos(q_1+q_2),\quad
y=\ell_1\sin q_1+\ell_2\sin(q_1+q_2).
$$

平方相加消去 $q_1$，得到 $c_2=(x^2+y^2-\ell_1^2-\ell_2^2)/(2\ell_1\ell_2)=\cos q_2$。当 $|c_2|\le1$，有 $q_2=\pm\arccos c_2$；随后 $q_1=\operatorname{atan2}(y,x)-\operatorname{atan2}(\ell_2\sin q_2,\ell_1+\ell_2\cos q_2)$。正负分支对应两种折叠姿态。

取 $\ell_1=\ell_2=0.05\,\mathrm m$、$(x,y)=(0.05,0.05)\,\mathrm m$，得 $c_2=0$。第一支 $(q_1,q_2)=(0,\pi/2)$；第二支 $(\pi/2,-\pi/2)$。分别代回都给 $(0.05,0.05)$。可达半径满足 $|\ell_1-\ell_2|\le\sqrt{x^2+y^2}\le\ell_1+\ell_2$；这是几何必要条件，还要再检查限位和自碰撞。

## 5. 边界与数值逆解

正上方 $d_*=(0,0,1)$ 使俯仰为 $-\pi/2$，任意偏航都给同一方向，逆解不唯一。对相邻目标独立选分支也可能让关节突然跳转；连续轨迹应考虑上一帧姿态，并以角度环绕后的差判断接近程度。

复杂机构可解 $\min_q\|f(q)-y_*\|^2$，同时约束限位。这个目标只对同单位的任务量直接合理；若同时含米和弧度，必须说明尺度权重。优化器返回一个局部结果，不能据“停止迭代”推出全局可达或唯一。下一章用 Jacobian 解释局部更新何时可靠。

## 6. 自测与步骤答案

**题1。** 目标方向为 $(0,1,0)^\top$，求上述约定下的角度，并核验。

**解。** $\psi=\operatorname{atan2}(1,0)=\pi/2$，$\phi=0$；代回 $d=(0,1,0)^\top$。若硬件偏航上限只有 $\pi/3$，该数学解不能执行。

**题2。** 两杆各长 $0.04\,\mathrm m$，目标为 $(0.1,0)\,\mathrm m$。是否应把算出的 $c_2$ 强行裁到 1？

**解。** 最大半径为 $0.08\,\mathrm m$，目标不可达；直接算 $c_2=(0.01-0.0032)/0.0032=2.125>1$。裁到 1 只能得到边界上的近似目标，应单独报告 $0.02\,\mathrm m$ 残差。只有微小浮点越界且几何上已确认可达时，才可按数值容差处理。

## 7. 可复现实验与出口

在纸面或数组程序中设 $\psi\in\{-0.6,0,0.6\}$、$\phi\in\{-0.4,0,0.4\}$，先 FK 得九个方向，再 IK 并 FK 回查，保存方向误差和关节限位标记。增加正上方目标与超限目标，分别记录多解和不可执行，而非删除失败样本。两连杆例对两支分别做 FK 核验，画图时等比例坐标。这里提供流程，未声称完成硬件实验。

出口：能从轴的连接顺序写模型，并把“几何可达、限位可行、分支连续”分开判断。作者教材中正逆运动学的章节位置见 [Modern Robotics 官方目录，第 4、6 章](https://modernrobotics.northwestern.edu/nu-gm-book-resource/)，本章采用可手算的头部简化模型。

[上一章：R01 · 机器人头的空间语言：坐标、旋转与刚体变换](/notes/robotics-01-frames-rotations/) · [方向目录](/notes/direction-foundations/) · [下一章：R03 · 头部如何动、如何受力：Jacobian 与奇异性](/notes/robotics-03-jacobians/)
