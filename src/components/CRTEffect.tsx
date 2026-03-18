import './CRTEffect.css'

interface CRTEffectProps {
  children: React.ReactNode
}

export function CRTEffect({ children }: CRTEffectProps) {
  return (
    <div className="crt-container">
      <div className="crt-screen">
        {children}
        <div className="crt-overlay">
          <div className="crt-scanlines"></div>
          <div className="crt-glow"></div>
        </div>
      </div>
    </div>
  )
}
