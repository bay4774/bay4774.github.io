---
title: 'Rigid-body Dynamics · 刚体动力学笔记'
description: '示例讲义：从广义坐标、质量矩阵到接触约束，组织可持续维护的公式推导。'
date: 2026-10-10
tags: ['Dynamics', 'Physics-based Animation', 'Robotics']
demo: true
category: 'theory'
readTime: 12
chapters: 4
---

## 1. From coordinates to equations

这是用于检验讲义排版的示例笔记。真实课程内容可按照“问题设定 → 假设 → 推导 → 例子 → 边界”组织，让每个公式都能找到上下文。

设广义坐标为 $q$，广义速度为 $\dot q$。在完整建模中，需要清楚说明坐标系、单位以及执行器如何作用于系统。

$$
M(q)\ddot q + C(q,\dot q)\dot q + g(q)
= \tau + J(q)^\top \lambda
\tag{1}
$$

这里 $M$ 为质量矩阵，$C$ 与 $g$ 组织惯性和重力项，$J^\top\lambda$ 表示约束力映射。公式用于说明页面的数学排版能力；你的最终讲义应标明推导来源与采用的符号约定。

## 2. Contact as a constraint

接触问题不能仅用“物体停在地面上”来描述。需要同时考虑间隙、法向力和相对速度，并区分连续时间模型与离散求解器。

$$
\phi(q)\geq 0,\qquad \lambda_n\geq 0,\qquad
\phi(q)\lambda_n=0
\tag{2}
$$

在讲义中，可先解释这三个条件的物理含义，再讨论摩擦锥、软约束与数值近似。长公式会保留在自身的横向滚动区域内。

## 3. A simulation step

~~~python
# 示例伪代码，仅用于说明数据流
def simulate_step(state, control, dt):
    mass, force = assemble_dynamics(state, control)
    contact = detect_contact(state)
    acceleration = solve_constraints(mass, force, contact)
    return integrate(state, acceleration, dt)
~~~

## 4. Questions for practice

- 缩小时间步长之后，能量漂移是否减小？
- 相同控制输入在不同接触模型下是否得到一致结果？
- 观测到的不稳定来自建模假设还是数值误差？

:::my-take

推导笔记最有价值的部分是边界条件。每次遇到一个简洁公式，都应追问：它依赖哪些假设，换一个坐标系或接触求解器后是否仍然成立？

:::
