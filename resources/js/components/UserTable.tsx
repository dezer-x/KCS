import React from 'react';

interface User {
  id: number;
  name: string;
  steam_id: string;
  elo: number;
  role: string;
  created_at: string;
  steam_avatar_medium?: string;
}

interface UserTableProps {
  users: User[];
  title: string;
  className?: string;
}

const UserTable: React.FC<UserTableProps> = ({ users, title, className = '' }) => {
  if (!users || users.length === 0) {
    return (
      <div className={`bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 ${className}`}>
        <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">
          {title}
        </h3>
        <div className="text-center text-gray-400 font-['Trebuchet']">
          No users found
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'user':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  return (
    <div className={`bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded ${className}`}>
      <div className="px-6 pt-6">
        <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">
          {title}
        </h3>
        <div
          className="w-[50%] h-0.5 my-4 rounded-full"
          style={{
            background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
          }}
        ></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-['Trebuchet']">
          <thead>
            <tr>
              <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">
                #
              </th>
              <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">
                User
              </th>
              <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">
                ELO
              </th>
              <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">
                Role
              </th>
              <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                <td className="py-4 px-6 text-white font-medium">
                  {index + 1}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-4">
                    {user.steam_avatar_medium && (
                      <img
                        src={user.steam_avatar_medium}
                        alt="Avatar"
                        className="w-10 h-10 rounded-lg border border-[#f79631]/20"
                      />
                    )}
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {user.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {user.steam_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-[#f79631] font-bold text-sm">
                    {user.elo.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-300 text-sm">
                  {user.created_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
