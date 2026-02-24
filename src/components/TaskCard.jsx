import { useState } from 'react';
import { CATEGORIES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import ProgressBar from './ProgressBar';

export default function TaskCard({ task, onEdit }) {
  const { deleteTask, getProgressDelta } = useTaskContext();
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORIES.find(c => c.id === task.category);
  const delta = getProgressDelta(task);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition animate-fade-in">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: category?.color || '#94a3b8' }}
            >
              {category?.label || 'その他'}
            </span>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title || '(無題)'}</h3>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-gray-400 hover:text-blue-600 transition cursor-pointer"
              title="編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => { if (confirm('このタスクを削除しますか？')) deleteTask(task.id); }}
              className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
              title="削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <ProgressBar progress={task.progress} delta={delta} />
        </div>

        {task.done && (
          <div className="mb-2">
            <span className="text-xs text-green-700 font-medium">実施したこと:</span>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{task.done}</p>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          {expanded ? '▲ 閉じる' : '▼ 詳細を表示'}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {task.notDone && (
              <div>
                <span className="text-xs text-red-600 font-medium">出来なかったこと:</span>
                <p className="text-xs text-gray-600 mt-0.5">{task.notDone}</p>
                {task.notDoneReason && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">理由: {task.notDoneReason}</p>
                )}
              </div>
            )}
            {task.issues && (
              <div>
                <span className="text-xs text-orange-600 font-medium">課題:</span>
                <p className="text-xs text-gray-600 mt-0.5">{task.issues}</p>
              </div>
            )}
            {task.consultation && (
              <div>
                <span className="text-xs text-purple-600 font-medium">相談事項:</span>
                <p className="text-xs text-gray-600 mt-0.5">{task.consultation}</p>
              </div>
            )}
            {Object.keys(task.weeklyHistory || {}).length > 0 && (
              <div>
                <span className="text-xs text-gray-500 font-medium">週次履歴:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(task.weeklyHistory).sort().slice(-6).map(([week, data]) => (
                    <span key={week} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {week}: {data.progress}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
