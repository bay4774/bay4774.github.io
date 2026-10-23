---
title: '76 · 合成测量项目：数据、实现与复算'
description: '合成测量项目：数据、实现与复算，以可复算的合成证据连接基础和论文阅读。'
date: '2026-10-16'
tags: ['Foundations', 'Research Methods']
category: 'lecture'
foundationChapter: 76
foundationOrder: 86
readTime: 22
chapters: 7
reviewStatus: 'reviewed'
demo: false
draft: false
---

先修：[10 · 最小二乘：从残差推导拟合](/notes/foundations-10-least-squares/) · [43 · 线性回归的统计解释：误差、估计与方差](/notes/foundations-43-regression-inference/) · [61 · 量纲、尺度与拟合：检查观测模型](/notes/foundations-61-scales-models/) · [65 · 数值最小二乘：QR、秩与返回值](/notes/foundations-65-numerical-least-squares/) · [75 · 研究协议：先锁定问题、基线和评价](/notes/foundations-75-research-protocol/)。

[章节索引](/notes/foundations-course-index/) · [公共基础路线](/notes/research-foundations-roadmap/) · [下一章：项目不确定性：参数、预测与覆盖率](/notes/foundations-77-capstone-uncertainty/)

## 1. 问题：怎样把协议变成能复算的计算

前章已经锁定问题、真值、基线和划分。现在实现时最容易漏掉的是：训练和测试是否共享了观测，常数基线是否偷看测试均值，代码输出是否对应写下的指标。

本章给可下载的标准库脚本，并用手算与实际运行相互核查。它是公开合成教学案例，不是个人研究成果，也不要求采集私人实验室数据。

## 2. 数据和求解方法先说明

真值$\beta_0=.75,\beta_1=1.5,\sigma=.3$，训练$x\sim U[-1,1]$，噪声独立高斯。拟合$\hat y=\hat\beta_0+\hat\beta_1x$，基线是训练观测均值。测试另生成输入与噪声，不用于拟合。

中心化一元最小二乘为
$$
\hat\beta_1=\frac{\sum(x_i-\bar x)(y_i-\bar y)}{S_{xx}},\quad
\hat\beta_0=\bar y-\hat\beta_1\bar x,\quad S_{xx}=\sum(x_i-\bar x)^2.
$$
Sxx>0才识别斜率；代码不形成逆矩阵，使用math.fsum求和。它适合本案例O(1)尺度的一元设计，不是任意病态多变量求解器。

中心化公式来自两条最小二乘条件：$\sum r_i=0$先给$\hat\beta_0=\bar y-\hat\beta_1\bar x$；代入$\sum x_ir_i=0$，剩下$\sum(x_i-\bar x)(y_i-\bar y)=\hat\beta_1S_{xx}$。这里$O(1)$只说输入数值的量级适中，不是说样本数无论多少计算时间都恒定。`math.fsum`是标准库中改善浮点求和的函数，也不能补回输入中从未出现的信息。

## 3. 完整算例：先建立一个三点基准

给x=(−1,0,1)、y=(−.8,.7,2.4)。x均值0、y均值23/30、Sxx=2，交叉和3.2，因此斜率1.6、截距23/30。

交叉和逐项为$(-1)(-.8-\bar y)+0(.7-\bar y)+(1)(2.4-\bar y)=3.2$，因两个$\bar y$项抵消。残差精确为$(1/30,-1/15,1/30)$，平方和$1/900+1/225+1/900=1/150$，再除样本数3得训练MSE$1/450$。代码的残差方差估计用$1/(n-2)$而非$1/n$，这个三点例会给$1/150$；它与训练MSE是不同输出，77章会解释用途。

预测约(−.833333,.766667,2.366667)，残差(.033333,−.066667,.033333)，训练MSE=.00222222。残差和及x加权残差和为0。手算基准检验的是计算关系，不证明真实测量恰好如此。

脚本还用无噪点(−1,−.75)、(0,.75)、(1,2.25)核验回收(.75,1.5)，并拒绝所有x相同的输入。不要在不可识别时返回一个看似精确的斜率掩盖问题。

## 4. 下载与命令

