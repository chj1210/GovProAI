import React, { useState, useEffect } from 'react';

export default function Stage3ErroneousPatternsSkill({
  onUpdateDrawer,
  onTransferToKm,
  onSendToPdfReport,
}) {
  const [skillMeta, setSkillMeta] = useState(null);
  const [showSkillMd, setShowSkillMd] = useState(false);

  const [selectedModule, setSelectedModule] = useState('general_12');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [patternsList, setPatternsList] = useState([]);

  const [checkedCodes, setCheckedCodes] = useState([]);
  const [auditTitle, setAuditTitle] = useState('招標文件與採購作業錯誤行為態樣檢核案');
  const [auditText, setAuditText] = useState(
    '本工程採購預算 4,800 萬元，採評分及格最低標招標，審查項目將廠商投標標價納入評分 20%；投標廠商資格限取得 ISO 9001 驗證且投標時須檢附原廠授權代理證明書；空調冰水機組 EER 值高於經濟部標準且指定特定廠牌未允許同等品。'
  );
  const [auditResult, setAuditResult] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadedSourceFile, setUploadedSourceFile] = useState(null);

  useEffect(() => {
    fetch('/api/stage3/erroneous-patterns/meta')
      .then((r) => r.json())
      .then((data) => setSkillMeta(data));
    fetchPatterns('general_12', 'all', '');
    runSkillAudit(
      '本工程採購預算 4,800 萬元，採評分及格最低標招標，審查項目將廠商投標標價納入評分 20%；投標廠商資格限取得 ISO 9001 驗證且投標時須檢附原廠授權代理證明書；空調冰水機組 EER 值高於經濟部標準且指定特定廠牌未允許同等品。',
      [],
      '招標文件與採購作業錯誤行為態樣檢核案'
    );
  }, []);

  const fetchPatterns = (modId, cat, q) => {
    const url =
      '/api/stage3/erroneous-patterns?module_id=' +
      encodeURIComponent(modId || 'all') +
      '&category=' +
      encodeURIComponent(cat || 'all') +
      '&q=' +
      encodeURIComponent(q || '');
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setPatternsList(data.items);
      });
  };

  const handleModuleChange = (modId) => {
    setSelectedModule(modId);
    setSelectedCategory('all');
    fetchPatterns(modId, 'all', searchQuery);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    fetchPatterns(selectedModule, cat, searchQuery);
  };

  const handleSearchChange = (qVal) => {
    setSearchQuery(qVal);
    fetchPatterns(selectedModule, selectedCategory, qVal);
  };

  const runSkillAudit = (textVal, codesVal, titleVal) => {
    fetch('/api/stage3/erroneous-patterns/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textVal !== undefined ? textVal : auditText,
        checked_codes: codesVal !== undefined ? codesVal : checkedCodes,
        case_title: titleVal !== undefined ? titleVal : auditTitle,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) setAuditResult(data.audit);
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
      });
  };

  const toggleCheckCode = (code) => {
    const exists = checkedCodes.indexOf(code) !== -1;
    const next = exists ? checkedCodes.filter((c) => c !== code) : checkedCodes.concat([code]);
    setCheckedCodes(next);
    runSkillAudit(auditText, next, auditTitle);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadMsg('⏳ 正在上傳並解析公文／PDF 檔案：「' + file.name + '」...');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type_hint', 'auto');
    fd.append('auto_save_km', 'false');
    fetch('/api/stage3/upload-official-doc', {
      method: 'POST',
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) {
          setUploadMsg('❌ 上傳解析失敗：' + data.detail);
          return;
        }
        const extracted = data.parsed ? data.parsed.extracted_text || '' : '';
        const detectedTitle = data.metadata ? data.metadata.title : '上傳文件檢核：' + file.name;
        setAuditText(extracted);
        setAuditTitle(detectedTitle);
        setUploadedSourceFile(data.source_file || null);
        if (data.skill_audit) {
          setAuditResult(data.skill_audit);
        } else {
          runSkillAudit(extracted, checkedCodes, detectedTitle);
        }
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
        const warn = data.parsed && data.parsed.warning_message ? ' ' + data.parsed.warning_message : '';
        setUploadMsg(
          '✅ 已解析「' +
            file.name +
            '」（' +
            (data.parsed ? data.parsed.page_count : 1) +
            ' 頁、' +
            (data.parsed ? data.parsed.char_count : 0) +
            ' 字｜文號：' +
            (data.metadata ? data.metadata.case_no : '') +
            '）並完成 277 項錯誤態樣檢核！' +
            warn
        );
      })
      .catch((err) => setUploadMsg('❌ 上傳失敗：' + String(err)));
  };

  const applyPresetSample = (title, text) => {
    setAuditTitle(title);
    setAuditText(text);
    runSkillAudit(text, checkedCodes, title);
  };

  const currentModuleObj =
    skillMeta && skillMeta.modules
      ? skillMeta.modules.find((m) => m.id === selectedModule)
      : null;

  return (
    <div className="stage-container">
      {/* Agent Skill 標頭與 SKILL.md 檢核準則總覽 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <span className="badge-navy">AGENT SKILL · procurement-erroneous-patterns v2.0</span>
            <h2 className="section-heading" style={{ marginTop: '6px' }}>
              🤖 【政府採購錯誤行為態樣】Agent Skill 檢核準則工作台
            </h2>
            <p className="section-desc">
              完整內建行政院公共工程委員會五大檢核準則模組（共{' '}
              <strong>{skillMeta ? skillMeta.total_criteria_count : 277}</strong>{' '}
              項標準檢核準則），供 AI Agent 自動比對招標文件／契約／查核報告，並支援稽核人員互動勾選與一鍵轉入知識管理（KM）素材庫。
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowSkillMd(!showSkillMd)}
            >
              {showSkillMd ? '🔼 收合 SKILL.md 準則規範' : '📄 檢視 Agent Skill (SKILL.md) 規範'}
            </button>
          </div>
        </div>

        {showSkillMd && skillMeta && (
          <div className="skill-md-viewer">
            <div className="skill-md-header">
              <strong>📘 Agent Skill 定義檔：{skillMeta.skill_file_path}</strong>
              <span className="badge-emerald">已掛載至 LangGraph AuditInvestigatorAgent</span>
            </div>
            <pre className="skill-md-pre">{skillMeta.skill_markdown}</pre>
          </div>
        )}

        {/* AI Agent Skill 自動檢核 ＋ 風險結果儀表板 */}
        <div className="scanner-workbench-grid">
          <div className="scanner-input-panel">
            <div className="scanner-toolbar">
              <strong>📝 待檢核工程會函釋 PDF／監察調查報告／招標文件摘錄</strong>
              <label className="upload-file-btn">
                📎 上傳 PDF／公文 (.pdf/.docx/.odt/.txt)
                <input
                  type="file"
                  accept=".pdf,.docx,.odt,.txt,.md,.csv,.json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {uploadMsg && (
              <div className="safe-harbor-box" style={{ marginBottom: '10px', padding: '10px 12px', fontSize: '13.5px' }}>
                {uploadMsg}
              </div>
            )}

            <div className="form-group">
              <label>檢核案名：</label>
              <input
                type="text"
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
              />
            </div>

            <div className="preset-buttons-row">
              <button
                className="chip-btn"
                onClick={() =>
                  applyPresetSample(
                    '建築機電規格綁標＋ISO9001資格限制案',
                    '非屬特殊或巨額採購卻限定投標廠商須取得 ISO 9001 驗證，且投標時須檢附原廠授權代理證明書；空調工程冰水機組 EER 及 COP 值訂定過高並指定特定廠牌未允許同等品，消音箱加註八音頻衰減表。'
                  )
                }
              >
                🎯 建築機電綁標情境
              </button>
              <button
                className="chip-btn"
                onClick={() =>
                  applyPresetSample(
                    '第22條第1項第6款追加逾50%暨加減帳相抵案',
                    '因故減項招標後，履約期間逕依採購法第22條第1項第6款向原廠商辦理契約變更採購原減項內容，且誤以為追加減合計未逾50%，實際加帳累計已逾原主契約金額50%，且未優先以比價方式辦理，簽核僅照錄各款文字。'
                  )
                }
              >
                🎯 第22條限制性缺失
              </button>
              <button
                className="chip-btn"
                onClick={() =>
                  applyPresetSample(
                    '評分及格最低標程序違失案',
                    '本案採評分及格最低標，未成立工作小組或工作小組未達3人且兼任審查委員，審查項目將廠商投標標價納入審查評分，價格標開標對象限總平均前3名，且開標後參考合格廠商標價訂定底價。'
                  )
                }
              >
                🎯 評分及格最低標違失
              </button>
              <button
                className="chip-btn"
                onClick={() =>
                  applyPresetSample(
                    '15萬元以下小額採購化整為零暨假比價案',
                    '機關意圖規避公告金額採購規定，將年度需求化整為零分批以15萬元以下小額採購辦理，並洽1家廠商代為蒐集提供3家廠商之報價估價單，且誤以為共同供應契約小額採購無需辦理驗收，核銷未確認確實履約。'
                  )
                }
              >
                🎯 15萬小額採購違失
              </button>
            </div>

            <textarea
              className="scanner-textarea"
              rows={5}
              value={auditText}
              onChange={(e) => setAuditText(e.target.value)}
              placeholder="貼上招標須知、施工規範、第22條簽陳、評分及格審查紀錄或小額請購核銷案情，啟動 277 項 Agent Skill 準則比對..."
            />

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => runSkillAudit(auditText, checkedCodes, auditTitle)}
              >
                🤖 執行錯誤行為態樣 Agent Skill 檢核
              </button>
              {checkedCodes.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCheckedCodes([]);
                    runSkillAudit(auditText, [], auditTitle);
                  }}
                >
                  🧹 清除手動勾選 ({checkedCodes.length})
                </button>
              )}
            </div>
          </div>

          {auditResult && (
            <div className="scanner-output-panel">
              <div className="kpi-cards-row">
                <div
                  className={
                    auditResult.risk_level === 'CRITICAL'
                      ? 'kpi-box red'
                      : auditResult.risk_level === 'HIGH'
                        ? 'kpi-box amber'
                        : 'kpi-box emerald'
                  }
                >
                  <span className="kpi-label">Agent Skill 綜合風險評級</span>
                  <strong className="kpi-val">
                    {auditResult.risk_level}（{auditResult.risk_score} / 100 分）
                  </strong>
                </div>
                <div className="kpi-box navy">
                  <span className="kpi-label">命中錯誤行為態樣準則</span>
                  <strong className="kpi-val">
                    {auditResult.counts.total_matched} 項（CRITICAL {auditResult.counts.critical} ｜ HIGH {auditResult.counts.high}）
                  </strong>
                </div>
              </div>

              <div className="skill-risk-banner">
                <strong>📊 診斷總評：</strong>
                {auditResult.risk_label}
              </div>

              {auditResult.module_breakdown && auditResult.module_breakdown.length > 0 && (
                <div className="skill-mod-badges">
                  {auditResult.module_breakdown.map((mb) => (
                    <span key={mb.module_id} className="badge-amber">
                      {mb.title}：{mb.matched_count} 項
                    </span>
                  ))}
                </div>
              )}

              <div className="violations-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {(auditResult.matched_patterns || []).map((mp) => (
                  <div key={mp.code} className="violation-alert-card">
                    <div className="v-top" style={{ flexWrap: 'wrap' }}>
                      <span className={mp.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}>
                        {mp.severity}
                      </span>
                      <span className="badge-navy">{mp.code}</span>
                      <strong>
                        {mp.category} {mp.item_no}
                      </strong>
                    </div>
                    <p className="v-finding">{mp.pattern}</p>
                    <div className="skill-item-meta">
                      <span>⚖️ 法令依據：{mp.legal_basis}</span>
                    </div>
                    <div className="skill-item-remediation">
                      🛠️ 導正措施：{mp.remediation}
                    </div>
                  </div>
                ))}
                {(!auditResult.matched_patterns || auditResult.matched_patterns.length === 0) && (
                  <div className="res-item">
                    ✅ 本次文本與勾選檢核未命中顯著錯誤行為態樣，可於下方 277 項清單進一步手動勾選核對。
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                {onTransferToKm && (
                  <button
                    className="btn-amber"
                    onClick={() =>
                      onTransferToKm({
                        doc_type: 'audit_report',
                        title: '【錯誤態樣查核】' + auditTitle,
                        dispute_topic: '政府採購錯誤行為態樣 Agent Skill 查核',
                        facts_summary: auditText,
                        decision_or_findings:
                          '經「政府採購錯誤行為態樣」Agent Skill 檢核，風險評分 ' +
                          auditResult.risk_score +
                          ' 分（' +
                          auditResult.risk_level +
                          '），共命中 ' +
                          auditResult.counts.total_matched +
                          ' 項錯誤態樣：' +
                          (auditResult.matched_codes || []).join('、'),
                        km_lessons: auditResult.corrective_action,
                        matched_pattern_codes: auditResult.matched_codes || [],
                        source_file: uploadedSourceFile || null,
                      })
                    }
                  >
                    📚 轉存為知識管理 (KM) 查核素材
                  </button>
                )}
                {onSendToPdfReport && (
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      onSendToPdfReport({
                        id: 'skill-audit-export',
                        title: auditTitle,
                        category: '政府採購錯誤行為態樣 Agent Skill 查核',
                        agency: '受查核機關',
                        budget_twd: 50000000,
                        summary: auditText.slice(0, 220),
                        document_excerpt: auditText,
                        detected_violations: auditResult.detected_violations || [],
                        root_cause: auditResult.risk_label,
                        corrective_action: auditResult.corrective_action || '',
                      })
                    }
                  >
                    🔏 帶入 HITL SHA-256 PDF 報告
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 五大模組 274 項檢核準則互動清單 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">
              📋 【五大模組完整檢核準則互動查核表】（可勾選缺失項目即時重算風險）
            </h2>
            <p className="section-desc">
              點選切換五大檢核模組，支援依子類別與關鍵字即時篩選；勾選任一缺失準則即同步納入上方 Agent Skill 風險評估與導正清單。
            </p>
          </div>
          <span className="badge-navy-lg">
            已勾選缺失：{checkedCodes.length} 項
          </span>
        </div>

        <div className="sample-cases-bar">
          <button
            className={selectedModule === 'all' ? 'case-pill-btn active' : 'case-pill-btn'}
            onClick={() => handleModuleChange('all')}
          >
            📑 全部五大模組 ({skillMeta ? skillMeta.total_criteria_count : 277})
          </button>
          {skillMeta &&
            (skillMeta.modules || []).map((mod) => (
              <button
                key={mod.id}
                className={selectedModule === mod.id ? 'case-pill-btn active' : 'case-pill-btn'}
                onClick={() => handleModuleChange(mod.id)}
              >
                {mod.short_title} ({mod.total_count})
              </button>
            ))}
        </div>

        <div className="form-row-2" style={{ marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>細項類別篩選：</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">全部類別</option>
              {currentModuleObj &&
                (currentModuleObj.categories || []).map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}（{cat.count} 項）
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>關鍵字檢索（代碼／態樣／法令／函釋）：</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="例如：ISO 9001、第58條、50%、空調、15萬、圍標、評分及格..."
            />
          </div>
        </div>

        <div className="skill-criteria-scroll">
          {patternsList.map((item) => {
            const isChecked = checkedCodes.indexOf(item.code) !== -1;
            return (
              <label
                key={item.code}
                className={isChecked ? 'skill-criterion-card checked' : 'skill-criterion-card'}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheckCode(item.code)}
                  style={{ marginTop: '4px' }}
                />
                <div className="skill-criterion-body">
                  <div className="skill-criterion-top">
                    <span className="badge-navy">{item.code}</span>
                    <span
                      className={
                        item.severity === 'CRITICAL'
                          ? 'badge-red'
                          : item.severity === 'HIGH'
                            ? 'badge-amber'
                            : 'badge-emerald'
                      }
                    >
                      {item.severity}
                    </span>
                    <strong>
                      {item.category} {item.item_no}
                    </strong>
                  </div>
                  <p className="skill-criterion-text">{item.pattern}</p>
                  <div className="skill-item-meta">
                    <span>⚖️ 法令及函釋：{item.legal_basis}</span>
                  </div>
                  <div className="skill-item-remediation">
                    ✅ 因應／導正措施：{item.remediation}
                  </div>
                </div>
              </label>
            );
          })}
          {patternsList.length === 0 && (
            <div className="res-item">查無符合條件之錯誤行為態樣準則，請調整篩選關鍵字。</div>
          )}
        </div>
      </section>
    </div>
  );
}
