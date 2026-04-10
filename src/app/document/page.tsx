'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, CheckCircle, PlusCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TemplateField {
  name: string;
  type: string;
  options?: string[];
  required?: boolean;
}

interface Template {
  id: number;
  name: string;
  category: string;
  description?: string;
  fields: TemplateField[];
}

const categoryLabels: Record<string, string> = {
  '民事起诉状': '民事起诉状',
  '支持起诉': '支持起诉',
  '支付令': '支付令申请',
  '证据材料': '证据材料',
  '法律援助': '法律援助',
};

const categoryDescriptions: Record<string, string> = {
  '民事起诉状': '向人民法院提起民事诉讼',
  '支持起诉': '向检察机关申请支持起诉',
  '支付令': '申请法院发出支付令催讨工资',
  '证据材料': '整理提交证据材料清单',
  '法律援助': '申请免费法律援助服务',
};

export default function DocumentPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('民事起诉状');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/document/templates');
      const data = await res.json();
      if (data.success && data.data) {
        // API已返回正确格式的数据（category和fields字段）
        // 只需确保 fields 是数组格式
        const parsed = data.data.map((t: { fields?: string | TemplateField[]; variables?: string | string[] }) => {
          let fields = t.fields;
          // 如果 fields 是字符串（JSON），解析它
          if (typeof fields === 'string') {
            try {
              fields = JSON.parse(fields);
            } catch {
              fields = [];
            }
          }
          // 如果没有 fields 但有 variables（数据库旧格式），转换它
          if ((!fields || fields.length === 0) && t.variables) {
            let vars = t.variables;
            if (typeof vars === 'string') {
              try {
                vars = JSON.parse(vars);
              } catch {
                vars = [];
              }
            }
            // 将变量名数组转换为字段对象
            fields = (vars as string[]).map((name: string) => ({
              name,
              type: 'text',
              required: false
            }));
          }
          return {
            ...t,
            fields: fields || []
          };
        });
        setTemplates(parsed);
        if (parsed.length > 0) {
          setSelectedTemplate(parsed[0]);
        }
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [...new Set(templates.map((t) => t.category))];
  const filteredTemplates = templates.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({});
    setGeneratedContent(null);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      // 直接使用API返回的模板内容
      const templateContent = selectedTemplate.content || '';
      
      // 填充模板
      let content = templateContent;
      
      // 替换所有 {字段名} 占位符
      for (const field of selectedTemplate.fields) {
        const value = formData[field.name] || '';
        // 处理条件字段（是否xxx）
        if (field.name.startsWith('是否') && value === 'on') {
          // 保留原占位符，让用户看到需要填写金额
          continue;
        }
        content = content.replace(new RegExp(`\\{${field.name}\\}`, 'g'), value);
      }
      
      // 处理 || 默认值表达式（如 {工作结束日期 || '今'}）
      content = content.replace(/\{([^}]+)\s*\|\|\s*'([^']+)'\}/g, (_, expr, defaultVal) => {
        // 检查表达式中的字段是否有值
        const fieldMatch = expr.match(/\{([^}]+)\}/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          return formData[fieldName] || defaultVal;
        }
        return defaultVal;
      });

      // 处理日期占位符
      const now = new Date();
      content = content.replace(/____年____月____日/g, `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`);

      // 保存到数据库
      const saveRes = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: selectedTemplate.name,
          applicant_name: formData['申请人姓名'] || formData['原告姓名'] || '',
          applicant_phone: formData['联系电话'] || formData['联系方式'] || formData['原告联系电话'] || '',
          case_description: content,
          salary_info: '',
          employer_info: '',
        }),
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setGeneratedContent(content);
      } else {
        // 即使保存失败也显示内容
        setGeneratedContent(content);
      }
    } catch (error) {
      console.error('生成文书失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;

    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name || '法律文书'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewDocument = () => {
    setFormData({});
    setGeneratedContent(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl bg-background px-4 py-8 selection-primary select-text">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-8 selection-primary select-text">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">法律文书生成</h1>
        <p className="text-muted-foreground mt-1">
          选择模板，填写信息，即可生成标准法律文书
        </p>
      </div>

      {generatedContent ? (
        /* 生成结果 */
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            <h2 className="text-lg font-semibold">文书生成成功</h2>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
              {generatedContent}
            </pre>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              下载文书
            </Button>
            <Button variant="outline" onClick={handleNewDocument} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              生成新文书
            </Button>
          </div>
        </div>
      ) : (
        /* 模板选择和表单 */
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 左侧：模板分类 */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">文书类型</h3>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedTemplate(templates.find((t) => t.category === category) || null);
                }}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg transition-all',
                  selectedCategory === category
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50 text-foreground/80'
                )}
              >
                <div className="font-medium">{categoryLabels[category] || category}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {categoryDescriptions[category] || ''}
                </div>
              </button>
            ))}
          </div>

          {/* 中间：模板列表 */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {categoryLabels[selectedCategory] || selectedCategory} 模板
            </h3>
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between',
                  selectedTemplate?.id === template.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  {template.description && (
                    <div className={cn(
                      'text-xs mt-0.5',
                      selectedTemplate?.id === template.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {template.description}
                    </div>
                  )}
                </div>
                <ChevronRight className={cn(
                  'h-4 w-4 shrink-0',
                  selectedTemplate?.id === template.id ? 'text-primary-foreground' : 'text-muted-foreground'
                )} />
              </button>
            ))}
          </div>

          {/* 右侧：表单 */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-lg p-6 border">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                </div>

                <div className="space-y-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1.5">
                        {field.name}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={`请输入${field.name}`}
                        />
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData[field.name] === 'on'}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked ? 'on' : '')}
                            className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-muted-foreground">是</span>
                        </label>
                      ) : field.type === 'select' && field.options ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">请选择</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={`请输入金额`}
                        />
                      ) : field.type === 'phone' ? (
                        <input
                          type="tel"
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="请输入联系电话"
                        />
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : 'text'}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={`请输入${field.name}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isGenerating} className="gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        生成文书
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                请选择一个模板开始
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