[下载capstone.py](/research-foundations/capstone.py)。使用Python3.10以上标准库即可，无NumPy依赖；已核验运行环境为Python3.11.9。代码只在内存生成观测，输出终端，不下载、上传或读取私人数据，也不自动写结果文件。

第一次运行时，先把文件保存到自己能找到的文件夹，确认文件名确为`capstone.py`，而不是`capstone.py.txt`。在这个文件夹打开终端，再执行下方命令；这些是终端命令，不应粘到Python显示`>>>`的交互窗口。Windows PowerShell可先用`Get-Location`查看当前文件夹，用`Get-ChildItem -LiteralPath .\capstone.py`确认文件在这里，然后用`python --version`查看解释器版本。

若`python`找不到，先处理解释器入口，见[Python官方Windows说明](https://docs.python.org/3/using/windows.html)；已有可用`py -3`启动器时，可把下面的`python`替换为`py -3`，并记录实际版本。其他系统已有`python3`时可相应替换。版本与入口确认后才运行脚本，无需先学习虚拟环境或安装科学计算库；本章也不要求先读懂全部函数实现。

~~~text
python -B capstone.py --self-check
python -B capstone.py --seed 7 --train 12 --test 40 --repeats 5
python -B capstone.py
python -B capstone.py --json
~~~

先自检，再用不同于主运行的试跑seed7，最后默认主seed20261016。默认训练80、测试200、重复300。样本量对照固定20/80/320；--train只改变四个主情形。seed需非负，训练≥3、测试≥1、重复≥2。

`-B`用于禁止写入字节码缓存，`--self-check`只做五项自检，`--json`把完整结构化结果打印到终端。`-B`见[Python命令行说明](https://docs.python.org/3/using/cmdline.html)，其余选项由本脚本定义。一次只执行一行，等回到终端提示符再执行下一行。若报`can't open file`，先核对文件名和所在文件夹；若版本低于3.10，先换兼容解释器。自检应出现五个`passed`，默认运行应出现四情形表和样本量对照；出现报错时保留原文，不把书上的预期数值填成自己的输出。

## 5. 实际运行结果怎样核对

原教学验证中的五项自检已通过：三点拟合、无噪回收、常输入拒绝、同种子重现、分开流不同。默认匹配线性情形，平均训练观测MSE=.088017、测试观测MSE=.092047、信号MSE=.002151，训练均值基线测试MSE=.853008。

第一次匹配重复的参数为(.7491408865,1.4117433331)，残差和约3.55×10⁻¹⁵、x加权残差和约2.32×10⁻¹⁵。参数有噪声偏差而残差正交仍成立，二者不矛盾。

两次完整JSON输出逐字相同，证明该环境、代码、参数下可重算；不把相同种子的复算当两份独立统计证据。不同情形复用对应流做配对，训练/测试各自分开，不同重复按预设种子生成。

英文表头可这样对照：`train MSE`是训练观测误差，`test MSE`是独立测试观测误差，`signal MSE`用合成无噪均值评价，`mean-only MSE`是训练均值基线。JSON中每个指标的`mean`是300次指标的平均，`mcse`是这个平均的模拟标准误。先核对情形名称、参数和列含义，再比较小数；换运行环境或种子后结果可能不同，不以逐位吻合作为所有平台的数学定理。

## 6. 两题自测与步骤答案

1. 用无噪点(−1,−.75)、(0,.75)、(1,2.25)求系数；在x=2预测多少？
2. 同一真实线性信号在x=2为3.75，独立含噪观测3.9。预测3.75时，观测与信号平方误差各多少？它们为什么不是同一个指标？

答案1：x均值0、y均值.75，交叉和3、Sxx2，斜率1.5、截距.75，预测.75+1.5×2=3.75。
答案2：观测误差.15，平方.0225；信号误差0。新观测仍有噪声，估计无噪均值正确不意味着每次读数都被精确预测。

## 7. 出口与官方参考

运行记录至少保留环境、命令、参数、数据机制与实际输出。若只有一个好看MSE，还未解释参数和预测有多不确定；下一章推导已知合成噪声下的区间与覆盖核验。

库接口可对照[NumPy lstsq](https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html)，但本代码不依赖它；随机数约定见[Python random](https://docs.python.org/3/library/random.html)。没有运行过的额外交叉检查不要填成实测结果。
