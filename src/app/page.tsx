"use client"

import { useEffect, useState } from "react"
import { ImportTab } from "@/components/import-tab"
import { DashboardTab } from "@/components/dashboard-tab"
import { ExpensesTab } from "@/components/expenses-tab"
import { GroupTab } from "@/components/group-tab"
import { Activity, LayoutDashboard, Receipt, FileUp, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type User = { id: string; name: string }

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'import' | 'group'>('dashboard')

  // Fetch users for login mock
  useEffect(() => {
    fetch('/api/group')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users)
          // Default to first user if none selected
          if (!currentUser && data.users.length > 0) {
            setCurrentUser(data.users[0])
          }
        }
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative overflow-hidden">
      {/* Top Navbar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 w-full border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Shared Expenses</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 py-1 px-3 rounded-full">
              <Users className="h-4 w-4 text-muted-foreground" />
              <select 
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const u = users.find(u => u.id === e.target.value)
                  if (u) setCurrentUser(u)
                }}
              >
                <option value="" disabled>Select User (Login)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>Acting as: {u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 z-10">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground'}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-white dark:bg-slate-900 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground'}`}
          >
            <Receipt className="h-4 w-4" />
            <span>Expenses</span>
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'import' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground'}`}
          >
            <FileUp className="h-4 w-4" />
            <span>Import Data</span>
          </button>
          <button 
            onClick={() => setActiveTab('group')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'group' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground'}`}
          >
            <Users className="h-4 w-4" />
            <span>Group Members</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && <DashboardTab currentUser={currentUser} />}
            {activeTab === 'expenses' && <ExpensesTab />}
            {activeTab === 'import' && <ImportTab />}
            {activeTab === 'group' && <GroupTab />}
          </motion.div>
        </AnimatePresence>
        
      </main>
    </div>
  )
}
