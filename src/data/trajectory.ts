export type Milestone = {
  year: string;
  date: string;
  track: 'academic' | 'practice';
  title: string;
  organization: string;
  description: string;
  tags: string[];
  demo: boolean;
};

export const milestones: Milestone[] = [
  {
    year: '2026',
    date: '2026-10',
    track: 'practice',
    title: '个人研究主页',
    organization: 'YOUR institution · 待填写',
    description: '示例位置：记录一个可分享的工程节点，并链接代码、演示或技术文档。',
    tags: ['Open Source', 'Knowledge Garden'],
    demo: true,
  },
  {
    year: '2026',
    date: '2026-09',
    track: 'academic',
    title: '当前研究阶段',
    organization: 'YOUR institution · 待填写',
    description: '示例位置：填写真实身份、实验室与研究方向，以及你正在探索的问题。',
    tags: ['Research', 'Embodied AI'],
    demo: true,
  },
  {
    year: '2025',
    date: '2025-09',
    track: 'practice',
    title: '系统实践与协作',
    organization: 'YOUR organization · 待填写',
    description: '示例位置：填写真实的工程、实习或合作经历，说明职责与可验证的产出。',
    tags: ['Engineering', 'Collaboration'],
    demo: true,
  },
  {
    year: '2024',
    date: '2024-09',
    track: 'academic',
    title: '研究与教育经历',
    organization: 'YOUR institution · 待填写',
    description: '示例位置：填写真实学位、专业、导师与时间；当前日期仅用于展示时间轴。',
    tags: ['Education', 'Research'],
    demo: true,
  },
  {
    year: '2023',
    date: '2023-09',
    track: 'academic',
    title: '知识基础与起点',
    organization: 'YOUR institution · 待填写',
    description: '示例位置：记录真实的教育起点、学术服务或重要转折，不把规划当作已完成的经历。',
    tags: ['Foundations', 'Learning'],
    demo: true,
  },
];
