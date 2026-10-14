---
title: 'ViT：把图像变成视觉 token'
description: '从图像块序列和大规模预训练理解视觉 Transformer，连接具身感知与多模态表示。'
date: '2026-10-15'
tags: ['Foundation Models', 'Embodied AI', 'Multimodal']
demo: false
draft: false
curated: true
originalTitle: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
authors: 'Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, Thomas Unterthiner, Mostafa Dehghani, Matthias Minderer, Georg Heigold, Sylvain Gelly, Jakob Uszkoreit, Neil Houlsby'
lab: 'Google Research · Brain Team'
venue: 'ICLR'
year: 2021
rating: 'must-read'
stars: 5
method: '将图像切成固定大小的块，经线性嵌入与位置编码后输入标准 Transformer 编码器。'
verdict: '读懂视觉 token 化，也要读懂预训练数据规模；模型结构的收益依赖实验条件。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://research.google/pubs/an-image-is-worth-16x16-words-transformers-for-image-recognition-at-scale/'
code: 'https://github.com/google-research/vision_transformer'
related: ['transformer', 'resnet', 'clip']
citations:
  count: 71557
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/268d347e8a55b5eb82fb5e7d2f800e33c75ab18a"
  accessed: "2026-10-15"
---

## 问题与动机

标准 Transformer 能否直接用于图像识别，而不依赖卷积主干？ViT 通过图像块序列回答这个问题，并考察预训练规模对迁移效果的影响。[作者论文](https://arxiv.org/abs/2010.11929)

## 核心方法

图像被切分为 patch，展平后进行线性投影，加入位置嵌入与分类 token，随后由 Transformer 编码器处理。原文比较不同数据规模，并将预训练模型迁移到图像识别任务。[原文架构与实验](https://arxiv.org/pdf/2010.11929)

## 为何值得读与适用边界

它是理解具身感知中视觉 token 与多模态接口的基础。论文在小数据设置下的表现提醒读者：减少卷积归纳偏置后，预训练数据与正则化很关键。图像分类结果不能直接代表细粒度时序感知或闭环控制性能。

## 研究延伸问题

以下是待验证的阅读问题：

- patch 大小与输入分辨率会怎样影响微表情、视线和手部细节的保留？
- 机器人感知任务中，预训练数据匹配程度与推理延迟应怎样共同评价？

## 原始资料

正式发表为 **ICLR 2021**，预印本首发于 2020 年。[会议记录](https://openreview.net/forum?id=YicbFdNTTy) · [作者稿](https://arxiv.org/abs/2010.11929) · [官方代码](https://github.com/google-research/vision_transformer)
