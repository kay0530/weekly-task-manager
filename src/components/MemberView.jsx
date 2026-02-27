import { useState } from 'react';
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { MEMBERS, CATEGORIES, TASK_TYPES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import { MemberAvatar } from './Sidebar';
import TaskCard, { SortableTaskCard } from './TaskCard';
import TaskForm from './TaskForm';

export default function MemberView({ memberId }) {
  const { getTasksByMember, reorderTasks } = useTaskContext();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [activeId, setActiveId] = useState(null);

  // Require 8px movement before starting drag to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const member = MEMBERS.find(m => m.id === memberId);
  const memberTasks = getTasksByMember(memberId);

  // Apply filters
  let filteredTasks = [...memberTasks];
  if (filterCategory !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.category === filterCategory);
  }
  if (filterType !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.taskType === filterType);
  }

  // Apply sorting (only when not custom/default order)
  if (sortBy === 'priority') {
    filteredTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } else if (sortBy === 'dueDate') {
    filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sortBy === 'progress') {
    filteredTasks.sort((a, b) => b.progress - a.progress);
  }
  // When sortBy === 'default', tasks are already sorted by displayOrder from getTasksByMember

  const isDragEnabled = sortBy === 'default';
  const taskIds = filteredTasks.map(t => t.id);
  const activeTask = activeId ? filteredTasks.find(t => t.id === activeId) : null;

  const avgProgress = memberTasks.length > 0
    ? Math.round(memberTasks.reduce((s, t) => s + t.progress, 0) / memberTasks.length)
    : 0;

  const completedCount = memberTasks.filter(t => t.progress >= 100).length;
  const hasIssuesCount = memberTasks.filter(t => t.issues).length;

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskIds.indexOf(active.id);
    const newIndex = taskIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(taskIds, oldIndex, newIndex);
    reorderTasks(newOrder);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!member) return <div className="p-6 text-gray-500">メンバーを選択してください</div>;

  const renderTaskGrid = () => {
    if (filteredTasks.length === 0) {
      return (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">タスクがありません</p>
          <button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
          >
            + 最初のタスクを作成
          </button>
        </div>
      );
    }

    if (isDragEnabled) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={taskIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTasks.map(task => (
                <SortableTaskCard key={task.id} task={task} onEdit={handleEdit} isDragEnabled />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-2 shadow-2xl">
                <TaskCard task={activeTask} onEdit={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={handleEdit} />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Member Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="shadow-lg rounded-full">
            <MemberAvatar member={member} size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{member.nameJa}</h2>
            <p className="text-sm text-gray-500">
              {member.nameEn} | {memberTasks.length}件のタスク | 完了 {completedCount}件 | 平均進捗 {avgProgress}%
              {hasIssuesCount > 0 && <span className="text-orange-500 ml-1">| 課題 {hasIssuesCount}件</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          タスク追加
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
              filterCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            すべて ({memberTasks.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = memberTasks.filter(t => t.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
                  filterCategory === cat.id ? 'text-white' : 'text-gray-600 hover:opacity-80'
                }`}
                style={filterCategory === cat.id ? { backgroundColor: cat.color } : { backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Type filter + Sort */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg"
          >
            <option value="all">全属性</option>
            {TASK_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg"
          >
            <option value="default">カスタム順</option>
            <option value="priority">優先順位</option>
            <option value="dueDate">期日</option>
            <option value="progress">進捗</option>
          </select>
        </div>
      </div>

      {/* Drag hint */}
      {isDragEnabled && filteredTasks.length > 1 && (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          ドラッグでタスクの順序を変更できます
        </p>
      )}

      {/* Tasks Grid */}
      {renderTaskGrid()}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          defaultMemberId={memberId}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
