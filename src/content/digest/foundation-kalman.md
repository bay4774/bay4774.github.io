---
title: 'Kalman：怎样把预测与测量合成一个估计'
description: '从标量估计出发理解 Kalman 增益、噪声与协方差，再进入 1960 年原始论文。'
date: '2026-10-15'
tags: ['Foundations', 'Estimation', 'Dynamical Systems']
demo: false
draft: false
curated: true
foundationOrder: 5
originalTitle: 'A New Approach to Linear Filtering and Prediction Problems'
authors: 'R. E. Kalman'
lab: 'Research Institute for Advanced Study, Baltimore（原文首页）'
venue: 'Transactions of the ASME—Journal of Basic Engineering, 82(1): 35–45'
year: 1960
rating: 'must-read'
stars: 5
method: '用状态空间与正交投影将线性估计写成递推，并递推估计误差协方差。'
verdict: '先掌握一维预测和更新，再阅读一般矩阵推导；区分模型误差与观测误差。'
readTime: 8
week: '2026-W42'
originalUrl: 'https://doi.org/10.1115/1.3662552'
related: ['foundation-robbins-monro', 'foundation-operational-space']
---

本文是**基础阅读导引**。个人逐段阅读与验证进度私存；发表时间与收录状态不表示个人学习完成。建议先看[科研基础总路线](/notes/research-foundations-roadmap/)与[论文阅读方法](/notes/foundations-paper-reading/)。

## 先带着一个问题读

假设温度传感器有噪声，而你对上一时刻温度也有一个不完全准确的估计。新的读数出现时，该信它多少？Kalman 的论文把这一类问题写成动态系统的状态估计，并用误差协方差决定如何递推。[原始论文 DOI](https://doi.org/10.1115/1.3662552)

阅读前应能算矩阵乘法与转置，理解均值、方差、协方差、条件期望和线性差分方程。可回到[第05章矩阵映射](/notes/foundations-05-matrices-maps/)、[第39章线性高斯模型](/notes/foundations-39-gaussians/)与[第52章状态转移](/notes/foundations-52-transition-matrices/)。完整Kalman递推还需专门的状态估计补课；先用下方标量融合例选读。

## 先理解一条更新式

对一维、直接测量状态的情形，使用现代讲义中常见的记号：

$$
\hat x_t^{+}=\hat x_t^{-}+K_t\bigl(z_t-\hat x_t^{-}\bigr),
\qquad K_t=\frac{P_t^{-}}{P_t^{-}+R}.
$$

$\hat x_t^{-}$ 是看到本次测量前的预测，$\hat x_t^{+}$ 是更新后估计，$z_t$ 是测量，$P_t^{-}$ 是预测误差方差，$R$ 是测量噪声方差，$K_t$ 是增益。括号里的量称为新息：测量与预测之间的差。

当 $P_t^{-}$ 相对于 $R$ 更大时，增益更大，测量推动估计的程度也更大。这里假设噪声符合模型所需的独立性/不相关条件，且观测矩阵在这个标量例子中为 1。它是帮助入门的现代写法；历史原文通过扩展状态等方式处理观测，不应逐字强套符号。[NTNU 公开的原文重印及评注](https://skoge.folk.ntnu.no/puublications_others/1960_Kalman%20-%20A%20new%20approach%20to%20linear%20filtering%20and%20prediction%20problems%20-%20Orinal%20version%20with%20comments.pdf)

## 原文选读位置

第一轮读 Introduction 与论文的阅读导引，再找估计问题定义、Optimal Estimates and Orthogonal Projections，以及递推主结果。每读一处，都用标量随机游走画出“预测—新测量—更新”。第二轮才读一般矩阵形式、Riccati 方程与控制对偶性。NTNU 链接收录原文重印和后来评注；参考文献仍使用 **1960 年原始期刊 DOI**，不要误写为选集重印年的论文。

## 一个可以验算的最小实验

先手算：令预测均值为 0、预测方差为 1.1、$R=1$、新读数为 2。应得到 $K=1.1/2.1\approx0.52381$，更新均值约为 1.04762；标量后验方差为 $(1-K)P^{-}\approx0.52381$。

随后模拟 $x_t=x_{t-1}+w_t$、$z_t=x_t+v_t$，设 $w_t\sim\mathcal N(0,0.1)$、$v_t\sim\mathcal N(0,1)$。这里正态分布的第二个参数表示方差，过程噪声方差记为 $Q=0.1$，观测噪声方差为 $R=1$；两类噪声跨时刻独立，且与初始状态独立。实现预测与更新，固定种子，并在多个种子上比较滤波估计与原始测量的均方根误差（RMSE）。保存轨迹、误差曲线、模型参数与初值。正确设定模型时，预期重复实验的平均估计误差改善；不要求每条随机轨迹都优于传感器。

## 哪里不能直接套用

线性估计的最优性与线性高斯条件下条件均值的最优性需要区分。错误的 $Q/R$、离群测量、非线性和未建模偏差都可能导致失效；低协方差数值并不自动证明估计可信。不要把这篇论文的结论直接推广到任意非线性系统。

完成标准是能独立解释每个方差的来源、复核上述手算，并说明模型失配怎样改变结果。本页不报告引用数：本次 SciSpace 同题名检索命中过另一个 DOI 的选集重印，未将该计数合并到原始记录。
