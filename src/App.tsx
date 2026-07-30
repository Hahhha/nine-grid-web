import { useMemo } from "react";
import { STORAGE_KEYS } from "./app/storageKeys";
import { useLocalState } from "./hooks/useLocalState";
import { PlanningPage } from "./pages/PlanningPage";
import { PlacementPage } from "./pages/PlacementPage";
import { SynthesisPage } from "./pages/SynthesisPage";

type TabKey = "synthesis" | "planning" | "placement";

const TABS: { key: TabKey; label: string }[] = [
  { key: "synthesis", label: "合成概率" },
  { key: "planning", label: "规划路线" },
  { key: "placement", label: "摆放推荐" },
];

export default function App() {
  const [activeTab, setActiveTab] = useLocalState<TabKey>(STORAGE_KEYS.uiTab, "synthesis");

  const content = useMemo(() => {
    switch (activeTab) {
      case "planning":
        return <PlanningPage />;
      case "placement":
        return <PlacementPage />;
      case "synthesis":
      default:
        return <SynthesisPage />;
    }
  }, [activeTab]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Nine Grid Calculator</p>
          <h1>九宫组合计算器 Web</h1>
          <p className="header-copy">
            先把合成概率和规划路线迁到网页端，数据默认只保存在当前浏览器。
          </p>
        </div>
      </header>

      <nav className="tab-bar" aria-label="主功能">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="page-content">{content}</main>
    </div>
  );
}
