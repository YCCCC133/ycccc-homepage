'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementDetailPage() {
  const params = useParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const response = await fetch(`/api/announcements/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setAnnouncement(data.data);
        } else {
          setError(data.error || '公告不存在');
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
      <div className="mx-auto max-w-4xl bg-background px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="mx-auto max-w-4xl bg-background px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">{error || '公告不存在'}</p>
            <Link href="/announcements">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回公告列表
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl bg-background px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/announcements">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回公告列表
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="space-y-4">
            <Badge variant="outline" className={getCategoryColor(announcement.category)}>
              {announcement.category}
            </Badge>
            <CardTitle className="text-2xl">{announcement.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(announcement.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {announcement.category}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          <div className="prose prose-sm max-w-none">
            {announcement.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
