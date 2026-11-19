import React, { useState, useEffect } from 'react';

export default function Stage3DisputeAndKmHub({
  mode,
  onUpdateDrawer,
  onSendToPdfReport,
  prefillKmDraft,
  onClearPrefill,
  onSwitchToKmWithDraft,
}) {
  // === 爭議處理導航 (Dispute Evaluator) State ===
  const [disputeRef, setDisputeRef] = useState({ six_municipalities: [], doc_types: [], topics_catalog: [] });
  const [disputeCategory, setDisputeCategory] = useState('tendering_review_award');
  const [procCategory, setProcCategory] = useState('engineering');
  const [procAmount, setProcAmount] = useState(5000000);
  const [jurisdiction, setJurisdiction] = useState('中央機關或其他縣市政府');
  const [biddingDays, setBiddingDays] = useState(14);
  const [objSubtype, setObjSubtype] = useState('tender_docs');
  const [claimAmount, setClaimAmount] = useState(4500000);
  const [isMonetary, setIsMonetary] = useState(true);
  const [applicantSide, setApplicantSide] = useState('supplier');
  const [negFailed, setNegFailed] = useState(true);
  const [issuedProposal, setIssuedProposal] = useState(true);
  const [agencyRejected, setAgencyRejected] = useState(true);
  const [disputeResult, setDisputeResult] = useState(null);

  // === 知識管理 (KM) 素材輸入與累積庫 State ===
  const [kmMaterials, setKmMaterials] = useState([]);
  const [kmAnalytics, setKmAnalytics] = useState(null);
  const [kmDocTypes, setKmDocTypes] = useState([]);
  const [filterDocType, setFilterDocType] = useState('all');
  const [filterPatternCode, setFilterPatternCode] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedKmId, setExpandedKmId] = useState('');

  // KM 輸入表單 State
  const [formDocType, setFormDocType] = useState('mediation_case');
  const [formCaseNo, setFormCaseNo] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthority, setFormAuthority] = useState('行政院公共工程委員會採購申訴審議委員會');
  const [formAgency, setFormAgency] = useState('');
  const [formProcCat, setFormProcCat] = useState('engineering');
  const [formBudget, setFormBudget] = useState(15000000);
  const [formCaseDate, setFormCaseDate] = useState('2026-11-19');
  const [formOutcome, setFormOutcome] = useState('調解成立／缺失改善結案');
  const [formTopic, setFormTopic] = useState('履約爭議調解（展延工期及利管費／漏項／違約金／減價收受）');
  const [formFacts, setFormFacts] = useState('');
  const [formDecision, setFormDecision] = useState('');
  const [formLessons, setFormLessons] = useState('');
  const [formLawRefs, setFormLawRefs] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formManualCodes, setFormManualCodes] = useState('');
  const [formAutoTag, setFormAutoTag] = useState(true);
  const [formSourceFile, setFormSourceFile] = useState(null);
  const [previewSkillAudit, setPreviewSkillAudit] = useState(null);
  const [submitBanner, setSubmitBanner] = useState('');

  useEffect(() => {
    fetch('/api/stage3/disputes/reference')
      .then((r) => r.json())
      .then((data) => {
        setDisputeRef(data);
        if (data.doc_types) setKmDocTypes(data.doc_types);
      });
    runDisputeEval(
      'tendering_review_award',
      'engineering',
      5000000,
      '中央機關或其他縣市政府',
      14,
      'tender_docs',
      4500000,
      true,
      'supplier',
      true,
      true,
      true
    );
    fetchKmMaterials('all', 'all', '');
  }, []);

  useEffect(() => {
    if (prefillKmDraft && mode === 'km') {
      if (prefillKmDraft.doc_type) setFormDocType(prefillKmDraft.doc_type);
      if (prefillKmDraft.title) setFormTitle(prefillKmDraft.title);
      if (prefillKmDraft.dispute_topic) setFormTopic(prefillKmDraft.dispute_topic);
      if (prefillKmDraft.facts_summary) setFormFacts(prefillKmDraft.facts_summary);
      if (prefillKmDraft.decision_or_findings) setFormDecision(prefillKmDraft.decision_or_findings);
      if (prefillKmDraft.km_lessons) setFormLessons(prefillKmDraft.km_lessons);
      if (prefillKmDraft.matched_pattern_codes) {
        setFormManualCodes(prefillKmDraft.matched_pattern_codes.join(', '));
      }
      if (prefillKmDraft.source_file) {
        setFormSourceFile(prefillKmDraft.source_file);
      }
      setSubmitBanner('已由「政府採購錯誤行為態樣 Agent Skill」帶入查核結果，請補充案號／機關後寫入 KM 知識管理素材庫！');
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillKmDraft, mode]);

  const runDisputeEval = (
    dCat,
    pCat,
    pAmt,
    jur,
    bDays,
    oSub,
    cAmt,
    isMon,
    appSide,
    nFail,
    issProp,
    agRej
  ) => {
    fetch('/api/stage3/disputes/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dispute_category: dCat,
        procurement_category: pCat,
        procurement_amount_twd: Number(pAmt),
        agency_jurisdiction: jur,
        bidding_period_days: Number(bDays),
        objection_subtype: oSub,
        claim_amount_twd: Number(cAmt),
        is_monetary_claim: Boolean(isMon),
        applicant_side: appSide,
        negotiation_failed_first: Boolean(nFail),
        committee_issued_proposal: Boolean(issProp),
        agency_rejected_proposal: Boolean(agRej),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.evaluation) setDisputeResult(data.evaluation);
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const fetchKmMaterials = (dType, pCode, q) => {
    const url =
      '/api/stage3/km/materials?doc_type=' +
      encodeURIComponent(dType || 'all') +
      '&pattern_code=' +
      encodeURIComponent(pCode || 'all') +
      '&q=' +
      encodeURIComponent(q || '');
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.materials) setKmMaterials(data.materials);
        if (data.analytics) setKmAnalytics(data.analytics);
        if (data.doc_types) setKmDocTypes(data.doc_types);
      });
  };

  const handleKmFileImport = (e, autoSaveDirectly) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSubmitBanner('⏳ 正在上傳並解析公文／PDF 檔案：「' + file.name + '」...');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type_hint', 'auto');
    fd.append('auto_save_km', autoSaveDirectly ? 'true' : 'false');

    fetch('/api/stage3/upload-official-doc', {
      method: 'POST',
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) {
          setSubmitBanner('❌ 檔案上傳解析失敗：' + data.detail);
          return;
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);

        const warn = data.parsed && data.parsed.warning_message ? ' ' + data.parsed.warning_message : '';
        if (autoSaveDirectly && data.saved_km_record) {
          setSubmitBanner(
            '✅ 已直接解析並寫入 KM 知識庫！「' +
              data.saved_km_record.title +
              '」（原檔：' +
              (data.source_file ? data.source_file.original_filename : file.name) +
              '，共 ' +
              (data.parsed ? data.parsed.page_count : 1) +
              ' 頁，自動標註 ' +
              (data.saved_km_record.matched_pattern_codes || []).length +
              ' 項錯誤態樣）。' +
              warn
          );
          fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
          return;
        }

        const meta = data.metadata || {};
        if (meta.doc_type) setFormDocType(meta.doc_type);
        if (meta.case_no) setFormCaseNo(meta.case_no);
        if (meta.title) setFormTitle(meta.title);
        if (meta.authority) setFormAuthority(meta.authority);
        if (meta.agency) setFormAgency(meta.agency);
        if (meta.procurement_category) setFormProcCat(meta.procurement_category);
        if (meta.budget_twd !== undefined) setFormBudget(meta.budget_twd);
        if (meta.case_date) setFormCaseDate(meta.case_date);
        if (meta.outcome) setFormOutcome(meta.outcome);
        if (meta.dispute_topic) setFormTopic(meta.dispute_topic);
        if (meta.facts_summary) setFormFacts(meta.facts_summary);
        if (meta.decision_or_findings) setFormDecision(meta.decision_or_findings);
        if (meta.law_refs && meta.law_refs.length > 0) setFormLawRefs(meta.law_refs.join(', '));
        if (meta.tags && meta.tags.length > 0) setFormTags(meta.tags.join(', '));
        if (data.skill_audit) {
          setPreviewSkillAudit(data.skill_audit);
          if (data.skill_audit.matched_codes && data.skill_audit.matched_codes.length > 0) {
            setFormManualCodes(data.skill_audit.matched_codes.join(', '));
          }
          if (data.skill_audit.corrective_action) {
            setFormLessons(data.skill_audit.corrective_action);
          }
        }
        setFormSourceFile(data.source_file || null);
        setSubmitBanner(
          '✅ 已自動解析 PDF／公文「' +
            file.name +
            '」（共 ' +
            (data.parsed ? data.parsed.page_count : 1) +
            ' 頁、' +
            (data.parsed ? data.parsed.char_count : 0) +
            ' 字）並填妥下方表單欄位與錯誤態樣標註，請確認後按「💾 寫入並累積至 KM 知識管理素材庫」！' +
            warn
        );
      })
      .catch((err) => setSubmitBanner('❌ 上傳連線錯誤：' + String(err)));
  };

  const handlePreviewAutoTag = () => {
    const combined = [formTitle, formTopic, formFacts, formDecision, formLessons].join('\n');
    const manualList = formManualCodes
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    fetch('/api/stage3/erroneous-patterns/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: combined,
        checked_codes: manualList,
        case_title: formTitle || 'KM 知識素材預覽標註',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) {
          setPreviewSkillAudit(data.audit);
          if (data.audit.matched_codes && data.audit.matched_codes.length > 0) {
            setFormManualCodes(data.audit.matched_codes.join(', '));
          }
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleSubmitKmMaterial = () => {
    if (!formTitle.trim()) {
      setSubmitBanner('⚠️ 請至少填寫「案件／報告標題」再進行儲存。');
      return;
    }
    const manualList = formManualCodes
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const lawList = formLawRefs
      .split(/[,，、]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tagList = formTags
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    fetch('/api/stage3/km/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: formDocType,
        case_no: formCaseNo,
        title: formTitle,
        authority: formAuthority,
        agency: formAgency,
        procurement_category: formProcCat,
        budget_twd: Number(formBudget) || 0,
        case_date: formCaseDate,
        outcome: formOutcome,
        dispute_topic: formTopic,
        facts_summary: formFacts,
        decision_or_findings: formDecision,
        km_lessons: formLessons,
        matched_pattern_codes: manualList,
        law_refs: lawList,
        tags: tagList,
        auto_tag_patterns: Boolean(formAutoTag),
        source_file: formSourceFile || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.record) {
          setSubmitBanner(
            '✅ 已成功儲存至知識管理素材庫（ID: ' +
              data.record.id +
              '），並自動標註 ' +
              (data.record.matched_pattern_codes || []).length +
              ' 項「政府採購錯誤行為態樣」準則！'
          );
          setFormCaseNo('');
          setFormTitle('');
          setFormAgency('');
          setFormFacts('');
          setFormDecision('');
          setFormLessons('');
          setFormLawRefs('');
          setFormTags('');
          setFormManualCodes('');
          setFormSourceFile(null);
          setPreviewSkillAudit(null);
          fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleDeleteKm = (id) => {
    fetch('/api/stage3/km/materials/' + encodeURIComponent(id), {
      method: 'DELETE',
    })
      .then((r) => r.json())
      .then(() => {
        fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
      });
  };

  const handleSyncDrawerWithKm = (rec) => {
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: rec.title + ' ' + rec.dispute_topic + ' ' + (rec.law_refs || []).join(' '),
        stage: 'stage3',
        amount_twd: rec.budget_twd || 50000000,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (onUpdateDrawer) {
          onUpdateDrawer({
            law_cards: data.law_cards,
            textbook_citations: data.textbook_citations,
            agent_topology: data.agent_topology,
          });
        }
      });
  };

  const fillSampleKmReport = (sampleType) => {
    if (sampleType === 'appeal') {
      setFormDocType('appeal_decision');
      setFormCaseNo('訴1150091號');
      setFormTitle('【申訴範例】某醫療設備採購不當指定進口廠牌且未加註或同等品申訴案');
      setFormAuthority('行政院公共工程委員會採購申訴審議委員會');
      setFormAgency('某公立醫院');
      setFormProcCat('property');
      setFormBudget(12000000);
      setFormOutcome('申訴有理由（撤銷原異議處理結果）');
      setFormTopic('招標文件違反規定（產品規格綁標如指定廠牌）');
      setFormFacts('本案採購金額1,200萬元，招標規格直接抄襲單一歐美廠商型錄且不允許我國產品，亦未加註「或同等品」字樣，並要求投標時檢附原廠製造證明及授權同意書。');
      setFormDecision('採購申訴審議委員會審議判斷認定違反採購法第26條第2、3項及第37條，命機關20日內另為適法處置並依第85條償付申訴必要費用。');
      setFormLessons('規格訂定須回歸功能效益，不得排除我國產品或指定單一廠牌；原廠製造證明應改於交貨驗收時提出。');
      setFormLawRefs('採購法第26條, 採購法第37條, 採購法第85條');
      setFormTags('申訴, 指定進口, 規格綁標, 原廠製造證明');
    } else if (sampleType === 'mediation') {
      setFormDocType('mediation_case');
      setFormCaseNo('調1150148號');
      setFormTitle('【調解範例】道路改善工程設計數量短少暨逾期違約金減免履約爭議調解案');
      setFormAuthority('新北市政府採購申訴審議委員會');
      setFormAgency('新北市某區公所');
      setFormProcCat('engineering');
      setFormBudget(28500000);
      setFormOutcome('調解成立（依契約第3條調整價金並減計部分逾期違約金）');
      setFormTopic('履約爭議調解（漏項或數量短少／逾期違約金爭議）');
      setFormFacts('履約期間因既有管線遷移延誤工期且實際瀝青路面刨鋪數量超出契約數量34%，機關原本拒絕追加並以履約期限過短計罰高額逾期違約金，協議不成由廠商申請調解。');
      setFormDecision('調解委員建議依工程契約範本第3條就逾3%~30%按原單價給付、逾30%部分協議單價，並扣除不可歸責廠商之管線遷移天數，雙方合意調解成立。');
      setFormLessons('設計階段應核實工項數量並落實管線協調；履約中遇不可歸責展延事由應即時留存會議紀錄佐證。');
      setFormLawRefs('採購法第85條之1, 工程採購契約範本第3條');
      setFormTags('履約調解, 實作數量, 逾期違約金, 管線遷移');
    } else {
      setFormDocType('investigation_report');
      setFormCaseNo('院台調字第1150900321號');
      setFormTitle('【調查報告範例】某機關開標前洩漏底價暨投標廠商掛號連號圍標調查報告');
      setFormAuthority('監察院／法務部廉政署');
      setFormAgency('某縣政府所屬機關');
      setFormProcCat('engineering');
      setFormBudget(36000000);
      setFormOutcome('糾正機關並移送檢調偵辦採購法第87條及刑法第132條');
      setFormTopic('監察／政風調查（圍標重大異常關聯＆開標審標違失）');
      setFormFacts('查核發現3家投標廠商標封掛號信連號且不同投標廠商領標IP相同，開標後有2家刻意未附押標金致僅餘1家合格，且承辦人未依第50條不予決標亦未依第31條追繳押標金。');
      setFormDecision('調查報告認定完全吻合工程會09500256920號令及09700060670號令重大異常關聯圍標態樣，機關未依採購法第50條、第31條及第101條處置顯有重大違失。');
      setFormLessons('開審標應強制勾稽標封掛號連號、押標金票據連號及電子領投標IP紀錄，發現異常立即啟動行政調查，無須等待刑事判決。');
      setFormLawRefs('採購法第50條第1項第5款, 採購法第31條第2項, 採購法第87條, 採購法第101條');
      setFormTags('監察調查, 圍標, 掛號連號, IP相同, 陪標');
    }
    setSubmitBanner('已填入範例草稿，可直接按「🤖 預覽錯誤態樣自動標註」或「💾 寫入 KM 知識管理素材庫」！');
  };

  // =========================================================================
  // 模式 A：爭議處理（異議／申訴／調解）程序、時效、規費與強制仲裁導航
  // =========================================================================
  if (mode === 'dispute') {
    const disputeTopics = (disputeRef && disputeRef.topics_catalog) ? disputeRef.topics_catalog : [];
    const sixCities = (disputeRef && disputeRef.six_municipalities) ? disputeRef.six_municipalities : [];

    return (
      <div className="stage-container">
        <section className="content-card">
          <div className="card-header-row">
            <div>
              <span className="badge-navy">DISPUTE RESOLUTION ENGINE · 採購法第6章（第74~85條之4）＆ 第101~103條</span>
              <h2 className="section-heading" style={{ marginTop: '6px' }}>
                ⚖️ 【政府採購爭議處理（異議／申訴／調解）程序、時效與費用精算導航】
              </h2>
              <p className="section-desc">
                依據工程會《爭議處理教材》建置：精算四大爭議類別法定期間、150 萬元公告金額門檻與例外（第31條押標金／第101條停權免門檻）、六都與工程會管轄分工、審議費／調解費試算及第 85 條之 1 第 2 項「先調後仲」強制仲裁五要件檢核。
              </p>
            </div>
          </div>

          <div className="calc-workbench-grid">
            <div className="calc-form-panel">
              <h3 className="calc-panel-title">1️⃣ 設定採購爭議類別與案件條件</h3>

              <div className="form-group">
                <label>爭議類別（雙軌救濟路徑）：</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => {
                    setDisputeCategory(e.target.value);
                    runDisputeEval(
                      e.target.value,
                      procCategory,
                      procAmount,
                      jurisdiction,
                      biddingDays,
                      objSubtype,
                      claimAmount,
                      isMonetary,
                      applicantSide,
                      negFailed,
                      issuedProposal,
                      agencyRejected
                    );
                  }}
                >
                  <option value="tendering_review_award">1. 招標、審標、決標之爭議（異議 ➔ 申訴，須達150萬公告金額）</option>
                  <option value="bid_bond_forfeiture">2. 不發還押標金、追繳押標金之爭議（第31條，不受150萬門檻限制）</option>
                  <option value="art101_debarment">3. 通知將刊登政府採購公報停權爭議（第101條，20日異議、不受150萬限制）</option>
                  <option value="contract_performance">4. 履約爭議調解（含驗收、保固，第85條之1～第85條之4）</option>
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>採購屬性類別：</label>
                  <select
                    value={procCategory}
                    onChange={(e) => {
                      setProcCategory(e.target.value);
                      runDisputeEval(
                        disputeCategory,
                        e.target.value,
                        procAmount,
                        jurisdiction,
                        biddingDays,
                        objSubtype,
                        claimAmount,
                        isMonetary,
                        applicantSide,
                        negFailed,
                        issuedProposal,
                        agencyRejected
                      );
                    }}
                  >
                    <option value="engineering">工程採購（適用第85-1強制仲裁）</option>
                    <option value="tech_service">技術服務採購（適用第85-1強制仲裁）</option>
                    <option value="property">財物採購</option>
                    <option value="service">一般勞務採購</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>招標機關管轄歸屬（六都 vs 工程會）：</label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => {
                      setJurisdiction(e.target.value);
                      runDisputeEval(
                        disputeCategory,
                        procCategory,
                        procAmount,
                        e.target.value,
                        biddingDays,
                        objSubtype,
                        claimAmount,
                        isMonetary,
                        applicantSide,
                        negFailed,
                        issuedProposal,
                        agencyRejected
                      );
                    }}
                  >
                    <option value="中央機關或其他縣市政府">中央機關或其他縣市政府（委請工程會辦理）</option>
                    {sixCities.map((city) => (
                      <option key={city} value={city}>
                        {city}（自設採購申訴審議委員會）
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {disputeCategory !== 'contract_performance' && (
                <div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>本案採購金額（新臺幣元，門檻150萬）：</label>
                      <input
                        type="number"
                        value={procAmount}
                        onChange={(e) => {
                          setProcAmount(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            e.target.value,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      />
                    </div>
                    {disputeCategory === 'tendering_review_award' && (
                      <div className="form-group">
                        <label>等標期日數（計算招標文件異議1/4期間）：</label>
                        <input
                          type="number"
                          value={biddingDays}
                          onChange={(e) => {
                            setBiddingDays(e.target.value);
                            runDisputeEval(
                              disputeCategory,
                              procCategory,
                              procAmount,
                              jurisdiction,
                              e.target.value,
                              objSubtype,
                              claimAmount,
                              isMonetary,
                              applicantSide,
                              negFailed,
                              issuedProposal,
                              agencyRejected
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {disputeCategory === 'tendering_review_award' && (
                    <div className="form-group">
                      <label>異議事項細分（第75條第1項各款）：</label>
                      <select
                        value={objSubtype}
                        onChange={(e) => {
                          setObjSubtype(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            e.target.value,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      >
                        <option value="tender_docs">對招標文件規定提出異議（等標期1/4，不得少於10日）</option>
                        <option value="clarification_change">對釋疑、後續說明、變更或補充提出異議（次日起10日）</option>
                        <option value="process_result">對採購過程、結果提出異議（次日起10日，招審決標不逾決標次日起15日）</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {disputeCategory === 'contract_performance' && (
                <div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>調解請求／確認金額（新臺幣元）：</label>
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={(e) => {
                          setClaimAmount(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            e.target.value,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>調解申請方：</label>
                      <select
                        value={applicantSide}
                        onChange={(e) => {
                          setApplicantSide(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            e.target.value,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      >
                        <option value="supplier">廠商申請（機關不得拒絕啟動調解）</option>
                        <option value="agency">機關申請（須經廠商同意，否則不受理）</option>
                      </select>
                    </div>
                  </div>

                  <div className="checkbox-inline-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={isMonetary}
                        onChange={(e) => {
                          setIsMonetary(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            e.target.checked,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      />
                      以請求或確認金額為調解標的（未勾選則為非金額標的固定3萬元）
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={negFailed}
                        onChange={(e) => {
                          setNegFailed(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            e.target.checked,
                            issuedProposal,
                            agencyRejected
                          );
                        }}
                      />
                      機關與廠商已先就履約爭議進行協議且協議不成
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={issuedProposal}
                        onChange={(e) => {
                          setIssuedProposal(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            e.target.checked,
                            agencyRejected
                          );
                        }}
                      />
                      採購申訴審議委員會已出具「調解建議」或「調解方案」
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={agencyRejected}
                        onChange={(e) => {
                          setAgencyRejected(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            e.target.checked
                          );
                        }}
                      />
                      調解不成立係因「機關不同意」該建議或方案所致
                    </label>
                  </div>
                </div>
              )}
            </div>

            {disputeResult && (
              <div className="calc-result-panel">
                <h3 className="calc-panel-title">📊 法定爭議處理路徑、時效與規費檢核結果</h3>

                <div className="kpi-cards-row">
                  <div className={disputeResult.can_proceed ? 'kpi-box emerald' : 'kpi-box red'}>
                    <span className="kpi-label">程序啟動／門檻適格性</span>
                    <strong className="kpi-val">
                      {disputeResult.can_proceed ? '✅ 符合法定啟動要件' : '⚠️ 未達門檻或欠缺先決要件'}
                    </strong>
                  </div>
                  <div className="kpi-box navy">
                    <span className="kpi-label">法定規費估算（審議費／調解費）</span>
                    <strong className="kpi-val">
                      NT$ {(disputeResult.fee_info ? disputeResult.fee_info.fee_twd : 30000).toLocaleString()} 元
                    </strong>
                  </div>
                </div>

                <div className="result-detail-list">
                  <div className="res-item">
                    <strong>🛤️ 救濟軌道：</strong>
                    {disputeResult.track_name}
                    <p>
                      <strong>🏛️ 法定受理機關：</strong>
                      {disputeResult.competent_committee}
                    </p>
                    <p>
                      <strong>📌 門檻／適格判定：</strong>
                      {disputeResult.eligibility_note}
                    </p>
                  </div>

                  <div className="res-item">
                    <strong>⏱️ 法定處理期間與應遵行程序：</strong>
                    <ul className="dispute-timeline-list">
                      {(disputeResult.deadlines || []).map((d, idx) => (
                        <li key={idx}>
                          <strong>{d.step}：</strong>
                          {d.rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="res-item">
                    <strong>💰 收費與撤回／不受理退費基準：</strong>
                    <p>{disputeResult.fee_info && disputeResult.fee_info.basis}</p>
                    <p>
                      <strong>⚖️ 法律效力：</strong>
                      {disputeResult.effect_summary}
                    </p>
                  </div>

                  {disputeResult.mandatory_arbitration && (
                    <div
                      className={
                        disputeResult.mandatory_arbitration.triggered
                          ? 'defect-warning-line'
                          : 'res-item'
                      }
                    >
                      <strong>⚡ 第 85 條之 1 第 2 項「先調後仲」強制仲裁五要件檢核：</strong>
                      <p style={{ margin: '6px 0' }}>{disputeResult.mandatory_arbitration.summary}</p>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                        {(disputeResult.mandatory_arbitration.elements || []).map((el, i) => (
                          <li key={i}>
                            {el.passed ? '✅' : '❌'} {el.element}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 爭議處理研討四大類實務案例指引 */}
        <section className="content-card">
          <div className="card-header-row">
            <div>
              <h2 className="section-heading">
                📘 【工程會進階訓練《爭議處理研討》四大類實務爭點地圖】
              </h2>
              <p className="section-desc">
                系統化彙整「招標審標決標申訴」、「押標金爭議」、「第101條停權申訴」及「履約爭議調解」核心爭點，點擊可直接轉至 KM 知識管理介面登錄機關實務案例。
              </p>
            </div>
          </div>

          <div className="course-cards-grid">
            {disputeTopics.map((sec) => (
              <div key={sec.id} className="course-module-card">
                <div className="course-card-top">
                  <span className="badge-navy">{sec.track}</span>
                </div>
                <h3 className="course-card-title">{sec.section}</h3>
                <div className="dispute-topic-items">
                  {(sec.items || []).map((it, idx) => (
                    <div key={idx} className="dispute-subitem">
                      <strong>{it.title}</strong>
                      <div className="skill-item-meta">⚖️ {it.law_ref}</div>
                      <p className="v-finding">{it.summary}</p>
                    </div>
                  ))}
                </div>
                {onSwitchToKmWithDraft && (
                  <div className="course-related-footer">
                    <button
                      className="btn-outline-sm"
                      onClick={() =>
                        onSwitchToKmWithDraft({
                          doc_type:
                            sec.id === 'topic_mediation' ? 'mediation_case' : 'appeal_decision',
                          dispute_topic: sec.section,
                          title: '',
                        })
                      }
                    >
                      ➕ 登錄此類案件至 KM 知識管理素材庫
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // 模式 B：調解／申訴與相關查核／調查報告 輸入介面與 KM 知識管理累積庫
  // =========================================================================
  const maxPatternCount =
    kmAnalytics && kmAnalytics.top_erroneous_patterns && kmAnalytics.top_erroneous_patterns.length > 0
      ? kmAnalytics.top_erroneous_patterns[0].count
      : 1;

  return (
    <div className="stage-container">
      {/* 一、KM 知識管理累積儀表板與高頻錯誤態樣統計 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <span className="badge-emerald">KNOWLEDGE MANAGEMENT REPOSITORY · 持續累積與防弊回饋</span>
            <h2 className="section-heading" style={{ marginTop: '6px' }}>
              📚 【爭議處理（異議／申訴／調解）＆ 查核／調查報告 知識管理 (KM) 素材庫】
            </h2>
            <p className="section-desc">
              可供機關持續輸入異議、申訴審議判斷、履約爭議調解、採購稽核／施工查核報告及監察／廉政調查報告，並自動串接「政府採購錯誤行為態樣 Agent Skill」標註高頻缺失，持久化儲存於本地知識庫（<code>data/km_materials.json</code>）累積組織防弊資產。
            </p>
          </div>
          <a
            href="/api/stage3/km/export"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            📥 匯出完整 KM 知識庫 (.json)
          </a>
        </div>

        {kmAnalytics && (
          <div>
            <div className="km-kpi-grid">
              <div className="kpi-box navy">
                <span className="kpi-label">累計知識管理素材總數</span>
                <strong className="kpi-val">{kmAnalytics.total_materials} 件</strong>
              </div>
              <div className="kpi-box emerald">
                <span className="kpi-label">使用者新增累積素材</span>
                <strong className="kpi-val">{kmAnalytics.user_contributed_count} 件</strong>
              </div>
              <div className="kpi-box amber">
                <span className="kpi-label">涵蓋標案累計預算規模</span>
                <strong className="kpi-val">
                  NT$ {Math.round((kmAnalytics.total_budget_twd || 0) / 10000).toLocaleString()} 萬元
                </strong>
              </div>
              <div className="kpi-box red">
                <span className="kpi-label">已追蹤高頻錯誤態樣</span>
                <strong className="kpi-val">
                  {(kmAnalytics.top_erroneous_patterns || []).length} 類 TOP 缺失
                </strong>
              </div>
            </div>

            <div className="km-analytics-split">
              <div className="res-item">
                <strong>🗂️ 各類知識管理素材分布（點擊可篩選）：</strong>
                <div className="km-type-chips">
                  <button
                    className={filterDocType === 'all' ? 'chip-btn active' : 'chip-btn'}
                    onClick={() => {
                      setFilterDocType('all');
                      fetchKmMaterials('all', filterPatternCode, filterQuery);
                    }}
                  >
                    全部素材 ({kmAnalytics.total_materials})
                  </button>
                  {(kmAnalytics.by_doc_type || []).map((bt) => (
                    <button
                      key={bt.id}
                      className={filterDocType === bt.id ? 'chip-btn active' : 'chip-btn'}
                      onClick={() => {
                        setFilterDocType(bt.id);
                        fetchKmMaterials(bt.id, filterPatternCode, filterQuery);
                      }}
                    >
                      {bt.short} ({bt.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="res-item">
                <strong>🔥 跨案高頻命中「政府採購錯誤行為態樣」TOP 排行（點擊代碼可交叉篩選）：</strong>
                <div className="km-top-patterns-list">
                  {(kmAnalytics.top_erroneous_patterns || []).map((tp) => {
                    const widthPct = Math.max(16, Math.round((tp.count / maxPatternCount) * 100));
                    return (
                      <div
                        key={tp.code}
                        className={
                          filterPatternCode === tp.code
                            ? 'km-pattern-bar-row active'
                            : 'km-pattern-bar-row'
                        }
                        onClick={() => {
                          const nextCode = filterPatternCode === tp.code ? 'all' : tp.code;
                          setFilterPatternCode(nextCode);
                          fetchKmMaterials(filterDocType, nextCode, filterQuery);
                        }}
                      >
                        <div className="km-bar-label">
                          <span className="badge-navy">{tp.code}</span>
                          <span className="km-bar-text">{tp.pattern_preview}</span>
                          <strong>{tp.count} 案</strong>
                        </div>
                        <div className="km-bar-track">
                          <div className="km-bar-fill" style={{ width: widthPct + '%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 二、新增／輸入爭議處理（異議／申訴／調解）或查核／調查報告素材表單 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">
              ✍️ 【新增知識管理素材】（支援直接上傳工程會函釋 PDF、監察調查報告、申訴／調解／稽核檔案）
            </h2>
            <p className="section-desc">
              直接上傳 <strong>.pdf / .docx / .odt / .txt</strong> 公文或報告，後端將自動抽取內文、辨識發文字號與民國日期、歸檔原檔並自動呼叫 277 項錯誤行為態樣 Agent Skill 標註入庫。
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
              📤 上傳工程會函釋／調查報告 PDF（自動解析填表）
              <input
                type="file"
                accept=".pdf,.docx,.odt,.txt,.md,.csv,.json"
                onChange={(e) => handleKmFileImport(e, false)}
                style={{ display: 'none' }}
              />
            </label>
            <label className="btn-amber" style={{ cursor: 'pointer', display: 'inline-block' }}>
              ⚡ 上傳 PDF 並直接自動入庫
              <input
                type="file"
                accept=".pdf,.docx,.odt,.txt,.md,.csv,.json"
                onChange={(e) => handleKmFileImport(e, true)}
                style={{ display: 'none' }}
              />
            </label>
            <button className="chip-btn" onClick={() => fillSampleKmReport('appeal')}>
              ⚡ 申訴範例
            </button>
            <button className="chip-btn" onClick={() => fillSampleKmReport('mediation')}>
              ⚡ 調解範例
            </button>
            <button className="chip-btn" onClick={() => fillSampleKmReport('investigation')}>
              ⚡ 監察調查範例
            </button>
          </div>
        </div>

        {formSourceFile && (
          <div className="res-item" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>
              📎 已夾帶歸檔原檔：<strong>{formSourceFile.original_filename}</strong>（{formSourceFile.page_count || 1} 頁，{Math.round((formSourceFile.file_size_bytes || 0) / 1024)} KB）
            </span>
            <a
              href={formSourceFile.download_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline-sm"
              style={{ textDecoration: 'none' }}
            >
              📄 檢視原檔
            </a>
          </div>
        )}

        {submitBanner && <div className="safe-harbor-box">{submitBanner}</div>}

        <div className="km-form-box">
          <div className="form-row-3">
            <div className="form-group">
              <label>素材類別：</label>
              <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)}>
                {kmDocTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>文號／案號（如：訴115xxxx號、調115xxxx號、院台調字）：</label>
              <input
                type="text"
                value={formCaseNo}
                onChange={(e) => setFormCaseNo(e.target.value)}
                placeholder="例如：調1150148號 / 稽核115-088號"
              />
            </div>
            <div className="form-group">
              <label>結案／報告日期：</label>
              <input
                type="text"
                value={formCaseDate}
                onChange={(e) => setFormCaseDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>案件／報告標題（必填）：</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：【調解案件】某道路工程管線障礙展延工期及利管費爭議案"
              />
            </div>
            <div className="form-group">
              <label>爭議爭點／查核主題分類：</label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="例如：規格綁標 / 第101條情節重大 / 展延工期利管費 / 化整為零"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>受理／查核／調查機關：</label>
              <input
                type="text"
                value={formAuthority}
                onChange={(e) => setFormAuthority(e.target.value)}
                placeholder="如：工程會申訴會、臺北市申訴會、採購稽核小組、監察院"
              />
            </div>
            <div className="form-group">
              <label>招標／受查核機關：</label>
              <input
                type="text"
                value={formAgency}
                onChange={(e) => setFormAgency(e.target.value)}
                placeholder="例如：某工程處／某局處"
              />
            </div>
            <div className="form-group">
              <label>採購類別 ＆ 金額（新臺幣元）：</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formProcCat}
                  onChange={(e) => setFormProcCat(e.target.value)}
                  style={{ width: '42%' }}
                >
                  <option value="engineering">工程</option>
                  <option value="property">財物</option>
                  <option value="service">勞務</option>
                </select>
                <input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  style={{ width: '58%' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>處理結果／決議狀態：</label>
            <input
              type="text"
              value={formOutcome}
              onChange={(e) => setFormOutcome(e.target.value)}
              placeholder="例如：申訴有理由撤銷原處分 / 調解成立 / 調解不成立提付仲裁 / 監察院糾正"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>案情摘要與事實經過：</label>
              <textarea
                className="scanner-textarea"
                rows={4}
                value={formFacts}
                onChange={(e) => setFormFacts(e.target.value)}
                placeholder="請輸入招標、審標、履約爭議或稽核調查之具體事實經過..."
              />
            </div>
            <div className="form-group">
              <label>審議判斷／調解建議／查核調查結論與核心理由：</label>
              <textarea
                className="scanner-textarea"
                rows={4}
                value={formDecision}
                onChange={(e) => setFormDecision(e.target.value)}
                placeholder="請輸入申訴審議判斷理由、調解建議方案或稽核／監察調查認定結論..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>知識管理（KM）教訓、防弊要點與後續精進作為：</label>
            <textarea
              className="scanner-textarea"
              rows={2}
              value={formLessons}
              onChange={(e) => setFormLessons(e.target.value)}
              placeholder="彙整本案可供日後承辦人與稽核團隊借鏡之防弊要點..."
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>關聯錯誤行為態樣代碼（逗號分隔，可自動標註）：</label>
              <input
                type="text"
                value={formManualCodes}
                onChange={(e) => setFormManualCodes(e.target.value)}
                placeholder="如：EP-02-02, EP-03-02, ARCH-16-04"
              />
            </div>
            <div className="form-group">
              <label>相關法條依據（逗號分隔）：</label>
              <input
                type="text"
                value={formLawRefs}
                onChange={(e) => setFormLawRefs(e.target.value)}
                placeholder="如：採購法第26條, 第85條之1"
              />
            </div>
            <div className="form-group">
              <label>知識標籤 Tags（逗號分隔）：</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="如：規格綁標, 展延工期, 強制仲裁"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '14.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formAutoTag}
                onChange={(e) => setFormAutoTag(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              儲存時自動呼叫「政府採購錯誤行為態樣 Agent Skill」進行 277 項缺失代碼標註
            </label>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handlePreviewAutoTag}>
                🤖 預覽 Agent Skill 錯誤態樣自動標註
              </button>
              <button className="btn-primary" onClick={handleSubmitKmMaterial}>
                💾 寫入並累積至 KM 知識管理素材庫
              </button>
            </div>
          </div>

          {previewSkillAudit && (
            <div className="root-cause-box" style={{ marginTop: '14px' }}>
              <strong>
                🤖 Agent Skill 預覽標註結果（風險 {previewSkillAudit.risk_level} / {previewSkillAudit.risk_score} 分）：
              </strong>
              {' '}
              共自動偵測 {previewSkillAudit.counts.total_matched} 項錯誤行為態樣：
              {(previewSkillAudit.matched_patterns || []).map((mp) => (
                <span key={mp.code} className="badge-navy" style={{ marginLeft: '6px' }}>
                  {mp.code} {mp.category}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 三、已累積知識管理素材全文檢索與瀏覽 */}
      <section className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="section-heading">
              🗂️ 【已累積知識管理素材檢索庫】（共 {kmMaterials.length} 件符合條件）
            </h2>
            <p className="section-desc">
              支援依素材類型、錯誤行為態樣代碼及全文關鍵字即時檢索；每筆知識素材皆可直接連動右側法規抽屜或匯入 HITL SHA-256 PDF 簽章報告。
            </p>
          </div>
          {filterPatternCode !== 'all' && (
            <button
              className="btn-outline-sm"
              onClick={() => {
                setFilterPatternCode('all');
                fetchKmMaterials(filterDocType, 'all', filterQuery);
              }}
            >
              ✕ 清除態樣代碼篩選：{filterPatternCode}
            </button>
          )}
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            className="law-search-input"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              fetchKmMaterials(filterDocType, filterPatternCode, e.target.value);
            }}
            placeholder="全文檢索：案名、文號、機關、申訴理由、調解方案、查核缺失、法條或錯誤態樣代碼..."
          />
        </div>

        <div className="km-cards-list">
          {kmMaterials.map((rec) => {
            const isExpanded = expandedKmId === rec.id;
            return (
              <div key={rec.id} className="km-record-card">
                <div className="km-record-header">
                  <div className="km-record-badges">
                    <span className={rec.doc_type_badge || 'badge-navy'}>
                      {rec.doc_type_short || rec.doc_type}
                    </span>
                    <span className="badge-navy">{rec.case_no}</span>
                    <span className="badge-amber">
                      📅 {rec.case_date} ｜ 預算 {(rec.budget_twd || 0).toLocaleString()} 元
                    </span>
                    {!rec.is_seed && <span className="badge-emerald">✨ 使用者新增累積</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-outline-sm"
                      onClick={() => setExpandedKmId(isExpanded ? '' : rec.id)}
                    >
                      {isExpanded ? '🔼 收合全文' : '🔽 展開全文與教訓'}
                    </button>
                    <button
                      className="btn-outline-sm"
                      onClick={() => handleSyncDrawerWithKm(rec)}
                    >
                      📚 連動法規抽屜
                    </button>
                    {rec.source_file && rec.source_file.download_url && (
                      <a
                        href={rec.source_file.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        📄 原檔 ({rec.source_file.original_filename})
                      </a>
                    )}
                    {onSendToPdfReport && (
                      <button
                        className="btn-outline-sm"
                        onClick={() =>
                          onSendToPdfReport({
                            id: rec.id,
                            title: rec.title,
                            category: rec.doc_type_label || rec.dispute_topic,
                            agency: rec.agency || rec.authority,
                            budget_twd: rec.budget_twd || 0,
                            summary: rec.facts_summary,
                            document_excerpt: rec.decision_or_findings,
                            detected_violations: (rec.matched_patterns_detail || []).map((pd) => ({
                              law: '[' + pd.code + '] ' + pd.legal_basis,
                              severity: pd.severity,
                              finding: '【' + pd.category + ' ' + pd.item_no + '】' + pd.pattern,
                            })),
                            root_cause: rec.decision_or_findings,
                            corrective_action: rec.km_lessons,
                          })
                        }
                      >
                        🔏 帶入 PDF 報告
                      </button>
                    )}
                    <button
                      className="btn-outline-sm"
                      style={{ color: '#B91C1C', borderColor: '#B91C1C' }}
                      onClick={() => handleDeleteKm(rec.id)}
                    >
                      🗑️ 刪除
                    </button>
                  </div>
                </div>

                <h3 className="km-record-title">{rec.title}</h3>
                <div className="km-record-meta-row">
                  <span>🏛️ 受理／查核單位：{rec.authority}</span>
                  <span>🏢 受查核／招標機關：{rec.agency}</span>
                  <span>📌 爭點：{rec.dispute_topic}</span>
                </div>
                <div className="km-outcome-line">
                  <strong>⚖️ 處理結果／決議：</strong>
                  {rec.outcome}
                </div>

                {rec.matched_patterns_detail && rec.matched_patterns_detail.length > 0 && (
                  <div className="km-pattern-chips">
                    <strong style={{ fontSize: '13.5px', color: '#0F2942' }}>🤖 命中錯誤態樣：</strong>
                    {rec.matched_patterns_detail.map((pd) => (
                      <span
                        key={pd.code}
                        className={pd.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}
                        title={pd.pattern}
                      >
                        {pd.code}（{pd.category}）
                      </span>
                    ))}
                  </div>
                )}

                {isExpanded && (
                  <div className="km-expanded-body">
                    <div className="res-item">
                      <strong>📄 案情摘要與事實經過：</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{rec.facts_summary}</p>
                    </div>
                    <div className="res-item">
                      <strong>⚖️ 審議判斷／調解建議／查核調查結論：</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{rec.decision_or_findings}</p>
                    </div>
                    <div className="safe-harbor-box" style={{ marginBottom: 0 }}>
                      <strong>💡 知識管理（KM）教訓與防弊要點：</strong>
                      <p style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0' }}>{rec.km_lessons}</p>
                    </div>
                  </div>
                )}

                <div className="km-footer-tags">
                  {(rec.law_refs || []).map((lr, i) => (
                    <span key={i} className="badge-navy">
                      ⚖️ {lr}
                    </span>
                  ))}
                  {(rec.tags || []).map((tg, i) => (
                    <span key={i} className="badge-emerald">
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {kmMaterials.length === 0 && (
            <div className="res-item">目前篩選條件下尚無知識管理素材，歡迎使用上方表單輸入或匯入報告！</div>
          )}
        </div>
      </section>
    </div>
  );
}
