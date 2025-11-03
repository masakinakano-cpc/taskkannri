import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import KanbanColumn from "@/components/kanban/KanbanColumn";
import TaskCard from "@/components/kanban/TaskCard";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";

const STATUSES = ["preparation", "pending", "returned", "approved", "completed"];

export default function KanbanBoard() {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");

    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.list("-created_date"),
        initialData: [],
    });

    const createTaskMutation = useMutation({
        mutationFn: (taskData) => base44.entities.Task.create(taskData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
        },
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
        } else {
            createTaskMutation.mutate(taskData);
        }
    };

    const handleDeleteTask = (id) => {
        if (window.confirm("このタスクを削除してもよろしいですか？")) {
            deleteTaskMutation.mutate(id);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const taskId = draggableId;
        const newStatus = destination.droppableId;

        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            updateTaskMutation.mutate({
                id: taskId,
                taskData: { ...task, status: newStatus }
            });
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !searchQuery ||
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = filterCategory === "all" || task.category === filterCategory;
        const matchesPriority = filterPriority === "all" || task.priority === filterPriority;

        return matchesSearch && matchesCategory && matchesPriority;
    });

    const getTasksByStatus = (status) => {
        return filteredTasks.filter(task => task.status === status);
    };

    return (
        <div className="h-full flex flex-col">
            {/* ヘッダー */}
            <div className="bg-white border-b border-slate-200 p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">カンバンボード</h2>
                        <p className="text-sm text-slate-600 mt-1">タスクをドラッグ&ドロップで移動できます</p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedTask(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        新規タスク
                    </Button>
                </div>

                {/* フィルター */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="タスクを検索..."
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="カテゴリ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="発注依頼">発注依頼</SelectItem>
                            <SelectItem value="契約稟議">契約稟議</SelectItem>
                            <SelectItem value="経費申請">経費申請</SelectItem>
                            <SelectItem value="休暇申請">休暇申請</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-full md:w-32">
                            <SelectValue placeholder="優先度" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="low">低</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* カンバンボード */}
            <div className="flex-1 overflow-x-auto p-4 md:p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 min-w-max pb-4">
                        {STATUSES.map((status) => {
                            const statusTasks = getTasksByStatus(status);
                            return (
                                <Droppable key={status} droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            <KanbanColumn
                                                status={status}
                                                tasks={statusTasks}
                                                isDragOver={snapshot.isDraggingOver}
                                            >
                                                {statusTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <TaskCard
                                                                    task={task}
                                                                    onClick={() => {
                                                                        setSelectedTask(task);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                    isDragging={snapshot.isDragging}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </KanbanColumn>
                                        </div>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </DragDropContext>
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
