# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - FastAPI 後端主服務
整合三階段漸進式領航 API、115年最新法規精算引擎、LangGraph 多代理調度與原生 PDF 簽章匯出。
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import json
import mimetypes

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
from backend.erroneous_patterns_skill import (
    get_erroneous_patterns_meta,
    list_erroneous_patterns,
    run_erroneous_patterns_skill_audit,
)
from backend.dispute_km_engine import (
    SIX_MUNICIPALITIES,
    KM_DOC_TYPES,
    DISPUTE_TOPICS_CATALOG,
    evaluate_dispute_procedure,
    KM_REPO,
)
from backend.document_parser import (
    UPLOADS_DIR,
    save_uploaded_file,
    extract_document_text,
    extract_official_doc_metadata,
)

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


class ErroneousPatternAuditRequest(BaseModel):
    text: str = ""
    module_ids: Optional[List[str]] = None
    checked_codes: List[str] = Field(default_factory=list)
    case_title: str = "政府採購錯誤行為態樣 Agent Skill 專案檢核"


class DisputeEvaluateRequest(BaseModel):
    dispute_category: str = "tendering_review_award"
    procurement_category: str = "engineering"
    procurement_amount_twd: float = 5_000_000
    agency_jurisdiction: str = "中央機關或其他縣市政府"
    bidding_period_days: int = 14
    objection_subtype: str = "tender_docs"
    claim_amount_twd: float = 3_500_000
    is_monetary_claim: bool = True
    applicant_side: str = "supplier"
    negotiation_failed_first: bool = True
    committee_issued_proposal: bool = True
    agency_rejected_proposal: bool = True


class KmMaterialCreateRequest(BaseModel):
    doc_type: str = "audit_report"
    case_no: str = ""
    title: str
    authority: str = "行政院公共工程委員會採購申訴審議委員會"
    agency: str = ""
    procurement_category: str = "engineering"
    budget_twd: float = 0.0
    case_date: str = ""
    outcome: str = ""
    dispute_topic: str = ""
    facts_summary: str = ""
    decision_or_findings: str = ""
    km_lessons: str = ""
    matched_pattern_codes: List[str] = Field(default_factory=list)
    law_refs: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    auto_tag_patterns: bool = True
    source_file: Optional[Dict[str, Any]] = None


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
                skill_audit = run_erroneous_patterns_skill_audit(
                    text=(c["summary"] + "\n" + c.get("document_excerpt", "")),
                    case_title=c["title"],
                )
                return {
                    "mode": "sample_case",
                    "case": {**c, "skill_audit": skill_audit},
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
            "category": "AI 即時法規掃描（含錯誤態樣 Agent Skill）",
            "agency": "自訂檢核機關",
            "budget_twd": 50_000_000,
            "summary": (req.custom_text or "")[:200],
            "document_excerpt": req.custom_text or "",
            "detected_violations": custom_res["detected_violations"],
            "skill_audit": custom_res.get("skill_audit"),
            "root_cause": custom_res["root_cause"],
            "corrective_action": custom_res["corrective_action"],
        },
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.get("/api/stage3/erroneous-patterns/meta")
def api_stage3_erroneous_patterns_meta() -> Dict[str, Any]:
    return get_erroneous_patterns_meta()


@app.get("/api/stage3/erroneous-patterns")
def api_stage3_erroneous_patterns(
    module_id: str = Query(default="all", description="模組代碼或 all"),
    category: str = Query(default="all", description="類別名稱或 all"),
    q: str = Query(default="", description="關鍵字搜尋"),
) -> Dict[str, Any]:
    items = list_erroneous_patterns(module_id=module_id, category=category, query=q)
    return {
        "module_id": module_id,
        "category": category,
        "query": q,
        "count": len(items),
        "items": items,
    }


