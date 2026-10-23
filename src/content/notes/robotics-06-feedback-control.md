---
title: 'R07 · 让头部跟上指令：状态反馈、PD 与采样'
description: '从单轴误差动力学推导 PD 伺服，连接连续稳定性、离散采样、速度估计和饱和的实际边界。'
date: '2026-10-17'
tags: ['Bionic Robot Head', 'Direction Foundations']
category: 'lecture'
directionTrack: 'robotics'
directionChapter: 7
readTime: 35
chapters: 7
demo: false
draft: false
---

先修：[R05 驱动模型](/notes/robotics-04-actuation-transmission/)、[R06 传感与时间](/notes/robotics-05-sensing-calibration/)、[13 特征值](/notes/foundations-13-eigenvalues/)、[59 阻力与振动](/notes/foundations-59-drag-oscillation/)、[68 Euler 法](/notes/foundations-68-euler-method/)。本章先分析理想单轴，再逐项标出实际舵机不满足的条件。

## 1. 状态比当前位置多一项

单轴角度 $q$ 为 rad，速度 $v=\dot q$ 为 rad/s；状态 $x=(q,v)^\top$ 同时决定下一瞬间的位置变化和惯性运动。惯量 $J>0$ 为 kg·m²，黏性阻尼 $b\ge0$ 为 N·m·s/rad，驱动转矩 $\tau$ 为 N·m。暂时忽略重力变化、耦合和摩擦，模型是 $\dot q=v,\ J\dot v=\tau-bv$。

设静止目标为常数 $q_d$，定义误差 $e=q-q_d$。PD（比例加微分）控制取 $\tau=-k_pe-k_dv$，其中 $k_p>0$ 为 N·m/rad，$k_d\ge0$ 为 N·m·s/rad。误差偏正时比例项拉回，速度偏正时微分项制动；先明确误差定义，才能判断负号。

## 2. 由闭环方程理解增益

代入驱动模型，得到 $J\ddot e+(b+k_d)\dot e+k_pe=0$。除以 $J$，与 $\ddot e+2\zeta\omega_n\dot e+\omega_n^2e=0$ 比较，定义自然频率 $\omega_n=\sqrt{k_p/J}$，单位 s⁻¹；阻尼比 $\zeta=(b+k_d)/(2\sqrt{Jk_p})$，无量纲。

这是该线性模型的结果，不是“增益越大越好”的经验。增加 $k_p$ 会加快理想响应，也增加所需转矩；固定 $k_d$ 时还可能降低阻尼比。若 $k_p>0,b+k_d>0$，特征根实部为负，连续模型的误差趋于零。真实输入延迟、弹性共振与饱和尚未包括。

## 3. 完整算例：一条能直接验算的响应

取合成参数 $J=0.02\,\mathrm{kg\,m^2}$、$b=0.02\,\mathrm{N\,m\,s/rad}$、$k_p=0.5\,\mathrm{N\,m/rad}$、$k_d=0.18\,\mathrm{N\,m\,s/rad}$。则 $\omega_n=\sqrt{25}=5\,\mathrm{s^{-1}}$，$b+k_d=0.2$，$\zeta=0.2/(2\sqrt{0.01})=1$。

初值 $e(0)=0.1$ rad、$\dot e(0)=0$ 时，重根为 $-5$，候选解为 $e(t)=0.1(1+5t)e^{-5t}$。求导得 $\dot e=-2.5te^{-5t}$，二阶导为 $(-2.5+12.5t)e^{-5t}$。逐项代入 $0.02\ddot e+0.2\dot e+0.5e$，常数项 $-0.05+0.05=0$，$t$ 项 $0.25-0.5+0.25=0$；初值也满足。

在 $t=0$，所需转矩 $-0.5\times0.1=-0.05$ N·m，初始加速度 $-2.5$ rad/s²。若限流只允许 $0.02$ N·m，起始段就已饱和，上面的解析解不再是实际闭环解。

## 4. 采样如何改变稳定性问题

控制器每 $h$ 秒读取一次状态，在周期内保持上次转矩，称零阶保持。必须区分这个真实采样系统与用于计算的 Euler 近似。Euler 近似将误差状态 $z=(e,v)^\top$ 更新为

$$
z_{k+1}=(I+hA)z_k,\quad A=\begin{bmatrix}0&1\\-k_p/J&-(b+k_d)/J\end{bmatrix}.
$$

本例 $A=\begin{bmatrix}0&1\\-25&-10\end{bmatrix}$，Euler 更新矩阵特征值均为 $1-5h$。当 $0<h<0.4$ s 时此近似渐近稳定；$h=0.5$ s 时特征值为 $-1.5$，误差增长。它说明连续稳定不保证任意步长的离散实现稳定，但 $0.4$ s 不是实际舵机允许周期的认证界限；真实零阶保持需从开环模型推导精确离散映射并计入延迟。

