import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { differenceInDays } from "date-fns";

import StatsCard from "../components/dashboard/StatsCard";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import RecentTasksList from "../components/dashboard/RecentTasksList";
import TaskDetailModal from "../components/kanban/TaskDetailModal";

const COLORS = ['#64748b', '#eab308', '#f97316', '#22c55e', '#3b82f6'];

export default function Dashboard() {
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

    // 統計データ
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "approved").length;
    const overdueTasks = tasks.filter(t =>
        t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
    ).length;

    const avgCompletionDays = (() => {
        const completed = tasks.filter(t => t.status === "completed" || t.status === "approved");
        if (completed.length === 0) return 0;
        const totalDays = completed.reduce((sum, task) => {
            return sum + differenceInDays(new Date(task.updated_date), new Date(task.created_date));
        }, 0);
        return Math.round(totalDays / completed.length);
    })();

    // ステータス別の件数
    const statusData = [
        { name: "申請準備", value: tasks.filter(t => t.status === "preparation").length },
        { name: "承認待ち", value: tasks.filter(t => t.status === "pending").length },
        { name: "差戻し", value: tasks.filter(t => t.status === "returned").length },
        { name: "承認済み", value: tasks.filter(t => t.status === "approved").length },
        { name: "完了", value: tasks.filter(t => t.status === "completed").length },
    ];

    // カテゴリ別の件数
    const categoryData = [
        { name: "発注依頼", value: tasks.filter(t => t.category === "発注依頼").length },
        { name: "契約稟議", value: tasks.filter(t => t.category === "契約稟議").length },
        { name: "経費申請", value: tasks.filter(t => t.category === "経費申請").length },
        { name: "休暇申請", value: tasks.filter(t => t.category === "休暇申請").length },
        { name: "その他", value: tasks.filter(t => t.category === "その他").length },
    ].filter(item => item.value > 0);

    const handleExport = () => {
        const csvContent = [
            ["タイトル", "ステータス", "優先度", "カテゴリ", "期日", "承認者", "作成日"].join(","),
            ...tasks.map(task => [
                `"${task.title}"`,
                task.status,
                task.priority,
                task.category,
                task.due_date || "",
                task.approver || "",
                task.created_date
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

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

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* ヘッダー */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
                    <p className="text-sm text-slate-600 mt-1">タスクの概要と統計</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSVエクスポート
                </Button>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="総タスク数"
                    value={totalTasks}
                    icon={CheckSquare}
                    bgColor="bg-blue-500"
                />
                <StatsCard
                    title="承認待ち"
                    value={pendingTasks}
                    icon={Clock}
                    bgColor="bg-yellow-500"
                />
                <StatsCard
                    title="完了済み"
                    value={completedTasks}
                    icon={TrendingUp}
                    bgColor="bg-green-500"
                    description={`平均${avgCompletionDays}日で完了`}
                />
                <StatsCard
                    title="期限超過"
                    value={overdueTasks}
                    icon={AlertCircle}
                    bgColor="bg-red-500"
                />
            </div>

            {/* グラフエリア */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ステータス別グラフ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">ステータス別件数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* カテゴリ別グラフ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">カテゴリ別割合</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 通知と最近のタスク */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NotificationPanel tasks={tasks} />
                <RecentTasksList
                    tasks={tasks}
                    onTaskClick={(task) => {
                        setSelectedTask(task);
                        setIsModalOpen(true);
                    }}
                />
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
