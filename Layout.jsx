import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Kanban, Calendar, CheckSquare, Menu, LayoutDashboard, FileText, Clock } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
    {
        title: "ダッシュボード",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
    },
    {
        title: "カンバンボード",
        url: createPageUrl("KanbanBoard"),
        icon: Kanban,
    },
    {
        title: "カレンダー",
        url: createPageUrl("CalendarView"),
        icon: Calendar,
    },
    {
        title: "タイムライン",
        url: createPageUrl("TimelineView"),
        icon: Clock,
    },
    {
        title: "テンプレート",
        url: createPageUrl("Templates"),
        icon: FileText,
    },
];

// 設定項目（サブメニュー）
const settingsItems = [
    {
        title: "カレンダー設定",
        url: "/calendar-settings",
        icon: Calendar,
    },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
                <Sidebar className="border-r border-slate-200">
                    <SidebarHeader className="border-b border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <CheckSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg">承認タスク管理</h2>
                                <p className="text-xs text-slate-500">個人用ワークフロー</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-3">
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                                ビュー
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' : ''
                                                    }`}
                                            >
                                                <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="font-medium">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-4">
                                設定
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {settingsItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' : ''
                                                    }`}
                                            >
                                                <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="font-medium">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 flex items-center gap-4 shadow-sm">
                        <SidebarTrigger className="md:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                            <Menu className="w-5 h-5" />
                        </SidebarTrigger>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800">{currentPageName}</h1>
                    </header>

                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
