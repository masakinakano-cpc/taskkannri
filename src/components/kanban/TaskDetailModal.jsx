import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Trash2, Save, Plus, MessageSquare, Paperclip, X, Upload } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const statusLabels = {
    preparation: "申請準備",
    pending: "承認待ち",
    returned: "差戻し",
    approved: "承認済み",
    completed: "完了"
};

export default function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete }) {
    const [editedTask, setEditedTask] = useState(task || {
        title: "",
        description: "",
        status: "preparation",
        priority: "medium",
        category: "その他",
        due_date: "",
        approver: "",
        memo: "",
        comments: [],
        attachments: []
    });

    const [newComment, setNewComment] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = () => {
        onSave(editedTask);
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        const updatedComments = [
            ...(editedTask.comments || []),
            {
                text: newComment,
                timestamp: new Date().toISOString()
            }
        ];

        setEditedTask({ ...editedTask, comments: updatedComments });
        setNewComment("");
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            const updatedAttachments = [...(editedTask.attachments || []), file_url];
            setEditedTask({ ...editedTask, attachments: updatedAttachments });
        } catch (error) {
            console.error("ファイルアップロードエラー:", error);
            alert("ファイルのアップロードに失敗しました");
        }
        setIsUploading(false);
    };

    const handleRemoveAttachment = (index) => {
        const updatedAttachments = editedTask.attachments.filter((_, i) => i !== index);
        setEditedTask({ ...editedTask, attachments: updatedAttachments });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {task?.id ? "タスク編集" : "新規タスク"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* タイトル */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold">タイトル *</Label>
                        <Input
                            id="title"
                            value={editedTask.title}
                            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                            placeholder="タスクのタイトルを入力"
                            className="text-base"
                        />
                    </div>

                    {/* 説明 */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold">説明</Label>
                        <Textarea
                            id="description"
                            value={editedTask.description || ""}
                            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                            placeholder="タスクの詳細説明"
                            className="min-h-24"
                        />
                    </div>

                    {/* ステータス、優先度、カテゴリ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">ステータス</Label>
                            <Select
                                value={editedTask.status}
                                onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">優先度</Label>
                            <Select
                                value={editedTask.priority}
                                onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
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
                            <Label className="text-sm font-semibold">カテゴリ</Label>
                            <Select
                                value={editedTask.category}
                                onValueChange={(value) => setEditedTask({ ...editedTask, category: value })}
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

                    {/* 期日、承認者 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="due_date" className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                期日
                            </Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={editedTask.due_date || ""}
                                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="approver" className="text-sm font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                承認者
                            </Label>
                            <Input
                                id="approver"
                                value={editedTask.approver || ""}
                                onChange={(e) => setEditedTask({ ...editedTask, approver: e.target.value })}
                                placeholder="承認者名"
                            />
                        </div>
                    </div>

                    {/* メモ・注意点 */}
                    <div className="space-y-2">
                        <Label htmlFor="memo" className="text-sm font-semibold">メモ・注意点</Label>
                        <Textarea
                            id="memo"
                            value={editedTask.memo || ""}
                            onChange={(e) => setEditedTask({ ...editedTask, memo: e.target.value })}
                            placeholder="承認フローの注意点や備考を記入"
                            className="min-h-20"
                        />
                    </div>

                    {/* 添付ファイル */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            添付ファイル
                        </Label>

                        {editedTask.attachments && editedTask.attachments.length > 0 && (
                            <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                                {editedTask.attachments.map((url, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline truncate flex-1"
                                        >
                                            添付ファイル {index + 1}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveAttachment(index)}
                                            className="flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={isUploading}
                                className="gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? "アップロード中..." : "ファイルを追加"}
                            </Button>
                        </div>
                    </div>

                    {/* コメント履歴 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            コメント履歴
                        </Label>

                        {editedTask.comments && editedTask.comments.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                                {editedTask.comments.map((comment, index) => (
                                    <div key={index} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
                                        <p className="text-slate-700">{comment.text}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(new Date(comment.timestamp), "yyyy/MM/dd HH:mm", { locale: ja })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="コメントを追加"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                            />
                            <Button onClick={handleAddComment} size="icon" variant="outline">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between gap-2">
                    <div>
                        {task?.id && (
                            <Button variant="destructive" onClick={() => onDelete(task.id)} className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                削除
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4" />
                            保存
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
