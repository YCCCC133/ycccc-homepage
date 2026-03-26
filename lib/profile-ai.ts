import { normalizeProfile, type ProfileData } from "./site-data";

type AiProfileMode = "import" | "polish";

type EditableProfile = Partial<
  Pick<
    ProfileData,
    | "displayName"
    | "headline"
    | "location"
    | "tags"
    | "intro"
    | "links"
    | "brand"
    | "coreCapabilities"
    | "projects"
    | "techSystem"
    | "blog"
    | "orgPractice"
    | "contact"
  >
>;

type RunAiProfileActionParams = {
  mode: AiProfileMode;
  currentProfile: ProfileData;
  sourceText?: string;
  instruction?: string;
};

type KimiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function pickEditableProfile(profile: ProfileData): EditableProfile {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    location: profile.location,
    tags: profile.tags,
    intro: profile.intro,
    links: profile.links,
    brand: profile.brand,
    coreCapabilities: profile.coreCapabilities,
    projects: profile.projects,
    techSystem: profile.techSystem,
    blog: profile.blog,
    orgPractice: profile.orgPractice,
    contact: profile.contact,
  };
}

function mergeEditableProfile(
  currentProfile: ProfileData,
  incoming: EditableProfile
): ProfileData {
  return normalizeProfile({
    ...currentProfile,
    ...incoming,
    tags: incoming.tags ?? currentProfile.tags,
    links: incoming.links ?? currentProfile.links,
    brand: incoming.brand
      ? {
          ...currentProfile.brand,
          ...incoming.brand,
          keywords: incoming.brand.keywords ?? currentProfile.brand.keywords,
        }
      : currentProfile.brand,
    coreCapabilities: incoming.coreCapabilities ?? currentProfile.coreCapabilities,
    projects: incoming.projects ?? currentProfile.projects,
    techSystem: incoming.techSystem
      ? {
          ...currentProfile.techSystem,
          ...incoming.techSystem,
          pillars: incoming.techSystem.pillars ?? currentProfile.techSystem.pillars,
          toolchain: incoming.techSystem.toolchain ?? currentProfile.techSystem.toolchain,
        }
      : currentProfile.techSystem,
    blog: incoming.blog
      ? {
          ...currentProfile.blog,
          ...incoming.blog,
          posts: incoming.blog.posts ?? currentProfile.blog.posts,
        }
      : currentProfile.blog,
    orgPractice: incoming.orgPractice
      ? {
          ...currentProfile.orgPractice,
          ...incoming.orgPractice,
          organizations:
            incoming.orgPractice.organizations ?? currentProfile.orgPractice.organizations,
          socialProjects:
            incoming.orgPractice.socialProjects ?? currentProfile.orgPractice.socialProjects,
        }
      : currentProfile.orgPractice,
    contact: incoming.contact
      ? {
          ...currentProfile.contact,
          ...incoming.contact,
          socials: incoming.contact.socials ?? currentProfile.contact.socials,
          collaboration:
            incoming.contact.collaboration ?? currentProfile.contact.collaboration,
        }
      : currentProfile.contact,
  });
}

function buildSystemPrompt(mode: AiProfileMode): string {
  const goal =
    mode === "import"
      ? "将 sourceText 中有明确依据的信息合并进 currentProfile，并对整个站点资料做中文润色"
      : "在不改变事实的前提下润色 currentProfile 的整个站点资料";

  return [
    "你是一个中文个人网站资料编辑器。",
    `任务目标：${goal}。`,
    "currentProfile 包含整个站点的可编辑内容，包括基础资料、品牌定位、核心能力、项目、技术体系、博客、组织实践和联系方式。",
    "输出必须是一个 JSON 对象，不要输出 Markdown、解释或代码块。",
    "只返回需要修改或新增的字段，允许返回部分字段；不要原样重写整个对象。",
    "如果没有必要修改，返回空对象 {}。",
    "只可基于 currentProfile 和 sourceText 中明确出现的事实进行修改，不要编造日期、项目、指标、链接或身份信息。",
    "保持简洁、专业、适合个人网站展示。",
    "projects 数组中的每个项目都应保留 title、role、period、summary、stack、scope、metrics、links 字段。",
    "links 字段为数组，元素结构为 { label, href }。",
    "coreCapabilities 数组元素结构为 { title, description }。",
    "如果某个字段没有更好的依据，保持当前值。",
  ].join("\n");
}

function extractJsonCandidate(input: string): string {
  const trimmed = input.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

async function requestKimiContent(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: Array<{ role: "system" | "user"; content: string }>
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Kimi API request timed out after 30s.");
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi API request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as KimiResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Kimi API returned an empty response.");
  }

  return content;
}

async function repairKimiJson(
  apiKey: string,
  baseUrl: string,
  model: string,
  brokenContent: string
): Promise<string> {
  return requestKimiContent(apiKey, baseUrl, model, [
    {
      role: "system",
      content: [
        "你是一个 JSON 修复器。",
        "请把用户提供的内容修复为合法 JSON 对象。",
        "只能输出 JSON，不要输出解释、Markdown 或代码块。",
        "不要新增没有依据的字段和事实，只修复格式与转义问题。",
      ].join("\n"),
    },
    {
      role: "user",
      content: brokenContent,
    },
  ]);
}

export async function runAiProfileAction({
  mode,
  currentProfile,
  sourceText,
  instruction,
}: RunAiProfileActionParams): Promise<ProfileData> {
  const apiKey = process.env.MOONSHOT_API_KEY || "";
  const baseUrl = process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1";
  const model = process.env.MOONSHOT_MODEL || "moonshot-v1-32k";

  if (!apiKey) {
    throw new Error("MOONSHOT_API_KEY is not configured.");
  }

  const payload = {
    mode,
    instruction: instruction?.trim() || "",
    sourceText: sourceText?.trim() || "",
    currentProfile: pickEditableProfile(currentProfile),
  };

  const content = await requestKimiContent(apiKey, baseUrl, model, [
    {
      role: "system",
      content: buildSystemPrompt(mode),
    },
    {
      role: "user",
      content: JSON.stringify(payload),
    },
  ]);

  let parsed: EditableProfile;
  try {
    parsed = JSON.parse(extractJsonCandidate(content)) as EditableProfile;
  } catch (error) {
    try {
      const repaired = await repairKimiJson(apiKey, baseUrl, model, content);
      parsed = JSON.parse(extractJsonCandidate(repaired)) as EditableProfile;
    } catch {
      throw new Error(`Failed to parse Kimi JSON response: ${String(error)}`);
    }
  }

  return mergeEditableProfile(currentProfile, parsed);
}
