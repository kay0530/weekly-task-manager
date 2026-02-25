import { useTaskContext } from '../context/TaskContext';

export default function ConnectionStatus() {
  const { connectionStatus } = useTaskContext();

  if (connectionStatus === 'online') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        同期中
      </span>
    );
  }

  if (connectionStatus === 'offline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        オフライン
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
      接続中...
    </span>
  );
}
