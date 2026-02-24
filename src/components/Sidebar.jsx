import { useState } from 'react';
import { MEMBERS } from '../data/members';
import { useTaskContext } from '../context/TaskContext';

function MemberAvatar({ member, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  if (member.sfPhotoUrl && !imgError) {
    return (
      <img
        src={member.sfPhotoUrl}
        alt={member.nameJa}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: member.color }}
    >
      {member.nameJa.charAt(0)}
    </div>
  );
}

export { MemberAvatar };

export default function Sidebar({ selectedMember, onSelectMember, showDashboard, onShowDashboard }) {
  const { tasks } = useTaskContext();

  const getMemberTaskCount = (memberId) => tasks.filter(t => t.memberId === memberId).length;

  const getMemberAvgProgress = (memberId) => {
    const memberTasks = tasks.filter(t => t.memberId === memberId);
    if (memberTasks.length === 0) return 0;
    return Math.round(memberTasks.reduce((sum, t) => sum + t.progress, 0) / memberTasks.length);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-57px)] overflow-y-auto flex-shrink-0">
      <nav className="p-3">
        <button
          onClick={onShowDashboard}
          className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-2 transition cursor-pointer ${
            showDashboard ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          ダッシュボード
        </button>

        <div className="mt-4 mb-2 px-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">メンバー</h3>
        </div>

        {MEMBERS.map(member => (
          <button
            key={member.id}
            onClick={() => onSelectMember(member.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center justify-between transition cursor-pointer ${
              !showDashboard && selectedMember === member.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <MemberAvatar member={member} size="sm" />
              <div>
                <div className="text-sm font-medium">{member.nameJa}</div>
                <div className="text-xs text-gray-400">{getMemberTaskCount(member.id)}件</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{getMemberAvgProgress(member.id)}%</div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
