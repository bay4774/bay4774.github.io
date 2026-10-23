---
title: 'Pearson 1901：从点云与投影理解降维的几何起点'
description: '基础导读：用四个二维点理解正交拟合、中心化与重构误差，再有限选读 Pearson 的历史论文。'
date: '2026-10-15'
tags: ['Foundations', 'Linear Algebra', 'Statistics']
demo: false
draft: false
curated: true
foundationOrder: 1
originalTitle: 'LIII. On lines and planes of closest fit to systems of points in space'
authors: 'Karl Pearson'
lab: '以原文首页署名为准'
venue: 'The London, Edinburgh, and Dublin Philosophical Magazine and Journal of Science, Series 6'
year: 1901
rating: 'must-read'
stars: 5
method: '用点到直线或平面的平方距离组织几何拟合；用现代向量符号连接正交投影与主方向。'
verdict: '先理解投影误差，再回看历史原文；高方差方向不自动等于因果上重要的方向。'
readTime: 6
week: '2026-W42'
originalUrl: 'https://doi.org/10.1080/14786440109462720'
related: ['foundation-shannon', 'foundation-robbins-monro']
citations:
  count: 12809
  source: 'SciSpace'
  url: 'https://scispace.com/papers/liii-on-lines-and-planes-of-closest-fit-to-systems-of-points-1e8e1ja94b'
  accessed: '2026-10-15'
---

**状态：已提供基础导读；个人阅读、推导与验证进度私下保存。引用量尚未统一核验。** 本页是有限选读入口，不是全文精读记录。学习次序见[公共基础路线](/notes/research-foundations-roadmap/)，统一阅读方法见[基础论文阅读入口](/notes/foundations-paper-reading/)。

## 从什么问题出发

有一团二维数据，能否用一条直线保留它的主要几何结构？这里关注点到直线的**垂直距离**，与把纵坐标当作因变量、只最小化纵向误差的普通线性回归不同。Pearson 的历史论文讨论点集的直线和平面拟合，是把投影、方差和低维表示接起来的合适入口。

不过，1901年原文的符号和叙述需要转换。先学[第09章正交投影](/notes/foundations-09-orthogonal-projection/)与[第10章最小二乘](/notes/foundations-10-least-squares/)，再接[第14章SVD](/notes/foundations-14-svd/)和[第15章PCA](/notes/foundations-15-pca/)；随机协方差的解释在[第38章](/notes/foundations-38-joint-distributions/)补齐。先用二维几何例选读，再扩展统计含义。

## 用现代符号说清核心概念

先对每个数据点减去所有点的均值，再寻找通过原点的最佳方向：

$$
\min_{\|\boldsymbol u\|=1}
\frac1N\sum_{i=1}^{N}
\left\|\boldsymbol z_i-\boldsymbol u(\boldsymbol u^\top\boldsymbol z_i)\right\|^2,
\qquad \boldsymbol z_i=\boldsymbol x_i-\bar{\boldsymbol x}.
$$

$N$ 是点数，$i$ 是点的编号，$\boldsymbol x_i$ 是第 $i$ 个列向量，$\bar{\boldsymbol x}$ 是样本均值，$\boldsymbol z_i$ 是中心化后的点。$\boldsymbol u$ 是待求的单位方向；$\top$ 表示转置，$\boldsymbol u^\top\boldsymbol z_i$ 是内积，$\boldsymbol u(\boldsymbol u^\top\boldsymbol z_i)$ 是投影向量，$\|\cdot\|$ 是欧几里得长度。$\sum$ 表示把各点的平方距离相加，$\min$ 表示寻找最小值。

单位长度约束使 $\boldsymbol u$ 表示方向而不任意缩放。在同一坐标度量下，总平方长度固定，因此减少丢掉的平方长度，等价于增加投影保留的平方长度。现代 PCA 的主方向与这一几何目标相连；这段式子是现代符号重述，不是逐字复写历史原文。

## 原文先读哪里

先读正式期刊页码 **559–562** 的问题设置与直线、平面拟合推导，然后在后续部分寻找主轴与拟合误差的联系。第一轮只把二维情形重写成自己的符号，说明“距离到底沿哪个方向测量”。高维代数不要求一次追完。

## 最小验证：四个点就够

取四点 $(2,0),(-2,0),(0,1),(0,-1)$。均值为零。投影到横轴时，四个平方误差为 $0,0,1,1$，平均为 **0.5**；投影到纵轴时为 $4,4,0,0$，平均为 **2**。按 $1/N$ 定义的协方差矩阵为对角矩阵，两个对角元素为 **2、0.5**，较大特征值对应横轴。

请手算这两个误差，再任选一个斜方向验证。正确预期是横轴取得最小平均重构误差；方向取反得到同一条直线。若用 $1/(N-1)$ 定义样本协方差，特征值会一起缩放，主方向不变。以上是待完成的验证任务，尚未据此登记为已复现。

## 适用边界与阅读产物

坐标单位和缩放会改变结果；没有中心化时，通过原点的拟合又是另一问题。最大方差不保证最大预测价值，更不能直接推出因果关系；离群点也可能显著影响平方误差。完成后应留下自己的二维图、误差计算和一段“与普通回归的区别”，而不是只摘抄特征向量公式。

正式书目为 **2(11), 559–572 (1901)**。[出版社 DOI](https://doi.org/10.1080/14786440109462720) 用于核对原始发表信息；[Zenodo 历史扫描记录](https://zenodo.org/records/1430636) 提供公开原文入口。出版社网页的后续数字化日期不应替代 1901 年。主页分享自己的导读与验证记录，全文阅读通过上述公开链接完成。

引用卡片为 [SciSpace 对应原始 DOI 的记录](https://scispace.com/papers/liii-on-lines-and-planes-of-closest-fit-to-systems-of-points-1e8e1ja94b)，查阅于 2026-10-15。12,809 是该索引的总引用快照，可能延迟更新；未执行排除自引审计，也不与其他版本或数据库数字相加。
