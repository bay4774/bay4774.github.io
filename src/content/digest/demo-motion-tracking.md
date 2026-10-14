---
title: "What makes motion physically plausible?"
description: "示例精读：拆解参考动作、接触约束与反馈控制，找出跟踪误差背后的物理边界。"
date: "2026-10-13"
tags: ["Motion-Tracking","Reinforcement-Learning","Physics-based Animation"]
demo: true
draft: true
originalTitle: "示例：Contact-aware Motion Tracking（待替换）"
authors: "Original authors · 示例（待替换）"
lab: "Original laboratory · 示例（待替换）"
venue: "SIGGRAPH · 示例"
year: 2026
rating: "must-read"
stars: 5
method: "以参考运动为目标，将状态反馈与接触条件接入物理控制。"
verdict: "姿态相似只是起点，接触一致性决定动作能否真正成立。"
readTime: 10
week: "2026-W42"
related: ["demo-contact-dynamics","demo-diffusion-control","embodied-control"]
---

> 示例分析用来说明精读条目的组织方法。当前没有指定真实论文，以下观察均是需要结合原文与实验核对的问题。

## Problem & Motivation

运动跟踪通常要同时满足两类目标：接近参考动作，并让系统在动力学与接触约束下持续运行。阅读时，应先判断参考运动本身是否可在该角色和环境中实现。

将跟踪误差单独可视化并不够。还应询问失稳时刻、足部滑动、接触切换和外力扰动如何处理。

## Methodology & Architecture

把系统拆成参考表示、策略输入、执行器接口与评估四部分。尤其要核对“动作”指的是力矩、关节目标还是残差，这会直接影响对比的公平性。

一个阅读用的目标表达可以写为：

$$
\mathcal L =
w_q\,\mathcal L_{\mathrm{pose}}
+ w_v\,\mathcal L_{\mathrm{velocity}}
+ w_c\,\mathcal L_{\mathrm{contact}}
\tag{1}
$$

这不是某篇论文的损失函数。它提醒我分别查明每项的定义、权重依据与消融证据，而不只记下一串符号。

## Critical Analysis: Pros & Cons

<div class="analysis-grid">
<div class="strength-box">

### Strengths · 待核对

- 接触信息有望让目标与物理状态对应得更明确。
- 状态反馈便于检查失稳前的动态过程。
- 分项指标可以帮助理解改善来自何处。

</div>
<div class="limit-box">

### Limitations · 待验证

- 角色形态与参考动作不匹配时，误差可能不可消除。
- 高跟踪精度不自动意味着低控制成本。
- 仿真器中的稳定性需要结合参数与时间步长解释。

</div>
</div>

## My Take & Idea Spark

:::my-take

我最想复现的是接触切换附近的行为。与其只挑选平稳片段，不如为快速转身、落地与短时扰动建立共同的诊断窗口。

如果把这一方向作为自己工作的 baseline，应先锁定角色、动作数据和评估接口，再比较策略。公平的系统接口比漂亮的视频更能说明改进。

:::
