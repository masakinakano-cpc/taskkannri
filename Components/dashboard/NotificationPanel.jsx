import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { format, differenceInDays, isPast, isToday, addDays } from "date-fns";
import { ja } from "date-fns/locale";

export default function NotificationPanel({ tasks }) {
    const today = new Date();

    const overdueTask = tasks.filter(task =>
        task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "completed"
    );

    const dueTodayTasks = tasks.filter(task =>
        task.due_date && isToday(new Date(task.due_date)) && task.status !== "completed"
    );

    const dueSoonTasks = tasks.filter(task => {
        if (!task.due_date || task.status === "completed") return false;
        const dueDate = new Date(task.due_date);
        const daysUntilDue = differenceInDays(dueDate, today);
        return daysUntilDue > 0 && daysUntilDue <= 3;
    });

    const longPendingTasks = tasks.filter(task => {
        if (task.status !== "pending") return false;
        const daysSinceCreated = differenceInDays(today, new Date(task.created_date));
        return daysSinceCreated > 7;
    });

    const notifications = [
        ...overdueTask.map(task => ({
            type: "error",
            icon: AlertTriangle,
            message: `期限超過: ${task.title}`,
            date: task.due_date,
            task
        })),
        ...dueTodayTasks.map(task => ({
            type: "warning",
            icon: Clock,
            message: `本日期限: ${task.title}`,
            date: task.due_date,
            task
        })),
        ...dueSoonTasks.map(task => ({
            type: "info",
            icon: Bell,
            message: `まもなく期限: ${task.title}`,
            date: task.due_date,
            task
        })),
        ...longPendingTasks.map(task => ({
            type: "warning",
            icon: Clock,
            message: `承認待ち長期化: ${task.title}`,
            date: null,
            task
        }))
    ];

    const typeStyles = {
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-orange-50 border-orange-200 text-orange-800",
        info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    if (notifications.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        通知
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>通知はありません</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        通知
                    </CardTitle>
                    <Badge variant="destructive">{notifications.length}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notifications.map((notification, index) => {
                        const Icon = notification.icon;
                        return (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${typeStyles[notification.type]} transition-all hover:shadow-md`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{notification.message}</p>
                                        {notification.date && (
                                            <p className="text-xs mt-1 opacity-75">
                                                {format(new Date(notification.date), "M月d日(E)", { locale: ja })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
