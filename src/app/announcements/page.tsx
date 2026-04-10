'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, User, Loader2, AlertCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAnnouncementList,
  AnnouncementListItem,
  formatAnnouncementDate,
} from '@/lib/api/announcements';

const CATEGORIES = ['全部', '通知', '公告', '指南', '案例', '警告'];

export default function NewsPage() {
  const [featuredNews, setFeaturedNews] = useState<AnnouncementListItem | null>(null);
  const [secondaryNews, setSecondaryNews] = useState<AnnouncementListItem[]>([]);
  const [allNews, setAllNews] = useState<AnnouncementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const params: Parameters<typeof getAnnouncementList>[0] = {
        limit: 21,
        offset: 0,
        published_only: true,
        sortBy: 'is_top',
        sortOrder: 'DESC',
      };

      if (selectedCategory !== '全部') {
        params.category = selectedCategory;
      }

      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const response = await getAnnouncementList(params);

      if (response.success && response.data) {
        const data = response.data;
        
        // 第一条作为主新闻（优先置顶或带图片的）
        const mainIndex = data.findIndex(n => n.is_top || n.image_url) ?? 0;
        const main = mainIndex >= 0 ? data[mainIndex] : data[0];
        setFeaturedNews(main || null);

        // 剩余的作为次级新闻
        const remaining = data.filter(n => n.id !== main?.id);
        setSecondaryNews(remaining.slice(0, 4));
        setAllNews(remaining.slice(4));

        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('获取新闻失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchKeyword]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

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

  const getCategoryBgColor = (category: string) => {
    const colorMap: Record<string, string> = {
      '通知': 'bg-blue-50 text-blue-700 border-blue-200',
      '指南': 'bg-green-50 text-green-700 border-green-200',
      '案例': 'bg-amber-50 text-amber-700 border-amber-200',
      '公告': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      '警告': 'bg-red-50 text-red-700 border-red-200',
    };
    return colorMap[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">新闻资讯</h1>
          <p className="text-emerald-100/80 text-lg">护薪平台最新动态与资讯</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索新闻..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : (
          <>
            {/* Featured News (BBC Style) */}
            {featuredNews && !searchKeyword && selectedCategory === '全部' && (
              <div className="mb-10">
                {/* Main Featured Article */}
                <Link href={`/announcements/${featuredNews.id}`} className="group block">
                  <div className="grid md:grid-cols-2 gap-6 bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    {/* Image */}
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden bg-gray-100">
                      {featuredNews.image_url ? (
                        <Image
                          src={featuredNews.image_url}
                          alt={featuredNews.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <div className="text-center text-emerald-600">
                            <div className="text-4xl font-bold">{featuredNews.title.charAt(0)}</div>
                          </div>
                        </div>
                      )}
                      {/* Category Badge on Image */}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(featuredNews.category)}`}>
                          {featuredNews.category}
                        </span>
                      </div>
                      {featuredNews.is_top && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white">
                            置顶
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-4 leading-tight">
                        {featuredNews.title}
                      </h2>
                      
                      {featuredNews.summary && (
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {featuredNews.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatAnnouncementDate(featuredNews.created_at)}</span>
                        </div>
                        {featuredNews.author && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>{featuredNews.author}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-emerald-600 font-medium">
                        阅读全文
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Secondary News Grid */}
            {secondaryNews.length > 0 && !searchKeyword && selectedCategory === '全部' && (
              <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
                  最新资讯
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {secondaryNews.map((news) => (
                    <Link key={news.id} href={`/announcements/${news.id}`} className="group">
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Card Image */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                          {news.image_url ? (
                            <Image
                              src={news.image_url}
                              alt={news.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                              <div className="text-3xl font-bold text-emerald-200">
                                {news.title.charAt(0)}
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <Badge variant="outline" className={`text-xs mb-2 ${getCategoryBgColor(news.category)}`}>
                            {news.category}
                          </Badge>
                          <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2 leading-snug">
                            {news.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatAnnouncementDate(news.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All News List */}
            {(searchKeyword || selectedCategory !== '全部' || allNews.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
                    {searchKeyword ? `搜索结果: "${searchKeyword}"` : '全部新闻'}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (共 {pagination.total} 条)
                    </span>
                  </h3>
                </div>

                {allNews.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="rounded-full bg-muted p-4">
                      <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground">
                      {searchKeyword ? '未找到相关新闻' : '暂无新闻'}
                    </p>
                    {searchKeyword && (
                      <Button variant="link" onClick={() => setSearchKeyword('')} className="text-emerald-600">
                        清除搜索
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(searchKeyword || selectedCategory !== '全部' ? secondaryNews.concat(allNews) : allNews).map((news) => (
                      <Link key={news.id} href={`/announcements/${news.id}`} className="group">
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                            {news.image_url ? (
                              <Image
                                src={news.image_url}
                                alt={news.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                                <div className="text-3xl font-bold text-emerald-200">
                                  {news.title.charAt(0)}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(news.category)}`}>
                                {news.category}
                              </span>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <h4 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3 leading-snug">
                              {news.title}
                            </h4>
                            {news.summary && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {news.summary}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                <span>{formatAnnouncementDate(news.created_at)}</span>
                              </div>
                              {news.is_top && (
                                <span className="text-amber-600 font-medium">置顶</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Load More */}
            {pagination.hasMore && (
              <div className="flex justify-center mt-10">
                <Button variant="outline" size="lg" className="px-8">
                  加载更多
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
