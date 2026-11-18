import React, { useState, useEffect } from 'react';

export default function Stage2LifecycleNavigator({ onUpdateDrawer }) {
  const [lifecycleStages, setLifecycleStages] = useState([]);
  const [selectedStageNo, setSelectedStageNo] = useState(1);
  const [checkedItems, setCheckedItems] = useState({});
  const [aiQuery, setAiQuery] = useState('經濟部辦理 4.5 億元水利工程，基本設計是否須送工程會審議？是否應成立採購工作及審查小組？');
  const [aiResult, setAiResult] = useState(null);
  const [activeCalc, setActiveCalc] = useState('calc1');

  // Calculator 1 State (門檻與 GPA/招決標配對器)
  const [c1Amount, setC1Amount] = useState(55000000);
  const [c1Category, setC1Category] = useState('engineering');
  const [c1Entity, setC1Entity] = useState('central');
  const [c1Ministry, setC1Ministry] = useState('moi_moea_moa');
  const [c1ElecNotice, setC1ElecNotice] = useState(true);
  const [c1ElecDoc, setC1ElecDoc] = useState(true);
  const [c1ElecBid, setC1ElecBid] = useState(true);
  const [c1Result, setC1Result] = useState(null);

  // Calculator 2 State (工程資格與三級品管核算器)
  const [c2Budget, setC2Budget] = useState(6800000);
  const [c2Height, setC2Height] = useState(0);
  const [c2Depth, setC2Depth] = useState(0);
  const [c2Span, setC2Span] = useState(4);
  const [c2Road, setC2Road] = useState(true);
  const [c2Result, setC2Result] = useState(null);

  // Calculator 3 State (物價指數三層級 & 實作數量 3%/30%)
  const [c3Valuation, setC3Valuation] = useState(10000000);
  const [c3IndPct, setC3IndPct] = useState(14.0);
  const [c3IndAmt, setC3IndAmt] = useState(3000000);
  const [c3CatPct, setC3CatPct] = useState(7.0);
  const [c3CatAmt, setC3CatAmt] = useState(4000000);
  const [c3GenPct, setC3GenPct] = useState(3.5);
  const [c3AdvRatio, setC3AdvRatio] = useState(0.10);
  const [c3ContractQty, setC3ContractQty] = useState(1000);
  const [c3ActualQty, setC3ActualQty] = useState(1350);
  const [c3UnitPrice, setC3UnitPrice] = useState(1000);
  const [c3ExcessPrice, setC3ExcessPrice] = useState(950);
  const [c3Result, setC3Result] = useState(null);

  // Calculator 4 State (契約變更累計 |加帳|+|減帳| & 第58條偏低標決策樹)
  const [c4OrigAmt, setC4OrigAmt] = useState(40000000);
  const [c4AddAmt, setC4AddAmt] = useState(8000000);
  const [c4DedAmt, setC4DedAmt] = useState(4000000);
  const [c4PrevCum, setC4PrevCum] = useState(0);
  const [c4Estimate, setC4Estimate] = useState(50000000);
  const [c4LowestBid, setC4LowestBid] = useState(33000000);
  const [c4Reasonable, setC4Reasonable] = useState(false);
  const [c4Result, setC4Result] = useState(null);

  useEffect(() => {
    fetch('/api/stage2/lifecycle')
      .then((r) => r.json())
      .then((data) => {
        if (data.stages) setLifecycleStages(data.stages);
      });
    runCalc1(55000000, 'engineering', 'central', 'moi_moea_moa', true, true, true);
    runCalc2(6800000, 0, 0, 4, true);
    runCalc3(10000000, 14.0, 3000000, 7.0, 4000000, 3.5, 0.10, 1000, 1350, 1000, 950);
    runCalc4(40000000, 8000000, 4000000, 0, 50000000, 33000000, false);
  }, []);

  const runAiAssistant = (qText) => {
    const targetQ = qText || aiQuery;
    setAiQuery(targetQ);
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: targetQ, stage: 'stage2' }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAiResult(data);
        if (onUpdateDrawer) {
          onUpdateDrawer({
            law_cards: data.law_cards,
            textbook_citations: data.textbook_citations,
            agent_topology: data.agent_topology,
          });
        }
      });
  };

  const runCalc1 = (amt, cat, ent, min, en, ed, eb) => {
    fetch('/api/stage2/calc/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_twd: Number(amt),
        category: cat,
        entity_type: ent,
        ministry_type: min,
        has_electronic_notice: Boolean(en),
        has_electronic_doc: Boolean(ed),
        has_electronic_bid: Boolean(eb),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC1Result(res));
  };

  const runCalc2 = (bud, h, d, s, road) => {
    fetch('/api/stage2/calc/engineering-qc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget_twd: Number(bud),
        building_height_m: Number(h),
        excavation_depth_m: Number(d),
        bridge_span_m: Number(s),
        is_road_work: Boolean(road),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC2Result(res));
  };

  const runCalc3 = (val, indP, indA, catP, catA, genP, advR, cQty, aQty, uPrice, exPrice) => {
    fetch('/api/stage2/calc/price-settlement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_valuation_amount: Number(val),
        individual_index_change_pct: Number(indP),
        individual_item_weight_amount: Number(indA),
        category_index_change_pct: Number(catP),
        category_item_weight_amount: Number(catA),
        general_index_change_pct: Number(genP),
        deduct_advance_payment_ratio: Number(advR),
        contract_item_qty: Number(cQty),
        actual_item_qty: Number(aQty),
        contract_unit_price: Number(uPrice),
        negotiated_excess_unit_price: Number(exPrice),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC3Result(res));
  };

  const runCalc4 = (orig, add, ded, prev, est, low, reas) => {
    fetch('/api/stage2/calc/contract-change-art58', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_contract_amount_twd: Number(orig),
        addition_amount_twd: Number(add),
        deduction_amount_twd: Number(ded),
        previous_cumulative_change_twd: Number(prev),
        government_estimate_twd: Number(est),
        lowest_bid_twd: Number(low),
        agency_deems_reasonable: Boolean(reas),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC4Result(res));
  };

  const currentStage =
    lifecycleStages.find((s) => s.stage_no === selectedStageNo) || lifecycleStages[0] || null;

  return (
    <div className="stage-container">
      <div className="stage-hero-banner emerald-theme">
        <div className="stage-hero-left">
          <span className="stage-badge-pill">STAGE 2 · LIFECYCLE &amp; PRECISION CALCULATORS</span>
          <h1 className="stage-main-title">🧭 階段二：採購實務領航（全生命週期五階段智慧辦案助理）</h1>
          <p className="stage-subtitle">
            配置「全生命週期五階段互動切換軸」與「115年新制採購實務四大精算器」，一次完成門檻判別、營造業資格、物調實作結算與第58條決策。
          </p>
        </div>
      </div>

      {/* 一、全生命週期五階段導航器 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">🔄 全生命週期五階段導航器（1.計畫 ➔ 2.規劃設計 ➔ 3.招標決標 ➔ 4.履約驗收 ➔ 5.維護營運）</h2>
            <p className="section-desc">點選任一階段即展開該階段法定必備檢核表與 LangGraph 智慧辦案問答助手。</p>
          </div>
        </div>

        <div className="lifecycle-stepper-bar">
          {lifecycleStages.map((stg) => (
            <button
              key={stg.id}
              className={stg.stage_no === selectedStageNo ? 'lifecycle-step-btn active' : 'lifecycle-step-btn'}
              onClick={() => setSelectedStageNo(stg.stage_no)}
            >
              <span className="lc-icon">{stg.icon}</span>
              <div className="lc-text-box">
                <div className="lc-title">{stg.title}</div>
                <div className="lc-sub">{stg.textbook_ref}</div>
              </div>
            </button>
          ))}
        </div>

        {currentStage && (
          <div className="lifecycle-detail-grid">
            <div className="lc-checklist-panel">
              <div className="panel-subtitle-bar">
                <span>{currentStage.icon} {currentStage.title} — 必備法定檢核表</span>
                <span className="badge-amber">{currentStage.textbook_ref}</span>
              </div>
              <p className="lc-mission-text">{currentStage.core_mission}</p>
              <div className="checklist-items">
                {(currentStage.checklist || []).map((chk, idx) => {
                  const key = currentStage.id + '-' + idx;
                  const isChecked = Boolean(checkedItems[key]);
                  return (
                    <label key={key} className={isChecked ? 'chk-card checked' : 'chk-card'}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = Object.assign({}, checkedItems);
                          next[key] = !isChecked;
                          setCheckedItems(next);
                        }}
                      />
                      <div className="chk-body">
                        <div className="chk-top">
                          <strong>{chk.item}</strong>
                          <span className={chk.risk_level === 'HIGH' ? 'badge-red' : 'badge-navy'}>
                            {chk.risk_level === 'HIGH' ? '強制重點' : '核心檢核'}
                          </span>
                        </div>
                        <p className="chk-rule">{chk.rule}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="lc-assistant-panel">
              <div className="panel-subtitle-bar">
                <span>🤖 階段智慧辦案問答助手（LangGraph 多代理協同）</span>
              </div>
              <div className="quick-prompts-box">
                <span className="small-label">本階段常見實務提問（點擊立即診斷）：</span>
                {(currentStage.quick_prompts || []).map((qp, idx) => (
                  <button
                    key={idx}
                    className="prompt-pill-btn"
                    onClick={() => runAiAssistant(qp)}
                  >
                    💬 {qp}
                  </button>
                ))}
              </div>
              <div className="ai-input-row">
                <input
                  type="text"
                  className="law-search-input"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="輸入採購辦案問題（例如：預算680萬道路工程可否限丙等營造業？）..."
                />
                <button className="btn-primary" onClick={() => runAiAssistant(aiQuery)}>
                  🚀 領航診斷
                </button>
              </div>
              {aiResult && (
                <div className="ai-response-card">
                  <pre className="ai-markdown-pre">{aiResult.answer_markdown}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 二、採購實務四大精算器 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">🧮 採購實務四大精算器（115年最新法規硬編碼引擎）</h2>
            <p className="section-desc">
              一鍵切換四大精算工作台，即時驗算 GPA/ASTEP 等標期、720萬土木包工業與三級品管、物調10%/5%/2.5%與實作數量3%/30%、契約變更累計與第58條決策樹。
            </p>
          </div>
        </div>

        <div className="calc-tabs-bar">
          <button
            className={activeCalc === 'calc1' ? 'calc-tab-btn active' : 'calc-tab-btn'}
            onClick={() => setActiveCalc('calc1')}
          >
            (1) 門檻與 GPA／招決標配對器
          </button>
          <button
            className={activeCalc === 'calc2' ? 'calc-tab-btn active' : 'calc-tab-btn'}
            onClick={() => setActiveCalc('calc2')}
          >
            (2) 工程資格與三級品管核算器
          </button>
          <button
            className={activeCalc === 'calc3' ? 'calc-tab-btn active' : 'calc-tab-btn'}
            onClick={() => setActiveCalc('calc3')}
          >
            (3) 物價指數三層級＆實作數量結算器
          </button>
          <button
            className={activeCalc === 'calc4' ? 'calc-tab-btn active' : 'calc-tab-btn'}
            onClick={() => setActiveCalc('calc4')}
          >
            (4) 契約變更累計＆第58條偏低標決策樹
          </button>
        </div>

        {/* 精算器 (1) */}
        {activeCalc === 'calc1' && (
          <div className="calc-workbench-grid">
            <div className="calc-form-panel">
              <h3 className="calc-panel-title">🔢 輸入採購金額與機關／標案屬性</h3>
              <div className="preset-buttons-row">
                <button className="chip-btn" onClick={() => { setC1Amount(120000); runCalc1(120000, 'property', 'central', 'other', true, true, false); }}>
                  12萬 小額採購
                </button>
                <button className="chip-btn" onClick={() => { setC1Amount(4500000); setC1Category('property'); runCalc1(4500000, 'property', 'central', 'other', true, true, true); }}>
                  450萬 中央財物 (適用ASTEP 419萬)
                </button>
                <button className="chip-btn" onClick={() => { setC1Amount(55000000); setC1Category('engineering'); runCalc1(55000000, 'engineering', 'central', 'other', true, true, true); }}>
                  5,500萬 查核工程 (115.7.1公開閱覽)
                </button>
                <button className="chip-btn" onClick={() => { setC1Amount(220000000); setC1Category('engineering'); runCalc1(220000000, 'engineering', 'central', 'moi_moea_moa', true, true, true); }}>
                  2.2億 巨額工程 (GPA 2億974萬)
                </button>
              </div>

              <div className="form-group">
                <label>採購預算／預計金額（新臺幣元）：</label>
                <input
                  type="number"
                  value={c1Amount}
                  onChange={(e) => {
                    setC1Amount(e.target.value);
                    runCalc1(e.target.value, c1Category, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                  }}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>採購標的性質：</label>
                  <select
                    value={c1Category}
                    onChange={(e) => {
                      setC1Category(e.target.value);
                      runCalc1(c1Amount, e.target.value, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                    }}
                  >
                    <option value="engineering">工程採購（查核5,000萬／巨額2億／GPA 2億974萬）</option>
                    <option value="property">財物採購（查核5,000萬／巨額1億／GPA中央545萬）</option>
                    <option value="service">勞務採購（查核1,000萬／巨額2,000萬／ASTEP中央419萬）</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>機關層級（條約門檻判別）：</label>
                  <select
                    value={c1Entity}
                    onChange={(e) => {
                      setC1Entity(e.target.value);
                      runCalc1(c1Amount, c1Category, e.target.value, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                    }}
                  >
                    <option value="central">中央機關（GPA 545萬 / ASTEP 419萬）</option>
                    <option value="local_tp_ks">臺北市／高雄市（GPA &amp; ASTEP 838萬）</option>
                    <option value="local_4cities">新北／臺中／臺南／桃園四都（ASTEP 838萬）</option>
                    <option value="other_entity">國營事業／國立大學／醫院（GPA &amp; ASTEP 1,677萬）</option>
                    <option value="overseas">駐外機構（採購專業人員門檻 300萬）</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>所屬部會（工程基本設計送工程會審議門檻）：</label>
                <select
                  value={c1Ministry}
                  onChange={(e) => {
                    setC1Ministry(e.target.value);
                    runCalc1(c1Amount, c1Category, c1Entity, e.target.value, c1ElecNotice, c1ElecDoc, c1ElecBid);
                  }}
                >
                  <option value="motc">交通部（10億元以上送工程會審議）</option>
                  <option value="moi_moea_moa">內政部／經濟部／農業部（4億元以上送工程會審議）</option>
                  <option value="mnd_classified">國防部機密戰備工程（10億元以上）</option>
                  <option value="other">其他部會（1億元以上送工程會審議）</option>
                </select>
              </div>

              <div className="checkbox-inline-group">
                <label>
                  <input
                    type="checkbox"
                    checked={c1ElecNotice}
                    onChange={(e) => {
                      setC1ElecNotice(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, e.target.checked, c1ElecDoc, c1ElecBid);
                    }}
                  />
                  網路招標公告(GPA -5日)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={c1ElecDoc}
                    onChange={(e) => {
                      setC1ElecDoc(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, c1ElecNotice, e.target.checked, c1ElecBid);
                    }}
                  />
                  電子領標(GPA -5日)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={c1ElecBid}
                    onChange={(e) => {
                      setC1ElecBid(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, e.target.checked);
                    }}
                  />
                  電子投標(GPA -5日)
                </label>
              </div>
            </div>

            {c1Result && (
              <div className="calc-result-panel">
                <h3 className="calc-panel-title">📊 115年新制門檻、GPA/ASTEP 與等標期精算結果</h3>
                <div className="kpi-cards-row">
                  <div className="kpi-box navy">
                    <span className="kpi-label">法定級距定位</span>
                    <strong className="kpi-val">{c1Result.tier_name}</strong>
                  </div>
                  <div className="kpi-box emerald">
                    <span className="kpi-label">法定最低等標期</span>
                    <strong className="kpi-val">{c1Result.bidding_period_days} 日曆天</strong>
                  </div>
                </div>

                <div className="result-detail-list">
                  <div className="res-item">
                    <strong>📌 招決標程序規定：</strong>
                    <p>{c1Result.tendering_rule}</p>
                  </div>
                  <div className="res-item">
                    <strong>👁️ 115.7.1 公開閱覽新制：</strong>
                    <p>{c1Result.public_inspection_note}</p>
                  </div>
                  <div className="res-item">
                    <strong>🌐 國際條約協定（1 SDR = {c1Result.sdr_rate} 元）：</strong>
                    <ul>
                      {(c1Result.treaty_summary || []).map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="res-item">
                    <strong>⏱️ 等標期計算明細：</strong>
                    <p>{c1Result.bidding_period_detail}</p>
                  </div>
                  <div className="res-item">
                    <strong>🎓 第95條採購專業人員＆第94條評選委員會：</strong>
                    <p>{c1Result.specialist_note}</p>
                    <p>{c1Result.evaluation_committee_rule}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 精算器 (2) */}
        {activeCalc === 'calc2' && (
          <div className="calc-workbench-grid">
            <div className="calc-form-panel">
              <h3 className="calc-panel-title">🏗️ 輸入工程規模、預算與道路 AC 屬性</h3>
              <div className="preset-buttons-row">
                <button className="chip-btn" onClick={() => { setC2Budget(6800000); setC2Height(0); setC2Depth(0); setC2Span(4); runCalc2(6800000, 0, 0, 4, true); }}>
                  680萬 地方道路 (土木包工業 ≤ 720萬)
                </button>
                <button className="chip-btn" onClick={() => { setC2Budget(21000000); setC2Height(18); setC2Depth(5); setC2Span(12); runCalc2(21000000, 18, 5, 12, false); }}>
                  2,100萬 建築工程 (丙等 ≤ 2,250萬)
                </button>
                <button className="chip-btn" onClick={() => { setC2Budget(65000000); setC2Height(30); setC2Depth(8); setC2Span(20); runCalc2(65000000, 30, 8, 20, true); }}>
                  6,500萬 查核工程 (乙等 ≤ 7,500萬 + 專職品管)
                </button>
                <button className="chip-btn" onClick={() => { setC2Budget(240000000); setC2Height(42); setC2Depth(12); setC2Span(30); runCalc2(240000000, 42, 12, 30, true); }}>
                  2.4億 巨額工程 (甲等 + 特定資格1/12 + 品管2人)
                </button>
              </div>

              <div className="form-group">
                <label>工程採購預算金額（新臺幣元）：</label>
                <input
                  type="number"
                  value={c2Budget}
                  onChange={(e) => {
                    setC2Budget(e.target.value);
                    runCalc2(e.target.value, c2Height, c2Depth, c2Span, c2Road);
                  }}
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>建築物高度 (m)：</label>
                  <input
                    type="number"
                    value={c2Height}
                    onChange={(e) => {
                      setC2Height(e.target.value);
                      runCalc2(c2Budget, e.target.value, c2Depth, c2Span, c2Road);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>開挖深度 (m)：</label>
                  <input
                    type="number"
                    value={c2Depth}
                    onChange={(e) => {
                      setC2Depth(e.target.value);
                      runCalc2(c2Budget, c2Height, e.target.value, c2Span, c2Road);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>橋梁最大跨距 (m)：</label>
                  <input
                    type="number"
                    value={c2Span}
                    onChange={(e) => {
                      setC2Span(e.target.value);
                      runCalc2(c2Budget, c2Height, c2Depth, e.target.value, c2Road);
                    }}
                  />
                </div>
              </div>
            </div>

            {c2Result && (
              <div className="calc-result-panel">
                <h3 className="calc-panel-title">📊 營造業承攬限額、特定資格 1/12 與三級品管核算結果</h3>
                <div className="kpi-cards-row">
                  <div className="kpi-box navy">
                    <span className="kpi-label">最低可承攬營造業等級</span>
                    <strong className="kpi-val">{c2Result.contractor_title}</strong>
                  </div>
                  <div className="kpi-box emerald">
                    <span className="kpi-label">三級品管／監造現場人數</span>
                    <strong className="kpi-val">
                      品管 {c2Result.quality_control.qc_personnel_min} 人 ／ 監造 {c2Result.quality_control.supervision_personnel_min} 人
                    </strong>
                  </div>
                </div>

                <div className="result-detail-list">
                  <div className="res-item">
                    <strong>🏢 營造業承攬造價限額判定（土木包工業720萬／丙2,250萬／乙7,500萬／甲資本額10倍）：</strong>
                    <p>{c2Result.contractor_reason}</p>
                  </div>
                  <div className="res-item">
                    <strong>⚖️ 特定資格與實收資本額／權益 1/12 上限：</strong>
                    <p>{c2Result.specific_qualification.legal_note}</p>
                  </div>
                  <div className="res-item">
                    <strong>🛡️ 三級品管配置門檻：</strong>
                    <p>{c2Result.quality_control.plan_threshold_note}</p>
                    <p>• 施工品管：{c2Result.quality_control.qc_personnel_type}</p>
                    <p>• 委託監造：{c2Result.quality_control.supervision_personnel_type}</p>
                  </div>
                  <div className="res-item">
                    <strong>🌱 114.12 再生 AC 強制比率（20%/60%）＆ 自辦簽證／職安衛：</strong>
                    <p>• 道路熱拌再生 AC ≥ {c2Result.green_and_osh_norms.hot_mix_recycled_ac_min_pct}%、基底層再生 AC ≥ {c2Result.green_and_osh_norms.base_layer_recycled_ac_min_pct}%：{c2Result.green_and_osh_norms.ac_balance_rule}</p>
                    <p>• {c2Result.green_and_osh_norms.self_design_rule}</p>
                    <p>• {c2Result.green_and_osh_norms.osh_article_70_1}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 精算器 (3) */}
        {activeCalc === 'calc3' && (
          <div className="calc-workbench-grid">
            <div className="calc-form-panel">
              <h3 className="calc-panel-title">📈 輸入物價指數三層級 (10%/5%/2.5%) 與實作數量 (3%/30%) 參數</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>本期估驗計價總金額 (元)：</label>
                  <input
                    type="number"
                    value={c3Valuation}
                    onChange={(e) => {
                      setC3Valuation(e.target.value);
                      runCalc3(e.target.value, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>已付預付款扣減比例 (如 0.10)：</label>
                  <input
                    type="number"
                    step="0.05"
                    value={c3AdvRatio}
                    onChange={(e) => {
                      setC3AdvRatio(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, e.target.value, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>個別項目漲跌幅(%) [門檻±10%]：</label>
                  <input
                    type="number"
                    step="0.5"
                    value={c3IndPct}
                    onChange={(e) => {
                      setC3IndPct(e.target.value);
                      runCalc3(c3Valuation, e.target.value, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>中分類漲跌幅(%) [門檻±5%]：</label>
                  <input
                    type="number"
                    step="0.5"
                    value={c3CatPct}
                    onChange={(e) => {
                      setC3CatPct(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, e.target.value, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>總指數漲跌幅(%) [門檻±2.5%]：</label>
                  <input
                    type="number"
                    step="0.5"
                    value={c3GenPct}
                    onChange={(e) => {
                      setC3GenPct(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, e.target.value, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
              </div>

              <hr className="calc-divider" />
              <h4 className="calc-sub-title">📏 契約範本第 3 條：個別項目實作數量結算（±3% / ±30%）</h4>
              <div className="form-row-3">
                <div className="form-group">
                  <label>契約數量：</label>
                  <input
                    type="number"
                    value={c3ContractQty}
                    onChange={(e) => {
                      setC3ContractQty(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, e.target.value, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>實作結算數量：</label>
                  <input
                    type="number"
                    value={c3ActualQty}
                    onChange={(e) => {
                      setC3ActualQty(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, e.target.value, c3UnitPrice, c3ExcessPrice);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>原契約單價 (元)：</label>
                  <input
                    type="number"
                    value={c3UnitPrice}
                    onChange={(e) => {
                      setC3UnitPrice(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, e.target.value, c3ExcessPrice);
                    }}
                  />
                </div>
              </div>
            </div>

            {c3Result && (
              <div className="calc-result-panel">
                <h3 className="calc-panel-title">📊 物調三層級款項 ＆ 實作數量 3%/30% 結算結果</h3>
                <div className="kpi-cards-row">
                  <div className="kpi-box navy">
                    <span className="kpi-label">本期物價指數調整總額 (含稅)</span>
                    <strong className="kpi-val">
                      {c3Result.price_escalation.total_price_escalation_twd.toLocaleString()} 元
                    </strong>
                  </div>
                  <div className="kpi-box emerald">
                    <span className="kpi-label">實作數量增減差額 (逾3%部分)</span>
                    <strong className="kpi-val">
                      {c3Result.quantity_settlement.total_qty_settlement_diff_twd.toLocaleString()} 元
                    </strong>
                  </div>
                </div>

                <div className="result-detail-list">
                  <div className="res-item">
                    <strong>📈 物價指數三層級明細（僅就超過門檻部分計算）：</strong>
                    <p>• 第一層（個別項目 ±10%）：漲跌 {c3Result.price_escalation.tier1_individual_10pct.change_pct}% ➔ 超過部分 {c3Result.price_escalation.tier1_individual_10pct.excess_pct}% ➔ 調整 <strong>{c3Result.price_escalation.tier1_individual_10pct.adjustment_twd.toLocaleString()} 元</strong></p>
                    <p>• 第二層（中分類 ±5%）：漲跌 {c3Result.price_escalation.tier2_category_5pct.change_pct}% ➔ 超過部分 {c3Result.price_escalation.tier2_category_5pct.excess_pct}% ➔ 調整 <strong>{c3Result.price_escalation.tier2_category_5pct.adjustment_twd.toLocaleString()} 元</strong></p>
                    <p>• 第三層（總指數 ±2.5%）：漲跌 {c3Result.price_escalation.tier3_general_2_5pct.change_pct}% ➔ 超過部分 {c3Result.price_escalation.tier3_general_2_5pct.excess_pct}% ➔ 調整 <strong>{c3Result.price_escalation.tier3_general_2_5pct.adjustment_twd.toLocaleString()} 元</strong></p>
                  </div>
                  <div className="res-item">
                    <strong>📏 契約範本第 3 條實作數量結算（差異率 {c3Result.quantity_settlement.qty_diff_pct}%）：</strong>
                    <p>{c3Result.quantity_settlement.settlement_rule}</p>
                    <p>• 3%以內不調整數量：{c3Result.quantity_settlement.band_within_3_qty} ｜ 逾3%~30%按原單價增減數量：{c3Result.quantity_settlement.band_3_to_30_qty}（{c3Result.quantity_settlement.adj_3_to_30_twd.toLocaleString()}元）｜ 逾30%議定單價數量：{c3Result.quantity_settlement.band_over_30_qty}（{c3Result.quantity_settlement.adj_over_30_twd.toLocaleString()}元）</p>
                  </div>
                  <div className="res-item">
                    <strong>⏱️ 採購法第 73 條之 1 審核與付款期限：</strong>
                    <p>{c3Result.payment_deadline_article_73_1.rule}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 精算器 (4) */}
        {activeCalc === 'calc4' && (
          <div className="calc-workbench-grid">
            <div className="calc-form-panel">
              <h3 className="calc-panel-title">🔄 契約變更累計金額 (|加帳|＋|減帳|) ＆ 第 58 條偏低標參數</h3>
              <div className="preset-buttons-row">
                <button className="chip-btn" onClick={() => { setC4Estimate(50000000); setC4LowestBid(33000000); setC4Reasonable(false); runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, 50000000, 33000000, false); }}>
                  標價 66% 底價 (&lt;70% 需說明或差額保證金)
                </button>
                <button className="chip-btn" onClick={() => { setC4Estimate(50000000); setC4LowestBid(37500000); setC4Reasonable(false); runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, 50000000, 37500000, false); }}>
                  標價 75% 底價 (70%~80% 區間)
                </button>
                <button className="chip-btn" onClick={() => { setC4OrigAmt(40000000); setC4AddAmt(35000000); setC4DedAmt(20000000); runCalc4(40000000, 35000000, 20000000, 0, c4Estimate, c4LowestBid, c4Reasonable); }}>
                  加帳3,500萬 + 減帳2,000萬 (累計5,500萬達查核且逾50%上限)
                </button>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>原主契約金額 (元)：</label>
                  <input
                    type="number"
                    value={c4OrigAmt}
                    onChange={(e) => {
                      setC4OrigAmt(e.target.value);
                      runCalc4(e.target.value, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>本次加帳金額 (元)：</label>
                  <input
                    type="number"
                    value={c4AddAmt}
                    onChange={(e) => {
                      setC4AddAmt(e.target.value);
                      runCalc4(c4OrigAmt, e.target.value, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>本次減帳金額 (元)：</label>
                  <input
                    type="number"
                    value={c4DedAmt}
                    onChange={(e) => {
                      setC4DedAmt(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, e.target.value, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }}
                  />
                </div>
              </div>

              <hr className="calc-divider" />
              <h4 className="calc-sub-title">⚖️ 採購法第 58 條總標價偏低決策樹輸入</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>核定底價 (元)：</label>
                  <input
                    type="number"
                    value={c4Estimate}
                    onChange={(e) => {
                      setC4Estimate(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, e.target.value, c4LowestBid, c4Reasonable);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>最低標廠商總標價 (元)：</label>
                  <input
                    type="number"
                    value={c4LowestBid}
                    onChange={(e) => {
                      setC4LowestBid(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, e.target.value, c4Reasonable);
                    }}
                  />
                </div>
              </div>
              <div className="checkbox-inline-group">
                <label>
                  <input
                    type="checkbox"
                    checked={c4Reasonable}
                    onChange={(e) => {
                      setC4Reasonable(e.target.checked);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, e.target.checked);
                    }}
                  />
                  廠商提出之說明經機關審認合理（無降低品質不能誠信履約之虞）
                </label>
              </div>
            </div>

            {c4Result && (
              <div className="calc-result-panel">
                <h3 className="calc-panel-title">📊 契約變更累計金額 ＆ 第 58 條偏低標決策樹輸出</h3>
                <div className="kpi-cards-row">
                  <div className="kpi-box navy">
                    <span className="kpi-label">契約變更累計金額 (|加帳|＋|減帳|)</span>
                    <strong className="kpi-val">
                      {c4Result.contract_change.total_cumulative_change_abs_twd.toLocaleString()} 元
                    </strong>
                  </div>
                  <div className="kpi-box amber">
                    <span className="kpi-label">第58條差額保證金 (底價80%－標價)</span>
                    <strong className="kpi-val">
                      {c4Result.article_58_decision.bond_diff_amount_twd.toLocaleString()} 元
                    </strong>
                  </div>
                </div>

                <div className="result-detail-list">
                  <div className="res-item">
                    <strong>🔄 契約變更核准監辦備查與第22條第1項第6款檢核：</strong>
                    <p>{c4Result.contract_change.change_supervision_rule}</p>
                    <p>{c4Result.contract_change.art22_1_6_note}</p>
                  </div>
                  <div className="res-item">
                    <strong>🌳 採購法第 58 條決策樹落點：{c4Result.article_58_decision.art58_title}</strong>
                    <pre className="law-pre-text">{c4Result.article_58_decision.art58_action}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
