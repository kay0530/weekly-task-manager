import { useState, useEffect } from 'react';
import { MEMBERS, CATEGORIES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';

export default function TaskForm({ task, defaultMemberId, onClose }) {
  const { addTask, updateTask } = useTaskContext();
  const isEditing = !!task;

  const [form, setForm] = useState({
    memberId: task?.memberId || defaultMemberId || MEMBERS[0].id,
    category: task?.category || CATEGORIES[0].id,
    title: task?.title || '',
    progress: task?.progress || 0,
    done: task?.done || '',
    notDone: task?.notDone || '',
    notDoneReason: task?.notDoneReason || '',
    issues: task?.issues || '',
    consultation: task?.consultation || '',
  });

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateTask(task.id, form);
    } else {
      addTask(form);
    }
    onClose();
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'タスク編集' : '新規タスク作成'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <select
                  value={form.memberId}
                  onChange={(e) => set('memberId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MEMBERS.map(m => (
                    <option key={m.id} value={m.id}>{m.nameJa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="タスクの名前を入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                進捗: <span className="text-blue-600 font-bold">{form.progress}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={(e) => set('progress', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">実施したこと</label>
              <textarea
                value={form.done}
                onChange={(e) => set('done', e.target.value)}
                rows={2}
                placeholder="今週実施した内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">出来なかったこと</label>
                <textarea
                  value={form.notDone}
                  onChange={(e) => set('notDone', e.target.value)}
                  rows={2}
                  placeholder="出来なかった内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-400 mb-1">理由</label>
                <textarea
                  value={form.notDoneReason}
                  onChange={(e) => set('notDoneReason', e.target.value)}
                  rows={2}
                  placeholder="出来なかった理由..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-600 mb-1">課題</label>
              <textarea
                value={form.issues}
                onChange={(e) => set('issues', e.target.value)}
                rows={2}
                placeholder="現在の課題..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-600 mb-1">相談事項</label>
              <textarea
                value={form.consultation}
                onChange={(e) => set('consultation', e.target.value)}
                rows={2}
                placeholder="相談したいこと..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                {isEditing ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
