'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Tag, Loader2, User, Pin, AlertCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getAnnouncementDetail,
  Announcement,
  formatAnnouncementDate,
  isRichText,
} from '@/lib/api/announcements';

export default function AnnouncementDetailPage() {
  const params = useParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const response = await getAnnouncementDetail(Number(params.id));
        if (response.success && response.data) {
          setAnnouncement(response.data);
        } else {
          setError(response.error || '公告不存在');
        }
      } catch {
        setError('加载公告失败');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchAnnouncement();
    }
  }, [params.id]);

  // Extract images from rich text content
  const extractImages = (content: string): string[] => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1] && !match[1].startsWith('data:')) {
        images.push(match[1]);
      }
    }
    return images;
  };

  const openLightbox = (src: string) => {
    setLightboxImage(src);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage('');
  };

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">{error || '公告不存在'}</p>
              <Link href="/announcements">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回新闻列表
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isContentRichText = isRichText(announcement.content);
  const contentImages = extractImages(announcement.content);
  const hasTopImage = !!announcement.image_url;

  // Process rich text to add lightbox to images
  const processedContent = isContentRichText 
    ? announcement.content.replace(
        /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi,
        (match, before, src, after) => {
          if (src.startsWith('data:')) return match;
          return `<img${before}src="${src}"${after} onclick="window.openLightbox && window.openLightbox('${src}')" style="cursor:pointer" />`;
        }
      )
    : '';

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      '通知': 'bg-blue-600 text-white',
      '指南': 'bg-green-600 text-white',
      '案例': 'bg-amber-600 text-white',
      '公告': 'bg-emerald-600 text-white',
      '警告': 'bg-red-600 text-white',
    };
    return colorMap[category] || 'bg-gray-600 text-white';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/announcements" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回新闻列表
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8">
        {/* Top Image */}
        {hasTopImage && (
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden mb-8 bg-gray-100 cursor-pointer group" onClick={() => openLightbox(announcement.image_url!)}>
            <Image
              src={announcement.image_url!}
              alt={announcement.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(announcement.category)}`}>
              {announcement.category}
            </span>
            {announcement.is_top && (
              <Badge className="bg-amber-500 text-white px-3 py-1">
                <Pin className="h-3 w-3 mr-1" />
                置顶
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
            {announcement.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatAnnouncementDate(announcement.created_at)}</span>
            </div>
            {announcement.author && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{announcement.author}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              <span>{announcement.category}</span>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto text-gray-400 hover:text-gray-600">
              <Share2 className="h-4 w-4 mr-1" />
              分享
            </Button>
          </div>
        </header>

        {/* Summary */}
        {announcement.summary && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-8 border border-emerald-100">
            <p className="text-gray-700 leading-relaxed text-lg">
              {announcement.summary}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {isContentRichText ? (
            <div
              className="bg-white rounded-xl p-6 md:p-8 shadow-sm"
              dangerouslySetInnerHTML={{ __html: processedContent }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'IMG') {
                  openLightbox((target as HTMLImageElement).src);
                }
              }}
            />
          ) : (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-4">
              {announcement.content.split('\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                return (
                  <p key={index} className="text-gray-700 leading-relaxed text-lg">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {contentImages.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
              相关图片 ({contentImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {contentImages.map((src, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                  onClick={() => openLightbox(src)}
                >
                  <Image
                    src={src}
                    alt={`图片 ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/announcements">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回新闻列表
            </Button>
          </Link>
        </div>
      </article>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
            onClick={closeLightbox}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt="放大图片"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}

      {/* Global lightbox handler */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined') {
            window.openLightbox = ${openLightbox.toString().replace('setLightboxImage', 'window.setLightboxImage').replace('setLightboxOpen', 'window.setLightboxOpen')};
          }
        `
      }} />
    </div>
  );
}
