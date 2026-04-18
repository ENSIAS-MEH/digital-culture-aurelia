import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { ChatSession, ChatMessage } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'

const SUGGESTIONS = [
  'What are my top spending categories?',
  'Show me my biggest expenses last month',
  'Am I spending more than I earn?',
  'Which transactions look unusual?',
]

export default function Chat() {
  const [sessions, setSessions]             = useState<ChatSession[]>([])
  const [activeId, setActiveId]             = useState<string | null>(null)
  const [messages, setMessages]             = useState<ChatMessage[]>([])
  const [input, setInput]                   = useState('')
  const [thinking, setThinking]             = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/chat/sessions')
      .then(r => {
        setSessions(r.data)
        if (r.data[0]) selectSession(r.data[0].id)
      })
      .finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const selectSession = (id: string) => {
    setActiveId(id)
    setLoadingMessages(true)
    setMessages([])
    api.get(`/chat/sessions/${id}/messages`)
      .then(r => setMessages(r.data))
      .finally(() => setLoadingMessages(false))
  }

  const createSession = async (): Promise<string> => {
    const { data } = await api.post('/chat/sessions')
    setSessions(s => [data, ...s])
    setActiveId(data.id)
    setMessages([])
    return data.id as string
  }

  const send = async (text?: string, sessionId?: string) => {
    const content = (text ?? input).trim()
    const sid = sessionId ?? activeId
    if (!content || thinking || !sid) return
    setInput('')

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages(m => [...m, userMsg])
    setThinking(true)

    try {
      const { data } = await api.post(`/chat/sessions/${sid}/messages`, { content })
      setMessages(m => [...m, data])
      // Refresh sessions list so title updates appear
      api.get('/chat/sessions').then(r => setSessions(r.data))
    } catch {
      setMessages(m => [...m, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'AI service is unavailable. Please try again later.',
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setThinking(false)
    }
  }

  const handleSuggestion = async (s: string) => {
    if (activeId) {
      send(s)
    } else {
      const sid = await createSession()
      send(s, sid)
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-5rem)] flex gap-4">
      {/* Sessions sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0">
        <GlassCard className="flex-1 p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-aurelia-primary/15">
            <Button variant="ghost" fullWidth onClick={createSession} className="text-xs py-2">
              <Plus size={14} />New conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loadingSessions ? (
              <div className="p-3 space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : sessions.map(s => (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`w-full text-left px-4 py-2.5 text-sm truncate transition-all duration-150 cursor-pointer flex items-center gap-2
                  ${activeId === s.id
                    ? 'bg-aurelia-primary/20 text-aurelia-text'
                    : 'text-aurelia-muted hover:text-aurelia-text hover:bg-aurelia-primary/10'}`}
              >
                <MessageSquare size={13} className="shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </aside>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <GlassCard className="flex-1 p-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {!activeId ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <MessageSquare size={40} className="text-aurelia-primary/40" />
                <p className="text-aurelia-muted text-sm">Select or start a conversation</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="text-left text-xs text-aurelia-muted border border-aurelia-primary/20 rounded-xl px-3 py-2.5 hover:bg-aurelia-primary/10 hover:text-aurelia-text transition-all duration-150 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-3/4" />)}
              </div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.role === 'user'
                              ? 'bg-aurelia-primary text-white rounded-tr-sm'
                              : 'border border-aurelia-primary/20 text-aurelia-text rounded-tl-sm'}`}
                          style={msg.role === 'assistant' ? { background: 'rgba(124,58,237,0.1)' } : undefined}
                        >
                          {msg.content}
                        </div>
                        {msg.sources && <Sources raw={msg.sources} />}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {thinking && (
                  <div className="flex justify-start">
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3 border border-aurelia-primary/20"
                      style={{ background: 'rgba(124,58,237,0.1)' }}
                    >
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-aurelia-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-aurelia-primary/15">
            {!activeId && (
              <div className="grid grid-cols-2 gap-2 mb-3 lg:hidden">
                {SUGGESTIONS.slice(0, 2).map(s => (
                  <button key={s} onClick={() => handleSuggestion(s)}
                    className="text-left text-xs text-aurelia-muted border border-aurelia-primary/20 rounded-xl px-3 py-2 hover:bg-aurelia-primary/10 cursor-pointer transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={e => { e.preventDefault(); send() }}
              className="flex gap-2 items-end"
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about your finances…"
                rows={1}
                className="flex-1 resize-none rounded-xl bg-aurelia-surface border border-aurelia-primary/30 px-4 py-3 text-sm text-aurelia-text placeholder-aurelia-muted focus:outline-none focus:ring-2 focus:ring-aurelia-primary/60 transition-all duration-200 max-h-32"
              />
              <Button type="submit" disabled={!input.trim() || thinking || !activeId}>
                <Send size={16} />
              </Button>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function Sources({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false)
  let sources: any[] = []
  try { sources = JSON.parse(raw) } catch { return null }
  if (!sources.length) return null

  return (
    <div className="text-xs text-aurelia-muted">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 cursor-pointer hover:text-aurelia-text transition-colors">
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {sources.map((s, i) => (
            <div key={i} className="border border-aurelia-primary/20 rounded-lg px-3 py-2 text-aurelia-muted"
              style={{ background: 'rgba(124,58,237,0.05)' }}>
              <p className="font-medium text-aurelia-text/70">{s.source}</p>
              <p className="line-clamp-2 mt-0.5">{s.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
