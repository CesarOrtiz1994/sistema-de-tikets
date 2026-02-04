interface ChatTypingIndicatorProps {
  users: string[];
}

export default function ChatTypingIndicator({ users }: ChatTypingIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  const displayText = users.length === 1
    ? `${users[0]} está escribiendo...`
    : users.length === 2
    ? `${users[0]} y ${users[1]} están escribiendo...`
    : `${users[0]} y ${users.length - 1} más están escribiendo...`;

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <span className="italic font-medium">{displayText}</span>
      </div>
    </div>
  );
}
