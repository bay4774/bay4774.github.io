# 个人主页维护指南

以 Astro 7 + TypeScript + Markdown/MDX 构建的六模块学术主页。内容在构建时生成静态 HTML；搜索、筛选、图谱、对比滑块和复制按钮在浏览器运行。可部署到 GitHub Pages，也可将同一份代码连接到 Cloudflare Pages 或 Vercel。

个人简介已更新，课程讲义与精选论文分享使用真实资料。Publications、Projects 和 Trajectory 仍保留明确标注的示例，待补充真实成果和经历。演示图是概念插图，不代表真实硬件、已发表成果或实验效果。

## 本地运行

建议使用 Node.js 24 和 pnpm 11.25.0，并保留 `pnpm-lock.yaml`。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发地址通常是 `http://127.0.0.1:4321/`。终端显示的实际地址为准。

```sh
pnpm check
pnpm build
pnpm test
pnpm preview
```

`pnpm test` 检查研究手记的 Markdown 转换、安全的新内容命令，以及 **已经生成的 dist** 中所有 HTML 的本地链接、锚点与媒体路径；因此先执行 `pnpm build`。它不会核验外部网站链接或研究结论。

## 六个模块与内容位置

| 模块 | 页面 | 日常维护位置 |
|---|---|---|
| Bio / Home | `/` | `src/config/site.ts`、`src/data/news.ts` |
| Publications | `/publications/` | `src/content/publications/*.md` 或 `.mdx` |
| Paper Digest | `/digest/` | `src/content/digest/*.md` 或 `.mdx` |
| Lectures & Notes | `/notes/` | `src/content/notes/*.md` 或 `.mdx` |
| Projects | `/projects/` | `src/content/projects/*.md` 或 `.mdx` |
| Trajectory | `/trajectory/` | `src/data/trajectory.ts` |

