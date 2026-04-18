import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, TrendingUp, MessageSquare, Shield,
  FileText, BarChart2, ArrowRight, Quote,
} from 'lucide-react'
import { WebGLShader } from '@/components/ui/web-gl-shader'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'

/* ─── data ──────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: FileText,
    label: 'Smart Document Parsing',
    desc: 'Upload any bank statement — PDF or CSV. Every transaction extracted automatically, no manual entry.',
  },
  {
    icon: TrendingUp,
    label: 'Spending Forecasts',
    desc: 'Weighted regression predicts next month\'s spend per category, corrected for partial-month data.',
  },
  {
    icon: BarChart2,
    label: 'Anomaly Detection',
    desc: 'Transactions beyond 2 standard deviations from your category average are flagged instantly.',
  },
  {
    icon: MessageSquare,
    label: 'AI Financial Chat',
    desc: 'Ask questions about your spending in plain language, backed by retrieval-augmented generation.',
  },
  {
    icon: Shield,
    label: 'Fully Private',
    desc: 'Everything runs on your machine. Your statements and conversations never leave your device.',
  },
  {
    icon: Zap,
    label: 'Zero API Costs',
    desc: 'Powered by Ollama and local open-weight models. No subscriptions, no per-token fees.',
  },
]

const testimonials = [
  {
    name: 'Camille R.',
    role: 'Freelance Designer',
    avatar: 'CR',
    quote:
      'The anomaly alerts caught a double-charge from my cloud subscription that I completely missed for three months. Saved me €90 immediately.',
  },
  {
    name: 'Théo M.',
    role: 'Software Engineer',
    avatar: 'TM',
    quote:
      'Having a private LLM answer questions about my own bank statements without touching any external API is exactly what I needed.',
  },
  {
    name: 'Inès B.',
    role: 'PhD Student',
    avatar: 'IB',
    quote:
      'The spending forecast predicted my transport budget within €8 for two consecutive months. Now I plan around it instead of guessing.',
  },
]

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  },
}

/* ─── component ─────────────────────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative w-full overflow-x-hidden" style={{ background: '#06060F', color: '#F5F3FF' }}>

      {/* ── 1. Hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
        <WebGLShader />

        {/* Overlay: transparent top, solid #06060F at bottom for seamless blend */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(6,6,15,0.4) 0%, rgba(6,6,15,0.62) 50%, rgba(6,6,15,1) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Glass logo — no filled purple */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
          >
            <Zap size={28} fill="white" className="text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 font-heading font-extrabold tracking-tighter text-white"
            style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 1.02 }}
          >
            Aurelia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-2 max-w-xl text-base leading-relaxed md:text-lg"
            style={{ color: 'rgba(245,243,255,0.6)' }}
          >
            AI-powered personal finance — forecasts, anomaly alerts, and a private chat advisor
            that runs entirely on your own machine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
            className="mb-8 flex items-center gap-1.5"
          >
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-xs text-green-400">All systems running</p>
          </motion.div>

          {/* CTAs — glass only, white text, no purple fill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <LiquidButton
              size="xl"
              className="rounded-full border border-white/25 font-semibold text-white"
              onClick={() => navigate('/register')}
            >
              Get Started <ArrowRight size={14} className="ml-1" />
            </LiquidButton>
            <LiquidButton
              size="xl"
              className="rounded-full border border-white/10 text-white/70"
              onClick={() => navigate('/login')}
            >
              Sign In
            </LiquidButton>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(245,243,255,0.35)' }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            className="h-4 w-px rounded-full"
            style={{ background: 'rgba(245,243,255,0.2)' }}
          />
        </motion.div>
      </section>

      {/* ── 2. Scroll animation — real dashboard screenshot ───────── */}
      <section style={{ background: '#06060F' }}>
        <ContainerScroll
          titleComponent={
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-medium" style={{ color: '#9090B0' }}>
                Everything in one place
              </p>
              <h2
                className="font-heading font-extrabold tracking-tight text-white"
                style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', lineHeight: 1.1 }}
              >
                Your finances,{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #c4b5fd, #e879f9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  understood
                </span>
              </h2>
              <p className="mt-2 mx-auto max-w-lg text-sm" style={{ color: '#9090B0' }}>
                From raw bank statements to a clean dashboard with charts, categories,
                forecasts, and anomaly detection — all in one view.
              </p>
            </div>
          }
        >
          <img
            src="/dashboard-preview.png"
            alt="Aurelia dashboard — spending analytics, forecasts and transactions"
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        </ContainerScroll>
      </section>

      {/* ── 3. Features grid ─────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20" style={{ background: '#06060F' }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10 text-center"
          >
            <p className="mb-1.5 text-sm font-medium" style={{ color: '#9090B0' }}>Built for clarity</p>
            <h2
              className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)' }}
            >
              Every feature you actually need
            </h2>
          </motion.div>

          <motion.div
            variants={stagger.container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={stagger.item}
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(11,10,30,0.7)',
                  border: '1px solid rgba(124,58,237,0.13)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <Icon size={16} style={{ color: '#c4b5fd' }} />
                </div>
                <h3 className="mb-1.5 font-heading font-semibold text-white text-sm">{label}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#9090B0' }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. Testimonials ─── glassmorphism cards ───────────────── */}
      <section className="px-4 py-14 md:py-20" style={{ background: '#0B0A1E' }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10 text-center"
          >
            <p className="mb-1.5 text-sm font-medium" style={{ color: '#9090B0' }}>
              Trusted by users who value their privacy
            </p>
            <h2
              className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)' }}
            >
              What people are saying
            </h2>
          </motion.div>

          <motion.div
            variants={stagger.container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            {testimonials.map(({ name, role, avatar, quote }) => (
              <motion.div
                key={name}
                variants={stagger.item}
                className="relative flex flex-col justify-between rounded-2xl p-5"
                style={{
                  background: 'rgba(17,15,39,0.65)',
                  border: '1px solid rgba(124,58,237,0.18)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                {/* Glass shine top edge */}
                <div
                  className="absolute top-0 left-4 right-4 h-px rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(196,181,253,0.25), transparent)' }}
                />

                <Quote size={20} className="mb-3 shrink-0" style={{ color: 'rgba(196,181,253,0.25)' }} />
                <p className="flex-1 text-sm leading-relaxed" style={{ color: '#C4B5FD' }}>{quote}</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.35)' }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{name}</p>
                    <p className="text-xs" style={{ color: '#9090B0' }}>{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 5. Bottom CTA ────────────────────────────────────────── */}
      <section className="px-4 py-20 md:py-24 text-center" style={{ background: '#06060F' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-2 text-sm font-medium" style={{ color: '#9090B0' }}>
            Open source · Self-hosted · Free forever
          </p>
          <h2
            className="mb-4 font-heading font-extrabold tracking-tight text-white"
            style={{ fontSize: 'clamp(1.8rem, 5.5vw, 3.5rem)', lineHeight: 1.08 }}
          >
            Ready to take control
            <br />of your finances?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm" style={{ color: '#9090B0' }}>
            Create a free account and upload your first statement in under two minutes.
            Your data stays on your machine — always.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LiquidButton
              size="xl"
              className="rounded-full border border-white/25 font-semibold text-white"
              onClick={() => navigate('/register')}
            >
              Create Free Account <ArrowRight size={14} className="ml-1" />
            </LiquidButton>
            <LiquidButton
              size="xl"
              className="rounded-full border border-white/10 text-white/65"
              onClick={() => navigate('/login')}
            >
              Already have an account
            </LiquidButton>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="py-6 text-center text-xs"
        style={{ borderTop: '1px solid rgba(124,58,237,0.1)', color: '#9090B0', background: '#06060F' }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Zap size={11} fill="#9090B0" className="opacity-50" />
          <span className="font-heading font-bold text-white/35">Aurelia</span>
        </div>
        <p>AI-powered · Private by design · Open source</p>
      </footer>
    </div>
  )
}
