import { useState, useEffect, useRef, useCallback } from 'react'
import PenroseTriangle from './PenroseTriangle'

const ANSWER = 'maple'
const NEXT_URL = 'https://hagnk.github.io/maple/'
const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%*▒░'

function GlitchText({ text, delay = 0 }) {
  const [display, setDisplay] = useState(text.replace(/[^\s]/g, '▒'))

  useEffect(() => {
    let iter = 0
    let interval = null

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplay(
          text.split('').map((ch, i) => {
            if (ch === ' ') return ' '
            if (i < iter) return ch
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          }).join('')
        )
        iter += 0.35
        if (iter > text.length) {
          clearInterval(interval)
          setDisplay(text)
        }
      }, 55)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [text, delay])

  return <>{display}</>
}

export default function App() {
  const [puzzleVisible, setPuzzleVisible] = useState(false)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [solved, setSolved] = useState(false)
  const magicTimerRef = useRef(null)

  // Called by PenroseTriangle when magic-view state changes
  const handleMagicView = useCallback((isMagic) => {
    if (isMagic) {
      if (!magicTimerRef.current) {
        magicTimerRef.current = setTimeout(() => {
          magicTimerRef.current = null
          setPuzzleVisible(true)
        }, 2000)
      }
    } else {
      clearTimeout(magicTimerRef.current)
      magicTimerRef.current = null
      setPuzzleVisible(false)
    }
  }, [])

  const submit = (e) => {
    e.preventDefault()
    if (input.toLowerCase().trim() === ANSWER) {
      setSolved(true)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus('idle'), 1500)
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse-num {
          0%, 100% { opacity: 0.7; text-shadow: 0 0 8px rgba(255,190,60,0.4); }
          50%       { opacity: 1;   text-shadow: 0 0 20px rgba(255,190,60,1); }
        }
        .pz-input:focus {
          outline: none;
          border-color: rgba(100,160,255,0.75) !important;
          box-shadow: 0 0 12px rgba(100,160,255,0.2);
        }
        .pz-btn:hover {
          background: rgba(80,140,255,0.4) !important;
          color: #aad4ff !important;
        }
        .pz-link:hover {
          background: rgba(68,204,255,0.12) !important;
          border-color: rgba(68,204,255,0.65) !important;
        }
      `}</style>

      <PenroseTriangle onMagicView={handleMagicView} />

      {/* CRT scanline overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,20,0.03) 2px,rgba(0,0,20,0.03) 4px)',
      }} />

      {/* Puzzle panel — fades in after 2 s at magic viewpoint */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: 28,
        transform: puzzleVisible ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.93)',
        width: 262,
        opacity: puzzleVisible ? 1 : 0,
        pointerEvents: puzzleVisible ? 'auto' : 'none',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        fontFamily: "'Courier New', Courier, monospace",
        zIndex: 100,
      }}>
        <div style={{
          background: 'rgba(5,7,26,0.93)',
          border: '1px solid rgba(80,130,220,0.35)',
          borderRadius: 6,
          padding: '18px 20px 16px',
          boxShadow: '0 0 40px rgba(30,70,180,0.3), inset 0 0 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
        }}>

          {/* Status bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <span style={{ color: 'rgba(80,140,255,0.4)', fontSize: '0.57rem', letterSpacing: 3 }}>
              SYS://CIPHER
            </span>
            <span style={{ color: solved ? '#44ff88' : 'rgba(255,100,100,0.55)', fontSize: '0.57rem', letterSpacing: 2 }}>
              {solved ? '● SOLVED' : '● LOCKED'}
            </span>
          </div>

          <div style={{ borderTop: '1px solid rgba(80,130,220,0.2)', marginBottom: 14 }} />

          {/* Title re-glitches every time panel becomes visible */}
          <div style={{ color: '#6aa8ff', fontSize: '0.86rem', letterSpacing: 3, marginBottom: 14, fontWeight: 700 }}>
            <GlitchText key={String(puzzleVisible)} text="PENROSE CIPHER" delay={200} />
          </div>

          <div style={{ color: 'rgba(180,200,240,0.58)', fontSize: '0.71rem', lineHeight: 1.8, marginBottom: 16 }}>
            불가능한 도형 속에 다섯 수가<br />
            새겨져 있다. 규칙을 찾아라.
          </div>

          {/* The five numbers */}
          <div style={{
            background: 'rgba(255,190,60,0.06)',
            border: '1px solid rgba(255,190,60,0.22)',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <div style={{
              color: '#ffc04d',
              fontSize: '1.05rem',
              letterSpacing: 6,
              fontWeight: 700,
              animation: 'pulse-num 2.8s ease-in-out infinite',
            }}>
              13 · 1 · 16 · 12 · 5
            </div>
          </div>

          {/* Input or success */}
          {!solved ? (
            <form onSubmit={submit}>
              <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                <input
                  className="pz-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="답을 입력하라..."
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${status === 'wrong' ? 'rgba(255,60,80,0.7)' : 'rgba(80,130,220,0.32)'}`,
                    borderRadius: 4,
                    color: '#b8d0ff',
                    padding: '8px 10px',
                    fontFamily: 'inherit',
                    fontSize: '0.82rem',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                  }}
                />
                <button
                  className="pz-btn"
                  type="submit"
                  style={{
                    background: 'rgba(50,100,200,0.25)',
                    border: '1px solid rgba(80,140,255,0.4)',
                    color: '#7ab4ff',
                    borderRadius: 4,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                >▶</button>
              </div>
              {status === 'wrong' && (
                <div style={{ color: 'rgba(255,80,100,0.85)', fontSize: '0.62rem', letterSpacing: 2 }}>
                  ERR: 코드 불일치
                </div>
              )}
            </form>
          ) : (
            <div>
              <div style={{ color: '#44ff88', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 10, textAlign: 'center' }}>
                ✓ 해독 완료 — 다음 목적지:
              </div>
              <a
                href={NEXT_URL}
                className="pz-link"
                style={{
                  display: 'block',
                  color: '#44ccff',
                  fontSize: '0.67rem',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(68,204,255,0.32)',
                  padding: '8px 10px',
                  borderRadius: 4,
                  background: 'rgba(68,204,255,0.04)',
                  transition: 'all 0.25s',
                  lineHeight: 1.6,
                }}
              >
                {NEXT_URL}
              </a>
            </div>
          )}

          <div style={{
            marginTop: 14,
            borderTop: '1px solid rgba(80,130,220,0.15)',
            paddingTop: 10,
            color: 'rgba(80,130,220,0.2)',
            fontSize: '0.56rem',
            letterSpacing: 3,
            textAlign: 'center',
          }}>
            LEVEL 01 / ?? &nbsp;■
          </div>
        </div>
      </div>
    </>
  )
}
