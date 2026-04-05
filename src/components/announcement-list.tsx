'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  category: string;
  created_at: string;
}

export function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/announcements?limit=5&published_only=true');
        const data = await response.json();
        if (data.success) {
          setAnnouncements(data.data);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '通知':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '指南':
        return 'bg-green-50 text-green-700 border-green-200';
      case '案例':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            新闻公告
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-5 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            新闻公告
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">暂无公告</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          新闻公告
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className={`mb-2 text-xs ${getCategoryColor(announcement.category)}`}>
                  {announcement.category}
                </Badge>
                <h4 className="mb-1 font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {announcement.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatDate(announcement.created_at)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </Link>
          ))}
        </div>
        <Link href="/announcements">
          <Button variant="link" className="mt-4 w-full">
            查看全部公告
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
