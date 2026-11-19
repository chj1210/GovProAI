# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 爭議處理（異議／申訴／調解）精算導航 ＆ 知識管理 (KM) 素材累積庫引擎
依據行政院公共工程委員會《爭議處理研討課程大綱》與《爭議處理教材》建置：
  1. 四大爭議類別程序、法定期間、受理機關（六都 vs 工程會）、審議費／調解費試算與強制仲裁五要件檢核。
  2. 持久化知識管理 (KM) 素材累積庫 (`data/km_materials.json`)：支援使用者輸入異議、申訴、調解、
     採購稽核／施工查核報告及監察／政風調查報告，並自動串接「政府採購錯誤行為態樣 Agent Skill」進行缺失標註與跨案統計。
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import datetime
import json
import math
import uuid

from backend.erroneous_patterns_skill import (
    run_erroneous_patterns_skill_audit,
    ERRONEOUS_PATTERNS_BY_CODE,
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
KM_DATA_FILE = DATA_DIR / "km_materials.json"

SIX_MUNICIPALITIES = [
    "臺北市政府",
    "新北市政府",
    "桃園市政府",
    "臺中市政府",
    "臺南市政府",
    "高雄市政府",
]

KM_DOC_TYPES: List[Dict[str, str]] = [
    {
        "id": "pcc_interpretation",
        "label": "工程會函釋／令函（解釋函／作業指引 PDF）",
        "short": "工程會函釋",
        "badge_class": "badge-navy",
    },
    {
        "id": "dispute_objection",
        "label": "異議處理案件（招審決標／第101條異議）",
        "short": "異議處理",
        "badge_class": "badge-navy",
    },
    {
        "id": "appeal_decision",
        "label": "採購申訴審議判斷（招審決標／押標金／停權申訴）",
        "short": "申訴審議判斷",
        "badge_class": "badge-red",
    },
    {
        "id": "mediation_case",
        "label": "履約爭議調解案件（展延／漏項／違約金／減價收受）",
        "short": "履約調解",
        "badge_class": "badge-emerald",
    },
    {
        "id": "audit_report",
        "label": "採購稽核／工程施工查核報告",
        "short": "稽核／查核報告",
        "badge_class": "badge-amber",
    },
    {
        "id": "investigation_report",
        "label": "監察院調查／糾正報告或廉政政風調查報告",
        "short": "監察／調查報告",
        "badge_class": "badge-red",
    },
]
KM_DOC_TYPE_MAP: Dict[str, Dict[str, str]] = {d["id"]: d for d in KM_DOC_TYPES}

# ============================================================================
# 1. 爭議處理研討四大類知識架構（依工程會《爭議處理研討課程大綱》建置）
# ============================================================================

DISPUTE_TOPICS_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "topic_system",
        "section": "一、政府採購爭議處理制度與功能",
        "track": "雙軌救濟制度總覽（公法異議申訴 vs 私法履約調解）",
        "items": [
            {
                "title": "公法救濟軌道：招標、審標、決標、不發還／追繳押標金及第101條停權爭議",
                "law_ref": "採購法第74~85條、第101~103條、行政程序法、行政罰法、行政執行法",
                "summary": "異議（向招標機關提出）➔ 申訴（向採購申訴審議委員會提出，審議判斷視同訴願決定）➔ 行政訴訟（送達次日起2個月內）。",
            },
            {
                "title": "私法救濟軌道：履約爭議（含驗收、保固）多元處理機制",
                "law_ref": "採購法第85條之1~第85條之4、採購履約爭議調解規則、民事訴訟法",
                "summary": "先經機關與廠商協議不成 ➔ 向採購申訴審議委員會申請調解（成立與確定判決同一效力）或提付仲裁／民事訴訟；工程及技術服務採購具「先調後仲」強制仲裁條款。",
            },
        ],
    },
    {
        "id": "topic_appeal_bid",
        "section": "二、招標、審標、決標、不發還或追繳押標金申訴案件研討",
        "track": "公法申訴實務（採購申訴審議委員會）",
        "items": [
            {
                "title": "（一）程序不受理案例（申訴逾期、非屬政府採購事件、審議規則第11條）",
                "law_ref": "採購法第76條、採購申訴審議規則第11條、細則第105條及第105條之1",
                "summary": "異議或申訴逾法定期限應不予受理；惟機關評估逾期異議具實質理由者，仍得依細則第105條之1自行撤銷、變更或暫停程序。",
            },
            {
                "title": "（二）招標文件違反規定（廠商資格不當限制競爭、產品規格綁標如指定廠牌）",
                "law_ref": "採購法第6條、第26條、第36條、第37條、資格標準",
                "summary": "常見於非特殊巨額訂特定資格（ISO 9001）、限定單一公會或指定特定廠牌未加註「或同等品」。",
            },
            {
                "title": "（三）審標違反規定（得標廠商資格未符規定、無效標認定有誤）",
                "law_ref": "採購法第50條、第51條、細則第60條、第61條",
                "summary": "形式瑕疵濫判無效標（違反09600182560號令）、不同廠商採不同審查標準、或未附記教示內容通知審標結果。",
            },
            {
                "title": "（四）採購過程、結果違反規定（標價偏低未依第58條處理、評選會組成不合法或評選不公）",
                "law_ref": "採購法第58條、第94條、採購評選委員會組織準則與審議規則",
                "summary": "標價低於底價70%未先通知說明即決標或濫收差額保證金；評選委員違反利益迴避或明顯差異未提交召集人處理。",
            },
            {
                "title": "（五）不發還或追繳押標金案例（不受150萬公告金額限制）",
                "law_ref": "採購法第31條第2項、第76條第1項",
                "summary": "涉及第31條第2項不發還或追繳押標金（含重大異常關聯與借牌）之申訴，依法不受公告金額（150萬元）以上之限制。",
            },
        ],
    },
    {
        "id": "topic_appeal_101",
        "section": "三、通知將刊登政府採購公報（第101條停權）申訴案件研討",
        "track": "公法裁罰申訴（準用異議申訴，不受150萬門檻限制）",
        "items": [
            {
                "title": "因可歸責廠商事由致解除／終止契約、延誤履約期限或驗收不合格「情節重大」",
                "law_ref": "採購法第101條第1項第8、10、12款、第101條第3項及第4項",
                "summary": "通知前必經兩道法定程序：(1)給予10日以上口頭或書面陳述意見機會；(2)成立採購工作及審查小組審酌損害輕重、可歸責程度及實際補救賠償措施。",
            },
            {
                "title": "得標後無正當理由不訂約（第7款）與借牌／容許他人借牌（第1、2款）",
                "law_ref": "採購法第101條第1項第1、2、7款、第103條第1項、行政罰法第27條",
                "summary": "第1、2款刊登停權3年；第7~14款採5年內「3個月➔6個月➔1年」階梯累進；皆受行政罰法3年裁處權時效拘束。",
            },
        ],
    },
    {
        "id": "topic_mediation",
        "section": "四、履約爭議調解案件研討",
        "track": "私法履約調解（採購法第85條之1～第85條之4）",
        "items": [
            {
                "title": "（一）得標廠商不簽約請求退還押標金 ／（二）因故請求展延工期及其利管費",
                "law_ref": "採購法第85條之1、工程採購契約範本第7條及第20條",
                "summary": "展延工期爭議應檢視可歸責機關事由（如用地未交付、管線遷移遲延、停工）及是否依契約約定檢具管理費單據。",
            },
            {
                "title": "（三）漏項或數量短少請求增加給付 ／（四）逾期違約金爭議 ／（五）減價收受爭議",
                "law_ref": "工程採購契約範本第3條（實作數量3%/30%）、採購法第72條第2項、民法第252條",
                "summary": "總價結算實作數量逾±3%/±30%調整規則；逾期違約金過高得參酌民法第252條衡平；減價收受須符合不妨礙安全及使用需求且無減少通常效用或契約預定效用。",
            },
        ],
    },
]


