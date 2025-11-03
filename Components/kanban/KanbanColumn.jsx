import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
    preparation: {
        title: "申請準備",
        color: "bg-slate-500",
        bgColor: "bg-slate-50"
    },
    pending: {
        title: "承認待ち",
        color: "bg-yellow-500",
        bgColor: "bg-yellow-50"
    },
    returned: {
        title: "差戻し",
        color: "bg-orange-500",
        bgColor: "bg-orange-50"
    },
    approved: {
        title: "承認済み",
        color: "bg-green-500",
        bgColor: "bg-green-50"
    },
    completed: {
        title: "完了",
        color: "bg-blue-500",
        bgColor: "bg-blue-50"
    }
};

export default function KanbanColumn({ status, tasks, onDragOver, onDrop, onDragLeave, isDragOver, children }) {
    const config = statusConfig[status];

    return (
        <div
            className="flex-shrink-0 w-80"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
        >
            <Card className={`h-full transition-all duration-200 ${isDragOver ? 'ring-2 ring-blue-400 shadow-xl' : 'shadow-md'
                }`}>
                <CardHeader className={`${config.bgColor} border-b pb-3`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <CardTitle className="text-base font-bold">{config.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-white/80">
                            {tasks.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className={`p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto ${config.bgColor} bg-opacity-30`}>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
