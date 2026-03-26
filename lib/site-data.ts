import { getJsonObject, putJsonObject, hasCosConfig } from "./tencent-cos";

export type ProfileData = {
  id: string;
  displayName: string;
  headline: string;
  location: string;
  tags: string[];
  intro: string;
  links: {
    label: string;
    href: string;
  }[];
  updatedAt: string;
  brand: {
    identity: string;
    positioning: string;
    valueProposition: string;
    keywords: string[];
  };
  coreCapabilities: {
    title: string;
    description: string;
  }[];
  projects: {
    title: string;
    role: string;
    period?: string;
    summary: string;
    stack: string[];
    scope: string[];
    metrics: string[];
    links: { label: string; href: string }[];
  }[];
  techSystem: {
    title: string;
    pillars: {
      name: string;
      description: string;
      practices: string[];
    }[];
    toolchain: string[];
  };
  blog: {
    focus: string;
    posts: {
      title: string;
      date: string;
      summary: string;
      href: string;
      tags: string[];
    }[];
  };
  orgPractice: {
    organizations: {
      name: string;
      role: string;
      impact: string;
      period: string;
    }[];
    socialProjects: {
      name: string;
      description: string;
      impact: string;
    }[];
  };
  contact: {
    email: string;
    calendar?: string;
    socials: { label: string; href: string }[];
    collaboration: string[];
  };
};

const PROFILE_KEY = "site/profile.json";
const PROFILE_CACHE_TTL_MS = 30_000;

