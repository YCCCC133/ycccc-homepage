'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FileText,
  PenTool,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Printer,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const documentTypes = [
  {
    id: 'complaint',
    name: '民事起诉状',
    description: '用于向人民法院提起民事诉讼',
    icon: FileText,
  },
  {
    id: 'support',
    name: '支持起诉申请书',
    description: '申请检察机关支持起诉',
    icon: FileText,
  },
  {
    id: 'legal_aid',
    name: '法律援助申请书',
    description: '申请免费法律援助服务',
    icon: FileText,
  },
];

const formSchema = z.object({
  plaintiffName: z.string().min(2, '请输入姓名'),
  plaintiffIdCard: z.string().length(18, '请输入正确的身份证号'),
  plaintiffPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  plaintiffAddress: z.string().min(5, '请输入详细地址'),
  
  defendantName: z.string().min(2, '请输入被告/被申请人名称'),
  defendantAddress: z.string().min(5, '请输入地址'),
  defendantPhone: z.string().optional(),
  
  claim: z.string().min(10, '请详细描述诉讼请求'),
  facts: z.string().min(20, '请详细描述事实和理由'),
  evidence: z.string().min(5, '请列出证据清单'),
});

type FormData = z.infer<typeof formSchema>;

export default function DocumentPage() {
  const [selectedDoc, setSelectedDoc] = useState('complaint');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plaintiffName: '',
      plaintiffIdCard: '',
      plaintiffPhone: '',
      plaintiffAddress: '',
      defendantName: '',
      defendantAddress: '',
      defendantPhone: '',
      claim: '',
      facts: '',
      evidence: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    // Simulate document generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Generate document content
    const docContent = generateDocument(selectedDoc, data);
    setGeneratedDoc(docContent);
    setIsGenerating(false);
  }

  function generateDocument(type: string, data: FormData): string {
    const templates: Record<string, string> = {
      complaint: `
民 事 起 诉 状

原告：${data.plaintiffName}，男/女，身份证号：${data.plaintiffIdCard}
住所：${data.plaintiffAddress}
联系电话：${data.plaintiffPhone}

被告：${data.defendantName}
住所：${data.defendantAddress}
${data.defendantPhone ? `联系电话：${data.defendantPhone}` : ''}

诉讼请求：
${data.claim}

事实和理由：
${data.facts}

证据和证据来源：
${data.evidence}

此致
北京市西城区人民法院

                                        起诉人：${data.plaintiffName}
                                        ${new Date().toLocaleDateString('zh-CN')}

附：
1. 本起诉状副本1份
2. 证据材料复印件1套
`,
      support: `
支持起诉申请书

申请人：${data.plaintiffName}，男/女，身份证号：${data.plaintiffIdCard}
住所：${data.plaintiffAddress}
联系电话：${data.plaintiffPhone}

被申请人：${data.defendantName}
住所：${data.defendantAddress}
${data.defendantPhone ? `联系电话：${data.defendantPhone}` : ''}

申请事项：
请求贵院支持申请人对被申请人提起的民事诉讼。

事实和理由：
${data.facts}

申请依据：
根据《中华人民共和国民事诉讼法》第十五条规定："机关、社会团体、企业事业单位对损害国家、集体或者个人民事权益的行为，可以支持受损害的单位或者个人向人民法院起诉。"

证据材料：
${data.evidence}

此致
北京市西城区人民检察院

                                        申请人：${data.plaintiffName}
                                        ${new Date().toLocaleDateString('zh-CN')}
`,
      legal_aid: `
法律援助申请书

申请人：${data.plaintiffName}，男/女，身份证号：${data.plaintiffIdCard}
住所：${data.plaintiffAddress}
联系电话：${data.plaintiffPhone}

申请事项：
申请法律援助，请求指派律师为申请人提供法律帮助。

案件概况：
${data.facts}

法律援助理由：
申请人系农民工，因被申请人${data.defendantName}拖欠劳动报酬，导致经济困难，无力支付律师费用。根据《法律援助条例》第十条规定，公民对需要代理的民事、行政诉讼事项，因经济困难没有委托代理人的，可以向法律援助机构申请法律援助。

所需法律援助：
${data.claim}

现有证据：
${data.evidence}

此致
北京市西城区法律援助中心

                                        申请人：${data.plaintiffName}
                                        ${new Date().toLocaleDateString('zh-CN')}
`,
    };

    return templates[type] || templates.complaint;
  }

  const copyToClipboard = () => {
    if (generatedDoc) {
      navigator.clipboard.writeText(generatedDoc);
    }
  };

  const printDocument = () => {
    if (generatedDoc) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>打印文书</title></head>
            <body style="font-family: 'SimSun', serif; padding: 40px; line-height: 1.8;">
              <pre style="white-space: pre-wrap; font-size: 14px;">${generatedDoc}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">法律文书生成</h1>
        <p className="text-muted-foreground">
          一键生成起诉状、支持起诉书等法律文书，降低维权门槛
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side - Document Selection & Form */}
        <div className="lg:col-span-2">
          {/* Document Type Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                选择文书类型
              </CardTitle>
              <CardDescription>
                请根据您的需求选择要生成的法律文书类型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {documentTypes.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoc(doc.id);
                      setGeneratedDoc(null);
                    }}
                    className={`flex flex-col items-start rounded-lg border p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedDoc === doc.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <doc.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.description}
                    </div>
                    {selectedDoc === doc.id && (
                      <Badge className="mt-2" variant="secondary">
                        已选择
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Plaintiff Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">原告/申请人信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="plaintiffName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="plaintiffPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>联系电话 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入手机号码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="plaintiffIdCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>身份证号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入18位身份证号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plaintiffAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所地址 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入详细地址" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Defendant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">被告/被申请人信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="defendantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入被告名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="defendantAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>地址 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入地址" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defendantPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>联系电话</FormLabel>
                          <FormControl>
                            <Input placeholder="选填" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Case Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">案件详情</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="claim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>诉讼请求/申请事项 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例如：1. 判令被告支付拖欠工资XXX元；2. 判令被告支付经济补偿金XXX元；3. 本案诉讼费用由被告承担。"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事实和理由 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请详细描述案件事实经过、入职时间、工作内容、欠薪情况等..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>证据清单 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例如：1. 劳动合同复印件；2. 工资条/银行转账记录；3. 考勤记录；4. 工作证..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <span className="animate-pulse">生成中...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="mr-2 h-4 w-4" />
                    生成文书
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Side - Preview & Tips */}
        <div className="space-y-6">
          {/* Tips Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-primary" />
                温馨提示
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 文书内容仅供参考，建议咨询专业律师</p>
              <p>• 请确保填写信息真实准确</p>
              <p>• 提交前请仔细核对各项内容</p>
              <p>• 如有疑问可拨打12345热线咨询</p>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {generatedDoc && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    文书已生成
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      复制
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={printDocument}
                    >
                      <Printer className="mr-1 h-3 w-3" />
                      打印
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList className="w-full">
                    <TabsTrigger value="preview" className="flex-1">
                      <Eye className="mr-1 h-3 w-3" />
                      预览
                    </TabsTrigger>
                    <TabsTrigger value="download" className="flex-1">
                      <Download className="mr-1 h-3 w-3" />
                      下载
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview">
                    <div className="mt-4 max-h-[500px] overflow-auto rounded-lg border bg-white p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {generatedDoc}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="download">
                    <div className="mt-4 space-y-3">
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        下载 Word 格式
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        下载 PDF 格式
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
