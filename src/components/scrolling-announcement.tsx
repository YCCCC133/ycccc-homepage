'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Volume2, Clock, User, ArrowRight, Megaphone } from 'lucide-react';
import {
  getAnnouncementList,
  AnnouncementListItem,
  formatAnnouncementDate,
  getCategoryGradient,
  stripHtml,
} from '@/lib/api/announcements';

export function ScrollingAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAnnouncementList({
        limit: 10,
        published_only: true,
      });

      if (response.success && response.data && response.data.length > 0) {
        setAnnouncements(response.data);
        setError(null);
      } else {
        // 没有轮播公告时不显示组件
        setAnnouncements([]);
        setError(null);
      }
    } catch (err) {
      console.error('获取公告失败:', err);
      setError('获取公告失败');
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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  // 没有数据时不渲染
  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-center h-8">
            <div className="animate-pulse flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-600">加载公告中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const gradient = getCategoryGradient(currentAnnouncement.category);
  const hasImage = !!currentAnnouncement.image_url;

  return (
    <div
      className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="relative flex items-center gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white shadow-sm`}>
            <Megaphone className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">公告</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {hasImage && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={currentAnnouncement.image_url || ''}
                    alt={currentAnnouncement.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${getCategoryBadgeClass(currentAnnouncement.category)}`}>
                    {currentAnnouncement.category}
                  </span>
                  <Link href={`/announcements/${currentAnnouncement.id}`} className="group flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 group-hover:text-emerald-600 transition-colors truncate">
                      {currentAnnouncement.title}
                    </span>
                    <ArrowRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                </div>
                {currentAnnouncement.summary && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {currentAnnouncement.summary}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-400">
                <div className="hidden sm:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatAnnouncementDate(currentAnnouncement.created_at)}</span>
                </div>

                {announcements.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="p-1 rounded hover:bg-emerald-100 transition-colors"
                      aria-label="上一条"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <span className="text-gray-400 min-w-[2rem] text-center">
                      {currentIndex + 1}/{announcements.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="p-1 rounded hover:bg-emerald-100 transition-colors"
                      aria-label="下一条"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {announcements.length > 1 && !isPaused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / announcements.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {announcements.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-emerald-500 w-4'
                    : 'bg-gray-300 hover:bg-emerald-300'
                }`}
                aria-label={`跳转到第 ${index + 1} 条公告`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for category badge
function getCategoryBadgeClass(category: string): string {
  const colorMap: Record<string, string> = {
    '通知': 'bg-blue-100/80 text-blue-700',
    '公告': 'bg-emerald-100/80 text-emerald-700',
    '指南': 'bg-indigo-100/80 text-indigo-700',
    '案例': 'bg-amber-100/80 text-amber-700',
    '警告': 'bg-red-100/80 text-red-700',
  };
  return colorMap[category] || 'bg-gray-100/80 text-gray-700';
}
