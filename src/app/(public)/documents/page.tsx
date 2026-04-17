'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Calendar,
  User,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileDown,
  Plus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Document {
  id: number;
  doc_number: string;
  document_type: string;
  applicant_name: string;
  applicant_phone: string;
  plaintiff_name: string;
  defendant_name: string;
  claim_total_amount: number;
  status: string;
  created_at: string;
  document_content?: string;
}

export default function DocumentsListPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [copied, setCopied] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchDocuments();
  }, [page]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data || []);
        setTotal(result.total || 0);
      } else {
        toast.error(result.error || '获取文书列表失败');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('网络错误，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentDetail = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedDoc(result.data);
      } else {
        toast.error(result.error || '获取文书详情失败');
      }
    } catch (error) {
      console.error('Fetch detail error:', error);
      toast.error('网络错误');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文书吗？')) return;
    
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('文书已删除');
        fetchDocuments();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('网络错误');
    }
  };

  const handleCopy = async () => {
    if (selectedDoc?.document_content) {
      await navigator.clipboard.writeText(selectedDoc.document_content);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (selectedDoc?.document_content) {
      const blob = new Blob([selectedDoc.document_content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `民事起诉状_${selectedDoc.plaintiff_name || '未知'}_${selectedDoc.doc_number || selectedDoc.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('文书已下载');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />待审核</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />已通过</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />已驳回</Badge>;
      case 'draft':
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />草稿</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <Button asChild variant="ghost" className="text-white hover:bg-white/20 mb-4">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回首页
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-white">我的文书</h1>
              <p className="text-emerald-100 mt-1">查看和管理已生成的民事起诉状</p>
            </div>
            <Button asChild className="bg-white text-emerald-600 hover:bg-emerald-50">
              <Link href="/document">
                <Plus className="mr-2 h-4 w-4" />
                新建文书
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Document List */}
          <Card className="border-emerald-100 shadow-lg shadow-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                文书列表
              </CardTitle>
              <CardDescription>
                共 {total} 篇文书
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-muted-foreground mb-4">暂无文书记录</p>
                  <Button asChild>
                    <Link href="/document">创建第一篇文书</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>文书编号</TableHead>
                        <TableHead>原告</TableHead>
                        <TableHead>被告</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow 
                          key={doc.id}
                          className={selectedDoc?.id === doc.id ? 'bg-emerald-50' : ''}
                        >
                          <TableCell className="font-mono text-sm">{doc.doc_number}</TableCell>
                          <TableCell>{doc.plaintiff_name || '-'}</TableCell>
                          <TableCell>{doc.defendant_name || '-'}</TableCell>
                          <TableCell>
                            {doc.claim_total_amount 
                              ? `¥${Number(doc.claim_total_amount).toLocaleString()}`
                              : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status || 'draft')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchDocumentDetail(doc.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/document?id=${doc.id}&action=edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        第 {page} / {totalPages} 页，共 {total} 条
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Document Preview */}
          <Card className="border-purple-100 shadow-lg shadow-purple-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-purple-600" />
                  文书预览
                </CardTitle>
                {selectedDoc && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {selectedDoc && (
                <CardDescription>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {selectedDoc.doc_number}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedDoc.created_at)}
                    </span>
                    {getStatusBadge(selectedDoc.status || 'draft')}
                  </div>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedDoc ? (
                <div className="rounded-lg bg-slate-50 p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-slate-700">
                    {selectedDoc.document_content || '暂无文书内容'}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-muted-foreground">点击左侧列表查看文书详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
