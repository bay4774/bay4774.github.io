---
title: 'E08 · 动作分布：离散策略与连续策略'
description: '从网络输出到可采样动作，解释categorical、Gaussian、对数概率、动作缩放与饱和的差别。'
date: '2026-10-17'
tags: ['Embodied AI', 'Direction Foundations']
category: 'lecture'
directionTrack: 'embodied'
directionChapter: 8
readTime: 25
chapters: 7
demo: false
draft: false
---

## 1. 策略输出究竟是什么

先修：[36章随机变量](/notes/foundations-36-random-variables/)、[39章高斯](/notes/foundations-39-gaussians/)、[29章变量替换](/notes/foundations-29-change-of-variables/)和[E02](/notes/embodied-02-supervised-learning/)、[E07](/notes/embodied-09-value-learning/)。本章把策略$\pi_\theta(a\mid z)$定义为给定表示$z\in\mathbb R^d$后的动作分布，参数$\theta\in\mathbb R^q$。

确定性策略直接输出动作$\mu_\theta(z)\in\mathbb R^m$；随机策略先输出分布参数，再采样动作。输出均值与实际采样值不是同一对象。两者部署表现也可能不同，应明确评估究竟使用哪种动作规则。[Spinning Up官方概念材料](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)给出离散与连续策略的基本参数化。

## 2. 离散动作：从分数到概率

若有$K$个动作，网络输出分数$l\in\mathbb R^K$，令$p_j=e^{l_j}/\sum_ke^{l_k}$。对动作$a=j$，$\log\pi_\theta(a\mid z)=l_j-\log\sum_ke^{l_k}$。实现时先减去$\max_k l_k$，不改变比值却避免指数溢出。

对分数$l_k$求导：分子对应的导数为$\mathbf1_{k=j}$，归一化项的导数为$p_k$，所以

$$
\frac{\partial\log\pi(j\mid z)}{\partial l_k}=\mathbf1_{k=j}-p_k.
$$

这让一个动作概率变化同时影响其余动作，不能把每个动作当作互不相关的二分类。若有不可行动作，应先定义其合法性掩码，再在合法集合内重新归一化。所有动作都被屏蔽时必须返回明确失败或预定义的合法等待动作。

## 3. 连续动作：均值、方差与密度

取$m$维对角高斯：$a=\mu_\theta(z)+\sigma_\theta(z)\odot\epsilon$，$\epsilon\sim\mathcal N(0,I_m)$。均值和标准差都是$m$维，$\sigma_j>0$；可输出任意实数的$\log\sigma_j$，再指数化。

对角协方差意味着给定$z$后动作各维独立，这是模型假设。对数密度为

$$
\log\pi(a\mid z)=-\frac12\sum_{j=1}^m\left[\frac{(a_j-\mu_j)^2}{\sigma_j^2}+2\log\sigma_j+\log(2\pi)\right].
$$

密度可大于1；连续动作恰等于某个指定向量的概率仍为0。固定$\sigma$时，对均值求导得$(a_j-\mu_j)/\sigma_j^2$，它是下一章策略梯度中需要的对数概率导数。若同时学习尺度，则对$\log\sigma_j$的导数为$(a_j-\mu_j)^2/\sigma_j^2-1$。

## 4. 两个可核验算例

离散取$l=(0,\log3)$，指数为$(1,3)$，概率$(1/4,3/4)$。采到第二动作时，对分数梯度为$(-1/4,1/4)$；对数概率为$\log(3/4)\approx-0.2877$。如果只采用最大分数动作，第二动作永远执行，这已经不再是按该分布采样。

连续取一维$\mu=0.2,\sigma=0.5,\epsilon=-1$，则动作$a=0.2-0.5=-0.3$。标准化残差为$-1$，对数密度为$-0.5-\log0.5-0.5\log(2\pi)\approx-0.7258$。对均值导数$(a-\mu)/\sigma^2=-0.5/0.25=-2$；对$\log\sigma$的导数$1-1=0$。注意$\sigma^2=0.25$才是方差。

## 5. 动作范围不是事后小细节

真实执行器通常有界。若高斯样本$v$被裁剪成$a=\operatorname{clip}(v,-1,1)$，边界会积累点概率，实际动作分布已不是原高斯。用裁剪后的$a$直接代入高斯密度，会把“执行的动作”和“用于更新的概率模型”混淆。

另一方式是$a=c\tanh v$，其中$c>0$给动作幅度；对$|a|<c$，变换后一维密度需加Jacobian修正：$\log p(a)=\log p(v)-\log[c(1-\tanh^2v)]$。这来自变量替换，不是额外奖励。接近边界时还要注意数值稳定。入口实验可先采用有界离散动作，避免将尚未理解的连续变换直接带入学习。

## 6. 独立自测与步骤答案

1. 两个logit都加100，概率改变吗？为什么减最大值有用？
2. $\mu=1,\sigma=2,a=3$，对均值的对数密度导数是多少？误把标准差当方差会得到什么？
3. 策略采样时允许动作$-1,0,1$，测试时固定取均值0。这是否是同一行动规则？

答案：①分子分母同乘$e^{100}$，比值不变；减最大值使指数不超过1。②导数$(3-1)/4=0.5$；错用分母2会得1。③不是，原分布可能靠随机左右移动完成任务，均值可能从不前进；必须分别说明并评价。

## 7. 可复现实验与出口

固定种子11，从$p=(0.25,0.75)$采样1000次，记录频率及两种动作的对数概率；与总取最大概率动作的频率比较。再对第4节高斯生成1000个动作，保存原动作和裁剪到$[-0.5,0.5]$后的动作，统计边界频数。有限频率不会精确等于概率，本章不声称实验已运行。

出口是能从分布参数采样、计算对数概率并核对梯度，知道何时概率模型与执行动作不一致。下一章用这些导数调整策略。

[上一章：E07 · 从轨迹学价值：Monte Carlo与时序差分](/notes/embodied-09-value-learning/) · [方向总目录](/notes/direction-foundations/) · [下一章：E09 · 策略梯度：从轨迹概率到优势](/notes/embodied-06-policy-learning/)
