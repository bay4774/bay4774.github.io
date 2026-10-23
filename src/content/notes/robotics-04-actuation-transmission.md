---
title: 'R05 · 电机怎样带动眉眼与颈部：转矩、传动和拉索'
description: '连接电流、转矩、速度与功率，推导减速和拉索行程，并识别限位、回差及电气动态。'
date: '2026-10-17'
tags: ['Bionic Robot Head', 'Direction Foundations']
category: 'lecture'
directionTrack: 'robotics'
directionChapter: 5
readTime: 26
chapters: 7
demo: false
draft: false
---

先修：[R03 速度与力映射](/notes/robotics-03-jacobians/)、[56 牛顿定律](/notes/foundations-56-newton-momentum/)、[57 功与能](/notes/foundations-57-work-energy/)、[58 微分方程](/notes/foundations-58-differential-equations/)。本章使用直流电机等效模型说明驱动逻辑；商品舵机内部还可能包含不同电机、驱动器和闭环，不能直接套用所有参数。

## 1. 电压、电流和转矩不是同一个命令

电机电流 $i$ 单位 A，端电压 $u$ 单位 V，转子角速度 $\omega_m$ 单位 rad/s，电磁转矩 $\tau_m$ 单位 N·m。在线性磁路近似内 $\tau_m=k_ti$，转矩常数 $k_t$ 单位 N·m/A。电压并不直接指定转矩，因为绕组电阻、电感与反电动势共同决定电流。

定义电阻 $R_e$，单位 Ω；电感 $L$，单位 H；反电动势常数 $k_e$，单位 V·s/rad。电路平衡为

$$
u=R_ei+L\dot i+k_e\omega_m.
$$

三项分别是电阻压降、改变电流所需电压和转动产生的反电动势。若速度暂时固定，电流变化时间尺度为 $L/R_e$ 秒；控制周期与它相近时，不能把电流视为立刻达到目标。机械端可写 $J_m\dot\omega_m=\tau_m-b_m\omega_m-\tau_{\mathrm{load},m}$，其中 $J_m$ 为 kg·m²，$b_m$ 为 N·m·s/rad，最后一项是折算到电机轴的负载转矩。

## 2. 从稳态电路推出转矩速度边界

在 $\dot i=0$ 时，$i=(u-k_e\omega_m)/R_e$，所以 $\tau_m=k_t(u-k_e\omega_m)/R_e$。固定正电压下，转得越快，可用于电阻的电压越少，稳态电流与转矩下降。堵转时 $\omega_m=0$，模型给最大电流 $u/R_e$，但机械功率 $\tau_m\omega_m=0$；大电流仍产生 $i^2R_e$ 热损耗。

这个直线关系有电源、电流限制和温度条件，不能把“堵转转矩”当连续额定转矩。理想 SI 单位约定下 $k_t$ 与 $k_e$ 数值相等体现机电功率一致；实际参数表若采用 rpm/V 或 mN·m/A，必须先换单位。

电流限幅意味着驱动器需要改变实际端电压，而不是在同一个固定电压稳态式里随意裁掉电流。以$R_e=2\,\Omega$、电源上限6 V为例，堵转时固定端电压6 V给3 A；若电流环限制为2 A，稳态有效端电压应降到4 V。转动时则需$u_{\rm eff}=R_e i_{\rm lim}+k_e\omega_m$，前提是所需电压未超过电源能力。忽略开关纹波的平均模型可这样理解；不能同时保留“端电压恒为6 V”和“堵转电流恒为2 A”两条互不相容的条件。

## 3. 减速器交换速度和转矩

设正向减速比 $N=\omega_m/\omega_j>1$，无量纲；关节角速度为 $\omega_j$。忽略传动弹性，$\omega_j=\omega_m/N$。正向驱动效率 $0<\eta\le1$ 给 $\tau_j=\eta N\tau_m$，因此 $\tau_j\omega_j=\eta\tau_m\omega_m$。效率损失后输出功率不会凭空增加。

对理想刚性无损传动，用动能推导转子在关节端的等效惯量：$\frac12J_m\omega_m^2=\frac12(N^2J_m)\omega_j^2$。增加减速比会增加反射惯量，可能让颈部更难被外力推动。反向驱动效率、静摩擦和回差还会不同，不能用一个 $\eta$ 完整描述交互感受。

## 4. 完整算例：下颌拉索的力与行程

