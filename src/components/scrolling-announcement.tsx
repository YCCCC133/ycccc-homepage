'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  ArrowRight, 
  Megaphone,
  Bell,
  Pin,
  Volume2,
} from 'lucide-react';
import {
  getAnnouncementList,
  AnnouncementListItem,
  formatAnnouncementDate,
  stripHtml,
} from '@/lib/api/announcements';

export function ScrollingAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const progressRef = useRef(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Progress bar animation
  useEffect(() => {
    if (announcements.length <= 1 || isPaused || isHovered) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    progressRef.current = 0;
    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      progressRef.current += increment;
      if (progressRef.current >= 100) {
        progressRef.current = 0;
      }
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [announcements.length, isPaused, isHovered]);

  // Auto-scroll effect
  useEffect(() => {
    if (announcements.length <= 1 || isPaused || isHovered) return;

    const timeout = setTimeout(() => {
      goToNext();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [announcements.length, isPaused, isHovered, currentIndex]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    progressRef.current = 0;
    setTimeout(() => setIsTransitioning(false), 500);
  }, [announcements.length, isTransitioning]);

  const goToPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    progressRef.current = 0;
    setTimeout(() => setIsTransitioning(false), 500);
  }, [announcements.length, isTransitioning]);

  const goToNextBtn = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    progressRef.current = 0;
    setTimeout(() => setIsTransitioning(false), 500);
  }, [announcements.length, isTransitioning]);

  const handleDotClick = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    progressRef.current = 0;
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="absolute inset-0 animate-ping opacity-30">
              <div className="w-20 h-20 rounded-full bg-emerald-500/50" />
            </div>
            <div className="relative flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center">
                <Volume2 className="h-8 w-8 text-emerald-400 animate-bounce" style={{ animationDuration: '1.2s' }} />
              </div>
              <span className="text-emerald-300/80 text-base font-medium animate-pulse">
                正在加载公告...
              </span>
            </div>
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
            <Megaphone className="h-12 w-12 text-emerald-300 mx-auto mb-2" />
            <p className="text-emerald-600/60 text-sm">暂无公告信息</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAnnouncement = announcements[currentIndex];
  const hasImage = !!currentAnnouncement.image_url;
  const progressPercent = isPaused || isHovered ? progressRef.current : progressRef.current;

  return (
    <div 
      className="w-full relative overflow-hidden"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
    >
      {/* Main Image Carousel Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
        
        {/* Background Images */}
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`
              absolute inset-0 transition-opacity duration-500 ease-in-out
              ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            {hasImage && announcement.image_url ? (
              <Image
                src={announcement.image_url}
                alt={announcement.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            ) : (
              // Fallback gradient background
              <div className={`
                absolute inset-0 bg-gradient-to-br
                ${index % 3 === 0 ? 'from-emerald-600 via-teal-600 to-cyan-700' : ''}
                ${index % 3 === 1 ? 'from-slate-700 via-emerald-800 to-teal-900' : ''}
                ${index % 3 === 2 ? 'from-teal-600 via-emerald-700 to-green-800' : ''}
              `}>
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id={`grid-${index}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill={`url(#grid-${index})`}/>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>
        ))}

        {/* Top Badge - Announcement Label */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:left-8 z-20">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
            <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <span className="text-white font-semibold text-sm sm:text-base">公告</span>
            <span className="hidden sm:inline text-white/70 text-xs">Announcement</span>
          </div>
        </div>

        {/* Top Right: Time and Counter */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:right-8 z-20 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/20 border border-white/10">
            <Clock className="h-3.5 w-3.5 text-white/70" />
            <span className="text-white/80 text-xs">
              {formatAnnouncementDate(currentAnnouncement.created_at)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg backdrop-blur-md bg-white/10 border border-white/20">
            <span className="text-white font-semibold text-sm">
              {currentIndex + 1}
            </span>
            <span className="text-white/60 text-xs"> / {announcements.length}</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
            
            {/* Category and Top Badge */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/80 text-white border border-white/20 backdrop-blur-sm">
                {currentAnnouncement.category}
              </span>
              {currentAnnouncement.is_top && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-amber-950 border border-amber-400/50 shadow-lg">
                  <Pin className="h-3 w-3" />
                  置顶
                </span>
              )}
            </div>

            {/* Main Title */}
            <Link href={`/announcements/${currentAnnouncement.id}`}>
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2 sm:mb-3 max-w-4xl group cursor-pointer">
                <span className="group-hover:text-emerald-300 transition-colors duration-300">
                  {currentAnnouncement.title}
                </span>
              </h2>
            </Link>

            {/* Summary */}
            {currentAnnouncement.summary && (
              <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-3xl line-clamp-2 mb-4 sm:mb-6 hidden md:block">
                {stripHtml(currentAnnouncement.summary)}
              </p>
            )}

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <Link href={`/announcements/${currentAnnouncement.id}`}>
                <button className="
                  group flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 
                  rounded-lg bg-white/95 hover:bg-white text-emerald-700 
                  font-semibold text-sm sm:text-base
                  shadow-xl shadow-black/20
                  transition-all duration-300
                  hover:gap-3 hover:shadow-2xl hover:shadow-black/30
                ">
                  查看详情
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              <Link href="/announcements">
                <button className="
                  hidden sm:flex items-center gap-2 px-4 py-2.5
                  rounded-lg bg-white/10 hover:bg-white/20 text-white
                  border border-white/30 text-sm
                  backdrop-blur-sm transition-all duration-300
                ">
                  更多公告
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {announcements.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={`
                absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30
                w-10 h-10 sm:w-12 sm:h-12 rounded-full
                flex items-center justify-center
                backdrop-blur-md bg-black/30 hover:bg-black/50 
                border border-white/20 hover:border-white/40
                text-white transition-all duration-300
                hover:scale-110 hover:shadow-lg
                ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'}
              `}
              aria-label="上一条"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            
            <button
              onClick={goToNextBtn}
              className={`
                absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30
                w-10 h-10 sm:w-12 sm:h-12 rounded-full
                flex items-center justify-center
                backdrop-blur-md bg-black/30 hover:bg-black/50 
                border border-white/20 hover:border-white/40
                text-white transition-all duration-300
                hover:scale-110 hover:shadow-lg
                ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'}
              `}
              aria-label="下一条"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Bottom Progress Bar */}
        {announcements.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-100 ease-linear"
              style={{ width: `${((currentIndex + (isPaused || isHovered ? progressPercent / 100 : progressPercent / 100)) / announcements.length) * 100 + (progressPercent / 100) * (100 / announcements.length)}%` }}
            />
          </div>
        )}

        {/* Dot Indicators */}
        {announcements.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(e, index)}
                className={`
                  rounded-full transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1 focus:ring-offset-black/50
                  ${index === currentIndex 
                    ? 'w-8 h-2.5 bg-white shadow-lg' 
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                  }
                `}
                aria-label={`跳转到第 ${index + 1} 条公告`}
              />
            ))}
          </div>
        )}

        {/* Mobile: Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2 sm:hidden">
          <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
            <div className="text-white/80 text-xs truncate max-w-[60%]">
              {currentAnnouncement.title}
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <span className="font-medium">{currentIndex + 1}</span>
              <span>/</span>
              <span>{announcements.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Touch Area for Navigation */}
      <div className="sm:hidden absolute inset-0 z-25 flex">
        <div className="w-1/3 h-full" onClick={goToPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={goToNextBtn} />
      </div>
    </div>
  );
}
