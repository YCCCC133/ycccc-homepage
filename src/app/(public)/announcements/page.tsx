'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, User, Loader2, Search, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['全部', '通知', '公告', '指南', '案例', '警告'];

interface Announcement {
  id: number;
  title: string;
  summary?: string;
  category: string;
  is_top: boolean;
  image_url?: string;
  author?: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ published_only: 'true' });
      if (selectedCategory !== '全部') params.append('category', selectedCategory);
      if (searchKeyword.trim()) params.append('search', searchKeyword.trim());
      
      const res = await fetch(`/api/announcements?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchKeyword]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      '通知': { bg: 'bg-blue-100/80', text: 'text-blue-700' },
      '指南': { bg: 'bg-emerald-100/80', text: 'text-emerald-700' },
      '案例': { bg: 'bg-amber-100/80', text: 'text-amber-700' },
      '公告': { bg: 'bg-purple-100/80', text: 'text-purple-700' },
      '警告': { bg: 'bg-red-100/80', text: 'text-red-700' },
    };
    return styles[category] || { bg: 'bg-stone-100/80', text: 'text-stone-700' };
  };

  const featuredNews = announcements.find(n => n.is_top) || announcements[0];
  const secondaryNews = announcements.filter(n => n.id !== featuredNews?.id).slice(0, 4);
  const listNews = announcements.filter(n => !secondaryNews.includes(n) && n.id !== featuredNews?.id);

  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">新闻资讯</h1>
          <p className="text-sm text-stone-600">护薪平台最新动态与资讯</p>
        </div>

        {/* 搜索与筛选 */}
        <div className="
          p-4 sm:p-6
          rounded-2xl
          bg-white/70 backdrop-blur-lg
          border border-white/60
          shadow-lg
          mb-6
        ">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* 分类标签 */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                    ${selectedCategory === cat
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white/80 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600 border border-stone-200/50'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 搜索框 */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="搜索公告..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-11 h-11 rounded-xl bg-white/80 border-stone-200/60 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
            <p className="text-stone-500">加载中...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">暂无公告</p>
          </div>
        ) : (
          <>
            {/* 主图文章 */}
            {featuredNews && !searchKeyword && selectedCategory === '全部' && (
              <div className="mb-8">
                <Link href={`/announcements/${featuredNews.id}`} className="group block">
                  <div className="
                    grid md:grid-cols-2 gap-6
                    rounded-3xl
                    bg-white/80 backdrop-blur-lg
                    border border-white/60
                    shadow-lg shadow-stone-200/40
                    overflow-hidden
                    hover:shadow-xl hover:shadow-stone-300/50
                    hover:-translate-y-0.5
                    transition-all duration-200
                  ">
                    {/* 图片区域 */}
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] overflow-hidden">
                      {featuredNews.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featuredNews.image_url}
                          alt={featuredNews.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <span className="text-6xl font-bold text-emerald-300">
                            {featuredNews.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* 分类标签 */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getCategoryStyle(featuredNews.category).bg} ${getCategoryStyle(featuredNews.category).text} font-medium`}>
                          {featuredNews.category}
                        </Badge>
                      </div>
                      {featuredNews.is_top && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-amber-100 text-amber-700 font-medium">
                            <Pin className="w-3 h-3 mr-1" />置顶
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="
                        text-xl md:text-2xl
                        font-bold
                        text-stone-800
                        group-hover:text-emerald-700
                        transition-colors
                        mb-3
                        leading-snug
                      ">
                        {featuredNews.title}
                      </h2>
                      
                      {featuredNews.summary && (
                        <p className="text-stone-600 mb-4 line-clamp-3 leading-relaxed">
                          {featuredNews.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-stone-500 mt-auto">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(featuredNews.created_at).toLocaleDateString('zh-CN')}
                        </span>
                        {featuredNews.author && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {featuredNews.author}
                          </span>
                        )}
                      </div>

                      <div className="
                        mt-5
                        flex items-center gap-2
                        text-emerald-600
                        font-medium
                        group-hover:gap-3
                        transition-all
                      ">
                        <span>阅读全文</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* 次级文章网格 */}
            {secondaryNews.length > 0 && !searchKeyword && selectedCategory === '全部' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {secondaryNews.map((item) => (
                  <Link key={item.id} href={`/announcements/${item.id}`} className="group">
                    <div className="
                      p-4 sm:p-5
                      rounded-2xl
                      bg-white/70 backdrop-blur-lg
                      border border-white/60
                      shadow-lg
                      hover:shadow-xl
                      hover:-translate-y-0.5
                      transition-all duration-200
                    ">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getCategoryStyle(item.category).bg} ${getCategoryStyle(item.category).text} text-xs font-medium`}>
                              {item.category}
                            </Badge>
                            {item.is_top && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">
                                置顶
                              </Badge>
                            )}
                          </div>
                          <h3 className="
                            font-semibold
                            text-stone-800
                            group-hover:text-emerald-700
                            transition-colors
                            line-clamp-2
                            leading-snug
                          ">
                            {item.title}
                          </h3>
                          <p className="text-sm text-stone-500 mt-2 line-clamp-1">
                            {item.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString('zh-CN')}
                            </span>
                            {item.author && (
                              <span>{item.author}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 文章列表 */}
            <div className="space-y-3">
              {listNews.map((item) => (
                <Link key={item.id} href={`/announcements/${item.id}`} className="group block">
                  <div className="
                    p-4 sm:p-5
                    rounded-2xl
                    bg-white/70 backdrop-blur-lg
                    border border-white/60
                    shadow-lg
                    hover:shadow-xl hover:bg-white/90
                    hover:-translate-y-0.5
                    transition-all duration-200
                  ">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={`${getCategoryStyle(item.category).bg} ${getCategoryStyle(item.category).text} text-xs font-medium`}>
                            {item.category}
                          </Badge>
                          {item.is_top && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">
                              置顶
                            </Badge>
                          )}
                        </div>
                        <h3 className="
                          font-medium
                          text-stone-800
                          group-hover:text-emerald-700
                          transition-colors
                          truncate
                        ">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-stone-500">
                        <span className="hidden sm:block">
                          {new Date(item.created_at).toLocaleDateString('zh-CN')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
