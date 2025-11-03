import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";

import TaskDetailModal from "../components/kanban/TaskDetailModal";

const statusColors = {
    preparation: "bg-slate-500",
    pending: "bg-yellow-500",
    returned: "bg-orange-500",
    approved: "bg-green-500",
    completed: "bg-blue-500"
};

export default function TimelineView() {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const queryClient = useQueryClient();

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list("-created_date"),
        initialData: [],
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id) => base44.entities.Task.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
        },
    });

    const handleSaveTask = (taskData) => {
        if (selectedTask?.id) {
            updateTaskMutation.mutate({ id: selectedTask.id, taskData });
        }
    };

    const handleDeleteTask = (id) => {
        if (window.confirm("このタスクを削除してもよろしいですか？")) {
            deleteTaskMutation.mutate(id);
        }
    };

    // 期日のあるタスクのみフィルター
    const tasksWithDates = tasks.filter(task => task.due_date);

    // タスクの進行状況を計算
    const getTaskProgress = (task) => {
        if (!task.created_date || !task.due_date) return 0;
        const total = differenceInDays(new Date(task.due_date), new Date(task.created_date));
        const elapsed = differenceInDays(new Date(), new Date(task.created_date));
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    // 月初と月末
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            {/* ヘッダー */}
            <div className="bg-white border-b border-slate-200 p-4 md:p-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">タイムライン</h2>
                    <p className="text-sm text-slate-600 mt-1">タスクの進捗状況を時系列で確認</p>
                </div>
            </div>

            {/* タイムライン */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="space-y-4">
                    {tasksWithDates.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-slate-500">
                                期日が設定されたタスクがありません
                            </CardContent>
                        </Card>
                    ) : (
                        tasksWithDates.map((task) => {
                            const daysUntilDue = differenceInDays(new Date(task.due_date), new Date());
                            const progress = getTaskProgress(task);
                            const isOverdue = daysUntilDue < 0 && task.status !== "completed";

                            return (
                                <Card
                                    key={task.id}
                                    className={`hover:shadow-lg transition-shadow cursor-pointer ${isOverdue ? 'border-red-300 bg-red-50' : ''
                                        }`}
                                    onClick={() => {
                                        setSelectedTask(task);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* タスク情報 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className={`w-1 h-12 rounded-full ${statusColors[task.status]} flex-shrink-0`} />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 mb-1">{task.title}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge className={`text-xs ${statusColors[task.status]} text-white`}>
                                                                {task.status === "preparation" && "申請準備"}
                                                                {task.status === "pending" && "承認待ち"}
                                                                {task.status === "returned" && "差戻し"}
                                                                {task.status === "approved" && "承認済み"}
                                                                {task.status === "completed" && "完了"}
                                                            </Badge>
                                                            {task.category && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {task.category}
                                                                </Badge>
                                                            )}
                                                            {task.priority === "urgent" && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    緊急
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* プログレスバー */}
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                        <span>作成: {format(new Date(task.created_date), "M/d", { locale: ja })}</span>
                                                        <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                                                            期日: {format(new Date(task.due_date), "M/d", { locale: ja })}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${isOverdue ? 'bg-red-500' :
                                                                task.status === "completed" ? 'bg-green-500' :
                                                                    'bg-blue-500'
                                                                }`}
                                                            style={{ width: `${task.status === "completed" ? 100 : Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 日数表示 */}
                                            <div className="flex-shrink-0 text-right">
                                                {task.status === "completed" || task.status === "approved" ? (
                                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                                                        <div className="text-xs font-medium">完了</div>
                                                        <div className="text-lg font-bold">
                                                            {differenceInDays(new Date(task.updated_date), new Date(task.created_date))}日
                                                        </div>
                                                    </div>
                                                ) : isOverdue ? (
                                                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">
                                                        <div className="text-xs font-medium">期限超過</div>
                                                        <div className="text-lg font-bold">{Math.abs(daysUntilDue)}日</div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                                                        <div className="text-xs font-medium">残り</div>
                                                        <div className="text-lg font-bold">{daysUntilDue}日</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* タスク詳細モーダル */}
            <TaskDetailModal
                task={selectedTask}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                }}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
            />
        </div>
    );
}
