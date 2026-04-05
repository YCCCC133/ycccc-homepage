'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  MessageSquare,
  PenTool,
  Send,
  FolderOpen,
  HelpCircle,
  Phone,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const helpSections = [
  {
    title: '线索填报指南',
    icon: FileText,
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
    question: '欠薪多久可以申请维权？',
    answer: '根据法律规定，劳动报酬请求权的仲裁时效为一年。建议您在发现欠薪情况后尽快通过本平台进行线索填报，以免超过时效。',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl bg-background px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">使用帮助</h1>
        <p className="mt-2 text-muted-foreground">
          了解平台各项功能的使用方法
        </p>
      </div>

      {/* Help Sections */}
      <div className="mb-12 grid gap-6 md:grid-cols-2">
        {helpSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                {section.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                <h4 className="mb-2 font-medium text-foreground">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-primary/5">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <Phone className="mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">需要更多帮助？</h3>
          <p className="mb-4 text-muted-foreground">
            拨打12345政务服务热线，获取人工服务
          </p>
          <Link href="tel:12345">
            <Button className="gap-2">
              <Phone className="h-4 w-4" />
              拨打12345热线
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
