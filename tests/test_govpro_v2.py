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

