"use client"

import { useState } from "react"
import { UploadCloud, FileWarning, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

type Anomaly = {
  id: string
  rowNumber: number
  type: string
  description: string
  suggestedAction: string
}

export function ImportTab() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [importSuccess, setImportSuccess] = useState<{inserted: number} | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      
      if (data.jobId) {
        setJobId(data.jobId)
        fetchAnomalies(data.jobId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const fetchAnomalies = async (id: string) => {
    try {
      const res = await fetch(`/api/import?jobId=${id}`)
      const data = await res.json()
      setAnomalies(data.anomalies)
    } catch (error) {
      console.error(error)
    }
  }

  const handleProceed = async () => {
    if (!file || !jobId) return
    setIsConfirming(true)
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("jobId", jobId)

    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setImportSuccess({ inserted: data.inserted })
        setAnomalies([])
        setJobId(null)
      } else {
        alert("Error: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error(error)
      alert("Failed to confirm import.")
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card className="border-dashed border-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all border-indigo-200 dark:border-indigo-800">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl text-gradient font-bold">Import CSV</CardTitle>
          <CardDescription>Upload your Splitwise or custom expense export</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-10">
          <label htmlFor="file-upload" className="cursor-pointer group flex flex-col items-center">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }} 
              whileTap={{ scale: 0.9 }}
              className="h-24 w-24 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200/80 dark:group-hover:bg-indigo-800/50 transition-colors shadow-inner"
            >
              <UploadCloud className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span className="mt-4 text-sm font-medium">{file ? file.name : "Click to select file"}</span>
            <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
          <Button 
            className="mt-8 w-full max-w-sm rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md transition-all hover:shadow-lg" 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? "Analyzing Data..." : "Upload & Analyze"}
          </Button>
        </CardContent>
      </Card>

      {importSuccess && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg border-green-200 dark:border-green-900 bg-green-50/90 dark:bg-green-950/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                <CheckCircle2 className="mr-2 h-6 w-6" /> 
                Import Successful!
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-500 font-medium">
                Successfully imported {importSuccess.inserted} valid records. 
                <Button variant="link" className="ml-2 font-bold" onClick={() => setImportSuccess(null)}>Import another file</Button>
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {anomalies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-2xl border-red-200 dark:border-red-900 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600 dark:text-red-400">
              <FileWarning className="mr-2 h-6 w-6" /> 
              Import Anomalies Detected
            </CardTitle>
            <CardDescription>
              We found {anomalies.length} potential issues with your dataset. Please review them before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Row</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Suggested Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly) => (
                  <TableRow key={anomaly.id}>
                    <TableCell className="font-medium">{anomaly.rowNumber}</TableCell>
                    <TableCell>
                      <Badge variant={anomaly.type === 'ERROR' ? 'destructive' : anomaly.type === 'WARNING' ? 'secondary' : 'outline'}>
                        {anomaly.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{anomaly.description}</TableCell>
                    <TableCell className="text-muted-foreground">{anomaly.suggestedAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-8 flex justify-end space-x-4">
              <Button variant="outline" className="rounded-full px-6" onClick={() => { setAnomalies([]); setFile(null); setJobId(null); }}>Cancel Import</Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full px-8 shadow-md"
                onClick={handleProceed}
                disabled={isConfirming}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isConfirming ? "Processing..." : "Proceed Anyway"}
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