const memoryStore: {
  profile: ProfileData;
} = {
  profile: {
    id: "ycccc",
    displayName: "廖禹淳",
    headline: "中国地质大学（北京） | 软件工程 | 2027 届本科",
    location: "中国地质大学（北京）",
    tags: ["软件工程", "工程实现", "系统设计", "产品交付"],
    intro: "专注工程实现、系统设计与产品交付。",
    links: [
      { label: "邮箱", href: "mailto:liaoyuchun7@gmail.com" },
      { label: "GitHub", href: "https://github.com/" },
    ],
    updatedAt: new Date().toISOString(),
    brand: {
      identity: "具备技术背景的产品经理",
      positioning: "专注 AI 基础设施与 B 端数据产品",
      valueProposition: "把复杂技术抽象成可落地的产品方案。",
      keywords: ["AI基础设施", "B端数据产品", "分布式系统", "边缘计算"],
    },
    coreCapabilities: [
      {
        title: "产品规划与设计",
        description: "需求分析、信息架构、PRD 与高保真原型。",
      },
      {
        title: "技术理解与架构",
        description: "理解分布式系统与 AI 基础设施，能和研发高效协作。",
      },
      {
        title: "数据分析与治理",
        description: "指标体系、漏斗分析、A/B 测试与数据治理。",
      },
      {
        title: "用户增长与运营",
        description: "用户分层、转化路径和北极星指标驱动增长。",
      },
      {
        title: "跨部门协作",
        description: "协调研发、设计、运营等多方资源推进项目。",
      },
    ],
    projects: [
      {
        title: "国家级大创项目",
        role: "算法产品负责人",
        period: "2024.09 - 2025.11",
        summary: "《基于文本挖掘与因果推断的化工事故致因研究》项目，负责算法产品设计与语料体系建设。",
        stack: ["文本挖掘", "因果推断", "实体识别", "关系抽取"],
        scope: [
          "设计文本实体识别与关系抽取流程",
          "负责 10 万+ 事故报告的数据清洗与语料库建设",
          "搭建可解释的事故致因分析框架",
        ],
        metrics: ["10 万+报告语料", "国家级大创立项", "可解释分析框架"],
        links: [],
      },
      {
        title: "EdgeGuard 边缘设备故障检测系统",
        role: "后端架构设计",
        period: "2025.06 - 2025.09",
        summary: "面向大规模边缘设备接入的故障检测系统，负责分层通信架构与可靠性机制设计。",
        stack: ["边缘计算", "分层通信", "QoS", "消息队列"],
        scope: [
          "设计分层网络通信架构",
          "实现心跳检测与断点续传机制",
          "实现消息队列削峰填谷与 QoS 分级",
        ],
        metrics: ["千级设备接入", "高可靠通信机制", "后端架构落地"],
        links: [],
      },
      {
        title: "北京市流浪动物公益智能治理系统",
        role: "G 端产品负责人",
        period: "2025.12 - 至今",
        summary: "面向流浪动物救助治理场景，负责全链路产品架构设计、文档输出与多方协同推进。",
        stack: ["G 端产品", "AI 视觉识别", "任务调度", "数据埋点"],
        scope: [
          "设计上报-识别-调度-档案-回访全链路架构",
          "输出 PRD、流程图与交互原型",
          "协调公益组织、研发与政府部门敏捷开发",
        ],
        metrics: ["面向真实公益场景", "完整文档与原型", "多方协同推进"],
        links: [],
      },
      {
        title: "嘀嗒资料库",
        role: "全栈开发",
        period: "已上线",
        summary: "学习资料共享平台，支持搜索、分类、上传下载与后台管理。",
        stack: ["资料共享", "搜索分类", "上传下载", "后台管理"],
        scope: [
          "支持资料搜索与分类筛选",
          "支持上传、下载与基础权限入口",
          "提供后台管理与统计视图",
        ],
        metrics: ["面向全校学生使用", "高频资料检索场景", "后台持续更新维护"],
        links: [{ label: "打开站点", href: "https://tick-tick-database.vercel.app" }],
      },
    ],
    techSystem: {
      title: "工程体系概览",
      pillars: [
        {
          name: "前端工程",
          description: "组件化、结构化、可维护的页面实现。",
          practices: ["模块拆分", "响应式布局", "交互状态", "样式治理"],
        },
        {
          name: "项目交付",
          description: "从页面到上线的完整交付链路。",
          practices: ["需求整理", "版本管理", "基础验证", "部署发布"],
        },
        {
          name: "数据与维护",
          description: "保持信息可更新、联系可追踪、内容可扩展。",
          practices: ["云端存储", "表单回写", "内容更新", "长期维护"],
        },
      ],
      toolchain: ["TypeScript", "React/Next.js", "Node.js", "Tencent COS", "Docker"],
    },
    blog: {
      focus: "项目复盘、工程实现、页面结构与维护思路",
      posts: [
        {
          title: "如何把个人主页做成可维护的工程项目",
          date: "2026-03-01",
          summary: "从页面结构、内容组织到联系方式入口的整理方式。",
          href: "https://example.com",
          tags: ["个人网站", "工程实现"],
        },
        {
          title: "项目展示页的内容取舍",
          date: "2025-12-10",
          summary: "为什么只保留项目、个人信息和联系方式三个板块。",
          href: "https://example.com",
          tags: ["信息架构", "转化"],
        },
      ],
    },
    orgPractice: {
      organizations: [
        {
          name: "中国地质大学（北京）相关组织",
          role: "成员 / 协作者",
          impact: "参与组织协作、信息整理和活动支持。",
          period: "本科阶段",
        },
      ],
      socialProjects: [
        {
          name: "校园与社会实践",
          description: "围绕活动协作、内容支持和沟通执行参与实践。",
          impact: "提升协作意识与执行能力。",
        },
      ],
    },
    contact: {
      email: "liaoyuchun7@gmail.com",
      socials: [
        { label: "GitHub", href: "https://github.com/" },
        { label: "Email", href: "mailto:liaoyuchun7@gmail.com" },
      ],
      collaboration: ["项目合作", "实习/求职", "技术交流", "内容合作"],
    },
  },
};

const defaultProfile = memoryStore.profile;
const profileCache: {
  profile: ProfileData;
  loadedAt: number;
  source: "default" | "memory" | "cos";
} = {
  profile: defaultProfile,
  loadedAt: 0,
  source: "default",
};

function cacheProfile(profile: ProfileData, source: "memory" | "cos") {
  profileCache.profile = profile;
  profileCache.loadedAt = Date.now();
  profileCache.source = source;
}

