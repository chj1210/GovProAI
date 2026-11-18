# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - FastAPI 後端主服務
整合三階段漸進式領航 API、115年最新法規精算引擎、LangGraph 多代理調度與原生 PDF 簽章匯出。
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

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
from backend.knowledge_base import (
    TRAINING_MODULES,
    LAW_CROSS_REFERENCE_DB,
    CERTIFICATION_QUIZ_BANK,
    LIFECYCLE_STAGES,
    AUDIT_SAMPLE_CASES,
    search_law_cross_reference,
    scan_custom_document_risk,
)
from backend.agent_graph import run_navigator_agent, TOPOLOGY_NODES_META, AGENT_GRAPH
from backend.pdf_generator import compute_hitl_sha256, generate_native_audit_pdf

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(
    title="政府採購AI領航員平台 V2.0 (三階段漸進式領航架構)",
    version="2.0.0",
    description="115年最新法規與工程會教材核心參數 × React + FastAPI + LangGraph 智慧領航系統",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic 請求模型
# ============================================================================

class QuizGradeRequest(BaseModel):
    level: str = Field(default="basic", description="basic 或 advanced")
    answers: Dict[str, int] = Field(default_factory=dict, description="題號對應選項索引 0~3")


class ThresholdCalcRequest(BaseModel):
    amount_twd: float = 55_000_000
    category: str = "engineering"
    entity_type: str = "central"
    ministry_type: str = "other"
    is_urgent: bool = False
    has_electronic_notice: bool = True
    has_electronic_doc: bool = True
    has_electronic_bid: bool = False
    bid_times: int = 1


class EngineeringQcCalcRequest(BaseModel):
    budget_twd: float = 6_800_000
    building_height_m: float = 0.0
    excavation_depth_m: float = 0.0
    bridge_span_m: float = 0.0
    is_road_work: bool = True


class PriceSettlementCalcRequest(BaseModel):
    current_valuation_amount: float = 10_000_000
    individual_index_change_pct: float = 12.5
    individual_item_weight_amount: float = 3_000_000
    category_index_change_pct: float = 6.5
    category_item_weight_amount: float = 4_000_000
    general_index_change_pct: float = 3.2
    tax_rate: float = 0.05
    deduct_advance_payment_ratio: float = 0.10
    contract_item_qty: float = 1000.0
    actual_item_qty: float = 1350.0
    contract_unit_price: float = 1000.0
    negotiated_excess_unit_price: Optional[float] = 950.0


class ContractChangeArt58Request(BaseModel):
    original_contract_amount_twd: float = 40_000_000
    addition_amount_twd: float = 8_000_000
    deduction_amount_twd: float = 4_000_000
    previous_cumulative_change_twd: float = 0.0
    category: str = "engineering"
    government_estimate_twd: float = 50_000_000
    lowest_bid_twd: float = 33_000_000
    agency_deems_reasonable: bool = False


class CustomRiskScanRequest(BaseModel):
    case_id: Optional[str] = None
    custom_text: Optional[str] = None


class RiggingDebarmentRequest(BaseModel):
    anomalies: List[str] = Field(
        default_factory=lambda: ["serial_registered_mail", "serial_bank_checks"]
    )
    violation_clause: str = "101_1_12"
    prior_debarment_count_in_5yrs: int = 1
    gave_10day_statement_notice: bool = True
    reviewed_by_work_group_with_external: bool = True
    months_since_violation_or_breach: int = 12


class LiabilityAnalysisRequest(BaseModel):
    scenario_type: str = "spec_tailoring"
    actor_role: str = "commissioned_architect"
    has_corrupt_intent: bool = True
    has_illegal_gain: bool = True
    kickback_or_inflation_flag: bool = False
    damage_amount_twd: float = 18_500_000


class NavigatorQueryRequest(BaseModel):
    query: str
    stage: str = "stage2"
    amount_twd: Optional[float] = None


class HitlPdfExportRequest(BaseModel):
    report_type: str = "audit_investigation"  # "official_memo" | "audit_investigation"
    case_title: str = "某碼頭特定鋼板樁綁標案"
    agency: str = "某港務工程處"
    budget_twd: float = 185_000_000
    signer_name: str = "王守法"
    signer_title: str = "採購稽核小組簡任稽核員（進階採購專業證照）"
    hitl_decision: str = "核准簽辦並移送缺失改善 (HITL Approved)"
    hitl_notes: str = "經人工複核母法×施行細則雙欄依據與三維法律責任分析，確認符合115年最新採購法令。"
    findings: List[Dict[str, str]] = Field(default_factory=list)
    liability_summary: str = ""
    corrective_action: str = ""


# ============================================================================
# 系統健康與 115 年法規核心參數端點
# ============================================================================

@app.get("/api/health")
def api_health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "version": "2.0.0",
        "architecture": "React + FastAPI + LangGraph (3-Stage Progressive Navigator)",
        "sdr_to_twd": SDR_TO_TWD,
        "thresholds_twd": THRESHOLDS_TWD,
        "treaty_thresholds": TREATY_THRESHOLDS,
        "contractor_limits": CONTRACTOR_LIMITS,
        "basic_design_pcc_review_thresholds": BASIC_DESIGN_PCC_REVIEW_THRESHOLDS,
        "green_engineering_norms": GREEN_ENGINEERING_NORMS,
        "default_drawer_data": {
            "law_cards": LAW_CROSS_REFERENCE_DB[:4],
            "textbook_citations": [
                {
                    "article_no": item["article_no"],
                    "title": item["title"],
                    "page": item["textbook_page"],
                    "highlight": item["textbook_commentary"],
                }
                for item in LAW_CROSS_REFERENCE_DB[:4]
            ],
            "agent_topology": {
                "nodes": TOPOLOGY_NODES_META,
                "edges": AGENT_GRAPH.edges,
                "execution_trace": [
                    {
                        "node_id": n["id"],
                        "node_label": n["label"],
                        "status": "READY",
                        "detail": n["role"],
                        "latency_ms": 0.4,
                    }
                    for n in TOPOLOGY_NODES_META
                ],
            },
        },
    }


