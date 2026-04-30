'use client'
// Phase 18 — Error Boundary for WebGL failures
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SpectrumErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-[#050508]">
          <div
            className="text-center max-w-md p-8 rounded-lg"
            style={{ border: '1px solid rgba(255, 0, 110, 0.3)' }}
          >
            <p className="text-[#FF006E] font-mono text-sm mb-2 tracking-widest">
              RENDERER ERROR
            </p>
            <p className="text-[#8888aa] text-sm mb-1">
              WebGL initialization failed. Please ensure your browser supports WebGL2.
            </p>
            {this.state.error && (
              <p className="text-[#445566] font-mono text-xs mt-2 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 border border-[#00d4ff] text-[#00d4ff] text-sm font-mono rounded hover:bg-[rgba(0,212,255,0.08)] transition-colors"
            >
              RELOAD
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