export function normalizeProfile(profile: Partial<ProfileData> & { updatedAt?: string }): ProfileData {
  return {
    id: profile.id || defaultProfile.id,
    displayName:
      typeof profile.displayName === "string" && profile.displayName.trim()
        ? clampText(profile.displayName, 48)
        : defaultProfile.displayName,
    headline:
      typeof profile.headline === "string" && profile.headline.trim()
        ? clampText(profile.headline, 120)
        : defaultProfile.headline,
    location:
      typeof profile.location === "string" && profile.location.trim()
        ? clampText(profile.location, 60)
        : defaultProfile.location,
    tags:
      Array.isArray(profile.tags) && profile.tags.length
        ? profile.tags.map((tag) => clampText(tag, 20))
        : defaultProfile.tags,
    intro:
      typeof profile.intro === "string" && profile.intro.trim()
        ? clampText(profile.intro, 120)
        : defaultProfile.intro,
    links:
      Array.isArray(profile.links) && profile.links.length ? profile.links : defaultProfile.links,
    updatedAt: profile.updatedAt || defaultProfile.updatedAt,
    brand: profile.brand
      ? {
          ...defaultProfile.brand,
          ...profile.brand,
          identity:
            typeof profile.brand.identity === "string" && profile.brand.identity.trim()
              ? clampText(profile.brand.identity, 60)
              : defaultProfile.brand.identity,
          positioning:
            typeof profile.brand.positioning === "string" &&
            profile.brand.positioning.trim()
              ? clampText(profile.brand.positioning, 80)
              : defaultProfile.brand.positioning,
          valueProposition:
            typeof profile.brand.valueProposition === "string" &&
            profile.brand.valueProposition.trim()
              ? clampText(profile.brand.valueProposition, 120)
              : defaultProfile.brand.valueProposition,
          keywords:
            Array.isArray(profile.brand.keywords) && profile.brand.keywords.length
              ? profile.brand.keywords.map((keyword) => clampText(keyword, 20))
              : defaultProfile.brand.keywords,
        }
      : defaultProfile.brand,
    coreCapabilities:
      Array.isArray(profile.coreCapabilities) && profile.coreCapabilities.length
        ? profile.coreCapabilities.map((item) => ({
            title: clampText(item.title, 32),
            description: clampText(item.description, 120),
          }))
        : defaultProfile.coreCapabilities,
    projects: Array.isArray(profile.projects) ? profile.projects : defaultProfile.projects,
    techSystem: profile.techSystem
      ? {
          ...defaultProfile.techSystem,
          ...profile.techSystem,
          pillars: Array.isArray(profile.techSystem.pillars)
            ? profile.techSystem.pillars
            : defaultProfile.techSystem.pillars,
          toolchain: Array.isArray(profile.techSystem.toolchain)
            ? profile.techSystem.toolchain
            : defaultProfile.techSystem.toolchain,
        }
      : defaultProfile.techSystem,
    blog: profile.blog
      ? {
          ...defaultProfile.blog,
          ...profile.blog,
          posts: Array.isArray(profile.blog.posts) ? profile.blog.posts : defaultProfile.blog.posts,
        }
      : defaultProfile.blog,
    orgPractice: profile.orgPractice
      ? {
          ...defaultProfile.orgPractice,
          ...profile.orgPractice,
          organizations: Array.isArray(profile.orgPractice.organizations)
            ? profile.orgPractice.organizations
            : defaultProfile.orgPractice.organizations,
          socialProjects: Array.isArray(profile.orgPractice.socialProjects)
            ? profile.orgPractice.socialProjects
            : defaultProfile.orgPractice.socialProjects,
        }
      : defaultProfile.orgPractice,
    contact: profile.contact
      ? {
          ...defaultProfile.contact,
          ...profile.contact,
          email:
            typeof profile.contact.email === "string" && profile.contact.email.trim()
              ? clampText(profile.contact.email, 80)
              : defaultProfile.contact.email,
          socials:
            Array.isArray(profile.contact.socials) && profile.contact.socials.length
              ? profile.contact.socials
              : defaultProfile.contact.socials,
          collaboration:
            Array.isArray(profile.contact.collaboration) &&
            profile.contact.collaboration.length
              ? profile.contact.collaboration.map((item) => clampText(item, 24))
              : defaultProfile.contact.collaboration,
        }
      : defaultProfile.contact,
  };
}

function clampText(input: string, max: number): string {
  return input.trim().slice(0, max);
}

export async function getProfile(): Promise<ProfileData> {
  if (!hasCosConfig()) {
    return profileCache.profile;
  }

  if (
    profileCache.source === "cos" &&
    Date.now() - profileCache.loadedAt < PROFILE_CACHE_TTL_MS
  ) {
    return profileCache.profile;
  }

  try {
    const data = await getJsonObject<ProfileData>(PROFILE_KEY);
    if (data) {
      const normalized = normalizeProfile(data);
      cacheProfile(normalized, "cos");
      return normalized;
    }
  } catch (error) {
    console.warn("[site-data] getProfile COS failed:", error);
  }

  return profileCache.profile;
}

export async function saveProfile(profile: ProfileData): Promise<ProfileData> {
  const updated = normalizeProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });

  if (!hasCosConfig()) {
    cacheProfile(updated, "memory");
    return updated;
  }

  await putJsonObject(PROFILE_KEY, updated);
  cacheProfile(updated, "cos");
  return updated;
}
