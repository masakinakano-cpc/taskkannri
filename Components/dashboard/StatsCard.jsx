import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, bgColor, description }) {
    return (
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgColor} rounded-full opacity-10`} />
            <CardContent className="p-6 relative">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        {description && (
                            <p className="text-xs text-slate-500 mt-2">{description}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
                        <Icon className={`w-6 h-6 ${bgColor.replace('bg-', 'text-')}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