# ============================================================================
# 2. 爭議處理（異議／申訴／調解）程序、時效、費用與強制仲裁檢核引擎
# ============================================================================

def _calculate_mediation_fee_twd(claim_amount_twd: float, is_monetary_claim: bool) -> Dict[str, Any]:
    """
    依《採購履約爭議調解收費辦法》第5條、第6條估算調解費（新臺幣 2 萬元至 100 萬元；非金額標的 3 萬元）。
    """
    if not is_monetary_claim or claim_amount_twd <= 0:
        return {
            "fee_twd": 30_000,
            "basis": "非以請求或確認金額為調解標的者，依《採購履約爭議調解收費辦法》第6條固定收取新臺幣 30,000 元。",
        }
    amt = float(claim_amount_twd)
    # 採購履約爭議調解收費辦法第5條法定級距（2萬元～100萬元）
    if amt < 2_000_000:
        fee = 20_000
    elif amt < 5_000_000:
        fee = 30_000
    elif amt < 10_000_000:
        fee = 60_000
    elif amt < 20_000_000:
        fee = 100_000
    elif amt < 50_000_000:
        fee = 150_000
    elif amt < 100_000_000:
        fee = 200_000
    elif amt < 300_000_000:
        fee = 350_000
    elif amt < 500_000_000:
        fee = 600_000
    else:
        fee = 1_000_000
    return {
        "fee_twd": fee,
        "basis": f"請求或確認金額為新臺幣 {amt:,.0f} 元，依《採購履約爭議調解收費辦法》第5條級距，估算調解費為新臺幣 {fee:,} 元（法定區間 2 萬元～100 萬元）。",
    }


