---
title: 'DDPM：把生成问题写成逐步去噪'
description: '经典论文导读：从正向加噪和反向去噪认识扩散生成，并辨认图像合成与动作控制之间的证据边界。'
date: '2026-10-15'
tags: ['Generative Models', 'Foundation Models', 'Embodied AI']
demo: false
draft: false
curated: true
featured: true
originalTitle: 'Denoising Diffusion Probabilistic Models'
authors: 'Jonathan Ho, Ajay N. Jain, Pieter Abbeel'
lab: 'University of California, Berkeley'
venue: 'NeurIPS'
year: 2020
rating: 'must-read'
stars: 5
method: '逐步向数据加入噪声，再学习反向去噪的概率生成过程。'
verdict: '推荐作为动作扩散的理论入口；生成质量、采样开销和物理可执行性需要分别评估。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://proceedings.neurips.cc/paper/2020/hash/4c5bcfec8584af0d967f1ab10179ca4b-Abstract.html'
related: ['gan', 'transformer']
citations:
  count: 36305
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/5c126ae3421f05768d8edd97ecd44b1364e2c99a"
  accessed: "2026-10-15"
---

## 问题与动机

如何从简单噪声得到复杂数据分布？这篇论文研究图像合成，用一系列逐渐扰动和恢复数据的过程组织生成模型。

## 核心方法

正向过程逐步加噪，反向过程由网络学习去噪。作者把扩散模型的训练与去噪得分匹配建立联系，并展示生成、插值和不同粒度重建。阅读时宜先分清训练目标、反向过程和实际采样步骤。

## 为何值得读与适用边界

它是进入扩散动作模型的合适起点，但原始证据来自图像数据。把图像生成框架改为动作生成，还需要定义时序表示、条件信息和执行反馈；动作看起来平滑，也不能替代动力学或延迟测量。

## 研究延伸问题

以下仅为待验证的问题：

- 固定总采样时间，少步去噪是否足以保持表情动作的多样性？
- 去噪后加入机构约束，会怎样改变动作误差与分布覆盖？

## 原始资料

[NeurIPS 2020 正式论文页](https://proceedings.neurips.cc/paper/2020/hash/4c5bcfec8584af0d967f1ab10179ca4b-Abstract.html)确认发表身份；[作者项目页](https://hojonathanho.github.io/diffusion/)提供方法概览与原文入口。项目页的预印本引用与正式会议记录应区分。此文为入门导读，未报告个人复现。
