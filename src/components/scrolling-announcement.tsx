'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2,
} from 'lucide-react';
import {
  getAnnouncementList,
  AnnouncementListItem,
  stripHtml,
} from '@/lib/api/announcements';

export function ScrollingAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  
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

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  }, [announcements.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, [announcements.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Volume2 className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
            <span className="text-emerald-300/60 text-xs">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (error || announcements.length === 0) {
    return (
      <div className="w-full h-[200px] bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Volume2 className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-emerald-600/50 text-sm">暂无公告</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="w-full">
      {/* Main Image Carousel */}
      <div 
        className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] lg:h-[480px] xl:h-[520px] overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        {announcements.map((announcement, index) => {
          const isActive = index === currentIndex;
          
          return (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className={`
                absolute inset-0 transition-opacity duration-500 ease-in-out
                ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}
              `}
            >
              {announcement.image_url ? (
                <Image
                  src={announcement.image_url}
                  alt={announcement.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
              ) : (
                <div className={`
                  absolute inset-0 bg-gradient-to-br
                  ${index % 3 === 0 ? 'from-emerald-600 via-teal-600 to-cyan-700' : ''}
                  ${index % 3 === 1 ? 'from-slate-700 via-emerald-800 to-teal-900' : ''}
                  ${index % 3 === 2 ? 'from-teal-600 via-emerald-700 to-green-800' : ''}
                `} />
              )}
              
              {/* Gradient overlay - stronger at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            </Link>
          );
        })}

        {/* Bottom Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10">
            
            {/* Category Tag */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="px-2.5 py-1 rounded text-[10px] sm:text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/20">
                {currentAnnouncement.category}
              </span>
              {currentAnnouncement.is_top && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400 text-amber-900">
                  置顶
                </span>
              )}
            </div>

            {/* Main Title - Prominent */}
            <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2 max-w-4xl drop-shadow-lg">
              {currentAnnouncement.title}
            </h2>

            {/* Summary - Subtle */}
            {currentAnnouncement.summary && (
              <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-2xl line-clamp-1 sm:line-clamp-2 hidden sm:block">
                {stripHtml(currentAnnouncement.summary)}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Arrows - Left */}
        {announcements.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center"
              aria-label="上一条"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center"
              aria-label="下一条"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        {/* Dot Indicators - Bottom Center */}
        {announcements.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`
                  rounded-full transition-all duration-300
                  ${index === currentIndex 
                    ? 'w-6 sm:w-8 h-2 bg-white shadow-lg' 
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                  }
                `}
                aria-label={`跳转到第 ${index + 1} 条`}
              />
            ))}
          </div>
        )}

        {/* Page Counter - Bottom Right */}
        {announcements.length > 1 && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:right-8 z-30">
            <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
              <span className="text-white/90 text-[10px] sm:text-xs font-medium">
                {currentIndex + 1} / {announcements.length}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Swipe Hint - First time */}
        {announcements.length > 1 && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 lg:left-8 z-30 hidden sm:block">
            <div className="px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">
              <span className="text-white/60 text-[10px]">左右滑动</span>
            </div>
          </div>
        )}
      </div>

      {/* Swipe instruction for mobile - outside carousel */}
      {announcements.length > 1 && (
        <div className="sm:hidden bg-black/5 py-2 text-center">
          <span className="text-[10px] text-gray-400">左右滑动查看更多</span>
        </div>
      )}
    </div>
  );
}
