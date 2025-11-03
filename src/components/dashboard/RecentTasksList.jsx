import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const statusColors = {
    preparation: "bg-slate-100 text-slate-700",
    pending: "bg-yellow-100 text-yellow-700",
    returned: "bg-orange-100 text-orange-700",
    approved: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700"
};

const statusLabels = {
    preparation: "申請準備",
    pending: "承認待ち",
    returned: "差戻し",
    approved: "承認済み",
    completed: "完了"
};

export default function RecentTasksList({ tasks, onTaskClick }) {
    const recentTasks = tasks.slice(0, 10);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">最近のタスク</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentTasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-slate-900 text-sm flex-1">
                                    {task.title}
                                </h4>
                                <Badge className={`${statusColors[task.status]} text-xs`}>
                                    {statusLabels[task.status]}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                {task.due_date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(task.due_date), "M/d", { locale: ja })}
                                    </div>
                                )}
                                {task.approver && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {task.approver}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
