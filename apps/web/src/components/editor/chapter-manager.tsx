"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plus,
    GripVertical,
    MoreHorizontal,
    Trash2,
    Edit2,
    ChevronRight,
    FileText,
} from "lucide-react";

interface Chapter {
    id: string;
    title: string;
    wordCount: number;
    order: number;
}

interface ChapterManagerProps {
    chapters: Chapter[];
    activeChapterId?: string;
    onChapterSelect: (id: string) => void;
    onChapterAdd: () => void;
    onChapterRename: (id: string, title: string) => void;
    onChapterDelete: (id: string) => void;
    onChaptersReorder: (chapters: Chapter[]) => void;
}

interface SortableChapterProps {
    chapter: Chapter;
    isActive: boolean;
    onSelect: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
}

function SortableChapter({
    chapter,
    isActive,
    onSelect,
    onRename,
    onDelete,
}: SortableChapterProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(chapter.title);
    const [showMenu, setShowMenu] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: chapter.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleRename = () => {
        if (editTitle.trim() && editTitle !== chapter.title) {
            onRename(editTitle.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                } ${isDragging ? "opacity-50 shadow-lg" : ""}`}
            onClick={onSelect}
        >
            <button
                {...attributes}
                {...listeners}
                className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 -ml-1"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />

            {isEditing ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                        if (e.key === "Escape") {
                            setEditTitle(chapter.title);
                            setIsEditing(false);
                        }
                    }}
                    className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="flex-1 text-sm truncate">{chapter.title}</span>
            )}

            <span className="text-xs text-muted-foreground shrink-0">
                {chapter.wordCount.toLocaleString()}
            </span>

            <div className="relative">
                <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/10 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                        <button
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                                setShowMenu(false);
                            }}
                        >
                            <Edit2 className="w-3 h-3" />
                            Rename
                        </button>
                        <button
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-destructive text-left"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                setShowMenu(false);
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ChapterManager({
    chapters,
    activeChapterId,
    onChapterSelect,
    onChapterAdd,
    onChapterRename,
    onChapterDelete,
    onChaptersReorder,
}: ChapterManagerProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = chapters.findIndex((c) => c.id === active.id);
            const newIndex = chapters.findIndex((c) => c.id === over.id);

            const newChapters = arrayMove(chapters, oldIndex, newIndex).map(
                (chapter, index) => ({
                    ...chapter,
                    order: index,
                })
            );

            onChaptersReorder(newChapters);
        }
    };

    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Chapters</h3>
                <button
                    onClick={onChapterAdd}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    title="Add Chapter"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {sortedChapters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No chapters yet</p>
                        <button
                            onClick={onChapterAdd}
                            className="mt-2 text-xs text-primary hover:underline"
                        >
                            Add your first chapter
                        </button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedChapters.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1">
                                {sortedChapters.map((chapter) => (
                                    <SortableChapter
                                        key={chapter.id}
                                        chapter={chapter}
                                        isActive={chapter.id === activeChapterId}
                                        onSelect={() => onChapterSelect(chapter.id)}
                                        onRename={(title) => onChapterRename(chapter.id, title)}
                                        onDelete={() => onChapterDelete(chapter.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {chapters.length > 0 && (
                <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                    {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} •{" "}
                    {chapters.reduce((sum, c) => sum + c.wordCount, 0).toLocaleString()} words
                </div>
            )}
        </div>
    );
}