`src/content.config.ts` 定义内容字段和校验规则，`src/pages/` 生成页面，`src/components/` 放可复用的内容组件，`src/styles/` 管理视觉样式。正文使用 Markdown，含组件的文章使用 MDX。Astro 支持 [Content Collections 与 glob 文件加载](https://docs.astro.build/en/guides/content-collections/)，正文通过 [`render(entry)`](https://docs.astro.build/en/reference/modules/astro-content/) 渲染。

## 替换为你的资料

公共基础从`/notes/foundations-course-index/`进入：讲义按00–79章组织，每篇一个主题；40周仅列出每两周读哪些章节。章节目录与先修在`src/data/foundations-chapters.json`，周次映射在`src/data/foundations-curriculum.json`。章节页使用`foundationChapter`标号，不再用weekStart/weekEnd定义讲义。

Notes和Digest可用`foundationOrder`排序，但该字段不表示学习进度。课程路径/阶段路线/论文导航/内容校验分别为0–3，学习指南和跨章复习分别为4、5，各章为10+章节号；Digest基础条目仍为1–8。`chapters`只统计页面内H2小节，章节页显示“小节”，避免把一篇误当多章。`reviewStatus`只记录讲义内容校验。

每四章成稿后回读自纠，记录在`docs/foundations/chapter-reviews/`，再继续下一组。校验页为`/notes/foundations-course-audit/`。原两周稿、旧02/03起步稿与旧审查可移入`docs/foundations/archive/`，不继续留在Notes列表；`src/data/foundations-legacy-links.json`提供兼容跳转，由Astro构建根路径与子路径版本。新增章节时同步维护先修、阅读路径、前后导航与测试。未完成的方向分支仍标规划中，引用记录不迁移重印章计数。

用户实际作答、订正、成绩、总结与进度仅存`.private/research-foundations/records/`；该目录被Git忽略，位于站点内容和public之外。个人记录不生成页面，不复制到公开自纠记录。通用参考答案和原创教学脚本可以随讲义发布。构建测试用无个人信息的canary检查私人记录没有进入`dist`。详细规则见[课程内容约定](foundations/CONTENT_POLICY.md)。不要将讲义成稿日期当作个人通过日期。

1. 编辑 `src/config/site.ts`：姓名、中英文简介、机构、研究方向、城市、邮箱及 GitHub / Google Scholar / CV 链接。未提供的链接保持空字符串即可。
2. 替换 `src/data/news.ts` 和 `src/data/trajectory.ts` 中的演示事件与履历。时间轴中的 `academic` 表示教育/科研，`practice` 表示工程/职业实践。
3. 在四个内容文件夹中替换演示文章，或将暂时不用的文章设为 `draft: true`。草稿不生成列表条目或公开详情页。
4. 将 `public/images/` 的示例素材替换为真实素材。检查论文作者顺序，使用 `self: true` 标记自己；`featured: true` 控制首页精选。
5. 核实每个条目后设为 `demo: false`。全部资料替换完成后，再将 `src/config/site.ts` 的 `demoMode` 设为 `false`。关闭全站提示不会替你删除条目上的演示标记。

不存在的成果、奖项、DOI、PDF、代码链接请留空或删除字段。资源按钮仅在对应资源字段填写时出现。

## 创建新内容

```sh
pnpm new digest diffusion-policy
pnpm new publication embodied-control-v2
pnpm new note contact-dynamics
pnpm new project robot-toolkit-v2
```

命令从 `templates/` 复制模板到对应内容文件夹，自动填写上海日期与 ISO 周编号。slug 使用小写字母、数字和连字符。已有同名文件不会被覆盖；路径、斜杠和 Windows 保留名称会被拒绝。

模板默认 `demo: true`、`draft: true`。完成正文、核对元数据与资源后，将两者改为 `false`。若希望展示写作中的文章，保留 `demo: true` 可以继续显示示例标记。

**Publications** 使用 `venue`、`status`、`authors`、`image`、`description` 等字段；`paper`、`code`、`video`、`videoLink`、`bibtex` 为可选项。`video` 是卡片预览文件，`videoLink` 是独立视频入口；每篇成果都自动生成项目详情页。

**Digest** 使用 `originalTitle`、`authors`、`lab`、`venue`、`year`、`rating`、`stars`、`method`、`verdict`、`readTime`、`week`、`tags`。`rating` 仅接受 `must-read`、`inspiring`、`engineering`。`originalUrl` 与 `code` 为原文和官方代码入口。`week` 如 `2026-W42`，用于周报分组；周报当前按相同周编号聚合手记，可在各篇手记中补充专题总结。

**Notes** 的 `category` 仅接受 `theory`、`tutorial`、`lecture`；可填写 `html`、`pdf`、`slides`。最终 HTML 讲义放在 `public/lectures/<slug>/index.html`，条目中写 `html: '/lectures/<slug>/'`；必要图片、字体和脚本与讲义一起保存，保持相对路径。当前两门课程不上传源 PPT/PDF。

**Digest** 可用 `curated: true` 标记精选导读，避免把推荐内容显示为已经完成的个人精读；`featured: true` 优先展示在首页。可选 `citations` 含 `count`、`source`、`url`、`accessed` 四个字段，分别为引用量、计量库名称、原记录链接和查阅日期。计量库的记录可能合并预印本与正式版本，应在导读中说明口径。`related` 只表达主题关联，不自动声明正式引文关系。

**Projects** 使用 `image`、`category`、`status`、`stack`，可提供 `code` 和 `featured`。

### 研究者手记

开闭标记各占一行，并与正文之间留空行；可在内部使用列表、代码和公式。

```md
:::my-take

我的判断：这项工作可成为基线，但还需要在相同预算下验证延迟。

:::
```

正文可使用四段结构：`Problem & Motivation`、`Methodology & Architecture`、`Critical Analysis: Pros & Cons`、`My Take & Idea Spark`。模板包含绿色优势/橙色局限双栏容器，手机上自动堆叠。个人推断和未完成的实验设想请注明。

### 公式与代码

行内公式使用 `$...$`，居中公式使用 `$$...$$`，公式编号用 KaTeX 的 `\tag{1}`：

```md
$$
x_{t+1} = f(x_t, u_t)
\tag{1}
$$
```

长公式在自身容器中滚动。代码块加语言名称即可语法高亮；浏览器脚本会添加窗口顶栏与 Copy 按钮。复制功能需要 HTTPS 或本地浏览器的安全上下文，不可用时保留手工选择复制入口。

### 图片对比组件

将文件扩展名改成 `.mdx`，在 Frontmatter 后导入组件，再使用：

```mdx
import ComparisonSlider from '../../components/ComparisonSlider.astro';

<ComparisonSlider
  before="/images/baseline.webp"
  after="/images/ours.webp"
  beforeLabel="Baseline"
  afterLabel="Ours"
  caption="同一测试条件下的对比；请注明具体条件。"
/>
```

`public/images/baseline.webp` 在内容中写成 `/images/baseline.webp`；组件会添加部署 base。两张图应具有相同尺寸和视角；控件支持拖动及键盘方向键。当前组件用于图片比较，视频通过论文卡片预览或独立视频入口展示。

### 文献关系图谱

图谱节点来自已公开的 digest 与 publications。共同 `tags` 自动生成主题连线；digest 的 `related` 可填写内容文件 ID（通常是去掉 `.md/.mdx` 的文件名），例如：

```yaml
related: ['demo-motion-tracking', 'embodied-control']
```

`related` 可以连到自己的成果。**主题/手工关联不等同于正式引用关系**，页面会明确提示。图谱支持选择节点、拖动、缩放、重置以及完整文字列表。节点很多时先保持标签一致、减少无意义的公共标签，再考虑专题子图或分页。

### 搜索与维护规模

Paper Digest 可按关键词、专题、来源和评级联合筛选，切换单篇/周报视图；筛选状态保留在 URL 中，可以复制分享。当前搜索匹配卡片元数据（标题、方法、观点等），不会全文搜索整个正文，也没有服务器数据库或后台同步。内容通过修改文件、重新构建后更新。资料增长到几百篇以上时，可根据真实性能再加入全文索引与分批载入。

新增 Markdown 中的本地链接/图片使用站点根路径，例如 `[更多笔记](/notes/)`、`![架构](/images/architecture.webp)`；构建插件会自动添加项目部署 base，无 JavaScript 时也可访问。页面组件与 Frontmatter 资源路径统一通过 `withBase` 处理；MDX 的自定义 HTML 中也可导入 `../../lib/paths` 的 `withBase`。不要手工把仓库名写进文章路径。普通相对链接需相对于最终页面 URL 设置，构建测试会捕捉错误路径。

## GitHub Pages 发布

仓库包含 `.github/workflows/deploy.yml`。首次发布步骤：

1. 创建 GitHub 仓库并上传完整代码（包含 `pnpm-lock.yaml` 与 `.github/workflows/`）。推荐个人主页使用 `你的用户名.github.io` 仓库名；也可以使用普通项目仓库。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 使用 `main` 作为发布分支。上传代码后，Actions 会安装锁定依赖、检查类型、构建、测试，再发布 `dist`。PR 仅检查，不发布生产站；如使用其他主分支，请修改 workflow 的 `branches`。
4. 工作流从 `actions/configure-pages` 读取 Pages 的 **origin** 和 **base_path**，自动传入 `SITE_URL` / `BASE_PATH`，无需在代码中写死 GitHub 用户名或仓库名。

| 场景 | 发布地址 | SITE_URL | BASE_PATH |
|---|---|---|---|
| 用户站 `username.github.io` 仓库 | `https://username.github.io/` | `https://username.github.io` | `/` |
| 普通项目仓库 `my-site` | `https://username.github.io/my-site/` | `https://username.github.io` | `/my-site` |
| 已配置独立域名 | `https://example.com/` | `https://example.com` | `/` |

`SITE_URL` 是站点 origin，`BASE_PATH` 是路径前缀，两者分开，避免前缀重复。内部页面、卡片资源、导航和 SEO 链接会据此生成。

本地模拟普通项目仓库部署，在 PowerShell 执行：

```powershell
$env:SITE_URL = 'https://username.github.io'
$env:BASE_PATH = '/my-site'
pnpm build
pnpm test
pnpm preview
# 验证结束后恢复根路径开发
Remove-Item Env:SITE_URL, Env:BASE_PATH -ErrorAction SilentlyContinue
```

此时预览需访问 `/my-site/`。`.env.example` 提供环境变量示例；可复制为 `.env`，或像上面一样在终端设置。GitHub Actions 使用真实 Pages 元数据覆盖本地示例值。

独立域名先在 Pages 设置中填写，再按域名提供商配置 DNS。参见 [GitHub 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages) 与 [Astro GitHub Pages 部署](https://docs.astro.build/en/guides/deploy/github/)；使用 Pages 设置的域名后，工作流会自动读取新 origin 和根路径。提交 `public/CNAME` 可保存域名声明，文件仅包含你的域名，不含协议。

仓库已连接 `bay4774/bay4774.github.io` 并启用 GitHub Pages；推送到 `main` 会触发工作流，检查通过后自动部署。发布状态可在仓库的 Actions 页面查看。

## 托管方案比较

| 方案 | 适用情况 | 注意事项与官方资料 |
|---|---|---|
| **GitHub Pages（首选）** | 个人学术主页，以文章和成果展示为主 | 无需应用服务器；静态发布产物上限 1 GB、软带宽上限 100 GB/月；[官方限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) |
| **GitHub + Cloudflare Pages** | 希望每个分支/PR自动提供预览 URL | [Git 集成与预览](https://developers.cloudflare.com/pages/configuration/git-integration/)；文件和构建配额以[官方限制](https://developers.cloudflare.com/pages/platform/limits/)为准 |
| **GitHub + Vercel** | 将来需要 SSR、API 或更复杂的动态服务 | 静态 Astro 可零配置部署，支持 PR 预览；动态功能需适配器；[官方 Astro 指南](https://vercel.com/docs/frameworks/frontend/astro) |

替代平台只需连接同一 GitHub 仓库，构建命令 `pnpm build`、输出目录 `dist`、Node.js 24；根域名部署设置 `BASE_PATH=/`、`SITE_URL` 为实际域名。保留 GitHub 作为代码和内容的版本管理入口。

GitHub Pages 足以承载当前需求。媒体较多时压缩 teaser 为短 WebM/MP4、保留轻量封面、减少循环长度；大视频与大 PDF 使用独立媒体存储或合法外部链接，避免让整个仓库不断膨胀。Cloudflare Pages 单文件 25 MiB 限制尤其需要提前考虑。

## 发布前检查

- 手机窄屏：导航、卡片按钮、公式、代码不撑破页面。
- 键盘：能访问筛选、图谱、滑块、复制按钮；焦点可见。
- 减少动态效果：关闭悬停自动播放，仍能手动查看预览。
- 内容：自己的成果与精读他人的论文身份清楚；原文证据、个人推断、实验设想分开。
- 元数据：姓名、联系方式、作者顺序、会议状态、日期、原文资源核对；演示素材已替换或设为草稿。
- 根路径和项目子路径各执行一次 `pnpm build` + `pnpm test`；外部链接另外人工检查。

## 六方向基础讲义维护

总入口为`src/content/notes/direction-foundations.mdx`。方向名称和顺序由`src/data/direction-curriculum.json`维护，现为大模型、具身智能、仿生机器人头、物理约束、Agent、伴语手势生成。

新增讲义仍放在`src/content/notes/`，使用`category: lecture`，同时提供`directionTrack`与正整数`directionChapter`。同方向的教学顺序须连续且不重复；不要给方向章设置公共基础的`foundationChapter`或`foundationOrder`。章数不设上限，`chapters`仍表示本篇实际二级标题数。

目录、章节导航、方向筛选和数量自动读取内容集合。新增概念需要插章时，保留已有URL，更新教学顺序和标题编号，并同步修改正文中的先修和上下一章链接。阅读顺序以页面章号为准，不能按历史文件名数字推断。

内容需沿用`docs/directions/TEACHING_DESIGN.md`以及公共教材的教学、来源和私有记录边界。`tests/direction-curriculum.test.mjs`检查元数据、顺序、必要教学结构、目录与导航和数学渲染；全站链接和私有资料隔离继续由原有测试检查。自动结构检查无法代替推导复算和读者反馈，实际审读记录放在`docs/directions/`。
