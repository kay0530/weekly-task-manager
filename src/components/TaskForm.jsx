import { useState, useEffect } from 'react';
import { MEMBERS, CATEGORIES, TASK_TYPES, PRIORITY_LEVELS } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import RichTextEditor from './RichTextEditor';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-xl cursor-pointer transition-transform hover:scale-110"
        >
          <span className={star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        </button>
      ))}
      <span className="text-xs text-gray-500 ml-2">
        {PRIORITY_LEVELS.find(p => p.value === (hover || value))?.label || ''}
      </span>
    </div>
  );
}

function UrlList({ urls, onChange }) {
  const addUrl = () => onChange([...urls, { label: '', url: '' }]);
  const removeUrl = (idx) => onChange(urls.filter((_, i) => i !== idx));
  const updateUrl = (idx, field, val) => {
    const updated = urls.map((u, i) => i === idx ? { ...u, [field]: val } : u);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {urls.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            value={item.label}
            onChange={e => updateUrl(idx, 'label', e.target.value)}
            placeholder="リンク名"
            className="w-1/3 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="url"
            value={item.url}
            onChange={e => updateUrl(idx, 'url', e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => removeUrl(idx)}
            className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addUrl}
        className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        URLを追加
      </button>
    </div>
  );
}

function AttachmentList({ attachments, onChange }) {
  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} は2MBを超えています。2MB以下のファイルを選択してください。`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result,
          addedAt: new Date().toISOString(),
        };
        onChange(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    onChange(prev => prev.filter(a => a.id !== id));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {attachments.map(att => (
        <div key={att.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm text-gray-700 truncate flex-1">{att.name}</span>
          <span className="text-xs text-gray-400">{formatSize(att.size)}</span>
          <button
            type="button"
            onClick={() => removeAttachment(att.id)}
            className="p-0.5 text-red-400 hover:text-red-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <label className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        ファイルを追加（2MB以下）
        <input type="file" multiple onChange={handleFile} className="hidden" />
      </label>
    </div>
  );
}

export default function TaskForm({ task, defaultMemberId, onClose }) {
  const { addTask, updateTask } = useTaskContext();
  const isEditing = !!task;

  const [form, setForm] = useState({
    memberId: task?.memberId || defaultMemberId || MEMBERS[0].id,
    category: task?.category || CATEGORIES[0].id,
    taskType: task?.taskType || 'project',
    title: task?.title || '',
    priority: task?.priority || 3,
    dueDate: task?.dueDate || '',
    progress: task?.progress || 0,
    done: task?.done || '',
    notDone: task?.notDone || '',
    notDoneReason: task?.notDoneReason || '',
    issues: task?.issues || '',
    consultation: task?.consultation || '',
    completionNotes: task?.completionNotes || '',
    remarks: task?.remarks || '',
    relatedUrls: task?.relatedUrls || [],
    attachments: task?.attachments || [],
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="p-6">
          {/* Header */}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* === Section 1: Basic Info === */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">基本情報</h3>

              {/* Row: Member, Category, Task Type */}
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">属性</label>
                  <div className="flex gap-2">
                    {TASK_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          set('taskType', type.id);
                          // Snap progress to 0 or 100 when switching to routine
                          if (type.id === 'routine') {
                            setForm(prev => ({ ...prev, taskType: type.id, progress: prev.progress >= 50 ? 100 : 0 }));
                          }
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition cursor-pointer ${
                          form.taskType === type.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task Title */}
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

              {/* Row: Priority, Due Date */}
              <div className={`grid ${form.taskType === 'routine' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">優先順位</label>
                  <StarRating value={form.priority} onChange={(v) => set('priority', v)} />
                </div>
                {form.taskType !== 'routine' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => set('dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* === Section 2: Progress === */}
            {form.taskType === 'routine' ? (
              <div className="bg-emerald-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-emerald-800 mb-2">実施状況</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => set('progress', 100)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      form.progress >= 100
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    実施済み
                  </button>
                  <button
                    type="button"
                    onClick={() => set('progress', 0)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      form.progress < 100
                        ? 'bg-gray-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    未実施
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  進捗: <span className="text-blue-600 font-bold text-lg">{form.progress}%</span>
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
                <div className="flex justify-between text-xs text-blue-400 mt-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
            )}

            {/* === Section 3: Weekly Report === */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">週次報告</h3>

              {/* Done */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    実施したこと
                  </span>
                </label>
                <RichTextEditor
                  value={form.done}
                  onChange={(val) => set('done', val)}
                  rows={2}
                  placeholder="今週実施した内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Not Done */}
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    出来なかったこと
                  </span>
                </label>
                <RichTextEditor
                  value={form.notDone}
                  onChange={(val) => set('notDone', val)}
                  rows={2}
                  placeholder="出来なかった内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-red-400 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-300"></span>
                    理由
                  </span>
                </label>
                <RichTextEditor
                  value={form.notDoneReason}
                  onChange={(val) => set('notDoneReason', val)}
                  rows={2}
                  placeholder="出来なかった理由..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400"
                />
              </div>

              {/* Issues */}
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    課題
                  </span>
                </label>
                <RichTextEditor
                  value={form.issues}
                  onChange={(val) => set('issues', val)}
                  rows={2}
                  placeholder="現在の課題..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Consultation */}
              <div>
                <label className="block text-sm font-medium text-purple-600 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    相談事項
                  </span>
                </label>
                <RichTextEditor
                  value={form.consultation}
                  onChange={(val) => set('consultation', val)}
                  rows={2}
                  placeholder="相談したいこと..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* === Section 4: Additional Details === */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">詳細・補足</h3>

              {/* Completion Notes */}
              {form.progress >= 100 && (
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      完了内容
                    </span>
                  </label>
                  <textarea
                    value={form.completionNotes}
                    onChange={(e) => set('completionNotes', e.target.value)}
                    rows={2}
                    placeholder="完了した内容の詳細..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    備考
                  </span>
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => set('remarks', e.target.value)}
                  rows={2}
                  placeholder="メモ・補足事項..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              {/* Related URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    関連URL
                  </span>
                </label>
                <UrlList urls={form.relatedUrls} onChange={(v) => set('relatedUrls', v)} />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    添付ファイル
                  </span>
                </label>
                <AttachmentList
                  attachments={form.attachments}
                  onChange={(updater) => {
                    if (typeof updater === 'function') {
                      setForm(prev => ({ ...prev, attachments: updater(prev.attachments) }));
                    } else {
                      set('attachments', updater);
                    }
                  }}
                />
              </div>
            </div>

            {/* Submit Buttons */}
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
