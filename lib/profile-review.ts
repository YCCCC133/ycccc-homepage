import type { ProfileData } from "./site-data";

export type ReviewChange = {
  section: string;
  label: string;
  before: string;
  after: string;
};

type FieldSpec<T> = {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T], item: T, index: number) => string;
};

function formatEmpty(value: string): string {
  return value.trim() ? value : "无";
}

function formatStringList(value: string[] | undefined): string {
  if (!value || value.length === 0) {
    return "无";
  }
  return value.map((item) => item.trim()).filter(Boolean).join("、");
}

function formatLinkList(value: Array<{ label: string; href: string }> | undefined): string {
  if (!value || value.length === 0) {
    return "无";
  }

  return value
    .map((item) => `${item.label || "未命名"} → ${item.href || "无地址"}`)
    .join("\n");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "无";
    }

    if (typeof value[0] === "string") {
      return formatStringList(value as string[]);
    }

    if (typeof value[0] === "object" && value[0] !== null) {
      return JSON.stringify(value, null, 2);
    }

    return value.map((item) => String(item)).join("、");
  }

  if (typeof value === "string") {
    return formatEmpty(value);
  }

  if (value == null) {
    return "无";
  }

  return String(value);
}

function addChange(
  changes: ReviewChange[],
  section: string,
  label: string,
  before: unknown,
  after: unknown
) {
  const beforeText = formatValue(before);
  const afterText = formatValue(after);

  if (beforeText === afterText) {
    return;
  }

  changes.push({
    section,
    label,
    before: beforeText,
    after: afterText,
  });
}

function compareScalarFields<T extends Record<string, unknown>>(
  changes: ReviewChange[],
  section: string,
  current: T,
  next: T,
  fields: Array<{ key: keyof T; label: string }>
) {
  fields.forEach((field) => {
    addChange(changes, section, field.label, current[field.key], next[field.key]);
  });
}

function compareListFields<T extends Record<string, unknown>>(
  changes: ReviewChange[],
  section: string,
  current: T[] | undefined,
  next: T[] | undefined,
  fields: FieldSpec<T>[],
  describeItem: (item: T, index: number) => string
) {
  const currentList = current ?? [];
  const nextList = next ?? [];
  const maxLength = Math.max(currentList.length, nextList.length);

  if (currentList.length !== nextList.length) {
    addChange(changes, section, "条目数量", String(currentList.length), String(nextList.length));
  }

  for (let index = 0; index < maxLength; index += 1) {
    const currentItem = currentList[index];
    const nextItem = nextList[index];
    const itemLabel = describeItem(nextItem ?? currentItem, index);

    if (!currentItem && nextItem) {
      addChange(changes, section, `${itemLabel} · 新增`, "无", JSON.stringify(nextItem, null, 2));
      continue;
    }

    if (currentItem && !nextItem) {
      addChange(
        changes,
        section,
        `${itemLabel} · 删除`,
        JSON.stringify(currentItem, null, 2),
        "无"
      );
      continue;
    }

    if (!currentItem || !nextItem) {
      continue;
    }

    fields.forEach((field) => {
      const format = field.format ?? ((value: T[keyof T]) => formatValue(value));
      addChange(
        changes,
        section,
        `${itemLabel} · ${field.label}`,
        format(currentItem[field.key], currentItem, index),
        format(nextItem[field.key], nextItem, index)
      );
    });
  }
}

