---
title: 'LoRA：用低秩更新适配大模型'
description: '冻结预训练权重，以小规模参数更新进行任务适配，理解训练资源与任务能力之间的取舍。'
date: '2026-10-15'
tags: ['Foundation Models', 'Multimodal', 'Embodied AI']
demo: false
draft: false
curated: true
originalTitle: 'LoRA: Low-Rank Adaptation of Large Language Models'
authors: 'Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen'
lab: 'Microsoft Corporation（作者稿署名机构）'
venue: 'ICLR'
year: 2022
rating: 'must-read'
stars: 5
method: '冻结预训练权重，将可训练权重增量分解为低秩矩阵乘积，减少任务适配参数。'
verdict: '适合思考有限预算下的模型适配；参数更少不代表跨任务能力自动保留。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://www.microsoft.com/en-us/research/publication/lora-low-rank-adaptation-of-large-language-models/'
code: 'https://github.com/microsoft/LoRA'
related: ['transformer', 'clip', 'adam']
citations:
  count: 24249
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/a8ca46b171467ceb2d7652fbfb67fe701ad86092"
  accessed: "2026-10-15"
---

## 问题与动机

为每个下游任务完整微调并保存大模型，训练与部署成本较高。LoRA 研究能否在冻结模型主体时，用较小的可训练增量实现适配。[作者稿](https://arxiv.org/abs/2106.09685)

## 核心方法

对预训练权重 $W_0\in\mathbb R^{d\times k}$，以低秩矩阵 $B\in\mathbb R^{d\times r}$ 与 $A\in\mathbb R^{r\times k}$ 表示增量：

$$
h=(W_0+BA)x,\qquad r\ll\min(d,k)
\tag{1}
$$

$x$ 为输入，$h$ 为输出，训练时更新 $A,B$。单个已训练增量可合并进原权重，避免为这一线性更新增加独立推理层。[原文方法部分](https://arxiv.org/pdf/2106.09685)

## 为何值得读与适用边界

这是一条连接基础模型与认知 Agent 任务适配的阅读路线。原文主要验证语言模型，不能直接据此宣称机器人控制同样有效；秩、插入位置、训练数据与任务差异仍需核对。

## 研究延伸问题

以下是待验证的阅读问题：

- 少量交互数据能否支持稳定适配，同时保留原有语义能力？
- 参数、显存与训练时间的节省能否换来下游任务的实际收益？

## 原始资料

正式发表为 **ICLR 2022**；作者预印本首发于 2021 年。[会议记录](https://openreview.net/forum?id=nZeVKeeFYf9) · [可访问作者稿](https://arxiv.org/abs/2106.09685) · [官方实现](https://github.com/microsoft/LoRA)
