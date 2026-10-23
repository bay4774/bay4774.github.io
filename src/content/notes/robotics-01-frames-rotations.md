---
title: 'R01 · 机器人头的空间语言：坐标、旋转与刚体变换'
description: '从颈部、眼球和相机的坐标系出发，建立 SO(3)、齐次变换及可核验的变换顺序。'
date: '2026-10-17'
tags: ['Bionic Robot Head', 'Direction Foundations']
category: 'lecture'
directionTrack: 'robotics'
directionChapter: 1
readTime: 24
chapters: 7
demo: false
draft: false
---

先修：[03 三角函数](/notes/foundations-03-trigonometry/)、[05 矩阵与映射](/notes/foundations-05-matrices-maps/)、[08 内积](/notes/foundations-08-inner-products/)、[12 行列式](/notes/foundations-12-determinants/)。公共基础已解释矩阵运算；本章解释同一数表在机器人头里究竟表示什么。

## 1. 一个点为什么有几套坐标

机器人底座不动，头会转，眼球还会相对头转。相机测到目标在“相机前方”并不等于目标在“底座前方”。建立右手坐标系：底座系记为 $B$，头系为 $H$；本讲统一 $x$ 向前、$y$ 向左、$z$ 向上，长度用米，角度计算用弧度。真实硬件若不同，应显式写转换，不能靠图像直觉改符号。

$p^H\in\mathbb R^3$ 读作“点在头系中的坐标”，三个分量均为米；上标是坐标标签，不是乘方。$t_{BH}\in\mathbb R^3$ 是头系原点在底座系的位置。一个物理点可以不动，但它在旋转相机中的坐标仍会变化。必须先确定要移动物体，还是只换描述它的坐标系。

## 2. 用三个轴构造旋转矩阵

将头系三个单位轴在底座系中的表示排成列，得到 $R_{BH}\in\mathbb R^{3\times3}$，无量纲。于是 $p^B=R_{BH}p^H+t_{BH}$。它的第一列回答“头的前方在底座里指向哪里”，而不是第一行。

刚体旋转保留轴的长度和夹角，所以 $R^\top R=I_3$；保持右手性又要求 $\det R=1$。满足这两条的矩阵集合记为 $SO(3)$。第一条单独允许镜像，例如 $\operatorname{diag}(1,1,-1)$，其行列式为 $-1$，不能表示头部真实旋转。由正交性可得 $R^{-1}=R^\top$，这条便宜的逆运算依赖于矩阵确实是旋转矩阵。

按右手法则绕 $z$ 轴正转 $\theta$，正 $x$ 轴朝正 $y$ 轴转，因此

$$
R_z(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix}.
$$

将 $e_x=(1,0,0)^\top$ 代入，输出 $(\cos\theta,\sin\theta,0)^\top$，就是检查正号的办法。绕 $y$ 轴的矩阵为 $R_y(\phi)=\begin{bmatrix}\cos\phi&0&\sin\phi\\0&1&0\\-\sin\phi&0&\cos\phi\end{bmatrix}$，故这里正 $\phi$ 使前向轴朝下倾，符合右手约定；若产品界面规定“抬头为正”，应令该界面的抬头角等于 $-\phi$。

## 3. 复合、反向与四维记账

眼系为 $E$，先从眼到头，再从头到底座，得到 $R_{BE}=R_{BH}R_{HE}$；右侧先作用。平移也要先转到共同坐标系：$t_{BE}=t_{BH}+R_{BH}t_{HE}$。直接相加两个坐标系下的平移一般错误。

定义齐次矩阵 $T_{BH}=\begin{bmatrix}R_{BH}&t_{BH}\\0_{1\times3}&1\end{bmatrix}\in\mathbb R^{4\times4}$，则 $\bar p^B=T_{BH}\bar p^H$，其中 $\bar p=(p^\top,1)^\top$。附加的 1 用于让平移参与乘法，不是第四个空间维度。方向向量使用末位 0，因此平移不改变方向。由 $p^H=R_{BH}^\top(p^B-t_{BH})$ 可逐项读出

