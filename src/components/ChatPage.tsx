import React, { useEffect, useMemo, useRef, useState } from "react";

export type ChatRole = "assistant" | "user" | "system";
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: cryptoRandomId(),
    role: "assistant",
    content: "Hey! I’m your helpful AI. Ask me anything."
  }]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(
    prefersDark() ? "dark" : "light"
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const value = input.trim();
    if (!value) return;

    const userMsg: ChatMessage = {
      id: cryptoRandomId(),
      role: "user",
      content: value,
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value }),
      });
      const data = await r.json();
      setMessages((m) => [...m, { id: cryptoRandomId(), role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { id: cryptoRandomId(), role: 'assistant', content: 'Server error. Try again.' }]);
    }
  }

  return (
    <div className={`cgpt-root ${theme}`}>
      <StyleBlock />
      <header className="cgpt-header">
        <div className="cgpt-header-inner">
          <div className="cgpt-title">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.73 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
            </svg>
            <span>Chat</span>
          </div>
          <div className="cgpt-actions">
            <button
              className="cgpt-pill"
              aria-label="Toggle theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </header>

      <main className="cgpt-main">
        <div className="cgpt-scroll" ref={listRef}>
          <div className="cgpt-timeline">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}
          </div>
        </div>

        <form className="cgpt-composer" onSubmit={handleSend}>
          <div className="cgpt-input-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="cgpt-input-actions">
              <button
                type="submit"
                className="cgpt-send"
                aria-label="Send message"
                disabled={!input.trim()}
                title={!input.trim() ? "Type a message" : "Send"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
          <p className="cgpt-hint">Shift+Enter for newline</p>
        </form>
      </main>
    </div>
  );
}

function MessageBubble({ role, content }: { role: ChatRole; content: string }) {
  const isUser = role === "user";
  const label = role === "assistant" ? "AI" : role === "user" ? "You" : "System";

  return (
    <article className={`cgpt-msg ${isUser ? "from-user" : "from-ai"}`}>
      <div className="cgpt-avatar" aria-hidden>
        {isUser ? <span>👤</span> : <span>✨</span>}
      </div>
      <div className="cgpt-bubble">
        <header className="cgpt-msg-head">
          <span className="cgpt-badge">{label}</span>
        </header>
        <Markdownish text={content} />
      </div>
    </article>
  );
}

function Markdownish({ text }: { text: string }) {
  const html = useMemo(() => toHtml(text), [text]);
  return <div className="cgpt-md" dangerouslySetInnerHTML={{ __html: html }} />;
}

function prefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function escapeHtml(s: string) {
  return s.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;");
}

function toHtml(src: string) {
  let out = src.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="cgpt-pre"><code>${escapeHtml(code)}</code></pre>`);
  out = out.replace(/`([^`]+)`/g, '<code class="cgpt-code">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1<\/a>');
  out = out.split(/\n{2,}/).map(p => `<p>${p.replaceAll("\n", "<br/>")}</p>`).join("");
  return out;
}

function StyleBlock() {
  return (
    <style>{`
:root{
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  --bg: #ffffff;
  --bg-muted: #f6f7f8;
  --text: #111315;
  --muted: #6b7280;
  --border: #e5e7eb;
  --ai: #f1f5f9;
  --user: #10b98114;
  --accent: #10b981;
}
.cgpt-root.dark{
  --bg: #0b0f14;
  --bg-muted: #0f141b;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --border: #1f2937;
  --ai: #0f172a;
  --user: #064e3b;
  --accent: #22d3ee;
}
.cgpt-root{ min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font-sans); }
.cgpt-header{ position:sticky; top:0; z-index:20; backdrop-filter:saturate(180%) blur(8px); background:color-mix(in oklab, var(--bg) 75%, transparent); border-bottom:1px solid var(--border); }
.cgpt-header-inner{ max-width:960px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.75rem 1rem; }
.cgpt-title{ display:flex; align-items:center; gap:.5rem; font-weight:600; }
.cgpt-title svg{ fill: currentColor; opacity:.85; }
.cgpt-actions{ display:flex; align-items:center; gap:.5rem; }
.cgpt-pill{ border:1px solid var(--border); background:var(--bg); color:var(--text); padding:.375rem .75rem; border-radius:999px; font-size:.9rem; }
.cgpt-main{ max-width:960px; margin:0 auto; display:flex; flex-direction:column; min-height:calc(100vh - 56px); }
.cgpt-scroll{ flex:1; overflow:auto; padding:1rem; }
.cgpt-timeline{ display:flex; flex-direction:column; gap:12px; padding-bottom:88px; }
.cgpt-msg{ display:grid; grid-template-columns:auto 1fr; gap:.75rem; padding: .25rem .25rem; }
.cgpt-msg.from-ai .cgpt-bubble{ background: var(--ai); border:1px solid var(--border); }
.cgpt-msg.from-user .cgpt-bubble{ background: var(--user); border:1px solid color-mix(in oklab, var(--user) 70%, var(--border)); }
.cgpt-avatar{ width:32px; height:32px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--border); background:var(--bg-muted); font-size:14px; }
.cgpt-bubble{ border-radius:14px; padding:.9rem 1rem; line-height:1.55; }
.cgpt-msg-head{ display:flex; align-items:center; gap:.5rem; margin-bottom:.25rem; }
.cgpt-badge{ font-size:.75rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.cgpt-md p{ margin:.5rem 0; }
.cgpt-md a{ color:var(--accent); text-decoration:underline; }
.cgpt-code{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: color-mix(in oklab, var(--bg) 85%, black); border:1px solid var(--border); padding:.1rem .35rem; border-radius:6px; font-size:.9em; }
.cgpt-pre{ background: color-mix(in oklab, var(--bg) 85%, black); border:1px solid var(--border); border-radius:10px; padding:.75rem; overflow:auto; }
.cgpt-pre code{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:.88rem; }
.cgpt-composer{ position:sticky; bottom:0; padding: .5rem 1rem 1rem; background:linear-gradient(180deg, transparent, var(--bg) 30%); }
.cgpt-input-wrap{ display:grid; grid-template-columns: 1fr auto; gap:.5rem; align-items:end; border:1px solid var(--border); background: var(--bg); border-radius: 14px; padding:.5rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.cgpt-input-wrap textarea{ border:none; outline:none; resize:none; max-height: 180px; background: transparent; color: var(--text); font: 500 15px/1.5 var(--font-sans); padding:.35rem .5rem; }
.cgpt-input-actions{ display:flex; align-items:center; gap:.25rem; padding:.25rem; }
.cgpt-send{ appearance:none; border:none; border-radius:10px; padding:.5rem .6rem; display:grid; place-items:center; background:var(--accent); color:#001; cursor:pointer; opacity:1; transition:.15s ease; }
.cgpt-send:disabled{ opacity:.45; cursor:not-allowed; }
.cgpt-send svg{ fill: currentColor; }
.cgpt-hint{ color: var(--muted); font-size:.8rem; margin:.35rem .25rem 0; }
@media (max-width: 720px){ .cgpt-header-inner, .cgpt-main{ max-width:100%; } .cgpt-scroll{ padding:.5rem; } }
    `}</style>
  );
}
