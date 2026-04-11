'use client';

import { BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface LegalReference {
  name: string;
  fullName: string;
  url: string;
}

interface LegalReferencesProps {
  references: LegalReference[];
  isStreaming?: boolean;
}

export function LegalReferences({ references, isStreaming }: LegalReferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!references || references.length === 0) {
    return null;
  }

  const visibleRefs = isExpanded ? references : references.slice(0, 3);
  const hasMore = references.length > 3;

  return (
    <div className="mt-2 not-prose">
      {/* 引用区容器 - 独立模块，不与气泡合并 */}
      <div className={cn(
        "relative rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white overflow-hidden",
        "shadow-sm",
        isStreaming && "opacity-70"
      )}>
        {/* 顶部装饰线 */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
        
        <div className="p-3">
          {/* 标题行 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10">
              <BookOpen className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">法律依据</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              {references.length} 条
            </span>
          </div>
          
          {/* 引用列表 */}
          <div className="space-y-1.5">
            {visibleRefs.map((ref, index) => (
              <a
                key={index}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg",
                  "bg-white/60 hover:bg-white border border-transparent hover:border-emerald-200/50",
                  "transition-all duration-200 group"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* 序号 */}
                  <span className="flex-shrink-0 w-4 h-4 rounded bg-emerald-100 text-[10px] font-semibold text-emerald-700 flex items-center justify-center">
                    {index + 1}
                  </span>
                  {/* 法条名称 */}
                  <span className="text-xs text-slate-700 truncate group-hover:text-emerald-700 transition-colors">
                    {ref.fullName}
                  </span>
                </div>
                {/* 外部链接图标 */}
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
          
          {/* 展开/收起按钮 */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center justify-center gap-1 w-full mt-2 py-1",
                "text-xs text-slate-500 hover:text-emerald-600 transition-colors"
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  查看更多 ({references.length - 3})
                </>
              )}
            </button>
          )}
        </div>
        
        {/* 底部提示 */}
        <div className="px-3 pb-2">
          <p className="text-[10px] text-slate-400">
            点击法条名称可查看法规全文
          </p>
        </div>
      </div>
    </div>
  );
}

export default LegalReferences;
