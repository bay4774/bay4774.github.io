---
title: 'P12 · 从时间方程到空间场：热方程、边界与残差'
description: '用一维热传导推导最小PDE模型，核对初边值、无量纲化、差分稳定性和物理学习的独立验证。'
date: '2026-10-17'
tags: ['Physics Constraints', 'Direction Foundations']
category: 'lecture'
directionTrack: 'physics'
directionChapter: 12
readTime: 33
chapters: 7
demo: false
draft: false
---

先修：[物理信息学习](/notes/physics-07-physics-informed-learning/)、[多元导数](/notes/foundations-24-multivariable-differentiability/)、[积分基本定理](/notes/foundations-21-fundamental-theorem/)、[有限差分](/notes/foundations-66-finite-differences/)。入口自查：$u(x,t)$对$t$求偏导时固定的是哪一个变量？若不清楚，先回查公共多元微分。

## 1. 场变量与粒子坐标有什么不同

有限质点模型给每个物体一个位置；场模型为每个空间点定义温度、位移或速度。这里取细杆位置$x\in[0,L]$米、时间$t$秒，温度$T(x,t)$以K表示。未知是整个时空函数，而非只有几个初值数字。

假设杆均匀、截面积$A$恒定、无侧向热损失、材料参数恒定且无内部热源。密度$\rho$单位kg/m³，比热$c$单位J/(kg·K)，热导率$\kappa$单位W/(m·K)。这些假设限定模型；非均匀材料或热源需要修改方程，不能只换训练数据。

## 2. 由局部能量收支推导热方程

定义沿正$x$方向的热功率$Q(x,t)=-\kappa A\,T_x(x,t)$，单位W。负号表示热从高温流向低温。微段$[x,x+\Delta x]$储热变化率约为$\rho cA\Delta x\,T_t$，净输入为$Q(x,t)-Q(x+\Delta x,t)$。

两边除以$A\Delta x$并取光滑极限，得到$\rho cT_t=\kappa T_{xx}$，因此

$$
T_t=\alpha T_{xx},\qquad \alpha=\frac{\kappa}{\rho c}>0.
$$

$\alpha$为热扩散率，单位m²/s；左边K/s，右边$(\mathrm{m^2/s})(\mathrm{K/m^2})$，单位一致。若$\kappa$随位置变，必须保留$\partial_x(\kappa T_x)$，不能简单把它移出导数。

