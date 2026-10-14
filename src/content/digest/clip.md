---
title: 'CLIP：让图像与语言共享比较空间'
description: '经典论文导读：图文对比预训练与零样本识别，以及语义表示接入具身任务时需要补上的验证。'
date: '2026-10-15'
tags: ['Multimodal', 'Foundation Models', 'Embodied AI']
demo: false
draft: false
curated: true
featured: true
originalTitle: 'Learning Transferable Visual Models From Natural Language Supervision'
authors: 'Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, Sandhini Agarwal, Girish Sastry, Amanda Askell, Pamela Mishkin, Jack Clark, Gretchen Krueger, Ilya Sutskever'
lab: 'OpenAI'
venue: 'ICML'
year: 2021
rating: 'must-read'
stars: 5
method: '联合训练图像和文本编码器，识别批次中的正确图文配对。'
verdict: '推荐用来理解语言监督视觉表征；图文相似度并不直接给出可执行的机器人动作。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://proceedings.mlr.press/v139/radford21a.html'
related: ['transformer', 'resnet']
citations:
  count: 57604
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/6f870f7f02a8c59c3e23f407f3ef00dd1dcf8fc4"
  accessed: "2026-10-15"
---

## 问题与动机

固定类别标签限制视觉模型表达新概念。CLIP 尝试直接使用图像对应的自然语言描述，让视觉表征具有更开放的语义接口。

## 核心方法

图像编码器和文本编码器被联合训练，以区分批次中的正确与错误配对。推理时把类别描述编码为文本向量，再与图像向量比较，从而构成零样本分类器。原文同时考察跨数据集迁移和模型局限。

## 为何值得读与适用边界

它适合连接视觉感知和语言条件，也能帮助理解后续多模态方法。对机器人而言，相似度更接近语义匹配线索，尚不是距离、接触状态或动作可行性判断；需要针对实际任务增加测量和验证。

## 研究延伸问题

以下仅为待验证的问题：

- 改变表情描述的措辞，是否会改变同一面部状态的语义排序？
- 加入时序和接触信息，能否改善静态图文表示的动作辨别能力？

## 原始资料

[ICML 2021 正式论文页](https://proceedings.mlr.press/v139/radford21a.html)列出全作者与书目信息；[官方全文](https://proceedings.mlr.press/v139/radford21a/radford21a.pdf)的图 1 和第 2 节解释训练与零样本推理。这里仅提供导读，没有报告个人训练或复现结果。
