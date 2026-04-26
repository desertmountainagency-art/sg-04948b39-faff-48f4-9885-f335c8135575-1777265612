import { Home, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: "scan" | "reports" | "settings";
  onTabChange: (tab: "scan" | "reports" | "settings") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "scan" as const, icon: Home, label: "SCAN" },
    { id: "reports" as const, icon: FileText, label: "REPORTS" },
    { id: "settings" as const, icon: Settings, label: "SETTINGS" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors",
                "min-w-0 flex-1",
                isActive ? "text-accent-cyan" : "text-text-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-bold tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}