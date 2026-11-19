# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 完整自動化測試套件 (Pytest)
涵蓋 115 年最新法規精算引擎、三大階段 API、LangGraph 拓撲與 HITL SHA-256 原生 PDF 匯出。
"""

from fastapi.testclient import TestClient
from build_spa import build_spa
from backend.main import app
from backend.agent_calculators import (
    SDR_TO_TWD,
    THRESHOLDS_TWD,
    TREATY_THRESHOLDS,
    CONTRACTOR_LIMITS,
    BASIC_DESIGN_PCC_REVIEW_THRESHOLDS,
    GREEN_ENGINEERING_NORMS,
    calculate_procurement_thresholds,
    calculate_engineering_qualification_and_qc,
    calculate_price_index_and_settlement,
    calculate_contract_change_and_art58,
    evaluate_bid_rigging_and_debarment,
    analyze_three_dimensional_liability,
)

# 確保預編譯 SPA 已產出
build_spa()
client = TestClient(app)


def test_115_core_legal_constants():
    """驗證 115 年最新法規與工程會教材硬編碼常數"""
    assert SDR_TO_TWD == 41.9484
    assert THRESHOLDS_TWD["publication"] == 1_500_000
    assert THRESHOLDS_TWD["small_purchase_central"] == 150_000
    assert THRESHOLDS_TWD["specialist_domestic"] == 1_500_000
    assert THRESHOLDS_TWD["specialist_overseas"] == 3_000_000
    assert THRESHOLDS_TWD["supervision"]["engineering"] == 50_000_000
    assert THRESHOLDS_TWD["supervision"]["property"] == 50_000_000
    assert THRESHOLDS_TWD["supervision"]["service"] == 10_000_000
    assert THRESHOLDS_TWD["large_procurement"]["engineering"] == 200_000_000
    assert THRESHOLDS_TWD["large_procurement"]["property"] == 100_000_000
    assert THRESHOLDS_TWD["large_procurement"]["service"] == 20_000_000

    # GPA / ANZTEC / ASTEP
    assert TREATY_THRESHOLDS["GPA_ANZTEC"]["central_goods_services_twd"] == 5_450_000
    assert TREATY_THRESHOLDS["GPA_ANZTEC"]["local_tp_ks_goods_services_twd"] == 8_380_000
    assert TREATY_THRESHOLDS["GPA_ANZTEC"]["other_entity_goods_services_twd"] == 16_770_000
    assert TREATY_THRESHOLDS["GPA_ANZTEC"]["engineering_all_twd"] == 209_740_000
    assert TREATY_THRESHOLDS["ASTEP"]["central_goods_services_twd"] == 4_190_000

    # 營造業承攬限額 (土木包工業提高為 720 萬元)
    assert CONTRACTOR_LIMITS["civil_contractor"]["limit_twd"] == 7_200_000
    assert CONTRACTOR_LIMITS["grade_c"]["limit_twd"] == 22_500_000
    assert CONTRACTOR_LIMITS["grade_b"]["limit_twd"] == 75_000_000

    # 基本設計送工程會審議門檻
    assert BASIC_DESIGN_PCC_REVIEW_THRESHOLDS["motc"] == 1_000_000_000
    assert BASIC_DESIGN_PCC_REVIEW_THRESHOLDS["moi_moea_moa"] == 400_000_000
    assert BASIC_DESIGN_PCC_REVIEW_THRESHOLDS["other"] == 100_000_000

    # 114.12 再生 AC 強制比率
    assert GREEN_ENGINEERING_NORMS["hot_mix_recycled_ac_min_ratio"] == 0.20
    assert GREEN_ENGINEERING_NORMS["base_layer_recycled_ac_min_ratio"] == 0.60


def test_calculator_1_thresholds_and_gpa():
    """測試精算器(1)：門檻、115.7.1公開閱覽新制、GPA/ASTEP 與等標期"""
    # 中央機關財物 450 萬元：未達 GPA (545萬)，但達 ASTEP (419萬)
    res_astep = calculate_procurement_thresholds(
        amount_twd=4_500_000,
        category="property",
        entity_type="central",
        has_electronic_notice=True,
        has_electronic_doc=True,
        has_electronic_bid=True,
    )
    assert res_astep["applies_gpa"] is False
    assert res_astep["applies_astep"] is True
    assert res_astep["bidding_period_days"] == 25  # 40 - 5 - 5 - 5 = 25

    # 勞務查核金額 1,200 萬元：觸發 115.7.1 公開閱覽新制
    res_srv = calculate_procurement_thresholds(
        amount_twd=12_000_000,
        category="service",
        entity_type="central",
    )
    assert res_srv["requires_public_inspection"] is True
    assert res_srv["requires_specialist"] is True


def test_calculator_2_engineering_and_three_tier_qc():
    """測試精算器(2)：720萬土木包工業、特定資格 1/12 與三級品管人數"""
    # 680 萬道路工程：可由土木包工業承攬
    res_civil = calculate_engineering_qualification_and_qc(
        budget_twd=6_800_000,
        bridge_span_m=4.0,
        is_road_work=True,
    )
    assert res_civil["contractor_code"] == "civil_contractor"
    assert res_civil["specific_qualification"]["can_set_specific_qual"] is False
    assert res_civil["quality_control"]["requires_quality_and_supervision_plan"] is True

    # 2.4 億巨額工程：甲等營造、特定資格 1/12 (2000萬)、品管 2 人、監造 2 人
    res_large = calculate_engineering_qualification_and_qc(
        budget_twd=240_000_000,
        building_height_m=40.0,
    )
    assert res_large["contractor_code"] == "grade_a"
    assert res_large["specific_qualification"]["can_set_specific_qual"] is True
    assert res_large["specific_qualification"]["max_paid_in_capital_or_equity_twd"] == 20_000_000
    assert res_large["quality_control"]["qc_personnel_min"] == 2
    assert res_large["quality_control"]["supervision_personnel_min"] == 2


def test_calculator_3_price_index_and_quantity_settlement():
    """測試精算器(3)：物調三層級 (10%/5%/2.5%) 與契約範本第3條實作數量 (3%/30%)"""
    res = calculate_price_index_and_settlement(
        current_valuation_amount=10_000_000,
        individual_index_change_pct=15.0,
        individual_item_weight_amount=2_000_000,
        category_index_change_pct=8.0,
        category_item_weight_amount=3_000_000,
        general_index_change_pct=4.0,
        contract_item_qty=1000.0,
        actual_item_qty=1350.0,  # +35%
        contract_unit_price=1000.0,
        negotiated_excess_unit_price=900.0,
    )
    assert res["price_escalation"]["tier1_individual_10pct"]["triggered"] is True
    assert res["price_escalation"]["tier2_category_5pct"]["triggered"] is True
    assert res["price_escalation"]["tier3_general_2_5pct"]["triggered"] is True
    # 實作數量 +35%：3%以內=30, 3%~30%=270, 逾30%=50
    qs = res["quantity_settlement"]
    assert qs["band_within_3_qty"] == 30.0
    assert qs["band_3_to_30_qty"] == 270.0
    assert qs["band_over_30_qty"] == 50.0
    assert qs["adj_3_to_30_twd"] == 270_000
    assert qs["adj_over_30_twd"] == 45_000
    assert res["payment_deadline_article_73_1"]["review_days"] == 15


def test_calculator_4_contract_change_and_art58():
    """測試精算器(4)：契約變更累計金額 (|加帳|+|減帳|) 與第58條差額保證金"""
    res = calculate_contract_change_and_art58(
        original_contract_amount_twd=40_000_000,
        addition_amount_twd=8_000_000,
        deduction_amount_twd=4_000_000,
        government_estimate_twd=50_000_000,
        lowest_bid_twd=33_000_000,  # 66% 底價 (<70%)
        agency_deems_reasonable=False,
    )
    assert res["contract_change"]["current_change_abs_sum_twd"] == 12_000_000
    assert res["article_58_decision"]["art58_band"] == "under_70"
    # 差額保證金 = 底價80% (4000萬) - 3300萬 = 700萬
    assert res["article_58_decision"]["bond_diff_amount_twd"] == 7_000_000


def test_stage3_rigging_debarment_and_liability():
    """測試階段三：第50條異常關聯、第101/103條階梯停權與三維法律責任剖析"""
    rig = evaluate_bid_rigging_and_debarment(
        anomalies=["serial_registered_mail", "same_ip_electronic_bid"],
        violation_clause="101_1_12",
        prior_debarment_count_in_5yrs=1,  # 5年內第2次 -> 6個月
        gave_10day_statement_notice=False,
        reviewed_by_work_group_with_external=True,
        months_since_violation_or_breach=40,  # 逾36個月裁處權時效
    )
    assert rig["article_50_check"]["has_rigging_risk"] is True
    assert "6 個月" in rig["article_101_103_check"]["debarment_duration"]
    assert rig["article_101_103_check"]["is_time_barred_debarment_3yr"] is True
    assert rig["article_101_103_check"]["is_procedurally_valid"] is False

    liab = analyze_three_dimensional_liability(
        scenario_type="spec_tailoring",
        actor_role="commissioned_architect",
        has_corrupt_intent=True,
        has_illegal_gain=True,
    )
    assert len(liab["criminal_liabilities"]) >= 2
    assert len(liab["admin_liabilities"]) >= 2
    assert len(liab["civil_liabilities"]) >= 2


def test_fastapi_endpoints_and_native_pdf():
    """測試 FastAPI 全端點與 HITL SHA-256 原生 PDF 匯出"""
    r_index = client.get("/")
    assert r_index.status_code == 200
    assert "app.bundle.js" in r_index.text

    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["sdr_to_twd"] == 41.9484

    r_s1 = client.get("/api/stage1/overview")
    assert r_s1.status_code == 200
    assert len(r_s1.json()["laws"]) >= 10

    r_nav = client.post("/api/agent/navigate", json={"query": "查核金額公開閱覽新制與二親等迴避", "stage": "stage1"})
    assert r_nav.status_code == 200
    assert len(r_nav.json()["agent_topology"]["execution_trace"]) == 6

    r_pdf = client.post(
        "/api/report/hitl-pdf",
        json={
            "report_type": "audit_investigation",
            "case_title": "某碼頭特定鋼板樁綁標案",
            "signer_name": "測試稽核官",
        },
    )
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert r_pdf.content.startswith(b"%PDF-1.4")
    assert len(r_pdf.headers.get("x-hitl-sha256", "")) == 64


def test_compiled_spa_js_syntax_and_components():
    """驗證預編譯 SPA app.bundle.js 語法括號平衡與三大階段元件完整性"""
    from pathlib import Path
    js = Path("frontend/dist/assets/app.bundle.js").read_text(encoding="utf-8")
    for fn_name in [
        "function SlideOverDrawer",
        "function Stage1CertificationCoach",
        "function Stage2LifecycleNavigator",
        "function Stage3ErroneousPatternsSkill",
        "function Stage3DisputeAndKmHub",
        "function Stage3AuditInvestigator",
        "function App",
    ]:
        assert fn_name in js, f"Missing compiled component: {fn_name}"

    stack = []
    i = 0
    n = len(js)
    while i < n:
        ch = js[i]
        if ch in ('"', "'", "`"):
            q = ch
            i += 1
            while i < n:
                if js[i] == "\\":
                    i += 2
                elif js[i] == q:
                    i += 1
                    break
                else:
                    i += 1
            continue
        if ch == "/" and i + 1 < n and js[i + 1] == "/":
            while i < n and js[i] != "\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and js[i + 1] == "*":
            i += 2
            while i + 1 < n and not (js[i] == "*" and js[i + 1] == "/"):
                i += 1
            i += 2
            continue
        if ch in "({[":
            stack.append((ch, i))
        elif ch in ")}]":
            pair = {")": "(", "}": "{", "]": "["}[ch]
            assert stack and stack[-1][0] == pair, f"Mismatch at {i}: {js[max(0, i-40):i+40]}"
            stack.pop()
        i += 1
    assert not stack, f"Unclosed brackets: {stack[:3]}"


def test_stage3_erroneous_patterns_agent_skill():
    """驗證「政府採購錯誤行為態樣」Agent Skill 五大模組 277 項檢核準則與自動評檢引擎"""
    r_meta = client.get("/api/stage3/erroneous-patterns/meta")
    assert r_meta.status_code == 200
    meta = r_meta.json()
    assert meta["skill_name"] == "procurement-erroneous-patterns"
    assert meta["total_criteria_count"] == 277
    assert len(meta["modules"]) == 5
    assert "procurement-erroneous-patterns" in meta["skill_markdown"]

    # 檢核五大模組項目數量精準對應工程會教材
    counts_by_mod = {m["id"]: m["total_count"] for m in meta["modules"]}
    assert counts_by_mod["general_12"] == 105
    assert counts_by_mod["arch_design_rigging"] == 63
    assert counts_by_mod["art22_limited"] == 76
    assert counts_by_mod["scored_lowest_bid"] == 16
    assert counts_by_mod["small_150k"] == 17

    # 測試篩選查詢 API
    r_list = client.get("/api/stage3/erroneous-patterns?module_id=scored_lowest_bid&q=標價")
    assert r_list.status_code == 200
    assert r_list.json()["count"] >= 1
    assert any(it["code"] == "SCORE-02-05" for it in r_list.json()["items"])

    # 測試 Agent Skill 自動掃描 ＋ 手動勾選綜合評檢
    r_audit = client.post(
        "/api/stage3/erroneous-patterns/audit",
        json={
            "case_title": "綜合測試標案",
            "text": "非屬特殊或巨額採購卻限定 ISO 9001 驗證，投標時檢附原廠授權代理證明書；評分及格最低標將標價納入審查評分；並將 15 萬元以下小額採購化整為零分批辦理。",
            "checked_codes": ["ART22-06-10"],
        },
    )
    assert r_audit.status_code == 200
    audit = r_audit.json()["audit"]
    assert audit["risk_level"] == "CRITICAL"
    matched_codes = set(audit["matched_codes"])
    assert "EP-02-02" in matched_codes
    assert "EP-02-15" in matched_codes
    assert "SCORE-02-05" in matched_codes
    assert "SMALL15-01-02" in matched_codes
    assert "ART22-06-10" in matched_codes


def test_stage3_dispute_resolution_engine():
    """驗證爭議處理（異議／申訴／調解）程序、150萬門檻例外、規費與第85條之1強制仲裁五要件"""
    r_ref = client.get("/api/stage3/disputes/reference")
    assert r_ref.status_code == 200
    assert len(r_ref.json()["six_municipalities"]) == 6
    assert len(r_ref.json()["topics_catalog"]) == 4

    # 1. 未達 150 萬一般招審決標爭議 -> 不可申訴
    r_under = client.post(
        "/api/stage3/disputes/evaluate",
        json={
            "dispute_category": "tendering_review_award",
            "procurement_amount_twd": 1_200_000,
            "bidding_period_days": 14,
            "objection_subtype": "tender_docs",
        },
    )
    assert r_under.status_code == 200
    assert r_under.json()["evaluation"]["can_proceed"] is False

    # 2. 未達 150 萬但屬第 31 條押標金爭議 -> 不受 150 萬門檻限制，可提起申訴
    r_bond = client.post(
        "/api/stage3/disputes/evaluate",
        json={
            "dispute_category": "bid_bond_forfeiture",
            "procurement_amount_twd": 900_000,
            "agency_jurisdiction": "臺北市政府",
        },
    )
    assert r_bond.status_code == 200
    ev_bond = r_bond.json()["evaluation"]
    assert ev_bond["can_proceed"] is True
    assert ev_bond["threshold_exempt"] is True
    assert "臺北市政府" in ev_bond["competent_committee"]
    assert ev_bond["fee_info"]["fee_twd"] == 30_000

    # 3. 工程履約爭議調解：符合第 85 條之 1 第 2 項強制仲裁五要件
    r_med = client.post(
        "/api/stage3/disputes/evaluate",
        json={
            "dispute_category": "contract_performance",
            "procurement_category": "engineering",
            "claim_amount_twd": 6_000_000,
            "is_monetary_claim": True,
            "applicant_side": "supplier",
            "negotiation_failed_first": True,
            "committee_issued_proposal": True,
            "agency_rejected_proposal": True,
        },
    )
    assert r_med.status_code == 200
    ev_med = r_med.json()["evaluation"]
    assert ev_med["fee_info"]["fee_twd"] == 60_000
    assert ev_med["mandatory_arbitration"]["triggered"] is True


def test_stage3_km_repository_crud_and_export():
    """驗證爭議處理／調解／申訴與查核調查報告 KM 知識庫輸入、自動標註、統計分析、刪除與匯出"""
    r_list = client.get("/api/stage3/km/materials")
    assert r_list.status_code == 200
    initial_count = r_list.json()["count"]
    assert initial_count >= 6

    # 新增一筆調解／查核知識管理素材，並自動以 Agent Skill 標註錯誤態樣
    r_create = client.post(
        "/api/stage3/km/materials",
        json={
            "doc_type": "investigation_report",
            "case_no": "TEST-KM-115",
            "title": "【測試調查報告】某機關開標掛號連號暨IP相同圍標調查案",
            "authority": "監察院測試專案小組",
            "agency": "測試機關",
            "procurement_category": "engineering",
            "budget_twd": 12_000_000,
            "outcome": "糾正並移送檢調",
            "dispute_topic": "圍標重大異常關聯調查",
            "facts_summary": "開標發現3家廠商郵局掛號連號且不同投標廠商領標IP相同，顯有陪標圍標情事。",
            "decision_or_findings": "違反採購法第50條第1項第5款及工程會09500256920號令。",
            "km_lessons": "開標應確實勾稽掛號連號與IP紀錄，啟動行政調查。",
            "auto_tag_patterns": True,
        },
    )
    assert r_create.status_code == 200
    created_rec = r_create.json()["record"]
    created_id = created_rec["id"]
    assert "EP-12-02" in created_rec["matched_pattern_codes"]
    assert "EP-12-05" in created_rec["matched_pattern_codes"]

    # 確認可被關鍵字檢索到且統計數 +1
    r_search = client.get("/api/stage3/km/materials?q=TEST-KM-115")
    assert r_search.status_code == 200
    assert r_search.json()["count"] == 1
    assert r_search.json()["analytics"]["total_materials"] == initial_count + 1

    # 測試 JSON 匯出
    r_exp = client.get("/api/stage3/km/export")
    assert r_exp.status_code == 200
    assert "application/json" in r_exp.headers["content-type"]
    assert "TEST-KM-115" in r_exp.text

    # 測試刪除清理測試資料，恢復原始知識庫狀態
    r_del = client.delete(f"/api/stage3/km/materials/{created_id}")
    assert r_del.status_code == 200
    assert r_del.json()["analytics"]["total_materials"] == initial_count


def test_stage3_pdf_official_doc_upload_and_archive():
    """驗證網頁上傳工程會函釋 PDF 及監察院調查報告 PDF 解析、自動入庫與原檔調閱 API"""
    from pathlib import Path
    from backend.pdf_generator import generate_native_audit_pdf
    from backend.document_parser import UPLOADS_DIR

    # 1. 產生一份模擬「工程會函釋 PDF」並測試上傳解析 (auto_save_km=false)
    pcc_pdf_bytes = generate_native_audit_pdf({
        "report_type": "official_memo",
        "case_title": "行政院公共工程委員會 113年9月26日 工程企字第1130100288號函 審標結果通知教示內容釋示",
        "agency": "各中央及地方機關",
        "budget_twd": 5_000_000,
        "findings": [
            {
                "law": "政府採購法第51條、施行細則第61條",
                "severity": "HIGH",
                "finding": "機關通知廠商投標文件審查結果時，必須告知救濟途徑、期間與受理機關等教示內容。",
            }
        ],
    })
    r_pcc = client.post(
        "/api/stage3/upload-official-doc",
        files={"file": ("工程企字第1130100288號函釋.pdf", pcc_pdf_bytes, "application/pdf")},
        data={"doc_type_hint": "auto", "auto_save_km": "false"},
    )
    assert r_pcc.status_code == 200
    d_pcc = r_pcc.json()
    assert d_pcc["parsed"]["page_count"] >= 1
    assert d_pcc["parsed"]["char_count"] > 50
    assert d_pcc["metadata"]["doc_type"] == "pcc_interpretation"
    assert "1130100288" in d_pcc["metadata"]["case_no"]
    assert d_pcc["metadata"]["case_date"] == "2024-09-26"

    # 驗證歸檔原檔可透過 GET /api/stage3/uploads/{stored_filename} 下載
    stored_pcc = d_pcc["source_file"]["stored_filename"]
    r_dl = client.get(d_pcc["source_file"]["download_url"])
    assert r_dl.status_code == 200
    assert r_dl.content.startswith(b"%PDF-1.4")

    # 2. 產生一份模擬「監察院調查報告 PDF」並測試一鍵自動解析入庫 (auto_save_km=true)
    cy_pdf_bytes = generate_native_audit_pdf({
        "report_type": "audit_investigation",
        "case_title": "監察院 院台調字第1150800999號 調查報告 某機關化整為零分批辦理暨掛號連號圍標糾正案",
        "agency": "某縣政府工務局",
        "budget_twd": 28_000_000,
        "findings": [
            {
                "law": "政府採購法第14條、第50條第1項第5款",
                "severity": "CRITICAL",
                "finding": "將案件化整為零分批辦理以規避法規，且開標發現投標廠商掛號連號及IP相同涉圍標。",
            }
        ],
    })
    r_cy = client.post(
        "/api/stage3/upload-official-doc",
        files={"file": ("監察院調查報告_院台調字第1150800999號.pdf", cy_pdf_bytes, "application/pdf")},
        data={"doc_type_hint": "auto", "auto_save_km": "true"},
    )
    assert r_cy.status_code == 200
    d_cy = r_cy.json()
    assert d_cy["metadata"]["doc_type"] == "investigation_report"
    assert "1150800999" in d_cy["metadata"]["case_no"]
    saved_rec = d_cy["saved_km_record"]
    assert saved_rec is not None
    assert saved_rec["source_file"]["original_filename"] == "監察院調查報告_院台調字第1150800999號.pdf"
    assert "EP-01-06" in saved_rec["matched_pattern_codes"]
    assert "EP-12-02" in saved_rec["matched_pattern_codes"]

    # 3. 驗證不支援之副檔名回傳 400
    r_bad = client.post(
        "/api/stage3/upload-official-doc",
        files={"file": ("malware.exe", b"MZ...", "application/octet-stream")},
    )
    assert r_bad.status_code == 400

    # 清理測試歸檔與測試 KM 記錄
    client.delete(f"/api/stage3/km/materials/{saved_rec['id']}")
    for fname in (stored_pcc, d_cy["source_file"]["stored_filename"]):
        p = Path(UPLOADS_DIR) / fname
        if p.exists():
            p.unlink()



