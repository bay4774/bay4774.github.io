---
title: 'Adam：理解训练器中的自适应更新'
description: '从一阶矩、二阶矩与偏差校正理解 Adam，连接课程中的优化理论与深度模型训练。'
date: '2026-10-15'
tags: ['Optimization', 'Foundation Models', 'Generative Models']
demo: false
draft: false
curated: true
originalTitle: 'Adam: A Method for Stochastic Optimization'
authors: 'Diederik P. Kingma, Jimmy Ba'
lab: 'University of Amsterdam / University of Toronto（作者稿修订版亦列 OpenAI）'
venue: 'ICLR'
year: 2015
rating: 'must-read'
stars: 5
method: '用梯度的一阶矩和二阶原始矩估计构造逐参数自适应步长，并校正零初始化偏差。'
verdict: '把训练器当作研究方法的一部分：先理解更新尺度，再判断模型结构的收益。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://arxiv.org/abs/1412.6980'
related: ['ddpm', 'lora', 'vae']
citations:
  count: 172332
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/a6cb366736791bcccc5c8639de5a8f9636bf87e8"
  accessed: "2026-10-15"
---

## 问题与动机

噪声梯度、稀疏梯度和高维参数让统一步长难以适配所有坐标。Adam 研究怎样用少量额外状态完成随机一阶优化。[作者论文](https://arxiv.org/abs/1412.6980)

## 核心方法

算法维护梯度与梯度平方的指数移动平均，分别校正初始化偏差，再用前者除以后者的平方根计算更新。这里的二阶量是**未中心化二阶矩**，不应直接称为方差。

$$
\theta_t=\theta_{t-1}-\alpha\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
\tag{1}
$$

$\theta_t$ 是参数，$\alpha$ 是步长，$\hat m_t,\hat v_t$ 是校正后的矩估计，$\epsilon$ 用于数值稳定；向量操作逐元素进行。[Algorithm 1](https://arxiv.org/pdf/1412.6980)

## 为何值得读与适用边界

它连接高级人工智能讲义中的梯度下降与实际模型训练。比较生成模型或感知模型时，优化器、调度和预算应一并记录。自适应步长不保证所有任务都更优，也不能省略学习率选择。

## 研究延伸问题

以下是待验证的阅读问题：

- 同一数据和训练预算下，优化器变化会怎样影响动作生成模型的稳定性？
- 损失值的改善是否同时改善验证集表现与控制任务指标？

## 原始资料

正式发表为 **ICLR 2015**；作者稿首次提交于 2014 年，二者年份不同。[ICLR 官方会议记录](https://iclr.cc/archive/www/2015.html) · [作者稿与版本历史](https://arxiv.org/abs/1412.6980)
