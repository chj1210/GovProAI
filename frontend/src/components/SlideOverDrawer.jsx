import React, { useState } from 'react';

export default function SlideOverDrawer({ isOpen, onClose, drawerData }) {
  const [activeTab, setActiveTab] = useState('laws');

  const lawCards = (drawerData && drawerData.law_cards) ? drawerData.law_cards : [];
  const citations = (drawerData && drawerData.textbook_citations) ? drawerData.textbook_citations : [];
  const topology = (drawerData && drawerData.agent_topology) ? drawerData.agent_topology : { nodes: [], edges: [], execution_trace: [] };
  const traceList = topology.execution_trace || [];

  return (
    <div className={isOpen ? "drawer-backdrop open" : "drawer-backdrop"} onClick={onClose}>
      <aside
        className={isOpen ? "slide-over-drawer open" : "slide-over-drawer"}
        onClick={(e) => e.stopPropagation()}
        aria-label="法規溯源與 AI 代理軌跡抽屜"
      >
        <div className="drawer-header">
          <div>
            <span className="drawer-eyebrow">LEGAL PROVENANCE &amp; LANGGRAPH TRACE</span>
            <h2 className="drawer-title">📚 法規溯源與 AI 代理軌跡抽屜</h2>
          </div>
          <button className="btn-drawer-close" onClick={onClose} title="收合抽屜">
            ✕ 收合
          </button>
        </div>

        <div className="drawer-tabs">
          <button
            className={activeTab === 'laws' ? 'drawer-tab active' : 'drawer-tab'}
            onClick={() => setActiveTab('laws')}
          >
            ⚖️ 母法×細則對照 ({lawCards.length})
          </button>
          <button
            className={activeTab === 'citations' ? 'drawer-tab active' : 'drawer-tab'}
            onClick={() => setActiveTab('citations')}
          >
            📖 教材出處頁碼 ({citations.length})
          </button>
          <button
            className={activeTab === 'topology' ? 'drawer-tab active' : 'drawer-tab'}
            onClick={() => setActiveTab('topology')}
          >
            🕸️ LangGraph 拓撲圖
          </button>
        </div>

        <div className="drawer-body">
          {activeTab === 'laws' && (
            <div className="drawer-section">
              <div className="drawer-section-intro">
                同步對照《政府採購法》母法主文與《施行細則／相關子法》及 115 年最新修法重點：
              </div>
              {lawCards.map((card, idx) => (
                <div key={card.article_no || idx} className="drawer-law-card">
                  <div className="drawer-law-card-header">
                    <span className="badge-navy">{card.article_no}</span>
                    <strong className="drawer-law-card-title">{card.title}</strong>
                    <span className="badge-amber">{card.textbook_page}</span>
                  </div>
                  <div className="drawer-dual-columns">
                    <div className="drawer-col mother-col">
                      <div className="col-label">《政府採購法》母法主文</div>
                      <p className="col-text">{card.mother_law}</p>
                    </div>
                    <div className="drawer-col rule-col">
                      <div className="col-label">《{card.enforcement_rule_no}》</div>
                      <p className="col-text">{card.enforcement_rule}</p>
                    </div>
                  </div>
                  <div className="drawer-commentary-box">
                    <strong>💡 工程會教材精解：</strong>
                    <span>{card.textbook_commentary}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="drawer-section">
              <div className="drawer-section-intro">
                工程會採購專業人員基礎／進階訓練標準教材出處頁碼與核心考點索引：
              </div>
              {citations.map((cit, idx) => (
                <div key={idx} className="citation-item-card">
                  <div className="citation-header">
                    <span className="badge-emerald">{cit.article_no} — {cit.title}</span>
                    <span className="citation-page-tag">📄 {cit.page}</span>
                  </div>
                  <p className="citation-highlight">{cit.highlight}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'topology' && (
            <div className="drawer-section">
              <div className="drawer-section-intro">
                LangGraph 多代理狀態圖（StateGraph）即時調度拓撲與節點執行軌跡：
              </div>
              <div className="topology-flow-container">
                {traceList.map((step, idx) => (
                  <div key={step.node_id || idx} className="topology-node-wrapper">
                    <div className="topology-node-card">
                      <div className="topology-node-top">
                        <span className="topology-step-num">STEP {idx + 1}</span>
                        <span className="topology-node-name">{step.node_label}</span>
                        <span className="badge-emerald">{step.status} ({step.latency_ms || 0.5} ms)</span>
                      </div>
                      <div className="topology-node-detail">{step.detail}</div>
                    </div>
                    {idx !== traceList.length - 1 && (
                      <div className="topology-connector">⬇ StateGraph Edge</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