以 $h=0.01$ s、$z_0=(0.1,0)$，第一步 $e_1=0.1$、$v_1=-0.025$。第二步 $e_2=0.09975$，$v_2=-0.025+0.01[-25(0.1)-10(-0.025)]=-0.0475$。Euler 的位置首步未变而解析解已略下降，是数值近似特性，不是死区。

进一步把真正零阶保持写出来。一个采样区间内$\tau_k$固定，先解开环方程$J\dot v=\tau_k-bv$。当$b>0$时令$a=e^{-bh/J}$，积分得到

$$
v_{k+1}=av_k+\frac{1-a}{b}\tau_k,\qquad
q_{k+1}=q_k+\frac{J(1-a)}{b}v_k+
\left[\frac hb-\frac{J(1-a)}{b^2}\right]\tau_k.
$$

第二式来自对速度曲线积分，而不是直接用末端速度乘$h$。写成$z_{k+1}=A_dz_k+B_d\tau_k$后，再代入采样时刻的$\tau_k=-[k_p\ k_d]z_k$，实际理想采样闭环矩阵是$A_d-B_d[k_p\ k_d]$。它一般既不等于$I+hA$，也不等于连续反馈系统的$e^{Ah}$：保持的是转矩，状态却在区间内继续变化。

主例$h=0.01$秒、$q_d=0$、$q_0=0.1,v_0=0$，首周期$\tau_0=-0.05$ N·m。$a=e^{-0.01}\approx0.9900498$，因此$v_1\approx-0.0248754$ rad/s、$q_1\approx0.0998754$ rad；可与Euler首步$(0.1,-0.025)$区分。稳定性应对这个闭环矩阵查特征值模小于1，并进一步按真实延迟扩充状态。

当$b=0$时不能代入含$1/b$的式子，而应取极限或直接积分：$v_{k+1}=v_k+h\tau_k/J$，$q_{k+1}=q_k+hv_k+h^2\tau_k/(2J)$。这是加速度恒定时的熟悉运动公式，也为$b\to0$的结果提供核验。

## 5. 速度估计、偏置与隐藏内环

仅有角度读数时可用 $\hat v_k=(q_k-q_{k-1})/h$，但噪声也被除以 $h$。若独立角度噪声标准差为 $\sigma_q$，差分速度噪声标准差为 $\sqrt2\sigma_q/h$；滤波能减噪，同时引入相位滞后。不能只提高采样率而不检查微分项噪声和执行抖动。

若有恒定外扰 $\tau_d$，平衡时 $0=-k_pe+\tau_d$，故 $e=\tau_d/k_p$；PD 不会自动消除恒定负载误差。积分能处理某些偏差，但饱和时需要防止积分持续积累。使用位置型商品舵机时，外部给的已经是内部闭环目标角；不能把本文转矩 PD 原封不动叠到未知内环上并宣称拥有相同闭环极点。

## 6. 自测与步骤答案

**题1。** 若 $J=0.01$、$k_p=1$（使用本章 SI 单位），$b=0$，临界阻尼需要多少 $k_d$？

**解。** $\omega_n=\sqrt{1/0.01}=10$ s⁻¹；要求 $b+k_d=2\sqrt{Jk_p}=0.2$，故 $k_d=0.2$ N·m·s/rad。仍需检查峰值转矩与采样实现。

**题2。** 恒定扰动为 $0.01$ N·m，$k_p=0.5$ N·m/rad，模型平衡误差是多少？

**解。** 令速度、加速度为零，得 $k_pe=\tau_d$，所以 $e=0.02$ rad。把滤波器调得更平滑不会消掉这个静态负载偏差。

## 7. 可复现实验与出口

按算例计算解析曲线，再分别用 $h=0.01,0.05,0.5$ s 的 Euler 更新绘制 2 s 响应，保存误差与步长；另加 $|\tau|\le0.02$ N·m 的限幅重新积分，不再拿无饱和解析解当正确轨迹。随后在相同噪声序列下比较原始差分与低通速度估计，报告噪声和延迟。以上是合成实验流程，不是已完成的实机调参。

出口：能从增益写出误差方程，并指出稳定性结论所依赖的采样、传感与驱动条件。教材核对：[Modern Robotics 二阶误差动力学](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-2-2-2-second-order-error-dynamics/)与[转矩控制](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-4-motion-control-with-torque-or-force-inputs-part-1-of-3/)。

[上一章：R06 · 从读数到可信姿态：零位、回差与时间标定](/notes/robotics-05-sensing-calibration/) · [方向目录](/notes/direction-foundations/) · [下一章：R08 · 遇到外力时怎样让步：柔顺、阻抗与头部接触](/notes/robotics-07-compliance-interaction/)
