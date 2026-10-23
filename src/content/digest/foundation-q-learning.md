---
title: 'Q-learning：从一次经历学习长期选择'
description: '在有限表格环境中连接条件期望、Bellman 方程和随机逼近，明确收敛定理的条件。'
date: '2026-10-15'
tags: ['Foundations', 'Domain Bridge', 'Reinforcement Learning']
demo: false
draft: false
curated: true
foundationOrder: 7
originalTitle: 'Q-learning'
authors: 'Christopher J. C. H. Watkins, Peter Dayan'
lab: '以原文首页署名为准'
venue: 'Machine Learning, 8: 279–292'
year: 1992
rating: 'must-read'
stars: 5
method: '用实际观察到的奖励与后继状态，对表格动作价值进行异步随机更新。'
verdict: '先把有限表格问题与收敛条件学清，再进入用神经网络表示价值函数的方法。'
readTime: 8
week: '2026-W42'
originalUrl: 'https://link.springer.com/article/10.1007/BF00992698'
related: ['foundation-robbins-monro', 'foundation-backprop']
---

本文是**基础阅读导引与决策学习桥梁**。个人逐段阅读与验证进度私存，以下练习不表示已经完成复现。不是所有科研方向都需要优先学习这一模块；先按[科研基础总路线](/notes/research-foundations-roadmap/)打好主干，再使用[论文阅读方法](/notes/foundations-paper-reading/)整理自己的问题。

## 先带着一个问题读

一个动作眼下没有奖励，却可能通向以后获得奖励的状态。我们如何只靠经历，逐步学会评估这个动作？Watkins 与 Dayan 的论文给出了有限表格 Q-learning 的收敛证明。[正式论文](https://link.springer.com/article/10.1007/BF00992698)

先修包括条件期望、马尔可夫性质、折扣回报、Bellman 方程和随机逼近。能解释状态、动作、奖励、策略的区别；知道折扣因子 $\gamma$ 不等于学习率 $\alpha$。若不满足，先补概率、马尔可夫过程与动态规划。

## 一条更新式在做什么

对一次经历 $(s_t,a_t,r_t,s_{t+1})$：

$$
Q_{t+1}(s_t,a_t)=Q_t(s_t,a_t)+\alpha_t\left[r_t+\gamma\max_aQ_t(s_{t+1},a)-Q_t(s_t,a_t)\right].
$$

$Q_t(s,a)$ 是对“在状态 $s$ 选动作 $a$ 后，未来最优折扣回报”的当前估计；$r_t$ 是本次奖励；$\gamma\in[0,1)$ 折扣未来；$\alpha_t$ 决定本次样本影响多大。括号内是时序差分误差。未访问的表项本步保持原值，终止状态的后续价值设为 0。

这一表格更新与优化损失的普通梯度下降需要分别理解；它借助 Bellman 最优性关系，逐步调整动作价值。[作者原文 PDF](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf)

## 原文选读位置

第一轮：§1 Introduction；§2 The task for Q-learning 中的问题、更新与定理条件；§3 The convergence proof 的思路。先列出假设，不必强行一次读完附录的 action-replay process。第二轮补充收缩映射和随机收敛知识后再读完整证明与 §4 扩展。

## 一个最小、可核对的实验

构造 4×4 网格：起点左上、终点右下，动作上下左右，撞边保持原位，每步奖励 −1，到终点奖励 0 并结束，$\gamma=0.9$。先用已知模型做价值迭代，得到参考最优值；再仅通过交互进行表格 Q-learning。对每个状态动作单独记录访问次数 $N(s,a)$，采用递减步长，并记录探索策略与随机种子。

画学习策略的回报、相对于参考值的最大误差以及 Bellman 残差。预期充分学习后，起点的贪心路径可达到 6 步最短路径，价值表逐渐接近参考解。六步可能有多条同样好的路径，不能因箭头不同就判断失败；有限训练结果也不等于证明无穷时间收敛。

## 收敛条件是正文的一部分

定理依赖有限离散表示、适当奖励与折扣条件、各状态动作的充分访问，以及逐状态动作满足条件的学习率。要区分有限次探索和“每个相关状态动作无限次访问”的理论要求。持续固定探索时应另做无探索评估，否则评价回报会混入随机动作的损失。

不能把这个表格收敛定理直接当成深度 Q 网络的保证。函数逼近、非平稳环境、部分观测和有限数据都会改变问题。本页省略引用计数：本次检索发现同题名的多个 DOI 记录，没有将不同记录的计数擅自合并。

书目信息以[出版社原始 DOI](https://doi.org/10.1007/BF00992698)与[作者书目](https://www.gatsby.ucl.ac.uk/~dayan/papers/wd92.html)为准。
