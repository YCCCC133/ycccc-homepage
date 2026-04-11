'use client';

import Link from 'next/link';
import {
  Heart,
  Users,
  FileText,
  CheckCircle2,
  Phone,
  Building2,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const services = [
  { title: '法律咨询', description: '免费提供法律问题咨询服务', icon: Phone },
  { title: '代写文书', description: '帮助起草起诉状等法律文书', icon: FileText },
  { title: '代理诉讼', description: '符合条件的案件可由律师代理', icon: Building2 },
  { title: '调解协调', description: '协助进行纠纷调解和协调', icon: Users },
];

const conditions = [
  '农民工等劳动者群体追讨欠薪',
  '家庭经济困难，无力支付律师费用',
  '有充分证据证明存在欠薪事实',
  '案件属于人民法院受理范围',
];

const process = [
  { step: '01', title: '提交申请', description: '在线填写法律援助申请表' },
  { step: '02', title: '材料审核', description: '工作人员审核申请材料' },
  { step: '03', title: '指派律师', description: '审核通过后指派援助律师' },
  { step: '04', title: '案件办理', description: '律师协助办理相关法律事务' },
];

export default function LegalAidPage() {
  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-amber-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">法律援助</h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
            为经济困难的劳动者提供免费法律服务，让正义不因贫困而缺席
          </p>
        </div>

        {/* 服务内容 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            服务内容
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="
                    p-4 rounded-2xl
                    bg-white/80 backdrop-blur-lg
                    border border-white/60
                    shadow-lg
                    text-center
                    hover:shadow-xl hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-1">{service.title}</h3>
                  <p className="text-xs text-stone-500">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 申请条件 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">申请条件</h2>
          <div className="
            p-5 sm:p-6
            rounded-2xl
            bg-white/80 backdrop-blur-lg
            border border-white/60
            shadow-lg
          ">
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="
                    w-6 h-6 rounded-full
                    bg-emerald-100
                    flex items-center justify-center
                    shrink-0
                    mt-0.5
                  ">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-stone-700">{condition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 申请流程 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">申请流程</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {process.map((item, index) => (
              <div
                key={item.step}
                className="
                  relative
                  p-5 rounded-2xl
                  bg-white/80 backdrop-blur-lg
                  border border-white/60
                  shadow-lg
                "
              >
                {/* 步骤编号 */}
                <div className="
                  absolute -top-3 left-4
                  px-3 py-1
                  rounded-lg
                  bg-gradient-to-r from-amber-400 to-amber-500
                  text-white
                  text-sm font-bold
                  shadow-md
                ">
                  {item.step}
                </div>
                
                {/* 连接线 */}
                {index < process.length - 1 && (
                  <div className="
                    hidden lg:block
                    absolute -right-2 top-1/2 -translate-y-1/2
                    w-4 h-0.5
                    bg-gradient-to-r from-amber-300 to-transparent
                  " />
                )}

                <h3 className="font-semibold text-stone-800 mt-2 mb-1">{item.title}</h3>
                <p className="text-xs text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 相关服务 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">相关服务</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/consult" className="group block">
              <div className="
                p-5 rounded-2xl
                bg-white/80 backdrop-blur-lg
                border border-white/60
                shadow-lg
                hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-200
              ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 group-hover:text-blue-600 transition-colors">智能咨询</h3>
                      <p className="text-xs text-stone-500">AI法律顾问解答疑问</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
            
            <Link href="/document" className="group block">
              <div className="
                p-5 rounded-2xl
                bg-white/80 backdrop-blur-lg
                border border-white/60
                shadow-lg
                hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-200
              ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 group-hover:text-purple-600 transition-colors">文书生成</h3>
                      <p className="text-xs text-stone-500">一键生成法律文书</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="
          p-8 sm:p-10
          rounded-3xl
          bg-gradient-to-br from-amber-50 to-amber-100/50
          border border-amber-200/50
          text-center
        ">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">立即申请法律援助</h2>
          <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto">
            如有需要，您可以直接提交法律援助申请，工作人员将尽快与您联系
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/apply">
              <Button className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30">
                在线申请
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="tel:12348">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-amber-200 bg-white/80 hover:bg-amber-50">
                <Phone className="w-4 h-4 mr-2" />
                拨打热线
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
