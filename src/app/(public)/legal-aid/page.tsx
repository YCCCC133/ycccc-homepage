'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Users,
  FileText,
  CheckCircle2,
  Phone,
  Building2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const services = [
  {
    title: '法律咨询',
    description: '免费提供法律问题咨询服务',
    icon: Phone,
  },
  {
    title: '代写文书',
    description: '帮助起草起诉状等法律文书',
    icon: FileText,
  },
  {
    title: '代理诉讼',
    description: '符合条件的案件可由律师代理',
    icon: Building2,
  },
  {
    title: '调解协调',
    description: '协助进行纠纷调解和协调',
    icon: Users,
  },
];

const conditions = [
  '农民工等劳动者群体追讨欠薪',
  '家庭经济困难，无力支付律师费用',
  '有充分证据证明存在欠薪事实',
  '案件属于人民法院受理范围',
];

const process = [
  {
    step: '1',
    title: '提交申请',
    description: '在线填写法律援助申请表',
  },
  {
    step: '2',
    title: '材料审核',
    description: '工作人员审核申请材料',
  },
  {
    step: '3',
    title: '指派律师',
    description: '审核通过后指派援助律师',
  },
  {
    step: '4',
    title: '案件办理',
    description: '律师协助办理相关法律事务',
  },
];

export default function LegalAidPage() {
  return (
    <div className="mx-auto max-w-5xl bg-background px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
          <Heart className="h-8 w-8 text-[var(--gold-foreground)]" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">法律援助</h1>
        <p className="mt-2 text-muted-foreground">
          为经济困难的劳动者提供免费法律服务
        </p>
      </div>

      {/* Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>援助服务内容</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.title}
                className="flex flex-col items-center rounded-lg border border-border/50 p-4 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-1 font-medium">{service.title}</h4>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>申请条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span className="text-sm">{condition}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>申请流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {process.map((item, index) => (
              <div key={item.step} className="relative">
                {index < process.length - 1 && (
                  <div className="absolute left-6 top-8 hidden h-0.5 w-full bg-border md:block" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <h4 className="mb-1 font-medium">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>所需材料</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              身份证或其他有效身份证明
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              经济困难证明（低保证、特困证等）
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              与申请事项相关的证据材料
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              法律援助申请表（可在平台在线填写）
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <Clock className="mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">准备好申请了吗？</h3>
          <p className="mb-4 text-muted-foreground">
            在线提交申请，工作人员将在3个工作日内联系您
          </p>
          <Link href="/apply">
            <Button className="gap-2">
              立即申请
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
