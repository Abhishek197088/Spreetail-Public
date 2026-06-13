"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

type User = { id: string; name: string; email: string }
type Member = { id: string; user: User; joinedAt: string; leftAt: string | null }

export function GroupTab() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/group')
      .then(res => res.json())
      .then(data => {
        if (data.group && data.group.members) {
          setMembers(data.group.members)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading group members...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle>Manage Group: Flatmates</CardTitle>
          <CardDescription>View and manage group members and their timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead>Left At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <TableCell className="font-semibold">{member.user.name}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{member.leftAt ? new Date(member.leftAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    {member.leftAt ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
