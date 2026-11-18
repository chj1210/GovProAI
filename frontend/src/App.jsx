import React, { useState, useEffect } from 'react';
import Stage1CertificationCoach from './components/Stage1CertificationCoach';
import Stage2LifecycleNavigator from './components/Stage2LifecycleNavigator';
import Stage3AuditInvestigator from './components/Stage3AuditInvestigator';
import SlideOverDrawer from './components/SlideOverDrawer';

export default function App() {
  const [activeStage, setActiveStage] = useState('stage1');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({
    law_cards: [],
    textbook_citations: [],
    agent_topology: { nodes: [], edges: [], execution_trace: [] },
  });

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.default_drawer_data) {
          setDrawerData(data.default_drawer_data);
        }
      })
      .catch((err) => console.error('Health init error:', err));
  }, []);

  const handleOpenDrawerWithLaw = (lawQuery) => {
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: lawQuery, stage: activeStage }),
    })
      .then((r) => r.json())
      .then((data) => {
        setDrawerData({
          law_cards: data.law_cards || [],
          textbook_citations: data.textbook_citations || [],
          agent_topology: data.agent_topology || {},
        });
        setDrawerOpen(true);
      });
  };

  const handleUpdateDrawer = (newDrawerData) => {
    setDrawerData((prev) => ({
      law_cards: newDrawerData.law_cards || prev.law_cards,
      textbook_citations: newDrawerData.textbook_citations || prev.textbook_citations,
      agent_topology: newDrawerData.agent_topology || prev.agent_topology,
    }));
  };

  return (
    <div className="govpro-v2-app">
      {/* 頂部高雅明亮公務導航列 ＋ 三階段漸進式領航切換器 (3-Stage Stepper) */}
      <header className="executive-topbar">
        <div className="topbar-brand">
          <div className="brand-emblem">🏛️</div>
          <div className="brand-titles">
            <span className="brand-eyebrow">EXECUTIVE PROCUREMENT AI NAVIGATOR V2.0 · 115年最新法規基準</span>
            <span className="brand-main">政府採購 AI 領航員平台 V2.0</span>
          </div>
        </div>

        <nav className="three-stage-stepper" aria-label="三階段漸進式領航切換器">
          <button
            className={activeStage === 'stage1' ? 'stepper-tab active stage1-tab' : 'stepper-tab'}
            onClick={() => setActiveStage('stage1')}
          >
            <span className="step-num">STAGE 1</span>
            <span className="step-title">🎓 階段一：考證培訓賦能</span>
            <span className="step-desc">採購專業人員基礎/進階認證教練</span>
          </button>

          <div className="stepper-arrow">➔</div>

          <button
            className={activeStage === 'stage2' ? 'stepper-tab active stage2-tab' : 'stepper-tab'}
            onClick={() => setActiveStage('stage2')}
          >
            <span className="step-num">STAGE 2</span>
            <span className="step-title">🧭 階段二：採購實務領航</span>
            <span className="step-desc">全生命週期五階段智慧辦案助理</span>
          </button>

          <div className="stepper-arrow">➔</div>

          <button
            className={activeStage === 'stage3' ? 'stepper-tab active stage3-tab' : 'stepper-tab'}
            onClick={() => setActiveStage('stage3')}
          >
            <span className="step-num">STAGE 3</span>
            <span className="step-title">⚖️ 階段三：監察查核領航</span>
            <span className="step-desc">工程查核、採購稽核與監察防弊雷達</span>
          </button>
        </nav>

        <div className="topbar-actions">
          <button
            className="btn-drawer-trigger"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            📚 法規溯源與 AI 軌跡抽屜 ({(drawerData.law_cards || []).length})
          </button>
        </div>
      </header>

      {/* 極簡聚焦主工作區：一次僅呈現一個階段 */}
      <main className="executive-main-workspace">
        {activeStage === 'stage1' && (
          <Stage1CertificationCoach onOpenDrawerWithLaw={handleOpenDrawerWithLaw} />
        )}
        {activeStage === 'stage2' && (
          <Stage2LifecycleNavigator onUpdateDrawer={handleUpdateDrawer} />
        )}
        {activeStage === 'stage3' && (
          <Stage3AuditInvestigator onUpdateDrawer={handleUpdateDrawer} />
        )}
      </main>

      {/* 右側可收合法規溯源與 AI 代理軌跡抽屜 (Slide-over Drawer) */}
      <SlideOverDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        drawerData={drawerData}
      />
    </div>
  );
}
