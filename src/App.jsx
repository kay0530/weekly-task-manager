import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberView from './components/MemberView';
import TrashView from './components/TrashView';
import ArchiveView from './components/ArchiveView';
import SalesforceSync from './components/SalesforceSync';
import { useTaskContext } from './context/TaskContext';
import { MEMBERS } from './data/members';

export default function App() {
  const { exportData, importData, isLoading } = useTaskContext();
  const [selectedMember, setSelectedMember] = useState(MEMBERS[0].id);
  // activeView: 'dashboard' | 'member' | 'trash' | 'archive'
  const [activeView, setActiveView] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleSelectMember = (id) => {
    setSelectedMember(id);
    setActiveView('member');
  };

  const handleShowDashboard = () => {
    setActiveView('dashboard');
  };

  const handleChangeView = (view) => {
    setActiveView(view);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (confirm(`${data.tasks?.length || 0}件のタスクをインポートしますか？\n（既存データは上書きされます）`)) {
          importData(data);
        }
      } catch {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onSelectMember={handleSelectMember} />;
      case 'member':
        return <MemberView memberId={selectedMember} />;
      case 'trash':
        return <TrashView />;
      case 'archive':
        return <ArchiveView />;
      default:
        return <Dashboard onSelectMember={handleSelectMember} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onExport={handleExport} onImport={handleImport} />
      <div className="flex">
        <Sidebar
          selectedMember={selectedMember}
          onSelectMember={handleSelectMember}
          showDashboard={activeView === 'dashboard'}
          onShowDashboard={handleShowDashboard}
          activeView={activeView}
          onChangeView={handleChangeView}
        />
        <main className="flex-1 min-h-[calc(100vh-57px)] overflow-y-auto">
          {renderMainContent()}
        </main>
        <aside className="w-72 border-l border-gray-200 bg-white p-4 h-[calc(100vh-57px)] overflow-y-auto flex-shrink-0">
          <SalesforceSync />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">クイックガイド</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 左のメンバーを選択してタスクを管理</li>
              <li>• 「タスク追加」でタスクを新規作成</li>
              <li>• 「週次保存」で進捗スナップショットを保存</li>
              <li>• 前週からの進捗増分が自動計算されます</li>
              <li>• 完了タスクは📦アーカイブへ移動可能</li>
              <li>• 削除したタスクは🗑ゴミ箱から復元可能</li>
              <li>• エクスポート/インポートでデータのバックアップ</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