@app.post("/api/stage3/erroneous-patterns/audit")
def api_stage3_erroneous_patterns_audit(req: ErroneousPatternAuditRequest) -> Dict[str, Any]:
    audit_res = run_erroneous_patterns_skill_audit(
        text=req.text,
        module_ids=req.module_ids,
        checked_codes=req.checked_codes,
        case_title=req.case_title,
    )
    nav_query = req.text or (" ".join(req.checked_codes) + " 政府採購錯誤行為態樣檢核")
    nav = run_navigator_agent(nav_query, stage="stage3")
    return {
        "audit": audit_res,
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.get("/api/stage3/disputes/reference")
def api_stage3_disputes_reference() -> Dict[str, Any]:
    return {
        "six_municipalities": SIX_MUNICIPALITIES,
        "doc_types": KM_DOC_TYPES,
        "topics_catalog": DISPUTE_TOPICS_CATALOG,
    }


@app.post("/api/stage3/disputes/evaluate")
def api_stage3_disputes_evaluate(req: DisputeEvaluateRequest) -> Dict[str, Any]:
    result = evaluate_dispute_procedure(
        dispute_category=req.dispute_category,
        procurement_category=req.procurement_category,
        procurement_amount_twd=req.procurement_amount_twd,
        agency_jurisdiction=req.agency_jurisdiction,
        bidding_period_days=req.bidding_period_days,
        objection_subtype=req.objection_subtype,
        claim_amount_twd=req.claim_amount_twd,
        is_monetary_claim=req.is_monetary_claim,
        applicant_side=req.applicant_side,
        negotiation_failed_first=req.negotiation_failed_first,
        committee_issued_proposal=req.committee_issued_proposal,
        agency_rejected_proposal=req.agency_rejected_proposal,
    )
    nav_kw_map = {
        "tendering_review_award": "異議 申訴 審議判斷 招標審標決標爭議",
        "bid_bond_forfeiture": "押標金 不發還 追繳 異議 申訴",
        "art101_debarment": "第101條 停權 刊登公報 陳述意見 申訴",
        "contract_performance": "履約爭議 調解 強制仲裁 先調後仲",
    }
    nav = run_navigator_agent(
        nav_kw_map.get(req.dispute_category, "異議 申訴 調解"),
        stage="stage3",
        amount_twd=req.procurement_amount_twd,
    )
    return {
        "evaluation": result,
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.get("/api/stage3/km/materials")
def api_stage3_km_list(
    doc_type: str = Query(default="all", description="素材類別"),
    topic: str = Query(default="all", description="爭點類別"),
    pattern_code: str = Query(default="all", description="錯誤態樣代碼"),
    q: str = Query(default="", description="全文檢索關鍵字"),
) -> Dict[str, Any]:
    materials = KM_REPO.list_materials(
        doc_type=doc_type,
        topic=topic,
        pattern_code=pattern_code,
        query=q,
    )
    return {
        "count": len(materials),
        "doc_types": KM_DOC_TYPES,
        "analytics": KM_REPO.get_analytics(),
        "materials": materials,
    }


@app.post("/api/stage3/km/materials")
def api_stage3_km_create(req: KmMaterialCreateRequest) -> Dict[str, Any]:
    created = KM_REPO.create_material(req.model_dump())
    rec = created["record"]
    nav = run_navigator_agent(
        f"{rec.get('title', '')} {rec.get('dispute_topic', '')} {rec.get('decision_or_findings', '')}",
        stage="stage3",
        amount_twd=rec.get("budget_twd") or 50_000_000,
    )
    return {
        "status": "created",
        "record": rec,
        "skill_audit": created["skill_audit"],
        "analytics": KM_REPO.get_analytics(),
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.delete("/api/stage3/km/materials/{material_id}")
def api_stage3_km_delete(material_id: str) -> Dict[str, Any]:
    ok = KM_REPO.delete_material(material_id)
    if not ok:
        raise HTTPException(status_code=404, detail="找不到指定之知識管理素材")
    return {
        "status": "deleted",
        "id": material_id,
        "analytics": KM_REPO.get_analytics(),
    }


@app.get("/api/stage3/km/export")
def api_stage3_km_export() -> Response:
    payload = KM_REPO.export_all()
    content = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(
        content=content,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="GovProV2_Stage3_KM_Materials.json"',
        },
    )


@app.post("/api/stage3/upload-official-doc")
async def api_stage3_upload_official_doc(
    file: UploadFile = File(..., description="工程會函釋 PDF、監察調查報告、申訴／調解書或查核報告（支援 .pdf/.docx/.odt/.txt/.md）"),
    doc_type_hint: str = Form(default="auto"),
    auto_save_km: bool = Form(default=False),
) -> Dict[str, Any]:
    """
    網頁直接上傳「工程會函釋 PDF 檔」、「監察院調查／糾正報告」、「申訴／調解書」或「採購稽核查核報告」：
      1. 原始檔案安全歸檔至 data/uploads/，提供後續原檔調閱網址。
      2. 自動解析 PDF / DOCX / ODT / TXT 文字內容與頁數。
      3. 自動擷取文號、機關、民國轉西元日期、金額、主旨與法條依據。
      4. 自動執行「政府採購錯誤行為態樣 Agent Skill（277項）」與法規風險掃描，並更新右側法規抽屜。
      5. 若 auto_save_km=True，直接寫入 KM 知識管理素材庫（data/km_materials.json）。
    """
    file_bytes = await file.read()
    filename = file.filename or "uploaded_document.pdf"
    try:
        stored = save_uploaded_file(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    parsed = extract_document_text(file_bytes, stored["original_filename"])
    extracted_text = parsed["text"]
    metadata = extract_official_doc_metadata(
        text=extracted_text,
        filename=stored["original_filename"],
        doc_type_hint=doc_type_hint,
    )

    source_file_meta = {
        **stored,
        "page_count": parsed["page_count"],
        "parser_method": parsed["parser_method"],
        "char_count": parsed["char_count"],
    }

    custom_scan = scan_custom_document_risk(extracted_text)
    skill_audit = custom_scan.get("skill_audit") or run_erroneous_patterns_skill_audit(
        text=extracted_text,
        case_title=metadata["title"],
    )

    nav_query = f"{metadata['title']} {metadata['case_no']} {' '.join(metadata['law_refs'][:4])} {extracted_text[:300]}"
    nav = run_navigator_agent(
        query=nav_query,
        stage="stage3",
        amount_twd=metadata["budget_twd"] or 50_000_000,
    )

    saved_km_record = None
    if auto_save_km:
        km_res = KM_REPO.create_material({
            **metadata,
            "km_lessons": skill_audit.get("corrective_action") or custom_scan.get("corrective_action", ""),
            "matched_pattern_codes": skill_audit.get("matched_codes", []),
            "auto_tag_patterns": False,
            "source_file": source_file_meta,
        })
        saved_km_record = km_res["record"]

    return {
        "status": "parsed",
        "source_file": source_file_meta,
        "parsed": {
            "page_count": parsed["page_count"],
            "char_count": parsed["char_count"],
            "parser_method": parsed["parser_method"],
            "is_scanned_warning": parsed["is_scanned_warning"],
            "warning_message": parsed["warning_message"],
            "extracted_text": extracted_text,
        },
        "metadata": metadata,
        "skill_audit": skill_audit,
        "case": {
            "id": f"upload-{stored['stored_filename'][:15]}",
            "title": metadata["title"],
            "category": metadata["dispute_topic"],
            "agency": metadata["agency"],
            "budget_twd": metadata["budget_twd"] or 50_000_000,
            "summary": metadata["facts_summary"][:280],
            "document_excerpt": extracted_text[:4000],
            "detected_violations": custom_scan["detected_violations"],
            "skill_audit": skill_audit,
            "root_cause": custom_scan["root_cause"],
            "corrective_action": custom_scan["corrective_action"],
            "source_file": source_file_meta,
        },
        "saved_km_record": saved_km_record,
        "analytics": KM_REPO.get_analytics() if auto_save_km else None,
        "drawer_update": {
            "law_cards": nav["law_cards"],
            "textbook_citations": nav["textbook_citations"],
            "agent_topology": nav["agent_topology"],
        },
    }


@app.get("/api/stage3/uploads/{stored_filename}")
def api_stage3_download_uploaded_doc(stored_filename: str) -> FileResponse:
    """調閱或下載已歸檔之工程會函釋 PDF／監察調查報告原始檔案（防路徑遍歷）。"""
    safe_base = Path(stored_filename).name
    if safe_base != stored_filename or ".." in stored_filename:
        raise HTTPException(status_code=400, detail="無效的檔案名稱")
    target = (UPLOADS_DIR / safe_base).resolve()
    if not str(target).startswith(str(UPLOADS_DIR.resolve())) or not target.exists():
        raise HTTPException(status_code=404, detail="找不到指定的已上傳檔案")
    media_type, _ = mimetypes.guess_type(str(target))
    return FileResponse(
        path=str(target),
        media_type=media_type or "application/octet-stream",
        filename=safe_base,
    )


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
