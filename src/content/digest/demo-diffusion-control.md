---
title: "From generation to closed-loop control"
description: "示例精读：将扩散动作序列放回闭环系统，重新审视采样预算、重规划与执行稳定性。"
date: "2026-10-14"
tags: ["Diffusion-Policy","Embodied AI","Motion-Tracking"]
demo: true
originalTitle: "示例：Conditional Diffusion for Action Sequences（待替换）"
authors: "Original authors · 示例（待替换）"
lab: "Original laboratory · 示例（待替换）"
venue: "CoRL · 示例"
year: 2026
rating: "must-read"
stars: 5
method: "条件扩散模型生成动作序列，以滚动窗口执行与重规划。"
verdict: "动作分布很丰富，真正的瓶颈可能在采样与反馈之间的时间预算。"
readTime: 8
week: "2026-W42"
related: ["demo-motion-tracking","demo-sim-to-real","embodied-control"]
---

> 以下为精读模板的示例内容，不对应一篇已核验的真实论文。方法描述与观点是供后续替换的研究问题，不是实验结论。

## Problem & Motivation

如果策略需要产生具有多种可能性的动作，单一确定性输出可能难以表达任务中的歧义。阅读此类工作时，首先应核对它所解决的任务是否确实存在多模态动作，以及对比方法是否使用了相同的观测信息。

我的第一张阅读卡片会记录三件事：任务定义、训练数据范围与动作输出形式。若这些设定不同，模型结构之间的比较就容易失去解释力。

## Methodology & Architecture

将动作片段记为 $A$，观测条件记为 $o$。示例接口用一个条件去噪网络逐步构造动作片段，再执行其中一小段并读取新观测。

$$
\epsilon_\theta(A_t,t,o)
\quad\longrightarrow\quad
\hat A_0
\quad\longrightarrow\quad
a_{0:k}
\tag{1}
$$

拆解真实论文时，应检查观测编码、动作归一化、采样器和执行窗口。模型预测长度与实际执行长度分别影响生成范围和反馈频率。

~~~python
# 阅读用伪代码，不代表原作者实现
while not task.finished:
    observation = task.observe()
    sequence = policy.sample(observation)
    task.execute(sequence[:execution_horizon])
~~~

## Critical Analysis: Pros & Cons

<div class="analysis-grid">
<div class="strength-box">

### Strengths · 待核对

- 动作序列建模可能保留局部时间关联。
- 条件生成接口可以容纳不同来源的观测。
- 需要通过任务证据确认多模态建模是否带来实际收益。

</div>
<div class="limit-box">

### Limitations · 待验证

- 采样开销可能影响闭环控制频率。
- 较长执行窗口会增加开环误差积累。
- 仅比较最终成功率，可能掩盖延迟与算力预算的差别。

</div>
</div>

## My Take & Idea Spark

:::my-take

我会先把“采样质量”与“执行效果”拆成两个问题。若要用于仿生机械头，优先验证快速表情变化时的条件更新是否足够及时，再决定是否增加模型复杂度。

一个可检验的切入点是固定同一运行预算，比较采样步数与重规划频率的组合。这里记录的是实验想法，尚未执行或得出结论。

:::
