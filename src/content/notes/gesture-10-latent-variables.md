---
title: 'G07 · 给同一句话留下选择：潜变量与条件 VAE'
description: '从条件混合分布建立潜变量模型，推导变分下界、重参数采样与高斯 KL，说明训练推理差异和潜变量坍缩。'
date: '2026-10-17'
tags: ['Co-speech Gesture', 'Direction Foundations']
category: 'lecture'
directionTrack: 'gesture'
directionChapter: 7
readTime: 35
chapters: 7
demo: false
draft: false
---

先修：[G05 一对多](/notes/gesture-04-conditional-generation/)、[38 联合分布](/notes/foundations-38-joint-distributions/)、[39 高斯分布](/notes/foundations-39-gaussians/)、[42 似然](/notes/foundations-42-likelihood/)、[74 反向模式](/notes/foundations-74-reverse-mode/)。本章先解释随机变量在整段动作里承担什么作用，再介绍 VAE，而不是从网络名称开始。

## 1. 用未观测的选择解释多种合理轨迹

条件 $C$ 包含语音和可用语境，动作片段 $Y\in\mathbb R^{T\times D}$ 已标准化。潜变量 $z\in\mathbb R^d$ 无量纲，表示条件没有完全确定的动作选择。模型定义 $p_\theta(Y\mid C)=\int p_\theta(Y\mid z,C)p(z)\,dz$，这里先取先验 $p(z)=\mathcal N(0,I_d)$。

先抽 $z$ 再生成整段动作，能让同段中的选择保持一致；$z$ 并不天然等于情绪、身份或明确可解释的风格。模型可能把任何训练中有用的剩余差异塞进去。若改用条件先验 $p(z\mid C)$，训练与推理也必须用同一条件先验，不能混用公式。

## 2. 编码器解决训练时的推断问题

直接求上面的积分常常困难。VAE 引入近似后验 $q_\phi(z\mid Y,C)$，训练时用已观察的动作 $Y$ 帮助判断什么潜变量能解释它；解码器 $p_\theta(Y\mid z,C)$ 则把潜变量和条件转成动作分布。$\theta,\phi$ 是两组待学习参数，不能因都叫网络就混为同一个条件函数。

推理时真实动作未知，因此不能将测试参考动作送进编码器再声称“仅语音生成”。正常生成先从 $p(z)$ 采样，再输入 $C$ 解码。使用真实 $Y$ 编码再重建测的是重建能力，与从先验生成的能力不同。

## 3. 逐步推导变分下界

固定 $Y,C$，在概率密度有适当支持且积分存在时，将 $q$ 乘除进去：

$$
\log p_\theta(Y\mid C)=\log\mathbb E_{q_\phi}\!\left[\frac{p_\theta(Y\mid z,C)p(z)}{q_\phi(z\mid Y,C)}\right].
$$

对数是凹函数，Jensen 不等式给 $\log\mathbb E U\ge\mathbb E\log U$，所以得到证据下界（ELBO）

$$
\log p_\theta(Y\mid C)\ge
\mathbb E_q\log p_\theta(Y\mid z,C)-D_{\mathrm{KL}}(q_\phi\|p).
$$

$D_{\mathrm{KL}}(q\|p)=\int q(z)\log[q(z)/p(z)]\,dz$ 衡量两个分布的差异，使用自然对数时单位为 nat；它非负但不对称。若 $q$ 在 $p=0$ 的地方有正概率，KL 可为无穷。训练通常最小化负下界：重建负对数似然加 KL，而不是把两项随意命名成“准确率”和“多样性”。

Jensen这一步可以从对数的切线看出：对$u>0$和$m=\mathbb E U>0$，$\log u\le\log m+(u-m)/m$，取期望后第二项为0。另用Bayes公式展开可得$\log p_\theta(Y\mid C)-\mathrm{ELBO}=D_{\rm KL}[q_\phi(z\mid Y,C)\|p_\theta(z\mid Y,C)]$。因此下界与真实对数似然的间隙来自近似后验，不是训练样本误差的另一个名字；后验精确时这一间隙才为0。

若解码分布为固定方差的高斯，负对数似然含缩放后的平方误差和归一化常数；只保留 MSE 是特定假设下的简化。人为将 KL 乘 $\beta\ne1$ 常用于调整训练权衡，但该新目标通常不再等于原模型的负 ELBO。

## 4. 重参数化和高斯 KL 的手算