该模型与边值问题的课程来源可查[MIT一维热方程讲义](https://ocw.mit.edu/courses/18-303-linear-partial-differential-equations-fall-2006/pages/lecture-notes/)。以下尺度、网格和算例均为本课程的合成设定。

## 3. 方程之外还必须给哪些条件

初值$T(x,0)=T_0(x)$给整个杆的初始温度分布。两端还需空间边界：Dirichlet条件指定温度，例如$T(0,t)=T(L,t)=T_{\rm ref}$；Neumann条件指定导数或热流，例如绝热端$T_x=0$。二者的物理含义不同，不能在同一端无条件同时指定任意温度和任意热流。

对光滑经典解，还应检查初值与边界在角点相容，例如固定温度边界要求$T_0(0)=T_0(L)=T_{\rm ref}$。不相容数据可能需要弱解与初始层处理，这超出本章，不能忽略后仍称函数处处光滑。

令$\xi=x/L$、$\tau=\alpha t/L^2$、$u=(T-T_{\rm ref})/\Delta T$，$\Delta T>0$。链式法则给$T_t=\Delta T(\alpha/L^2)u_\tau$、$T_{xx}=(\Delta T/L^2)u_{\xi\xi}$，方程变为$u_\tau=u_{\xi\xi}$。空间与时间导数的尺度都改变，不能只归一化输入却保留原系数。

## 4. 一个能逐项代回的解析参照

在$\xi\in[0,1]$上，取端点$u=0$、初值$u(\xi,0)=\sin(\pi\xi)$。候选解

$$
u(\xi,\tau)=e^{-\pi^2\tau}\sin(\pi\xi).
$$

直接求$u_\tau=-\pi^2e^{-\pi^2\tau}\sin(\pi\xi)$，两次空间求导也得到同一式；端点正弦为0，初时指数为1，三类条件均成立。只核对PDE一项是不够的：任意常数也满足$u_\tau=u_{\xi\xi}=0$，却一般不满足这一初边值问题。

固定端点温度会向外散热，所以杆内总热量不必守恒。积分得$d\int_0^1u\,d\xi/d\tau=u_\xi(1,\tau)-u_\xi(0,\tau)$，变化来自边界通量。若两端绝热，两导数为0时积分才守恒；不能给固定低温边界还强迫杆内热量不变。

## 5. 网格一步、稳定性与学习残差

均匀空间网格$\xi_j=j\Delta\xi$、时间步$\Delta\tau$，显式中心差分为

$$
u_j^{n+1}=r u_{j-1}^n+(1-2r)u_j^n+r u_{j+1}^n,\qquad
r=\frac{\Delta\tau}{\Delta\xi^2}.
$$

它来自时间前向差分等于空间二阶中心差分。$0\le r\le1/2$时三个权重非负且和为1，内部更新不超出相邻值范围；这是此一维常系数格式的稳定与单调性入口条件。空间步缩半，保持同$r$时，时间步需缩为四分之一。

完整例$\Delta\xi=1/4,r=1/4$，故$\Delta\tau=1/64$。初始五点为$(0,\sqrt2/2,1,\sqrt2/2,0)$。下一步中心值为$\frac14(\sqrt2/2)+\frac12+\frac14(\sqrt2/2)=\frac12+\frac{\sqrt2}4\approx0.853553$；相邻内部值为$\frac{\sqrt2}4+\frac14\approx0.603553$，端点仍为0。解析中心是$e^{-\pi^2/64}$，不与差分值严格相同。若$r>1/2$，中央权重变负，可能出现不应有的振荡，不能仅增加训练迭代修复错误离散步长。

若改用可微网络$u_\theta(\xi,\tau)$，方程残差$r_\theta=\partial_\tau u_\theta-\partial_{\xi\xi}u_\theta$；还要分别监督初值与两个空间边界。可用$u_\theta=\xi(1-\xi)N_\theta$硬编码零端点，但这没有自动满足初值；且乘积求二阶导数时必须保留所有链式项。残差平方小依然要在独立时空网格核验。

## 6. 自测与步骤答案

1. 原空间网格0.1米、时间步0.01秒；空间步减为0.05米，若保持相同$r$，时间步多少？
2. $u=0$是否满足第4节完整问题？漏掉了哪一项？
3. 两端绝热、无热源，积分温度量的导数是多少？对固定零端点的正弦例也是如此吗？

答案1：缩为四分之一，即0.0025秒，热扩散率不变。答案2：满足方程和边界，不满足非零初始正弦。答案3：绝热时两端通量均零，导数为0；正弦例端点导数不同，积分随时间衰减。

## 7. 可复现实验与出口

先复算五点一步，再用$\Delta\xi=1/4,1/8,1/16$、固定$r=1/4$推进到$\tau=1/16$；这些设置都能整步到达终点。分别与解析解比较最大误差、边界误差和热量收支。另取$r=0.6$作失稳诊断，保留步长与观测时长，不能预设短时间就一定出现肉眼可见发散。

学习扩展仅作待执行设计：在训练时空点拟合网络，在错开网格验证，再删去初值项检验零函数反例。出口是能把ODE经验迁移到最小PDE，同时说清新出现的空间边界、二阶导数、时空采样和尺度条件。弱形式、复杂几何和连续介质本构仍需后续专题。

[上一章](/notes/physics-07-physics-informed-learning/) · [方向目录](/notes/direction-foundations/) · [下一章](/notes/physics-12-differentiable-simulation/)
