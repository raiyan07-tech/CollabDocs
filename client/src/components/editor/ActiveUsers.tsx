import React from 'react';
import { ActiveUser } from '../../types';

interface ActiveUsersProps {
  users: ActiveUser[];
}

export const ActiveUsers: React.FC<ActiveUsersProps> = ({ users }) => {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5 overflow-hidden">
        {users.map((user, idx) => (
          <div
            key={user.id || idx}
            className="inline-block relative group"
            title={`${user.name} (${user.role.toLowerCase()})`}
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold uppercase ring-2 ring-white dark:ring-gray-900 shadow-sm transition-transform hover:scale-110 hover:z-20 cursor-pointer"
              style={{ backgroundColor: user.color || '#6366F1' }}
            >
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            {/* Tooltip */}
            <div className="absolute top-9 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] font-medium py-1 px-2 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
              {user.name} ({user.role})
            </div>
          </div>
        ))}
      </div>
      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline-block">
        {users.length} {users.length === 1 ? 'collaborator' : 'collaborators'}
      </span>
    </div>
  );
};