令 $q_\phi=\mathcal N(\mu,\operatorname{diag}(\sigma^2))$，$\mu,\sigma\in\mathbb R^d$，$\sigma_i>0$。通过 $\epsilon\sim\mathcal N(0,I)$、$z=\mu+\sigma\odot\epsilon$ 采样，其中 $\odot$ 为逐元素乘。随机性来自 $\epsilon$，$\mu,\sigma$ 仍在可微计算路径上。常预测 $\log\sigma^2$，再指数变换保证正方差。

高斯KL也可以从密度直接算。先取一维，$\log[q(z)/p(z)]=-\log\sigma-(z-\mu)^2/(2\sigma^2)+z^2/2$。对$q$取期望，利用$\mathbb E_q(z-\mu)^2=\sigma^2$和$\mathbb E_qz^2=\mu^2+\sigma^2$，得到$\frac12(\mu^2+\sigma^2-1-\log\sigma^2)$。对角协方差时对各维相加；若有非零相关项，则不能直接逐维套这个式子。

一维取 $\mu=1,\sigma=0.5$，得到 $\frac12[1+0.25-1-\log0.25]\approx0.818147$ nat。注意$\sigma$是标准差，代入对数与平方项的是$\sigma^2=0.25$。

完整单样本例：$\epsilon=1$ 给 $z=1.5$；解码器设 $p(Y\mid z)=\mathcal N(z,0.25)$，观察 $Y=1$。负对数似然为 $\frac12\log(2\pi\times0.25)+(1-1.5)^2/(2\times0.25)\approx0.725791$。加 KL 得 $1.543938$。这里的重建项是一次 Monte Carlo 抽样值，不是已经算出期望；换一个 $\epsilon$ 会变化，KL 则是解析值。

## 5. 边界：有噪声输入不保证有多样动作

若强解码器仅凭语音和历史就能降低训练损失，可能忽略 $z$，同时让 $q\approx p$ 以减小 KL。这种后验坍缩可能使不同 $z$ 生成近乎相同动作。检查方法包括固定同一 $C$ 改变 $z$，同时比较动作变化、语音匹配与逐维 KL；只看总训练损失不足以判断。

反过来，极小 KL 权重可令重建很好，但编码器潜分布与先验脱节，从标准正态抽样时落入训练很少访问的区域。潜空间插值产生平滑数值也不等于中间动作语义合理。还应检查骨架合法性、时间一致性和不同采样能否保持条件相关。

选择潜变量维数要结合样本量、片段长度、控制需求与运行时预算。快速单次解码有利于低延迟，但不是 VAE 自动优于其他模型的保证；需要在相同表示、条件与评估协议下比较。

## 6. 自测与步骤答案

**题1。** $q=\mathcal N(0,1)$、$p=\mathcal N(0,1)$ 时 KL 多少？能否据此断言生成效果很好？

**解。** 代入得 $\frac12(0+1-1-\log1)=0$。只说明这两个潜变量分布相同；若解码器忽略潜变量并生成静止，KL 仍可为零，因此还要看生成动作。

**题2。** $\mu=2,\sigma=0.5,\epsilon=-1$ 时 $z$ 为多少？测试时能否用未知参考动作计算 $\mu$？

**解。** $z=2+0.5(-1)=1.5$。正常仅语音生成不能使用测试参考动作；应由先验抽样，或使用任务允许的条件先验。使用真实动作编码必须单独称重建实验。

## 7. 可复现实验与出口

先不训练大网络，在一维高斯例上用固定随机种子抽取 10000 个 $\epsilon$，比较 $z$ 的经验均值方差与设定 $\mu,\sigma^2$；计算重建负对数似然的 Monte Carlo 均值，并保留解析 KL。然后在 G05 的两条镜像曲线上比较“整段共享 z”与“每帧独立 z”对连续性的影响。下一阶段再训练小型条件 VAE，分别报告重建与先验采样，不把两者混表。此处未声称训练已执行。

出口：能写出训练和生成两条不同的数据路径，知道每项损失的概率含义。原始来源：[Kingma 与 Welling，Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)；上述高斯数值为本章合成例，非原论文结果。

[上一章：G06 · 条件怎样跨时间起作用：卷积、记忆与注意力](/notes/gesture-12-temporal-modeling/) · [方向目录](/notes/direction-foundations/) · [下一章：G08 · 从噪声逐步得到动作：条件扩散的训练与采样](/notes/gesture-05-generative-models/)
