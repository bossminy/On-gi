import { Heart, Compass, MessageSquare, FileText, Calendar } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: "home", label: "안식처 홈", icon: Heart },
    { id: "chat", label: "마음 치유 상담", icon: MessageSquare },
    { id: "prescription", label: "나만의 위로 처방전", icon: FileText },
    { id: "breathing", label: "마음챙김 호흡실", icon: Compass },
    { id: "journal", label: "토닥토닥 일지", icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#ebdcd0] px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand logo & tagline */}
        <div 
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 cursor-pointer group"
          id="header-brand-logo"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800 tracking-tight flex items-center gap-1.5">
              교사 마음 치유 상담실
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">선생님, 오늘 하루도 참 고생 많으셨습니다</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center flex-wrap gap-1 md:gap-2" id="header-nav-menu">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-800 text-[#fdfbf7] shadow-sm transform scale-102"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-300" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
