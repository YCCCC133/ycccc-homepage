'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  PenTool,
  Send,
  HelpCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const helpSections = [
  {
    title: '线索填报指南',
    icon: FileText,
    color: 'emerald',
    description: '了解如何正确填报欠薪线索',
    items: [
      '准备好个人身份证明材料',
      '收集欠薪相关证据（合同、工资条等）',
      '填写真实、详细的信息',
      '提交后可在案件查询中追踪进度',
    ],
  },
  {
    title: '智能咨询使用',
    icon: MessageSquare,
    color: 'blue',
    description: '获取AI智能法律建议',
    items: [
      '输入您的法律问题',
      'AI将基于法律法规给出建议',
      '可快速选择常见问题',
      '咨询记录可随时查看',
    ],
  },
  {
    title: '文书生成说明',
    icon: PenTool,
    color: 'purple',
    description: '一键生成法律文书',
    items: [
      '选择需要生成的文书类型',
      '填写相关当事人信息',
      '系统自动生成规范文书',
      '可下载或直接提交',
    ],
  },
  {
    title: '在线申请流程',
    icon: Send,
    color: 'amber',
    description: '提交支持起诉申请',
    items: [
      '选择申请类型（支持起诉/法律援助）',
      '填写申请人和被申请人信息',
      '上传相关证明材料',
      '等待审核结果',
    ],
  },
];

const faqs = [
  {
    question: '什么是检察支持起诉？',
    answer: '检察支持起诉是指人民检察院对损害国家、集体或者个人民事权益的行为，可以支持受损害的单位或者个人向人民法院起诉。对于农民工等弱势群体，检察机关可以提供法律支持，帮助维护合法权益。',
  },
  {
    question: '提交线索后多久能得到回复？',
    answer: '一般情况下，我们会在3-5个工作日内对您提交的线索进行初步审核，并通过短信或电话告知审核结果。如需补充材料，请及时配合提供。',
  },
  {
    question: '我的信息会被保密吗？',
    answer: '是的，您提交的所有信息都会严格保密。我们将按照相关法律法规保护您的个人隐私，未经您同意不会向第三方披露。',
  },
  {
    question: '需要支付费用吗？',
    answer: '本平台提供的所有服务均为免费。检察支持起诉、法律援助等都是国家提供的公益服务，不收取任何费用。',
  },
  {
    question: '如何查询案件进度？',
    answer: '您可以通过案件查询功能，使用线索编号查询案件的当前处理状态和进度。我们会及时更新案件状态，确保您随时了解案件进展。',
  },
  {
    question: '可以同时申请多项服务吗？',
    answer: '可以的。您可以根据实际需要同时使用多项服务，如先进行智能咨询了解权益，再填报线索、生成文书、提交申请等。各项服务相互独立，可根据需要组合使用。',
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredFaqs = searchKeyword
    ? faqs.filter(faq =>
        faq.question.includes(searchKeyword) || faq.answer.includes(searchKeyword)
      )
    : faqs;

  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">帮助中心</h1>
          <p className="text-sm text-stone-600">为您提供全方位的使用指南</p>
        </div>

        {/* 搜索 */}
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="搜索常见问题..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white/80 border-stone-200/60 focus:border-emerald-400 text-base"
            />
          </div>
        </div>

        {/* 功能指南 */}
        {!searchKeyword && (
          <>
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                功能使用指南
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {helpSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.title}
                      className="
                        p-5 rounded-2xl
                        bg-white/80 backdrop-blur-lg
                        border border-white/60
                        shadow-lg
                        hover:shadow-xl hover:-translate-y-0.5
                        transition-all duration-200
                      "
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          ${section.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                          ${section.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                          ${section.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                          ${section.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-800">{section.title}</h3>
                          <p className="text-xs text-stone-500">{section.description}</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-stone-600">
                            <span className="text-emerald-500 mt-0.5">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 快捷入口 */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-stone-800 mb-4">快速入口</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '线索填报', href: '/report', icon: FileText, color: 'emerald' },
                  { label: '智能咨询', href: '/consult', icon: MessageSquare, color: 'blue' },
                  { label: '文书生成', href: '/document', icon: PenTool, color: 'purple' },
                  { label: '在线申请', href: '/apply', icon: Send, color: 'amber' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="
                        p-4 rounded-2xl
                        bg-white/80 backdrop-blur-lg
                        border border-white/60
                        shadow-lg
                        text-center
                        hover:shadow-xl hover:-translate-y-0.5
                        transition-all duration-200
                        group
                      ">
                        <div className={`
                          w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center
                          ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : ''}
                          ${item.color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white' : ''}
                          ${item.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white' : ''}
                          ${item.color === 'amber' ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : ''}
                          transition-colors duration-200
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-stone-700">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">
            {searchKeyword ? `搜索结果 (${filteredFaqs.length})` : '常见问题'}
          </h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="
                  rounded-2xl
                  bg-white/80 backdrop-blur-lg
                  border border-white/60
                  shadow-lg
                  overflow-hidden
                "
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="
                    w-full px-5 py-4
                    flex items-center justify-between
                    text-left
                    hover:bg-stone-50/50
                    transition-colors
                  "
                >
                  <span className="font-medium text-stone-800 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4">
                    <div className="pt-2 border-t border-stone-200/40">
                      <p className="text-sm text-stone-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                <p className="text-stone-500">未找到相关问题</p>
              </div>
            )}
          </div>
        </div>

        {/* 联系客服 */}
        <div className="
          mt-10 p-6 sm:p-8
          rounded-3xl
          bg-gradient-to-br from-emerald-500 to-emerald-600
          text-white
          text-center
        ">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
            <Phone className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold mb-2">需要更多帮助？</h2>
          <p className="text-emerald-100 mb-4">我们的客服团队随时为您解答</p>
          <a
            href="tel:12348"
            className="
              inline-flex items-center gap-2
              px-6 py-3
              rounded-xl
              bg-white
              text-emerald-700
              font-medium
              hover:bg-emerald-50
              transition-colors
            "
          >
            <Phone className="w-5 h-5" />
            拨打 12348 法律服务热线
          </a>
        </div>
      </div>
    </div>
  );
}
