import { useState, useRef, useEffect } from "react";
import {
  Play, Pause, Volume2, Maximize, ChevronRight, BookOpen, Clock, Download,
  MessageSquare, Search, Bell, Upload, Settings, Bookmark, History,
  LayoutDashboard, Share2, Copy, FileText, Zap, Brain, Star, Youtube,
  Send, TrendingUp, BarChart2, Lightbulb, ArrowRight, Github, Linkedin,
  Mail, X, SkipBack, SkipForward, PlayCircle, Sparkles, GraduationCap,
  Building2, Code2, FlaskConical, Globe, HelpCircle, LayersIcon,
} from "lucide-react";
import { checkBackend, getYouTubeMetadata, getYouTubeTranscript, generateAINotes } from "../services/api";

/* ─── Warm cream · notebook palette ────────────────────────── */
const C = {
  /* grounds */
  bg:        "#F5F0E6",   /* warm parchment page */
  bgAlt:     "#EDE7D9",   /* sidebar / secondary surface */
  bgRule:    "#E8E0CE",   /* notebook rule line tint */
  card:      "#FFFFFF",
  cardWarm:  "#FDFAF4",   /* slightly warm white card */

  /* greens */
  green:     "#1A4731",   /* dark forest — primary accent */
  greenMid:  "#2D6A4F",   /* medium forest */
  greenSage: "#52796F",   /* sage — secondary */
  greenDim:  "rgba(26,71,49,0.10)",
  greenGlow: "rgba(26,71,49,0.18)",
  greenLight:"#D8EFE5",

  /* warm tones */
  amber:     "#92400E",
  amberDim:  "rgba(146,64,14,0.10)",
  clay:      "#78350F",
  rust:      "#C2410C",

  /* text */
  text:      "#1C1814",
  textMuted: "#6B5E4E",
  textDim:   "#A09282",

  /* structure */
  border:    "rgba(26,71,49,0.10)",
  rule:      "rgba(26,71,49,0.06)",
  shadow:    "rgba(26,71,49,0.08)",
};

/* ─── shared style helpers ──────────────────────────────────── */
const card = (extra: object = {}) => ({
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow: `0 2px 12px ${C.shadow}, 0 1px 3px rgba(0,0,0,0.04)`,
  ...extra,
});

const pillBtn = (bg: string, fg: string, border?: string) => ({
  background: bg, color: fg,
  border: border ? `1.5px solid ${border}` : "none",
  borderRadius: 999, padding: "10px 22px",
  fontSize: 13.5, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 7,
  transition: "all 0.18s ease", fontFamily: "Inter, sans-serif",
  letterSpacing: "0.01em",
});

const mono = { fontFamily: "JetBrains Mono, monospace" };
const hand = { fontFamily: "Caveat, cursive" };

/* ─── data ───────────────────────────────────────────────────── */
const noteColors = [C.green, C.greenSage, C.amber];

const liveNotes = [
  {
    ts: "02:10", heading: "Introduction to Neural Networks",
    bullets: [
      "Neural Networks mimic the human brain's layered architecture",
      "Built from interconnected artificial neurons with adjustable weights",
      "Training happens via forward pass + backpropagation",
    ],
    def: { label: "Definition", text: "A Neural Network is a computational model inspired by biological neurons, organised in layers to progressively transform raw input into learned representations." },
    tip: { label: "Exam Tip", text: "Definition is frequently asked — memorise the biological analogy." },
    difficulty: "Beginner",
  },
  {
    ts: "05:42", heading: "Transformer Architecture",
    bullets: [
      "Encoder-Decoder structure processes sequences in parallel",
      "Self-Attention assigns importance weights across all token pairs",
      "Multi-head attention captures diverse linguistic relationships",
    ],
    def: { label: "Definition", text: 'Transformers (Vaswani et al., 2017 — "Attention Is All You Need") process all tokens simultaneously via self-attention, removing the sequential bottleneck of RNNs.' },
    tip: { label: "Interview Tip", text: "Know all three components: attention, positional encoding, feed-forward sublayers." },
    difficulty: "Intermediate",
  },
  {
    ts: "12:18", heading: "Backpropagation & Gradient Descent",
    bullets: [
      "Chain rule propagates error gradients layer by layer",
      "Learning rate controls the step size of each weight update",
      "Vanishing gradients still affect very deep vanilla networks",
    ],
    def: { label: "Key Concept", text: "Gradient Descent iteratively adjusts network weights by stepping in the direction that reduces the loss function most steeply." },
    tip: { label: "Interview Tip", text: "Explain why vanishing gradients hurt RNNs but not Transformers — it shows depth." },
    difficulty: "Advanced",
  },
];

const transcriptLines = [
  { ts: "00:00", speaker: "Dr. Chen", text: "Welcome to today's lecture on Deep Learning fundamentals — neural networks, attention, and modern transformer architectures." },
  { ts: "00:45", speaker: "Dr. Chen", text: "Before diving in, let me explain what artificial neurons are and how they mirror the biological neurons in our brains." },
  { ts: "02:10", speaker: "Dr. Chen", text: "A neural network is a computational graph. Each neuron takes inputs, multiplies by weights, sums them, then passes through an activation function." },
  { ts: "04:33", speaker: "Dr. Chen", text: "Now for the interesting part — how do we learn those weights? We use backpropagation combined with stochastic gradient descent." },
  { ts: "05:42", speaker: "Dr. Chen", text: 'The Transformer was introduced in the 2017 paper "Attention Is All You Need". It fundamentally transformed natural language processing.' },
];

const keyConcepts = [
  { term: "Attention Mechanism", def: "Allows the model to dynamically focus on the most relevant input tokens when producing each output.", related: ["Transformers", "BERT", "GPT-4"], color: C.green },
  { term: "Backpropagation", def: "Algorithm that computes gradients of the loss function with respect to each network weight using the chain rule.", related: ["Gradient Descent", "Chain Rule"], color: C.greenSage },
  { term: "Embedding Layer", def: "Maps discrete vocabulary tokens to dense continuous vector representations in high-dimensional space.", related: ["Word2Vec", "Tokenisation"], color: C.amber },
  { term: "Softmax Function", def: "Converts a vector of raw logits into a probability distribution that sums to exactly 1.", related: ["Classification", "Attention Weights"], color: C.greenMid },
];

const chatMessages = [
  { role: "user", text: "Summarise the Transformer architecture section" },
  { role: "assistant", text: 'Great question! The Transformer (Vaswani et al., 2017 — "Attention Is All You Need") uses an Encoder-Decoder structure. Its core innovation is Self-Attention, which lets each token attend to all other tokens at once — removing the sequential bottleneck of RNNs.\n\nKey components:\n• Multi-Head Attention — captures diverse relationships\n• Positional Encoding — injects sequence order\n• Feed-Forward sublayers — pointwise transformations\n• Layer Norm + Residual connections — stable training' },
];

const suggestedPrompts = [
  "Summarise Chapter 2", "Explain in simple language",
  "Generate revision notes", "Create MCQs",
  "Generate flashcards", "What exam questions are likely?",
];

const features = [
  { icon: Zap, title: "Live AI Notes", desc: "Notes stream in real-time as your video plays — no pausing needed.", color: C.green },
  { icon: Clock, title: "Timestamp Navigation", desc: "Click any note to jump to that exact moment in the recording.", color: C.greenSage },
  { icon: Youtube, title: "YouTube + Meetings", desc: "Works with YouTube URLs, Zoom, Google Meet, and uploaded files.", color: C.amber },
  { icon: MessageSquare, title: "AI Chat", desc: "Ask questions, get summaries, explanations, and quiz yourself.", color: C.green },
  { icon: FileText, title: "PDF Export", desc: "Download beautifully typeset notes with timestamps and highlights.", color: C.greenMid },
  { icon: History, title: "Learning History", desc: "All sessions saved — revisit any lecture exactly where you left off.", color: C.greenSage },
];

