---
title: 'E06 · 有限MDP：奖励、价值与Bellman递推'
description: '从有动作的Markov过程定义长期价值，推导固定策略和最优Bellman方程，并手算一个两状态任务。'
date: '2026-10-17'
tags: ['Embodied AI', 'Direction Foundations']
category: 'lecture'
directionTrack: 'embodied'
directionChapter: 6
readTime: 30
chapters: 7
demo: false
draft: false
---

## 1. 先修与决策对象

先修：[51章动态规划](/notes/foundations-51-dynamic-programming/)、[52章转移矩阵](/notes/foundations-52-transition-matrices/)、[37章期望](/notes/foundations-37-expectation-variance/)和[E04](/notes/embodied-04-state-estimation/)。本章暂时假设状态完全可见，解决“眼前收益小的动作，是否可能长期更好”。

有限Markov决策过程（MDP）由有限状态集$\mathcal S$、各状态的有限动作集$\mathcal A(s)$、转移概率$P(s'\mid s,a)$、期望即时奖励$r(s,a)$、初始分布$\rho_0$及折扣$0\leq\gamma<1$组成。每个状态动作对应的转移概率非负且和为1。Markov条件是给定当前状态动作后，下一状态分布不再依赖更早历史；不是“系统没有历史”，而是历史的预测作用已被状态概括。

策略$\pi(a\mid s)$是状态条件下的动作分布。固定策略会把有动作的系统变成Markov链：$P_\pi(s,s')=\sum_a\pi(a\mid s)P(s'\mid s,a)$。不能把概率转移矩阵本身当作动作选择规则。[Berkeley CS188的MDP课程](https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/markov-decision-processes.html)可核对这一建模框架。

## 2. 从回报拆出价值递推

在动作$a_t$后收到标量奖励$R_{t+1}$，其条件期望是$r(s_t,a_t)$。回报定义为$G_t=\sum_{k=0}^{\infty}\gamma^kR_{t+k+1}$。若奖励绝对值有界于$M$，则$|G_t|\leq M/(1-\gamma)$，无穷和有意义。

状态价值$V^\pi(s)=\mathbb E_\pi[G_t\mid s_t=s]$，动作价值$Q^\pi(s,a)=\mathbb E_\pi[G_t\mid s_t=s,a_t=a]$。将回报第一项分离：$G_t=R_{t+1}+\gamma G_{t+1}$。再依次对动作与下一状态取条件期望：

$$
Q^\pi(s,a)=r(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V^\pi(s'),
$$
$$
V^\pi(s)=\sum_a\pi(a\mid s)Q^\pi(s,a).
$$

这是固定策略的Bellman期望方程。将所有状态价值排为$V\in\mathbb R^n$，$n=|\mathcal S|$，定义$r_\pi(s)=\sum_a\pi(a\mid s)r(s,a)$，得到$(I-\gamma P_\pi)V=r_\pi$。已知模型时可解此线性系统。

## 3. 最优价值为什么用最大值

最优值$V^\star(s)=\sup_\pi V^\pi(s)$。在有限、平稳、折扣条件下，最优平稳确定性策略存在，最优Bellman关系是

$$
V^\star(s)=\max_{a\in\mathcal A(s)}\left[r(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V^\star(s')\right].
$$

这与固定策略方程的区别，是把“按策略加权”改为“选最好动作”。定义右侧算子$T$。对两个向量$V,W$，每个动作的加权差不超过$\gamma\|V-W\|_\infty$，最大值之差也不超过同一界，因此$\|TV-TW\|_\infty\leq\gamma\|V-W\|_\infty$。折扣使更新收缩，反复做$V_{k+1}=TV_k$会趋向唯一固定点。它不保证未知模型下任意神经网络训练收敛。

## 4. 两状态手算及核验

状态为工作$W$与终止$T$。终止后的价值为0。工作时可选择“退出”：奖励2并终止；或“继续”：奖励1，并以概率$1/2$返回$W$、$1/2$终止。令$\gamma=0.8$。

始终继续的策略满足$V=1+0.8(0.5V+0.5\cdot0)$，故$0.6V=1$，$V=5/3$。退出则价值2。检验候选最优值$V^\star(W)=2$：退出的$Q=2$，继续的$Q=1+0.4(2)=1.8$，最大值仍为2，所以退出最优。

从$V_0(W)=0$开始价值迭代，$V_1=\max(2,1)=2$，$V_2=\max(2,1.8)=2$，与固定点一致。若继续奖励改为1.5，则候选继续价值$V=1.5+0.4V=2.5$；再验退出2、继续2.5，最优动作发生改变。比较动作时必须包含后续价值，不能只比即时的2与1.5。

## 5. 有限时域与状态边界

若任务只剩$H$步，终端价值$V_H=0$，反向递推$V_t(s)=\max_a[r(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V_{t+1}(s')]$。同一物理位置在剩余时间不同的时候可能需要不同动作，应把剩余时间加入状态，或使用显式依赖$t$的价值和策略。

当$\gamma=1$且系统可永久获得奖励1时，总回报发散，本章的收缩证明失效。把单张图像当状态也不自动满足Markov条件：若图像不能区分速度，下一状态可能依赖此前历史。MDP是一个需要检验的建模假设。

## 6. 独立自测与步骤答案

1. 第4节继续奖励为1、返回概率为0.75时，始终继续的价值是多少？它是否优于退出？
2. 奖励轨迹为$2,0,4$，$\gamma=0.5$，计算初始回报。
3. 已知$V_k$的Bellman残差$\|TV_k-V_k\|_\infty=0.02$，$\gamma=0.9$，推导其距固定点的上界。

答案：①$V=1+0.8(0.75)V$，所以$V=2.5>2$；核验继续在2.5处给2.5，退出2，继续最优。②$2+0.5(0)+0.25(4)=3$。③三角不等式给$\|V_k-V^\star\|\leq0.02+0.9\|V_k-V^\star\|$，移项后不超过0.2；是误差上界，不是误差恰为0.2。

## 7. 可复现实验与出口

实现第4节价值迭代，扫描继续奖励$0.5,1,1.5,2$和返回概率$0.25,0.5,0.75$。固定$\gamma=0.8$，每次从零初始化，直到最大更新差小于$10^{-8}$。记录最优动作、价值、迭代次数，用候选“始终继续”解析值$r/(1-0.8p)$和退出2交叉核对。全部为合成有限MDP；实验尚未执行。

出口是能区分奖励、回报、状态价值和动作价值，并能解释一个Bellman更新的每一项。下一章在不知道转移概率时，从交互样本估计价值。

[上一章：E05 · 不靠试错也能决策：模型预测与滚动规划](/notes/embodied-13-model-planning/) · [方向总目录](/notes/direction-foundations/) · [下一章：E07 · 从轨迹学价值：Monte Carlo与时序差分](/notes/embodied-09-value-learning/)