export function buildProfileReview(
  current: ProfileData,
  next: ProfileData
): ReviewChange[] {
  const changes: ReviewChange[] = [];

  compareScalarFields(changes, "基础资料", current, next, [
    { key: "displayName", label: "姓名" },
    { key: "headline", label: "标题" },
    { key: "location", label: "地点" },
    { key: "intro", label: "简介" },
  ]);
  addChange(changes, "基础资料", "标签", current.tags, next.tags);
  addChange(
    changes,
    "基础资料",
    "站点链接",
    formatLinkList(current.links),
    formatLinkList(next.links)
  );

  compareScalarFields(changes, "定位信息", current.brand, next.brand, [
    { key: "identity", label: "身份" },
    { key: "positioning", label: "定位" },
    { key: "valueProposition", label: "价值主张" },
  ]);
  addChange(changes, "定位信息", "关键词", current.brand.keywords, next.brand.keywords);

  compareListFields(
    changes,
    "核心能力",
    current.coreCapabilities,
    next.coreCapabilities,
    [
      { key: "title", label: "标题" },
      { key: "description", label: "描述" },
    ],
    (item, index) => `能力 ${String(index + 1).padStart(2, "0")} · ${item.title || "未命名能力"}`
  );

  compareListFields(
    changes,
    "项目",
    current.projects,
    next.projects,
    [
      { key: "title", label: "标题" },
      { key: "role", label: "角色" },
      { key: "period", label: "时间" },
      { key: "summary", label: "摘要" },
      {
        key: "stack",
        label: "关键词",
        format: (value) => formatStringList(value as string[]),
      },
      {
        key: "scope",
        label: "关键工作",
        format: (value) => formatStringList(value as string[]),
      },
      {
        key: "metrics",
        label: "结果",
        format: (value) => formatStringList(value as string[]),
      },
      {
        key: "links",
        label: "链接",
        format: (value) => formatLinkList(value as Array<{ label: string; href: string }>),
      },
    ],
    (item, index) => `项目 ${String(index + 1).padStart(2, "0")} · ${item.title || "未命名项目"}`
  );

  compareScalarFields(changes, "技术体系", current.techSystem, next.techSystem, [
    { key: "title", label: "标题" },
  ]);
  compareListFields(
    changes,
    "技术体系",
    current.techSystem.pillars,
    next.techSystem.pillars,
    [
      { key: "name", label: "名称" },
      { key: "description", label: "描述" },
      {
        key: "practices",
        label: "实践",
        format: (value) => formatStringList(value as string[]),
      },
    ],
    (item, index) => `支柱 ${String(index + 1).padStart(2, "0")} · ${item.name || "未命名支柱"}`
  );
  addChange(
    changes,
    "技术体系",
    "工具链",
    current.techSystem.toolchain,
    next.techSystem.toolchain
  );

  compareScalarFields(changes, "博客", current.blog, next.blog, [
    { key: "focus", label: "关注方向" },
  ]);
  compareListFields(
    changes,
    "博客",
    current.blog.posts,
    next.blog.posts,
    [
      { key: "title", label: "标题" },
      { key: "date", label: "日期" },
      { key: "summary", label: "摘要" },
      { key: "href", label: "链接" },
      {
        key: "tags",
        label: "标签",
        format: (value) => formatStringList(value as string[]),
      },
    ],
    (item, index) => `文章 ${String(index + 1).padStart(2, "0")} · ${item.title || "未命名文章"}`
  );

  compareListFields(
    changes,
    "组织实践",
    current.orgPractice.organizations,
    next.orgPractice.organizations,
    [
      { key: "name", label: "名称" },
      { key: "role", label: "角色" },
      { key: "impact", label: "影响" },
      { key: "period", label: "时间" },
    ],
    (item, index) => `组织 ${String(index + 1).padStart(2, "0")} · ${item.name || "未命名组织"}`
  );
  compareListFields(
    changes,
    "组织实践",
    current.orgPractice.socialProjects,
    next.orgPractice.socialProjects,
    [
      { key: "name", label: "名称" },
      { key: "description", label: "描述" },
      { key: "impact", label: "影响" },
    ],
    (item, index) =>
      `社会项目 ${String(index + 1).padStart(2, "0")} · ${item.name || "未命名项目"}`
  );

  addChange(changes, "联系方式", "邮箱", current.contact.email, next.contact.email);
  addChange(changes, "联系方式", "日程链接", current.contact.calendar || "", next.contact.calendar || "");
  compareListFields(
    changes,
    "联系方式",
    current.contact.socials,
    next.contact.socials,
    [
      { key: "label", label: "名称" },
      { key: "href", label: "地址" },
    ],
    (item, index) => `社交链接 ${String(index + 1).padStart(2, "0")} · ${item.label || "未命名链接"}`
  );
  addChange(
    changes,
    "联系方式",
    "合作方向",
    current.contact.collaboration,
    next.contact.collaboration
  );

  return changes;
}
