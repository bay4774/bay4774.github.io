---
title: 'L05 · Transformer：残差、归一化与训练流程'
description: '把注意力组成完整模块，逐项核对参数量、层形状、标签和数据划分。'
date: '2026-10-17'
tags: ['Large Language Models', 'Direction Foundations']
category: 'lecture'
directionTrack: 'llm'
directionChapter: 5
readTime: 24
chapters: 7
demo: false
draft: false
---

先修：[L02 · 交叉熵](/notes/llm-09-autoregressive/)、[L03 · 注意力](/notes/llm-02-attention/)、[L04 · 位置与上下文](/notes/llm-10-position-context/)、[71 · 梯度下降](/notes/foundations-71-gradient-descent/)、[74 · 反向求导](/notes/foundations-74-reverse-mode/)。

[方向总入口](/notes/direction-foundations/) · [上一章：L04 · 位置与上下文：词序、旋转编码与 KV 缓存](/notes/llm-10-position-context/) · [下一章：L06 · 一次训练更新怎样发生：有效词元、Adam与资源](/notes/llm-13-training-numerics/)

## 1. 本章问题：一个注意力头离语言模型还缺什么

模型需要把词元嵌入变成上下文表示，再投影到词表 logits。中间模块通常还包含逐位置前馈网络、残差连接和归一化。每层的输入输出形状相同，才方便堆叠；注意力在位置之间混合，前馈网络在每个位置内部变换特征。

本章固定一个便于核算的 decoder-only 教学结构，不把它冒充所有现有大模型的统一实现。原始 Transformer 论文使用编码器—解码器结构；“Transformer”这一名称并不意味着每个模型都具有同样的归一化位置、激活和参数共享方式。

## 2. 一个 Pre-Norm 模块的完整形状链

输入 $H\in\mathbb R^{N\times d}$。设注意力输出已投影回 $d$ 维，则

$$
U=H+\operatorname{Attn}(\operatorname{LN}(H)),\qquad
H'=U+\operatorname{FFN}(\operatorname{LN}(U)).
$$

两条加法两边都是 $N\times d$。前馈网络取 $\operatorname{FFN}(x)=\phi(xW_1)W_2$，$W_1\in\mathbb R^{d\times d_f},W_2\in\mathbb R^{d_f\times d}$；$\phi$ 是逐元素非线性。若没有非线性，两矩阵相乘仍只是一个线性映射，不能提供同样的表达能力。

残差项为梯度和表示提供直接路径，但不保证任意深度都容易训练。输出层将最终表示乘 $W_{\rm out}\in\mathbb R^{d\times V}$ 得到 $N\times V$ logits。因果掩码和错位标签沿用L02、L03，而不是到训练最后才添加。

## 3. 归一化手算与适用范围

LayerNorm 对每个位置的 $d$ 个特征计算均值 $\mu=d^{-1}\sum_jx_j$ 和方差 $s^2=d^{-1}\sum_j(x_j-\mu)^2$，输出 $\gamma_j(x_j-\mu)/\sqrt{s^2+\epsilon}+\beta_j$。$\gamma,\beta\in\mathbb R^d$ 为可学习参数，$\epsilon>0$ 用于数值稳定。

取一个位置 $x=(1,3)$，均值2、方差1；为手算暂取 $\epsilon=0,\gamma=(1,1),\beta=(0,0)$，输出为 $(-1,1)$。程序应保留正的 $\epsilon$，常数输入否则会除零。该方差是特征归一化定义，不是无偏样本方差，不应除以 $d-1$。

LayerNorm 的原始定义可查 [Ba、Kiros 与 Hinton 原论文](https://arxiv.org/pdf/1607.06450)。本章将归一化放在子层前；原始 Transformer 的结构选择应按其原文区分，不能混写成同一公式。

## 4. 参数量完整核算：先列统计约定

取词表 $V=10$、模型维数 $d=4$、前馈宽度 $d_f=8$，一个单头模块，使用固定位置编码。所有线性层不含偏置；两次 LayerNorm 均有缩放和偏移；不加额外最终归一化。

嵌入有 $10\times4=40$ 个参数；QKV三矩阵共 $3\times4\times4=48$；输出投影 $W_O$ 有16；前馈两矩阵为 $4\times8+8\times4=64$；两次LayerNorm共 $2\times(4+4)=16$；独立词表输出层再有40。合计 $40+48+16+64+16+40=224$。

若输出层与嵌入转置共享，最后40不再独立计数，总数184。核验时数“独立可训练标量”，不能因为同一张表在计算中用了两次就重复计数。参数量也不等于训练显存，还需梯度、优化器状态、激活和临时张量。

## 5. 可复现训练流程与数据边界

先按原始文档或来源组划分训练、验证、测试，再做切块和词元化规则学习，检查重复或近重复跨集合。记录词表版本、序列长度、标签移位、损失掩码、批大小、学习率、随机种子和停止规则。验证集用于选择超参数；测试集只用于最终预定评价。

先让一个微型批次前向通过，列出每层形状和有效标签数；再检查交叉熵梯度有限且参数有变化；最后比较训练与验证损失。单个微型批次可以用于实现核验，但在它上面过拟合成功不证明泛化。梯度累积需要按有效词元数正确加权，长短批次不能任意平均成另一目标。

反例：同一篇文档的相邻重叠窗口随机分到训练与测试，测试可能含训练片段，低损失被泄漏夸大。扩充参数量不会修复这种评价设计。

## 6. 独立自测与步骤答案

1. 若 $N=6,d=4,d_f=8$，FFN中间与最终矩阵形状是什么？
2. 主例增加一层同结构模块、嵌入输出层不变，增加多少参数？
3. 为什么归一化输出为零均值不意味着模型隐藏向量永远零均值？

答案1：先 $6\times4$ 乘 $4\times8$，得 $6\times8$；再乘 $8\times4$，得 $6\times4$。

答案2：增加注意力64、FFN64、LayerNorm16，共144；共享的嵌入和独立输出层只各计一次。

答案3：可学习偏移和缩放会改变统计量，残差加法和后续变换也会改变分布；不能把某一步的标准化性质推广到所有层状态。

## 7. 出口：先看形状和协议，再看曲线

能核算完整模块的形状、参数和有效监督位置，写出无泄漏划分后，进入[训练更新与资源](/notes/llm-13-training-numerics/)，把损失平均、梯度和优化器接成一次真正更新。随后学习解码：训练定义了条件分布，生成还需指定怎样从分布选择词元。
