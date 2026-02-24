import { MEMBERS, CATEGORIES, TASK_TYPES } from '../data/members';
import { useTaskContext } from '../context/TaskContext';
import { MemberAvatar } from './Sidebar';
import ProgressBar from './ProgressBar';

export default function Dashboard({ onSelectMember }) {
  const { tasks } = useTaskContext();

  const getMemberStats = (memberId) => {
    const memberTasks = tasks.filter(t => t.memberId === memberId);
    const count = memberTasks.length;
    const avg = count > 0 ? Math.round(memberTasks.reduce((s, t) => s + t.progress, 0) / count) : 0;
    const completed = memberTasks.filter(t => t.progress >= 100).length;
    const hasIssues = memberTasks.filter(t => t.issues).length;
    const hasConsultation = memberTasks.filter(t => t.consultation).length;
    const overdue = memberTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.progress < 100;
    }).length;
    return { count, avg, completed, hasIssues, hasConsultation, overdue };
  };

  const getCategoryStats = (catId) => {
    const catTasks = tasks.filter(t => t.category === catId);
    const count = catTasks.length;
    const avg = count > 0 ? Math.round(catTasks.reduce((s, t) => s + t.progress, 0) / count) : 0;
    return { count, avg };
  };

  const totalTasks = tasks.length;
  const totalAvg = totalTasks > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / totalTasks) : 0;
  const totalCompleted = tasks.filter(t => t.progress >= 100).length;
  const totalOverdue = tasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date() && t.progress < 100;
  }).length;
  const projectCount = tasks.filter(t => t.taskType === 'project').length;
  const routineCount = tasks.filter(t => t.taskType === 'routine').length;

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">総タスク数</p>
          <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">平均進捗</p>
          <p className="text-2xl font-bold text-blue-600">{totalAvg}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">完了タスク</p>
          <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">期日超過</p>
          <p className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{totalOverdue}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">📋 プロジェクト</p>
          <p className="text-2xl font-bold text-blue-500">{projectCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">🔄 ルーティン</p>
          <p className="text-2xl font-bold text-emerald-500">{routineCount}</p>
        </div>
      </div>

      {/* Member Overview */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">メンバー別進捗</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {MEMBERS.map(member => {
          const stats = getMemberStats(member.id);
          return (
            <div
              key={member.id}
              onClick={() => onSelectMember(member.id)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <MemberAvatar member={member} size="md" />
                <div>
                  <h4 className="font-semibold text-gray-900">{member.nameJa}</h4>
                  <p className="text-xs text-gray-500">{member.nameEn}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-sm text-gray-500">{stats.count}件</span>
                  <span className="text-xs text-gray-400 block">{stats.completed}件完了</span>
                </div>
              </div>
              <ProgressBar progress={stats.avg} delta={null} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {stats.hasIssues > 0 && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">⚠ 課題: {stats.hasIssues}件</span>
                )}
                {stats.hasConsultation > 0 && (
                  <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">💬 相談: {stats.hasConsultation}件</span>
                )}
                {stats.overdue > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">🕐 期日超過: {stats.overdue}件</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Overview */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリー別進捗</h3>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const stats = getCategoryStats(cat.id);
            if (stats.count === 0) return null;
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium min-w-[140px] text-center"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </span>
                <div className="flex-1">
                  <ProgressBar progress={stats.avg} delta={null} size="sm" />
                </div>
                <span className="text-xs text-gray-500 min-w-[30px] text-right">{stats.count}件</span>
              </div>
            );
          })}
          {CATEGORIES.every(cat => tasks.filter(t => t.category === cat.id).length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">タスクがまだありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
