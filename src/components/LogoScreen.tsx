import { useEffect, useRef } from "react";
import { playBeep } from "../utils/audio";
import "./LogoScreen.css";

interface LogoScreenProps {
  onComplete: () => void;
}

export function LogoScreen({ onComplete }: LogoScreenProps) {
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playBeep(220, 0.1, 0);
      playBeep(277, 0.1, 150);
      playBeep(330, 0.1, 300);
      playBeep(440, 0.15, 450);
      playBeep(440, 0.3, 700);
      playBeep(554, 0.3, 700);
      playBeep(659, 0.3, 700);
    }

    const timeout = setTimeout(onComplete, 3000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="logo-screen">
      <svg
        className="logo-svg"
        viewBox="0 0 1000 225"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Colored blocks - same structure as original */}
        <rect
          className="logo-block block-1"
          width="195"
          height="240"
          transform="matrix(1 0 -0.35576 0.934578 85 0)"
          fill="#E76F51"
        />
        <rect
          className="logo-block block-2"
          width="205"
          height="240"
          transform="matrix(1 0 -0.35576 0.934578 280 0)"
          fill="#F4A261"
        />
        <rect
          className="logo-block block-3"
          width="198"
          height="240"
          transform="matrix(1 0 -0.35576 0.934578 485 0)"
          fill="#E9C46A"
        />
        <rect
          className="logo-block block-4"
          width="280"
          height="240"
          transform="matrix(1 0 -0.35576 0.934578 683 0)"
          fill="#2A9D8F"
        />

        {/* Text DAMAGOTCHI - using SVG text with same style */}
        <text
          className="logo-text"
          x="490"
          y="140"
          textAnchor="middle"
          fontFamily="'04b', monospace"
          fontSize="94"
          fontWeight="normal"
          fontStyle="normal"
          fill="#F4F4F4"
        >
          DAMAGOTCHI
        </text>
      </svg>
    </div>
  );
}
