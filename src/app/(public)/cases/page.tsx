'use client';

import { useState, useEffect } from 'react';
import {
  Search, Clock, CheckCircle2, AlertCircle, Calendar, ChevronRight,
  FileText, X, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CaseItem {
  id: number;
  case_number: string;
  type: '线索' | '申请' | '案件';
  status: 'pending' | 'processing' | 'completed';
  title: string;
  amount: string;
  submitDate: string;
  content: string;
}

const statusConfig = {
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCases(data.data.map((c: Record<string, unknown>) => ({
          id: c.id as number,
          case_number: c.case_number as string,
          type: '案件' as const,
          status: c.status as 'pending' | 'processing' | 'completed',
          title: `${c.plaintiff_name} vs ${c.defendant_name}`,
          amount: `¥${Number(c.amount || 0).toLocaleString()}`,
          submitDate: c.filing_date ? new Date(c.filing_date as string).toLocaleDateString('zh-CN') : '-',
          content: `${c.case_type} | 金额：${Number(c.amount || 0).toLocaleString()}元`,
        })));
      }
    } catch (error) {
      console.error('获取案件数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter((c) =>
    c.case_number.includes(searchQuery) || c.title.includes(searchQuery)
  );

  const pendingCases = filteredCases.filter((c) => c.status === 'pending');
  const processingCases = filteredCases.filter((c) => c.status === 'processing');
  const completedCases = filteredCases.filter((c) => c.status === 'completed');

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">案件查询</h1>
          <p className="text-sm text-stone-600">输入线索编号或案件号查询办理进度</p>
        </div>

        {/* Search */}
        <div className="
          p-4 sm:p-6
          rounded-2xl
          bg-white/70 backdrop-blur-lg
          border border-white/60
          shadow-lg
          mb-6
        ">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="输入线索编号或案件号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-white/80 border-stone-200/60"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl bg-white/70 backdrop-blur-lg border border-white/60 p-1 mb-6">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              全部 ({filteredCases.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              待处理 ({pendingCases.length})
            </TabsTrigger>
            <TabsTrigger value="processing" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              处理中 ({processingCases.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              已完成 ({completedCases.length})
            </TabsTrigger>
          </TabsList>

          {['all', 'pending', 'processing', 'completed'].map((tab) => {
            const caseList = tab === 'all' ? filteredCases 
              : tab === 'pending' ? pendingCases 
              : tab === 'processing' ? processingCases 
              : completedCases;
            return (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : caseList.length === 0 ? (
                  <div className="text-center py-20">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p className="text-stone-500">暂无案件记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseList.map((c) => {
                      const config = statusConfig[c.status];
                      const StatusIcon = config.icon;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          className="
                            w-full p-4 sm:p-5
                            rounded-2xl
                            bg-white/70 backdrop-blur-lg
                            border border-white/60
                            hover:bg-white/90 hover:border-emerald-200
                            transition-all duration-200
                            text-left
                          "
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-stone-500">{c.case_number}</span>
                                <Badge className={`${config.color} border text-xs`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <h3 className="font-medium text-stone-800 truncate">{c.title}</h3>
                              <p className="text-sm text-stone-500 mt-1">{c.content}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {c.submitDate}
                                </span>
                                <span>{c.amount}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCase(null)}>
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">案件详情</h2>
                  <button onClick={() => setSelectedCase(null)} className="p-2 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-stone-500 mb-1">案件编号</div>
                  <div className="font-mono font-medium text-stone-800">{selectedCase.case_number}</div>
                </div>
                <div>
                  <div className="text-sm text-stone-500 mb-1">案件标题</div>
                  <div className="font-medium text-stone-800">{selectedCase.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-stone-500 mb-1">案件类型</div>
                    <div className="text-stone-800">{selectedCase.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-stone-500 mb-1">涉案金额</div>
                    <div className="font-medium text-emerald-600">{selectedCase.amount}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-stone-500 mb-1">案件状态</div>
                  <Badge className={`${statusConfig[selectedCase.status].color} border`}>
                    {statusConfig[selectedCase.status].label}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-stone-500 mb-1">提交时间</div>
                  <div className="text-stone-800">{selectedCase.submitDate}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
