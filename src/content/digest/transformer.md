---
title: 'Transformer：序列之间如何交换信息'
description: '经典论文导读：理解注意力、位置编码和因果遮罩，再思考它们与多模态动作序列的关系。'
date: '2026-10-15'
tags: ['Foundation Models', 'Multimodal', 'Generative Models']
demo: false
draft: false
curated: true
originalTitle: 'Attention Is All You Need'
authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin'
lab: 'Google Brain · Google Research · University of Toronto'
venue: 'NeurIPS'
year: 2017
rating: 'must-read'
stars: 5
method: '以多头注意力和位置编码构成序列到序列模型，替代循环计算。'
verdict: '推荐先读懂信息交互和遮罩；训练并行性不能替代在线推理的因果性检查。'
readTime: 4
week: '2026-W42'
originalUrl: 'https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html'
related: ['resnet', 'clip', 'ddpm']
citations:
  count: 196745
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/204e3073870fae3d05bcbc2f6a8e263d9b72e776"
  accessed: "2026-10-15"
---

## 问题与动机

循环网络沿序列逐步计算，限制训练并行性。原论文以机器翻译为对象，探索用注意力组织序列之间的信息交换。

## 核心方法

查询与键的相似度决定如何汇聚值，多头机制在不同投影空间执行这一过程。位置编码补充顺序信息，解码器通过遮罩限制对未来位置的访问；编码器与解码器还使用残差连接和前馈子层。

$$
\operatorname{Attention}(Q,K,V)
=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

## 为何值得读与适用边界

推荐把注意力、位置和遮罩分开理解，再阅读后续多模态模型。原文的翻译实验没有验证机器人闭环控制；输入编码若读取未来音频，即使动作解码器有遮罩，也不能据此称为在线系统。

## 研究延伸问题

以下仅为待验证的问题：

- 语音与表情的不同时间尺度，是否需要不同的注意力窗口？
- 固定延迟预算时，局部注意力与全局注意力如何影响同步质量？

## 原始资料

[NIPS 2017 正式论文页](https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html)，该会议现称 NeurIPS。[官方全文](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)第 3 节给出架构和公式。此文为入门导读，未报告个人复现。
