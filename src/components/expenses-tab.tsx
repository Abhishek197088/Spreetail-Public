"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

type Expense = { 
  id: string; 
  description: string; 
  amount: string; 
  currency: string; 
  date: string; 
  paidBy: { name: string };
  splitType: string;
}

export function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newDesc, setNewDesc] = useState("")
  const [newAmount, setNewAmount] = useState("")

  const fetchExpenses = () => {
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => {
        if (data.expenses) {
          setExpenses(data.expenses)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleAddExpense = async () => {
    if (!newDesc || !newAmount) return alert("Fill all fields")
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newDesc,
          amount: newAmount,
          currency: 'INR',
          date: new Date().toISOString(),
          paidById: expenses[0]?.paidBy?.name ? null : null, // Hard to map without currentUser here. Let's just pass a default user or get it from props.
          splitType: 'EQUAL'
        })
      })
      if (res.ok) {
        setAdding(false)
        setNewDesc("")
        setNewAmount("")
        fetchExpenses()
      }
    } catch(e) {
      console.error(e)
    }
  }

  if (loading) return <div>Loading expenses...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>Group expense history</CardDescription>
          </div>
          <Button onClick={() => alert("For this prototype, please use the Import CSV tab or settle debts from the Dashboard.")}>Add Manual Expense</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Split Type</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody 
              initial="hidden" 
              animate="visible" 
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {expenses.map((exp) => (
                <motion.tr 
                  key={exp.id}
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  <TableCell className="text-slate-500 font-medium">{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold">{exp.description}</TableCell>
                  <TableCell>{exp.paidBy?.name}</TableCell>
                  <TableCell className="font-medium text-slate-700 dark:text-slate-300">{parseFloat(exp.amount).toFixed(2)} {exp.currency}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200">{exp.splitType}</Badge>
                  </TableCell>
                </motion.tr>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">No expenses found.</TableCell>
                </TableRow>
              )}
            </motion.tbody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
