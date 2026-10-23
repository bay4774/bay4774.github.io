# 物理约束方向讲义内容核验

日期：2026-10-17。对象为公开教学内容，不记录学习者成绩或完成情况。

## 文件与教学顺序

按 `directionChapter` 阅读，slug 中数字保留早期路径，不充当教学顺序：

1. physics-01-physical-models：系统、状态、守恒与约束。
2. physics-02-rigid-body-dynamics：姿态、惯量、力矩，单摆能量预览。
3. physics-09-lagrangian-dynamics：广义坐标、虚功、Lagrange 推导与两坐标耦合。
4. physics-03-time-integration：显式、半隐式、隐式 Euler。
5. physics-04-contact-friction：单边接触、恢复关系、冲量，切向问题预览。
6. physics-10-friction：静/动摩擦、摩擦锥、斜面阈值。
7. physics-05-constrained-dynamics：约束求导、Jacobian、KKT、漂移。
8. physics-06-constraint-optimization：硬约束、软惩罚、投影与条件数。
9. physics-11-augmented-lagrangian：乘子、内外迭代与完整递推。
10. physics-07-physics-informed-learning：ODE 物理残差、初值、输入及参数导数。
11. physics-12-differentiable-simulation：离散敏感度、梯度检查、接触分支。
12. physics-08-evaluation：单摆及接触复现协议、物理与数值指标、有限结论。

每章实际 H2 数均为7，已用 PowerShell 正则计数；元数据无 `foundationChapter`、`foundationOrder`、`reviewStatus`。所有例子为合成教学对象。

## 实际复算

通过本次工具内独立 JavaScript 数值计算核对了以下值；这是算术与解析式核验，不是长期模拟、神经网络训练或用户作答验收。

- P01：冻结内力下速度0.6、-0.3，总动量0，动能0.27；增加3牛顿外力、0.1秒时整体冲量0.3。
- P02：2千克、0.5米点质量摆惯量0.5；30度重力矩-5、角加速度-10；初能量1.339745962155614焦耳。
- P03：静止直立下垂姿态的小车—摆质量矩阵 `[[2,1],[1,1]]` 代回加速度 `(1,-1)` 得广义力 `(1,0)`。
- P04：显式无阻尼单位振子100步、h=0.1，能量 `0.5*1.01^100=1.3524069147107642`；隐式及半隐式第一步独立代回更新式。
- P05：质量2、入射法速-3、e=0.2，法向冲量7.2、出射速度0.6、能量比0.04；摩擦上界1.8、切速1变0.1。
- P06：30度斜面法向力17.320508075688775牛顿；mu_k=0.4时向下加速度1.5358983848622452米每秒平方。
- P07：圆约束例 `J=[1,0]`，Schur 补0.5，乘子-18牛顿每米；反力(-18,0)，加速度(-9,-10)；`q·a+v·v=0`。
- P08：rho=1、9、99，惩罚解分别1.5、1.1、1.01，可行性误差0.5、0.1、0.01。
- P09：四轮 `(x,lambda)` 为(1.5,0.5)、(1.25,0.75)、(1.125,0.875)、(1.0625,0.9375)，与闭式递推一致。
- P10：线性函数族最优a=-0.6；两端残差0.4、-0.2，平均残差平方0.1，末端解误差0.03212055882855769。
- P11：两步Euler状态0.81，对kappa导数-0.18，平方终点误差梯度-0.0018000000000000015；连续导数-0.1637461506155964，明确二者对象不同。
- P12：单摆初加速度-1.9866933079506122；h=0.02后角速度-0.03973386615901225，半隐式角度0.19920532267681976；初能量0.19933422158758374，显式一步能量0.20012361164755488。

## 来源实际打开记录

以下均在本次通过 web.open 打开核验。正文以原创解释和上述合成小例为主体，链接用于定位原理或模型边界，不抄录长段原文。

- Modern Robotics 作者教材旋转矩阵：https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-2-1-rotation-matrices-part-1-of-2/
- 作者教材质量矩阵：https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-1-3-understanding-the-mass-matrix/
- 作者教材摩擦：https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-1-friction/
- 作者教材约束动力学：https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-7-constrained-dynamics/
- MIT 作者教材：https://underactuated.mit.edu/multibody.html 及 https://underactuated.mit.edu/trajopt.html
- MuJoCo 官方计算说明：https://mujoco.readthedocs.io/en/stable/computation/index.html
- Boyd/Vandenberghe 作者教材入口：https://web.stanford.edu/~boyd/cvxbook/
- Boyd 等原始论文增广Lagrangian部分：https://web.stanford.edu/~boyd/papers/pdf/admm_distr_stats.pdf
- Raissi 等作者项目和原始工作入口：https://maziarraissi.github.io/PINNs/

本次还打开过 Gaffer 积分文章、DeepMimic 作者项目页和 PyTorch 自动微分重定向页；正文未依赖这些来源。PyTorch 页面仅返回重定向，未把它当成已读实现细节证据。

## 范围及后续检查

- 以ODE和有限维刚体为入门，不声称覆盖所有PDE或复杂材料。
- 半隐式振子稳定条件使用严格 `0<h*omega<2`，排除临界重复根。
- 冲量、接触力、位置互补、速度互补及有反弹恢复关系分别注明适用对象。
- P07明确乘子单位由约束函数尺度决定，圆函数乘子不是直接的牛顿数。
- 残差学习给出缺失初值的零函数反例，连续误差界不以训练点残差代替。
- 可微模拟区分连续与离散梯度，接触不可微边界单独讨论。
- 拆章后检索正文P编号，已将接触章中旧的“P05后研究联合求解”修为实际P07链接，避免slug数字与教学序号混淆。
- 长期积分、训练和接触轨迹只提供复现协议，未捏造实际运行指标。整站构建与全站链接检查由集成阶段完成；本文件不提前声称其通过。
