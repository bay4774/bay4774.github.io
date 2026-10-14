---
title: 'ResNet：从残差学习理解深层网络'
description: '经典论文导读：残差连接如何缓解深层网络的优化退化，以及视觉骨干迁移到具身任务时需要检查什么。'
date: '2026-10-15'
tags: ['Foundation Models', 'Embodied AI']
demo: false
draft: false
curated: true
originalTitle: 'Deep Residual Learning for Image Recognition'
authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun'
lab: 'Microsoft Research'
venue: 'CVPR'
year: 2016
rating: 'must-read'
stars: 5
method: '通过跨层捷径让网络学习相对于输入的残差映射。'
verdict: '推荐作为理解视觉骨干与残差设计的起点；图像识别证据仍需在具身场景重新检验。'
readTime: 3
week: '2026-W42'
originalUrl: 'https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html'
related: ['transformer', 'clip']
citations:
  count: 241920
  source: "Semantic Scholar"
  url: "https://www.semanticscholar.org/paper/2c03df8b48bf3fa39054345bafabfeff15bfd11d"
  accessed: "2026-10-15"
---

## 问题与动机

网络更深，训练误差却可能更高。论文关注这种优化退化，而非单纯把问题归为过拟合。这里提供入门导读，帮助定位原文重点。

## 核心方法

不让若干层直接拟合目标映射，而是学习相对于输入的变化。同维度时，捷径分支保留输入，主分支学习残差；维度变化时可以使用投影。原文在图像分类和检测任务上检验了这一设计。

$$
y = F(x) + x
$$

## 为何值得读与适用边界

它适合用来区分“增加模型容量”和“改善优化条件”。作为具身视觉编码器的起点，需要另外考察遮挡、视角变化及部署成本，不能直接把图像基准结果当作机器人控制收益。

## 研究延伸问题

以下仅为待验证的问题：

- 固定计算预算，残差视觉骨干的深度是否影响机器人对遮挡的鲁棒性？
- 小样本面部状态估计中，冻结特征与端到端微调的收益差异有多大？

## 原始资料

[CVPR 2016 正式论文页](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html)。方法定位为原文第 3 节；机构信息可见 [Microsoft Research 保存的作者稿](https://www.microsoft.com/en-us/research/wp-content/uploads/2021/07/Deep-Residual-Learning-for-Image-Recognition.pdf)。这里未报告个人复现实验。
