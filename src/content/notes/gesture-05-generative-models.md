---
title: 'G08 · 从噪声逐步得到动作：条件扩散的训练与采样'
description: '区分动作时间和扩散步数，推导加噪、噪声预测与动作恢复，解释条件指导、拼接及运行时权衡。'
date: '2026-10-17'
tags: ['Co-speech Gesture', 'Direction Foundations']
category: 'lecture'
directionTrack: 'gesture'
directionChapter: 8
readTime: 38
chapters: 7
demo: false
draft: false
---

先修：[G05 条件分布](/notes/gesture-04-conditional-generation/)、[G07 潜变量](/notes/gesture-10-latent-variables/)、[39 高斯](/notes/foundations-39-gaussians/)、[72 随机梯度](/notes/foundations-72-stochastic-gradients/)。本章提供足以手算和实现最小原型的扩散语言，不把一个加噪公式冒充完整手势系统。

## 1. 两个“时间”必须用不同符号

动作片段含物理帧 $t=0,\ldots,T-1$，相隔 $1/f_m$ 秒；将标准化后的片段展平为 $x_0\in\mathbb R^{TD}$。扩散步 $k=1,\ldots,K$ 是算法中的噪声层级，不是动作播放时刻。一个 $x_k$ 仍是一整段动作的带噪表示，而不是第 $k$ 帧姿态。

条件 $C$ 包含已对齐语音、文本或允许的历史。模型学习 $p_\theta(x_0\mid C)$，推理从噪声出发逐层去噪。因此 30 帧动作可以使用 50 个算法步，也可以使用其他经过验证的采样步数；动作帧率与去噪步数没有固定相等关系。

## 2. 从一步高斯加噪得到任意噪声层

定义噪声率 $0<\beta_k<1$，$\alpha_k=1-\beta_k$，一步过程为 $x_k=\sqrt{\alpha_k}x_{k-1}+\sqrt{\beta_k}\epsilon_k$，$\epsilon_k\sim\mathcal N(0,I)$ 独立。信号缩小、噪声加入，两者平方系数相加为 1。

设 $\bar\alpha_k=\prod_{j=1}^k\alpha_j$。将前一步递归代入，独立高斯噪声的方差相加，得到可直接采样的边际式

$$
x_k=\sqrt{\bar\alpha_k}x_0+\sqrt{1-\bar\alpha_k}\epsilon,\qquad\epsilon\sim\mathcal N(0,I).
$$

这是一条已知的数据破坏过程，不需要网络学习。只有当噪声日程使 $\bar\alpha_K$ 足够小，终态才近似标准高斯。若只加很少噪声却在生成时从纯高斯开始，训练和采样的起点分布可能不匹配。

## 3. 噪声预测目标及完整手算

从训练集中抽 $x_0,C$，再抽 $k,\epsilon$ 构造 $x_k$；网络 $\epsilon_\theta(x_k,k,C)$ 预测加进去的噪声，常见简化目标为 $\mathbb E\|\epsilon-\epsilon_\theta\|^2$。训练输入包含噪声层级，因为相同数值在不同信噪比下应作不同解释。模型并非每次都从零开始猜整条动作。

标量例：$x_0=1$，$\bar\alpha_k=0.64$，抽到 $\epsilon=-0.5$。于是 $x_k=0.8(1)+0.6(-0.5)=0.5$。若网络预测 $\hat\epsilon=-0.4$，噪声平方误差为 $(-0.5+0.4)^2=0.01$。由加噪式反解

$$
\hat x_0=\frac{x_k-\sqrt{1-\bar\alpha_k}\hat\epsilon}{\sqrt{\bar\alpha_k}}
=\frac{0.5+0.24}{0.8}=0.925.
$$

恢复误差为 $-0.075$；若预测完全正确，$(0.5+0.3)/0.8=1$。噪声预测误差会乘以 $\sqrt{(1-\bar\alpha_k)/\bar\alpha_k}$，本例为 0.75。当 $\bar\alpha_k=0.01$ 时因子约为 9.95，故不同噪声层级的动作恢复误差尺度不同。

## 4. 训练一步不等于推理一步

一个常见 DDPM 参数化的反向均值为

$$
\mu_\theta(x_k,k,C)=\frac1{\sqrt{\alpha_k}}\left[x_k-\frac{\beta_k}{\sqrt{1-\bar\alpha_k}}\epsilon_\theta(x_k,k,C)\right].
$$

为什么会出现这个均值？训练时知道$x_0$，可以用Bayes公式把$q(x_k\mid x_{k-1})$与$q(x_{k-1}\mid x_0)$相乘。两者指数都是关于$x_{k-1}$的二次式，其合并精度为$\alpha_k/\beta_k+1/(1-\bar\alpha_{k-1})$。取倒数并配方，$k>1$时得到

$$
\widetilde\beta_k=
\frac{\beta_k(1-\bar\alpha_{k-1})}{1-\bar\alpha_k},\qquad
\widetilde\mu_k=
\frac{\sqrt{\bar\alpha_{k-1}}\beta_k}{1-\bar\alpha_k}x_0
+\frac{\sqrt{\alpha_k}(1-\bar\alpha_{k-1})}{1-\bar\alpha_k}x_k.
$$

