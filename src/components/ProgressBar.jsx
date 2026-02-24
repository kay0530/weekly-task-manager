export default function ProgressBar({ progress, delta, size = 'md' }) {
  const getColor = (p) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-blue-500';
    if (p >= 25) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor(progress)} progress-bar-fill rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 min-w-[40px] text-right">
        {progress}%
      </span>
      {delta !== null && delta !== undefined && (
        <span className={`text-xs font-medium min-w-[42px] text-right ${
          delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-400'
        }`}>
          {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '±0%'}
        </span>
      )}
    </div>
  );
}
