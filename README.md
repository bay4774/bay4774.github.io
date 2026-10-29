# Congnition Beyond Zero

**Bingzhao Cai · Researcher in Embodied Intelligence · USTC-AC**

这是我的个人学术主页，记录研究产出、论文分享与课程学习。我的兴趣是让智能从算法走向物理世界：理解运动、感知交互，并以自然的方式回应人类。

[访问个人主页](https://bay4774.github.io/) · [GitHub](https://github.com/bay4774) · [Email](mailto:bay7447.kungen@gmail.com)

## 研究方向

- **Embodied AI / 具身智能**：感知、决策与物理交互之间的联系。
- **Physics-based Animation / 物理角色动画**：运动模仿、接触约束与闭环控制。
- **Bionic Robotics / 仿生机器人**：仿生结构、表达与人机交互。

## 主页内容

| 栏目 | 内容 |
| --- | --- |
| [Bio / Home](https://bay4774.github.io/) | 个人简介、研究方向与最新更新 |
| [Publications](https://bay4774.github.io/publications/) | 本人原创研究成果；目前保留明确标注的展示示例，待补充真实发表 |
| [Paper Digest](https://bay4774.github.io/digest/) | 与研究方向相关的 10 篇高被引顶会顶刊论文，提供方法导读、推荐理由和原文入口 |
| [Lectures & Notes](https://bay4774.github.io/notes/) | 80章公共基础、六方向80章讲义，以及两门高级课程的 HTML 讲义 |
| [Projects](https://bay4774.github.io/projects/) | 工程项目与系统作品，后续补充 |
| [Trajectory](https://bay4774.github.io/trajectory/) | 科研与职业轨迹，待补充真实经历 |

论文分享属于精选阅读导读，与本人的原创发表分开展示；个人复现与实验记录将在后续补充。引用量注明数据来源与查阅日期，用于提供影响力背景。

## 课程讲义：公共基础与六方向

- [公共基础章节目录与40周阅读路径](https://bay4774.github.io/notes/foundations-course-index/)：00–79章，含概念、推导、算例、自测和通用参考答案。
- [六方向讲义与先修导航](https://bay4774.github.io/notes/direction-foundations/)：大模型14章、具身智能14章、仿生机器人头12章、物理约束14章、Agent 13章、伴语手势生成13章。
- [学习方法与先修补救](https://bay4774.github.io/notes/foundations-study-guide/)、[跨章复习](https://bay4774.github.io/notes/foundations-review-exercises/)与[配套经典论文](https://bay4774.github.io/notes/foundations-paper-reading/)。

章节源码在 src/content/notes/，章节关系由 src/data/foundations-chapters.json、foundations-curriculum.json 和 direction-curriculum.json 维护；公共教学代码与图示在 public/research-foundations/ 和 public/research-directions/。教材审读依据保存在 docs/foundations/ 与 docs/directions/。

个人笔记、作答、错题、实际学习进度和个性化批改只保存在被Git忽略的 .private/ 目录，不进入GitHub或发布产物。通用练习答案与教材审读记录属于公共教学内容。详见[内容与隐私边界](docs/foundations/CONTENT_POLICY.md)。

## 精选论文分享

围绕基础模型、视觉语言、生成建模与感知决策筛选。下表为 **Semantic Scholar 作品记录的引用数，查阅于 2026-10-15**；可能包含同一作品的预印本与正式版，不是全领域 Top 10 排名。

| 论文 | 正式发表 | 引用数 |
| --- | --- | ---: |
| [ResNet](https://bay4774.github.io/digest/resnet/) | CVPR 2016 | [241,920](https://www.semanticscholar.org/paper/2c03df8b48bf3fa39054345bafabfeff15bfd11d) |
| [Attention Is All You Need](https://bay4774.github.io/digest/transformer/) | NeurIPS 2017 | [196,745](https://www.semanticscholar.org/paper/204e3073870fae3d05bcbc2f6a8e263d9b72e776) |
| [Adam](https://bay4774.github.io/digest/adam/) | ICLR 2015 | [172,332](https://www.semanticscholar.org/paper/a6cb366736791bcccc5c8639de5a8f9636bf87e8) |
| [Vision Transformer](https://bay4774.github.io/digest/vit/) | ICLR 2021 | [71,557](https://www.semanticscholar.org/paper/268d347e8a55b5eb82fb5e7d2f800e33c75ab18a) |
| [CLIP](https://bay4774.github.io/digest/clip/) | ICML 2021 | [57,604](https://www.semanticscholar.org/paper/6f870f7f02a8c59c3e23f407f3ef00dd1dcf8fc4) |
| [DDPM](https://bay4774.github.io/digest/ddpm/) | NeurIPS 2020 | [36,305](https://www.semanticscholar.org/paper/5c126ae3421f05768d8edd97ecd44b1364e2c99a) |
| [Human-level control / DQN](https://bay4774.github.io/digest/dqn/) | Nature 2015 | [33,566](https://www.semanticscholar.org/paper/340f48901f72278f6bf78a04ee5b01df208cc508) |
| [LoRA](https://bay4774.github.io/digest/lora/) | ICLR 2022 | [24,249](https://www.semanticscholar.org/paper/a8ca46b171467ceb2d7652fbfb67fe701ad86092) |
| [Auto-Encoding Variational Bayes](https://bay4774.github.io/digest/vae/) | ICLR 2014 | [17,312](https://www.semanticscholar.org/paper/5f5dc5b9a2ba710937e2c413b37b053cd673df02) |
| [Generative Adversarial Nets](https://bay4774.github.io/digest/gan/) | NeurIPS 2014 | [7,031](https://www.semanticscholar.org/paper/86ee1835a56722b76564119437070782fc90eb19) |

## 教学讲义

- [高级人工智能 · 零基础逐例详解与备考讲义（2026-10-23）](https://bay4774.github.io/lectures/advanced-artificial-intelligence/index.html)
- [高级算法设计与分析 · 零基础逐例详解（2026-10-29）](https://bay4774.github.io/lectures/advanced-algorithm-design/index.html)

公开资源仅包含最终 HTML 讲义及必要的页面依赖，不包含源 PPT 或 PDF。

## 更新与维护

主页采用浅色界面，使用 Astro 和 Markdown/MDX 管理内容，由 GitHub Actions 自动发布到 GitHub Pages。

个人信息在 `src/config/site.ts`，原创论文在 `src/content/publications/`，论文分享在 `src/content/digest/`，讲义入口在 `src/content/notes/`，HTML 讲义在 `public/lectures/`。

本地运行、添加内容与部署说明见 [维护指南](docs/MAINTENANCE.md)。