这是知道干净样本时的条件后验。生成时$x_0$未知，将上节的$\hat x_0$代入$\widetilde\mu_k$并整理，便得到$\mu_\theta$的噪声参数化。网络在近似未知的数据反向过程，不能把“已知$x_0$的高斯后验”误称为“只给$x_k$时真实反向分布必然高斯”。

一个明确的教学采样设定是：$k>1$取$\sigma_k^2=\widetilde\beta_k$，采样$x_{k-1}=\mu_\theta+\sigma_k\xi$，$\xi\sim\mathcal N(0,I)$；$k=1$不再加随机噪声。原始方法也讨论其他方差选择，应记录所选方案，不能和任意别的更新规则混用。

连接前面的数字：取$\beta_1=\beta_2=0.2$，则$\bar\alpha_2=0.64$，$\widetilde\beta_2=0.2(0.2)/0.36=1/9$。$x_2=0.5,\hat\epsilon=-0.4$时，$\mu_\theta=[0.5-0.2(-0.4)/0.6]/\sqrt{0.8}\approx0.708088$，采样标准差为$1/3$。抽到$\xi=0$时$x_1$等于均值，却不等于诊断得到的$\hat x_0=0.925$。这说明“下一噪声层”和“最终干净动作”不是同一个变量。

上节直接恢复 $\hat x_0$ 只是诊断公式；在高噪声层一跳到终点未必产生好样本。减少采样步数通常需要匹配的采样算法与验证，不能简单跳过若干循环并假设分布不变。总生成耗时还取决于每步网络规模、片段长度和设备。

## 5. 条件指导、动作合法性与拼接边界

一种无分类器指导约定为 $\hat\epsilon=\epsilon_{\mathrm{uncond}}+s(\epsilon_{\mathrm{cond}}-\epsilon_{\mathrm{uncond}})$。$s=0$ 为无条件，$s=1$ 为普通有条件；这需要训练时适当丢弃条件，使无条件分支可用。其他文献可能用平移过的指导参数，比较时要给公式。增加 $s$ 可能增强条件响应，也可能降低多样性或引入伪影，不保证单调提高人感质量。

在六维旋转或标准化位置上加高斯噪声是表示空间操作，带噪中间态不必是合法骨架。最终必须解码、反归一化并检查骨长、关节限位与碰撞；平滑去噪不自动满足物理约束。

长语音常分段生成。仅让相邻段首尾位置相同，速度仍可能不连续；重叠融合也要尊重旋转表示。使用前段作为条件时，应说明生成中的历史与训练时真值历史的差异。离线完整语音条件不能直接转述为实时响应。

## 6. 自测与步骤答案

**题1。** $\bar\alpha=0.25,x_0=2,\epsilon=0$，带噪变量是多少？为何仍不等于原动作？

**解。** $x_k=0.5\times2+\sqrt{0.75}\times0=1$。即使这次抽到零噪声，信号也按系数缩小；不能把加噪理解成只做加法。

**题2。** 无条件噪声预测为 0.2，有条件为 0.5，按本章公式 $s=2$ 的结果是多少？

**解。** $0.2+2(0.5-0.2)=0.8$。这是沿两预测差方向外推，不是保证真实噪声应为 0.8，也不证明更大指导更好。

## 7. 可复现实验与出口

先固定一个二维 $x_0$，只重复抽取独立噪声，验证不同 $\bar\alpha$ 下的条件均值 $\mathbb E[x_k\mid x_0]=\sqrt{\bar\alpha}x_0$ 和条件协方差 $(1-\bar\alpha)I$，检查手算恢复公式。随后再从已知高斯或双峰分布抽取不同 $x_0$；若噪声与数据独立，总体协方差应为 $\bar\alpha\operatorname{Cov}(x_0)+(1-\bar\alpha)I$，不能与前面的条件噪声协方差直接比较。

固定随机种子，再训练小噪声预测器。最小实验先完整执行与训练日程一致的所有反向步，检查样本分布。若要比较10步和50步，应另选明确定义的缩步采样算法并报告使用的时间层级及更新式；或者分别训练两种噪声日程，但此时不能把差异全部归因于推理步数。不能在本章相邻步DDPM公式中直接跳过40步。保留所有随机种子和样本；迁移到镜像动作时增加速度与骨长检查。此处未声称训练或采样实验已运行。

出口：能区分已知加噪、训练噪声预测、反向采样和动作解码四个环节。原始来源：[Ho 等，DDPM](https://arxiv.org/abs/2006.11239)；手势中的条件扩散实例：[Zhu 等，DiffGesture](https://arxiv.org/abs/2303.09119)。本章不复述这些论文的效果排名。

[上一章：G07 · 给同一句话留下选择：潜变量与条件 VAE](/notes/gesture-10-latent-variables/) · [方向目录](/notes/direction-foundations/) · [下一章：G09 · 动作在强调什么：节拍、语义、风格与身份](/notes/gesture-06-style-semantics/)
