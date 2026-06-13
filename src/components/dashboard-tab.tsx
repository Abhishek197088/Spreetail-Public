"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

type User = { id: string; name: string }
type Balance = { userId: string; netAmount: number }
type Debt = { fromUserId: string; toUserId: string; amount: number }
type Expense = { id: string; description: string; amount: string; currency: string; date: string; paidById: string; participants: any[] }

export function DashboardTab({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<User[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  const [breakdownData, setBreakdownData] = useState<{ expenses: Expense[] } | null>(null)
  const [viewingBreakdown, setViewingBreakdown] = useState(false)
  const [settling, setSettling] = useState<string | null>(null)

  const fetchGroupData = () => {
    fetch('/api/group')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users)
          setBalances(data.balances)
          setDebts(data.simplifiedDebts)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchGroupData()
  }, [])

  const fetchBreakdown = async () => {
    if (!currentUser) return
    setViewingBreakdown(true)
    try {
      const res = await fetch(`/api/expenses?userId=${currentUser.id}`)
      const data = await res.json()
      setBreakdownData(data)
    } catch(e) {
      console.error(e)
    }
  }

  const handleSettleDebt = async (debt: Debt) => {
    if (!currentUser) return
    setSettling(debt.toUserId)
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidById: debt.fromUserId,
          paidToId: debt.toUserId,
          amount: debt.amount,
          currency: 'INR',
          date: new Date().toISOString(),
          notes: 'Settled via Dashboard'
        })
      })
      if (res.ok) {
        fetchGroupData()
        alert('Debt successfully settled!')
      }
    } catch(e) {
      console.error(e)
      alert('Failed to settle debt.')
    } finally {
      setSettling(null)
    }
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Please select a user from the top menu to view your dashboard.
        </CardContent>
      </Card>
    )
  }

  if (loading) return <div>Loading dashboard...</div>

  const userBalance = balances.find(b => b.userId === currentUser.id)?.netAmount || 0
  const iOwe = debts.filter(d => d.fromUserId === currentUser.id)
  const owesMe = debts.filter(d => d.toUserId === currentUser.id)

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="col-span-1">
          <Card className="h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Net Balance</CardTitle>
              <CardDescription>Your overall standing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-extrabold ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-gradient' : 'text-gray-600'}`}>
                {userBalance > 0 ? '+' : ''}{userBalance.toFixed(2)} INR
              </div>
              <Button variant="link" className="mt-4 p-0 h-auto font-medium" onClick={fetchBreakdown}>
                View exact expense breakdown
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="col-span-1 md:col-span-2">
          <Card className="h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Settlements (Who pays whom)</CardTitle>
              <CardDescription>Simplified debts to minimize transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {iOwe.length === 0 && owesMe.length === 0 && (
                <p className="text-muted-foreground font-medium">You are completely settled up! 🎉</p>
              )}
              
              <motion.ul 
                initial="hidden" 
                animate="visible" 
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="space-y-3"
              >
                {iOwe.map((d, i) => (
                  <motion.li 
                    variants={{ hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                    key={`owe-${i}`} 
                    className="flex justify-between items-center bg-red-50/80 dark:bg-red-950/40 p-4 rounded-xl border border-red-100 dark:border-red-900 shadow-sm transition-all hover:shadow-md"
                  >
                    <div>
                      <span className="text-red-900 dark:text-red-200 block">You owe <strong className="font-bold">{getUserName(d.toUserId)}</strong></span>
                      <span className="font-black text-lg text-red-600 dark:text-red-400">{d.amount.toFixed(2)} INR</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSettleDebt(d)} 
                      disabled={settling === d.toUserId}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-sm"
                    >
                      {settling === d.toUserId ? 'Processing...' : 'Settle Now'}
                    </Button>
                  </motion.li>
                ))}
                {owesMe.map((d, i) => (
                  <motion.li 
                    variants={{ hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                    key={`owed-${i}`} 
                    className="flex justify-between items-center bg-green-50/80 dark:bg-green-950/40 p-4 rounded-xl border border-green-100 dark:border-green-900 shadow-sm transition-all hover:shadow-md"
                  >
                    <span className="text-green-900 dark:text-green-200"><strong className="font-bold">{getUserName(d.fromUserId)}</strong> owes you</span>
                    <span className="font-black text-lg text-green-600 dark:text-green-400">{d.amount.toFixed(2)} INR</span>
                  </motion.li>
                ))}
              </motion.ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {viewingBreakdown && breakdownData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <CardTitle>Your Expense Breakdown</CardTitle>
              <CardDescription>Every expense that contributes to your balance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>You Paid</TableHead>
                    <TableHead>Your Share</TableHead>
                    <TableHead>Net Effect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownData.expenses.map(exp => {
                    const youPaid = exp.paidById === currentUser.id ? parseFloat(exp.amount) : 0;
                    const participant = exp.participants.find((p: any) => p.userId === currentUser.id);
                    const yourShare = participant ? parseFloat(participant.owed) : 0;
                    const net = youPaid - yourShare;
                    
                    if (youPaid === 0 && yourShare === 0) return null; // Shouldn't happen based on API filter, but safe

                    return (
                      <TableRow key={exp.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-500">{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{exp.description}</TableCell>
                        <TableCell className="text-green-600 font-medium">{youPaid > 0 ? `+${youPaid.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-red-600 font-medium">{yourShare > 0 ? `-${yourShare.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className={`font-bold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-600' : ''}`}>{net > 0 ? `+${net.toFixed(2)}` : net.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Button variant="outline" className="mt-6 rounded-full px-6 shadow-sm hover:shadow-md transition-shadow" onClick={() => setViewingBreakdown(false)}>Close Breakdown</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
