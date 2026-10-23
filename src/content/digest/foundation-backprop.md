---
title: '反向传播：隐藏层怎样知道该向哪里更新'
description: '把链式法则、计算图和梯度下降连起来，导读 1986 年表示学习经典论文。'
date: '2026-10-15'
tags: ['Foundations', 'Calculus', 'Optimization', 'Learning']
demo: false
draft: false
curated: true
foundationOrder: 6
originalTitle: 'Learning representations by back-propagating errors'
authors: 'David E. Rumelhart, Geoffrey E. Hinton, Ronald J. Williams'
lab: 'University of California, San Diego / Carnegie-Mellon University（原文署名）'
venue: 'Nature, 323(6088): 533–536'
year: 1986
rating: 'must-read'
stars: 5
method: '沿网络反向递推损失对中间变量的导数，高效计算每个连接权重的梯度。'
verdict: '把每一步导数写清，并用数值差分检查；训练成功之后再讨论表示。'
readTime: 7
week: '2026-W42'
originalUrl: 'https://www.nature.com/articles/323533a0'
related: ['foundation-robbins-monro', 'adam']
citations:
  count: 30123
  source: 'SciSpace'
  url: 'https://scispace.com/papers/learning-representations-by-back-propagating-errors-11vngtlyuk'
  accessed: '2026-10-15'
---

本文是**基础阅读导引**。个人逐段阅读与验证进度私存，以下练习不表示已经完成复现。[科研基础总路线](/notes/research-foundations-roadmap/)与[论文阅读方法](/notes/foundations-paper-reading/)说明如何把它转成自己的笔记。

## 先带着一个问题读

输出有目标标签，但隐藏层没有标签。我们怎样知道，一个隐藏层参数增加一点，会让最终误差变大还是变小？这篇短文以反向传播训练多层网络，并展示隐藏单元学习表示的例子。[Nature 正式页](https://www.nature.com/articles/323533a0)

先修是向量、偏导、链式法则、可微函数、平方损失与梯度下降。依次接[第26章多元链式法则](/notes/foundations-26-jacobians/)、[第71章梯度下降](/notes/foundations-71-gradient-descent/)和[第74章最小反向求导](/notes/foundations-74-reverse-mode/)；先能手推$L=(f(wx+b)-y)^2/2$对$w$的导数，再扩展原文网络。

## 核心：把导数往回传

设隐藏单元 $j$ 的加权输入为 $a_j$，输出为 $h_j=f(a_j)$，记 $\delta_j=\partial L/\partial a_j$。链式法则给出：

$$
\delta_j=f'(a_j)\sum_k w_{kj}\delta_k,
\qquad \frac{\partial L}{\partial w_{ji}}=\delta_jh_i.
$$

$L$ 是网络总损失，$i$ 是上一层单元，$k$ 是下一层单元；$w_{ji}$ 从 $i$ 连到 $j$，$w_{kj}$ 从 $j$ 连到 $k$。上式针对没有共享参数的普通前馈网络；共享权重需要累加各次使用的贡献。输出层先由损失函数求出自己的导数，随后逐层使用该式。

“反向”指求导顺序。真正的参数更新还要选择步长，并沿负梯度移动。这是现代统一符号重写，用于帮助对应原文；原文还讨论了具体网络和表示实验。[作者公开 PDF](https://www.cs.toronto.edu/~hinton/absps/naturebp.pdf)

## 原文选读位置

全文只有 pp. 533–536，第一轮读摘要、误差函数、输出层导数与隐藏层导数推导；在旁边画一个两层网络逐项对应。第二轮读图与实验，分别写出任务、数据、学习到的表示及证据。短并不意味着能跳过推导。

## 最小实验与预期

用普通数组实现一个 2–4–1 的小网络，使用平滑激活与平方损失，先不调用自动微分。对每个参数用中心差分 $(L(\theta+\epsilon)-L(\theta-\epsilon))/(2\epsilon)$ 检验解析梯度；可从 $\epsilon=10^{-5}$、适中的随机权重开始。记录最大绝对误差和相对误差，若差异明显，优先排查索引、求和和损失归一化。

梯度检查通过后训练四个 XOR 样本，保存初始化种子、步长、迭代次数、损失与四个预测值。预期可找到把两类分开的非线性解；不同初始化可能失败，失败本身也要记录。该玩具实验验证代码理解，不等于复现了原文所有表示学习实验。

## 为什么有效，也为什么有边界

反向传播高效计算导数，但它不保证非凸损失达到全局最优，也不代替泛化评估。饱和激活、初始化和步长都能影响结果。1986 年这篇文章是传播和展示该思想的重要经典，不能写成“链式法则或反向求导在此首次被唯一发明”。

引用卡片使用 SciSpace 对 **DOI 10.1038/323533a0** 的检索记录，访问日为 2026-10-15；该库返回 30,123，为总引用计数，数据库更新可能延迟，不与其他数据库数字合并，也不代表严格排除自引。

该索引记录的日期字段有误；题名、DOI 与三位作者匹配，正式发表年份采用 Nature 的 1986 年记录。
