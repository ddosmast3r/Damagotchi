import { useState, useEffect, useRef } from "react";
import { playBeep } from "../utils/audio";
import "./BootScreen.css";

interface BootScreenProps {
  onBootComplete: () => void;
}

type BootLine = {
  text: string;
  type: "text" | "progress" | "dots" | "spinner" | "ok" | "fail" | "memory";
  delay?: number;
};

const BOOT_SEQUENCE: BootLine[] = [
  { text: "", type: "text", delay: 200 },
  { text: "DAMAGOTCHI BIOS v1.0.3", type: "text" },
  { text: "Copyright (C) 2026 Odissey Pogosov Inc.", type: "text" },
  { text: "", type: "text" },
  { text: "CPU: EmotionCore 8086 @ 4.77 MHz", type: "text" },
  { text: "Checking RAM", type: "memory" },
  { text: "", type: "text" },
  { text: "Initializing devices", type: "dots" },
  { text: "  Loading capitalism.dll", type: "progress" },
  { text: "  Loading responsibilities.sys", type: "progress" },
  { text: "  Loading existential_dread.exe", type: "progress" },
  { text: "  Loading antidepressant-addiction.ko", type: "progress" },
  { text: "  Loading thoughts-of-suicide.txt", type: "progress" },
  { text: "", type: "text" },
  { text: "Starting DAMAGOTCHI kernel", type: "spinner" },
  { text: "", type: "text" },
  { text: "[  OK  ] Started Adult Life Simulator", type: "ok" },
  { text: "[  OK  ] Mounted /dev/emotions", type: "ok" },
  { text: "[  OK  ] Started Existential Crisis Service", type: "ok" },
  { text: "[FAILED] Started Happiness Service", type: "fail" },
  { text: "[  OK  ] Reached target Multi-Stress Mode", type: "ok" },
  { text: "", type: "text" },
  { text: "System ready. Press any key...", type: "text" },
];

export function BootScreen({ onBootComplete }: BootScreenProps) {
  const [lines, setLines] = useState<{ text: string; complete: boolean }[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [animState, setAnimState] = useState({
    progress: 0,
    dots: 0,
    spinner: 0,
    memory: 0,
  });
  const [waitingForKey, setWaitingForKey] = useState(false);
  const hasPlayedBeep = useRef(false);

  // Play BIOS beep on start
  useEffect(() => {
    if (!hasPlayedBeep.current) {
      hasPlayedBeep.current = true;
      // Classic BIOS POST beep
      playBeep(1000, 0.2, 100);
    }
  }, []);

  // Animation intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimState((prev) => ({
        progress: Math.min(100, prev.progress + 8),
        dots: (prev.dots + 1) % 4,
        spinner: (prev.spinner + 1) % 4,
        memory: Math.min(640, prev.memory + 64),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Process boot sequence
  useEffect(() => {
    if (currentLine >= BOOT_SEQUENCE.length) {
      setWaitingForKey(true);
      // Success beep
      playBeep(800, 0.1, 0);
      playBeep(1000, 0.1, 100);
      playBeep(1200, 0.15, 200);
      return;
    }

    const line = BOOT_SEQUENCE[currentLine];
    const baseDelay = line.delay ?? 150;

    // Different delays for different line types
    let delay = baseDelay;
    if (line.type === "progress") delay = 400;
    if (line.type === "spinner") delay = 800;
    if (line.type === "memory") delay = 600;
    if (line.type === "dots") delay = 500;

    const timeout = setTimeout(() => {
      setLines((prev) => [...prev, { text: line.text, complete: false }]);

      // Mark complete after animation
      setTimeout(() => {
        setLines((prev) => {
          const newLines = [...prev];
          if (newLines[newLines.length - 1]) {
            newLines[newLines.length - 1].complete = true;
          }
          return newLines;
        });
        // Play tick sound for OK lines
        if (line.type === "ok") playBeep(1200, 0.05);
        if (line.type === "fail") playBeep(400, 0.1);

        // Reset progress for next line
        setAnimState((prev) => ({ ...prev, progress: 0, memory: 0 }));
        setCurrentLine((prev) => prev + 1);
      }, delay - 50);
    }, 50);

    return () => clearTimeout(timeout);
  }, [currentLine]);

  // Handle key/click
  useEffect(() => {
    if (!waitingForKey) return;

    const handleInput = () => {
      playBeep(600, 0.05);
      onBootComplete();
    };

    window.addEventListener("click", handleInput);
    window.addEventListener("keydown", handleInput);

    return () => {
      window.removeEventListener("click", handleInput);
      window.removeEventListener("keydown", handleInput);
    };
  }, [waitingForKey, onBootComplete]);

  const spinnerChars = ["|", "/", "-", "\\"];
  const dotsChars = ["", ".", "..", "..."];

  const renderLine = (
    line: { text: string; complete: boolean },
    idx: number,
  ) => {
    const bootLine = BOOT_SEQUENCE[idx];
    if (!bootLine)
      return (
        <div key={idx} className="boot-line">
          {line.text}
        </div>
      );

    if (bootLine.type === "progress" && !line.complete) {
      const filled = Math.floor(animState.progress / 5);
      const bar =
        "[" +
        "=".repeat(filled) +
        ">".repeat(filled < 20 ? 1 : 0) +
        " ".repeat(Math.max(0, 20 - filled - 1)) +
        "]";
      return (
        <div key={idx} className="boot-line">
          {line.text} {bar} {animState.progress}%
        </div>
      );
    }

    if (bootLine.type === "progress" && line.complete) {
      return (
        <div key={idx} className="boot-line">
          {line.text} [====================] 100%
        </div>
      );
    }

    if (bootLine.type === "dots" && !line.complete) {
      return (
        <div key={idx} className="boot-line">
          {line.text}
          {dotsChars[animState.dots]}
        </div>
      );
    }

    if (bootLine.type === "spinner" && !line.complete) {
      return (
        <div key={idx} className="boot-line">
          {line.text} {spinnerChars[animState.spinner]}
        </div>
      );
    }

    if (bootLine.type === "memory" && !line.complete) {
      return (
        <div key={idx} className="boot-line">
          {line.text}... {animState.memory}K OK
        </div>
      );
    }

    if (bootLine.type === "memory" && line.complete) {
      return (
        <div key={idx} className="boot-line">
          {line.text}... 640K OK
        </div>
      );
    }

    if (bootLine.type === "ok") {
      const rest = line.text.replace("[  OK  ]", "");
      return (
        <div key={idx} className="boot-line">
          <span className="status-ok">[ OK ]</span>
          {rest}
        </div>
      );
    }

    if (bootLine.type === "fail") {
      const rest = line.text.replace("[FAILED]", "");
      return (
        <div key={idx} className="boot-line">
          <span className="status-fail">[FAILED]</span>
          {rest}
        </div>
      );
    }

    return (
      <div key={idx} className="boot-line">
        {line.text}
      </div>
    );
  };

  return (
    <div className="boot-screen">
      <div className="boot-content">
        {lines.map((line, idx) => renderLine(line, idx))}
        <span className={`boot-cursor ${waitingForKey ? "blink" : ""}`}>_</span>
      </div>
    </div>
  );
}
