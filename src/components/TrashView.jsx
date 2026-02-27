import { useState } from 'react';
import { MEMBERS, CATEGORIES, TASK_TYPES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import ProgressBar from './ProgressBar';

export default function TrashView({ selectedMember }) {
  const { deletedTasks, restoreFromTrash, permanentlyDelete, emptyTrash } = useTaskContext();
  const [filterMember, setFilterMember] = useState('all');
  const currentMember = MEMBERS.find(m => m.id === selectedMember);
  const isManager = currentMember?.role === 'manager';

  const filteredTasks = filterMember === 'all'
    ? deletedTasks
    : deletedTasks.filter(t => t.memberId === filterMember);

  // Sort by deletedAt desc (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) =>
    new Date(b.deletedAt) - new Date(a.deletedAt)
  );

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getDaysSince = (iso) => {
    if (!iso) return 0;
    const diff = Date.now() - new Date(iso).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ゴミ箱</h2>
            <p className="text-sm text-gray-500">{deletedTasks.length}件の削除済みタスク</p>
            {!isManager && deletedTasks.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">※ 完全削除はマネージャーのみ実行できます</p>
            )}
          </div>
        </div>
        {deletedTasks.length > 0 && isManager && (
          <button
            onClick={() => { if (confirm(`ゴミ箱を空にしますか？\n${deletedTasks.length}件のタスクが完全に削除されます。この操作は取り消せません。`)) emptyTrash(); }}
            className="px-3 py-1.5 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition cursor-pointer"
          >
            🗑 ゴミ箱を空にする
          </button>
        )}
      </div>

      {/* Member filter */}
      {deletedTasks.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterMember('all')}
            className={`px-3 py-1 text-xs rounded-full transition cursor-pointer ${
              filterMember === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            すべて ({deletedTasks.length})
          </button>
          {MEMBERS.map(member => {
            const count = deletedTasks.filter(t => t.memberId === member.id).length;
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
      )}

      {/* Deleted tasks list */}
      {sortedTasks.length > 0 ? (
        <div className="space-y-3">
          {sortedTasks.map(task => {
            const member = MEMBERS.find(m => m.id === task.memberId);
            const category = CATEGORIES.find(c => c.id === task.category);
            const taskType = TASK_TYPES.find(t => t.id === task.taskType);
            const daysSince = getDaysSince(task.deletedAt);

            return (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-75 hover:opacity-100 transition">
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
                    </div>
                    {/* Title */}
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">{task.title || '(無題)'}</h3>
                    {/* Progress */}
                    <div className="mb-2 max-w-xs">
                      <ProgressBar progress={task.progress} delta={null} />
                    </div>
                    {/* Delete info */}
                    <p className="text-xs text-gray-400">
                      削除日時: {formatDate(task.deletedAt)}
                      {daysSince > 0 && <span className="ml-1">({daysSince}日前)</span>}
                    </p>
                  </div>
                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 ml-3 flex-shrink-0">
                    <button
                      onClick={() => restoreFromTrash(task.id)}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      復元
                    </button>
                    {isManager && (
                      <button
                        onClick={() => { if (confirm('このタスクを完全に削除しますか？この操作は取り消せません。')) permanentlyDelete(task.id); }}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        完全削除
                      </button>
                    )}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">ゴミ箱は空です</p>
          <p className="text-xs text-gray-400 mt-1">削除したタスクはここに表示されます</p>
        </div>
      )}
    </div>
  );
}
