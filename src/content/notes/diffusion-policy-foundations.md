---
title: 'Diffusion as a Policy · 扩散策略基础'
description: '示例讲义：把前向加噪、条件去噪与动作序列接口连接起来。'
date: 2026-10-07
tags: ['Diffusion-Policy', 'Learning', 'Embodied AI']
demo: true
category: 'lecture'
readTime: 10
chapters: 3
---

## 1. A mathematical starting point

这是扩散模型讲义的占位示例，展示编号公式与代码块的排版。正式讲义需要补充核对过的参考文献、使用的模型定义与实验结果。

考虑一个前向加噪过程：

$$
x_t = \sqrt{\bar\alpha_t}\,x_0
+ \sqrt{1-\bar\alpha_t}\,\epsilon,
\qquad \epsilon\sim\mathcal N(0,I)
\tag{1}
$$

将这一形式用于动作建模之前，需要先定义 $x_0$ 是单步动作、动作片段还是轨迹参数，随后明确动作归一化与条件观测的构成。

## 2. Conditions and action horizons

在策略接口中，历史观测决定可用信息，预测长度决定模型输出范围，执行长度决定重规划频率。这三者应分别命名，不应都叫作“时间窗口”。

~~~python
# 配置示例，不表示推荐的实验参数
observation_horizon = 2
prediction_horizon = 16
execution_horizon = 4

condition = encode(observation_history)
action_sequence = sample_policy(condition, prediction_horizon)
execute(action_sequence[:execution_horizon])
~~~

## 3. What to measure

讲义中的实验练习可以围绕采样成本、条件信息量与重规划频率展开。应测量实际执行期间的延迟和任务结果，同时记录采样器设置，才能解释方法在机器人上的行为。

:::my-take

把生成模型用于控制后，“样本看起来合理”与“闭环执行有效”是两种不同的证据。我的阅读笔记会把生成质量、控制稳定性和运行预算分开记录。

:::
