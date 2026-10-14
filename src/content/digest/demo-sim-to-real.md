---
title: "Which uncertainties deserve randomization?"
description: "示例精读：把仿真参数变化与真实系统中的不确定性逐项对应。"
date: "2026-10-11"
tags: ["Sim-to-Real","Robotics","Reinforcement-Learning"]
demo: true
draft: true
originalTitle: "示例：Robust Transfer through Simulation（待替换）"
authors: "Original authors · 示例（待替换）"
lab: "Original laboratory · 示例（待替换）"
venue: "RSS · 示例"
year: 2026
rating: "inspiring"
stars: 4
method: "在仿真中改变物理与观测参数，分析策略对不确定性的敏感度。"
verdict: "随机化范围需要物理依据，覆盖更广不一定意味着迁移更好。"
readTime: 9
week: "2026-W41"
related: ["demo-diffusion-control","demo-contact-dynamics","embodied-control"]
---

> 以下是 sim-to-real 阅读模板，所有元数据为示例。观点描述的是核对与实验计划，不声称已经验证迁移表现。

## Problem & Motivation

仿真与真实系统的差异可能来自动力学、接触、传感器或延迟。阅读一篇迁移工作时，我首先问：它针对哪一种差异，真实系统中有没有测量依据？

“鲁棒”需要明确对象。对质量变化鲁棒，不代表对时间延迟或观测偏置也鲁棒。

## Methodology & Architecture

为每个随机化参数建立一条记录：物理意义、单位、采样范围、现实测量依据与评估方法。若采用系统辨识，应区分训练时使用的先验与部署时可获得的信息。

~~~python
# 示例结构；参数范围应由测量或论证确定
randomization = {
    "mass_scale": {"range": "to be measured"},
    "sensor_delay": {"range": "to be measured"},
    "contact_friction": {"range": "to be measured"},
}
~~~

复现时先改变单一参数，再观察组合变化。这样更容易找到策略的脆弱环节。

## Critical Analysis: Pros & Cons

<div class="analysis-grid">
<div class="strength-box">

### Strengths · 待核对

- 参数化不确定性便于组织系统测试。
- 明确的随机化配置可以提升可复现性。
- 敏感度分析有望指导硬件测量的优先级。

</div>
<div class="limit-box">

### Limitations · 待验证

- 独立采样不一定反映现实参数的相关性。
- 过宽分布可能改变训练任务本身。
- 真实部署的失败案例需要独立记录，不能只看演示片段。

</div>
</div>

## My Take & Idea Spark

:::my-take

我会先测量传感与执行链路中的时间结构，再决定是否扩大随机化。延迟、抖动和低频漂移是不同问题，最好分别建模。

一个可执行的下一步是做参数敏感度地图：找出哪些误差最影响任务，再把采集与标定精力放到那些参数上。

:::
