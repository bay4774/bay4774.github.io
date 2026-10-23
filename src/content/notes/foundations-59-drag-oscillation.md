---
title: '59 · 阻力与振动：两类可核验的动力学模型'
description: '阻力与振动：两类可核验的动力学模型，通过定义、推导和逐步算例理解物理模型。'
date: '2026-10-16'
tags: ['Foundations', 'Mechanics']
category: 'lecture'
foundationChapter: 59
foundationOrder: 69
readTime: 20
chapters: 7
reviewStatus: 'reviewed'
demo: false
draft: false
---

先修：[3 · 弧度与三角函数：从单位圆理解周期](/notes/foundations-03-trigonometry/) · [57 · 功与能量：沿位移理解累积](/notes/foundations-57-work-energy/) · [58 · 微分方程与初值：建立并检验解](/notes/foundations-58-differential-equations/)。

[章节索引](/notes/foundations-course-index/) · [公共基础路线](/notes/research-foundations-roadmap/) · [下一章：测量与不确定性：随机波动和系统偏移](/notes/foundations-60-measurement/)

## 1. 问题：阻力和恢复力怎样改变轨迹

自由落体速度一直增加，而有阻力的物体可能趋近终端速度；弹簧把物体拉回平衡位置，却可能不断往返。两类差异来自力模型，而不只是换一个初始条件。

先修是ODE、初值与弧度三角函数。以下每个公式都通过求导代回检验，避免把记下的通解当作无条件运动规律。

## 2. 线性阻力与特征时间

选向下为正，设阻力为−bv、b>0，常质量方程$mv'=mg-bv$。定义终端速度$v_\infty=mg/b$、时间尺度$\tau=m/b$；b单位kg/s，τ单位秒。

这里假设周围介质相对选定地面参考系静止，$v$也是物体相对介质的速度；若有风，阻力应依赖相对速度。$v>0$时阻力向上，$v<0$时阻力向下，都会反向于运动。终端速度由合力为0解出，不是“物体停止”：重力与阻力平衡后仍以非零速度运动。

为得到指数式，令$u=v-v_\infty$，方程化为$u'=-u/\tau$。于是$(e^{t/\tau}u)'=0$，得$u=(v_0-v_\infty)e^{-t/\tau}$。这沿用前章的乘积求导方法，没有引入新的解法黑箱。

对v(0)=0，解为$v(t)=v_\infty(1-e^{-t/\tau})$。验证导数为$v_\infty e^{-t/\tau}/\tau=g e^{-t/\tau}$，恰与$g-v/\tau$一致；初值也为0。位置积分为
$$
x(t)=x_0+v_\infty[t-\tau(1-e^{-t/\tau})].
$$
求导可回到v，不能漏掉常数项，否则位置初值会错。

## 3. 完整算例一：短时与长时都检查

取$m=2\,\mathrm{kg}$、$b=1\,\mathrm{kg/s}$、$g=10\,\mathrm{m/s^2}$，$\tau=2\,\mathrm s$、$v_\infty=20\,\mathrm{m/s}$。$t=2\,\mathrm s$时$v=20(1-e^{-1})\,\mathrm{m/s}\approx12.6424\,\mathrm{m/s}$，位移$20[2-2(1-e^{-1})]\,\mathrm m\approx14.7152\,\mathrm m$，比无阻力的$20\,\mathrm{m/s}$、$20\,\mathrm m$更小。

短时用指数展开，可得v约gt、位移约gt²/2，恢复自由落体的起始行为。长时v趋20，但位置继续增长，不会停在某个有限位置。加速度趋0不代表速度趋0。

具体地，$1-e^{-t/\tau}=t/\tau-t^2/(2\tau^2)+O((t/\tau)^3)$。代入位置时，一次项$t-\tau(t/\tau)$抵消，首项为$v_\infty t^2/(2\tau)=gt^2/2$。当$t=\tau$时速度已达终端值的$1-e^{-1}\approx63.2\%$，到$3\tau$时约$95.0\%$；$\tau$衡量接近速度，而非一个突然达到终端值的截止时刻。