设 $u=6\,\mathrm V$、$R_e=2\,\Omega$、$k_t=k_e=0.02$（使用上述各自 SI 单位），稳态转速 $\omega_m=100\,\mathrm{rad/s}$。反电动势为 $2\,\mathrm V$，电流 $(6-2)/2=2\,\mathrm A$，故 $\tau_m=0.04\,\mathrm{N\,m}$。

采用 $N=20$、$\eta=0.75$ 的减速器，输出速度为 $5\,\mathrm{rad/s}$，输出转矩为 $0.6\,\mathrm{N\,m}$。输入电功率 $ui=12\,\mathrm W$；电阻热功率 $i^2R_e=8\,\mathrm W$；电机机械功率 $0.04\times100=4\,\mathrm W$；减速器输出 $0.6\times5=3\,\mathrm W$，能量账相符。这里未计电机机械摩擦，参数仅为教学合成值。

输出轴卷轮半径 $r=0.01\,\mathrm m$，无滑动、有效半径恒定时拉索收线量 $s=r\theta_j$，线速度 $v_s=r\omega_j$，张力 $F=\tau_j/r$。所以 $v_s=0.05\,\mathrm{m/s}$、$F=60\,\mathrm N$，并有 $Fv_s=3\,\mathrm W$。若允许行程仅 $s_{\max}=0.004\,\mathrm m$，轴角限位为 $0.4$ rad，而电机角需转 $8$ rad。请求 $0.6$ rad 会要求 $6$ mm，超过允许行程；不能因转矩足够就继续发命令。

## 5. 边界：拉索只能拉，柔软外皮不是刚性杆

上节 $F=\tau/r$ 是张紧且准静态的传力关系。单根松弛拉索不能推，模型需要 $F\ge0$ 和松弛状态；常用回位弹簧或拮抗双索补足反向运动。外皮弹性、绕线层数改变半径、摩擦和回差都可能让同一电机角对应不同眉部位置。

最简单弹性近似为 $F=k_s\delta$，其中 $k_s$ 为 N/m，$\delta$ 是张紧后的伸长米数；它不适用于松弛段。硬限位用于限定机械行程，软件限位还需为停止距离与标定误差留余量。具体电流和接触力上限应来自实际装置验证，本章 60 N 的算例绝不是人机接触建议值。

## 6. 自测与步骤答案

**题1。** $N=10$、$\eta=0.8$、电机转矩 $0.01\,\mathrm{N\,m}$、转速 $50\,\mathrm{rad/s}$，输出是多少？

**解。** 转矩 $0.8\times10\times0.01=0.08\,\mathrm{N\,m}$，转速 $50/10=5\,\mathrm{rad/s}$，输出功率 $0.4\,\mathrm W$，恰为输入机械功率 $0.5\,\mathrm W$ 的 80%。

**题2。** 半径 8 mm 的卷轮需收线 3.2 mm，求输出轴角。若 $L=0.004\,\mathrm H$、$R_e=2\,\Omega$，电气时间尺度是多少？

**解。** 先统一米：$\theta_j=0.0032/0.008=0.4$ rad。$L/R_e=0.002\,\mathrm s=2$ ms。若控制周期也是 2 ms，就应保留电流动态或验证内部电流环，不能仅凭稳态公式判断瞬态。

## 7. 可复现实验与出口

先做无硬件合成实验：在固定端电压6 V下枚举$\omega_m=0,50,100,150,200,250,300\,\mathrm{rad/s}$，计算电流、转矩、热功率与机械功率。第二组把6 V视作电源上限，加入2 A电流环；对限流点重新计算实际端电压，比较哪些点改变，并检查电功率$u_{\rm eff}i$与铜耗、机电转换功率的平衡。另画$s=r\theta_j$并标出4 mm行程界限。若后续实测，保存真实参数表、供电和负载条件，先在隔离接触的装置上测量角度与收线量，报告往返差和停止位置；本讲未执行这些实测。

出口：能用同一套单位核算速度、转矩、行程与功率，理解驱动命令为何受动态限制。电机模型可回查 [Asada，MIT《Introduction to Robotics》第 2 章](https://www.ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/9158f91fc935aae58345446fc110f6e7_chapter2.pdf)，传动问题可回查 [Modern Robotics 8.9](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-9-actuation-gearing-and-friction/)。

[上一章：R04 · 两只眼怎样看同一点：会聚、眼头分配与视觉反馈](/notes/robotics-11-binocular-gaze/) · [方向目录](/notes/direction-foundations/) · [下一章：R06 · 从读数到可信姿态：零位、回差与时间标定](/notes/robotics-05-sensing-calibration/)
