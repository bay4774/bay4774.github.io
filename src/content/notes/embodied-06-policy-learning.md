---
title: 'E09 · 策略梯度：从轨迹概率到优势'
description: '在有限时域下逐步推出对数概率梯度，解释回报到达、状态基线与优势，并手算双动作策略更新。'
date: '2026-10-17'
tags: ['Embodied AI', 'Direction Foundations']
category: 'lecture'
directionTrack: 'embodied'
directionChapter: 9
readTime: 32
chapters: 7
demo: false
draft: false
---

## 1. 本章使用哪一种目标

先修：[38章联合分布](/notes/foundations-38-joint-distributions/)、[72章随机梯度](/notes/foundations-72-stochastic-gradients/)、[E06价值](/notes/embodied-05-mdp-bellman/)与[E08动作分布](/notes/embodied-10-policy-parameterization/)。本章固定有限时域$H$，采用不折扣目标$J(\theta)=\mathbb E_{\tau\sim\pi_\theta}[R(\tau)]$，其中$R(\tau)=\sum_{t=0}^{H-1}R_{t+1}$。

这里不把无折扣目标与折扣实现混用。随机策略参数$\theta\in\mathbb R^q$，学习是做梯度上升$\theta\leftarrow\theta+\eta\nabla J$，$\eta>0$。环境转移、初始分布及奖励机制不直接依赖$\theta$，它们只通过动作间接受影响。为使下一节的轨迹记号完整，本推导取确定性奖励$R_{t+1}=r(s_t,a_t,s_{t+1})$；若奖励随机，应将奖励观测也纳入轨迹并包含其条件概率。以下在有限离散轨迹下推导，避开无条件交换积分和导数的问题。

## 2. 为什么可以不对环境求导

轨迹$\tau=(s_0,a_0,s_1,\ldots,a_{H-1},s_H)$的概率为

$$
p_\theta(\tau)=\rho_0(s_0)\prod_{t=0}^{H-1}\pi_\theta(a_t\mid s_t)P(s_{t+1}\mid s_t,a_t).
$$

在策略支持固定且概率为正的范围，$\nabla p=p\nabla\log p$。对乘积取对数后，环境项不依赖参数，其导数为零，因此

$$
\nabla\log p_\theta(\tau)=\sum_t\nabla\log\pi_\theta(a_t\mid s_t).
$$

再对有限求和目标求导：

$$
\nabla J=\sum_\tau R(\tau)\nabla p_\theta(\tau)
=\mathbb E_\tau\left[R(\tau)\sum_t\nabla\log\pi_\theta(a_t\mid s_t)\right].
$$

我们不必知道转移的解析导数，只需能运行环境并计算自己策略的对数概率导数。样本估计用$N$条当前策略轨迹取平均；动作越常出现在高回报轨迹上，更新越倾向增加其概率。它是统计归因，不意味着一条好轨迹里的每个动作都真正有益。[OpenAI官方Spinning Up原始讲义源码](https://github.com/openai/spinningup/blob/master/docs/spinningup/rl_intro3.rst)给出这一推导及基线关系。

## 3. 只用未来回报，减去状态基线

在时刻$t$采取动作之前，过去奖励已经发生。对任何已知状态$s$，

$$
\mathbb E_{a\sim\pi}[\nabla\log\pi(a\mid s)]
=\sum_a\nabla\pi(a\mid s)=\nabla1=0.
$$

因此与当前动作无关的已发生回报项，对梯度期望没有贡献。可把整条轨迹回报替换为$G_t=\sum_{k=t}^{H-1}R_{k+1}$。同样，减去不依赖当前动作的基线$b_t(s_t)$不改变期望：

$$
\nabla J=\mathbb E\sum_t\nabla\log\pi_\theta(a_t\mid s_t)[G_t-b_t(s_t)].
$$

选择$b_t=V_t^\pi$，条件期望中的权重变成优势$A_t^\pi(s,a)=Q_t^\pi(s,a)-V_t^\pi(s)$。它表示在该状态下，某动作相对当前策略平均水平好多少。有限时域价值带$t$，因为剩余时间改变价值。

从数据拟合的近似基线可降低方差，但如果基线依赖当前动作，或者估计过程与样本耦合处理不当，不能直接套“不变期望”的证明。用于策略损失的回报或基线通常应作为固定权重，不把其参数梯度混入上述估计。

## 4. 单步任务的精确核验

两个动作$a\in\{0,1\}$，奖励分别0和1。令$p=\pi_\theta(1)=\sigma(\theta)=1/(1+e^{-\theta})$。期望回报$J=p$，直接求导得$J'=p(1-p)$。

在$\theta=0$时$p=1/2$，$\partial_\theta\log\pi(a)=a-p$。不用基线，采到1时估计为$(1-1/2)\cdot1=1/2$，采到0时为0，两种概率各半，平均梯度$1/4$，与直接导数一致。

使用基线$b=V=p=1/2$，采到1时权重$1-1/2=1/2$，梯度$1/4$；采到0时权重$-1/2$，梯度$(-1/2)(-1/2)=1/4$。本例两种样本都给相同梯度，方差降为零；这只是特殊算例，不是任意价值基线都消除方差。用$\eta=0.4$更新到$\theta'=0.1$，新$p\approx0.52498$。

## 5. 误用与边界

若把随机策略换成确定性argmax，普通离散动作的对数概率梯度不再按上述方式定义。若用很旧策略收集的数据，却当作当前策略样本取平均，也不满足本章采样分布，需额外的分布校正或重新采样。

优势为负不等于动作绝对没有收益：两个动作回报分别8和10，平均9时，8仍是正奖励，却低于当前平均。策略梯度也可能因大步长变差，单次样本梯度无须与期望梯度同向，不能把“无偏”解释为“每次都提升”。

## 6. 独立自测与步骤答案

1. 单步奖励改为$a=0$得2、$a=1$得4，$p=1/2$，求$J'$，并用$b=3$核验两个样本梯度。
2. 两步奖励为$1,3$，两时刻分别使用的未来回报是多少？
3. 为什么随动作变化的$b(s,a)=Q(s,a)$不能直接当作无偏状态基线减去？

答案：①$J=2(1-p)+4p=2+2p$，所以$J'=2p(1-p)=1/2$。两样本分别$(-1/2)(2-3)=1/2$、$(1/2)(4-3)=1/2$。②$G_0=4,G_1=3$；第二动作不能改变已得到的1。③$\sum_a\pi\nabla\log\pi\,b(s,a)$一般不为零；若直接减掉全部$Q$，甚至可能把要学习的信号消掉。

## 7. 可复现实验与出口

对第4节单步任务，用种子0至9各运行100轮，每轮从当前策略采32个动作，分别用无基线和精确$b=p$估计梯度，学习率0.1。逐轮保存$p$、批梯度、平均奖励；再在固定$p=1/2$下采100批以比较估计方差。不能把训练中$p$变化的不同批次直接当成同分布方差样本。本实验尚未运行。

出口是能从轨迹概率推出梯度，解释基线为何不依赖动作，并用一个精确任务核验实现的方向与大小。

[上一章：E08 · 动作分布：离散策略与连续策略](/notes/embodied-10-policy-parameterization/) · [方向总目录](/notes/direction-foundations/) · [下一章：E10 · 学习信号：奖励、探索与时间信用](/notes/embodied-11-reward-exploration/)