const steps = [
  { icon: Youtube, label: "Paste Video URL", sub: "YouTube or any link" },
  { icon: Volume2, label: "Extract Audio", sub: "High-fidelity extraction" },
  { icon: Brain, label: "Transcribe with Whisper", sub: "OpenAI Whisper accuracy" },
  { icon: Sparkles, label: "Generate AI Notes", sub: "GPT-4 powered insights" },
  { icon: GraduationCap, label: "Learn Faster", sub: "Retain more, study less" },
];

const useCases = [
  { icon: GraduationCap, label: "University Lectures", cat: "Students" },
  { icon: Globe, label: "Online Courses", cat: "Students" },
  { icon: Building2, label: "Zoom Meetings", cat: "Teams" },
  { icon: PlayCircle, label: "Google Meet Recordings", cat: "Teams" },
  { icon: Code2, label: "Technical Talks", cat: "Engineers" },
  { icon: FlaskConical, label: "Research Seminars", cat: "Researchers" },
];

const testimonials = [
  { name: "Priya Mehta", role: "Computer Science · IIT Delhi", avatar: "PM", text: "LectureLens completely changed how I study. I watch fully and review the AI notes after — my grades jumped a full GPA point.", stars: 5 },
  { name: "Alex Rivera", role: "Senior Engineer · Stripe", avatar: "AR", text: "I use it for every conference talk. The timestamped notes are incredible for referencing specific concepts without re-watching the whole video.", stars: 5 },
  { name: "Dr. Shreya Nair", role: "Medical Resident · AIIMS Mumbai", avatar: "SN", text: "Medical school is relentless. LectureLens helps me process lectures 2× faster — the concept extraction is perfect for board prep.", stars: 5 },
];

const recentVideos = [
  { title: "Deep Learning: Attention Mechanisms Explained", duration: "1:24:30", progress: 68, initials: "DL" },
  { title: "System Design: Building Distributed Caches", duration: "58:12", progress: 100, initials: "SD" },
  { title: "React 19 Deep Dive — New Concurrent Features", duration: "42:05", progress: 23, initials: "RE" },
];

