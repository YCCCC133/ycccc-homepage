"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import type { ProfileData } from "../lib/site-data";

type Props = {
  open: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSaved: (profile: ProfileData) => void;
};

type AdminTab = "profile" | "projects" | "contact" | "ai" | "json";

const adminTabs: Array<{ id: AdminTab; label: string }> = [
  { id: "profile", label: "个人信息" },
  { id: "projects", label: "项目" },
  { id: "contact", label: "联系" },
  { id: "ai", label: "AI" },
  { id: "json", label: "JSON" },
];

function cloneProfile(profile: ProfileData): ProfileData {
  return JSON.parse(JSON.stringify(profile)) as ProfileData;
}

function splitByComma(input: string): string[] {
  return input
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitByLine(input: string): string[] {
  return input
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinByComma(list: string[]): string {
  return list.join(", ");
}

function joinByLine(list: string[]): string {
  return list.join("\n");
}

function createEmptyCapability() {
  return {
    title: "新增能力",
    description: "",
  };
}

function createEmptyProject() {
  return {
    title: "新增项目",
    role: "",
    period: "",
    summary: "",
    stack: [],
    scope: [],
    metrics: [],
    links: [],
  };
}

function createEmptySocial() {
  return {
    label: "链接名称",
    href: "",
  };
}

export default function AdminConsole({
  open,
  profile,
  onClose,
  onSaved,
}: Props) {
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("profile");
  const [draft, setDraft] = useState<ProfileData>(() => cloneProfile(profile));
  const [rawJson, setRawJson] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const projectCount = draft.projects.length;

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(cloneProfile(profile));
    setRawJson(JSON.stringify(profile, null, 2));
    setStatusMessage("");
    setAuthError("");
    setActiveTab("profile");

    void (async () => {
      setSessionReady(false);
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        const data = (await response.json()) as { authenticated?: boolean };
        setAuthenticated(Boolean(data.authenticated));
      } catch {
        setAuthenticated(false);
      } finally {
        setSessionReady(true);
      }
    })();
  }, [open, profile]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function patchDraft(updater: (profile: ProfileData) => ProfileData) {
    setDraft((current) => updater(cloneProfile(current)));
  }

  async function handleLogin() {
    setLoginPending(true);
    setAuthError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setAuthError(data.error || "登录失败");
        return;
      }

      setAuthenticated(true);
      setPassword("");
    } catch {
      setAuthError("登录失败");
    } finally {
      setLoginPending(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "include",
    });
    setAuthenticated(false);
    setStatusMessage("");
    setAuthError("");
  }

  async function handleSave() {
    setSavePending(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as { error?: string } & Partial<ProfileData>;
      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
        }
        setStatusMessage(data.error || "保存失败");
        return;
      }

      const savedProfile = data as ProfileData;
      setDraft(savedProfile);
      setRawJson(JSON.stringify(savedProfile, null, 2));
      onSaved(savedProfile);
      setStatusMessage("已保存");
    } catch {
      setStatusMessage("保存失败");
    } finally {
      setSavePending(false);
    }
  }

  async function handleAiAction(mode: "import" | "polish") {
    if (mode === "import" && !aiSourceText.trim()) {
      setStatusMessage("请先粘贴要导入的文本");
      return;
    }

    setAiPending(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mode,
          profile: draft,
          sourceText: aiSourceText,
          instruction: aiInstruction,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        profile?: ProfileData;
      };

      if (!response.ok || !data.profile) {
        if (response.status === 401) {
          setAuthenticated(false);
        }
        setStatusMessage(data.error || "AI 处理失败");
        return;
      }

      setDraft(data.profile);
      setRawJson(JSON.stringify(data.profile, null, 2));
      setStatusMessage(mode === "import" ? "AI 已导入到草稿" : "AI 已润色草稿");
      setActiveTab("profile");
    } catch {
      setStatusMessage("AI 处理失败");
    } finally {
      setAiPending(false);
    }
  }

  function applyRawJson() {
    try {
      const parsed = JSON.parse(rawJson) as ProfileData;
      setDraft(parsed);
      setStatusMessage("JSON 已应用到草稿");
    } catch {
      setStatusMessage("JSON 格式错误");
    }
  }

  if (!open) {
    return null;
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="admin-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="admin-panel">
        <div className="admin-header">
          <div>
            <span className="admin-kicker">Hidden Console</span>
            <h2>站点管理</h2>
          </div>
          <div className="admin-header-actions">
            {authenticated ? (
              <>
                <button type="button" className="admin-ghost" onClick={handleLogout}>
                  退出
                </button>
                <button
                  type="button"
                  className="admin-primary"
                  onClick={handleSave}
                  disabled={savePending}
                >
                  {savePending ? "保存中..." : "保存"}
                </button>
              </>
            ) : null}
            <button type="button" className="admin-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
        </div>

        {!sessionReady ? (
          <div className="admin-loading">加载中...</div>
        ) : !authenticated ? (
          <div className="admin-login">
            <div className="admin-login-card">
              <span className="admin-kicker">Access</span>
              <h3>输入密码进入管理后台</h3>
              <input
                type="password"
                className="admin-input"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
              />
              {authError ? <p className="admin-error">{authError}</p> : null}
              <button
                type="button"
                className="admin-primary admin-login-button"
                onClick={handleLogin}
                disabled={loginPending}
              >
                {loginPending ? "验证中..." : "进入"}
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-body">
            <aside className="admin-sidebar">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              <div className="admin-sidebar-note">
                <span>项目数</span>
                <strong>{String(projectCount).padStart(2, "0")}</strong>
              </div>
            </aside>

            <section className="admin-content">
              {statusMessage ? <div className="admin-status">{statusMessage}</div> : null}

              {activeTab === "profile" ? (
                <div className="admin-section-grid">
                  <section className="admin-section-card">
                    <h3>基础资料</h3>
                    <label className="admin-field">
                      <span>姓名</span>
                      <input
                        className="admin-input"
                        value={draft.displayName}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            displayName: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>标题</span>
                      <input
                        className="admin-input"
                        value={draft.headline}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            headline: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>地点</span>
                      <input
                        className="admin-input"
                        value={draft.location}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            location: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>简介</span>
                      <textarea
                        className="admin-textarea"
                        rows={4}
                        value={draft.intro}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            intro: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>标签</span>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={joinByComma(draft.tags)}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            tags: splitByComma(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </section>

                  <section className="admin-section-card">
                    <h3>定位信息</h3>
                    <label className="admin-field">
                      <span>身份</span>
                      <input
                        className="admin-input"
                        value={draft.brand.identity}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            brand: {
                              ...current.brand,
                              identity: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>定位</span>
                      <input
                        className="admin-input"
                        value={draft.brand.positioning}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            brand: {
                              ...current.brand,
                              positioning: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>价值主张</span>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={draft.brand.valueProposition}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            brand: {
                              ...current.brand,
                              valueProposition: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>关键词</span>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={joinByComma(draft.brand.keywords)}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            brand: {
                              ...current.brand,
                              keywords: splitByComma(event.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  </section>

                  <section className="admin-section-card admin-section-card-full">
                    <div className="admin-section-head">
                      <h3>核心能力</h3>
                      <button
                        type="button"
                        className="admin-ghost"
                        onClick={() =>
                          patchDraft((current) => ({
                            ...current,
                            coreCapabilities: [...current.coreCapabilities, createEmptyCapability()],
                          }))
                        }
                      >
                        新增能力
                      </button>
                    </div>

                    <div className="admin-list">
                      {draft.coreCapabilities.map((item, index) => (
                        <article key={`${item.title}-${index}`} className="admin-list-card">
                          <div className="admin-list-card-head">
                            <strong>能力 {String(index + 1).padStart(2, "0")}</strong>
                            <button
                              type="button"
                              className="admin-remove"
                              onClick={() =>
                                patchDraft((current) => ({
                                  ...current,
                                  coreCapabilities: current.coreCapabilities.filter(
                                    (_, itemIndex) => itemIndex !== index
                                  ),
                                }))
                              }
                            >
                              删除
                            </button>
                          </div>
                          <label className="admin-field">
                            <span>标题</span>
                            <input
                              className="admin-input"
                              value={item.title}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  coreCapabilities: current.coreCapabilities.map(
                                    (capability, capabilityIndex) =>
                                      capabilityIndex === index
                                        ? { ...capability, title: event.target.value }
                                        : capability
                                  ),
                                }))
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>描述</span>
                            <textarea
                              className="admin-textarea"
                              rows={3}
                              value={item.description}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  coreCapabilities: current.coreCapabilities.map(
                                    (capability, capabilityIndex) =>
                                      capabilityIndex === index
                                        ? { ...capability, description: event.target.value }
                                        : capability
                                  ),
                                }))
                              }
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "projects" ? (
                <div className="admin-section-grid">
                  <section className="admin-section-card admin-section-card-full">
                    <div className="admin-section-head">
                      <h3>项目管理</h3>
                      <button
                        type="button"
                        className="admin-ghost"
                        onClick={() =>
                          patchDraft((current) => ({
                            ...current,
                            projects: [...current.projects, createEmptyProject()],
                          }))
                        }
                      >
                        新增项目
                      </button>
                    </div>

                    <div className="admin-list">
                      {draft.projects.map((project, index) => (
                        <article key={`${project.title}-${index}`} className="admin-list-card">
                          <div className="admin-list-card-head">
                            <strong>项目 {String(index + 1).padStart(2, "0")}</strong>
                            <button
                              type="button"
                              className="admin-remove"
                              onClick={() =>
                                patchDraft((current) => ({
                                  ...current,
                                  projects: current.projects.filter(
                                    (_, projectIndex) => projectIndex !== index
                                  ),
                                }))
                              }
                            >
                              删除
                            </button>
                          </div>

                          <div className="admin-inline-grid">
                            <label className="admin-field">
                              <span>标题</span>
                              <input
                                className="admin-input"
                                value={project.title}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, title: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>角色</span>
                              <input
                                className="admin-input"
                                value={project.role}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, role: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>时间</span>
                              <input
                                className="admin-input"
                                value={project.period || ""}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, period: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <label className="admin-field">
                            <span>摘要</span>
                            <textarea
                              className="admin-textarea"
                              rows={3}
                              value={project.summary}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  projects: current.projects.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, summary: event.target.value }
                                      : item
                                  ),
                                }))
                              }
                            />
                          </label>

                          <div className="admin-inline-grid">
                            <label className="admin-field">
                              <span>关键词</span>
                              <textarea
                                className="admin-textarea"
                                rows={3}
                                value={joinByComma(project.stack)}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, stack: splitByComma(event.target.value) }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>结果</span>
                              <textarea
                                className="admin-textarea"
                                rows={3}
                                value={joinByComma(project.metrics)}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, metrics: splitByComma(event.target.value) }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <label className="admin-field">
                            <span>关键工作</span>
                            <textarea
                              className="admin-textarea"
                              rows={4}
                              value={joinByLine(project.scope)}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  projects: current.projects.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, scope: splitByLine(event.target.value) }
                                      : item
                                  ),
                                }))
                              }
                            />
                          </label>

                          <div className="admin-inline-grid">
                            <label className="admin-field">
                              <span>链接名称</span>
                              <input
                                className="admin-input"
                                value={project.links[0]?.label || ""}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            links: event.target.value || item.links[0]?.href
                                              ? [
                                                  {
                                                    label: event.target.value,
                                                    href: item.links[0]?.href || "",
                                                  },
                                                ]
                                              : [],
                                          }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                            <label className="admin-field">
                              <span>链接地址</span>
                              <input
                                className="admin-input"
                                value={project.links[0]?.href || ""}
                                onChange={(event) =>
                                  patchDraft((current) => ({
                                    ...current,
                                    projects: current.projects.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            links: event.target.value || item.links[0]?.label
                                              ? [
                                                  {
                                                    label: item.links[0]?.label || "打开项目",
                                                    href: event.target.value,
                                                  },
                                                ]
                                              : [],
                                          }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "contact" ? (
                <div className="admin-section-grid">
                  <section className="admin-section-card">
                    <h3>联系方式</h3>
                    <label className="admin-field">
                      <span>邮箱</span>
                      <input
                        className="admin-input"
                        value={draft.contact.email}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            contact: {
                              ...current.contact,
                              email: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>合作方向</span>
                      <textarea
                        className="admin-textarea"
                        rows={4}
                        value={joinByLine(draft.contact.collaboration)}
                        onChange={(event) =>
                          patchDraft((current) => ({
                            ...current,
                            contact: {
                              ...current.contact,
                              collaboration: splitByLine(event.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  </section>

                  <section className="admin-section-card">
                    <div className="admin-section-head">
                      <h3>社交链接</h3>
                      <button
                        type="button"
                        className="admin-ghost"
                        onClick={() =>
                          patchDraft((current) => ({
                            ...current,
                            contact: {
                              ...current.contact,
                              socials: [...current.contact.socials, createEmptySocial()],
                            },
                          }))
                        }
                      >
                        新增链接
                      </button>
                    </div>

                    <div className="admin-list">
                      {draft.contact.socials.map((item, index) => (
                        <article key={`${item.label}-${index}`} className="admin-list-card compact">
                          <div className="admin-list-card-head">
                            <strong>链接 {String(index + 1).padStart(2, "0")}</strong>
                            <button
                              type="button"
                              className="admin-remove"
                              onClick={() =>
                                patchDraft((current) => ({
                                  ...current,
                                  contact: {
                                    ...current.contact,
                                    socials: current.contact.socials.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    ),
                                  },
                                }))
                              }
                            >
                              删除
                            </button>
                          </div>
                          <label className="admin-field">
                            <span>名称</span>
                            <input
                              className="admin-input"
                              value={item.label}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  contact: {
                                    ...current.contact,
                                    socials: current.contact.socials.map((social, socialIndex) =>
                                      socialIndex === index
                                        ? { ...social, label: event.target.value }
                                        : social
                                    ),
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>地址</span>
                            <input
                              className="admin-input"
                              value={item.href}
                              onChange={(event) =>
                                patchDraft((current) => ({
                                  ...current,
                                  contact: {
                                    ...current.contact,
                                    socials: current.contact.socials.map((social, socialIndex) =>
                                      socialIndex === index
                                        ? { ...social, href: event.target.value }
                                        : social
                                    ),
                                  },
                                }))
                              }
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "ai" ? (
                <div className="admin-section-grid">
                  <section className="admin-section-card admin-section-card-full">
                    <h3>AI 一键处理</h3>
                    <p className="admin-hint">
                      当前接入 Kimi API，可将简历或项目文本导入为结构化草稿，也可直接润色当前内容。
                    </p>
                    <label className="admin-field">
                      <span>额外要求</span>
                      <input
                        className="admin-input"
                        placeholder="例如：更简洁、更偏产品经理、更偏工程化"
                        value={aiInstruction}
                        onChange={(event) => setAiInstruction(event.target.value)}
                      />
                    </label>
                    <label className="admin-field">
                      <span>导入文本</span>
                      <textarea
                        className="admin-textarea large"
                        rows={10}
                        placeholder="在这里粘贴简历、项目描述、获奖经历等文本。"
                        value={aiSourceText}
                        onChange={(event) => setAiSourceText(event.target.value)}
                      />
                    </label>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="admin-primary"
                        onClick={() => void handleAiAction("polish")}
                        disabled={aiPending}
                      >
                        {aiPending ? "处理中..." : "AI 润色当前草稿"}
                      </button>
                      <button
                        type="button"
                        className="admin-ghost strong"
                        onClick={() => void handleAiAction("import")}
                        disabled={aiPending}
                      >
                        {aiPending ? "处理中..." : "AI 导入并合并文本"}
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "json" ? (
                <div className="admin-section-grid">
                  <section className="admin-section-card admin-section-card-full">
                    <div className="admin-section-head">
                      <h3>高级 JSON</h3>
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-ghost"
                          onClick={() => setRawJson(JSON.stringify(draft, null, 2))}
                        >
                          从草稿同步
                        </button>
                        <button type="button" className="admin-primary" onClick={applyRawJson}>
                          应用 JSON
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="admin-code"
                      value={rawJson}
                      onChange={(event) => setRawJson(event.target.value)}
                    />
                  </section>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
