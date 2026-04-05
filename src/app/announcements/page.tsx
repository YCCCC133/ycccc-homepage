'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Announcement {
  id: number;
  title: string;
  category: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/announcements?limit=50&published_only=true');
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

  return (
    <div className="mx-auto max-w-4xl bg-background px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            新闻公告
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无公告</p>
          ) : (
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
                    <h4 className="mb-1 font-medium text-foreground group-hover:text-primary transition-colors">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