/* ─── Logo ───────────────────────────────────────────────────── */
function Logo({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{
        width: size + 12, height: size + 12,
        background: C.green, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 10px ${C.greenGlow}`,
      }}>
        <BookOpen size={size - 2} color="#fff" strokeWidth={2.2} />
      </div>
      <span style={{ fontSize: size + 1, fontWeight: 800, color: C.text, letterSpacing: "-0.04em", fontFamily: "Inter, sans-serif" }}>
        Lecture<span style={{ color: C.green }}>Lens</span>
      </span>
    </div>
  );
}

/* ─── NoteCard ───────────────────────────────────────────────── */
function NoteCard({ note, idx, compact = false }: { note: typeof liveNotes[0]; idx: number; compact?: boolean }) {
  const accent = noteColors[idx % noteColors.length];
  const diffColor = note.difficulty === "Beginner" ? C.greenMid : note.difficulty === "Intermediate" ? C.amber : C.rust;
  return (
    <div style={{
      background: C.cardWarm,
      border: `1px solid ${C.border}`,
      borderLeft: `3.5px solid ${accent}`,
      borderRadius: 14,
      padding: compact ? "13px 15px" : "16px 18px",
      marginBottom: 10,
      boxShadow: `0 1px 8px ${C.shadow}`,
      transition: "box-shadow 0.2s ease",
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ ...mono, fontSize: 11.5, color: accent, background: `${accent}14`, padding: "3px 9px", borderRadius: 999, fontWeight: 600, letterSpacing: "0.06em" }}>{note.ts}</span>
        <span style={{ fontSize: 10.5, color: diffColor, background: `${diffColor}14`, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{note.difficulty}</span>
      </div>
      {/* heading — handwritten feel via Caveat */}
      <h4 style={{ ...hand, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 9, lineHeight: 1.2 }}>{note.heading}</h4>
      {/* bullets */}
      <ul style={{ paddingLeft: 15, margin: "0 0 11px" }}>
        {note.bullets.map((b, i) => (
          <li key={i} style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 3.5, lineHeight: 1.55 }}>{b}</li>
        ))}
      </ul>
      {/* definition box */}
      <div style={{ background: `${accent}0D`, border: `1px solid ${accent}22`, borderRadius: 10, padding: "9px 12px", marginBottom: 7 }}>
        <div style={{ fontSize: 10.5, color: accent, fontWeight: 700, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Lightbulb size={10} /> {note.def.label}
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>{note.def.text}</p>
      </div>
      {/* tip box */}
      <div style={{ background: C.amberDim, border: `1px solid ${C.amber}22`, borderRadius: 10, padding: "7px 12px" }}>
        <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 700, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={10} /> {note.tip.label}
        </div>
        <p style={{ fontSize: 12, color: C.textMuted }}>{note.tip.text}</p>
      </div>
    </div>
  );
}

/* ─── Sidebar Illustration ───────────────────────────────────── */
function StudyIllustration() {
  return (
    <div style={{ padding: "20px 16px 24px", textAlign: "center" }}>
      {/* SVG illustration */}
      <svg width="148" height="130" viewBox="0 0 148 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", margin: "0 auto 14px" }}>
        {/* ── desk surface ── */}
        <rect x="8" y="106" width="132" height="6" rx="3" fill={C.bgRule} />

        {/* ── book stack ── */}
        {/* book 3 — bottom */}
        <rect x="14" y="84" width="58" height="22" rx="4" fill="#2D6A4F" />
        <rect x="14" y="84" width="7" height="22" rx="2" fill="#1A4731" />
        <rect x="16" y="90" width="3" height="10" rx="1" fill="rgba(255,255,255,0.2)" />
        {/* book 2 — middle */}
        <rect x="18" y="65" width="52" height="21" rx="4" fill="#92400E" />
        <rect x="18" y="65" width="7" height="21" rx="2" fill="#78350F" />
        <rect x="20" y="71" width="3" height="9" rx="1" fill="rgba(255,255,255,0.18)" />
        {/* book 1 — top */}
        <rect x="22" y="48" width="46" height="19" rx="4" fill="#52796F" />
        <rect x="22" y="48" width="7" height="19" rx="2" fill="#3D5E56" />
        <rect x="24" y="53" width="3" height="9" rx="1" fill="rgba(255,255,255,0.2)" />
        {/* bookmarks sticking out */}
        <rect x="46" y="44" width="5" height="10" rx="1" fill="#FBBF24" />
        <rect x="54" y="46" width="5" height="8" rx="1" fill="#F87171" />

        {/* ── coffee cup ── */}
        {/* cup body */}
        <path d="M88 88 L92 106 L116 106 L120 88 Z" fill="#D4A574" rx="3" />
        <rect x="88" y="84" width="32" height="6" rx="3" fill="#C4956A" />
        {/* cup handle */}
        <path d="M120 91 Q132 91 132 98 Q132 105 120 105" stroke="#C4956A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* coffee surface */}
        <ellipse cx="104" cy="84" rx="16" ry="4" fill="#8B5E3C" />
        {/* steam wisps */}
        <path d="M98 78 Q96 72 98 66 Q100 60 98 54" stroke={C.bgRule} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M104 76 Q102 70 104 64 Q106 58 104 52" stroke={C.bgRule} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M110 78 Q108 72 110 66 Q112 60 110 54" stroke={C.bgRule} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* ── potted plant ── */}
        {/* pot */}
        <path d="M118 96 L114 106 L134 106 L130 96 Z" fill="#C4956A" />
        <rect x="112" y="92" width="24" height="6" rx="3" fill="#D4A574" />
        {/* soil */}
        <ellipse cx="124" cy="92" rx="12" ry="3" fill="#8B5E3C" />
        {/* stems */}
        <path d="M124 92 Q124 78 118 68" stroke={C.greenMid} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M124 92 Q124 80 130 70" stroke={C.greenMid} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M124 92 Q121 82 124 74" stroke={C.greenMid} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* leaves */}
        <ellipse cx="118" cy="67" rx="7" ry="5" fill={C.green} transform="rotate(-30 118 67)" />
        <ellipse cx="130" cy="69" rx="7" ry="5" fill={C.greenMid} transform="rotate(25 130 69)" />
        <ellipse cx="124" cy="72" rx="6" ry="4.5" fill={C.green} transform="rotate(-5 124 72)" />
        {/* leaf veins */}
        <path d="M116 67 Q119 65 121 68" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M132 69 Q129 67 127 71" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />

        {/* ── small pencil ── */}
        <rect x="72" y="100" width="3" height="18" rx="1" fill="#F59E0B" transform="rotate(-15 72 100)" />
        <polygon points="72,100 75,100 73.5,95" fill="#C2410C" transform="rotate(-15 72 100)" />
        <rect x="72" y="116" width="3" height="3" rx="0.5" fill="#FDA4AF" transform="rotate(-15 72 100)" />
      </svg>

      {/* handwritten quote */}
      <div style={{
        background: "rgba(255,255,255,0.55)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: `0 1px 6px ${C.shadow}`,
      }}>
        <p style={{ ...hand, fontSize: 16, color: C.greenMid, lineHeight: 1.45, margin: 0, fontWeight: 600 }}>
          "Keep learning,<br />keep growing."
        </p>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 28, height: 1.5, background: C.border, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════════════════════ */
function LandingPage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [hovF, setHovF] = useState<number | null>(null);
  const [hovS, setHovS] = useState<number | null>(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: C.text }}>
      {/* subtle paper grain overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% -5%, rgba(26,71,49,0.06) 0%, transparent 60%)`,
      }} />

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(245,240,230,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 52px", height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo size={19} />
        <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
          {["Features", "How It Works", "Use Cases", "GitHub"].map(item => (
            <a key={item} href="#"
              style={{ fontSize: 13.5, color: C.textMuted, textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.green)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
              {item}
            </a>
          ))}
        </div>
        <button onClick={onEnterDashboard} style={{
          ...pillBtn(C.green, "#fff"),
          boxShadow: `0 2px 12px ${C.greenGlow}`,
        }}>
          Get Started <ArrowRight size={13} />
        </button>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "96px 52px 80px", maxWidth: 1260, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 68 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: C.greenDim, border: `1.5px solid rgba(26,71,49,0.18)`,
            borderRadius: 999, padding: "5px 14px", marginBottom: 28,
            fontSize: 12.5, color: C.green, fontWeight: 700, letterSpacing: "0.04em",
          }}>
            <Sparkles size={12} /> AI-Powered Academic Notes
          </div>

          <h1 style={{
            fontFamily: "Inter, sans-serif", fontSize: 64, fontWeight: 900,
            letterSpacing: "-0.04em", lineHeight: 1.08,
            maxWidth: 800, margin: "0 auto 22px",
            color: C.text,
          }}>
            Learn Smarter with{" "}
            <span style={{ color: C.green }}>AI-Powered</span>
            {" "}Live Video Notes
          </h1>

          <p style={{ fontSize: 18, color: C.textMuted, maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.72, fontWeight: 400 }}>
            Paste any YouTube lecture or upload a meeting recording. LectureLens automatically creates timestamped notes while you watch — helping you focus on learning instead of writing.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
            <button onClick={onEnterDashboard} style={{
              ...pillBtn(C.green, "#fff"),
              padding: "13px 30px", fontSize: 14.5,
              boxShadow: `0 4px 24px ${C.greenGlow}`,
            }}>
              <Play size={15} fill="#fff" /> Start Learning
            </button>
            <button style={{
              ...pillBtn("transparent", C.text, C.border),
              padding: "13px 30px", fontSize: 14.5,
            }}>
              <PlayCircle size={15} /> Watch Demo
            </button>
          </div>
        </div>

        {/* Hero dashboard preview */}
        <div style={{
          maxWidth: 1060, margin: "0 auto",
          border: `1.5px solid ${C.border}`,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: `0 32px 80px rgba(26,71,49,0.12), 0 8px 24px rgba(0,0,0,0.06)`,
        }}>
          {/* preview top bar */}
          <div style={{
            background: C.bgAlt,
            borderBottom: `1px solid ${C.border}`,
            padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {["#EF4444","#F59E0B","#22C55E"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
            <div style={{
              flex: 1, height: 22, background: C.card,
              border: `1px solid ${C.border}`, borderRadius: 6,
              display: "flex", alignItems: "center", paddingLeft: 10, marginLeft: 8, gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.border}` }} />
              <span style={{ ...mono, fontSize: 10.5, color: C.textDim }}>lecturelens.app/dashboard</span>
            </div>
          </div>

          {/* preview content */}
          <div style={{ display: "flex", height: 460, background: C.bg }}>
            {/* left: video */}
            <div style={{ flex: "0 0 57%", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 44, background: "#FF0000", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Youtube size={28} color="#fff" />
                  </div>
                  <p style={{ color: "#666", fontSize: 12 }}>Deep Learning: Neural Networks & Transformers</p>
                </div>
                <div style={{ position: "absolute", bottom: 10, left: 12, ...mono, fontSize: 11, color: "#fff", background: "rgba(0,0,0,0.65)", padding: "3px 8px", borderRadius: 5 }}>05:42 / 1:24:30</div>
              </div>
              <div style={{ height: 3, background: "#1f2937" }}>
                <div style={{ width: "40%", height: "100%", background: C.green }} />
              </div>
              <div style={{ background: "#111", padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <SkipBack size={13} color="#666" />
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={11} fill="#fff" color="#fff" />
                </div>
                <SkipForward size={13} color="#666" />
                <Volume2 size={13} color="#666" />
                <span style={{ ...mono, fontSize: 11, color: "#555", marginLeft: "auto" }}>1.25×</span>
                <Maximize size={12} color="#555" />
              </div>
            </div>

            {/* right: live notes */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                padding: "11px 14px", borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: C.cardWarm,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Live AI Notes</span>
                </div>
                <span style={{ fontSize: 11, color: C.textDim }}>3 notes</span>
              </div>
              <div style={{ flex: 1, overflowY: "hidden", padding: "10px 12px" }}>
                {liveNotes.slice(0, 2).map((n, i) => <NoteCard key={i} note={n} idx={i} compact />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: "relative", zIndex: 1, padding: "90px 52px", maxWidth: 1260, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ ...hand, fontSize: 20, color: C.greenMid, fontWeight: 600, marginBottom: 10 }}>What you get</p>
          <h2 style={{ fontFamily: "Inter", fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", color: C.text, marginBottom: 14 }}>Everything to learn faster</h2>
          <p style={{ fontSize: 16.5, color: C.textMuted, maxWidth: 500, margin: "0 auto" }}>Six tools designed to transform passive watching into active understanding.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const isH = hovF === i;
            return (
              <div key={i}
                onMouseEnter={() => setHovF(i)}
                onMouseLeave={() => setHovF(null)}
                style={{
                  ...card(),
                  padding: "26px 26px",
                  transition: "all 0.22s ease",
                  transform: isH ? "translateY(-5px)" : "none",
                  boxShadow: isH
                    ? `0 16px 48px rgba(26,71,49,0.12), 0 4px 12px rgba(0,0,0,0.05)`
                    : `0 2px 12px ${C.shadow}`,
                  borderColor: isH ? `rgba(26,71,49,0.2)` : C.border,
                  cursor: "default",
                }}>
                <div style={{ width: 46, height: 46, background: `${f.color}12`, border: `1.5px solid ${f.color}20`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={21} color={f.color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: C.text, marginBottom: 8, letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.62 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px", background: `linear-gradient(180deg, transparent, rgba(26,71,49,0.03), transparent)` }}>
        <div style={{ maxWidth: 1260, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ ...hand, fontSize: 20, color: C.greenMid, fontWeight: 600, marginBottom: 10 }}>The process</p>
            <h2 style={{ fontFamily: "Inter", fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", color: C.text }}>How LectureLens works</h2>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isH = hovS === i;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
                  <div
                    onMouseEnter={() => setHovS(i)}
                    onMouseLeave={() => setHovS(null)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 160, textAlign: "center", cursor: "default", transition: "all 0.2s ease", transform: isH ? "translateY(-6px)" : "none" }}>
                    <div style={{
                      width: 68, height: 68,
                      background: isH ? C.green : C.card,
                      border: `1.5px solid ${isH ? C.green : C.border}`,
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                      boxShadow: isH ? `0 8px 24px ${C.greenGlow}` : `0 2px 8px ${C.shadow}`,
                      position: "relative",
                    }}>
                      <span style={{
                        position: "absolute", top: -4, right: -4,
                        width: 20, height: 20, borderRadius: "50%",
                        background: isH ? C.greenMid : C.bgAlt,
                        border: `1px solid ${C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800,
                        color: isH ? "#fff" : C.textDim,
                        transition: "all 0.2s ease",
                      }}>{i + 1}</span>
                      <Icon size={26} color={isH ? "#fff" : C.greenSage} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>{step.label}</p>
                      <p style={{ fontSize: 12, color: C.textDim }}>{step.sub}</p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", paddingTop: 22, width: 60, flexShrink: 0 }}>
                      <div style={{ flex: 1, height: 1.5, background: C.border }} />
                      <ChevronRight size={13} color={C.greenSage} style={{ flexShrink: 0 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px", maxWidth: 1260, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ ...hand, fontSize: 20, color: C.greenMid, fontWeight: 600, marginBottom: 10 }}>Who it's for</p>
          <h2 style={{ fontFamily: "Inter", fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", color: C.text }}>Built for every learner</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div key={i}
                style={{ ...card({ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, cursor: "default", transition: "all 0.18s ease" }) }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(26,71,49,0.22)`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: C.greenDim, border: `1px solid rgba(26,71,49,0.14)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={C.green} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: C.textDim, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{uc.cat}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{uc.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px", maxWidth: 1260, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ ...hand, fontSize: 20, color: C.greenMid, fontWeight: 600, marginBottom: 10 }}>Student voices</p>
          <h2 style={{ fontFamily: "Inter", fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", color: C.text }}>Loved by learners everywhere</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ ...card({ padding: "26px" }) }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {Array(t.stars).fill(0).map((_, j) => <Star key={j} size={13} color={C.amber} fill={C.amber} />)}
              </div>
              <p style={{ ...hand, fontSize: 16.5, color: C.textMuted, lineHeight: 1.65, flex: 1, marginBottom: 18 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11, paddingTop: 16, borderTop: `1px solid ${C.rule}` }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: C.green, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: "#fff",
                }}>{t.avatar}</div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{t.name}</p>
                  <p style={{ fontSize: 11.5, color: C.textDim }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px" }}>
        <div style={{
          maxWidth: 860, margin: "0 auto",
          background: C.green,
          borderRadius: 22, padding: "60px 80px", textAlign: "center",
          boxShadow: `0 24px 64px rgba(26,71,49,0.22)`,
        }}>
          <h2 style={{ fontFamily: "Inter", fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", marginBottom: 14 }}>Start learning smarter today</h2>
          <p style={{ fontSize: 16.5, color: "rgba(255,255,255,0.72)", marginBottom: 36, maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.65 }}>
            Join thousands of students and professionals who take better notes with LectureLens.
          </p>
          <button onClick={onEnterDashboard} style={{
            ...pillBtn("rgba(255,255,255,0.15)", "#fff", "rgba(255,255,255,0.3)"),
            padding: "14px 36px", fontSize: 15,
          }}>
            <Sparkles size={15} /> Try LectureLens Free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "40px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, maxWidth: 1260, margin: "0 auto" }}>
        <div>
          <Logo size={17} />
          <p style={{ ...hand, fontSize: 15, color: C.textMuted, marginTop: 6 }}>Watch. Learn. Remember.</p>
          <p style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>Made by Pari</p>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          {[
            { icon: Github, label: "Paree07", href: "https://github.com/Paree07" },
            { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/pari-4883b6362/" },
            { icon: Mail, label: "pariijust@gmail.com", href: "mailto:pariijust@gmail.com" },
          ].map(({ icon: Icon, label, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 7, color: C.textMuted, textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.green)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
              <Icon size={15} strokeWidth={1.8} /> {label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.textDim }}>© 2025 LectureLens. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════════ */
function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return "1h 24m 30s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : "", `${s}s`]
    .filter(Boolean)
    .join(" ");
}


function getYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    }
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }
    return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function normalizeAINotes(payload: any) {
  const raw = payload?.notes ?? payload?.data?.notes ?? payload?.data ?? payload;
  if (!raw) return [];

  // Backend may already return note cards/sections.
  const cardItems = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.notes)
      ? raw.notes
      : Array.isArray(raw?.sections)
        ? raw.sections
        : null;

  if (cardItems) {
    return cardItems.map((item: any, index: number) => ({
      ts: item?.ts ?? item?.timestamp ?? item?.time ?? `00:${String(index * 10).padStart(2, "0")}`,
      heading: item?.heading ?? item?.title ?? item?.topic ?? `AI Note ${index + 1}`,
      bullets: Array.isArray(item?.bullets)
        ? item.bullets
        : Array.isArray(item?.points)
          ? item.points
          : item?.summary
            ? [String(item.summary)]
            : item?.text
              ? [String(item.text)]
              : [],
      def: item?.def ?? {
        label: "Key Idea",
        text: item?.definition ?? item?.meaning ?? item?.summary ?? item?.text ?? "Generated from the lecture.",
      },
      tip: item?.tip ?? {
        label: "Study Tip",
        text: item?.exam_tip ?? item?.study_tip ?? "Review this concept from the lecture.",
      },
      difficulty: item?.difficulty ?? "Beginner",
    }));
  }

  // REAL backend shape seen in FastAPI:
  // notes: { summary, key_concepts, definitions, ... }
  if (typeof raw === "object") {
    const summary = typeof raw.summary === "string" ? raw.summary : "";
    const concepts = Array.isArray(raw.key_concepts) ? raw.key_concepts : [];
    const definitions = Array.isArray(raw.definitions) ? raw.definitions : [];
    const examTips = Array.isArray(raw.exam_tips)
      ? raw.exam_tips
      : Array.isArray(raw.study_tips)
        ? raw.study_tips
        : [];

    const cards: any[] = [];

    if (summary) {
      cards.push({
        ts: "00:00",
        heading: "Lecture Summary",
        bullets: [summary],
        def: {
          label: "Overview",
          text: concepts.length
            ? `Main concepts: ${concepts.slice(0, 4).join(", ")}`
            : "AI-generated overview of this lecture.",
        },
        tip: {
          label: "Study Tip",
          text: examTips[0] ?? "Read the summary first, then review the key concepts below.",
        },
        difficulty: "Beginner",
      });
    }

    concepts.forEach((concept: any, index: number) => {
      const conceptText =
        typeof concept === "string"
          ? concept
          : concept?.term ?? concept?.title ?? concept?.name ?? JSON.stringify(concept);

      const matchingDefinition = definitions.find((d: any) =>
        String(d?.term ?? "").toLowerCase() === String(conceptText).toLowerCase()
      );

      cards.push({
        ts: `00:${String((index + 1) * 10).padStart(2, "0")}`,
        heading: String(conceptText),
        bullets: [
          matchingDefinition?.meaning ??
          matchingDefinition?.definition ??
          `Important concept identified in the lecture: ${conceptText}`,
        ],
        def: {
          label: matchingDefinition?.term ?? "Key Concept",
          text:
            matchingDefinition?.meaning ??
            matchingDefinition?.definition ??
            String(conceptText),
        },
        tip: {
          label: "Study Tip",
          text: examTips[index] ?? "Revise this concept and connect it with the lecture summary.",
        },
        difficulty: "Intermediate",
      });
    });

    // If definitions exist but were not represented by concepts, show them too.
    definitions.forEach((d: any, index: number) => {
      const term = d?.term ?? d?.title;
      if (!term) return;
      const alreadyAdded = cards.some(
        (c: any) => String(c.heading).toLowerCase() === String(term).toLowerCase()
      );
      if (!alreadyAdded) {
        cards.push({
          ts: `01:${String(index * 10).padStart(2, "0")}`,
          heading: String(term),
          bullets: [d?.meaning ?? d?.definition ?? "Definition generated from the lecture."],
          def: {
            label: String(term),
            text: d?.meaning ?? d?.definition ?? "Definition generated from the lecture.",
          },
          tip: {
            label: "Study Tip",
            text: "Memorise the meaning and relate it to an example from the lecture.",
          },
          difficulty: "Intermediate",
        });
      }
    });

    return cards;
  }

  return [];
}

function normalizeTranscript(payload: any) {
  const raw = payload?.transcript ?? payload?.data?.transcript ?? payload?.segments ?? payload?.data ?? payload;
  if (Array.isArray(raw)) {
    return raw.map((item: any) => ({
      ts: item?.ts ?? item?.timestamp ?? item?.time ?? "00:00",
      speaker: item?.speaker ?? "Speaker",
      text: item?.text ?? item?.content ?? String(item ?? ""),
    }));
  }
  if (typeof raw === "string") {
    return [{ ts: "00:00", speaker: "Speaker", text: raw }];
  }
  return [];
}

function Dashboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"notes" | "transcript" | "concepts" | "chat">("notes");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSideNav, setActiveSideNav] = useState("dashboard");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState<any[]>([]);
  const [generatedTranscript, setGeneratedTranscript] = useState<any[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notesLanguage, setNotesLanguage] = useState("English");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBackend()
      .then((data) => {
        console.log("Backend connected:", data);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
      });
  }, []);

  const handleFileUpload = async (file: File) => {
    setSelectedFileName(file.name);
    setAnalysisError("");
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://lecturelens-production-5dec.up.railway.app/api/video/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Upload failed (${response.status})`);
      }

      setVideoData(data?.video ?? data?.metadata ?? data);
      setGeneratedNotes(normalizeAINotes(data?.notes ?? data?.video?.notes ?? []));
      setGeneratedTranscript(normalizeTranscript(data?.transcript ?? data?.video?.transcript ?? []));
      setAnalyzedUrl("");
      setActiveTab("notes");
      setActiveSideNav("dashboard");
      alert(`"${file.name}" uploaded successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "File upload failed";
      console.error("Upload failed:", error);
      setAnalysisError(message);
      alert(`Upload failed: ${message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    const cleanUrl = urlInput.trim();

    if (!cleanUrl) {
      alert("Please paste a YouTube URL");
      return;
    }

    if (!getYouTubeVideoId(cleanUrl)) {
      alert("Please paste a valid YouTube URL");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError("");
      setGeneratedNotes([]);
      setGeneratedTranscript([]);
      setNotesLoading(true);
      setTranscriptLoading(true);

      // Show the playable YouTube embed immediately.
      setAnalyzedUrl(cleanUrl);
      setIsPlaying(true);

      // Metadata, transcript and AI notes are independent requests.
      // Promise.allSettled prevents one failed endpoint from hiding successful results.
      const [metadataResult, transcriptResult, notesResult] = await Promise.allSettled([
        getYouTubeMetadata(cleanUrl),
        getYouTubeTranscript(cleanUrl),
        generateAINotes(cleanUrl),
      ]);

      if (metadataResult.status === "fulfilled") {
        const metadata = metadataResult.value;
        setVideoData(metadata?.data ?? metadata);
      } else {
        console.error("Metadata failed:", metadataResult.reason);
      }

      if (transcriptResult.status === "fulfilled") {
        setGeneratedTranscript(normalizeTranscript(transcriptResult.value));
      } else {
        console.error("Transcript failed:", transcriptResult.reason);
      }
      setTranscriptLoading(false);

      if (notesResult.status === "fulfilled") {
        const realNotes = normalizeAINotes(notesResult.value);
        console.log("REAL AI NOTES:", notesResult.value, realNotes);
        setGeneratedNotes(realNotes);
      } else {
        console.error("AI notes failed:", notesResult.reason);
      }
      setNotesLoading(false);

      const failed = [metadataResult, transcriptResult, notesResult]
        .filter(result => result.status === "rejected").length;

      if (failed === 3) {
        setAnalysisError("Backend requests failed. Check that FastAPI is running on port 8000.");
      } else if (failed > 0) {
        setAnalysisError("Video loaded, but one or more AI endpoints failed. Check the browser console and backend terminal.");
      }

      setActiveTab("notes");
    } catch (error) {
      console.error("Analyze failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Failed to connect to backend");
    } finally {
      setIsAnalyzing(false);
      setNotesLoading(false);
      setTranscriptLoading(false);
    }
  };

  const notesAsText = () => {
    return generatedNotes
      .map((note: any) => {
        const heading = note?.heading ? `${note.heading}\n` : "";
        const bullets = Array.isArray(note?.bullets)
          ? note.bullets.map((b: string) => `• ${b}`).join("\n")
          : "";
        const definition = note?.def?.text ? `\nDefinition: ${note.def.text}` : "";
        return `${heading}${bullets}${definition}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
  };

  const handleExportPDF = () => {
    const content = notesAsText();
    if (!content) {
      alert("Analyze a video first so there are notes to export.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow pop-ups, then try Export PDF again.");
      return;
    }

    const safeTitle = String(videoData?.title || "LectureLens Notes")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const safeNotes = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${safeTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 36px; color: #1f2d25; line-height: 1.6; }
            h1 { color: #1a4731; margin-bottom: 8px; }
            .meta { color: #6f756f; margin-bottom: 28px; }
            .notes { white-space: normal; }
          </style>
        </head>
        <body>
          <h1>${safeTitle}</h1>
          <div class="meta">Generated by LectureLens</div>
          <div class="notes">${safeNotes}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleCopyNotes = async () => {
    const content = notesAsText();
    if (!content) {
      alert("Analyze a video first so there are notes to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      alert("Notes copied to clipboard.");
    } catch {
      alert("Could not copy notes. Please allow clipboard permission.");
    }
  };

  const handleBookmark = () => {
    const lectureUrl = analyzedUrl || urlInput.trim();
    if (!lectureUrl) {
      alert("Analyze a video first.");
      return;
    }

    const bookmark = {
      url: lectureUrl,
      title: videoData?.title || "Saved Lecture",
      savedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("lecturelens_bookmarks") || "[]");
    const next = [bookmark, ...existing.filter((item: any) => item.url !== lectureUrl)];
    localStorage.setItem("lecturelens_bookmarks", JSON.stringify(next));
    alert("Lecture bookmarked.");
  };

  const handleShare = async () => {
    const lectureUrl = analyzedUrl || urlInput.trim() || window.location.href;
    const shareData = {
      title: videoData?.title || "LectureLens Lecture",
      text: "Check out this lecture",
      url: lectureUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(lectureUrl);
        alert("Share link copied to clipboard.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        alert("Could not share this lecture.");
      }
    }
  };

  const openGeneratedTool = async (tool: "flashcards" | "quizzes") => {
    const lectureUrl = analyzedUrl || urlInput.trim();
    if (!lectureUrl) {
      alert("Paste a YouTube URL and click Analyze first.");
      return;
    }

    setActiveSideNav(tool);
    setActiveTab("chat");
    setMessages(prev => [...prev, {
      role: "assistant",
      text: tool === "flashcards"
        ? "Generating flashcards from this lecture..."
        : "Generating a quiz from this lecture...",
    }]);

    const endpoint = tool === "flashcards"
      ? "http://127.0.0.1:8000/api/ai/flashcards"
      : "http://127.0.0.1:8000/api/ai/quiz";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lectureUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
      }

      const payload = data?.flashcards || data?.quiz || data?.questions || data?.data || data;
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `${tool === "flashcards" ? "Flashcards" : "Quiz"}:\n\n${JSON.stringify(payload, null, 2)}`,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `${tool === "flashcards" ? "Flashcards" : "Quiz"} error: ${
          error instanceof Error ? error.message : "Could not connect to backend"
        }`,
      }]);
    }
  };

  const handleSideNav = (id: string) => {
    setActiveSideNav(id);

    if (id === "dashboard") {
      setActiveTab("notes");
      return;
    }
    if (id === "chat") {
      setActiveTab("chat");
      return;
    }
    if (id === "flashcards") {
      void openGeneratedTool("flashcards");
      return;
    }
    if (id === "quizzes") {
      void openGeneratedTool("quizzes");
      return;
    }
    if (id === "bookmarks") {
      const saved = JSON.parse(localStorage.getItem("lecturelens_bookmarks") || "[]");
      alert(saved.length
        ? saved.map((b: any, i: number) => `${i + 1}. ${b.title}`).join("\n")
        : "No bookmarks saved yet.");
      return;
    }
    if (id === "downloads") {
      handleExportPDF();
      return;
    }
    if (id === "history") {
      alert("History storage is not connected yet. Current lecture remains available on the dashboard.");
      return;
    }
    if (id === "settings") {
      setShowSettings(true);
      return;
    }
  };

  const sideNavItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "history",   icon: History,         label: "History" },
    { id: "bookmarks", icon: Bookmark,         label: "Bookmarks" },
    { id: "downloads", icon: Download,         label: "Downloads" },
    { id: "chat",      icon: MessageSquare,    label: "AI Chat" },
    { id: "flashcards",icon: LayersIcon,       label: "Flashcards" },
    { id: "quizzes",   icon: HelpCircle,       label: "Quizzes" },
  ];

  const tabs = [
    { id: "notes",     label: "Live Notes",    icon: Zap },
    { id: "transcript",label: "Transcript",    icon: FileText },
    { id: "concepts",  label: "Key Concepts",  icon: Brain },
    { id: "chat",      label: "AI Chat",       icon: MessageSquare },
  ];

  const sendMessage = async () => {
    const question = chatInput.trim();
    const lectureUrl = analyzedUrl || urlInput.trim();

    if (!question || chatLoading) return;

    if (!lectureUrl || !getYouTubeVideoId(lectureUrl)) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Please paste a valid YouTube URL and click Analyze first.",
      }]);
      return;
    }

    setMessages(prev => [...prev, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lectureUrl, question }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Chat request failed (${response.status})`);
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        text: data?.answer ?? data?.data?.answer ?? "No answer was returned by the backend.",
      }]);
    } catch (error) {
      console.error("AI chat failed:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: error instanceof Error
          ? `AI Chat error: ${error.message}`
          : "AI Chat could not connect to the backend.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: C.bg, fontFamily: "Inter, sans-serif", color: C.text, overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 218, flexShrink: 0,
        background: C.bgAlt,
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
          <Logo size={17} />
        </div>

        {/* nav */}
        <nav style={{ padding: "10px 10px 8px", flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}>
          {sideNavItems.map(({ id, icon: Icon, label }) => {
            const active = activeSideNav === id;
            return (
              <button key={id} onClick={() => handleSideNav(id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 11px", borderRadius: 10,
                background: active ? "rgba(26,71,49,0.10)" : "transparent",
                border: active ? `1px solid rgba(26,71,49,0.16)` : "1px solid transparent",
                color: active ? C.green : C.textMuted,
                cursor: "pointer", marginBottom: 1.5,
                fontSize: 13.5, fontWeight: active ? 600 : 400,
                transition: "all 0.14s ease", textAlign: "left",
                fontFamily: "Inter, sans-serif",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(26,71,49,0.05)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} /> {label}
              </button>
            );
          })}

          {/* divider */}
          <div style={{ height: 1, background: C.border, margin: "10px 4px" }} />

        </nav>

        {/* profile */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, background: C.bgAlt }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>P</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Pari</p>
              <p style={{ fontSize: 11, color: C.textDim }}>pariijust@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* TOP BAR */}
        <header style={{
          height: 58, flexShrink: 0,
          background: "rgba(245,240,230,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 10, padding: "0 18px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <strong style={{ fontSize: 14, color: C.text }}>
              {analyzedUrl ? "Lecture Workspace" : "Dashboard"}
            </strong>
            <span style={{ fontSize: 11, color: C.textDim }}>
              {analyzedUrl ? "Study, review and ask questions" : "Start a new lecture analysis"}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file);
            }}
          />
          

          <div style={{ flex: 1 }} />

          {/* search */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px", maxWidth: 180, boxShadow: `0 1px 4px ${C.shadow}` }}>
            <Search size={13} color={C.textDim} />
            <input placeholder="Search..." style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 12.5, width: "100%", fontFamily: "Inter, sans-serif" }} />
          </div>

          {/* bell */}
          <button onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }} style={{ width: 34, height: 34, borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", boxShadow: `0 1px 4px ${C.shadow}` }}>
            <Bell size={14} color={C.textMuted} strokeWidth={1.8} />
            <span style={{ position: "absolute", top: 8, right: 8, width: 5.5, height: 5.5, borderRadius: "50%", background: C.green }} />
          </button>

          {/* avatar */}
          <button onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }} style={{ width: 32, height: 32, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer", boxShadow: `0 2px 8px ${C.greenGlow}`, border: "none" }}>P</button>

          {/* back */}
          <button onClick={onBack} title="Back to landing" style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textDim }}>
            <X size={13} />
          </button>
        </header>

        {showNotifications && (
          <div style={{ position: "absolute", zIndex: 50, top: 64, right: 74, width: 280, ...card({ padding: 16 }) }}>
            <strong style={{ fontSize: 14, color: C.text }}>Notifications</strong>
            <p style={{ marginTop: 12, fontSize: 12.5, color: C.textDim }}>No notifications yet.</p>
          </div>
        )}

        {showProfile && (
          <div style={{ position: "absolute", zIndex: 50, top: 64, right: 38, width: 230, ...card({ padding: 14 }) }}>
            <strong style={{ fontSize: 14, color: C.text }}>Pari</strong>
            <p style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>pariijust@gmail.com</p>
            <button onClick={() => { setShowProfile(false); setShowSettings(true); }} style={{ marginTop: 12, width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.cardWarm, cursor: "pointer", color: C.text, textAlign: "left" }}>
              Settings
            </button>
          </div>
        )}

        {analysisError && (
          <div style={{
            padding: "8px 18px",
            background: "#FFF7ED",
            borderBottom: "1px solid #FED7AA",
            color: "#9A3412",
            fontSize: 12.5,
          }}>
            {analysisError}
          </div>
        )}

        {/* CONTENT */}
        {!analyzedUrl ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "42px 28px", background: C.bg }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: C.green, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>LectureLens</p>
                <h1 style={{ fontSize: 32, color: C.text, margin: "8px 0 8px", letterSpacing: "-0.04em" }}>Turn any YouTube lecture into a study workspace.</h1>
                <p style={{ color: C.textMuted, fontSize: 14.5, lineHeight: 1.6 }}>Paste the lecture link here. After analysis, the video opens on a separate workspace with notes, transcript, key concepts and AI chat.</p>
              </div>

              <div style={{ ...card({ padding: 24, background: C.cardWarm }) }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 9 }}>YouTube lecture link</label>
                <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "0 14px", minWidth: 0 }}>
                    <Youtube size={18} color="#EF4444" />
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") void handleAnalyze(); }}
                      placeholder="Enter your youtube video link here.."
                      style={{ flex: 1, minWidth: 0, border: "none", outline: "none", padding: "15px 0", fontSize: 14, color: C.text, background: "transparent" }}
                    />
                  </div>
                  <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ ...pillBtn(C.green, "#fff"), borderRadius: 12, padding: "0 22px", opacity: isAnalyzing ? 0.7 : 1 }}>
                    <Zap size={15} /> {isAnalyzing ? "Analyzing..." : "Analyze Lecture"}
                  </button>
                </div>
                <p style={{ marginTop: 10, fontSize: 11.5, color: C.textDim }}>Long links stay here instead of crowding the workspace header.</p>
              </div>

              <div style={{ marginTop: 18, ...card({ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
                
                
              </div>

              <div style={{ marginTop: 26, padding: "18px 2px", borderTop: `1px solid ${C.border}` }}>
                <strong style={{ fontSize: 13, color: C.text }}>Recent lectures</strong>
                <p style={{ marginTop: 7, fontSize: 12.5, color: C.textDim }}>No real lecture history yet. This section will populate only when sessions are actually saved.</p>
              </div>
            </div>
          </div>
        ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* LEFT: video + recent */}
          <div style={{ flex: "0 0 57%", display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, overflow: "hidden" }}>

            {/* video player */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ background: "#0D0D0D", position: "relative" }}>
                <div style={{
                  width: "100%", aspectRatio: "16/9", maxHeight: 300,
                  background: "linear-gradient(160deg, #111 0%, #0a0a0a 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{ textAlign: "center", width: "100%", height: "100%", position: "relative" }}>
                    {analyzedUrl && getYouTubeVideoId(analyzedUrl) ? (
                      <iframe
                        key={getYouTubeVideoId(analyzedUrl)}
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(analyzedUrl)}?autoplay=1&rel=0`}
                        title={videoData?.title || "YouTube video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 72, height: 50, background: "#FF0000", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 24px rgba(255,0,0,0.25)" }}>
                          <Youtube size={30} color="#fff" />
                        </div>
                        <p style={{ color: "#555", fontSize: 13, maxWidth: 300 }}>Paste a YouTube URL and click Analyze</p>
                      </div>
                    )}
                  </div>
                  <div style={{ position: "absolute", bottom: 10, left: 12, ...mono, fontSize: 11, color: "#fff", background: "rgba(0,0,0,0.68)", padding: "3px 8px", borderRadius: 5 }}>05:42 / 1:24:30</div>
                  <div style={{ position: "absolute", top: 10, right: 10, ...mono, fontSize: 10, color: "#aaa", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 5 }}>HD 1080p</div>
                </div>
                {/* progress */}
                <div style={{ height: 3, background: "#1f2937", cursor: "pointer" }}>
                  <div style={{ width: "40%", height: "100%", background: C.green, position: "relative" }}>
                    <div style={{ position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#fff", boxShadow: "0 0 5px rgba(255,255,255,0.4)" }} />
                  </div>
                </div>
                {/* controls */}
                <div style={{ background: "#0a0a0a", padding: "8px 14px", display: "flex", alignItems: "center", gap: 13 }}>
                  <SkipBack size={14} color="#555" style={{ cursor: "pointer" }} />
                  <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: 30, height: 30, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                    {isPlaying ? <Pause size={13} fill="#fff" color="#fff" /> : <Play size={13} fill="#fff" color="#fff" />}
                  </button>
                  <SkipForward size={14} color="#555" style={{ cursor: "pointer" }} />
                  <Volume2 size={14} color="#555" />
                  <div style={{ width: 72, height: 3, background: "#333", borderRadius: 2 }}>
                    <div style={{ width: "70%", height: "100%", background: "#555", borderRadius: 2 }} />
                  </div>
                  <span style={{ ...mono, fontSize: 11, color: "#555", marginLeft: "auto" }}>1.25×</span>
                  <span style={{ ...mono, fontSize: 11, color: "#444" }}>CC</span>
                  <Maximize size={13} color="#444" style={{ cursor: "pointer" }} />
                </div>
              </div>
            </div>

            {/* video title */}
            <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: C.cardWarm }}>
              <div>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 3, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                  {videoData?.title || "Paste a YouTube URL and click Analyze"}
                </h2>
                <p style={{ fontSize: 11.5, color: C.textDim }}>
                  {videoData
                    ? `${videoData.channel || "Unknown channel"} · ${formatDuration(videoData.duration)}`
                    : "Video metadata will appear here"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {[Bookmark, Share2].map((Icon, i) => (
                  <button key={i} style={{ width: 30, height: 30, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon size={13} color={C.textMuted} strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            </div>

            {/* workspace helper */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", background: C.bg }}>
              <div style={{ ...card({ padding: 16, background: C.cardWarm }) }}>
                <strong style={{ fontSize: 13, color: C.text }}>Current lecture workspace</strong>
                <p style={{ marginTop: 6, fontSize: 12, color: C.textDim, lineHeight: 1.55 }}>
                  Use the tabs on the right for notes, transcript, concepts and AI chat. Fake recent-session cards have been removed.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: AI workspace */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* header */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.cardWarm }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <Sparkles size={13} color={C.green} />
                    <h2 style={{ ...hand, fontSize: 20, fontWeight: 700, color: C.text }}>AI Learning Workspace</h2>
                  </div>
                  <p style={{ fontSize: 11, color: C.textDim }}>Transformer Architecture · Neural Networks</p>
                </div>
                {activeTab === "notes" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                    <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>LIVE</span>
                  </div>
                )}
              </div>

              {/* tabs */}
              <div style={{ display: "flex", gap: 2, background: C.bgAlt, borderRadius: 10, padding: 3 }}>
                {tabs.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id as typeof activeTab;
                  return (
                    <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 6px", borderRadius: 8,
                      background: active ? C.card : "transparent",
                      border: active ? `1px solid ${C.border}` : "1px solid transparent",
                      color: active ? C.green : C.textDim,
                      cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400,
                      transition: "all 0.14s ease", fontFamily: "Inter, sans-serif",
                      boxShadow: active ? `0 1px 4px ${C.shadow}` : "none",
                    }}>
                      <Icon size={11} strokeWidth={active ? 2.2 : 1.8} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "13px 14px" }}>

              {/* LIVE NOTES */}
              {activeTab === "notes" && (
                <div>
                  {notesLoading && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      Generating real AI notes...
                    </p>
                  )}
                  {!notesLoading && generatedNotes.length === 0 && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      No notes returned by the backend for this video.
                    </p>
                  )}
                  {generatedNotes.map((note, i) => <NoteCard key={i} note={note} idx={i} />)}
                </div>
              )}

              {/* TRANSCRIPT */}
              {activeTab === "transcript" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px", marginBottom: 14, boxShadow: `0 1px 4px ${C.shadow}` }}>
                    <Search size={13} color={C.textDim} />
                    <input value={transcriptSearch} onChange={e => setTranscriptSearch(e.target.value)} placeholder="Search transcript..." style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 12.5, flex: 1, fontFamily: "Inter, sans-serif" }} />
                  </div>
                  {transcriptLoading && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      Loading real transcript...
                    </p>
                  )}
                  {!transcriptLoading && generatedTranscript.length === 0 && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      No transcript returned by the backend for this video.
                    </p>
                  )}
                  {generatedTranscript
                    .filter(l => !transcriptSearch || String(l.text).toLowerCase().includes(transcriptSearch.toLowerCase()))
                    .map((line, i) => (
                      <div key={i}
                        style={{ display: "flex", gap: 10, marginBottom: 12, padding: "9px 11px", borderRadius: 10, cursor: "pointer", transition: "background 0.14s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.card}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <span style={{ ...mono, fontSize: 11, color: C.green, background: C.greenDim, padding: "3px 8px", borderRadius: 6, flexShrink: 0, height: "fit-content", fontWeight: 600 }}>{line.ts}</span>
                        <div>
                          <span style={{ ...hand, fontSize: 14, color: C.greenMid, fontWeight: 600, display: "block", marginBottom: 3 }}>{line.speaker}</span>
                          <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>{line.text}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* KEY CONCEPTS */}
              {activeTab === "concepts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {notesLoading && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      Extracting real key concepts...
                    </p>
                  )}
                  {!notesLoading && generatedNotes.length === 0 && (
                    <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 4px" }}>
                      No key concepts returned by the backend for this video.
                    </p>
                  )}
                  {generatedNotes
                    .filter((note: any) => note?.heading && note.heading !== "Lecture Summary")
                    .map((note: any, i: number) => {
                      const conceptColor = noteColors[i % noteColors.length];
                      return (
                        <div key={i} style={{ ...card({ borderLeft: `3.5px solid ${conceptColor}`, padding: "14px 16px" }) }}>
                          <h3 style={{ ...hand, fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 7 }}>
                            {note.heading}
                          </h3>
                          <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
                            {note?.def?.text || note?.bullets?.[0] || "Key concept extracted from the lecture."}
                          </p>
                          {Array.isArray(note?.bullets) && note.bullets.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {note.bullets.slice(0, 3).map((r: string, j: number) => (
                                <span key={j} style={{ fontSize: 11, color: conceptColor, background: `${conceptColor}12`, border: `1px solid ${conceptColor}22`, padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* AI CHAT */}
              {activeTab === "chat" && (
                <div style={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
                  {/* suggested prompts */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
                    {suggestedPrompts.map((p, i) => (
                      <button key={i} onClick={() => setChatInput(p)} style={{
                        fontSize: 12, color: C.textMuted, background: C.card,
                        border: `1px solid ${C.border}`, borderRadius: 999,
                        padding: "5px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                        transition: "all 0.14s ease", boxShadow: `0 1px 3px ${C.shadow}`,
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.green; (e.currentTarget as HTMLElement).style.borderColor = `rgba(26,71,49,0.28)`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* messages */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                    {messages.map((msg, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: msg.role === "user" ? C.green : C.greenSage,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: "#fff",
                        }}>
                          {msg.role === "user" ? "P" : <Sparkles size={11} />}
                        </div>
                        <div style={{
                          maxWidth: "82%",
                          background: msg.role === "user" ? C.greenDim : C.card,
                          border: `1px solid ${msg.role === "user" ? "rgba(26,71,49,0.18)" : C.border}`,
                          borderRadius: msg.role === "user" ? "16px 3px 16px 16px" : "3px 16px 16px 16px",
                          padding: "9px 13px",
                          boxShadow: `0 1px 5px ${C.shadow}`,
                        }}>
                          <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.62, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* input */}
                  <div style={{ display: "flex", gap: 7, alignItems: "center", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "7px 7px 7px 13px", boxShadow: `0 2px 10px ${C.shadow}` }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Ask anything about this lecture..."
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "Inter, sans-serif" }} />
                    <button onClick={sendMessage} style={{
                      width: 30, height: 30, borderRadius: 9,
                      background: chatInput.trim() ? C.green : C.bgAlt,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.14s ease",
                    }}>
                      <Send size={13} color={chatInput.trim() ? "#fff" : C.textDim} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>

      {/* ── FLOATING BOTTOM TOOLBAR ── */}
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 999, padding: "8px 18px",
        display: "flex", alignItems: "center", gap: 2,
        boxShadow: `0 8px 32px rgba(26,71,49,0.14), 0 2px 8px rgba(0,0,0,0.05)`,
        zIndex: 50,
      }}>
        {[
          { icon: FileText, label: "Export PDF", action: handleExportPDF },
          { icon: Copy,     label: "Copy Notes", action: handleCopyNotes },
          { icon: Bookmark, label: "Bookmark", action: handleBookmark },
          { icon: Share2,   label: "Share", action: handleShare },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999,
            background: "transparent", border: "none",
            color: C.textMuted, cursor: "pointer",
            fontSize: 12.5, fontWeight: 500,
            transition: "all 0.14s ease", fontFamily: "Inter, sans-serif",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenDim; (e.currentTarget as HTMLElement).style.color = C.green; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
            <Icon size={13} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(15,23,42,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(460px, 94vw)", background: C.card,
              border: `1px solid ${C.border}`, borderRadius: 18,
              boxShadow: "0 24px 70px rgba(0,0,0,0.20)", padding: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <strong style={{ fontSize: 18, color: C.text }}>Settings</strong>
                <p style={{ marginTop: 4, fontSize: 12, color: C.textDim }}>Customize your LectureLens workspace.</p>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ border: "none", background: C.bgAlt, borderRadius: 9, padding: 8, cursor: "pointer", color: C.text }}>
                <X size={17} />
              </button>
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 7 }}>Notes language</label>
            <select
              value={notesLanguage}
              onChange={(e) => setNotesLanguage(e.target.value)}
              style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardWarm, color: C.text, marginBottom: 18 }}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Hinglish</option>
            </select>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 7 }}>Appearance</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setTheme("light")} style={{ ...pillBtn(theme === "light" ? C.green : C.cardWarm, theme === "light" ? "#fff" : C.text, C.border), flex: 1, justifyContent: "center" }}>Light</button>
              <button onClick={() => setTheme("dark")} style={{ ...pillBtn(theme === "dark" ? C.green : C.cardWarm, theme === "dark" ? "#fff" : C.text, C.border), flex: 1, justifyContent: "center" }}>Dark</button>
            </div>

            <button onClick={() => setShowSettings(false)} style={{ ...pillBtn(C.green, "#fff"), width: "100%", justifyContent: "center", marginTop: 22, padding: "11px 14px" }}>
              Save settings
            </button>
          </div>
        </div>
      )}

    </>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState<"landing" | "dashboard">("landing");
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #F5F0E6; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(26,71,49,0.15); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(26,71,49,0.28); }
      `}</style>
      {screen === "landing"
        ? <LandingPage onEnterDashboard={() => setScreen("dashboard")} />
        : <Dashboard onBack={() => setScreen("landing")} />
      }
    </div>
  );
}
