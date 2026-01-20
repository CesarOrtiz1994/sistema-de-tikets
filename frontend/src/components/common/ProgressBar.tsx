interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export default function ProgressBar({
  percentage,
  color = 'bg-purple-600',
  height = 'h-2',
  showLabel = true,
  animated = true
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} ${animated ? 'transition-all duration-300' : ''} rounded-full`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
          {clampedPercentage}%
        </div>
      )}
    </div>
  );
}
