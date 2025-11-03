import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Trash2, Edit, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Templates() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        description: "",
        priority: "medium",
        category: "その他",
        approver: "",
        memo: ""
    });

    const queryClient = useQueryClient();

    const { data: templates = [] } = useQuery({
        queryKey: ['templates'],
        queryFn: () => base44.entities.Template.list("-created_date"),
        initialData: [],
    });

    const createTemplateMutation = useMutation({
        mutationFn: (data) => base44.entities.Template.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            resetForm();
        },
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            resetForm();
        },
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id) => base44.entities.Template.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });

    const createTaskFromTemplateMutation = useMutation({
        mutationFn: (templateData) => base44.entities.Task.create({
            ...templateData,
            status: "preparation",
            comments: [],
            attachments: []
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            alert("テンプレートからタスクを作成しました！");
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            title: "",
            description: "",
            priority: "medium",
            category: "その他",
            approver: "",
            memo: ""
        });
        setEditingTemplate(null);
        setIsModalOpen(false);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.title) {
            alert("テンプレート名とタスクタイトルは必須です");
            return;
        }

        if (editingTemplate) {
            updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
        } else {
            createTemplateMutation.mutate(formData);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            title: template.title,
            description: template.description || "",
            priority: template.priority,
            category: template.category,
            approver: template.approver || "",
            memo: template.memo || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("このテンプレートを削除してもよろしいですか？")) {
            deleteTemplateMutation.mutate(id);
        }
    };

    const handleCreateTask = (template) => {
        createTaskFromTemplateMutation.mutate({
            title: template.title,
            description: template.description,
            priority: template.priority,
            category: template.category,
            approver: template.approver,
            memo: template.memo
        });
    };

    const categoryColors = {
        "発注依頼": "bg-purple-100 text-purple-700",
        "契約稟議": "bg-indigo-100 text-indigo-700",
        "経費申請": "bg-green-100 text-green-700",
        "休暇申請": "bg-cyan-100 text-cyan-700",
        "その他": "bg-slate-100 text-slate-700"
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* ヘッダー */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">テンプレート管理</h2>
                    <p className="text-sm text-slate-600 mt-1">よく使うタスクをテンプレート化</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingTemplate(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    新規テンプレート
                </Button>
            </div>

            {/* テンプレート一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium text-sm text-slate-900">{template.title}</p>
                                {template.description && (
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                        {template.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge className={categoryColors[template.category]}>
                                    {template.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {template.priority === "low" && "低"}
                                    {template.priority === "medium" && "中"}
                                    {template.priority === "high" && "高"}
                                    {template.priority === "urgent" && "緊急"}
                                </Badge>
                            </div>

                            {template.approver && (
                                <p className="text-xs text-slate-600">
                                    承認者: {template.approver}
                                </p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={() => handleCreateTask(template)}
                                    size="sm"
                                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <Copy className="w-3 h-3" />
                                    タスク作成
                                </Button>
                                <Button
                                    onClick={() => handleEdit(template)}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                    onClick={() => handleDelete(template.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full">
                        <Card>
                            <CardContent className="p-12 text-center text-slate-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium mb-2">テンプレートがありません</p>
                                <p className="text-sm">よく使うタスクをテンプレート化して、効率的に管理しましょう</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* テンプレート編集モーダル */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? "テンプレート編集" : "新規テンプレート"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">テンプレート名 *</Label>
                            <Input
                                id="template-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 定期発注依頼"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-title">タスクタイトル *</Label>
                            <Input
                                id="task-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="例: オフィス消耗品の発注"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">説明</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="タスクの詳細説明"
                                className="min-h-24"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>優先度</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">低</SelectItem>
                                        <SelectItem value="medium">中</SelectItem>
                                        <SelectItem value="high">高</SelectItem>
                                        <SelectItem value="urgent">緊急</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>カテゴリ</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="発注依頼">発注依頼</SelectItem>
                                        <SelectItem value="契約稟議">契約稟議</SelectItem>
                                        <SelectItem value="経費申請">経費申請</SelectItem>
                                        <SelectItem value="休暇申請">休暇申請</SelectItem>
                                        <SelectItem value="その他">その他</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="approver">承認者</Label>
                            <Input
                                id="approver"
                                value={formData.approver}
                                onChange={(e) => setFormData({ ...formData, approver: e.target.value })}
                                placeholder="例: 総務課長"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="memo">メモ・注意点</Label>
                            <Textarea
                                id="memo"
                                value={formData.memo}
                                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                placeholder="承認時の注意点など"
                                className="min-h-20"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetForm}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                            {editingTemplate ? "更新" : "作成"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