# ============================================================================
# Stage 1：考證培訓賦能 API
# ============================================================================

@app.get("/api/stage1/overview")
def api_stage1_overview() -> Dict[str, Any]:
    return {
        "training_modules": TRAINING_MODULES,
        "laws": LAW_CROSS_REFERENCE_DB,
        "quiz_bank": CERTIFICATION_QUIZ_BANK,
    }


@app.get("/api/stage1/laws")
def api_stage1_laws(q: str = Query(default="", description="條號或關鍵字")) -> Dict[str, Any]:
    matched = search_law_cross_reference(q)
    return {
        "query": q,
        "count": len(matched),
        "results": matched,
    }


@app.post("/api/stage1/quiz/grade")
def api_stage1_grade_quiz(req: QuizGradeRequest) -> Dict[str, Any]:
    questions = CERTIFICATION_QUIZ_BANK.get(req.level, CERTIFICATION_QUIZ_BANK["basic"])
    total = len(questions)
    correct_count = 0
    graded_items = []

    for q in questions:
        qid = q["id"]
        user_ans = req.answers.get(qid, -1)
        is_correct = user_ans == q["answer_index"]
        if is_correct:
            correct_count += 1
        graded_items.append({
            "id": qid,
            "question": q["question"],
            "options": q["options"],
            "user_answer_index": user_ans,
            "correct_answer_index": q["answer_index"],
            "is_correct": is_correct,
            "law_ref": q["law_ref"],
            "explanation": q["explanation"],
        })

    score = round((correct_count / total) * 100) if total > 0 else 0
    pass_mark = 70
    return {
        "level": req.level,
        "level_title": "基礎認證模擬考" if req.level == "basic" else "進階認證模擬考",
        "total_questions": total,
        "correct_count": correct_count,
        "score": score,
        "passed": score >= pass_mark,
        "pass_mark": pass_mark,
        "graded_items": graded_items,
    }


# ============================================================================
# Stage 2：採購實務領航 API（五階段導航 ＋ 四大精算器）
# ============================================================================

@app.get("/api/stage2/lifecycle")
def api_stage2_lifecycle() -> Dict[str, Any]:
    return {
        "stages": LIFECYCLE_STAGES,
    }


@app.post("/api/stage2/calc/thresholds")
def api_calc_thresholds(req: ThresholdCalcRequest) -> Dict[str, Any]:
    return calculate_procurement_thresholds(
        amount_twd=req.amount_twd,
        category=req.category,
        entity_type=req.entity_type,
        ministry_type=req.ministry_type,
        is_urgent=req.is_urgent,
        has_electronic_notice=req.has_electronic_notice,
        has_electronic_doc=req.has_electronic_doc,
        has_electronic_bid=req.has_electronic_bid,
        bid_times=req.bid_times,
    )


@app.post("/api/stage2/calc/engineering-qc")
def api_calc_engineering_qc(req: EngineeringQcCalcRequest) -> Dict[str, Any]:
    return calculate_engineering_qualification_and_qc(
        budget_twd=req.budget_twd,
        building_height_m=req.building_height_m,
        excavation_depth_m=req.excavation_depth_m,
        bridge_span_m=req.bridge_span_m,
        is_road_work=req.is_road_work,
    )


@app.post("/api/stage2/calc/price-settlement")
def api_calc_price_settlement(req: PriceSettlementCalcRequest) -> Dict[str, Any]:
    return calculate_price_index_and_settlement(
        current_valuation_amount=req.current_valuation_amount,
        individual_index_change_pct=req.individual_index_change_pct,
        individual_item_weight_amount=req.individual_item_weight_amount,
        category_index_change_pct=req.category_index_change_pct,
        category_item_weight_amount=req.category_item_weight_amount,
        general_index_change_pct=req.general_index_change_pct,
        tax_rate=req.tax_rate,
        deduct_advance_payment_ratio=req.deduct_advance_payment_ratio,
        contract_item_qty=req.contract_item_qty,
        actual_item_qty=req.actual_item_qty,
        contract_unit_price=req.contract_unit_price,
        negotiated_excess_unit_price=req.negotiated_excess_unit_price,
    )


