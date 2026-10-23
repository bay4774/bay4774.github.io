---
title: '26 · Jacobian与链式法则：核对每一步形状'
description: '把多个输出的一阶变化排成Jacobian，沿复合映射推导矩阵链式法则，区分标量导数行与列梯度。'
date: '2026-10-16'
tags: ['Foundations', 'Multivariable Calculus']
category: 'lecture'
foundationChapter: 26
foundationOrder: 36
readTime: 18
chapters: 7
reviewStatus: 'reviewed'
demo: false
draft: false
---

## 1. 从一条函数到多输出计算

一个位置可能产生两个传感器读数；一组参数也可能输出整段预测。此时导数不能只是一条数值规则：需要记录每个输入怎样影响每个输出。

先修是[矩阵与线性映射](/notes/foundations-05-matrices-maps/)、[一元链式法则](/notes/foundations-18-derivatives/)与[多元可微](/notes/foundations-24-multivariable-differentiability/)。本章不依赖已经读过梯度章；需要用列梯度时会重新说明记号。

写 $F:\mathbb R^n\to\mathbb R^m$，输入 $x$ 有 $n$ 项，输出 $F(x)$ 有 $m$ 项。输入与输出维数先写在纸边，再计算偏导，往往能提前发现转置或次序错误。

## 2. Jacobian怎样组织所有偏导

若 $F=(F_1,\ldots,F_m)^\top$，定义

$$
J_F(x)=\left[\frac{\partial F_i}{\partial x_j}(x)\right]
\in\mathbb R^{m\times n}.
$$

行对应输出，列对应输入。第 $i$ 行是第 $i$ 个标量输出对全部输入的一阶系数。可微时
$F(a+h)=F(a)+J_F(a)h+r(h)$，其中 $\|r(h)\|/\|h\|\to0$。

例如 $F(x,y)=(x+y,xy)$，Jacobian是 $\begin{pmatrix}1&1\\y&x\end{pmatrix}$。右乘 $(h_1,h_2)^\top$ 后，两个输出变化分别近似为 $h_1+h_2$ 和 $yh_1+xh_2$，与直接展开一致；第二项真正的额外误差为 $h_1h_2$。

它表示小增量的映射，不是直接把输入点映成输出点的全局矩阵。即使能写 $F(x)\approx F(a)+J_F(a)(x-a)$，也不能一般删去截距或让整个区域共用同一个Jacobian。

和第24章一样，把偏导填成一张表并不自动证明可微；各分量的一阶误差需要共同满足上面的长度比值条件。若所有这些一阶偏导在邻域存在且连续，就是当前可用的安全充分条件。对于线性映射$F(x)=Ax$则$J_F=A$处处不变、余项为0；一般非线性函数需要保留考察点$a$。

## 3. 链式法则为什么按这个顺序相乘

令 $G:\mathbb R^m\to\mathbb R^k$，先通过 $F$，再通过 $G$。输入增量 $h$ 先近似变为 $J_F(a)h$，再变为 $J_G(F(a))J_F(a)h$，因此

$$
J_{G\circ F}(a)=J_G(F(a))J_F(a),\qquad
(k\times m)(m\times n)=k\times n.
$$

前提是两层在相应点可微，外层导数必须在中间值 $F(a)$ 上计算。矩阵通常不可交换；即使都是方阵、交换后形状还合法，结果也可能不同。检查维度是必要检查，不是全部正确性的证明。

标量输出 $\ell:\mathbb R^m\to\mathbb R$ 的导数是 $1\times m$ 行向量。若把这些偏导竖排，记成列梯度 $\nabla_z\ell$，链式法则便写作 $\nabla_x(\ell\circ F)=J_F^\top\nabla_z\ell$。转置来自行列约定，不是两套不同数学规律。

## 4. 完整算例：两层计算和展开核对

取 $F(x,y)=(x^2+y,xy)=(z_1,z_2)$，$\ell(z)=z_1^2+3z_2$，在 $(1,2)$ 求复合导数。

1. 中间值为 $(3,2)$，不能在原始 $(1,2)$ 直接计算外层偏导。
2. $J_F=\begin{pmatrix}2x&1\\y&x\end{pmatrix}$，点上为 $\begin{pmatrix}2&1\\2&1\end{pmatrix}$。
3. 外层导数行是 $(2z_1,3)=(6,3)$。
4. 相乘 $(6,3)J_F=(18,9)$。若用列梯度，则 $J_F^\top(6,3)^\top=(18,9)^\top$。
5. 展开复合函数 $(x^2+y)^2+3xy$，直接求两个偏导，得到 $4x(x^2+y)+3y$ 与 $2(x^2+y)+3x$，代入仍是18和9。

同一问题用两种途径核对，比只看最终数值更有信息。如果结果不一致，依次查中间值、局部导数、矩阵次序和转置。

## 5. 非方阵是很有用的检查工具

令 $F:\mathbb R^3\to\mathbb R^2$，$F(x,y,z)=(x+y,yz)$。其Jacobian为 $\begin{pmatrix}1&1&0\\0&z&y\end{pmatrix}$，必须是 $2\times3$。标量损失回到输入的列梯度须有3项，故需 $3\times2$ 的转置乘二维列梯度。

在$a=(1,2,3)$，原输出是$(3,6)$。若输入小增量$h=(0,.1,.2)$，$J_F(a)h=(.1,.7)$，所以预测新输出为$(3.1,6.7)$；真实新输出是$(3.1,2.1\cdot3.2)=(3.1,6.72)$。差$.02$来自被线性模型省掉的乘积$.1\cdot.2$。Jacobian乘增量得到的是“变化量的近似”，不是新输出本身，也不是每次都精确的变化量。

不能把每个变量都叫 $x$ 后忽略所在空间。公式 $\ell(F(x))$ 中，外层对中间变量求导与最终对参数求导是不同对象；它们恰由Jacobian连接。若一层在某点不可微，先查是否有另行定义的导数约定，不能自动沿用本章的普通链式法则。

## 6. 两道自测与步骤答案

1. 对上节 $F$，在 $(1,2,3)$ 写Jacobian，计算它作用于输入增量 $(1,0,-1)^\top$ 的结果。
2. 仍用这个 $F$，令 $\ell(z_1,z_2)=z_1+z_2^2$，求该点输入的三个偏导，用展开式核对。

**解答1：** 点上矩阵为 $\begin{pmatrix}1&1&0\\0&3&2\end{pmatrix}$，右乘增量得 $(1,-2)^\top$。这是两个输出的一阶变化，不是更新后的输出；原输出为 $(3,6)$。

**解答2：** 外层导数行为 $(1,2z_2)=(1,12)$，乘Jacobian得 $(1,37,24)$。展开 $\ell=x+y+y^2z^2$，直接偏导为 $(1,1+2yz^2,2y^2z)$，代入一致。列梯度是这个行向量的转置。

## 7. 出口与参考

出口：若 $F:\mathbb R^4\to\mathbb R^3$、$G:\mathbb R^3\to\mathbb R^2$，$J_{G\circ F}$ 是几乘几？答案 $2\times4$，乘法次序 $(2\times3)(3\times4)$。还要口述外层在哪个点求导。

下一章[Hessian与二阶模型](/notes/foundations-27-hessians/)继续对标量输出求一次导数，研究曲率。路径见[课程目录](/notes/foundations-course-index/)与[总路线](/notes/research-foundations-roadmap/)。

来源：[MIT 18.02SC](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/)，选多变量链式法则。自动微分实现是后面的应用，本章先把每一层的数学对象说明白。
