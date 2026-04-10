'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Pin, Megaphone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getAnnouncementList,
  AnnouncementListItem,
  formatAnnouncementDate,
} from '@/lib/api/announcements';

interface AnnouncementListProps {
  limit?: number;
  showViewAll?: boolean;
}

export function AnnouncementList({ limit = 5, showViewAll = true }: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAnnouncementList({
        limit,
        published_only: true,
        sortBy: 'is_top',
        sortOrder: 'DESC',
      });

      if (response.success && response.data) {
        setAnnouncements(response.data);
        setError(null);
      } else {
        setError('获取公告失败');
      }
    } catch (err) {
      console.error('获取公告失败:', err);
      setError('获取公告失败');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const getCategoryColor = (category: string) => {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-4 w-4 text-primary" />
          最新公告
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">暂无公告</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/announcements/${announcement.id}`}
                  className="flex items-start justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryColor(announcement.category)}`}
                      >
                        {announcement.category}
                      </Badge>
                      {announcement.is_top && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <Pin className="h-3 w-3 mr-0.5" />
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatAnnouncementDate(announcement.created_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </Link>
              ))}
            </div>

            {showViewAll && (
              <div className="pt-2 border-t border-border/50">
                <Link href="/announcements">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                    查看全部公告
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
