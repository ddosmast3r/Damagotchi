import { unlockAudio } from '../utils/audio'
import './StartScreen.css'

interface StartScreenProps {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const handleStart = async () => {
    await unlockAudio()
    onStart()
  }

  return (
    <div className="start-screen" onClick={handleStart}>
      <div className="start-content">
        <div className="start-title">DAMAGOTCHI</div>
        <div className="start-prompt">[ CLICK TO START ]</div>
        <div className="start-hint">sound on for best experience</div>
      </div>
    </div>
  )
}
