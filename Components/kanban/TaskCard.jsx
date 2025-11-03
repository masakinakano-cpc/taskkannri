import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle, Paperclip } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";

const priorityColors = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    urgent: "bg-red-100 text-red-700 border-red-200"
};

const categoryColors = {
    "発注依頼": "bg-purple-100 text-purple-700",
    "契約稟議": "bg-indigo-100 text-indigo-700",
    "経費申請": "bg-green-100 text-green-700",
    "休暇申請": "bg-cyan-100 text-cyan-700",
    "その他": "bg-slate-100 text-slate-700"
};

export default function TaskCard({ task, onClick, isDragging }) {
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const isDueToday = task.due_date && isToday(new Date(task.due_date));

    return (
        <Card
            onClick={onClick}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isDragging ? 'opacity-50 rotate-2' : ''
                } ${isOverdue ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-slate-900 leading-tight flex-1">
                        {task.title}
                    </h3>
                    {isOverdue && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                </div>

                {task.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={`${priorityColors[task.priority]} border text-xs`}>
                        {task.priority === "low" && "低"}
                        {task.priority === "medium" && "中"}
                        {task.priority === "high" && "高"}
                        {task.priority === "urgent" && "緊急"}
                    </Badge>
                    {task.category && (
                        <Badge className={`${categoryColors[task.category]} text-xs`}>
                            {task.category}
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    {task.due_date && (
                        <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-600 font-semibold' :
                            isDueToday ? 'text-orange-600 font-medium' :
                                'text-slate-600'
                            }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {format(new Date(task.due_date), "M月d日(E)", { locale: ja })}
                                {isOverdue && " - 期限超過"}
                                {isDueToday && " - 本日期限"}
                            </span>
                        </div>
                    )}
                    {task.approver && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <User className="w-3.5 h-3.5" />
                            <span>{task.approver}</span>
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{task.attachments.length}件の添付</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
