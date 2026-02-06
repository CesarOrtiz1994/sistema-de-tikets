interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export default function UnreadBadge({ count, className = '' }: UnreadBadgeProps) {
  if (count === 0) return null;

  // Limitar a 99+ para números grandes
  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
    >
      {displayCount}
    </span>
  );
}
