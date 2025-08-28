'use client'

import { useActiveUser, useSession, signOut } from '@/lib/auth-client'

export default function TopNavigation() {
  const { data: session } = useSession()
  const { activeUserId, switchUser, availableUsers } = useActiveUser()

  if (!session?.user) {
    return null
  }

  const activeUser = availableUsers.find(u => u.id === activeUserId) || availableUsers[0]

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-slate-900">Habit Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* User chips - for now just show current user, expand later for households */}
            {activeUser && (
              <div 
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-slate-100 border border-slate-200"
                style={{ backgroundColor: activeUser.color ? `${activeUser.color}20` : undefined }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: activeUser.color || '#64748b' }}
                >
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {activeUser.name}
                </span>
              </div>
            )}
            
            {/* Sign out button */}
            <button
              onClick={() => signOut()}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}