$$
T_{BH}^{-1}=\begin{bmatrix}R_{BH}^\top&-R_{BH}^\top t_{BH}\\0&1\end{bmatrix},\qquad T_{BE}=T_{BH}T_{HE}.
$$

矩阵的平移列带米，旋转块无量纲；齐次坐标是混合单位的记账工具，不能将四个分量当普通欧氏长度求范数。

## 4. 完整算例：旋转后的眼前目标

设头原点在底座 $t_{BH}=(0,0,0.5)^\top\,\mathrm m$，偏航 $90^\circ=\pi/2$，目标在头系 $p^H=(0.2,0.1,0)^\top\,\mathrm m$。

1. 代入三角值，$R_{BH}=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}$。
2. 先转坐标：$Rp^H=(-0.1,0.2,0)^\top\,\mathrm m$。
3. 再加原点位置，$p^B=(-0.1,0.2,0.5)^\top\,\mathrm m$。
4. 反算 $R^\top[p^B-t]=(0.2,0.1,0)^\top$，恢复输入；旋转前后相对头原点的距离都为 $\sqrt{0.05}\,\mathrm m$。

若眼原点在头前方 $t_{HE}=(0.05,0,0)^\top\,\mathrm m$，它在底座的位置是 $(0,0.05,0.5)^\top$，不是 $(0.05,0,0.5)^\top$。这一步最适合检查平移是否漏转。

## 5. 边界：三个角并非可任意相加

以 $e_x$ 为例，$R_z(\pi/2)R_y(\pi/2)e_x=(0,0,-1)^\top$，交换顺序却得到 $(0,1,0)^\top$。所以“先点头再转头”和“先转头再绕底座固定轴点头”不是同一操作。欧拉角还可能在某些姿态失去唯一表示；这不表示物理头部突然少了自由度。

对两个旋转矩阵逐元素平均也不保证仍在 $SO(3)$。例如 $I$ 与 $R_z(\pi)$ 的平均为 $\operatorname{diag}(0,0,1)$，已压扁平面。需要插值时，应使用明确的旋转插值或将近似矩阵投影回旋转集合，并检查手性。本章不要求先掌握李群微积分。

## 6. 自测与步骤答案

**题1。** $R_{BH}=R_z(\pi/2)$、$t_{BH}=(1,0,0)^\top\,\mathrm m$，头系点 $(1,0,0)^\top$ 与方向 $(1,0,0)^\top$ 在底座中各为什么？

**解。** 两者先旋转为 $(0,1,0)^\top$；点再加平移得 $(1,1,0)^\top\,\mathrm m$，方向不加平移，仍为 $(0,1,0)^\top$。区别来自齐次末位分别为 1 和 0。

**题2。** $A=\operatorname{diag}(1,2,1)$、$C=\operatorname{diag}(1,-1,1)$，谁是旋转矩阵？

**解。** $A^\top A=\operatorname{diag}(1,4,1)\ne I$，含缩放；$C^\top C=I$，但 $\det C=-1$，含镜像。因此都不在 $SO(3)$。

## 7. 可复现实验与出口

用计算器或数组程序按本章公式生成 $0,\pi/4,\pi/2$ 三个偏航矩阵；输入三个单位轴和算例点，保存角度、矩阵、正向及反向结果。检查 $\|R^\top R-I\|_F$、$|\det R-1|$ 和往返误差，双精度教学计算可先以 $10^{-12}$ 为检查尺度，不能把它当硬件精度。再故意把平移先加后转，记录何时两者不等。以上是待执行流程，文中数字为合成手算。

出口：看到 $T_{BH}$ 能说明方向、单位、乘法顺序，并能把相机目标统一到底座系。这也供物理约束与动作生成方向引用。作者教材定位：[Lynch 与 Park，旋转矩阵](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-2-1-rotation-matrices-part-1-of-2/)和[齐次变换](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-3-1-homogeneous-transformation-matrices/)，用于核对约定；本章例子为原创教学例。

[方向目录](/notes/direction-foundations/) · [下一章：R02 · 从关节角到注视方向：头部机构的正逆运动学](/notes/robotics-02-kinematics/)
