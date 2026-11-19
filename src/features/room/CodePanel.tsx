import React, { useState } from 'react';
import { cn } from '../../shared/lib/cn';
import { Button } from '../../shared/ui/Button';
import { Play, Terminal, CheckCircle2, Copy, Code2, Edit3 } from 'lucide-react';

const INITIAL_CODE_JS = `// Design a sliding-window rate limiter in JavaScript / TypeScript
class SlidingWindowRateLimiter {
  constructor(limit = 100, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.requests = new Map(); // key -> timestamps array
  }

  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let timestamps = this.requests.get(clientId) || [];
    // Evict timestamps outside current window
    timestamps = timestamps.filter(t => t > windowStart);
    
    if (timestamps.length < this.limit) {
      timestamps.push(now);
      this.requests.set(clientId, timestamps);
      return true; // Request allowed
    }
    
    return false; // Rate limit exceeded (429)
  }
}
`;

const INITIAL_CODE_PY = `# Design a sliding-window rate limiter in Python
import time
from collections import deque

class SlidingWindowRateLimiter:
    def __init__(self, limit: int = 100, window_secs: int = 60):
        self.limit = limit
        self.window_secs = window_secs
        self.clients = {}  # client_id -> deque of timestamps

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        window_start = now - self.window_secs
        
        if client_id not in self.clients:
            self.clients[client_id] = deque()
            
        q = self.clients[client_id]
        while q and q[0] <= window_start:
            q.popleft()
            
        if len(q) < self.limit:
            q.append(now)
            return True
            
        return False
`;

export const CodePanel: React.FC<{ className?: string }> = ({ className }) => {
  const [lang, setLang] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState(INITIAL_CODE_JS);
  const [activeTab, setActiveTab] = useState<'editor' | 'sketch'>('editor');
  const [sketchText, setSketchText] = useState(
    'Architecture Notes:\n[Client] -> [Envoy Edge Proxy (Local Token Bucket)] -> [Redis Cluster (Atomic Lua Script)]\n- Fallback: Gracefully downgrade to in-memory leaky bucket on 15ms latency breach.'
  );

  const handleLangChange = (newLang: 'javascript' | 'python') => {
    setLang(newLang);
    setCode(newLang === 'javascript' ? INITIAL_CODE_JS : INITIAL_CODE_PY);
  };

  return (
    <div className={cn('flex flex-col h-full rounded-2xl bg-surface/90 border border-border/20 overflow-hidden', className)}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/15 bg-elevated/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
              activeTab === 'editor' ? 'bg-primary/20 text-txt border border-primary/30' : 'text-txt-muted hover:text-txt'
            )}
          >
            <Code2 className="w-3.5 h-3.5 text-primary" /> Code Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sketch')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
              activeTab === 'sketch' ? 'bg-secondary/20 text-txt border border-secondary/30' : 'text-txt-muted hover:text-txt'
            )}
          >
            <Edit3 className="w-3.5 h-3.5 text-secondary" /> System Sketchpad
          </button>
        </div>

        {activeTab === 'editor' && (
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as 'javascript' | 'python')}
              className="bg-surface text-txt text-xs px-2 py-1 rounded border border-border/25 outline-none"
            >
              <option value="javascript">TypeScript / JS</option>
              <option value="python">Python 3</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              disabled
              disabledReason="Secure execution sandbox runs on backend workers (Phase D)"
              className="text-xs py-1 px-2.5 gap-1"
            >
              <Play className="w-3 h-3 text-txt-muted" /> Run Tests
            </Button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === 'editor' ? (
        <div className="flex-1 flex flex-col font-mono text-xs">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-black/40 text-txt font-mono resize-none outline-none leading-relaxed"
          />

          {/* Test cases footer */}
          <div className="p-3 bg-elevated/60 border-t border-border/15 text-[11px] text-txt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 1: Within Limit (200 OK)
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Test Case 2: Exceeded Burst (429 Too Many Requests)
              </span>
            </div>
            <span className="text-txt-muted">Client Sandbox Ready</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <textarea
            value={sketchText}
            onChange={(e) => setSketchText(e.target.value)}
            placeholder="Type your system design notes, architecture diagram links, or trade-off tables here..."
            className="flex-1 w-full p-4 bg-surface/50 text-txt text-xs resize-none outline-none leading-relaxed font-ui"
          />
        </div>
      )}
    </div>
  );
};
