'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Shield, ChevronDown, FileText } from 'lucide-react';

interface PolicyPopupProps {
  onAccept?: () => void;
}

export default function PolicyPopup({ onAccept }: PolicyPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查是否已同意
    const accepted = localStorage.getItem('policy_accepted');
    if (!accepted) {
      // 延迟显示，让页面先加载
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setHasAccepted(true);
    }
  }, []);

  // 如果未挂载或已同意，不显示任何内容
  if (!mounted || hasAccepted) return null;

  const handleAccept = () => {
    localStorage.setItem('policy_accepted', 'true');
    localStorage.setItem('policy_accepted_at', new Date().toISOString());
    setHasAccepted(true);
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    // 关闭浮窗但提示仍需同意
    setIsVisible(false);
    // 3秒后重新显示
    setTimeout(() => setIsVisible(true), 3000);
  };

  return (
    <>
      {/* 遮罩层 */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] animate-in fade-in duration-300"
          onClick={() => {}}
        />
      )}
      
      {/* 浮窗容器 */}
      <div
        className={`
          fixed bottom-4 left-4 z-[9999] w-[360px] max-w-[calc(100vw-32px)]
          transition-all duration-500 ease-out
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
        {/* 主卡片 */}
        <div className="relative bg-white rounded-2xl shadow-2xl shadow-emerald-500/20 overflow-hidden border border-emerald-100/50">
          {/* 顶部渐变装饰条 */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          
          {/* 毛玻璃背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
          
          {/* 内容区域 */}
          <div className="relative p-5">
            {/* 标题 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* 图标 */}
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/30 rounded-xl blur-md" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/40">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    使用须知
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    请在使用前阅读
                  </p>
                </div>
              </div>
              <button
                onClick={handleDecline}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 展开/收起按钮 */}
            {!isExpanded ? (
              <>
                {/* 摘要内容 */}
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    欢迎使用<span className="font-semibold text-emerald-600">护薪平台</span>。为保障您的合法权益，请在提交线索前阅读并同意：
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      用户协议
                    </button>
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100 transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      隐私政策
                    </button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    点击上方查看完整协议内容
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecline}
                    className="flex-1 text-xs h-9 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    稍后再说
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 text-xs h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                  >
                    我已知晓并同意
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* 完整协议内容 */}
                <div className="max-h-[280px] overflow-y-auto pr-2 mb-4 scrollbar-thin">
                  {/* 用户协议 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      用户协议
                    </h4>
                    <div className="text-xs text-muted-foreground/90 leading-relaxed space-y-2 pl-6">
                      <p>1. <strong>真实申报义务：</strong>您承诺提供的所有信息均真实、准确、完整，如有虚假愿承担相应法律责任。</p>
                      <p>2. <strong>信息使用授权：</strong>您同意我们将您的信息用于支持起诉、法律援助等公益服务。</p>
                      <p>3. <strong>隐私保护承诺：</strong>我们承诺妥善保管您的个人信息，不向无关第三方透露。</p>
                      <p>4. <strong>服务免责说明：</strong>本平台提供法律信息参考，不构成正式法律意见。</p>
                    </div>
                  </div>

                  {/* 隐私政策 */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      隐私政策
                    </h4>
                    <div className="text-xs text-muted-foreground/90 leading-relaxed space-y-2 pl-6">
                      <p>1. <strong>信息收集范围：</strong>我们仅收集服务所必需的个人信息，包括姓名、联系方式、案件相关情况等。</p>
                      <p>2. <strong>信息使用目的：</strong>您的信息将仅用于为您提供法律服务，不会用于商业推广。</p>
                      <p>3. <strong>信息安全保障：</strong>我们采用加密存储、访问控制等技术手段保护您的信息安全。</p>
                      <p>4. <strong>信息查询权利：</strong>您有权查询、更正、删除您的个人信息，请联系平台客服。</p>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 text-xs h-9 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="h-3 w-3 mr-1 rotate-180" />
                    收起
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 text-xs h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
                  >
                    我已阅读并同意
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* 底部装饰 */}
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
        </div>
      </div>
    </>
  );
}
