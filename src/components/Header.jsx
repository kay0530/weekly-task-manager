import { getWeekKey } from '../data/initialData';
import { useTaskContext } from '../context/TaskContext';

export default function Header({ onExport, onImport }) {
  const { saveWeeklySnapshot } = useTaskContext();
  const weekKey = getWeekKey();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Weekly Task Manager</h1>
            <p className="text-xs text-gray-500">{weekKey}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => saveWeeklySnapshot()}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer"
          >
            週次保存
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            エクスポート
          </button>
          <label className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer">
            インポート
            <input type="file" accept=".json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>
    </header>
  );
}
