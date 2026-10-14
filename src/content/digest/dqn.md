---
title: 'DQN：从视觉输入学习动作价值'
description: '经典论文导读：经验回放和目标网络如何帮助学习动作价值，并明确游戏结果与机器人控制的区别。'
date: '2026-10-15'
tags: ['Reinforcement Learning', 'Embodied AI']
demo: false
draft: false
curated: true
featured: true
originalTitle: 'Human-level control through deep reinforcement learning'
authors: 'Volodymyr Mnih, Koray Kavukcuoglu, David Silver, Andrei A. Rusu, Joel Veness, Marc G. Bellemare, Alex Graves, Martin Riedmiller, Andreas K. Fidjeland, Georg Ostrovski, Stig Petersen, Charles Beattie, Amir Sadik, Ioannis Antonoglou, Helen King, Dharshan Kumaran, Daan Wierstra, Shane Legg, Demis Hassabis'
lab: 'Google DeepMind'
venue: 'Nature'
year: 2015
rating: 'must-read'
stars: 5
method: '用深度网络估计离散动作价值，并结合经验回放与定期更新的目标网络。'
verdict: '推荐作为感知到动作学习的历史基线；Atari表现不等于连续控制或实机可靠性。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://www.nature.com/articles/nature14236'
related: ['resnet', 'gan']
citations:
  count: 33566
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/340f48901f72278f6bf78a04ee5b01df208cc508"
  accessed: "2026-10-15"
---

## 问题与动机

强化学习如何直接处理高维视觉输入？原论文以 Atari 游戏为测试环境，学习从屏幕图像和奖励得到动作决策。

## 核心方法

卷积网络估计各离散动作的价值。经验回放打散相邻观测的相关性；目标网络定期更新，减少价值估计与训练目标之间的相互扰动。学习信号来自当前估计与自举目标的差异，而非动作标签。

## 为何值得读与适用边界

它提供理解价值函数、数据分布变化和训练稳定性的入口。论文使用游戏环境；机器人任务仍需解决连续动作、交互采样成本和执行约束。讨论“人类水平”时，应保留具体任务和评估协议，不能扩展为一般智能结论。

## 研究延伸问题

以下仅为待验证的问题：

- 面部交互任务的奖励能否兼顾同步、自然度与动作约束？
- 延迟反馈下，回放数据的时间跨度会怎样影响当前策略学习？

## 原始资料

[Nature 2015 正式论文页](https://www.nature.com/articles/nature14236)，DOI：10.1038/nature14236；[DeepMind 保存的出版排版全文](https://deepmind-media.storage.googleapis.com/dqn/DQNNaturePaper.pdf)说明回放与目标更新。此文为入门导读，未报告个人复现实验。