def evaluate_dispute_procedure(
    dispute_category: str = "tendering_review_award",
    # "tendering_review_award" | "bid_bond_forfeiture" | "art101_debarment" | "contract_performance"
    procurement_category: str = "engineering",  # "engineering" | "tech_service" | "property" | "service"
    procurement_amount_twd: float = 5_000_000,
    agency_jurisdiction: str = "中央機關或其他縣市政府",
    bidding_period_days: int = 14,
    objection_subtype: str = "tender_docs",  # "tender_docs" | "clarification_change" | "process_result"
    claim_amount_twd: float = 3_500_000,
    is_monetary_claim: bool = True,
    applicant_side: str = "supplier",  # "supplier" | "agency"
    negotiation_failed_first: bool = True,
    committee_issued_proposal: bool = True,
    agency_rejected_proposal: bool = True,
) -> Dict[str, Any]:
    """
    全方位檢核政府採購爭議處理法定路徑、異議/申訴/調解期限、受理機關、規費及第85條之1第2項強制仲裁要件。
    """
    is_six_city = agency_jurisdiction in SIX_MUNICIPALITIES
    competent_committee = (
        f"{agency_jurisdiction}採購申訴審議委員會"
        if is_six_city
        else "行政院公共工程委員會採購申訴審議委員會（中央及未設申訴會之縣市統一委請辦理）"
    )

    if dispute_category == "contract_performance":
        # 履約爭議調解（採購法第85條之1~第85條之4）
        fee_info = _calculate_mediation_fee_twd(claim_amount_twd, is_monetary_claim)
        can_initiate = True
        initiate_warning = ""
        if not negotiation_failed_first:
            can_initiate = False
            initiate_warning = "⚠️ 先決條件未符：依採購法第85條之1，須機關與廠商就履約爭議先進行「協議」，協議不成始得申請調解。"
        elif applicant_side == "agency":
            initiate_warning = "⚠️ 特別注意：機關主動申請調解者，須經「廠商同意」，否則依調解規則第10條第9款應為調解不受理之決議！（廠商申請時，機關則不得拒絕啟動調解）"
        else:
            initiate_warning = "✅ 廠商申請履約爭議調解，依第85條之1第2項「機關不得拒絕」調解程序之啟動（不含強制接受實體主張）。"

        # 檢核第85條之1第2項「先調後仲」強制仲裁五要件
        is_eng_or_tech = procurement_category in ("engineering", "tech_service")
        arb_elements = [
            {"element": "要件(1)：屬「工程」或「技術服務」採購", "passed": is_eng_or_tech},
            {"element": "要件(2)：須向採購申訴審議委員會申請調解（並先經協議不成）", "passed": negotiation_failed_first},
            {"element": "要件(3)：採購申訴審議委員會已出具「調解建議」或「調解方案」", "passed": committee_issued_proposal},
            {"element": "要件(4)：調解不成立係因「機關不同意」該建議或方案所致", "passed": agency_rejected_proposal},
            {"element": "要件(5)：由廠商提付仲裁（非機關提付）", "passed": applicant_side == "supplier"},
        ]
        mandatory_arbitration_triggered = all(e["passed"] for e in arb_elements)

        return {
            "dispute_category": dispute_category,
            "track_name": "私法階段：履約爭議調解（含驗收、保固爭議）",
            "legal_basis": "政府採購法第85條之1至第85條之4、採購履約爭議調解規則、民事訴訟法第380條/第416條/第422條",
            "competent_committee": competent_committee,
            "can_proceed": can_initiate,
            "eligibility_note": initiate_warning,
            "deadlines": [
                {"step": "1. 他造當事人陳述意見期限", "rule": "自收受調解申請書副本之次日起 15 日內，以書面向採購申訴審議委員會陳述意見並副知申請人。"},
                {"step": "2. 撤回調解退費期限", "rule": "第 1 次調解期日之次日起 10 日內以書面撤回者，無息退還調解費 1/2（未退還部分上限 20 萬元）；不受理免收費（已通知期日收 5,000 元）。"},
                {"step": "3. 調解建議不同意之核定", "rule": "機關如不同意委員會出具之「調解建議」，應先報請上級機關核定，並以書面向委員會及廠商說明理由。"},
                {"step": "4. 調解方案異議不變期間", "rule": "當事人或利害關係人對職權提出之「調解方案」，應於送達次日起 10 日內之不變期間提出異議；未異議者視為已依該方案調解成立！"},
            ],
            "fee_info": fee_info,
            "effect_summary": "調解成立者，依民事訴訟法第380條第1項、第416條第1項，與「確定判決有同一效力」；調解不成立時，依民事訴訟法第422條，調解委員勸導及當事人陳述讓步不得採為本案訴訟裁判基礎。",
            "mandatory_arbitration": {
                "triggered": mandatory_arbitration_triggered,
                "summary": (
                    "🔥 已完全符合採購法第85條之1第2項「先調後仲」五要件：廠商提付仲裁時，機關依法【不得拒絕】！"
                    if mandatory_arbitration_triggered
                    else "未完全具備第85條之1第2項強制仲裁五要件（仍須依契約仲裁條款或民事訴訟救濟）。"
                ),
                "elements": arb_elements,
            },
        }

    # 公法階段：異議 ➔ 申訴 ➔ 行政訴訟
    if dispute_category == "art101_debarment":
        track_name = "公法階段：通知將刊登政府採購公報（第101條不良廠商停權）異議與申訴"
        legal_basis = "採購法第101條至第103條、細則第109條之1、採購申訴審議規則、行政罰法"
        obj_deadline = "自接獲機關第101條書面通知之次日起 20 日內提出異議（採購法第102條第1項）。"
        threshold_exempt = True
        can_appeal = True
        threshold_note = "✅ 依採購法第102條，刊登公報停權申訴【不受公告金額（150萬元）門檻限制】，小額採購亦可提出申訴。"
    elif dispute_category == "bid_bond_forfeiture":
        track_name = "公法階段：不發還押標金或追繳押標金異議與申訴"
        legal_basis = "採購法第31條第2項、第75條、第76條、採購申訴審議規則"
        obj_deadline = "接獲機關通知或公告之次日起 10 日內提出異議（採購法第75條第1項第3款）。"
        threshold_exempt = True
        can_appeal = True
        threshold_note = "✅ 依採購法第76條第1項但書，爭議屬第31條不予發還或追繳押標金者，【不受公告金額（150萬元）門檻限制】。"
    else:
        track_name = "公法階段：招標、審標、決標爭議異議與申訴"
        legal_basis = "採購法第74條至第85條、施行細則第105條、第105條之1、採購申訴審議規則"
        if objection_subtype == "tender_docs":
            q_days = max(10, math.ceil(max(1, bidding_period_days) / 4.0))
            obj_deadline = f"對招標文件規定異議：自公告日或邀標次日起等標期（{bidding_period_days}日）之 1/4（尾數不足1日以1日計，且不得少於10日）➔ 法定異議期間為 {q_days} 日。"
        elif objection_subtype == "clarification_change":
            obj_deadline = "對招標文件釋疑、後續說明、變更或補充異議：接獲機關通知或公告之次日起 10 日。"
        else:
            obj_deadline = "對採購過程、結果異議：接獲通知/公告或知悉次日起 10 日；屬招標、審標、決標事項者，至遲不得逾決標日之次日起 15 日。"
        threshold_exempt = False
        can_appeal = procurement_amount_twd >= 1_500_000
        threshold_note = (
            f"✅ 採購金額 {procurement_amount_twd:,.0f} 元已達公告金額（150萬元）以上，對異議結果不服或機關逾期不處理得提起申訴。"
            if can_appeal
            else f"⚠️ 採購金額 {procurement_amount_twd:,.0f} 元未達公告金額（150萬元），依法僅得向招標機關提出「異議」，不得向採購申訴審議委員會提起申訴（第31條押標金及第101條停權爭議除外）。"
        )

    return {
        "dispute_category": dispute_category,
        "track_name": track_name,
        "legal_basis": legal_basis,
        "competent_committee": competent_committee,
        "can_proceed": can_appeal,
        "threshold_exempt": threshold_exempt,
        "eligibility_note": threshold_note,
        "deadlines": [
            {"step": "1. 廠商提出異議期限", "rule": obj_deadline + "（逾期依細則第105條不予受理；具實質理由機關仍得依細則第105條之1自行撤銷變更）"},
            {"step": "2. 招標機關處理異議期限", "rule": "自收受異議之次日起 15 日內為適當處理並書面通知廠商，且必須附記救濟途徑、期間及受理機關等「教示內容」。"},
            {"step": "3. 廠商提起申訴期限", "rule": "對異議處理結果不服或機關逾 15 日不為處理者，於收受結果或期限屆滿之次日起 15 日內繕具申訴書（附副本送招標機關）向申訴會提出；誤送他機關者，應於次日起 3 日內移送。"},
            {"step": "4. 招標機關陳述意見期限", "rule": "招標機關應自收受申訴書副本之次日起 10 日內，以書面檢具相關文件向申訴會陳述意見（採購法第78條）。"},
            {"step": "5. 審議判斷後處置與行政訴訟", "rule": "審議判斷指明違法者，招標機關應於收受次日起 20 日內另為適法處置（並償付廠商投標/異議/申訴必要費用，第85條）；審議判斷視同訴願決定（第83條），不服者於送達次日起 2 個月內向行政法院提起行政訴訟。"},
        ],
        "fee_info": {
            "fee_twd": 30_000,
            "basis": "每一申訴事件審議費新臺幣 30,000 元；第 1 次預審會議前撤回無息退還 1/2；經決議不受理者免予收費並全額退還（但已通知預審會議期日者，收取新臺幣 5,000 元）。",
        },
        "effect_summary": "審議判斷視同訴願決定（採購法第83條）；招標機關如自行撤銷、變更原處理結果或暫停程序者，應即通知採購申訴審議委員會（第84條）。",
        "mandatory_arbitration": None,
    }


