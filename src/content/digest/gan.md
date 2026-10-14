---
title: 'GAN：用判别器学习生成分布'
description: '经典论文导读：生成器与判别器的对抗过程，以及理论分布匹配和有限训练表现之间的距离。'
date: '2026-10-15'
tags: ['Generative Models', 'Foundation Models']
demo: false
draft: false
curated: true
originalTitle: 'Generative Adversarial Nets'
authors: 'Ian J. Goodfellow, Jean Pouget-Abadie, Mehdi Mirza, Bing Xu, David Warde-Farley, Sherjil Ozair, Aaron Courville, Yoshua Bengio'
lab: 'Université de Montréal · École Polytechnique / IIT Delhi（访问作者）'
venue: 'NeurIPS'
year: 2014
rating: 'must-read'
stars: 5
method: '交替训练生成器与判别器，通过对抗目标学习数据分布。'
verdict: '推荐先区分理想博弈结论与实际训练；判别器奖励也不能自动保证动作质量。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://papers.nips.cc/paper_files/paper/2014/hash/f033ed80deb0234979a61f95710dbe25-Abstract.html'
related: ['ddpm', 'dqn']
citations:
  count: 7031
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/86ee1835a56722b76564119437070782fc90eb19"
  accessed: "2026-10-15"
---

## 问题与动机

如何训练生成模型，而不直接处理复杂的似然计算？原论文以数据分布学习为目标，把生成过程组织成两个网络之间的竞争。

## 核心方法

生成器把噪声映射为样本，判别器判断输入来自真实数据还是生成器。两者交替更新：判别器改进区分能力，生成器通过判别信号改进输出。原文的理论分析限定在特定假设下，不能直接视为有限网络必然收敛的保证。

## 为何值得读与适用边界

它是理解对抗生成和对抗模仿的重要基础。把判别思想用于动作时，需要另外检查覆盖范围、时间一致性和物理可行性；生成样本能骗过判别器，不代表它满足实际任务目标。

## 研究延伸问题

以下仅为待验证的问题：

- 动作判别器是否会偏好常见表情而忽略少见但有价值的行为？
- 条件生成中，语义匹配与动作自然度是否需要独立评价？

## 原始资料

[NIPS 2014 正式论文页](https://papers.nips.cc/paper_files/paper/2014/hash/f033ed80deb0234979a61f95710dbe25-Abstract.html)，会议现称 NeurIPS；[官方全文](https://papers.nips.cc/paper_files/paper/2014/file/f033ed80deb0234979a61f95710dbe25-Paper.pdf)第 3–4 节给出训练过程与理论假设。此文为入门导读，未报告个人复现。
