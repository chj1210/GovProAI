import React, { useState, useEffect } from 'react';

export default function Stage3AuditInvestigator({ onUpdateDrawer }) {
  const [sampleCases, setSampleCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [customText, setCustomText] = useState('');

  // 第 50 條重大異常關聯 & 第 101/103 條停權檢核台 State
  const [anomalies, setAnomalies] = useState(['serial_registered_mail', 'serial_bank_checks']);
  const [violationClause, setViolationClause] = useState('101_1_12');
  const [priorCount, setPriorCount] = useState(1);
  const [gave10Day, setGave10Day] = useState(true);
  const [reviewedByGroup, setReviewedByGroup] = useState(true);
  const [monthsElapsed, setMonthsElapsed] = useState(14);
  const [riggingResult, setRiggingResult] = useState(null);

  // 三維法律責任剖析器 State
  const [liabScenario, setLiabScenario] = useState('spec_tailoring');
  const [liabRole, setLiabRole] = useState('commissioned_architect');
  const [corruptIntent, setCorruptIntent] = useState(true);
  const [illegalGain, setIllegalGain] = useState(true);
  const [kickbackFlag, setKickbackFlag] = useState(false);
  const [damageAmt, setDamageAmt] = useState(18500000);
  const [liabResult, setLiabResult] = useState(null);

  // HITL SHA-256 電子簽章與原生 PDF 匯出 State
  const [reportType, setReportType] = useState('audit_investigation');
  const [signerName, setSignerName] = useState('王守法');
  const [signerTitle, setSignerTitle] = useState('採購稽核小組簡任稽核員（進階採購專業證照）');
  const [hitlDecision, setHitlDecision] = useState('核准簽辦並移送缺失改善 (HITL Approved)');
  const [hitlNotes, setHitlNotes] = useState(
    '經人工複核母法×施行細則雙欄依據與三維法律責任分析，確認符合115年最新採購法令（含115.7.1公開閱覽新制與114.12再生AC刨用平衡規範）。'
  );
  const [hitlSigPreview, setHitlSigPreview] = useState(null);

  useEffect(() => {
    fetch('/api/stage3/sample-cases')
      .then((r) => r.json())
      .then((data) => {
        if (data.cases && data.cases.length > 0) {
          setSampleCases(data.cases);
          setActiveCase(data.cases[0]);
          setCustomText(data.cases[0].document_excerpt || '');
        }
      });
    runRiggingCheck(['serial_registered_mail', 'serial_bank_checks'], '101_1_12', 1, true, true, 14);
    runLiabilityAnalysis('spec_tailoring', 'commissioned_architect', true, true, false, 18500000);
  }, []);

  const handleSelectCase = (caseId) => {
    fetch('/api/stage3/scan-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.case) {
          setActiveCase(data.case);
          setCustomText(data.case.document_excerpt || '');
          const pl = data.case.preset_liability;
          if (pl) {
            setLiabScenario(pl.scenario_type);
            setLiabRole(pl.actor_role);
            setCorruptIntent(pl.has_corrupt_intent);
            setIllegalGain(pl.has_illegal_gain);
            setKickbackFlag(pl.kickback_or_inflation_flag);
            setDamageAmt(pl.damage_amount_twd);
            runLiabilityAnalysis(
              pl.scenario_type,
              pl.actor_role,
              pl.has_corrupt_intent,
              pl.has_illegal_gain,
              pl.kickback_or_inflation_flag,
              pl.damage_amount_twd
            );
          }
        }
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
      });
  };

  const handleScanCustomText = () => {
    fetch('/api/stage3/scan-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_text: customText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.case) setActiveCase(data.case);
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target.result || '');
      setCustomText(content);
    };
    reader.readAsText(file);
  };

  const toggleAnomaly = (code) => {
    const exists = anomalies.indexOf(code) !== -1;
    const next = exists ? anomalies.filter((a) => a !== code) : anomalies.concat([code]);
    setAnomalies(next);
    runRiggingCheck(next, violationClause, priorCount, gave10Day, reviewedByGroup, monthsElapsed);
  };

  const runRiggingCheck = (anomList, clause, pCount, g10, revGroup, mElapsed) => {
    fetch('/api/stage3/check-rigging-debarment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anomalies: anomList,
        violation_clause: clause,
        prior_debarment_count_in_5yrs: Number(pCount),
        gave_10day_statement_notice: Boolean(g10),
        reviewed_by_work_group_with_external: Boolean(revGroup),
        months_since_violation_or_breach: Number(mElapsed),
      }),
    })
      .then((r) => r.json())
      .then((res) => setRiggingResult(res));
  };

  const runLiabilityAnalysis = (scen, role, intent, gain, kick, dmg) => {
    fetch('/api/stage3/analyze-liability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_type: scen,
        actor_role: role,
        has_corrupt_intent: Boolean(intent),
        has_illegal_gain: Boolean(gain),
        kickback_or_inflation_flag: Boolean(kick),
        damage_amount_twd: Number(dmg),
      }),
    })
      .then((r) => r.json())
      .then((res) => setLiabResult(res));
  };

  const buildPdfPayload = (rType) => {
    return {
      report_type: rType || reportType,
      case_title: activeCase ? activeCase.title : '採購稽核與法規查核案',
      agency: activeCase ? activeCase.agency : '受查核機關',
      budget_twd: activeCase ? activeCase.budget_twd : 50000000,
      signer_name: signerName,
      signer_title: signerTitle,
      hitl_decision: hitlDecision,
      hitl_notes: hitlNotes,
      findings: activeCase ? activeCase.detected_violations : [],
      liability_summary:
        liabResult && liabResult.discretion_vs_corruption_guide
          ? liabResult.discretion_vs_corruption_guide.core_distinction
          : '',
      corrective_action: activeCase ? activeCase.corrective_action : '',
    };
  };

  const handlePreviewHitlSignature = () => {
    const payload = buildPdfPayload(reportType);
    fetch('/api/report/hitl-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.signature) setHitlSigPreview(data.signature);
      });
  };

  const handleDownloadNativePdf = (rType) => {
    const chosenType = rType || reportType;
    setReportType(chosenType);
    const payload = buildPdfPayload(chosenType);
    fetch('/api/report/hitl-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        const sha = res.headers.get('X-HITL-SHA256') || '';
        const ts = res.headers.get('X-HITL-Timestamp') || '';
        if (sha) {
          setHitlSigPreview({
            sha256: sha,
            short_fingerprint: sha.slice(0, 8) + '-' + sha.slice(8, 16) + '-' + sha.slice(-8),
            timestamp: ts,
          });
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          chosenType === 'official_memo'
            ? 'GovProV2_公務簽辦報告_HITL簽章.pdf'
            : 'GovProV2_監察調查與採購稽核查核報告_HITL簽章.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const anomalyOptions = [
    { code: 'serial_registered_mail', label: '投標文件同一郵局交寄且掛號信連號（09500256920號令）' },
    { code: 'serial_bank_checks', label: '押標金同一銀行開具連號支票或同帳戶匯出（09500256920號令）' },
    { code: 'same_handwriting_or_typo', label: '不同廠商標單筆跡相同、異常一致或相同錯別字（09500256920號令）' },
    { code: 'same_contact_address_phone', label: '不同廠商地址、電話、傳真、聯絡人或代領人相同（09500256920號令）' },
    { code: 'same_ip_electronic_bid', label: '不同廠商電子領標或電子投標之 IP 位址相同（09700060670號令）' },
    { code: 'escort_bid_invalid_docs', label: '陪標廠商故意缺漏押標金或資格文件營造三家假性競爭' },
  ];

  return (
    <div className="stage-container">
      <div className="stage-hero-banner amber-theme">
        <div className="stage-hero-left">
          <span className="stage-badge-pill">STAGE 3 · AUDIT, ANTI-RIGGING &amp; 3D LIABILITY RADAR</span>
          <h1 className="stage-main-title">⚖️ 階段三：監察查核領航（工程查核、採購稽核與監察調查防弊雷達）</h1>
          <p className="stage-subtitle">
            整合「招標與契約風險自動掃描」、「第50條重大異常關聯＆第101/103條停權處分檢核台」與「刑事/行政/民事三維法律責任剖析器（含 HITL SHA-256 電子簽章原生 PDF 匯出）」。
          </p>
        </div>
      </div>

      {/* 一、招標與契約風險自動掃描區 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">🔍 【招標與契約風險自動掃描區】（四大監察／稽核實務教案 ＋ 自訂文件上傳掃描）</h2>
            <p className="section-desc">
              點選載入四大經典缺失案例或上傳／貼上招標文件條文，由 AI 自動揪出違反法條、缺失根因與具體處置建議，並連動更新右側抽屜溯源卡片。
            </p>
          </div>
        </div>

        <div className="sample-cases-bar">
          {sampleCases.map((sc) => (
            <button
              key={sc.id}
              className={activeCase && activeCase.id === sc.id ? 'case-pill-btn active' : 'case-pill-btn'}
              onClick={() => handleSelectCase(sc.id)}
            >
              📂 {sc.title}
            </button>
          ))}
        </div>

        <div className="scanner-workbench-grid">
          <div className="scanner-input-panel">
            <div className="scanner-toolbar">
              <strong>📄 招標公告／施工規範／契約條文摘錄</strong>
              <label className="upload-file-btn">
                📎 上傳招標或契約文字檔 (.txt/.md)
                <input type="file" accept=".txt,.md,.csv,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <textarea
              className="scanner-textarea"
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="請貼上招標須知、施工規範或開審標紀錄文字..."
            />
            <button className="btn-primary" onClick={handleScanCustomText}>
              🚨 啟動 AI 法規風險與缺失根因掃描
            </button>
          </div>

          {activeCase && (
            <div className="scanner-output-panel">
              <div className="case-summary-header">
                <div>
                  <span className="badge-navy">{activeCase.category}</span>
                  <h3 className="case-title-text">{activeCase.title}</h3>
                </div>
                <span className="badge-amber">
                  預算 {(activeCase.budget_twd || 0).toLocaleString()} 元
                </span>
              </div>
              <p className="case-summary-desc">{activeCase.summary}</p>

              <div className="violations-list">
                {(activeCase.detected_violations || []).map((v, i) => (
                  <div key={i} className="violation-alert-card">
                    <div className="v-top">
                      <span className={v.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}>
                        {v.severity}
                      </span>
                      <strong>{v.law}</strong>
                    </div>
                    <p className="v-finding">{v.finding}</p>
                  </div>
                ))}
              </div>

              <div className="root-cause-box">
                <div><strong>🎯 缺失根因剖析：</strong>{activeCase.root_cause}</div>
                <div style={{ marginTop: '6px' }}><strong>🛠️ 法定導正作為：</strong>{activeCase.corrective_action}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 二、第 50 條重大異常關聯（圍標）＆ 第 101/103 條停權處分檢核台 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">🛡️ 【第 50 條重大異常關聯（圍標）＆ 第 101/103 條停權處分檢核台】</h2>
            <p className="section-desc">
              自動檢核工程會 09500256920 號令與 09700060670 號令圍標特徵；針對第 101 條停權案件，嚴格把關「10日陳述意見」、「採購工作及審查小組（外聘≥1/3）」、「3個月/6個月/1年階梯累計或3年停權」與「行政罰法3年裁處權時效」。
            </p>
          </div>
        </div>

        <div className="calc-workbench-grid">
          <div className="calc-form-panel">
            <h3 className="calc-panel-title">1️⃣ 勾選第 50 條第 1 項第 5 款「重大異常關聯」圍標特徵</h3>
            <div className="anomaly-checkbox-list">
              {anomalyOptions.map((opt) => (
                <label key={opt.code} className="anomaly-chk-row">
                  <input
                    type="checkbox"
                    checked={anomalies.indexOf(opt.code) !== -1}
                    onChange={() => toggleAnomaly(opt.code)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <hr className="calc-divider" />
            <h3 className="calc-panel-title">2️⃣ 設定第 101 條／第 103 條停權處分程序與時效參數</h3>
            <div className="form-group">
              <label>適用採購法第 101 條第 1 項款次：</label>
              <select
                value={violationClause}
                onChange={(e) => {
                  setViolationClause(e.target.value);
                  runRiggingCheck(anomalies, e.target.value, priorCount, gave10Day, reviewedByGroup, monthsElapsed);
                }}
              >
                <option value="101_1_1">第1款：容許他人借用本人名義或證件參加投標（停權3年）</option>
                <option value="101_1_2">第2款：借用或冒用他人名義或證件投標（停權3年）</option>
                <option value="101_1_4">第4款：以虛偽不實之文件投標、訂約或履約，情節重大（停權3年）</option>
                <option value="101_1_6">第6款：犯第87~92條之罪，經第一審為有罪判決（3年或1年）</option>
                <option value="101_1_8">第8款：查驗或驗收不合格，情節重大（3個月/6個月/1年階梯）</option>
                <option value="101_1_10">第10款：因可歸責於廠商之事由致延誤履約期限，情節重大（3個月/6個月/1年階梯）</option>
                <option value="101_1_12">第12款：因可歸責於廠商之事由致解除或終止契約，情節重大（3個月/6個月/1年階梯）</option>
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>前 5 年內已刊登公報次數（第7~14款累計加重）：</label>
                <select
                  value={priorCount}
                  onChange={(e) => {
                    setPriorCount(e.target.value);
                    runRiggingCheck(anomalies, violationClause, e.target.value, gave10Day, reviewedByGroup, monthsElapsed);
                  }}
                >
                  <option value={0}>0 次（本次為5年內第1次 ➔ 3個月）</option>
                  <option value={1}>1 次（本次為5年內第2次 ➔ 6個月）</option>
                  <option value={2}>2 次以上（本次為第3次以上 ➔ 1年）</option>
                </select>
              </div>
              <div className="form-group">
                <label>距違約／違法行為終了已經過月數（檢核36個月時效）：</label>
                <input
                  type="number"
                  value={monthsElapsed}
                  onChange={(e) => {
                    setMonthsElapsed(e.target.value);
                    runRiggingCheck(anomalies, violationClause, priorCount, gave10Day, reviewedByGroup, e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="checkbox-inline-group">
              <label>
                <input
                  type="checkbox"
                  checked={gave10Day}
                  onChange={(e) => {
                    setGave10Day(e.target.checked);
                    runRiggingCheck(anomalies, violationClause, priorCount, e.target.checked, reviewedByGroup, monthsElapsed);
                  }}
                />
                已書面通知廠商於「10日以上期限」內陳述意見（第101條第3項）
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={reviewedByGroup}
                  onChange={(e) => {
                    setReviewedByGroup(e.target.checked);
                    runRiggingCheck(anomalies, violationClause, priorCount, gave10Day, e.target.checked, monthsElapsed);
                  }}
                />
                已成立「採購工作及審查小組（外聘專家學者≥1/3）」認定符合比例原則
              </label>
            </div>
          </div>

          {riggingResult && (
            <div className="calc-result-panel">
              <h3 className="calc-panel-title">📊 第 50 條圍標判定 ＆ 第 101/103 條停權合法性檢核結果</h3>
              <div className="kpi-cards-row">
                <div className="kpi-box navy">
                  <span className="kpi-label">第 103 條法定停權期間</span>
                  <strong className="kpi-val">{riggingResult.article_101_103_check.debarment_duration}</strong>
                </div>
                <div className={riggingResult.article_101_103_check.is_procedurally_valid ? 'kpi-box emerald' : 'kpi-box red'}>
                  <span className="kpi-label">停權程序與裁處權時效檢核</span>
                  <strong className="kpi-val">
                    {riggingResult.article_101_103_check.is_procedurally_valid
                      ? '✅ 程序完備且未逾3年裁處時效'
                      : '❌ 存在重大程序或時效瑕疵'}
                  </strong>
                </div>
              </div>

              <div className="result-detail-list">
                <div className="res-item">
                  <strong>🚨 第 50 條重大異常關聯（09500256920 ＆ 09700060670 號令）命中特徵：</strong>
                  <ul>
                    {(riggingResult.article_50_check.matched_anomalies || []).map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                  <p><strong>處置建議：</strong>{riggingResult.article_50_check.recommended_action}</p>
                </div>

                <div className="res-item">
                  <strong>⚖️ 第 101 條正當法律程序與時效（3年停權裁處權 vs 5年押標金追繳）：</strong>
                  <p>• 適用條款：{riggingResult.article_101_103_check.clause_title}</p>
                  <p>
                    • 時效狀態：距事發已 {riggingResult.article_101_103_check.months_since_violation} 個月 —
                    停權3年時效（36個月）：{riggingResult.article_101_103_check.is_time_barred_debarment_3yr ? '❌已罹於時效' : '✅未逾時效'} ｜
                    第31條押標金追繳5年時效（60個月）：{riggingResult.article_101_103_check.is_time_barred_bid_bond_5yr ? '❌已逾5年' : '✅未逾5年'}
                  </p>
                  {(riggingResult.article_101_103_check.procedural_defects || []).map((def, i) => (
                    <div key={i} className="defect-warning-line">{def}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 三、刑事/行政/民事三維法律責任剖析器 ＆ HITL SHA-256 電子簽章原生 PDF 匯出 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">🏛️ 【刑事／行政／民事三維法律責任剖析器 ＆ HITL SHA-256 電子簽章 PDF 匯出】</h2>
            <p className="section-desc">
              自動比對《貪污治罪條例》第 4 條第 1 項第 3 款（經辦公用工程舞弊罪）、第 6 條第 1 項第 4 款（圖利罪，嚴格區辨行政裁量與不法）、《採購法》第 87~92 條與《採購人員倫理準則》，並支援 Human-in-the-Loop（HITL）SHA-256 電子簽章匯出原生 PDF。
            </p>
          </div>
        </div>

        <div className="liability-controls-bar">
          <div className="form-group">
            <label>違失行為態樣：</label>
            <select
              value={liabScenario}
              onChange={(e) => {
                setLiabScenario(e.target.value);
                runLiabilityAnalysis(e.target.value, liabRole, corruptIntent, illegalGain, kickbackFlag, damageAmt);
              }}
            >
              <option value="spec_tailoring">規格綁標／違法限制競爭（採購法第26、88條）</option>
              <option value="false_acceptance">驗收不實／監造放水／設計疏失致災（刑法第213、215條）</option>
              <option value="bid_rigging_leak">圍標借牌／開標前洩漏底價或委員名單（採購法第87、89條／刑法第132條）</option>
              <option value="admin_discretion">基於公共利益之合法行政裁量／一般行政作業疏失（區辨非圖利罪）</option>
            </select>
          </div>

          <div className="form-group">
            <label>行為人身分：</label>
            <select
              value={liabRole}
              onChange={(e) => {
                setLiabRole(e.target.value);
                runLiabilityAnalysis(liabScenario, e.target.value, corruptIntent, illegalGain, kickbackFlag, damageAmt);
              }}
            >
              <option value="civil_servant">機關承辦／監辦／主管公務員（刑法第10條身分公務員）</option>
              <option value="commissioned_architect">受託規劃設計監造技師／建築師／專案管理廠商（採購法第88條主體）</option>
              <option value="evaluation_committee">採購評選委員會委員（刑法第10條授權公務員）</option>
              <option value="supplier">投標／得標廠商負責人與從業人員（採購法第87、92條）</option>
            </select>
          </div>

          <div className="checkbox-inline-group">
            <label>
              <input
                type="checkbox"
                checked={kickbackFlag}
                onChange={(e) => {
                  setKickbackFlag(e.target.checked);
                  runLiabilityAnalysis(liabScenario, liabRole, corruptIntent, illegalGain, e.target.checked, damageAmt);
                }}
              />
              涉浮報價額／數量或收取回扣（貪污第4條第1項第3款）
            </label>
            <label>
              <input
                type="checkbox"
                checked={corruptIntent}
                onChange={(e) => {
                  setCorruptIntent(e.target.checked);
                  runLiabilityAnalysis(liabScenario, liabRole, e.target.checked, illegalGain, kickbackFlag, damageAmt);
                }}
              />
              明知違背法令且具圖私人不法利益直接故意（貪污第6條第1項第4款）
            </label>
            <label>
              <input
                type="checkbox"
                checked={illegalGain}
                onChange={(e) => {
                  setIllegalGain(e.target.checked);
                  runLiabilityAnalysis(liabScenario, liabRole, corruptIntent, e.target.checked, kickbackFlag, damageAmt);
                }}
              />
              因而獲得不法利益（結果犯要件）
            </label>
          </div>
        </div>

        {liabResult && (
          <div>
            <div className="identity-banner">
              <strong>👤 行為人法律身分定性：</strong> {liabResult.identity_status}
            </div>

            <div className="three-dim-grid">
              <div className="dim-card criminal-dim">
                <div className="dim-header red-bar">🚨 一、刑事責任剖析（貪污治罪條例 ＆ 採購法第87~92條）</div>
                <div className="dim-body">
                  {(liabResult.criminal_liabilities || []).map((c, idx) => (
                    <div key={idx} className="liab-item">
                      <div className="liab-law">{c.law}</div>
                      <div className="liab-penalty">法定刑度：{c.penalty}</div>
                      <p className="liab-desc">{c.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dim-card admin-dim">
                <div className="dim-header navy-bar">📋 二、行政責任剖析（採購人員倫理準則 ＆ 第101條停權）</div>
                <div className="dim-body">
                  {(liabResult.admin_liabilities || []).map((a, idx) => (
                    <div key={idx} className="liab-item">
                      <div className="liab-law">{a.law}</div>
                      <div className="liab-penalty">處分效果：{a.penalty}</div>
                      <p className="liab-desc">{a.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dim-card civil-dim">
                <div className="dim-header emerald-bar">⚖️ 三、民事責任剖析（損害賠償、第59條扣減、第72條減價）</div>
                <div className="dim-body">
                  {(liabResult.civil_liabilities || []).map((cv, idx) => (
                    <div key={idx} className="liab-item">
                      <div className="liab-law">{cv.law}</div>
                      <div className="liab-penalty">求償效果：{cv.penalty}</div>
                      <p className="liab-desc">{cv.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {liabResult.discretion_vs_corruption_guide && (
              <div className="safe-harbor-box">
                <h4>💡 【圖利罪（貪污第6條第1項第4款） vs 合法行政裁量（採購法第6條第2項）區辨指引】</h4>
                <p>{liabResult.discretion_vs_corruption_guide.core_distinction}</p>
                <ul>
                  {(liabResult.discretion_vs_corruption_guide.safe_harbor_steps || []).map((st, idx) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* HITL SHA-256 電子簽章與原生 PDF 匯出工作台 */}
        <div className="hitl-export-panel">
          <div className="hitl-header">
            <div>
              <span className="badge-navy">HUMAN-IN-THE-LOOP (HITL) CRYPTOGRAPHIC SEAL</span>
              <h3 className="hitl-title">🔏 人工覆核 SHA-256 電子簽章與原生 PDF 正式報告匯出</h3>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>匯出報告類別：</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="official_memo">📄 公務簽辦報告（採購實務領航與法規簽辦）</option>
                <option value="audit_investigation">🕵️ 監察調查／採購稽核查核報告（防弊雷達與三維責任）</option>
              </select>
            </div>
            <div className="form-group">
              <label>覆核簽章人員姓名：</label>
              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>職稱與採購專業證照字號：</label>
              <input type="text" value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>HITL 人工審核批示意見（納入 SHA-256 數位簽章保護範圍）：</label>
            <input type="text" value={hitlNotes} onChange={(e) => setHitlNotes(e.target.value)} />
          </div>

          <div className="hitl-actions-row">
            <button className="btn-secondary" onClick={handlePreviewHitlSignature}>
              🔐 產生 HITL SHA-256 數位簽章指紋
            </button>
            <button className="btn-primary" onClick={() => handleDownloadNativePdf('official_memo')}>
              📥 匯出「公務簽辦報告」原生 PDF
            </button>
            <button className="btn-amber" onClick={() => handleDownloadNativePdf('audit_investigation')}>
              📥 匯出「監察調查／採購稽核查核報告」原生 PDF
            </button>
          </div>

          {hitlSigPreview && (
            <div className="hitl-sig-badge-box">
              <div><strong>✔️ 已完成 HITL SHA-256 電子簽章雜湊驗證</strong> ｜ 簽署時間：{hitlSigPreview.timestamp}</div>
              <div className="sha-code-line">SHA-256 指紋：{hitlSigPreview.sha256}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
