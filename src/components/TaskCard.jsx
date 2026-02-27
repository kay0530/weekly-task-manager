import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORIES, TASK_TYPES } from '../data/members';
import { formatWeekKey } from '../data/initialData';
import { useTaskContext } from '../context/TaskContext';
import ProgressBar from './ProgressBar';

function PriorityStars({ value }) {
  return (
    <span className="inline-flex items-center" title={`優先順位: ${value}/5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`text-xs ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function DueDateBadge({ dueDate }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  let colorClass = 'text-gray-500 bg-gray-100';
  if (diffDays < 0) colorClass = 'text-red-700 bg-red-100';
  else if (diffDays === 0) colorClass = 'text-orange-700 bg-orange-100';
  else if (diffDays <= 3) colorClass = 'text-yellow-700 bg-yellow-100';

  const formatted = `${due.getMonth() + 1}/${due.getDate()}`;
  const label = diffDays < 0 ? `${formatted} (${Math.abs(diffDays)}日超過)`
    : diffDays === 0 ? `${formatted} (今日)`
    : diffDays <= 7 ? `${formatted} (残${diffDays}日)`
    : formatted;

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass} flex items-center gap-0.5`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {label}
    </span>
  );
}

export function SortableTaskCard({ task, onEdit, isDragEnabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'opacity-40 z-10' : ''}`}
    >
      {/* Drag handle */}
      {isDragEnabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition"
          title="ドラッグして並べ替え"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>
      )}
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  );
}

export default function TaskCard({ task, onEdit }) {
  const { deleteTask, archiveTask, updateTask, getProgressDelta } = useTaskContext();
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORIES.find(c => c.id === task.category);
  const taskType = TASK_TYPES.find(t => t.id === task.taskType);
  const isRoutine = task.taskType === 'routine';
  const isDone = task.progress >= 100;
  const delta = getProgressDelta(task);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition animate-fade-in">
      <div className="p-4">
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {/* Category badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: category?.color || '#94a3b8' }}
            >
              {category?.label || 'その他'}
            </span>
            {/* Task type badge */}
            {taskType && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                style={{ backgroundColor: `${taskType.color}20`, color: taskType.color }}
              >
                {taskType.icon} {taskType.label}
              </span>
            )}
            {/* Priority stars */}
            {task.priority && <PriorityStars value={task.priority} />}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Archive button (visible when progress >= 100%) */}
            {task.progress >= 100 && (
              <button
                onClick={() => { if (confirm('このタスクをアーカイブしますか？')) archiveTask(task.id); }}
                className="p-1 text-gray-400 hover:text-emerald-600 transition cursor-pointer"
                title="アーカイブ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            )}
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
              onClick={() => { if (confirm('このタスクをゴミ箱に移動しますか？')) deleteTask(task.id); }}
              className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
              title="ゴミ箱へ移動"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title + Due date row */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">{task.title || '(無題)'}</h3>
          <DueDateBadge dueDate={task.dueDate} />
        </div>

        {/* Progress bar or Routine toggle */}
        <div className="mb-3">
          {isRoutine ? (
            <button
              type="button"
              onClick={() => updateTask(task.id, { progress: isDone ? 0 : 100 })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                isDone
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {isDone ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {isDone ? '実施済み' : '未実施'}
            </button>
          ) : (
            <ProgressBar progress={task.progress} delta={delta} />
          )}
        </div>

        {/* Done summary (always visible if present) */}
        {task.done && (
          <div className="mb-2">
            <span className="text-xs text-green-700 font-medium">実施したこと:</span>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{task.done}</p>
          </div>
        )}

        {/* Completion notes (visible when 100%) */}
        {task.progress >= 100 && task.completionNotes && (
          <div className="mb-2 bg-emerald-50 rounded-lg px-2 py-1.5">
            <span className="text-xs text-emerald-700 font-medium">✓ 完了内容:</span>
            <p className="text-xs text-emerald-600 mt-0.5">{task.completionNotes}</p>
          </div>
        )}

        {/* Quick indicators row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {task.issues && (
            <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">⚠ 課題あり</span>
          )}
          {task.consultation && (
            <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">💬 相談あり</span>
          )}
          {task.relatedUrls?.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">🔗 {task.relatedUrls.length}件</span>
          )}
          {task.attachments?.length > 0 && (
            <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">📎 {task.attachments.length}件</span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          {expanded ? '▲ 閉じる' : '▼ 詳細を表示'}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
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
            {task.remarks && (
              <div>
                <span className="text-xs text-gray-500 font-medium">備考:</span>
                <p className="text-xs text-gray-600 mt-0.5">{task.remarks}</p>
              </div>
            )}

            {/* Related URLs */}
            {task.relatedUrls?.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 font-medium">関連URL:</span>
                <div className="mt-1 space-y-0.5">
                  {task.relatedUrls.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {item.label || item.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments?.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 font-medium">添付ファイル:</span>
                <div className="mt-1 space-y-1">
                  {task.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.data}
                      download={att.name}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-gray-50 rounded px-2 py-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {att.name}
                      <span className="text-gray-400 ml-1">({formatSize(att.size)})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly History */}
            {Object.keys(task.weeklyHistory || {}).length > 0 && (
              <div>
                <span className="text-xs text-gray-500 font-medium">週次履歴:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(task.weeklyHistory).sort().slice(-6).map(([week, data]) => (
                    <span key={week} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {formatWeekKey(week)}: {isRoutine ? (data.progress >= 100 ? '実施済み' : '未実施') : `${data.progress}%`}
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
