import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react";

type BreathingTechnique = "444" | "478";

export default function BreathingRoom() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [technique, setTechnique] = useState<BreathingTechnique>("444");
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "holdPost">("inhale");
  const [timeLeft, setTimeLeft] = useState(4); // seconds left in current phase
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Web Audio elements for real-time sound therapy synthesis (pink-like noise filtered like waves)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Quotes to show on screen corresponding to breathing phase
  const quotes = {
    inhale: [
      "맑은 공기와 함께 평온함을 마십니다.",
      "선생님의 어깨 위 무거운 책임감을 잠시 비워둡니다.",
      "내 몸으로 들어오는 생명의 에너지를 가만히 느껴보세요.",
    ],
    hold: [
      "지금 이 순간, 평화가 온전히 머무는 방입니다.",
      "교실 밖, 소란한 소음들이 모두 잦아듭니다.",
      "그 누구의 이름도 아닌, 오롯이 나로 존재하는 시간.",
    ],
    exhale: [
      "오늘 받은 상처와 피로를 한숨에 실어 내보냅니다.",
      "해야 한다는 모든 강박을 길게 흘려보냅니다.",
      "내쉬는 숨결에 긴장이 사르르 풀려갑니다.",
    ],
    holdPost: [
      "비워진 빈자리에 고요한 평온이 스며듭니다.",
      "고요함 속에서 내 존재의 따뜻함을 발견합니다.",
      "다음 숨을 가만히 기다리며, 지금 여기에 머뭅니다.",
    ],
  };

  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  // Web Audio API wave sound synthesis initialization
  const initAudio = () => {
    try {
      if (audioCtxRef.current) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create pinkish wave sound generator using a script processor
      const bufferSize = 4 * 4096;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      
      const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter approximation
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          output[i] = pink * 0.11; // scale volume
        }
      };

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime); // Start silent

      // Connect nodes
      scriptNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNodeRef.current = scriptNode;
      filterNodeRef.current = filter;
      gainNodeRef.current = gain;

      // Start audio context if suspended
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    } catch (e) {
      console.error("Failed to initialize audio therapy synthesizer:", e);
    }
  };

  // Adjust sound therapy parameters based on the current phase
  useEffect(() => {
    if (!soundEnabled || !audioCtxRef.current || !gainNodeRef.current || !filterNodeRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Ensure context is running
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = technique === "444" 
      ? 4 
      : (phase === "inhale" ? 4 : phase === "hold" ? 7 : 8);

    if (phase === "inhale") {
      // Rise in wave volume & brightness
      gainNodeRef.current.gain.linearRampToValueAtTime(0.25, now + duration);
      filterNodeRef.current.frequency.exponentialRampToValueAtTime(700, now + duration);
    } else if (phase === "hold") {
      // High, tranquil tone
      gainNodeRef.current.gain.linearRampToValueAtTime(0.22, now + 1);
      filterNodeRef.current.frequency.exponentialRampToValueAtTime(450, now + duration);
    } else if (phase === "exhale") {
      // Soughing exhale fall in volume
      gainNodeRef.current.gain.linearRampToValueAtTime(0.04, now + duration);
      filterNodeRef.current.frequency.exponentialRampToValueAtTime(250, now + duration);
    } else {
      // Post-exhale hold
      gainNodeRef.current.gain.linearRampToValueAtTime(0.02, now + duration);
      filterNodeRef.current.frequency.setValueAtTime(220, now);
    }
  }, [phase, soundEnabled, technique]);

  // Turn soundness therapy on/off
  const toggleSound = () => {
    if (!soundEnabled) {
      initAudio();
      setSoundEnabled(true);
    } else {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current!.currentTime);
      }
      setSoundEnabled(false);
    }
  };

  // Clean up Web Audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update timer ticks
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Move to next breathing stage
            let nextPhase: typeof phase = "inhale";
            let nextTime = 4;

            if (technique === "444") {
              // Square breathing: Inhale(4) -> Hold(4) -> Exhale(4) -> Hold(4)
              if (phase === "inhale") {
                nextPhase = "hold";
                nextTime = 4;
              } else if (phase === "hold") {
                nextPhase = "exhale";
                nextTime = 4;
              } else if (phase === "exhale") {
                nextPhase = "holdPost";
                nextTime = 4;
              } else {
                nextPhase = "inhale";
                nextTime = 4;
                setCompletedCycles((c) => c + 1);
              }
            } else {
              // 4-7-8 breathing: Inhale(4) -> Hold(7) -> Exhale(8)
              if (phase === "inhale") {
                nextPhase = "hold";
                nextTime = 7;
              } else if (phase === "hold") {
                nextPhase = "exhale";
                nextTime = 8;
              } else {
                nextPhase = "inhale";
                nextTime = 4;
                setCompletedCycles((c) => c + 1);
              }
            }

            setPhase(nextPhase);
            // Cycle visual quote text index
            setActiveQuoteIdx((idx) => (idx + 1) % 3);
            return nextTime;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, phase, technique]);

  const resetSession = () => {
    setIsPlaying(false);
    setPhase("inhale");
    setTimeLeft(4);
    setCompletedCycles(0);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    }
  };

  const handleStartStop = () => {
    if (!isPlaying) {
      initAudio();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
    }
  };

  // Determine current breathing style and color palettes
  const getPhaseColorAndLabel = () => {
    switch (phase) {
      case "inhale":
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-700",
          ring: "border-emerald-300",
          label: "숨 들이쉬기",
          subLabel: "코로 맑고 깨끗한 공기를 채워보세요",
          scale: 1.4,
        };
      case "hold":
        return {
          bg: "bg-amber-400",
          text: "text-amber-800",
          ring: "border-amber-200",
          label: "잠시 머물기",
          subLabel: "이 고요함 속에서 가만히 참아보세요",
          scale: 1.4,
        };
      case "exhale":
        return {
          bg: "bg-stone-500",
          text: "text-stone-700",
          ring: "border-stone-300",
          label: "숨 내쉬기",
          subLabel: "입으로 피로와 걱정을 길게 불어내세요",
          scale: 1.0,
        };
      case "holdPost":
        return {
          bg: "bg-teal-600",
          text: "text-teal-700",
          ring: "border-teal-200",
          label: "비우고 머물기",
          subLabel: "텅 비워진 평안함을 만끽해보세요",
          scale: 1.0,
        };
    }
  };

  const config = getPhaseColorAndLabel();

  return (
    <div className="bg-stone-50/60 p-6 md:p-8 rounded-3xl border border-[#ebdcd0] shadow-sm max-w-4xl mx-auto" id="breathing-room-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-700" />
            마음챙김 호흡실
          </h2>
          <p className="text-xs text-stone-500 mt-1">심호흡을 통해 자율신경계를 안정시키고, 교탁 앞에서 날카로워진 신경을 보듬어줍니다.</p>
        </div>
        
        {/* Breathing technique buttons */}
        <div className="flex bg-stone-100 p-1.5 rounded-full border border-stone-200">
          <button
            onClick={() => {
              setTechnique("444");
              resetSession();
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
              technique === "444"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-800"
            }`}
          >
            4-4-4 상자 호흡 (마음 안정)
          </button>
          <button
            onClick={() => {
              setTechnique("478");
              resetSession();
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all ${
              technique === "478"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-800"
            }`}
          >
            4-7-8 수면 호흡 (긴장 해소)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left pane: Instruction */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-stone-100/80 p-5 rounded-2xl border border-stone-200">
            <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {technique === "444" ? "4-4-4 상자 호흡법" : "4-7-8 긴장 이완 호흡법"}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {technique === "444" 
                ? "미 해군 특수부대(Navy SEALs)가 극도의 긴장에서 평정심을 찾기 위해 쓰는 과학적 호흡법입니다. 들숨과 날숨, 중간 정지 단계를 4초로 균일하게 맞추어 즉각적으로 심박수를 낮춰줍니다."
                : "인도 요가 프라나야마에서 유래하고 하버드 의대 앤드류 와일 박사가 추천하는 탁월한 스트레스 경감 호흡입니다. 화가 머리끝까지 났거나 공황, 불면이 올 때 탁월한 지우개 역할을 해줍니다."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-stone-500 font-medium px-1">
              <span>누적 완료 사이클</span>
              <span>{completedCycles}회</span>
            </div>
            
            {/* Audio synthesiser instruction */}
            <button
              onClick={toggleSound}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                soundEnabled
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                  : "bg-white border-stone-200 text-stone-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                <span>ASMR 실시간 파도 소리 치료</span>
              </div>
              <span className="text-[10px] font-bold uppercase">{soundEnabled ? "켜짐" : "꺼짐"}</span>
            </button>
            <div className="flex items-start gap-1 p-2 bg-emerald-50/30 rounded-lg text-[10px] text-stone-500">
              <AlertCircle className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
              <span>실시간 파도 감각 소리는 Web Audio 기술로 브라우저에서 직접 파도 주파수를 생성합니다. 외부 재생기 없이 호흡 속도에 맞춰 소리가 유기적으로 들이쉬고 내쉬며 변합니다.</span>
            </div>
          </div>
        </div>

        {/* Right pane: Visual Stage */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center py-6 bg-white rounded-3xl border border-stone-200/60 relative overflow-hidden min-h-[380px]">
          
          {/* Animated decorative waves in background */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="w-[500px] h-[500px] border border-stone-900 rounded-full absolute -top-40 -left-40 animate-pulse"></div>
            <div className="w-[600px] h-[600px] border border-stone-900 rounded-full absolute -bottom-40 -right-40 animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>

          {/* Calming visual system quote */}
          <div className="h-14 flex items-center justify-center px-6 text-center max-w-sm mb-4">
            <AnimatePresence mode="wait">
              {isPlaying && (
                <motion.p
                  key={`${phase}-${activeQuoteIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8 }}
                  className="text-stone-600 text-xs italic leading-relaxed"
                >
                  "{quotes[phase]?.[activeQuoteIdx] || quotes[phase]?.[0]}"
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Central breathing circle */}
          <div className="relative w-56 h-56 flex items-center justify-center my-6">
            
            {/* Outer pulsating ring */}
            <motion.div
              animate={{
                scale: isPlaying ? config.scale : 1.0,
                borderColor: isPlaying ? "rgb(16, 185, 129)" : "rgb(217, 217, 217)",
              }}
              transition={{
                duration: isPlaying ? timeLeft : 1.5,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border-4 border-dashed opacity-40"
            />

            {/* Solid growing/shrinking main sphere */}
            <motion.div
              animate={{
                scale: isPlaying ? config.scale : 1.0,
              }}
              className={`absolute w-36 h-36 rounded-full opacity-10 transition-colors duration-1000 ${config.bg}`}
              transition={{
                duration: isPlaying ? timeLeft : 1.5,
                ease: "easeInOut",
              }}
            />

            {/* Interactive timer counting */}
            <div className="z-10 text-center select-none">
              <span className="block text-4xl font-extrabold text-stone-800 tracking-tight font-mono">{timeLeft}</span>
              <span className={`block text-sm font-extrabold mt-1 tracking-tight ${config.text} transition-colors duration-1000`}>
                {isPlaying ? config.label : "정지됨"}
              </span>
            </div>
          </div>

          {/* Phase subtext */}
          <div className="h-6 mb-8 text-center px-4">
            {isPlaying ? (
              <p className="text-xs text-stone-500 font-medium transition-all">{config.subLabel}</p>
            ) : (
              <p className="text-xs text-stone-400 font-medium">준비가 되면 시작 버튼을 누르세요. 조용한 환경을 권장합니다.</p>
            )}
          </div>

          {/* Main Controls console */}
          <div className="flex items-center gap-4 z-10" id="breathing-controls">
            <button
              onClick={handleStartStop}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-tight shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                isPlaying
                  ? "bg-stone-800 hover:bg-stone-900 text-white"
                  : "bg-emerald-800 hover:bg-emerald-950 text-[#fdfbf7]"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#fdfbf7]" />
                  <span>호흡 시작하기</span>
                </>
              )}
            </button>

            <button
              onClick={resetSession}
              aria-label="초기화"
              className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 transition-all cursor-pointer hover:rotate-30 active:rotate-12"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
