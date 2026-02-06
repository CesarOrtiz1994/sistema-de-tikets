import { useEffect, useState } from 'react';

interface ChatTypingIndicatorProps {
  users: string[];
}

export default function ChatTypingIndicator({ users }: ChatTypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (users.length > 0) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [users.length]);

  if (!isVisible && users.length === 0) {
    return null;
  }

  const displayText = users.length === 1
    ? `${users[0]} está escribiendo`
    : users.length === 2
    ? `${users[0]} y ${users[1]} están escribiendo`
    : `${users[0]} y ${users.length - 1} más están escribiendo`;

  return (
    <div 
      className={`px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-t border-blue-100 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        users.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Animación de puntos mejorada */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-2.5 py-1.5 rounded-full shadow-sm">
          <span 
            className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" 
            style={{ animationDuration: '1.4s', animationDelay: '0ms' }}
          ></span>
          <span 
            className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" 
            style={{ animationDuration: '1.4s', animationDelay: '200ms' }}
          ></span>
          <span 
            className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" 
            style={{ animationDuration: '1.4s', animationDelay: '400ms' }}
          ></span>
        </div>
        
        {/* Texto con animación de fade */}
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300 animate-fade-in">
          {displayText}
        </span>
      </div>
    </div>
  );
}
