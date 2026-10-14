---
title: "Contact is a modeling choice"
description: "示例精读：在连续动力学、接触模型与离散求解器之间建立清晰的证据链。"
date: "2026-10-08"
tags: ["Physics-based Animation","Dynamics","Motion-Tracking"]
demo: true
draft: true
originalTitle: "示例：Contact Modeling for Physical Systems（待替换）"
authors: "Original authors · 示例（待替换）"
lab: "Original laboratory · 示例（待替换）"
venue: "Science Robotics · 示例"
year: 2026
rating: "engineering"
stars: 4
method: "以约束或软接触模型处理碰撞，检查求解器与控制器的耦合。"
verdict: "稳定的轨迹必须结合接触假设、离散步长与求解精度来理解。"
readTime: 11
week: "2026-W41"
related: ["demo-motion-tracking","demo-sim-to-real","embodied-control"]
---

> 本条目是动力学阅读模板。它没有引用或评价任何指定的真实论文，公式与讨论用于展示如何组织理论分析。

## Problem & Motivation

接触使系统在不同运动模式之间切换。阅读涉及物理仿真的工作时，需要问清楚接触如何建模、如何离散，以及控制器是否使用了求解器的内部信息。

同一段动作在两个仿真器中不同，并不自动说明某个策略更差；接触参数、离散步长和约束精度也可能产生影响。

## Methodology & Architecture

从符号开始：间隙函数、接触法向、摩擦模型与求解变量是否有明确说明？然后检查连续模型如何进入每一步数值更新。

$$
M(q)\ddot q = f(q,\dot q,\tau) + J(q)^\top \lambda
\tag{1}
$$

真实笔记中应把这一动力学表达与原文公式逐项对应，记录额外假设；若文中采用软接触，不应擅自改写为硬约束模型。

## Critical Analysis: Pros & Cons

<div class="analysis-grid">
<div class="strength-box">

### Strengths · 待核对

- 显式的接触假设让实验结果更容易解释。
- 分离模型与求解器可以帮助定位数值问题。
- 接触力与状态轨迹共同提供更完整的诊断信息。

</div>
<div class="limit-box">

### Limitations · 待验证

- 数值稳定性可能依赖特定时间步长。
- 摩擦和碰撞参数的可辨识性需要论证。
- 仿真中的接触力不一定能直接映射到真实测量。

</div>
</div>

## My Take & Idea Spark

:::my-take

在复现物理控制论文时，我会先建立一个没有学习策略的最小接触测试。若基础接触行为已经不一致，后续训练曲线很难解释。

下一步可以把时间步长、接触刚度和求解精度作为共同的诊断坐标，寻找控制策略的适用边界。这仍是待执行的分析计划。

:::