@app.post("/api/stage2/calc/contract-change-art58")
def api_calc_contract_change_art58(req: ContractChangeArt58Request) -> Dict[str, Any]:
    return calculate_contract_change_and_art58(
        original_contract_amount_twd=req.original_contract_amount_twd,
        addition_amount_twd=req.addition_amount_twd,
        deduction_amount_twd=req.deduction_amount_twd,
        previous_cumulative_change_twd=req.previous_cumulative_change_twd,
        category=req.category,
        government_estimate_twd=req.government_estimate_twd,
        lowest_bid_twd=req.lowest_bid_twd,
        agency_deems_reasonable=req.agency_deems_reasonable,
    )


# ============================================================================
# Stage 3：監察查核領航 API
# ============================================================================

@app.get("/api/stage3/sample-cases")
def api_stage3_sample_cases() -> Dict[str, Any]:
    return {
        "cases": AUDIT_SAMPLE_CASES,
    }


@app.post("/api/stage3/scan-risk")
def api_stage3_scan_risk(req: CustomRiskScanRequest) -> Dict[str, Any]:
    if req.case_id:
        for c in AUDIT_SAMPLE_CASES:
            if c["id"] == req.case_id:
                nav = run_navigator_agent(c["title"] + " " + c["summary"], stage="stage3", amount_twd=c["budget_twd"])
                return {
                    "mode": "sample_case",
                    "case": c,
                    "drawer_update": {
                        "law_cards": nav["law_cards"],
                        "textbook_citations": nav["textbook_citations"],
                        "agent_topology": nav["agent_topology"],
                    },
                }
    custom_res = scan_custom_document_risk(req.custom_text or "")
    nav = run_navigator_agent(req.custom_text or "招標文件與契約風險掃描", stage="stage3")
    return {
        "mode": "custom_text",
        "case": {
            "id": "custom",
            "title": "自訂上傳／貼上招標與契約條款風險掃描案",
            "category": "AI 即時法規掃描",
            "agency": "自訂檢核機關",
            "budget_twd": 50_000_000,
            "summary": (req.custom_text or "")[:200],
            "document_excerpt": req.custom_text or "",
            "detected_violations": custom_res["detected_violations"],
            "root_cause": custom_res["root_cause"],
            "corrective_action": custom_res["corrective_action"],
        },
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.post("/api/stage3/check-rigging-debarment")
def api_stage3_check_rigging_debarment(req: RiggingDebarmentRequest) -> Dict[str, Any]:
    return evaluate_bid_rigging_and_debarment(
        anomalies=req.anomalies,
        violation_clause=req.violation_clause,
        prior_debarment_count_in_5yrs=req.prior_debarment_count_in_5yrs,
        gave_10day_statement_notice=req.gave_10day_statement_notice,
        reviewed_by_work_group_with_external=req.reviewed_by_work_group_with_external,
        months_since_violation_or_breach=req.months_since_violation_or_breach,
    )


@app.post("/api/stage3/analyze-liability")
def api_stage3_analyze_liability(req: LiabilityAnalysisRequest) -> Dict[str, Any]:
    return analyze_three_dimensional_liability(
        scenario_type=req.scenario_type,
        actor_role=req.actor_role,
        has_corrupt_intent=req.has_corrupt_intent,
        has_illegal_gain=req.has_illegal_gain,
        kickback_or_inflation_flag=req.kickback_or_inflation_flag,
        damage_amount_twd=req.damage_amount_twd,
    )


# ============================================================================
# LangGraph 代理領航與 HITL SHA-256 PDF 簽章匯出 API
# ============================================================================

@app.post("/api/agent/navigate")
def api_agent_navigate(req: NavigatorQueryRequest) -> Dict[str, Any]:
    return run_navigator_agent(
        query=req.query,
        stage=req.stage,
        amount_twd=req.amount_twd,
    )


@app.post("/api/report/hitl-preview")
def api_report_hitl_preview(req: HitlPdfExportRequest) -> Dict[str, Any]:
    sig = compute_hitl_sha256(req.model_dump())
    return {
        "status": "signed",
        "signature": sig,
    }


@app.post("/api/report/hitl-pdf")
def api_report_hitl_pdf(req: HitlPdfExportRequest) -> Response:
    payload = req.model_dump()
    pdf_bytes = generate_native_audit_pdf(payload)
    sig = compute_hitl_sha256(payload)
    filename = (
        f"GovProV2_{req.report_type}_{sig['short_fingerprint']}.pdf"
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-HITL-SHA256": sig["sha256"],
            "X-HITL-Timestamp": sig["timestamp"],
        },
    )


# ============================================================================
# 預編譯 SPA 靜態資源掛載 (零外部網路依賴)
# ============================================================================

if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")


@app.get("/", response_class=HTMLResponse)
def serve_spa_index() -> Response:
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html; charset=utf-8")
    return HTMLResponse(
        content="<h1>GovPro V2.0 SPA Building...</h1>",
        status_code=200,
    )
