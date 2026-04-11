"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Menu, X, ChevronDown } from "lucide-react";

const navItems = [
  {
    label: "首页",
    href: "/",
    icon: "home",
  },
  {
    label: "线索填报",
    href: "/report",
    icon: "report",
  },
  {
    label: "智能咨询",
    href: "/consult",
    icon: "consult",
  },
  {
    label: "文书生成",
    href: "/document",
    icon: "document",
  },
  {
    label: "在线申请",
    href: "/apply",
    icon: "apply",
  },
  {
    label: "案件查询",
    href: "/cases",
    icon: "cases",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${
            isScrolled
              ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-stone-900/5 border-b border-stone-200/50"
              : "bg-white/90 backdrop-blur-md border-b border-stone-200/30"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[70px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div
                className="
                  w-9 h-9 sm:w-11 sm:h-11
                  rounded-xl
                  bg-gradient-to-br from-emerald-500 to-emerald-600
                  flex items-center justify-center
                  shadow-lg shadow-emerald-500/20
                  group-hover:shadow-xl group-hover:shadow-emerald-500/30
                  transition-all duration-200
                  group-hover:scale-105
                "
              >
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span
                  className="
                    text-base sm:text-lg font-semibold
                    bg-gradient-to-r from-stone-800 to-stone-600
                    bg-clip-text text-transparent
                    tracking-wide
                  "
                >
                  护薪平台
                </span>
                <span className="text-[10px] sm:text-xs text-stone-500 -mt-0.5 hidden sm:block">
                  检察支持起诉智能平台
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-2
                      text-sm font-medium
                      rounded-xl
                      transition-all duration-200
                      ${
                        isActive
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-stone-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                      }
                    `}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/admin"
                className="
                  hidden sm:flex items-center gap-2
                  px-4 py-2
                  text-sm font-medium
                  text-stone-600
                  rounded-xl
                  glass-button
                  hover:text-emerald-600
                  transition-all duration-200
                "
              >
                <span>管理后台</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="
                  lg:hidden
                  w-10 h-10
                  flex items-center justify-center
                  rounded-xl
                  glass-button
                  text-stone-600
                "
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all duration-300 ease-out
            ${
              isMobileMenuOpen
                ? "max-h-[400px] opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >
          <div className="
            px-4 py-4
            bg-white/90 backdrop-blur-xl
            border-t border-stone-200/50
            shadow-xl
          ">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-3
                      text-sm font-medium
                      rounded-xl
                      transition-all duration-200
                      ${
                        isActive
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-stone-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-stone-200/50 mt-2 pt-2">
                <Link
                  href="/admin"
                  className="
                    flex items-center justify-center gap-2
                    px-4 py-3
                    text-sm font-medium
                    text-stone-600
                    rounded-xl
                    glass-button
                  "
                >
                  <span>管理后台</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16 sm:h-[70px]" />
    </>
  );
}
