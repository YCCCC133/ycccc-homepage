'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Volume2, ChevronRight, Megaphone, AlertTriangle, Info } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export function ScrollingAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/announcements?limit=10&published_only=true');
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setAnnouncements(data.data);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
      }
    }
    fetchAnnouncements();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '通知':
        return <Megaphone className="h-4 w-4 text-blue-400" />;
      case '公告':
        return <Volume2 className="h-4 w-4 text-emerald-400" />;
      case '警告':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case '通知':
        return 'from-blue-500/20 to-blue-600/10';
      case '公告':
        return 'from-emerald-500/20 to-emerald-600/10';
      case '警告':
        return 'from-amber-500/20 to-amber-600/10';
      default:
        return 'from-cyan-500/20 to-cyan-600/10';
    }
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div 
      className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
      
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Icon and label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-ping" />
              <div className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                <Volume2 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <span className="hidden sm:block text-sm font-semibold text-white/90 tracking-wide">
              公告
            </span>
          </div>

          {/* Scrolling content */}
          <div className="flex-1 min-w-0 relative overflow-hidden">
            <Link 
              href={`/announcements/${currentAnnouncement.id}`}
              className="block group"
            >
              <div className="flex items-center gap-3">
                {/* Category badge */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${getCategoryGradient(currentAnnouncement.category)} border border-white/10 shrink-0`}>
                  {getCategoryIcon(currentAnnouncement.category)}
                  <span className="text-xs font-medium text-white/80">
                    {currentAnnouncement.category}
                  </span>
                </div>

                {/* Title with fade effect on sides */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10" />
                  <h4 className="text-sm sm:text-base font-medium text-white truncate group-hover:text-emerald-400 transition-colors duration-300">
                    {currentAnnouncement.title}
                  </h4>
                </div>

                {/* Arrow indicator */}
                <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
              </div>
            </Link>
          </div>

          {/* Navigation dots */}
          {announcements.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex 
                      ? 'w-4 h-2 bg-emerald-400' 
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`跳转到公告 ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {announcements.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / announcements.length) * 100}%`,
                animation: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none" />
    </div>
  );
}

// Compact version for navigation bar
export function CompactAnnouncementBadge({ count = 0 }: { count?: number }) {
  if (count === 0) return null;

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute -top-1 -right-1 h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </div>
    </div>
  );
}
