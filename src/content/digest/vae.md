---
title: 'VAE：把潜变量模型接上梯度优化'
description: '从变分下界与重参数化理解概率生成模型，为多模态表情和动作表示提供阅读基础。'
date: '2026-10-15'
tags: ['Generative Models', 'Foundation Models', 'Multimodal']
demo: false
draft: false
curated: true
originalTitle: 'Auto-Encoding Variational Bayes'
authors: 'Diederik P. Kingma, Max Welling'
lab: 'University of Amsterdam · Machine Learning Group'
venue: 'ICLR'
year: 2014
rating: 'must-read'
stars: 5
method: '联合训练概率编码器与解码器，用重参数化获得可由随机梯度优化的变分下界估计。'
verdict: '生成不只是拟合一条均值曲线；先理解潜变量与概率约束，再讨论动作的多样性。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://arxiv.org/abs/1312.6114'
related: ['gan', 'ddpm', 'adam']
citations:
  count: 17312
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/5f5dc5b9a2ba710937e2c413b37b053cd673df02"
  accessed: "2026-10-15"
---

## 问题与动机

当连续潜变量模型的后验不可解析计算时，逐样本迭代推断可能昂贵。论文让近似后验的学习与生成模型训练共享梯度优化流程。[作者论文](https://arxiv.org/abs/1312.6114)

## 核心方法

概率编码器近似后验，解码器描述条件生成分布。训练目标是数据对数似然的变分下界，包含重建项与相对先验的 KL 项。高斯情形中，采样可写成：

$$
z=\mu_\phi(x)+\sigma_\phi(x)\odot\varepsilon,
\qquad\varepsilon\sim\mathcal N(0,I)
\tag{1}
$$

$x$ 是输入，$z$ 是潜变量，$\mu_\phi,\sigma_\phi$ 由编码器预测，$\odot$ 表示逐元素相乘；随机性由 $\varepsilon$ 承载。[原文方法部分](https://arxiv.org/pdf/1312.6114)

## 为何值得读与适用边界

VAE 是理解生成建模与不确定性的一条基础路线。它可帮助组织表情、语音与动作表示的阅读问题；原论文并未证明这些下游应用。潜变量分布、近似后验与重建模型的选择会限制表达能力。

## 研究延伸问题

以下是待验证的阅读问题：

- 动作潜空间能否区分语义、风格与物理可执行性？
- 重建误差降低时，样本多样性和时间一致性是否同步改善？

## 原始资料

正式发表为 **ICLR 2014**，预印本首发于 2013 年。该工作获 ICLR 2024 Test of Time Award。[ICLR 官方说明](https://blog.iclr.cc/2024/05/07/iclr-2024-test-of-time-award/) · [作者论文及版本](https://arxiv.org/abs/1312.6114)
