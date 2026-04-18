import { useEffect, useState, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, CheckCircle, Clock, XCircle, Loader } from 'lucide-react'
import { api } from '@/lib/api'
import type { Document } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Skeleton from '@/components/ui/Skeleton'

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock     size={15} className="text-aurelia-accent"   />,
  processing: <Loader    size={15} className="text-aurelia-secondary animate-spin" />,
  processed:  <CheckCircle size={15} className="text-aurelia-success"  />,
  failed:     <XCircle   size={15} className="text-aurelia-danger"   />,
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', processed: 'Processed', failed: 'Failed',
}

export default function Documents() {
  const [docs, setDocs]           = useState<Document[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [dragOver, setDragOver]   = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = () =>
    api.get('/documents').then(r => setDocs(r.data)).finally(() => setLoading(false))

  useEffect(() => { fetchDocs() }, [])

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
          rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer
          ${dragOver
            ? 'border-aurelia-primary bg-aurelia-primary/10'
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
        <Upload size={36} className="mx-auto mb-3 text-aurelia-primary/60" />
        <p className="text-aurelia-text font-medium">
          {dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-aurelia-muted text-sm mt-1">PDF or CSV · Max 20 MB</p>

        {uploading && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-aurelia-primary/20 overflow-hidden">
              <motion.div
                className="h-full bg-aurelia-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-aurelia-muted mt-1">{progress}%</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-aurelia-danger bg-aurelia-danger/10 border border-aurelia-danger/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Documents list */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-aurelia-primary/15">
          <h2 className="font-heading font-semibold text-aurelia-text">
            Your documents
            {docs.length > 0 && <span className="ml-2 text-xs text-aurelia-muted font-normal">({docs.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center text-aurelia-muted text-sm">
            No documents yet. Upload your first bank statement above.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {docs.map(doc => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 px-6 py-4 border-b border-aurelia-primary/10 last:border-0 hover:bg-aurelia-primary/5 transition-colors"
              >
                <FileText size={20} className="text-aurelia-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aurelia-text truncate">{doc.originalName}</p>
                  <p className="text-xs text-aurelia-muted mt-0.5">
                    {fmtSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {STATUS_ICON[doc.status]}
                  <span className="text-xs text-aurelia-muted">{STATUS_LABEL[doc.status]}</span>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="cursor-pointer p-1.5 rounded-lg text-aurelia-muted hover:text-aurelia-danger hover:bg-aurelia-danger/10 transition-all duration-150"
                  aria-label="Delete document"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </GlassCard>
    </div>
  )
}
