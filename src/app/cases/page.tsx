'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Case {
  id: string;
  type: '线索' | '申请';
  status: 'pending' | 'processing' | 'completed';
  statusText: string;
  title: string;
  submitDate: string;
  updateDate: string;
  content: string;
}

const mockCases: Case[] = [
  {
    id: 'XC20250115001',
    type: '线索',
    status: 'processing',
    statusText: '处理中',
    title: '某建筑公司拖欠工资',
    submitDate: '2025-01-15',
    updateDate: '2025-01-17',
    content: '涉及金额：45,000元 | 欠薪月数：3个月',
  },
  {
    id: 'SQ20250112001',
    type: '申请',
    status: 'pending',
    statusText: '待审核',
    title: '支持起诉申请',
    submitDate: '2025-01-12',
    updateDate: '2025-01-12',
    content: '申请类型：检察机关支持起诉',
  },
  {
    id: 'XC20250108001',
    type: '线索',
    status: 'completed',
    statusText: '已办结',
    title: '某餐饮公司欠薪纠纷',
    submitDate: '2025-01-08',
    updateDate: '2025-01-15',
    content: '涉及金额：12,000元 | 已成功追回',
  },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

const statusIcons = {
  pending: Clock,
  processing: AlertCircle,
  completed: CheckCircle2,
};

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cases] = useState<Case[]>(mockCases);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSearch = () => {
    // In real app, this would make an API call
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">案件查询</h1>
        <p className="text-muted-foreground">
          实时追踪案件进度，掌握维权动态，透明高效
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side - Search & Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 md:top-32">
            <CardHeader>
              <CardTitle className="text-lg">查询条件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">案件编号/手机号</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="请输入案件编号或手机号"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">状态筛选</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="processing">处理中</SelectItem>
                    <SelectItem value="completed">已办结</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">总案件数</span>
                  <span className="font-medium">{cases.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">处理中</span>
                  <span className="font-medium text-blue-600">
                    {cases.filter((c) => c.status === 'processing').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">已完成</span>
                  <span className="font-medium text-green-600">
                    {cases.filter((c) => c.status === 'completed').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Case List */}
        <div className="lg:col-span-2">
          {/* Case List */}
          {filteredCases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">暂无案件记录</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  您还没有提交任何案件，立即开始维权吧
                </p>
                <Link href="/report">
                  <Button className="gap-2">
                    <FileText className="h-4 w-4" />
                    立即填报线索
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((caseItem) => {
                const StatusIcon = statusIcons[caseItem.status];
                return (
                  <Card
                    key={caseItem.id}
                    className={`cursor-pointer transition-all hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedCase?.id === caseItem.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => setSelectedCase(caseItem)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedCase(caseItem)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline">{caseItem.type}</Badge>
                            <Badge className={statusColors[caseItem.status]}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {caseItem.statusText}
                            </Badge>
                          </div>
                          <h3 className="mb-1 font-medium">{caseItem.title}</h3>
                          <p className="mb-2 text-sm text-muted-foreground">
                            {caseItem.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              编号：{caseItem.id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              提交：{caseItem.submitDate}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Case Detail */}
          {selectedCase && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    案件详情
                  </span>
                  <Badge className={statusColors[selectedCase.status]}>
                    {selectedCase.statusText}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">案件编号</div>
                    <div className="font-mono font-medium">{selectedCase.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">案件类型</div>
                    <div className="font-medium">{selectedCase.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">提交时间</div>
                    <div className="font-medium">{selectedCase.submitDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">更新时间</div>
                    <div className="font-medium">{selectedCase.updateDate}</div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="mb-4 font-medium">办理进度</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">已提交申请</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCase.submitDate} 14:30
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">审核通过，已受理</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCase.updateDate} 09:15
                        </div>
                      </div>
                    </div>
                    {selectedCase.status === 'completed' && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">案件办结</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedCase.updateDate} 16:45
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">需要帮助？</div>
                      <div className="text-sm text-muted-foreground">
                        如有疑问，请拨打 12345 政务服务热线或联系案件承办人
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
