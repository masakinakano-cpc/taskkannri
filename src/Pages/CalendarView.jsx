import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";

import TaskDetailModal from "@/components/kanban/TaskDetailModal";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

const statusColors = {
    preparation: "bg-slate-500",
    pending: "bg-yellow-500",
    returned: "bg-orange-500",
    approved: "bg-green-500",
    completed: "bg-blue-500"
};

const statusLabels = {
    preparation: "準備",
    pending: "承認待",
    returned: "差戻",
    approved: "承認済",
    completed: "完了"
};

export default function CalendarView() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [googleEvents, setGoogleEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const queryClient = useQueryClient();
    const { fetchEventsForDateRange, googleAccounts } = useGoogleCalendar();

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list("-created_date"),
        initialData: [],
    });

    // Googleカレンダーのイベントを取得
    useEffect(() => {
        const fetchGoogleEvents = async () => {
            if (googleAccounts.length === 0) {
                setGoogleEvents([]);
                return;
            }

            setLoadingEvents(true);
            try {
                const monthStart = startOfMonth(currentMonth);
                const monthEnd = endOfMonth(currentMonth);
                const events = await fetchEventsForDateRange(monthStart, monthEnd);
                setGoogleEvents(events);
            } catch (error) {
                console.error('Googleカレンダーのイベント取得エラー:', error);
                setGoogleEvents([]);
            } finally {
                setLoadingEvents(false);
            }
        };

        fetchGoogleEvents();
    }, [currentMonth, googleAccounts, fetchEventsForDateRange]);

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

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getTasksForDay = (day) => {
        return tasks.filter(task =>
            task.due_date && isSameDay(new Date(task.due_date), day)
        );
    };

    const getEventsForDay = (day) => {
        return googleEvents.filter(event => {
            const eventStart = new Date(event.start);
            return isSameDay(eventStart, day);
        });
    };

    return (
        <div className="h-full flex bg-gradient-to-br from-slate-50 to-blue-50">
            {/* サイドバー */}
            <CalendarSidebar />

            {/* メインコンテンツ */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ヘッダー */}
                <div className="bg-white border-b border-slate-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">カレンダービュー</h2>
                        <p className="text-sm text-slate-600 mt-1">期日でタスクを確認</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="text-lg font-bold min-w-32 text-center">
                            {format(currentMonth, "yyyy年M月", { locale: ja })}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentMonth(new Date())}
                        >
                            今月
                        </Button>
                    </div>
                </div>
            </div>

            {/* カレンダー */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 border-b bg-slate-50">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                            <div
                                key={day}
                                className={`p-3 text-center font-semibold text-sm ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-slate-700'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* 日付グリッド */}
                    <div className="grid grid-cols-7">
                        {daysInMonth.map((day, index) => {
                            const dayTasks = getTasksForDay(day);
                            const isCurrentDay = isToday(day);
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                            const dayEvents = getEventsForDay(day);

                            return (
                                <div
                                    key={day.toString()}
                                    className={`min-h-32 border-b border-r p-2 ${!isSameMonth(day, currentMonth) ? 'bg-slate-50' :
                                        isWeekend ? 'bg-slate-50/50' : 'bg-white'
                                        } ${isCurrentDay ? 'bg-blue-50' : ''}`}
                                >
                                    <div className={`text-sm font-semibold mb-2 ${isCurrentDay ? 'text-blue-600' :
                                        day.getDay() === 0 ? 'text-red-600' :
                                            day.getDay() === 6 ? 'text-blue-600' :
                                                'text-slate-700'
                                        }`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {/* タスク */}
                                        {dayTasks.map((task) => (
                                            <div
                                                key={`task-${task.id}`}
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setIsModalOpen(true);
                                                }}
                                                className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${statusColors[task.status]} text-white truncate`}
                                            >
                                                <div className="font-medium truncate">{task.title}</div>
                                                <div className="text-xs opacity-90">{statusLabels[task.status]}</div>
                                            </div>
                                        ))}

                                        {/* Googleカレンダーイベント */}
                                        {dayEvents.map((event) => (
                                            <div
                                                key={`event-${event.id}`}
                                                className="text-xs p-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 truncate"
                                                style={{
                                                    backgroundColor: event.calendar_color || '#3B82F6',
                                                    color: 'white',
                                                    borderColor: event.calendar_color || '#3B82F6'
                                                }}
                                                title={`${event.title}\n${event.calendar_name}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                                    <span className="font-medium truncate">{event.title}</span>
                                                </div>
                                                <div className="text-xs opacity-90 truncate">{event.calendar_name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 凡例 */}
                <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-slate-700">凡例</h3>
                        {loadingEvents && (
                            <Badge variant="outline" className="text-xs">
                                イベント読み込み中...
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* タスクステータス */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-2">タスクステータス</p>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded ${statusColors[key]}`} />
                                        <span className="text-sm text-slate-600">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Googleカレンダー */}
                        {googleAccounts.length > 0 && (
                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-500" />
                                    <p className="text-xs font-medium text-slate-500">
                                        Googleカレンダー ({googleEvents.length} イベント)
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500">
                                    サイドバーからカレンダーの表示/非表示を切り替えられます
                                </p>
                            </div>
                        )}
                    </div>
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
        </div>
    );
}
