import { useEffect, useState, useRef, useCallback, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, CheckCircle, Clock, XCircle, Loader, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import type { Document } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Skeleton from '@/components/ui/Skeleton'

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; dot: string }> = {
  pending:    {
    icon:  <Clock size={14} className="text-aurelia-accent" />,
    label: 'Pending',
    dot:   'bg-aurelia-accent',
  },
  processing: {
    icon:  <Loader size={14} className="text-aurelia-secondary animate-spin" />,
    label: 'Processing',
    dot:   'bg-aurelia-secondary',
  },
  processed:  {
    icon:  <CheckCircle size={14} className="text-aurelia-success" />,
    label: 'Processed',
    dot:   'bg-aurelia-success',
  },
  failed:     {
    icon:  <XCircle size={14} className="text-aurelia-danger" />,
    label: 'Failed',
    dot:   'bg-aurelia-danger',
  },
}

const POLL_INTERVAL = 4000

export default function Documents() {
  const [docs, setDocs]           = useState<Document[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [dragOver, setDragOver]   = useState(false)
  const [error, setError]         = useState('')
  const inputRef  = useRef<HTMLInputElement>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDocs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await api.get('/documents')
      setDocs(r.data)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const hasActive = (list: Document[]) =>
    list.some(d => d.status === 'pending' || d.status === 'processing')

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  useEffect(() => {
    if (hasActive(docs)) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => fetchDocs(true), POLL_INTERVAL)
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [docs, fetchDocs])

  const uploadFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|csv)$/i)) {
      setError('Only PDF and CSV files are accepted.')
      return
    }
    setError('')
    setUploading(true)
    setProgress(0)

    const form = new FormData()
    form.append('file', file)

    try {
      await api.post('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded / (e.total ?? 1)) * 100)),
      })
      await fetchDocs()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and all its transactions?')) return
    await api.delete(`/documents/${id}`)
    setDocs(d => d.filter(x => x.id !== id))
  }

  const fmtSize = (b?: number) =>
    b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`) : ''

  const activeCount = docs.filter(d => d.status === 'pending' || d.status === 'processing').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-aurelia-text">Documents</h1>
        <p className="text-aurelia-muted text-sm mt-1">Upload bank statements and invoices (PDF or CSV)</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer select-none
          ${dragOver
            ? 'border-aurelia-primary bg-aurelia-primary/10 scale-[1.01]'
            : uploading
              ? 'border-aurelia-primary/50 bg-aurelia-primary/5 cursor-not-allowed'
              : 'border-aurelia-primary/30 hover:border-aurelia-primary/60 hover:bg-aurelia-primary/5'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          className="hidden"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
        {uploading
          ? <Loader size={36} className="mx-auto mb-3 text-aurelia-primary animate-spin" />
          : <Upload size={36} className="mx-auto mb-3 text-aurelia-primary/60" />}
        <p className="text-aurelia-text font-medium">
          {uploading ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-aurelia-muted text-sm mt-1">PDF or CSV · Max 20 MB</p>

        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-aurelia-primary/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-aurelia-muted mt-1.5">{progress}%</p>
          </div>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-aurelia-danger bg-aurelia-danger/10 border border-aurelia-danger/30 rounded-xl px-4 py-3"
        >
          {error}
        </motion.p>
      )}

      {/* Documents list */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-aurelia-primary/15 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-aurelia-text">
            Your documents
            {docs.length > 0 && (
              <span className="ml-2 text-xs text-aurelia-muted font-normal">({docs.length})</span>
            )}
          </h2>
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-aurelia-secondary">
              <RefreshCw size={12} className="animate-spin" />
              <span>Processing {activeCount} file{activeCount !== 1 ? 's' : ''}…</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={28} className="mx-auto mb-3 text-aurelia-primary/30" />
            <p className="text-aurelia-muted text-sm">No documents yet.</p>
            <p className="text-aurelia-muted/60 text-xs mt-1">Upload your first bank statement above.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {docs.map(doc => {
              const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-4 px-6 py-4 border-b border-aurelia-primary/10 last:border-0 hover:bg-aurelia-primary/5 transition-colors duration-150"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(124,58,237,0.12)' }}>
                    <FileText size={17} className="text-aurelia-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-aurelia-text truncate font-medium">{doc.originalName}</p>
                    <p className="text-xs text-aurelia-muted mt-0.5">
                      {fmtSize(doc.fileSize)}{doc.fileSize ? ' · ' : ''}{new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 min-w-[96px] justify-end">
                    {cfg.icon}
                    <span className={`text-xs ${doc.status === 'processed' ? 'text-aurelia-success' : doc.status === 'failed' ? 'text-aurelia-danger' : 'text-aurelia-muted'}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="cursor-pointer p-1.5 rounded-lg text-aurelia-muted hover:text-aurelia-danger hover:bg-aurelia-danger/10 transition-all duration-150 shrink-0"
                    aria-label="Delete document"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </GlassCard>
    </div>
  )
}
