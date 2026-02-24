import { useState } from 'react';
import { MEMBERS, CATEGORIES, TASK_TYPES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import ProgressBar from './ProgressBar';

export default function ArchiveView() {
  const { archivedTasks, restoreFromArchive } = useTaskContext();
  const [filterMember, setFilterMember] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  let filteredTasks = archivedTasks;
  if (filterMember !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.memberId === filterMember);
  }
  if (filterCategory !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.category === filterCategory);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.done || '').toLowerCase().includes(q) ||
      (t.completionNotes || '').toLowerCase().includes(q)
    );
  }

  // Sort by archivedAt desc (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) =>
    new Date(b.archivedAt) - new Date(a.archivedAt)
  );

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">アーカイブ</h2>
            <p className="text-sm text-gray-500">{archivedTasks.length}件の完了済みタスク</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {archivedTasks.length > 0 && (
        <div className="space-y-3 mb-4">
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="タスクを検索..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Member filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterMember('all')}
              className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
                filterMember === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全メンバー
            </button>
            {MEMBERS.map(member => {
              const count = archivedTasks.filter(t => t.memberId === member.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={member.id}
                  onClick={() => setFilterMember(member.id)}
                  className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
                    filterMember === member.id ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={filterMember === member.id ? { backgroundColor: member.color } : { backgroundColor: `${member.color}20`, color: member.color }}
                >
                  {member.nameJa} ({count})
                </button>
              );
            })}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
                filterCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全カテゴリー
            </button>
            {CATEGORIES.map(cat => {
              const count = archivedTasks.filter(t => t.category === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
                    filterCategory === cat.id ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={filterCategory === cat.id ? { backgroundColor: cat.color } : { backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Archived tasks list */}
      {sortedTasks.length > 0 ? (
        <div className="space-y-3">
          {sortedTasks.map(task => {
            const member = MEMBERS.find(m => m.id === task.memberId);
            const category = CATEGORIES.find(c => c.id === task.category);
            const taskType = TASK_TYPES.find(t => t.id === task.taskType);

            return (
              <div key={task.id} className="bg-white rounded-xl border border-emerald-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {member && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.nameJa}
                        </span>
                      )}
                      {category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {category.label}
                        </span>
                      )}
                      {taskType && (
                        <span className="text-xs text-gray-500">
                          {taskType.icon} {taskType.label}
                        </span>
                      )}
                      {/* Priority stars */}
                      {task.priority && (
                        <span className="inline-flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`text-xs ${star <= task.priority ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </span>
                      )}
                    </div>
                    {/* Title + checkmark */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-emerald-500">✓</span>
                      <h3 className="text-sm font-semibold text-gray-700">{task.title || '(無題)'}</h3>
                    </div>
                    {/* Progress */}
                    <div className="mb-2 max-w-xs">
                      <ProgressBar progress={task.progress} delta={null} />
                    </div>
                    {/* Completion notes */}
                    {task.completionNotes && (
                      <div className="bg-emerald-50 rounded-lg px-2 py-1.5 mb-2">
                        <span className="text-xs text-emerald-700 font-medium">完了内容:</span>
                        <p className="text-xs text-emerald-600 mt-0.5">{task.completionNotes}</p>
                      </div>
                    )}
                    {/* Done summary */}
                    {task.done && (
                      <p className="text-xs text-gray-500 mb-1 line-clamp-2">
                        <span className="font-medium text-gray-600">実施: </span>{task.done}
                      </p>
                    )}
                    {/* Archive date */}
                    <p className="text-xs text-gray-400">
                      アーカイブ日: {formatDate(task.archivedAt)}
                      {task.createdAt && <span className="ml-2">作成日: {formatDate(task.createdAt)}</span>}
                    </p>
                  </div>
                  {/* Action button */}
                  <div className="ml-3 flex-shrink-0">
                    <button
                      onClick={() => restoreFromArchive(task.id)}
                      className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      復元
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {archivedTasks.length > 0 ? '検索条件に一致するタスクがありません' : 'アーカイブは空です'}
          </p>
          <p className="text-xs text-gray-400 mt-1">完了したタスクをアーカイブすると、ここに表示されます</p>
        </div>
      )}
    </div>
  );
}