线性阻力只在特定范围近似成立，高速二次阻力需要不同方程。若v0不为0，速度改为$v_\infty+(v_0-v_\infty)e^{-t/\tau}$；不能把零初速式直接用于任意初始状态。

## 4. 弹簧ODE与完整算例二

水平无摩擦弹簧，从平衡位置定义x，恢复力F=−kx。方程$mx''=-kx$。令$\omega=\sqrt{k/m}$，候选$x=A\cos(\omega t)+B\sin(\omega t)$求二阶导得$x''=-\omega^2x$，满足方程。

初值给$A=x_0$、$B=v_0/\omega$。取$m=1\,\mathrm{kg}$、$k=4\,\mathrm{N/m}$、$x_0=.1\,\mathrm m$、$v_0=0$，得$\omega=2\,\mathrm{s^{-1}}$，因此$x(t)=(.1\,\mathrm m)\cos(\omega t)$、$v(t)=(-.2\,\mathrm{m/s})\sin(\omega t)$。$t=\pi/4\,\mathrm s$时$x=0$、$v=-.2\,\mathrm{m/s}$；周期$T=2\pi/\omega=\pi\,\mathrm s$。角频率$2\,\mathrm{s^{-1}}$不是每秒2圈，弧度与周期要区分。

初值系数可逐项查：$x(0)=A$，而$v(t)=-A\omega\sin(\omega t)+B\omega\cos(\omega t)$，所以$v(0)=B\omega$。周期来自相位$\omega t$增加$2\pi$后正弦和余弦同时重复。恢复力总指向$x=0$，却不意味着物体到那里便停下：本例过平衡位置时速度大小反而最大。

物理机械能为$E=mv^2/2+kx^2/2$，单位焦耳。本例$E=.02\,\mathrm J$保持常数；求导得$E'=v(mv'+kx)=0$。若把式子除以$m$，得到$v^2/2+\omega^2x^2/2$，它是单位质量的能量、单位$\mathrm{m^2/s^2}$，不能只因质量数值为1就混淆两者的单位。物理解释可回看功与能量，不需要先知能量式才能求导验证解析解。

## 5. 耗散与模型边界

加阻尼−bv后，弹簧方程为$mx''+bx'+kx=0$。机械能导数为−bv²≤0，原来的恒振幅正弦解不再自动适用。这里不要求记住全部阻尼分类通解，只要求能从力清单改写方程并判耗散方向。

弹簧F=−kx也只在近似线性范围成立；过大形变、碰撞和摩擦都可能使模型变化。解析解精确不等于现实预测无限精确；初值和参数误差仍会传播。

例如自由落体位置误差由$\delta x_0+t\delta v_0+\tfrac12t^2\delta g$组成，时间增长可放大参数误差。显示很多小数位不能替代测量不确定性，下一章会专门拆开这些来源。

## 6. 两题自测与步骤答案

1. m=3kg、b=1.5kg/s时τ是多少？对$v'=g-v/\tau$、v(0)=v0，如何确定指数解的常数？
2. m=1kg、k=9N/m、x0=0、v0=.6m/s，写x(t)与周期，并检查初始导数。

答案1：$\tau=m/b=2\,\mathrm s$。若$v=g\tau+Ce^{-t/\tau}$，t=0给$C=v_0-g\tau$；导数代回一致。终端速度不是初速度。
答案2：ω=3，A=0，B=.6/3=.2，所以x=.2sin3t，周期2π/3s；x'=.6cos3t，在0时确为.6。

## 7. 出口与选读

闭卷写出阻力模型与弹簧模型的状态、方程、初值、解的验证和一项失效条件。再问：若真实数据偏离解，怎样区分参数不准、测量偏移和模型遗漏？下一章转向测量不确定性。

[MIT 8.01SC](https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/)的Resistive Forces与弹簧主题、[MIT18.03SC](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/)的线性ODE可作为选读。本章不预设分析力学或机器人控制。
