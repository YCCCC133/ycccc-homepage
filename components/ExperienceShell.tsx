"use client";

import type { CSSProperties } from "react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import AdminConsole from "./AdminConsole";
import type { ProfileData } from "../lib/site-data";

type Props = {
  initialProfile: ProfileData;
};

const sections = [
  { id: "overview", label: "首页" },
  { id: "capabilities", label: "能力" },
  { id: "projects", label: "项目" },
  { id: "contact", label: "联系" },
] as const;

function motionStyle(delay: number): CSSProperties {
  return { ["--delay" as string]: `${delay}ms` };
}

function trimText(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max).trim()}...`;
}

function resetTiltStyles(element: HTMLElement) {
  element.style.setProperty("--rx", "0deg");
  element.style.setProperty("--ry", "0deg");
  element.style.setProperty("--sx", "0.5");
  element.style.setProperty("--sy", "0.5");
}

function resetMagnetStyles(element: HTMLElement) {
  element.style.setProperty("--mag-x", "0px");
  element.style.setProperty("--mag-y", "0px");
}

export default function ExperienceShell({ initialProfile }: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const adminClickTimeoutRef = useRef<number | null>(null);
  const adminLongPressTimeoutRef = useRef<number | null>(null);
  const adminClickCountRef = useRef(0);
  const adminLongPressTriggeredRef = useRef(false);
  const projectSectionRef = useRef<HTMLElement | null>(null);
  const projectTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeProjectIndexRef = useRef(0);
  const [profile, setProfile] = useState(initialProfile);
  const [projectScrollMode, setProjectScrollMode] = useState(false);
  const [activeSection, setActiveSection] =
    useState<(typeof sections)[number]["id"]>("overview");
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const deferredProjectIndex = useDeferredValue(activeProjectIndex);
  const activeProject = profile.projects[deferredProjectIndex] ?? null;
  const headlineParts = profile.headline
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const [school = profile.location, major = "软件工程", cohort = "2027 届本科"] =
    headlineParts;
  const focusKeywords = profile.brand.keywords.slice(0, 4);
  const capabilities = profile.coreCapabilities.slice(0, 5);
  const socialLinks = profile.contact.socials.slice(0, 3);
  const quickMail = `mailto:${profile.contact.email}?subject=${encodeURIComponent(
    "合作沟通"
  )}&body=${encodeURIComponent("你好，我想和你聊一个项目。")}`;
  const progressWidth = profile.projects.length
    ? ((deferredProjectIndex + 1) / profile.projects.length) * 100
    : 0;

  const resetPointer = useEffectEvent(() => {
    const root = shellRef.current;
    if (!root) {
      return;
    }

    root.style.setProperty("--mx", "0.56");
    root.style.setProperty("--my", "0.32");
  });

  const handlePointerMove = useEffectEvent((event: PointerEvent) => {
    const root = shellRef.current;
    if (!root) {
      return;
    }

    const x = (event.clientX / window.innerWidth).toFixed(4);
    const y = (event.clientY / window.innerHeight).toFixed(4);
    root.style.setProperty("--mx", x);
    root.style.setProperty("--my", y);
  });

  useEffect(() => {
    document.documentElement.lang = "zh-CN";
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 1161px) and (hover: hover) and (pointer: fine)"
    );

    const syncMode = () => {
      setProjectScrollMode(mediaQuery.matches);
    };

    syncMode();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMode);
    } else {
      mediaQuery.addListener(syncMode);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncMode);
      } else {
        mediaQuery.removeListener(syncMode);
      }
    };
  }, []);

  useEffect(() => {
    resetPointer();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", resetPointer);
    window.addEventListener("blur", resetPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
    };
  }, [handlePointerMove, resetPointer]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as (typeof sections)[number]["id"]);
          }
        });
      },
      { threshold: 0.45 }
    );

    sections.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      if (adminClickTimeoutRef.current) {
        window.clearTimeout(adminClickTimeoutRef.current);
      }

      if (adminLongPressTimeoutRef.current) {
        window.clearTimeout(adminLongPressTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(profile.contact.email);
      setCopiedEmail(true);

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedEmail(false);
      }, 1800);
    } catch {
      window.location.href = quickMail;
    }
  }

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (deferredProjectIndex < profile.projects.length) {
      return;
    }

    setActiveProjectIndex(0);
  }, [deferredProjectIndex, profile.projects.length]);

  useEffect(() => {
    activeProjectIndexRef.current = activeProjectIndex;
  }, [activeProjectIndex]);

  useEffect(() => {
    projectTabRefs.current = projectTabRefs.current.slice(0, profile.projects.length);
  }, [profile.projects.length]);

  useEffect(() => {
    if (!projectScrollMode || !profile.projects.length) {
      return;
    }

    let frameId = 0;

    function syncProjectByScroll() {
      frameId = 0;

      const section = projectSectionRef.current;
      if (!section) {
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (
        sectionRect.bottom < viewportHeight * 0.16 ||
        sectionRect.top > viewportHeight * 0.76
      ) {
        return;
      }

      const targetLine = viewportHeight * 0.42;
      let nextIndex = activeProjectIndexRef.current;
      let nearestDistance = Number.POSITIVE_INFINITY;

      projectTabRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - targetLine);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nextIndex = index;
        }
      });

      if (nextIndex !== activeProjectIndexRef.current) {
        startTransition(() => {
          setActiveProjectIndex(nextIndex);
        });
      }
    }

    function handleScroll() {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(syncProjectByScroll);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [profile.projects.length, projectScrollMode]);

  function handleProjectChange(index: number, alignCard = false) {
    startTransition(() => {
      setActiveProjectIndex(index);
    });

    if (alignCard && projectScrollMode) {
      projectTabRefs.current[index]?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }

  function handleTiltMove(event: React.PointerEvent<HTMLElement>) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 10;
    const rotateX = (0.5 - py) * 8;

    element.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    element.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    element.style.setProperty("--sx", px.toFixed(3));
    element.style.setProperty("--sy", py.toFixed(3));
  }

  function handleTiltLeave(event: React.PointerEvent<HTMLElement>) {
    resetTiltStyles(event.currentTarget);
  }

  function handleMagnetMove(event: React.PointerEvent<HTMLElement>) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    element.style.setProperty("--mag-x", `${(offsetX * 0.12).toFixed(2)}px`);
    element.style.setProperty("--mag-y", `${(offsetY * 0.12).toFixed(2)}px`);
  }

  function handleMagnetLeave(event: React.PointerEvent<HTMLElement>) {
    resetMagnetStyles(event.currentTarget);
  }

  function openAdminConsole() {
    setAdminOpen(true);
  }

  function resetAdminSequence() {
    adminClickCountRef.current = 0;

    if (adminClickTimeoutRef.current) {
      window.clearTimeout(adminClickTimeoutRef.current);
      adminClickTimeoutRef.current = null;
    }
  }

  function handleSecretBrandClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (adminLongPressTriggeredRef.current) {
      event.preventDefault();
      adminLongPressTriggeredRef.current = false;
      return;
    }

    adminClickCountRef.current += 1;

    if (adminClickTimeoutRef.current) {
      window.clearTimeout(adminClickTimeoutRef.current);
    }

    if (adminClickCountRef.current >= 5) {
      resetAdminSequence();
      openAdminConsole();
      return;
    }

    adminClickTimeoutRef.current = window.setTimeout(() => {
      adminClickCountRef.current = 0;
      adminClickTimeoutRef.current = null;
    }, 1200);
  }

  function handleSecretBrandPressStart(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (event.pointerType === "mouse") {
      return;
    }

    adminLongPressTriggeredRef.current = false;

    if (adminLongPressTimeoutRef.current) {
      window.clearTimeout(adminLongPressTimeoutRef.current);
    }

    adminLongPressTimeoutRef.current = window.setTimeout(() => {
      adminLongPressTriggeredRef.current = true;
      resetAdminSequence();
      openAdminConsole();
    }, 900);
  }

  function handleSecretBrandPressEnd() {
    if (adminLongPressTimeoutRef.current) {
      window.clearTimeout(adminLongPressTimeoutRef.current);
      adminLongPressTimeoutRef.current = null;
    }
  }

  return (
    <div ref={shellRef} className="shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-a" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-b" aria-hidden="true" />
      {copiedEmail ? <div className="copy-toast">邮箱已复制</div> : null}

      <header className="topbar reveal" style={motionStyle(40)}>
        <div className="brand-mark">
          <button
            type="button"
            className="brand-secret"
            aria-label="隐藏管理入口"
            onClick={handleSecretBrandClick}
            onPointerDown={handleSecretBrandPressStart}
            onPointerUp={handleSecretBrandPressEnd}
            onPointerCancel={handleSecretBrandPressEnd}
            onPointerLeave={handleSecretBrandPressEnd}
          >
            <span className="brand-dot" />
          </button>
          <a href="#overview" className="brand-link">
            YCCCC
          </a>
        </div>
        <nav className="topnav" aria-label="页面导航">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={activeSection === section.id ? "active" : ""}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="page">
        <section id="overview" className="hero-panel section-panel">
          <div className="hero-grid">
            <div className="hero-copy reveal" style={motionStyle(120)}>
              <p className="eyebrow">个人主页</p>
              <h1>YCCCC</h1>
              <div className="hero-meta">{headlineParts.join(" · ")}</div>
              <p className="hero-lead">{profile.intro}</p>

              <div className="chip-row">
                {profile.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="action-row hero-actions">
                <a
                  className="primary-button magnetic"
                  href="#projects"
                  onPointerMove={handleMagnetMove}
                  onPointerLeave={handleMagnetLeave}
                >
                  看项目
                </a>
                <button
                  type="button"
                  className="secondary-button magnetic"
                  onClick={handleCopyEmail}
                  onPointerMove={handleMagnetMove}
                  onPointerLeave={handleMagnetLeave}
                >
                  {copiedEmail ? "邮箱已复制" : "复制邮箱"}
                </button>
                <a
                  className="text-button magnetic"
                  href={quickMail}
                  onPointerMove={handleMagnetMove}
                  onPointerLeave={handleMagnetLeave}
                >
                  发邮件
                </a>
              </div>
            </div>

            <aside className="hero-side">
              <article
                className="info-card tilt-card reveal"
                style={motionStyle(180)}
                onPointerMove={handleTiltMove}
                onPointerLeave={handleTiltLeave}
              >
                <div className="card-kicker">个人信息</div>
                <div className="info-list">
                  <div className="info-row">
                    <span>姓名</span>
                    <strong>{profile.displayName}</strong>
                  </div>
                  <div className="info-row">
                    <span>学校</span>
                    <strong>{school}</strong>
                  </div>
                  <div className="info-row">
                    <span>专业</span>
                    <strong>{major}</strong>
                  </div>
                  <div className="info-row">
                    <span>届别</span>
                    <strong>{cohort}</strong>
                  </div>
                  <div className="info-row">
                    <span>身份</span>
                    <strong>{profile.brand.identity}</strong>
                  </div>
                  <div className="info-row">
                    <span>定位</span>
                    <strong>{profile.brand.positioning}</strong>
                  </div>
                </div>
                <div className="info-block">
                  <span className="detail-label">关注方向</span>
                  <div className="info-chip-row">
                    {focusKeywords.map((keyword) => (
                      <span key={keyword} className="soft-chip">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section id="capabilities" className="section-panel capability-section">
          <div className="section-heading reveal" style={motionStyle(70)}>
            <h2>核心能力</h2>
          </div>

          <article
            className="capability-panel capability-panel-standalone reveal"
            style={motionStyle(120)}
          >
            <div className="capability-list capability-list-standalone">
              {capabilities.map((item, index) => (
                <article
                  key={item.title}
                  className="capability-card capability-card-standalone tilt-card reveal"
                  style={motionStyle(180 + index * 60)}
                  onPointerMove={handleTiltMove}
                  onPointerLeave={handleTiltLeave}
                >
                  <span className="capability-index capability-index-standalone">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section
          id="projects"
          ref={projectSectionRef}
          className="section-panel content-panel project-section"
        >
          <div className="section-heading reveal" style={motionStyle(80)}>
            <h2>项目</h2>
          </div>

          <div className="project-board">
            <div className="project-list">
              {profile.projects.map((project, index) => {
                const isActive = index === activeProjectIndex;
                return (
                  <button
                    key={project.title}
                    ref={(node) => {
                      projectTabRefs.current[index] = node;
                    }}
                    type="button"
                    className={`project-tab tilt-card${isActive ? " active" : ""}`}
                    onClick={() => handleProjectChange(index, true)}
                    onFocus={() => handleProjectChange(index)}
                    onPointerMove={handleTiltMove}
                    onPointerLeave={handleTiltLeave}
                    aria-pressed={isActive}
                  >
                    <div className="project-tab-top">
                      <span className="project-order">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="project-role">{project.role}</span>
                    </div>
                    {project.period ? <div className="project-period">{project.period}</div> : null}
                    <h3>{project.title}</h3>
                    <p>{trimText(project.summary, 36)}</p>
                    <div className="project-tab-meta">
                      {project.metrics.slice(0, 2).map((metric) => (
                        <span key={metric}>{metric}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="project-stage-column">
              {activeProject ? (
                <div className="project-stage-stick">
                  <article
                    key={`${activeProject.title}-${deferredProjectIndex}`}
                    className="project-stage tilt-card reveal"
                    style={motionStyle(140)}
                    onPointerMove={handleTiltMove}
                    onPointerLeave={handleTiltLeave}
                  >
                    <div className="project-stage-glow" aria-hidden="true">
                      {String(deferredProjectIndex + 1).padStart(2, "0")}
                    </div>
                    <div className="project-stage-header">
                      <div className="project-stage-meta">
                        <span className="project-stage-tag">
                          案例 {String(deferredProjectIndex + 1).padStart(2, "0")}
                        </span>
                        {activeProject.period ? (
                          <span className="project-period project-period-stage">
                            {activeProject.period}
                          </span>
                        ) : null}
                      </div>
                      <div className="project-link-row">
                        {activeProject.links.length ? (
                          activeProject.links.map((link) => (
                            <a
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-link"
                            >
                              {link.label}
                            </a>
                          ))
                        ) : (
                          <span className="project-private">项目暂未公开</span>
                        )}
                      </div>
                    </div>

                    <h3>{activeProject.title}</h3>
                    <p className="project-summary">{activeProject.summary}</p>

                    <div className="project-detail-block">
                      <span className="detail-label">关键词</span>
                      <div className="chip-row">
                        {activeProject.stack.map((item) => (
                          <span key={item} className="soft-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="project-detail-block">
                      <span className="detail-label">关键工作</span>
                      <div className="project-scope-list">
                        {activeProject.scope.map((item, index) => (
                          <article key={item} className="project-scope-card">
                            <span className="project-scope-index">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <p>{item}</p>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="project-detail-block project-detail-block-results">
                      <span className="detail-label">项目结果</span>
                      <div className="project-result-grid">
                        {activeProject.metrics.map((metric) => (
                          <span key={metric} className="soft-chip project-metric-chip">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="project-progress">
                      <span
                        style={{
                          width: `${progressWidth}%`,
                        }}
                      />
                    </div>

                    <div className="action-row">
                      {activeProject.links[0] ? (
                        <a
                          className="primary-button magnetic"
                          href={activeProject.links[0].href}
                          target="_blank"
                          rel="noreferrer"
                          onPointerMove={handleMagnetMove}
                          onPointerLeave={handleMagnetLeave}
                        >
                          打开项目
                        </a>
                      ) : (
                        <span className="secondary-button button-disabled">
                          项目暂未公开
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="contact" className="section-panel contact-panel">
          <div className="contact-layout">
            <div className="contact-copy reveal" style={motionStyle(100)}>
              <h2>联系</h2>
              <a className="contact-email" href={quickMail}>
                {profile.contact.email}
              </a>
              <div className="action-row">
                <button
                  type="button"
                  className="primary-button magnetic"
                  onClick={handleCopyEmail}
                  onPointerMove={handleMagnetMove}
                  onPointerLeave={handleMagnetLeave}
                >
                  {copiedEmail ? "已复制" : "复制邮箱"}
                </button>
                <a
                  className="secondary-button magnetic"
                  href={quickMail}
                  onPointerMove={handleMagnetMove}
                  onPointerLeave={handleMagnetLeave}
                >
                  立即发信
                </a>
              </div>
            </div>

            <article
              className="contact-card tilt-card reveal"
              style={motionStyle(160)}
              onPointerMove={handleTiltMove}
              onPointerLeave={handleTiltLeave}
            >
              <span className="detail-label">社交链接</span>
              <div className="social-link-list">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link magnetic"
                    onPointerMove={handleMagnetMove}
                    onPointerLeave={handleMagnetLeave}
                  >
                    <span>{item.label}</span>
                    <span>↗</span>
                  </a>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>

      <AdminConsole
        open={adminOpen}
        profile={profile}
        onClose={() => setAdminOpen(false)}
        onSaved={(nextProfile) => setProfile(nextProfile)}
      />
    </div>
  );
}