# ============================================================================
# 3. 爭議處理／調解／申訴與查核調查報告 知識管理 (KM) 素材累積庫
# ============================================================================

def _default_seed_km_materials() -> List[Dict[str, Any]]:
    return [
        {
            "id": "km-seed-001",
            "doc_type": "appeal_decision",
            "case_no": "訴1140128號",
            "title": "【申訴審議判斷】某廳舍建築工程空調冰水主機指定單一廠牌EER值暨限定ISO 9001資格申訴案",
            "authority": "行政院公共工程委員會採購申訴審議委員會",
            "agency": "某部會所屬機關",
            "procurement_category": "engineering",
            "budget_twd": 48_000_000,
            "case_date": "2026-03-18",
            "outcome": "申訴有理由（原異議處理結果撤銷，命機關20日內另為適法處置）",
            "dispute_topic": "招標文件違反規定（資格不當限制＆規格綁標）",
            "facts_summary": "本案預算4,800萬元（未達巨額），招標文件限定投標廠商須具ISO 9001品質管理系統驗證，且空調工程規範中冰水機組EER及COP值訂定高於經濟部能源效率標準，僅單一進口廠牌可達標，並要求投標時檢附原廠授權代理證明書，未加註「或同等品」。",
            "decision_or_findings": "申訴會審議判斷指明：(1)本案非屬特殊或巨額採購，限定ISO 9001違反採購法第36條及資格標準第5條；(2)投標時要求原廠授權證明違反第37條；(3)空調冰水機組EER/COP訂定過高且未允許同等品，違反採購法第26條第2、3項。原採購行為違法，應依第85條於20日內另為適法處置並償付申訴必要費用。",
            "km_lessons": "1. 預算未達2億元且非特殊工程，絕不可將ISO 9001列為投標資格或產品規格。\n2. 機電空調規範須檢核「建築工程規劃設計可能綁標行為態樣」（EER/COP應依經濟部標準），避免委外設計直接抄錄單一進口型錄。",
            "matched_pattern_codes": ["EP-02-02", "EP-02-15", "EP-03-01", "EP-03-02", "ARCH-16-04"],
            "law_refs": ["採購法第26條", "採購法第36條", "採購法第37條", "採購法第85條"],
            "tags": ["申訴有理由", "規格綁標", "ISO9001", "空調EER"],
            "created_at": "2026-03-20 10:15:00",
            "is_seed": True,
        },
        {
            "id": "km-seed-002",
            "doc_type": "appeal_decision",
            "case_no": "北市訴1140089號",
            "title": "【第101條停權申訴】延誤履約期限未踐行採購工作及審查小組認定「情節重大」遭撤銷案",
            "authority": "臺北市政府採購申訴審議委員會",
            "agency": "臺北市某工程處",
            "procurement_category": "engineering",
            "budget_twd": 32_500_000,
            "case_date": "2026-04-22",
            "outcome": "申訴有理由（原停權通知及異議處理結果均撤銷）",
            "dispute_topic": "通知刊登政府採購公報（第101條第1項第10款情節重大）",
            "facts_summary": "廠商履約逾期18天（已扣罰逾期違約金且順利驗收啟用），機關未檢視延遲部分係因管線單位遷移遲延所致，逕發函通知依採購法第101條第1項第10款刊登公報，通知前雖請廠商函覆說明但僅給予5日期間，且未成立採購工作及審查小組審議。",
            "decision_or_findings": "申訴會認定：(1)通知前未給予10日以上陳述意見期間，違反施行細則第109條之1；(2)未成立採購工作及審查小組認定，違反第101條第3項強制程序；(3)未依第101條第4項審酌損害輕重、可歸責程度與已完工補救情形，不符合「情節重大」比例原則，撤銷原處分。",
            "km_lessons": "啟動第101條不良廠商停權前，務必完成三道檢核：(1)10日以上書面陳述意見；(2)成立採購工作及審查小組（外聘≥1/3）做成實質審酌紀錄；(3)核對行政罰法第27條3年裁處權時效。",
            "matched_pattern_codes": ["EP-09-03", "EP-11-08"],
            "law_refs": ["採購法第101條第3項", "採購法第101條第4項", "採購法第102條", "施行細則第109條之1"],
            "tags": ["第101條停權", "情節重大", "陳述意見", "審查小組"],
            "created_at": "2026-04-25 14:30:00",
            "is_seed": True,
        },
        {
            "id": "km-seed-003",
            "doc_type": "mediation_case",
            "case_no": "調1140215號",
            "title": "【履約爭議調解】污水下水道管線障礙致展延工期210日及間接工程管理費請求調解案",
            "authority": "行政院公共工程委員會採購申訴審議委員會",
            "agency": "某直轄市水利局",
            "procurement_category": "engineering",
            "budget_twd": 168_000_000,
            "case_date": "2026-05-12",
            "outcome": "調解成立（機關給付展延管理費420萬元，與確定判決有同一效力）",
            "dispute_topic": "履約爭議調解（因故請求展延工期及其利管費）",
            "facts_summary": "本案開工後因既有地下自來水及台電高壓管線未遷移且機關用地協調耗時，致主徑停工展延210日曆天。廠商依契約請求展延期間之工地現場人員薪資、保險及管理費計850萬元，雙方協議不成由廠商申請調解。",
            "decision_or_findings": "調解委員查明停工主因可歸責於機關未能如期交付無障礙施工用地，參酌廠商實際出勤與勞健保憑證，出具書面調解建議給付420萬元。機關審酌若不同意調解建議，本案屬工程採購將觸發第85條之1第2項「先調後仲」強制仲裁機制，經報請核定後同意調解建議，調解成立。",
            "km_lessons": "1. 計畫與設計階段未完成用地與管線試挖協調即發包，極易衍生巨額展延利管費索賠。\n2. 機關面對工程及技術服務調解建議時，須謹慎評估第85條之1第2項強制仲裁風險與報上級核定程序。",
            "matched_pattern_codes": ["EP-01-05", "EP-11-06"],
            "law_refs": ["採購法第85條之1", "採購法第85條之3", "民事訴訟法第416條"],
            "tags": ["履約調解", "展延工期", "利管費", "強制仲裁"],
            "created_at": "2026-05-15 09:40:00",
            "is_seed": True,
        },
        {
            "id": "km-seed-004",
            "doc_type": "mediation_case",
            "case_no": "調1140304號",
            "title": "【履約爭議調解】總價結算工程實作數量短少漏項暨減價收受違約金爭議調解案",
            "authority": "臺中市政府採購申訴審議委員會",
            "agency": "臺中市某局處",
            "procurement_category": "engineering",
            "budget_twd": 65_000_000,
            "case_date": "2026-06-08",
            "outcome": "調解成立（依契約第3條逾3%部分核實給付並依第72條第2項辦理減價收受）",
            "dispute_topic": "履約爭議調解（漏項或數量短少請求增加給付／減價收受爭議）",
            "facts_summary": "總價結算工程中，土方開挖與擋土支撐工項實作數量較契約詳細價目表增加36%，廠商請求全額追加給付；另部分地坪收邊厚度略薄3mm，機關原要求全面敲除重作並計罰高額逾期違約金，雙方協議不成提請調解。",
            "decision_or_findings": "調解委員會依工程採購契約範本第3條核算：實作數量增減3%以內不予增減、逾3%至30%部分依原契約單價給付、逾30%之6%部分協議合理單價；地坪厚度經結構技師鑑定不妨礙安全與使用需求，建議依採購法第72條第2項辦理減價收受（減價並加計懲罰性違約金），雙方合意成立調解。",
            "km_lessons": "1. 實作數量爭議應精確套用契約範本第3條 3% / 30% 分段計算公式，避免全給或全拒致生爭訟。\n2. 驗收瑕疵不妨礙安全及通常效用且拆除困難者，得依法簽核採第72條第2項減價收受，兼顧公益與效率。",
            "matched_pattern_codes": ["EP-01-10", "EP-11-08", "ARCH-17-02"],
            "law_refs": ["採購法第72條第2項", "採購法第85條之1", "工程採購契約範本第3條"],
            "tags": ["實作數量", "減價收受", "逾期違約金", "調解成立"],
            "created_at": "2026-06-10 16:20:00",
            "is_seed": True,
        },
        {
            "id": "km-seed-005",
            "doc_type": "audit_report",
            "case_no": "稽核115-042號",
            "title": "【採購稽核查核報告】評分及格最低標誤將標價納評分暨第22條第1項第6款追加逾50%稽核缺失報告",
            "authority": "中央採購稽核小組",
            "agency": "某國立大學總務處",
            "procurement_category": "engineering",
            "budget_twd": 58_000_000,
            "case_date": "2026-07-14",
            "outcome": "列管重大稽核缺失（限期30日檢討改善並追究承辦疏失）",
            "dispute_topic": "採購稽核查核（評分及格最低標＆第22條限制性招標缺失）",
            "facts_summary": "本案採評分及格最低標招標，工作小組僅2人且有成員兼任審查委員，審查項目竟將「廠商投標標價」納入20%評分；履約期間又將先前因預算不足減項招標之項目，以第22條第1項第6款辦理契約變更追加，且誤以「加帳減去減帳淨額未逾50%」計算，實際加帳累計已達原主契約金額56%。",
            "decision_or_findings": "採購稽核小組查核認定違反：(1)細則第64條之2第2項第2款（評分及格最低標不得將標價納入評分）；(2)組織準則第8條（工作小組未達3人且兼任委員）；(3)採購法第22條第1項第6款及細則第22條第4項（減項招標非未能預見、加帳累計不得與減帳相抵且逾50%上限）。",
            "km_lessons": "1. 評分及格最低標「嚴禁將標價納入評分」，價格僅供及格後開價格標比最低標使用。\n2. 契約變更第22條第1項第6款 50% 上限一律按「歷次加帳累計」核算，減帳不可相抵，且原減項內容不得以未能預見為由追加。",
            "matched_pattern_codes": ["SCORE-01-02", "SCORE-02-05", "ART22-06-01", "ART22-06-05", "ART22-06-10"],
            "law_refs": ["施行細則第64條之2", "採購法第22條第1項第6款", "施行細則第22條第4項"],
            "tags": ["採購稽核", "評分及格最低標", "追加逾50%", "加減帳相抵"],
            "created_at": "2026-07-16 11:05:00",
            "is_seed": True,
        },
        {
            "id": "km-seed-006",
            "doc_type": "investigation_report",
            "case_no": "院台調字第1150800192號",
            "title": "【監察院調查報告】某機關年度修繕採購化整為零分批小額採購（15萬元以下）暨廠商代蒐集3家估價單調查案",
            "authority": "監察院（內政及族群委員會）",
            "agency": "某縣市鄉鎮公所",
            "procurement_category": "property",
            "budget_twd": 1_860_000,
            "case_date": "2026-08-25",
            "outcome": "通過糾正案，函請主管機關議處失職人員並移送廉政署偵辦",
            "dispute_topic": "監察調查（小額採購違法分批＆假性比價圍標）",
            "facts_summary": "某公所辦理年度辦公設備及修繕採購總計186萬元，明知屬同一年度同質預算需求，竟刻意拆分為14筆均為13萬至14.8萬元之小額採購（公告金額十分之一15萬元以下）以規避公告金額以上公開招標；且均洽特定甲廠商代為蒐集提供3家廠商估價單充作比價紀錄，驗收僅憑統一發票辦理書面驗收未實質確認交貨。",
            "decision_or_findings": "監察院調查認定嚴重違反採購法第14條（化整為零分批辦理）、第6條第1項（洽1家廠商代蒐集3家估價單）、施行細則第6條第1款及採購人員倫理準則第7條（核銷驗收未落實控管），且估價單筆跡與傳真號碼相同顯涉第50條重大異常關聯，予以糾正並移請司法偵辦。",
            "km_lessons": "1. 15萬元以下小額採購仍受採購法規範，同質性計畫預算應合併辦理，嚴禁拆單規避15萬或150萬門檻。\n2. 嚴禁請廠商代為蒐集3家報價單，並須留存實際交貨/履約佐證照片與書面驗收紀錄，杜絕發票核銷弊端。",
            "matched_pattern_codes": ["EP-01-06", "EP-12-02", "SMALL15-01-02", "SMALL15-02-02", "SMALL15-02-12"],
            "law_refs": ["採購法第14條", "採購法第6條第1項", "採購法第50條", "採購人員倫理準則第7條"],
            "tags": ["監察院糾正", "化整為零", "15萬小額採購", "代蒐集估價單"],
            "created_at": "2026-08-28 15:50:00",
            "is_seed": True,
        },
    ]


