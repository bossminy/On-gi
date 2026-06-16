import { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  MessageSquare, 
  FileText, 
  Compass, 
  Calendar,
  Sparkles, 
  User, 
  Settings, 
  ChevronRight, 
  Send, 
  Trash2, 
  Smile, 
  Frown, 
  CloudRain, 
  Wind, 
  AlertTriangle,
  Loader2,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Cloud
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import BreathingRoom from "./components/BreathingRoom";
import { Message, JournalEntry, Prescription, PersonaType } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [teacherName, setTeacherName] = useState<string>(() => {
    return localStorage.getItem("comfort_teacher_name") || "김지은";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameVal, setEditingNameVal] = useState(teacherName);

  // Custom modal dialogs/notifications state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    isAlert?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      isAlert: false
    });
  };

  const showCustomAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      isAlert: true
    });
  };

  // For visual polish: mood today
  const [userMoodScore, setUserMoodScore] = useState<number>(() => {
    const saved = localStorage.getItem("comfort_mood_score");
    return saved ? parseInt(saved, 10) : 60;
  });

  // Self Affirmation randomizer
  const affirmations = [
    "나는 그 누구보다 아이들의 우주를 가꾸는 귀한 정원사입니다.",
    "내가 오늘 건넨 친절함과 미소는 쓰러지던 한 아이를 다시 일으켰을 것입니다.",
    "교실 밖을 나오는 순간, 나는 나의 소중한 사람이자 오롯이 보호받아야 마땅한 나입니다.",
    "완벽한 교사일 필요는 없습니다. 내 존재 자체로 이미 훌륭한 나침반입니다.",
    "오늘 일어난 실수가 내 배움과 성장의 증거이며, 내 가치를 떨어뜨릴 수 없습니다.",
    "내 지식과 지혜를 전달하는 이 순간에 집중하고 부과된 마음의 짐은 흘러가게 두겠습니다."
  ];
  const [currentAffirmation, setCurrentAffirmation] = useState(affirmations[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * affirmations.length);
      setCurrentAffirmation(affirmations[idx]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Saved Name sync
  const saveName = () => {
    const trimmed = editingNameVal.trim();
    if (trimmed) {
      setTeacherName(trimmed);
      localStorage.setItem("comfort_teacher_name", trimmed);
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("comfort_mood_score", userMoodScore.toString());
  }, [userMoodScore]);

  // CHAT STATE
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("colleague");
  const [chatLogs, setChatLogs] = useState<Record<PersonaType, Message[]>>(() => {
    const saved = localStorage.getItem("comfort_chat_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default below
      }
    }
    return {
      colleague: [
        {
          id: "init",
          role: "assistant",
          content: "선생님, 오늘 진짜 힘들었죠? 행정 공문에 바쁜 반 아이들 등쌀까지 보고 얼굴 보니까 마음에 그늘이 가득하네요. 교무실 구석에서 믹스커피 한잔 기울이면서 하소연한다 생각하고 다 털어놓아 보세요. 제가 다 들어드릴게요.",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        }
      ],
      therapist: [
        {
          id: "init",
          role: "assistant",
          content: "안녕하세요, 선생님. 한결 상담사입니다. 하루 종일 무수한 소리와 요구나 격앙된 감정들을 받아내시느라 에너지가 바닥나셨을 텐데요. 이곳은 아무런 판단도, 해결방안 채근도 없는 온전한 안전지대입니다. 마음을 가만히 내려놓고 무엇이 선생님을 가장 아프게 했는지 들려주세요.",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        }
      ],
      senior: [
        {
          id: "init",
          role: "assistant",
          content: "어제오늘 가슴에 서리가 내린 것처럼 서글픈 심정이었겠어요. 후배님, 고생 많았습니다. 교단에서 30년을 지키면서 나도 무수히 눈물을 삼켰을 때가 있었지요. 어떤 고민으로 어깨가 무겁나요? 늙은 선배 품에 안겨 가만히 쉬어 가세요.",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };
  });

  const [inputMsg, setInputMsg] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("comfort_chat_logs", JSON.stringify(chatLogs));
  }, [chatLogs]);

  useEffect(() => {
    if (chatScrollerRef.current) {
      chatScrollerRef.current.scrollTo({
        top: chatScrollerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatLogs, selectedPersona, isChatLoading]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputMsg.trim() || isChatLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMsg,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };

    const currentLogs = chatLogs[selectedPersona];
    const updatedLogs = [...currentLogs, userMessage];
    
    setChatLogs(prev => ({
      ...prev,
      [selectedPersona]: updatedLogs
    }));
    setInputMsg("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedLogs,
          persona: selectedPersona
        })
      });

      if (!response.ok) throw new Error("서버와의 통신에 실패했습니다.");
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };

      setChatLogs(prev => ({
        ...prev,
        [selectedPersona]: [...updatedLogs, assistantMessage]
      }));
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송해요, 마음 연결 기둥에 잠시 오류가 발생했어요. 마음이 많이 어지러우시다면 다시 한 번 조심스럽게 보내보실래요?",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };
      setChatLogs(prev => ({
        ...prev,
        [selectedPersona]: [...updatedLogs, errorMessage]
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
    showCustomConfirm(
      "상담 대화 초기화",
      "이 상담 대화 내용을 비울까요? 예전 고충 기록들은 사라지지만 눈부신 새 출발이 기다릴 것입니다.",
      () => {
        const defaultIntro = {
          colleague: "선생님, 오늘 진짜 힘들었죠? 행정 공문에 바쁜 반 아이들 등쌀까지 보고 얼굴 보니까 마음에 그늘이 가득하네요. 교무실 구석에서 믹스커피 한잔 기울이면서 하소연한다 생각하고 다 털어놓아 보세요. 제가 다 들어드릴게요.",
          therapist: "안녕하세요, 선생님. 한결 상담사입니다. 하루 종일 무수한 소리와 요구나 격앙된 감정들을 받아내시느라 에너지가 바닥나셨을 텐데요. 이곳은 아무런 판단도, 해결방안 채근도 없는 온전한 안전지대입니다. 마음을 가만히 내려놓고 무엇이 선생님을 가장 아프게 했는지 들려주세요.",
          senior: "어제오늘 가슴에 서리가 내린 것처럼 서글픈 심정이었겠어요. 후배님, 고생 많았습니다. 교단에서 30년을 지키면서 나도 무수히 눈물을 삼켰을 때가 있었지요. 어떤 고민으로 어깨가 무겁나요? 늙은 선배 품에 안겨 가만히 쉬어 가세요."
        };
        
        setChatLogs(prev => ({
          ...prev,
          [selectedPersona]: [
            {
              id: "init",
              role: "assistant",
              content: defaultIntro[selectedPersona],
              timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
            }
          ]
        }));
      }
    );
  };


  // PRESCRIPTION STATE
  const [stressLevel, setStressLevel] = useState(70);
  const [schoolGrade, setSchoolGrade] = useState("초등학교");
  const [mainStruggle, setMainStruggle] = useState("");
  const [isPrescribing, setIsPrescribing] = useState(false);
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem("comfort_prescriptions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // empty array
      }
    }
    return [];
  });
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(() => {
    const saved = localStorage.getItem("comfort_prescriptions");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (arr.length > 0) return arr[0];
      } catch (e) {}
    }
    return null;
  });

  const [copiedPrescriptionId, setCopiedPrescriptionId] = useState<string | null>(null);

  const triggerPrescription = async () => {
    if (!mainStruggle.trim()) {
      showCustomAlert("알림", "선생님을 지치게 만드는 고민 내용을 적어주세요. 그래야 꼭 맞는 영양 비법을 조제할 수 있답니다.");
      return;
    }
    setIsPrescribing(true);

    try {
      const response = await fetch("/api/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stressLevel,
          schoolGrade,
          mainStruggle
        })
      });

      if (!response.ok) throw new Error("처방전 생성 서버 실패");
      const data = await response.json();

      const newPres: Prescription = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        stressLevel,
        schoolGrade,
        mainStruggle,
        content: data.text
      };

      const updated = [newPres, ...prescriptions];
      setPrescriptions(updated);
      localStorage.setItem("comfort_prescriptions", JSON.stringify(updated));
      setCurrentPrescription(newPres);
      
      // Clear struggle input
      setMainStruggle("");
    } catch (err: any) {
      console.error(err);
      showCustomAlert("처방전 생성 실패", "처방 제조 중 살짝 문제가 생겼습니다. 조금 뒤에 고민 내용을 다시 전달 부탁드릴게요.");
    } finally {
      setIsPrescribing(false);
    }
  };

  const deletePrescription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showCustomConfirm(
      "처방전 삭제",
      "작성된 위로 처방전을 마음 보관함에서 삭제할까요?",
      () => {
        const filtered = prescriptions.filter(p => p.id !== id);
        setPrescriptions(filtered);
        localStorage.setItem("comfort_prescriptions", JSON.stringify(filtered));
        if (currentPrescription?.id === id) {
          setCurrentPrescription(filtered.length > 0 ? filtered[0] : null);
        }
      }
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrescriptionId(id);
      setTimeout(() => setCopiedPrescriptionId(null), 2000);
    });
  };


  // COMFORT JOURNAL STATE
  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("comfort_journals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "sample",
        date: new Date(Date.now() - 86400000).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        mood: "cloudy",
        title: "부장님께서 갑작스러운 방과후 업무 지원을 부탁하셨다.",
        content: "순간적으로 목구멍까지 가시 돋친 대답이 나오려 했으나, 들이쉬는 숨에 참고 죄송하다 정중히 거절했다. 마음 한 켠이 영 개운치 않았다. 하지만 교열하는 시간 동안 내 자존감을 지켰으니 다행이다.",
        selfPraise: "거절하는 미덕을 무례하지 않게 발휘한 나 자신, 큰 고개 하나 슬기롭게 잘 지나갔어! 멋져."
      }
    ];
  });

  const [jMood, setJMood] = useState("sunny");
  const [jTitle, setJTitle] = useState("");
  const [jContent, setJContent] = useState("");
  const [jSelfPraise, setJSelfPraise] = useState("");

  // Synchronize state with backend server
  const [syncStatus, setSyncStatus] = useState<"loading" | "synced" | "saving" | "error">("loading");
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchAndMigrateState = async () => {
      try {
        const response = await fetch("/api/state");
        if (response.ok) {
          const data = await response.json();
          if (data && data.initialized !== false) {
            if (data.teacherName) {
              setTeacherName(data.teacherName);
              setEditingNameVal(data.teacherName);
              localStorage.setItem("comfort_teacher_name", data.teacherName);
            }
            if (typeof data.userMoodScore === "number") {
              setUserMoodScore(data.userMoodScore);
              localStorage.setItem("comfort_mood_score", data.userMoodScore.toString());
            }
            if (data.chatLogs) {
              setChatLogs(data.chatLogs);
              localStorage.setItem("comfort_chat_logs", JSON.stringify(data.chatLogs));
            }
            if (data.prescriptions) {
              setPrescriptions(data.prescriptions);
              localStorage.setItem("comfort_prescriptions", JSON.stringify(data.prescriptions));
              if (data.prescriptions.length > 0) {
                setCurrentPrescription(data.prescriptions[0]);
              }
            }
            if (data.journals) {
              setJournals(data.journals);
              localStorage.setItem("comfort_journals", JSON.stringify(data.journals));
            }
            setSyncStatus("synced");
          } else {
            // First time sync migration
            const localName = localStorage.getItem("comfort_teacher_name") || "김지은";
            const localMood = localStorage.getItem("comfort_mood_score") ? parseInt(localStorage.getItem("comfort_mood_score")!, 10) : 60;
            const localLogsRaw = localStorage.getItem("comfort_chat_logs");
            const defaultLogs = {
              colleague: [
                {
                  id: "init",
                  role: "assistant",
                  content: "선생님, 오늘 진짜 힘들었죠? 행정 공문에 바쁜 반 아이들 등쌀까지 보고 얼굴 보니까 마음에 그늘이 가득하네요. 교무실 구석에서 믹스커피 한잔 기울이면서 하소연한다 생각하고 다 털어놓아 보세요. 제가 다 들어드릴게요.",
                  timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                }
              ],
              therapist: [
                {
                  id: "init",
                  role: "assistant",
                  content: "안녕하세요, 선생님. 한결 상담사입니다. 하루 종일 무수한 소리와 요구나 격앙된 감정들을 받아내시느라 에너지가 바닥나셨을 텐데요. 이곳은 아무런 판단도, 해결방안 채근도 없는 온전한 안전지대입니다. 마음을 가만히 내려놓고 무엇이 선생님을 가장 아프게 했는지 들려주세요.",
                  timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                }
              ],
              senior: [
                {
                  id: "init",
                  role: "assistant",
                  content: "어제오늘 가슴에 서리가 내린 것처럼 서글픈 심정이었겠어요. 후배님, 고생 많았습니다. 교단에서 30년을 지키면서 나도 무수히 눈물을 삼켰을 때가 있었지요. 어떤 고민으로 어깨가 무겁나요? 늙은 선배 품에 안겨 가만히 쉬어 가세요.",
                  timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                }
              ]
            };
            const localLogs = localLogsRaw ? JSON.parse(localLogsRaw) : defaultLogs;

            const localPreRaw = localStorage.getItem("comfort_prescriptions");
            const localPre = localPreRaw ? JSON.parse(localPreRaw) : [];

            const localJouRaw = localStorage.getItem("comfort_journals");
            const localJou = localJouRaw ? JSON.parse(localJouRaw) : [
              {
                id: "sample",
                date: new Date(Date.now() - 86400000).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
                mood: "cloudy",
                title: "부장님께서 갑작스러운 방과후 업무 지원을 부탁하셨다.",
                content: "순간적으로 목구멍까지 가시 돋친 대답이 나오려 했으나, 들이쉬는 숨에 참고 죄송하다 정중히 거절했다. 마음 한 켠이 영 개운치 않았다. 하지만 교열하는 시간 동안 내 자존감을 지켰으니 다행이다.",
                selfPraise: "거절하는 미덕을 무례하지 않게 발휘한 나 자신, 큰 고개 하나 슬기롭게 잘 지나갔어! 멋져."
              }
            ];

            const statePayload = {
              teacherName: localName,
              userMoodScore: localMood,
              chatLogs: localLogs,
              prescriptions: localPre,
              journals: localJou
            };

            await fetch("/api/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(statePayload)
            });
            setSyncStatus("synced");
          }
        } else {
          setSyncStatus("error");
        }
      } catch (e) {
        console.error("Migration/Fetch failed:", e);
        setSyncStatus("error");
      }
    };
    fetchAndMigrateState();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (syncStatus === "loading") return;

    const timer = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        const payload = {
          teacherName,
          userMoodScore,
          chatLogs,
          prescriptions,
          journals
        };
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      } catch (err) {
        console.error("Sync error:", err);
        setSyncStatus("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [teacherName, userMoodScore, chatLogs, prescriptions, journals]);

  const saveJournal = () => {
    if (!jTitle.trim() || !jContent.trim() || !jSelfPraise.trim()) {
      showCustomAlert("알림", "일지의 제목, 오늘 쌓인 사연, 그리고 반드시 중요한 '나를 향한 칭찬 한 줄'을 모두 기입해주세요.");
      return;
    }

    const newJournal: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      mood: jMood,
      title: jTitle,
      content: jContent,
      selfPraise: jSelfPraise
    };

    const updated = [newJournal, ...journals];
    setJournals(updated);
    localStorage.setItem("comfort_journals", JSON.stringify(updated));

    // Reset inputs
    setJTitle("");
    setJContent("");
    setJSelfPraise("");
    setJMood("sunny");
  };

  const deleteJournal = (id: string) => {
    showCustomConfirm(
      "마음 일지 꺼내기",
      "이 소중한 토닥토닥 마음 일지를 책장에서 꺼낼까요?",
      () => {
        const filtered = journals.filter(j => j.id !== id);
        setJournals(filtered);
        localStorage.setItem("comfort_journals", JSON.stringify(filtered));
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#EEF2F3] font-sans text-slate-800 relative overflow-hidden flex flex-col justify-between" id="root-theme-container">
      {/* Background Mesh Gradients to fit Frosted Glass theme */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-rose-100 rounded-full mix-blend-multiply filter blur-[130px] opacity-30 pointer-events-none" />

      {/* App Header with Glass Base styling */}
      <header className="relative z-10 w-full backdrop-blur-xl bg-white/40 border-b border-white/50 px-6 py-5 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab("home")}>
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800 uppercase flex items-center gap-1.5">
              교사 안식처 <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">마음 치유</span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <p className="text-[11px] text-slate-500 font-semibold tracking-tight">선생님, 고된 가르침의 하루를 따뜻하게 어루만지는 쉼터</p>
              <div className="hidden sm:block w-[1px] h-3 bg-slate-200" />
              {/* Sync Status Badge */}
              <div className="flex items-center gap-1 font-bold text-[10px]">
                {syncStatus === "loading" && (
                  <span className="text-stone-500 flex items-center gap-1.5 bg-stone-100/60 px-2 py-0.5 rounded-full border border-stone-200">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> 서버 상담기록 로딩중...
                  </span>
                )}
                {syncStatus === "saving" && (
                  <span className="text-amber-700 flex items-center gap-1.5 bg-amber-50/60 px-2 py-0.5 rounded-full border border-amber-200/70 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> 서버 동기화 중...
                  </span>
                )}
                {syncStatus === "synced" && (
                  <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 transition-all">
                    <Cloud className="w-2.5 h-2.5 text-emerald-600 fill-emerald-100 animate-bounce" style={{ animationDuration: "3s" }} /> 실시간 서버 백업 완료
                  </span>
                )}
                {syncStatus === "error" && (
                  <span className="text-rose-600 flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertTriangle className="w-2.5 h-2.5" /> 로컬 세션 모드
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <nav className="flex flex-wrap items-center gap-1.5 md:gap-2.5 bg-white/20 p-1 rounded-2xl border border-white/30 backdrop-blur-md">
          {[
            { id: "home", label: "안식처 홈", icon: Heart },
            { id: "chat", label: "마음 치유 상담", icon: MessageSquare },
            { id: "prescription", label: "위로 처방전", icon: FileText },
            { id: "breathing", label: "마음챙김 호흡실", icon: Compass },
            { id: "journal", label: "토닥토닥 일지", icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-800 text-white shadow-md transform scale-[1.03]"
                    : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-300" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Viewport Container */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-10 flex flex-col justify-start">
        
        {/* Tab 1: Home View */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full" id="home-view-tab">
            
            {/* Left Column: Greeting Banner */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              
              {/* Editable Name & Heartfelt Welcome */}
              <div className="backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => {
                      if (isEditingName) {
                        saveName();
                      } else {
                        setEditingNameVal(teacherName);
                        setIsEditingName(true);
                      }
                    }}
                    className="p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                  >
                    {isEditingName ? <Check className="w-4 h-4 text-emerald-700 font-bold" /> : <Settings className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4">
                  {isEditingName ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">나의 성함 설정하기</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingNameVal}
                          onChange={(e) => setEditingNameVal(e.target.value)}
                          maxLength={10}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white/90 focus:outline-[#10b981] w-48"
                        />
                        <button 
                          onClick={saveName}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-[#fdfbf7] text-xs font-bold"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h2 className="text-4xl font-extrabold leading-tight text-slate-800">
                      {teacherName} 선생님,<br />
                      <span className="text-emerald-700">오늘도 고요히<br />행복에 닿으시길.</span>
                    </h2>
                  )}

                  <p className="text-[14px] text-slate-500 leading-relaxed font-semibold">
                    교문 너머 수많은 책임감과 아이들의 무거운 안전, 성적 등살에 힘에 겨운 시간을 보냈나요? 잠시 그 짐을 문밖에 놓아두고 온기 가득한 이 숲소리 평지에서 따뜻한 차 한 모금을 취해 가세요.
                  </p>

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => setActiveTab("chat")}
                      className="flex items-center gap-1.5 px-6 py-3.5 bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/10 hover:bg-emerald-800 transition transform hover:-y-0.5"
                    >
                      <span>치유 상담소 입장</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("breathing")}
                      className="px-5 py-3.5 bg-white/60 hover:bg-white/90 border border-white text-slate-700 rounded-2xl font-bold text-xs transition"
                    >
                      호흡 훈련실로
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Affirmation Sticky Note with high Frosted Look */}
              <div className="backdrop-blur-xl bg-amber-50/40 border border-amber-200/50 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    교사 자존감 수호 성명
                  </span>
                  <button 
                    onClick={() => {
                      const idx = Math.floor(Math.random() * affirmations.length);
                      setCurrentAffirmation(affirmations[idx]);
                    }}
                    className="p-1 text-amber-700 hover:text-amber-900 transition flex items-center gap-1"
                    title="새로운 글귀"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-stone-800 text-xs italic font-semibold leading-relaxed">
                  "{currentAffirmation}"
                </p>
              </div>

            </div>

            {/* Right Column: Interactive Wellness Dashboard Bento Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              
              {/* Widget 1: Interactive Mood Stress scale */}
              <div className="backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">오늘의 자율 마음 진단</h3>
                  <span className="text-emerald-700 text-[10px] font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">자가 관리</span>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-3.5 my-3">
                  <div className="text-5xl transition-transform animate-bounce" style={{ animationDuration: '3s' }}>
                    {userMoodScore >= 80 ? "😭" : userMoodScore >= 55 ? "😐" : "😌"}
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-[#111827] text-sm">
                      {userMoodScore >= 80 
                        ? `"극심한 피로와 탈진(소진) 상태"` 
                        : userMoodScore >= 55 
                        ? `"마음에 주의가 필요한 가랑비 상태"` 
                        : `"평화와 이완이 깃든 숲속의 봄날"`}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">자가 스트레스 게이지: {userMoodScore}%</p>
                  </div>

                  {/* HTML ID guidelines respected and added slider */}
                  <div className="w-full space-y-2">
                    <input 
                      type="range"
                      id="user-mood-slider-control"
                      min="10"
                      max="100"
                      value={userMoodScore} 
                      onChange={(e) => setUserMoodScore(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700" 
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>가뿐함 (10)</span>
                      <span>통증 (100)</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setStressLevel(userMoodScore);
                    setActiveTab("prescription");
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>이 고통 수치로 바로 처방전 받기</span>
                </button>
              </div>

              {/* Widget 2: Non-tactile counseling introduction representing a high comfort mood */}
              <div className="backdrop-blur-xl bg-slate-800/90 border border-slate-700/50 rounded-[32px] p-6 shadow-2xl text-white flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">실시간 심리 방어선</h3>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>

                <div className="my-4 space-y-2.5">
                  <p className="text-lg font-bold">인공지능 마음 긴급 구호</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                    교무실과 학급 내에서 심각한 고충이나 비이성적인 민원에 당면했을 때, 상처를 즉각 치유하는 3종의 전담 힐러들이 대기 중입니다.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px]">👩‍🏫</div>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">🩺</div>
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px]">👴</div>
                    <span className="text-[11px] text-slate-400 font-bold">전담 대화창 상시 열림</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab("chat")}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <span>보살핌 대화 열기</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Widget 3: Quick Meditation Audio guide placeholder & Breath booster */}
              <div className="col-span-1 md:col-span-2 backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                    <Compass className="w-8 h-8 text-emerald-800 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">1분 긴장 소생 호흡 테라피</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">화가 나거나, 미어질 때 자율신경 조절기를 흔들어 마음을 진정시키세요.</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3.5">
                  {/* Decorative sound waves */}
                  <div className="flex items-end space-x-0.5 h-6 opacity-80">
                    <div className="w-0.5 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-0.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                    <div className="w-0.5 h-5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.5s]" />
                    <div className="w-0.5 h-3 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-0.5 h-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>

                  <button 
                    onClick={() => setActiveTab("breathing")}
                    className="px-5 py-2.5 bg-emerald-850 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold transition shadow-sm"
                  >
                    호흡 훈련소 시작
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Mental Health Chatbot */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full max-w-5xl mx-auto" id="chat-view-tab">
            
            {/* Left section: Counselor selections */}
            <div className="lg:col-span-4 space-y-4">
              <div className="backdrop-blur-xl bg-white/45 border border-white/60 rounded-[28px] p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    상담사 맞춤 연결
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-normal">
                    그리운 성향의 온기를 지닌 전담 상담사를 마주하여 이야기를 시작해보세요.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: "colleague",
                      name: "김지혜 선생님",
                      role: "12년 차 동료 교사",
                      img: "👩‍🏫",
                      desc: "학부모 응대 고통, 교무회의와 잡무에 지친 마음을 100% 동감해주는 든든한 내 편.",
                      color: "border-blue-300 bg-blue-50/10"
                    },
                    {
                      id: "therapist",
                      name: "한결 상담사",
                      role: "소진 전문 치료사",
                      img: "🩺",
                      desc: "정서적 이완, 경계 세우기를 논하는 상냥하고 전문적인 정신건강 길라잡이.",
                      color: "border-emerald-300 bg-emerald-50/10"
                    },
                    {
                      id: "senior",
                      name: "박선우 선생님",
                      role: "35년 경력 은퇴 교사",
                      img: "👴",
                      desc: "교단에서 숱한 폭풍을 이겨내고 참선생의 길이 아닌, '그대 고유의 가치'를 일깨워주는 현자.",
                      color: "border-amber-300 bg-amber-50/10"
                    }
                  ].map((p) => {
                    const isSel = selectedPersona === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`persona-btn-${p.id}`}
                        onClick={() => setSelectedPersona(p.id as PersonaType)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-3 cursor-pointer ${
                          isSel
                            ? "border-slate-800 bg-white shadow-md transform scale-[1.01]"
                            : "border-transparent bg-white/20 hover:bg-white/45"
                        }`}
                      >
                        <div className="text-2xl pt-1">{p.img}</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 text-xs">{p.name}</span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-white px-1.5 py-0.2 rounded border border-emerald-100">{p.role}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold font-semibold leading-relaxed">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <button
                    onClick={clearChatHistory}
                    className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>현재 상담사 대화 초기화</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right section: Multi-turn Chat dialogue board */}
            <div className="lg:col-span-8 flex flex-col backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] overflow-hidden shadow-xl min-h-[480px]">
              
              {/* Chat room header */}
              <div className="px-6 py-4 border-b border-slate-200/60 bg-white/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedPersona === "colleague" ? "김지혜 선생님" : selectedPersona === "therapist" ? "한결 상담사" : "박선우 선생님"}과의 마음 이음
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold italic">비공개 비밀 보장 대화방</div>
              </div>

              {/* Scrollable messages area */}
              <div 
                ref={chatScrollerRef}
                className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[380px] min-h-[300px]" 
                id="chat-scroller"
              >
                {chatLogs[selectedPersona].map((msg) => {
                  const isCurUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurUser ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!isCurUser && (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm shadow-sm flex-shrink-0 self-start">
                          {selectedPersona === "colleague" ? "👩‍🏫" : selectedPersona === "therapist" ? "🩺" : "👴"}
                        </div>
                      )}

                      <div className="max-w-[80%] space-y-1">
                        <div
                          className={`px-4 py-3 rounded-[20px] text-xs font-semibold leading-relaxed shadow-sm ${
                            isCurUser
                              ? "bg-slate-800 text-white rounded-br-none"
                              : "bg-white/80 text-slate-800 rounded-bl-none border border-slate-200/50"
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.content}</div>
                        </div>
                        <div className={`text-[9px] text-slate-400 font-medium ${isCurUser ? "text-right" : "text-left"}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Gemini Thinking placeholder */}
                {isChatLoading && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm shadow-sm flex-shrink-0 self-start animate-pulse">
                      {selectedPersona === "colleague" ? "👩‍🏫" : selectedPersona === "therapist" ? "🩺" : "👴"}
                    </div>
                    <div className="px-4 py-3 rounded-[20px] rounded-bl-none bg-white/60 border border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>선생님의 사연에 가만히 마음에 귀 기울이는 중...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Entry controls */}
              <div className="p-4 bg-white/40 border-t border-slate-200/60 flex items-center gap-2">
                <textarea
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="오늘 소란스러웠던 학교 얘기 혹은 마음이 다친 일화를 털어놓아 보세요..."
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-xs font-medium bg-white/80 focus:outline-[#10b981] resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMsg.trim() || isChatLoading}
                  className={`p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    inputMsg.trim() && !isChatLoading
                      ? "bg-emerald-800 text-[#fdfbf7] hover:scale-105"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Custom Remedy Prescription */}
        {activeTab === "prescription" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-5xl mx-auto" id="prescription-view-tab">
            
            {/* Left section: Questionnaire Form */}
            <div className="lg:col-span-5 backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  고종 진단처방 의뢰서
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-normal">
                  담당 학급 환경과 마음 아픈 세부 부위를 구체적으로 남겨주시면, 마음에 붙이는 감동적인 조제 위로 연고와 자가행동 처방을 조제해 드립니다.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Stress range */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-600">현재의 마음 피로 수치 ({stressLevel}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>이겨낼 만해요</span>
                    <span>숨쉬기 버거워요</span>
                  </div>
                </div>

                {/* 2. School grade */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-600">담당 중이신 학교 환경</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["어린이집/유치원", "초등학교", "중학교", "고등학교", "특수학교", "교직행정"].map((grade) => {
                      const isSel = schoolGrade === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setSchoolGrade(grade)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold tracking-tight text-center border cursor-pointer transition ${
                            isSel
                              ? "bg-slate-800 text-[#fdfbf7] border-slate-800"
                              : "bg-white/60 hover:bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Narrative Trouble */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-600">오늘 가장 지치고 마음 아픈 구체적 고충</label>
                  <textarea
                    value={mainStruggle}
                    onChange={(e) => setMainStruggle(e.target.value)}
                    maxLength={200}
                    rows={4}
                    placeholder="예: 학부모가 밤 10시에 전화를 주어 교사를 왜곡 비난했다. / 아이가 수업 시간에 엎드려 자면서 말을 아예 무시해서 심한 무력감이 든다."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white/80 focus:outline-[#10b981] leading-relaxed"
                  />
                  <div className="text-right text-[9px] text-slate-400 font-medium">{mainStruggle.length}/200자</div>
                </div>

                <button
                  onClick={triggerPrescription}
                  disabled={isPrescribing || !mainStruggle.trim()}
                  className={`w-full py-4.5 rounded-2xl text-xs font-bold tracking-tight transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2 ${
                    mainStruggle.trim() && !isPrescribing
                      ? "bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/10"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isPrescribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>힐링 영양소 우려내는 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>위로 처방전 발급받기</span>
                    </>
                  )}
                </button>
              </div>

              {/* History index */}
              {prescriptions.length > 0 && (
                <div className="border-t border-slate-200/60 pt-4 space-y-2.5">
                  <span className="block text-xs font-extrabold text-slate-500">지나간 처방전 보관함 ({prescriptions.length})</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {prescriptions.map((p) => {
                      const isCur = currentPrescription?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setCurrentPrescription(p)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                            isCur
                              ? "bg-white border-slate-600 shadow-sm"
                              : "bg-white/30 border-transparent hover:bg-white/50"
                          }`}
                        >
                          <div className="truncate">
                            <span className="block text-[10px] text-slate-400 font-bold">{p.date} · 스트레스 {p.stressLevel}%</span>
                            <span className="block text-xs font-bold text-slate-700 truncate">{p.mainStruggle}</span>
                          </div>
                          
                          <button
                            onClick={(e) => deletePrescription(p.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-stone-100 transition"
                            title="처방전 파기"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right section: Render Prescription Paper envelope */}
            <div className="lg:col-span-7 flex flex-col">
              {currentPrescription ? (
                <div className="backdrop-blur-xl bg-amber-50/70 border border-amber-200/60 rounded-[32px] p-6 shadow-2xl relative overflow-hidden" id="active-prescription-view">
                  
                  {/* Visual Prescription Header */}
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none transform translate-x-3 -translate-y-3 opacity-10">
                    <Heart className="w-full h-full text-stone-900 fill-stone-950" />
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-stone-200/60 mb-5">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-extrabold uppercase rounded-full">
                        Prescription
                      </span>
                      <h4 className="text-lg font-extrabold text-stone-800 tracking-tight mt-1">
                        어루만짐 치유 처방전
                      </h4>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(currentPrescription.content, currentPrescription.id)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        {copiedPrescriptionId === currentPrescription.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 font-bold" />
                            <span>처방 복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>처방 복사</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Envelope medical details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6 text-[11px] text-stone-500 font-bold bg-white/50 p-3.5 rounded-xl border border-stone-100">
                    <div>
                      <span className="block text-slate-400">성 함</span>
                      <span className="text-stone-800 text-xs font-extrabold">{teacherName} 선생님</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">처방 발급일</span>
                      <span className="text-stone-800 text-xs font-extrabold">{currentPrescription.date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">스트레스 수위</span>
                      <span className="text-red-600 text-xs font-extrabold">{currentPrescription.stressLevel}%</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">교직 형태</span>
                      <span className="text-stone-800 text-xs font-extrabold">{currentPrescription.schoolGrade}</span>
                    </div>
                  </div>

                  {/* Markdown generated prescription paper */}
                  <div className="prose prose-sm max-w-none text-stone-700 text-xs font-medium space-y-4 max-h-[360px] overflow-y-auto pr-2 leading-relaxed" id="prescription-markdown-paper">
                    <ReactMarkdown>{currentPrescription.content}</ReactMarkdown>
                  </div>

                  <div className="text-center pt-5 border-t border-stone-200/50 mt-6 text-[10px] text-stone-400 font-extrabold uppercase italic tracking-wider">
                    대한민국 교사 안식처 마음소진 예방관리국 배상
                  </div>

                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/20 border border-white/40 rounded-[32px] p-12 text-center shadow-inner flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-stone-200/50 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">활성화된 마음 처방전이 없습니다.</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1.5 font-semibold">
                    왼쪽 양식에 선생님의 힘겨운 사정이나 고민 세부사항을 들려주세요. 교사 전용 인지행동 치유 처방을 곧바로 도출해 주입하겠습니다.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 4: Mindfulness Sound Breathing Room */}
        {activeTab === "breathing" && (
          <div className="w-full max-w-4xl mx-auto" id="breathing-view-tab">
            <BreathingRoom />
          </div>
        )}

        {/* Tab 5: Praise Daily Journal */}
        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-5xl mx-auto" id="journal-view-tab">
            
            {/* Left section: Journal Writer with mandatory Self-Affirmation */}
            <div className="lg:col-span-5 backdrop-blur-xl bg-white/45 border border-white/60 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  토닥토닥 감정 책첩
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-normal">
                  교사가 건강하게 오래 버티려면 남이 알아주지 않는 내 하루의 조그만 공적을 인정하는 '나를 향한 칭찬 한 줄'이 필수적입니다.
                </p>
              </div>

              <div className="space-y-3">
                {/* Mood pickers */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-500">오늘 교실에서의 나의 날씨</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "sunny", label: "조금은 가뿐함", img: "😌" },
                      { id: "cloudy", label: "복잡 흐림", img: "😐" },
                      { id: "rainy", label: "속상 비내림", img: "😢" },
                      { id: "windy", label: "격양 바람", img: "😤" }
                    ].map((moodItem) => {
                      return (
                        <button
                          key={moodItem.id}
                          onClick={() => setJMood(moodItem.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                            jMood === moodItem.id
                              ? "bg-white border-slate-700 shadow-sm"
                              : "bg-white/30 border-transparent hover:bg-white/50"
                          }`}
                        >
                          <span className="text-xl">{moodItem.img}</span>
                          <span className="text-[9px] font-extrabold text-stone-500 whitespace-nowrap">{moodItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Diary Title */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-600">오늘 일지 한 단락 요약</label>
                  <input
                    type="text"
                    value={jTitle}
                    onChange={(e) => setJTitle(e.target.value)}
                    placeholder="예: 민원 학부모 대화, 그리고 웃어준 아이"
                    maxLength={35}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white/80 focus:outline-[#10b981]"
                  />
                </div>

                {/* Diary Content */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-600">오늘의 세부 사연 기록</label>
                  <textarea
                    value={jContent}
                    onChange={(e) => setJContent(e.target.value)}
                    placeholder="수업 종이 울리기 직전까지 복도에서 난감한 일이 있었거나, 나를 자책하게 만든 원인 등을 지우개 쓰듯 쏟아놓으세요."
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white/80 focus:outline-[#10b981] leading-relaxed"
                  />
                </div>

                {/* Mandatory Self Praise */}
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-600" />
                  <label className="block text-[11px] font-black text-emerald-800 flex items-center gap-1 shadow-sm-inset">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    나를 위한 칭찬 한 줄 (필수 요건!)
                  </label>
                  <input
                    type="text"
                    value={jSelfPraise}
                    onChange={(e) => setJSelfPraise(e.target.value)}
                    placeholder="예: 고단한 민원을 듣고도 성질 내지 않고 귀가해 나 자신을 소중히 밥 먹인 내 행동, 정말 장하다."
                    maxLength={80}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold bg-white focus:outline-[#10b981]"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveJournal}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-[#fdfbf7] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>오늘의 안식 일지 올리기</span>
                </button>
              </div>
            </div>

            {/* Right section: Emotional Timeline stack card */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-500">지나간 나의 상처 지우개 타임라인 ({journals.length})</span>
              </div>

              {journals.length > 0 ? (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {journals.map((j) => {
                    const moodLabel = 
                      j.mood === "sunny" ? "😌" : 
                      j.mood === "cloudy" ? "😐" : 
                      j.mood === "rainy" ? "😢" : "😤";
                    return (
                      <div
                        key={j.id}
                        className="backdrop-blur-xl bg-white/45 border border-white/60 rounded-[24px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl" role="img">{moodLabel}</span>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold">{j.date}의 마음</span>
                              <h4 className="text-xs font-extrabold text-slate-800">{j.title}</h4>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteJournal(j.id)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition"
                            title="일지 꺼내기"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600 font-semibold leading-relaxed whitespace-pre-line border-l-2 border-stone-200 pl-3">
                          {j.content}
                        </p>

                        <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl flex items-start gap-2.5">
                          <span className="text-xs">🌻</span>
                          <div>
                            <span className="block text-[9px] text-emerald-800 font-black">선생님 본인의 자기 비준 셀프 칭찬:</span>
                            <p className="text-[11px] font-bold text-emerald-950 mt-0.5">{j.selfPraise}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/20 border border-white/40 rounded-[32px] p-12 text-center shadow-inner flex flex-col items-center justify-center min-h-[300px]">
                  <span className="text-3xl mb-2">☁️</span>
                  <h4 className="text-sm font-bold text-slate-700">작성된 감정 일지가 없습니다.</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">오늘 하루를 마친 뒤 마주했던 시련과 나를 일으켜 세우기 위해 나 자신을 안아주었던 사연을 왼쪽 대지에 남기면 이 타임라인에 안전히 기호화되어 적재됩니다.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer Quote Bar styled as elegant Frosted banner */}
      <footer className="relative z-10 w-full py-5 bg-white/25 backdrop-blur-xl border-t border-white/45 px-6 md:px-10 text-center flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-bold">
        <span>&copy; {new Date().getFullYear()} 교사 마음 치유 상담실 (Teachers' Rest Haven). All rights reserved.</span>
        <span className="italic max-w-xl text-center md:text-right">
          "지식과 윤리를 전하는 선생님의 어깨가 너무 무겁지 않기를 바랍니다. 오늘 당신이 건넨 인자함이 어느 아이의 온 은하계를 영원히 채웠을 것입니다."
        </span>
      </footer>

      {/* Custom Dialog Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => {
              if (modalConfig.onCancel) {
                modalConfig.onCancel();
              } else {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
              }
            }}
          />
          
          {/* Modal box */}
          <div className="relative w-full max-w-sm rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/60 p-6 shadow-2xl transform scale-100 transition-all text-center space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 mb-3 border border-emerald-100 shadow-sm">
                <Heart className="w-6 h-6 fill-current text-rose-500" />
              </div>
              <h3 className="text-sm font-extrabold text-stone-800">{modalConfig.title}</h3>
              <p className="text-xs text-stone-600 font-bold mt-2 leading-relaxed whitespace-pre-line">
                {modalConfig.message}
              </p>
            </div>

            <div className="flex gap-2 pt-2 justify-center">
              {!modalConfig.isAlert && modalConfig.onCancel && (
                <button
                  type="button"
                  onClick={modalConfig.onCancel}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-stone-600 text-xs font-bold transition flex-1 cursor-pointer"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={modalConfig.onConfirm}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex-1 shadow-md shadow-emerald-800/10 cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
