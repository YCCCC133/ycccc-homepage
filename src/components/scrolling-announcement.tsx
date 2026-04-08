'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Volume2, Clock, User, ArrowRight } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  created_at: string;
}

// Fallback gradient backgrounds by category
const categoryGradients: Record<string, string> = {
  '通知': 'from-slate-800 via-slate-700 to-emerald-900',
  '公告': 'from-emerald-900 via-emerald-800 to-teal-900',
  '指南': 'from-blue-900 via-blue-800 to-indigo-900',
  '案例': 'from-amber-900 via-amber-800 to-orange-900',
  '警告': 'from-red-900 via-red-800 to-rose-900',
  'default': 'from-slate-800 via-slate-700 to-emerald-900',
};

export function ScrollingAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements?limit=10&published_only=true');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Auto-scroll effect
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '通知':
        return 'bg-blue-500/80 text-white';
      case '公告':
        return 'bg-emerald-500/80 text-white';
      case '指南':
        return 'bg-violet-500/80 text-white';
      case '案例':
        return 'bg-amber-500/80 text-white';
      case '警告':
        return 'bg-red-500/80 text-white';
      default:
        return 'bg-slate-500/80 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-[320px] sm:h-[380px] md:h-[420px] bg-gradient-to-br from-slate-800 to-emerald-900 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">加载中...</div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const gradient = categoryGradients[currentAnnouncement.category] || categoryGradients.default;
  const hasImage = currentAnnouncement.image_url && imagesLoaded[currentAnnouncement.id];

  return (
    <div 
      className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image or Gradient */}
      {hasImage ? (
        <>
          {/* Optimized Image Loading */}
          <img
            src={currentAnnouncement.image_url || ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: hasImage ? 1 : 0 }}
            onLoad={() => setImagesLoaded(prev => ({ ...prev, [currentAnnouncement.id]: true }))}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-700`} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-end h-full pb-8 sm:pb-12">
          {/* Category Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${getCategoryColor(currentAnnouncement.category)}`}>
              <Volume2 className="h-3.5 w-3.5" />
              {currentAnnouncement.category}
            </span>
          </div>

          {/* Title */}
          <Link href={`/announcements/${currentAnnouncement.id}`} className="group">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors duration-300 line-clamp-2">
              {currentAnnouncement.title}
            </h2>
          </Link>

          {/* Content Preview */}
          <p className="text-white/70 text-sm sm:text-base md:text-lg mb-4 line-clamp-2 max-w-3xl">
            {currentAnnouncement.content?.replace(/<[^>]*>/g, '').slice(0, 150)}...
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDate(currentAnnouncement.created_at)}
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <User className="h-4 w-4" />
              管理员
            </span>
          </div>

          {/* CTA Button */}
          <Link 
            href={`/announcements/${currentAnnouncement.id}`}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white font-medium transition-all duration-300 w-fit"
          >
            查看详情
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {announcements.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all duration-300 hover:scale-110"
            aria-label="上一条"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all duration-300 hover:scale-110"
            aria-label="下一条"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Bottom Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {announcements.map((announcement, index) => (
          <button
            key={announcement.id}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex 
                ? 'w-8 h-2.5 bg-white' 
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`跳转到公告 ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {announcements.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / announcements.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Thumbnail version for sidebar or compact display
export function AnnouncementThumbnails({ announcements }: { announcements: Announcement[] }) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {announcements.slice(0, 6).map((announcement) => (
        <Link
          key={announcement.id}
          href={`/announcements/${announcement.id}`}
          className="group relative aspect-[16/9] rounded-lg overflow-hidden"
        >
          {announcement.image_url ? (
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <span className="text-[10px] text-white/80 bg-black/30 px-1.5 py-0.5 rounded">
              {announcement.category}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