class KMRepository:
    """持久化於 data/km_materials.json 之爭議處理／調解／申訴／查核調查報告知識管理素材庫。"""

    def __init__(self, data_file: Path = KM_DATA_FILE) -> None:
        self.data_file = data_file
        self._ensure_initialized()

    def _ensure_initialized(self) -> None:
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.data_file.exists():
            self._save_all(_default_seed_km_materials())

    def _load_all(self) -> List[Dict[str, Any]]:
        self._ensure_initialized()
        try:
            raw = self.data_file.read_text(encoding="utf-8")
            data = json.loads(raw)
            if isinstance(data, list):
                return data
        except Exception:
            pass
        seeds = _default_seed_km_materials()
        self._save_all(seeds)
        return seeds

    def _save_all(self, records: List[Dict[str, Any]]) -> None:
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.data_file.with_suffix(".tmp.json")
        tmp_path.write_text(
            json.dumps(records, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        tmp_path.replace(self.data_file)

    def list_materials(
        self,
        doc_type: str = "",
        topic: str = "",
        pattern_code: str = "",
        query: str = "",
    ) -> List[Dict[str, Any]]:
        records = self._load_all()
        q = (query or "").strip().lower()
        out = []
        for r in records:
            if doc_type and doc_type != "all" and r.get("doc_type") != doc_type:
                continue
            if topic and topic != "all" and topic not in (r.get("dispute_topic") or ""):
                continue
            if pattern_code and pattern_code != "all":
                if pattern_code not in (r.get("matched_pattern_codes") or []):
                    continue
            if q:
                hay = " ".join([
                    str(r.get("title", "")),
                    str(r.get("case_no", "")),
                    str(r.get("authority", "")),
                    str(r.get("agency", "")),
                    str(r.get("dispute_topic", "")),
                    str(r.get("outcome", "")),
                    str(r.get("facts_summary", "")),
                    str(r.get("decision_or_findings", "")),
                    str(r.get("km_lessons", "")),
                    " ".join(r.get("law_refs") or []),
                    " ".join(r.get("tags") or []),
                    " ".join(r.get("matched_pattern_codes") or []),
                ]).lower()
                if q not in hay:
                    continue
            # 動態補齊錯誤態樣詳細標籤方便前端顯示
            enriched_patterns = []
            for code in r.get("matched_pattern_codes") or []:
                p = ERRONEOUS_PATTERNS_BY_CODE.get(code)
                if p:
                    enriched_patterns.append({
                        "code": p["code"],
                        "category": p["category"],
                        "item_no": p["item_no"],
                        "severity": p["severity"],
                        "pattern": p["pattern"],
                        "legal_basis": p["legal_basis"],
                    })
            type_meta = KM_DOC_TYPE_MAP.get(r.get("doc_type", ""), KM_DOC_TYPES[0])
            out.append({
                **r,
                "doc_type_label": type_meta["label"],
                "doc_type_short": type_meta["short"],
                "doc_type_badge": type_meta["badge_class"],
                "matched_patterns_detail": enriched_patterns,
            })
        return out

    def create_material(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        records = self._load_all()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        combined_text = "\n".join([
            str(payload.get("title", "")),
            str(payload.get("dispute_topic", "")),
            str(payload.get("facts_summary", "")),
            str(payload.get("decision_or_findings", "")),
            str(payload.get("km_lessons", "")),
        ])

        manual_codes = [c.strip() for c in (payload.get("matched_pattern_codes") or []) if c.strip()]
        auto_tag = bool(payload.get("auto_tag_patterns", True))
        skill_audit = None
        if auto_tag:
            skill_audit = run_erroneous_patterns_skill_audit(
                text=combined_text,
                checked_codes=manual_codes,
                case_title=str(payload.get("title", "知識管理素材")),
            )
            final_codes = skill_audit["matched_codes"]
        else:
            final_codes = manual_codes

        # 清理 law_refs 與 tags
        raw_laws = payload.get("law_refs") or []
        if isinstance(raw_laws, str):
            raw_laws = [x.strip() for x in raw_laws.replace("、", ",").split(",") if x.strip()]
        if not raw_laws and skill_audit:
            # 自命中態樣自動補充法條依據
            inferred_laws = []
            for p in skill_audit["matched_patterns"][:5]:
                if p["legal_basis"] not in inferred_laws:
                    inferred_laws.append(p["legal_basis"])
            raw_laws = inferred_laws

        raw_tags = payload.get("tags") or []
        if isinstance(raw_tags, str):
            raw_tags = [x.strip() for x in raw_tags.replace("、", ",").split(",") if x.strip()]

        new_record = {
            "id": f"km-{uuid.uuid4().hex[:8]}",
            "doc_type": payload.get("doc_type") or "audit_report",
            "case_no": (payload.get("case_no") or "").strip() or f"KM-{datetime.datetime.now().strftime('%Y%m%d')}",
            "title": (payload.get("title") or "").strip() or "未命名採購查核／爭議知識管理素材",
            "authority": (payload.get("authority") or "").strip() or "機關採購稽核／審議單位",
            "agency": (payload.get("agency") or "").strip() or "招標機關",
            "procurement_category": payload.get("procurement_category") or "engineering",
            "budget_twd": float(payload.get("budget_twd") or 0),
            "case_date": (payload.get("case_date") or "").strip() or datetime.date.today().isoformat(),
            "outcome": (payload.get("outcome") or "").strip() or "已登錄知識庫列管追蹤",
            "dispute_topic": (payload.get("dispute_topic") or "").strip() or "綜合查核與爭議處理",
            "facts_summary": (payload.get("facts_summary") or "").strip(),
            "decision_or_findings": (payload.get("decision_or_findings") or "").strip(),
            "km_lessons": (payload.get("km_lessons") or "").strip(),
            "matched_pattern_codes": final_codes,
            "law_refs": raw_laws,
            "tags": raw_tags,
            "source_file": payload.get("source_file") or None,
            "created_at": now_str,
            "is_seed": False,
        }

        records.insert(0, new_record)
        self._save_all(records)

        enriched = self.list_materials()
        created_enriched = next((x for x in enriched if x["id"] == new_record["id"]), new_record)
        return {
            "record": created_enriched,
            "skill_audit": skill_audit,
        }

    def delete_material(self, material_id: str) -> bool:
        records = self._load_all()
        next_records = [r for r in records if r.get("id") != material_id]
        if len(next_records) == len(records):
            return False
        self._save_all(next_records)
        return True

    def get_analytics(self) -> Dict[str, Any]:
        records = self._load_all()
        by_type = []
        for dt in KM_DOC_TYPES:
            cnt = sum(1 for r in records if r.get("doc_type") == dt["id"])
            by_type.append({
                "id": dt["id"],
                "short": dt["short"],
                "label": dt["label"],
                "count": cnt,
            })

        pattern_counter: Dict[str, int] = {}
        topic_counter: Dict[str, int] = {}
        total_budget = 0.0
        for r in records:
            total_budget += float(r.get("budget_twd") or 0)
            t = (r.get("dispute_topic") or "其他").strip()
            topic_counter[t] = topic_counter.get(t, 0) + 1
            for code in r.get("matched_pattern_codes") or []:
                pattern_counter[code] = pattern_counter.get(code, 0) + 1

        top_patterns = []
        for code, cnt in sorted(pattern_counter.items(), key=lambda kv: (-kv[1], kv[0]))[:8]:
            p = ERRONEOUS_PATTERNS_BY_CODE.get(code)
            top_patterns.append({
                "code": code,
                "count": cnt,
                "category": p["category"] if p else "其他態樣",
                "item_no": p["item_no"] if p else "",
                "severity": p["severity"] if p else "HIGH",
                "pattern_preview": (p["pattern"][:42] + "…") if p and len(p["pattern"]) > 42 else (p["pattern"] if p else code),
            })

        top_topics = [
            {"topic": k, "count": v}
            for k, v in sorted(topic_counter.items(), key=lambda kv: (-kv[1], kv[0]))[:6]
        ]

        return {
            "total_materials": len(records),
            "user_contributed_count": sum(1 for r in records if not r.get("is_seed")),
            "total_budget_twd": total_budget,
            "by_doc_type": by_type,
            "top_erroneous_patterns": top_patterns,
            "top_dispute_topics": top_topics,
            "storage_path": str(self.data_file),
        }

    def export_all(self) -> Dict[str, Any]:
        records = self._load_all()
        return {
            "platform": "政府採購AI領航員平台 V2.0 — 階段三知識管理素材庫",
            "exported_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_count": len(records),
            "analytics": self.get_analytics(),
            "materials": records,
        }


KM_REPO = KMRepository()

