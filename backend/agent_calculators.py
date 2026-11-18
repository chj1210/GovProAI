# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 115年最新法規與工程會教材核心精算引擎
Hardcoded 114-115年最新法規參數、門檻級距、GPA/ASTEP/ANZTEC國際條約、
營造業承攬限額、三級品管、物價指數三層級、實作數量3%/30%、契約變更累計金額、
第58條偏低標決策樹、第50條重大異常關聯及第101/103條停權檢核。
"""

from typing import Dict, Any, List, Optional
import math

# ============================================================================
# 1. 115年最新法規核心常數 (硬編碼基準)
# ============================================================================

# 匯率基準 (114-115年財政部/工程會公告國際條約協定折算率)
SDR_TO_TWD: float = 41.9484

# 採購金額級距 (新臺幣元)
THRESHOLDS_TWD: Dict[str, Any] = {
    "small_purchase_central": 150_000,         # 小額採購：中央機關 15 萬元以下 (公告金額十分之一)
    "publication": 1_500_000,                  # 公告金額：工程、財物、勞務皆為 150 萬元
    "specialist_domestic": 1_500_000,          # 採購法第95條專業人員門檻：國內 150 萬元以上
    "specialist_overseas": 3_000_000,          # 採購法第95條專業人員門檻：駐外機構 300 萬元以上
    "supervision": {                           # 查核金額 (115.7.1新制公開閱覽門檻 & 報上級監辦)
        "engineering": 50_000_000,             # 工程：5,000 萬元
        "property": 50_000_000,                # 財物：5,000 萬元
        "service": 10_000_000,                 # 勞務：1,000 萬元
    },
    "large_procurement": {                     # 巨額採購
        "engineering": 200_000_000,            # 工程：2 億元 (採購法第11條之1成立5人以上採購工作及審查小組)
        "property": 100_000_000,               # 財物：1 億元
        "service": 20_000_000,                 # 勞務：2,000 萬元
    },
}

# 114-115年 國際條約協定門檻金額 (WTO GPA / 臺紐 ANZTEC / 臺星 ASTEP)
TREATY_THRESHOLDS: Dict[str, Dict[str, Any]] = {
    "GPA_ANZTEC": {
        "name": "WTO政府採購協定 (GPA) ＆ 臺紐經濟合作協定 (ANZTEC)",
        "sdr_rate": SDR_TO_TWD,
        "central_goods_services_sdr": 130_000,
        "central_goods_services_twd": 5_450_000,      # 13萬 SDR = 545 萬元
        "local_tp_ks_goods_services_sdr": 200_000,
        "local_tp_ks_goods_services_twd": 8_380_000,  # 20萬 SDR = 838 萬元 (臺北市、高雄市)
        "other_entity_goods_services_sdr": 400_000,
        "other_entity_goods_services_twd": 16_770_000,# 40萬 SDR = 1,677 萬元 (國營事業/國立大學/醫院)
        "engineering_all_sdr": 5_000_000,
        "engineering_all_twd": 209_740_000,           # 500萬 SDR = 2 億 974 萬元
    },
    "ASTEP": {
        "name": "臺星經濟夥伴協定 (ASTEP)",
        "sdr_rate": SDR_TO_TWD,
        "central_goods_services_sdr": 100_000,
        "central_goods_services_twd": 4_190_000,      # 10萬 SDR = 419 萬元
        "local_6cities_goods_services_sdr": 200_000,
        "local_6cities_goods_services_twd": 8_380_000,# 20萬 SDR = 838 萬元 (北、高、新北、臺中、臺南、桃園六都)
        "other_entity_goods_services_sdr": 400_000,
        "other_entity_goods_services_twd": 16_770_000,# 40萬 SDR = 1,677 萬元
        "engineering_all_sdr": 5_000_000,
        "engineering_all_twd": 209_740_000,           # 500萬 SDR = 2 億 974 萬元
    },
}

# 營造業承攬造價限額與規模範圍 (內政部國土署最新修正：土木包工業提高為720萬)
CONTRACTOR_LIMITS: Dict[str, Dict[str, Any]] = {
    "civil_contractor": {
        "title": "土木包工業",
        "limit_twd": 7_200_000,                # 720 萬元
        "capital_req_twd": 1_000_000,
        "max_building_height_m": 0,            # 結構物規模受限
        "max_excavation_depth_m": 0,
        "max_bridge_span_m": 5.0,              # 橋梁跨距 5m 以下
        "region_limit": "限於登記當地直轄市、縣（市）地區及毗鄰直轄市、縣（市）地區越區營業",
    },
    "grade_c": {
        "title": "丙等綜合營造業",
        "limit_twd": 22_500_000,               # 2,250 萬元
        "capital_req_twd": 3_600_000,
        "max_building_height_m": 21.0,         # 建築物高度 21m 以下
        "max_excavation_depth_m": 6.0,         # 地下室開挖 6m 以下
        "max_bridge_span_m": 15.0,             # 橋梁柱跨距 15m 以下
        "region_limit": "全國皆可承攬",
    },
    "grade_b": {
        "title": "乙等綜合營造業",
        "limit_twd": 75_000_000,               # 7,500 萬元
        "capital_req_twd": 12_000_000,
        "max_building_height_m": 36.0,         # 建築物高度 36m 以下
        "max_excavation_depth_m": 9.0,         # 地下室開挖 9m 以下
        "max_bridge_span_m": 25.0,             # 橋梁柱跨距 25m 以下
        "region_limit": "全國皆可承攬",
    },
    "grade_a": {
        "title": "甲等綜合營造業",
        "limit_twd": None,                     # 資本額 10 倍，工程規模不受限
        "capital_req_twd": 22_500_000,
        "capital_multiplier": 10,              # 承攬造價限額為其資本額之 10 倍
        "max_building_height_m": float("inf"),
        "max_excavation_depth_m": float("inf"),
        "max_bridge_span_m": float("inf"),
        "region_limit": "全國皆可承攬（規模不限，承攬限額為資本額10倍）",
    },
}

# 基本設計送工程會審議門檻 (政府公共工程計畫與經費審議作業要點)
BASIC_DESIGN_PCC_REVIEW_THRESHOLDS: Dict[str, int] = {
    "motc": 1_000_000_000,          # 交通部：10 億元
    "moi_moea_moa": 400_000_000,    # 內政部、經濟部、農業部：4 億元
    "mnd_classified": 1_000_000_000,# 國防部機密戰備工程：10 億元
    "other": 100_000_000,           # 其他部會：1 億元
    "alternative_scheme_req": 1_000_000_000, # 達 10 億元以上須提替選方案評估
}

# 114年12月修正環境友善與 AC 刨除料強制比率
GREEN_ENGINEERING_NORMS: Dict[str, Any] = {
    "hot_mix_recycled_ac_min_ratio": 0.20,     # 道路工程熱拌再生 AC 使用比率 ≥ 20%
    "base_layer_recycled_ac_min_ratio": 0.60,  # 基底層材料再生 AC 使用比率 ≥ 60%
    "principle": "落實「刨用平衡」，機關負去化責任，不得於預算或契約編列折價要求廠商價購運回。",
    "self_design_supervision_law": "自辦工程回歸《技師法》第 13 條第 4 項由機關具技師證書人員辦理（刪除簽證規則第 7 條，免另委外簽證）",
    "occupational_safety_law": "規劃設計依《政府採購法》第 70 條之 1 繪製安全衛生圖說並於預算專章量化編列費用（不得僅以一式編列）",
    "evaluation_committee_law": "《政府採購法》第 94 條：評選委員 5 人以上（刪除 17 人上限），專家學者不得少於 1/3 且不得為政府機關現職人員（不含公立學校及公營事業現職人員），委員名單以公開為原則。",
}


# ============================================================================
# 2. 精算器 (一)：門檻與 GPA/招決標配對器
# ============================================================================

def calculate_procurement_thresholds(
    amount_twd: float,
    category: str = "engineering",          # "engineering" | "property" | "service"
    entity_type: str = "central",           # "central" | "local_tp_ks" | "local_4cities" | "local_other" | "other_entity" | "overseas"
     ministry_type: str = "other",           # "motc" | "moi_moea_moa" | "mnd_classified" | "other"
    is_urgent: bool = False,
    has_electronic_notice: bool = True,
    has_electronic_doc: bool = True,
    has_electronic_bid: bool = False,
    bid_times: int = 1,                     # 第幾次招標 (1=第一次, 2=第二次以後)
) -> Dict[str, Any]:
    """
    全方位核算：採購金額級距、專業人員門檻、公開閱覽新制(115.7.1)、
    GPA/ANZTEC/ASTEP適用性、法定等標期、基本設計審議門檻與招決標建議。
    """
    cat_map = {"engineering": "工程", "property": "財物", "service": "勞務"}
    cat_label = cat_map.get(category, "工程")

    sup_threshold = THRESHOLDS_TWD["supervision"].get(category, 50_000_000)
    large_threshold = THRESHOLDS_TWD["large_procurement"].get(category, 200_000_000)

    # 1. 級距判定
    if amount_twd <= THRESHOLDS_TWD["small_purchase_central"]:
        tier_code = "small"
        tier_name = "公告金額十分之一以下（中央機關小額採購 ≤ 15萬元）"
        tendering_rule = "依採購法第23條及中央機關未達公告金額採購招標辦法第5條，得不經公告程序，逕洽廠商採購（逾10萬元者宜先洽2家以上廠商估價或比價）。"
    elif amount_twd < THRESHOLDS_TWD["publication"]:
        tier_code = "under_pub"
        tier_name = "逾 15 萬元、未達公告金額（15萬 < 金額 < 150萬元）"
        tendering_rule = "依未達公告金額採購招標辦法第2條：公開取得3家以上廠商之書面報價或企劃書，擇符合需要者辦理比價或議價（得於公告載明未達3家當場改採限制性招標）。"
    elif amount_twd < sup_threshold:
        tier_code = "pub_to_sup"
        tier_name = f"公告金額以上、未達查核金額（150萬元 ≤ 金額 < {sup_threshold // 10_000:,}萬元）"
        tendering_rule = "依採購法第19條應辦理公開招標（第一次開標須3家以上合格廠商投標），或符合第20/21/22條採選擇性/限制性招標。"
    elif amount_twd < large_threshold:
        tier_code = "sup_to_large"
        tier_name = f"查核金額以上、未達巨額採購（{sup_threshold // 10_000:,}萬元 ≤ 金額 < {large_threshold // 10_000:,}萬元）"
        tendering_rule = "查核金額以上：應報請上級機關派員監辦（採購法第12條）；依115.7.1生效新制，工程/財物/勞務達查核金額以上皆應辦理招標文件公開閱覽。"
    else:
        tier_code = "large"
        tier_name = f"巨額採購（≥ {large_threshold // 10_000:,}萬元）"
        tendering_rule = "巨額採購：除報上級監辦及公開閱覽外，得訂定特定資格；工程達2億元以上應依採購法第11條之1成立5人以上「採購工作及審查小組」（外聘專家學者不得少於1/3）。"

    # 2. 採購專業人員門檻 (採購法第95條)
    spec_threshold = THRESHOLDS_TWD["specialist_overseas"] if entity_type == "overseas" else THRESHOLDS_TWD["specialist_domestic"]
    requires_specialist = amount_twd >= spec_threshold
    specialist_note = (
        f"達採購法第95條門檻（{'駐外機構300萬元' if entity_type == 'overseas' else '公告金額150萬元'}以上），應由取得採購專業人員基本或進階資格之人員承辦，其主管須具進階資格。"
        if requires_specialist
        else f"未達採購法第95條專業人員門檻（{'300萬元' if entity_type == 'overseas' else '150萬元'}）。"
    )

    # 3. 115.7.1 公開閱覽新制判定
    requires_public_inspection = amount_twd >= sup_threshold
    public_inspection_note = (
        f"【115.7.1新制強制公開閱覽】達{cat_label}查核金額（{sup_threshold // 10_000:,}萬元）以上，不論工程、財物或勞務，招標前應辦理招標文件公開閱覽至少 5 個工作天（全面電子化公開閱覽不得少於 5 日曆天），閱覽意見處理後始得公告招標。"
        if requires_public_inspection
        else f"未達{cat_label}查核金額（{sup_threshold // 10_000:,}萬元），法規未強制公開閱覽（特殊或高風險案件仍得自願辦理）。"
    )

    # 4. 國際條約協定判定 (WTO GPA / ANZTEC / ASTEP)
    gpa_threshold = None
    astep_threshold = None
    if category == "engineering":
        gpa_threshold = TREATY_THRESHOLDS["GPA_ANZTEC"]["engineering_all_twd"]
        astep_threshold = TREATY_THRESHOLDS["ASTEP"]["engineering_all_twd"]
    else:
        if entity_type == "central":
            gpa_threshold = TREATY_THRESHOLDS["GPA_ANZTEC"]["central_goods_services_twd"]
            astep_threshold = TREATY_THRESHOLDS["ASTEP"]["central_goods_services_twd"]
        elif entity_type == "local_tp_ks":
            gpa_threshold = TREATY_THRESHOLDS["GPA_ANZTEC"]["local_tp_ks_goods_services_twd"]
            astep_threshold = TREATY_THRESHOLDS["ASTEP"]["local_6cities_goods_services_twd"]
        elif entity_type == "local_4cities":
            gpa_threshold = None  # GPA/ANZTEC 僅含北高；四都僅適用 ASTEP
            astep_threshold = TREATY_THRESHOLDS["ASTEP"]["local_6cities_goods_services_twd"]
        elif entity_type == "other_entity":
            gpa_threshold = TREATY_THRESHOLDS["GPA_ANZTEC"]["other_entity_goods_services_twd"]
            astep_threshold = TREATY_THRESHOLDS["ASTEP"]["other_entity_goods_services_twd"]

    applies_gpa = gpa_threshold is not None and amount_twd >= gpa_threshold
    applies_astep = astep_threshold is not None and amount_twd >= astep_threshold
    applies_any_treaty = applies_gpa or applies_astep

    treaty_summary: List[str] = []
    if applies_gpa:
        treaty_summary.append(
            f"適用 WTO GPA 及 臺紐 ANZTEC（門檻 {gpa_threshold // 10_000:,} 萬元，1 SDR = {SDR_TO_TWD} 元）"
        )
    if applies_astep:
        treaty_summary.append(
            f"適用 臺星 ASTEP（門檻 {astep_threshold // 10_000:,} 萬元，1 SDR = {SDR_TO_TWD} 元）"
        )
    if not treaty_summary:
        treaty_summary.append("未達 GPA / ANZTEC / ASTEP 國際條約門檻（不適用條約協定，得限制外國廠商參與）")

    # 5. 法定等標期精算 (招標期限標準)
    if applies_any_treaty:
        base_days = 40
        reduction = 0
        reduction_reasons = []
        if has_electronic_notice:
            reduction += 5
            reduction_reasons.append("網路招標公告(-5日)")
        if has_electronic_doc:
            reduction += 5
            reduction_reasons.append("電子領標(-5日)")
        if has_electronic_bid:
            reduction += 5
            reduction_reasons.append("電子投標(-5日)")
        final_days = max(10, base_days - reduction)
        if is_urgent:
            final_days = max(10, min(final_days, 10))
            reduction_reasons.append("緊急採購特例縮短至不少於10日")
        bidding_period_detail = (
            f"GPA/條約標：原則 {base_days} 日曆天；"
            f"{'、'.join(reduction_reasons) if reduction_reasons else '無電子化縮減'} ➔ 法定最低等標期 {final_days} 日曆天（合併縮短後不得少於 10 日）。"
        )
    else:
        # 國內標等標期 (招標期限標準第2條)
        if amount_twd <= THRESHOLDS_TWD["small_purchase_central"]:
            base_days = 0
            final_days = 0
            bidding_period_detail = "小額採購（15萬元以下）：得免公告程序逕洽廠商，無固定等標期限制。"
        elif amount_twd < THRESHOLDS_TWD["publication"]:
            base_days = 5 if bid_times == 1 else 3
            reduction = 1 if has_electronic_doc else 0
            final_days = max(3, base_days - reduction)
            bidding_period_detail = f"未達公告金額公開取得：第{bid_times}次原則 {base_days} 日，電子領標縮減 {reduction} 日 ➔ 最低 {final_days} 日曆天。"
        elif amount_twd < sup_threshold:
            base_days = 14 if bid_times == 1 else 7
            reduction = (3 if has_electronic_doc else 0) + (2 if has_electronic_bid else 0)
            if bid_times > 1:
                reduction = min(reduction, 2)
            final_days = max(5, base_days - reduction)
            bidding_period_detail = f"公告金額以上未達查核金額：第{bid_times}次原則 {base_days} 日，電子領投標縮減後 ➔ 最低 {final_days} 日曆天。"
        elif amount_twd < large_threshold:
            base_days = 21 if bid_times == 1 else 7
            reduction = (3 if has_electronic_doc else 0) + (2 if has_electronic_bid else 0)
            if bid_times > 1:
                reduction = min(reduction, 2)
            final_days = max(5, base_days - reduction)
            bidding_period_detail = f"查核金額以上未達巨額：第{bid_times}次原則 {base_days} 日，電子領投標縮減後 ➔ 最低 {final_days} 日曆天。"
        else:
            base_days = 28 if bid_times == 1 else 7
            reduction = (3 if has_electronic_doc else 0) + (2 if has_electronic_bid else 0)
            if bid_times > 1:
                reduction = min(reduction, 2)
            final_days = max(5, base_days - reduction)
            bidding_period_detail = f"巨額採購：第{bid_times}次原則 {base_days} 日，電子領投標縮減後 ➔ 最低 {final_days} 日曆天。"

    # 6. 基本設計送工程會審議門檻 (僅工程適用)
    pcc_review_threshold = BASIC_DESIGN_PCC_REVIEW_THRESHOLDS.get(ministry_type, 100_000_000)
    requires_pcc_basic_design = category == "engineering" and amount_twd >= pcc_review_threshold
    requires_alt_scheme = category == "engineering" and amount_twd >= BASIC_DESIGN_PCC_REVIEW_THRESHOLDS["alternative_scheme_req"]

    return {
        "amount_twd": amount_twd,
        "category": category,
        "category_label": cat_label,
        "tier_code": tier_code,
        "tier_name": tier_name,
        "tendering_rule": tendering_rule,
        "requires_specialist": requires_specialist,
        "specialist_note": specialist_note,
        "requires_public_inspection": requires_public_inspection,
        "public_inspection_note": public_inspection_note,
        "applies_gpa": applies_gpa,
        "applies_astep": applies_astep,
        "applies_any_treaty": applies_any_treaty,
        "gpa_threshold_twd": gpa_threshold,
        "astep_threshold_twd": astep_threshold,
        "sdr_rate": SDR_TO_TWD,
        "treaty_summary": treaty_summary,
        "bidding_period_days": final_days,
        "bidding_period_detail": bidding_period_detail,
        "requires_work_review_group": category == "engineering" and amount_twd >= 200_000_000,
        "requires_pcc_basic_design": requires_pcc_basic_design,
        "pcc_review_threshold_twd": pcc_review_threshold,
        "requires_alternative_scheme": requires_alt_scheme,
        "evaluation_committee_rule": GREEN_ENGINEERING_NORMS["evaluation_committee_law"],
    }


# ============================================================================
# 3. 精算器 (二)：工程資格與三級品管核算器
# ============================================================================

def calculate_engineering_qualification_and_qc(
    budget_twd: float,
    building_height_m: float = 0.0,
    excavation_depth_m: float = 0.0,
    bridge_span_m: float = 0.0,
    is_road_work: bool = False,
) -> Dict[str, Any]:
    """
    核算：
    1. 最低可承攬營造業等級（含土木包工業 720 萬元新制、丙等 2,250 萬、乙等 7,500 萬、甲等資本額 10 倍）
    2. 巨額工程特定資格上限（實收資本額/權益 ≥ 預算 1/12，單次實績 ≤ 2/5 或累計實績 ≤ 預算）
    3. 三級品管配置門檻（150萬品質/監造計畫、2,000萬/5,000萬/2億品管人員與委外監造受訓合格專職現場人員人數）
    4. 114.12 再生 AC 強制比率（熱拌 ≥ 20%、基底層 ≥ 60%，刨用平衡）與採購法第 70-1 條職安衛規定
    """
    # 1. 營造業等級判定
    if (
        budget_twd <= CONTRACTOR_LIMITS["civil_contractor"]["limit_twd"]
        and building_height_m == 0
        and excavation_depth_m == 0
        and bridge_span_m <= 5.0
    ):
        min_contractor = CONTRACTOR_LIMITS["civil_contractor"]
        contractor_code = "civil_contractor"
        contractor_reason = "預算 ≤ 720 萬元且橋梁跨距 ≤ 5m、無超限建築/開挖，得由「土木包工業」或綜合營造業承攬（不可限綜合營造業以免不當限制競爭）。"
    elif (
        budget_twd <= CONTRACTOR_LIMITS["grade_c"]["limit_twd"]
        and building_height_m <= 21.0
        and excavation_depth_m <= 6.0
        and bridge_span_m <= 15.0
    ):
        min_contractor = CONTRACTOR_LIMITS["grade_c"]
        contractor_code = "grade_c"
        contractor_reason = "預算 ≤ 2,250 萬元且建高 ≤ 21m、開挖 ≤ 6m、橋梁 ≤ 15m，最低資格應訂為「丙等以上綜合營造業」。"
    elif (
        budget_twd <= CONTRACTOR_LIMITS["grade_b"]["limit_twd"]
        and building_height_m <= 36.0
        and excavation_depth_m <= 9.0
        and bridge_span_m <= 25.0
    ):
        min_contractor = CONTRACTOR_LIMITS["grade_b"]
        contractor_code = "grade_b"
        contractor_reason = "預算 ≤ 7,500 萬元且建高 ≤ 36m、開挖 ≤ 9m、橋梁 ≤ 25m，最低資格應訂為「乙等以上綜合營造業」。"
    else:
        min_contractor = CONTRACTOR_LIMITS["grade_a"]
        contractor_code = "grade_a"
        required_capital = math.ceil(budget_twd / 10.0)
        contractor_reason = (
            f"預算逾 7,500 萬元或工程規模逾乙等上限（建高>36m / 開挖>9m / 橋梁>25m），"
            f"須由「甲等綜合營造業」承攬，且其資本額須達承攬造價 1/10 以上（即 ≥ {required_capital:,} 元）。"
        )

    # 2. 特定資格上限精算 (巨額工程 ≥ 2 億元始得訂定)
    is_large_engineering = budget_twd >= 200_000_000
    specific_qualification = {
        "can_set_specific_qual": is_large_engineering,
        "max_paid_in_capital_or_equity_twd": round(budget_twd / 12.0) if is_large_engineering else 0,
        "max_single_experience_twd": round(budget_twd * 0.4) if is_large_engineering else 0,
        "max_cumulative_experience_twd": round(budget_twd) if is_large_engineering else 0,
        "legal_note": (
            f"巨額工程（≥2億元）得訂定特定資格：實收資本額或權益上限為預算之 1/12（{round(budget_twd / 12.0):,} 元）；"
            f"截止投標日前 5 年內單次契約金額上限為預算之 2/5（{round(budget_twd * 0.4):,} 元）或累計金額上限為預算金額（{round(budget_twd):,} 元）。"
            if is_large_engineering
            else "未達巨額工程（2億元），依法【不得】訂定特定資格（如實績、資本額1/12或權益門檻），否則構成違反資格標準之綁標缺失！"
        ),
    }

    # 3. 三級品管配置核算 (公共工程施工品質管理作業要點)
    requires_quality_plan = budget_twd >= 1_500_000
    if budget_twd >= 200_000_000:
        qc_personnel_min = 2
        qc_personnel_type = "專職品管人員至少 2 人（巨額工程 ≥ 2億元）"
        supervision_personnel_min = 2
        supervision_personnel_type = "委託監造應置受訓合格之專職現場人員至少 2 人（巨額工程 ≥ 2億元）"
    elif budget_twd >= 50_000_000:
        qc_personnel_min = 1
        qc_personnel_type = "專職品管人員至少 1 人（查核金額 5,000萬 ～ 未達 2億元，不得兼任其他職務）"
        supervision_personnel_min = 1
        supervision_personnel_type = "委託監造應置受訓合格之專職現場人員至少 1 人（查核金額 5,000萬 ～ 未達 2億元）"
    elif budget_twd >= 20_000_000:
        qc_personnel_min = 1
        qc_personnel_type = "品管人員至少 1 人（2,000萬 ～ 未達 5,000萬元，得為兼職）"
        supervision_personnel_min = 1
        supervision_personnel_type = "委託監造置現場人員至少 1 人（未達查核金額得非專職）"
    else:
        qc_personnel_min = 0
        qc_personnel_type = "未達 2,000 萬元，免專設品管人員（惟 ≥150萬元仍須提報品質計畫與監造計畫）"
        supervision_personnel_min = 0
        supervision_personnel_type = "未達 5,000 萬元免置專職監造現場人員（惟 ≥150萬元須提監造計畫）"

    # 4. 再生 AC 與工程永續/職安衛規範
    ac_norms = {
        "is_road_work": is_road_work,
        "hot_mix_recycled_ac_min_pct": 20,
        "base_layer_recycled_ac_min_pct": 60,
        "ac_balance_rule": GREEN_ENGINEERING_NORMS["principle"],
        "self_design_rule": GREEN_ENGINEERING_NORMS["self_design_supervision_law"],
        "osh_article_70_1": GREEN_ENGINEERING_NORMS["occupational_safety_law"],
    }

    return {
        "budget_twd": budget_twd,
        "contractor_code": contractor_code,
        "contractor_title": min_contractor["title"],
        "contractor_limit_twd": min_contractor["limit_twd"],
        "contractor_reason": contractor_reason,
        "specific_qualification": specific_qualification,
        "quality_control": {
            "requires_quality_and_supervision_plan": requires_quality_plan,
            "plan_threshold_note": "達公告金額（150萬元）以上，廠商須提品質計畫、監造單位須提監造計畫。" if requires_quality_plan else "未達150萬元。",
            "qc_personnel_min": qc_personnel_min,
            "qc_personnel_type": qc_personnel_type,
            "supervision_personnel_min": supervision_personnel_min,
            "supervision_personnel_type": supervision_personnel_type,
        },
        "green_and_osh_norms": ac_norms,
    }


# ============================================================================
# 4. 精算器 (三)：物價指數三層級 (10%/5%/2.5%) 與實作數量 (3%/30%) 結算精算器
# ============================================================================

def calculate_price_index_and_settlement(
    # 物價指數參數
    current_valuation_amount: float = 10_000_000,
    individual_index_change_pct: float = 0.0,     # 個別項目指數漲跌幅 (%)，門檻 ±10%
    individual_item_weight_amount: float = 0.0,   # 該個別項目佔估驗計價金額
    category_index_change_pct: float = 0.0,       # 中分類項目指數漲跌幅 (%)，門檻 ±5%
    category_item_weight_amount: float = 0.0,     # 該中分類項目佔估驗計價金額
    general_index_change_pct: float = 0.0,        # 營造工程物價總指數漲跌幅 (%)，門檻 ±2.5%
    tax_rate: float = 0.05,                       # 營業稅率 5%
    deduct_advance_payment_ratio: float = 0.0,    # 預付款扣減比例 (如 0.20)
    # 實作數量結算參數 (契約範本第3條)
    contract_item_qty: float = 1000.0,
    actual_item_qty: float = 1350.0,
    contract_unit_price: float = 1000.0,
    negotiated_excess_unit_price: Optional[float] = None,
) -> Dict[str, Any]:
    """
    1. 工程會契約範本物價指數調整三層級核算（個別項目 ±10%、中分類 ±5%、總指數 ±2.5%），
       僅就超過門檻部分計算物調款，並扣除預付款比例與乘計(1+營業稅)。
    2. 契約範本第3條「總價結算之個別項目實作數量增減」核算：
       - 增減在 ±3% 以內：不予增減契約價金
       - 增減逾 ±3% 至 ±30% 部分：依「原契約單價」計算增減
       - 增減逾 ±30% 部分：就「超過 30% 之部分」由雙方協議合理調整單價
    3. 採購法第 73 條之 1 審核與付款期限規範（15個實際工作日 / 補助款30日 / 一次通知補正）。
    """
    def _calc_tier_adj(amount: float, change_pct: float, threshold_pct: float) -> Dict[str, Any]:
        abs_change = abs(change_pct)
        if abs_change <= threshold_pct or amount <= 0:
            return {
                "triggered": False,
                "change_pct": change_pct,
                "threshold_pct": threshold_pct,
                "excess_pct": 0.0,
                "adjustment_twd": 0,
            }
        sign = 1.0 if change_pct > 0 else -1.0
        excess_pct = sign * (abs_change - threshold_pct)
        # 扣除預付款比例，並加計營業稅 (工程會範本標準精神)
        effective_ratio = 1.0 - max(0.0, min(1.0, deduct_advance_payment_ratio))
        adj = round(amount * (excess_pct / 100.0) * effective_ratio * (1.0 + tax_rate))
        return {
            "triggered": True,
            "change_pct": change_pct,
            "threshold_pct": threshold_pct,
            "excess_pct": round(excess_pct, 4),
            "adjustment_twd": adj,
        }

    tier1 = _calc_tier_adj(individual_item_weight_amount, individual_index_change_pct, 10.0)
    tier2 = _calc_tier_adj(category_item_weight_amount, category_index_change_pct, 5.0)
    remaining_general_amount = max(
        0.0,
        current_valuation_amount - individual_item_weight_amount - category_item_weight_amount,
    )
    tier3 = _calc_tier_adj(remaining_general_amount, general_index_change_pct, 2.5)
    total_price_escalation_twd = tier1["adjustment_twd"] + tier2["adjustment_twd"] + tier3["adjustment_twd"]

    # 實作數量結算精算 (契約範本第3條)
    qty_diff = actual_item_qty - contract_item_qty
    qty_diff_pct = (qty_diff / contract_item_qty * 100.0) if contract_item_qty > 0 else 0.0
    abs_diff_pct = abs(qty_diff_pct)
    sign_qty = 1.0 if qty_diff >= 0 else -1.0

    threshold_3_qty = contract_item_qty * 0.03
    threshold_30_qty = contract_item_qty * 0.30
    abs_diff_qty = abs(qty_diff)

    if abs_diff_pct <= 3.0:
        band_within_3_qty = abs_diff_qty
        band_3_to_30_qty = 0.0
        band_over_30_qty = 0.0
        settlement_rule = "實作數量增減未逾契約數量 ±3%：依契約範本第3條，契約價金不予增減。"
    elif abs_diff_pct <= 30.0:
        band_within_3_qty = threshold_3_qty
        band_3_to_30_qty = abs_diff_qty - threshold_3_qty
        band_over_30_qty = 0.0
        settlement_rule = "實作數量增減逾 ±3% 但未逾 ±30%：就超過 3% 部分，依「原契約單價」辦理契約價金增減。"
    else:
        band_within_3_qty = threshold_3_qty
        band_3_to_30_qty = threshold_30_qty - threshold_3_qty  # 即 27% 的數量
        band_over_30_qty = abs_diff_qty - threshold_30_qty
        settlement_rule = "實作數量增減逾 ±30%：逾 3% 至 30% 部分依原契約單價增減；逾 30% 之部分，得依契約範本第3條檢討合理調整單價！"

    eff_excess_price = negotiated_excess_unit_price if negotiated_excess_unit_price is not None else contract_unit_price
    adj_3_to_30_twd = round(sign_qty * band_3_to_30_qty * contract_unit_price)
    adj_over_30_twd = round(sign_qty * band_over_30_qty * eff_excess_price)
    total_qty_settlement_diff_twd = adj_3_to_30_twd + adj_over_30_twd
    original_item_total_twd = round(contract_item_qty * contract_unit_price)
    final_item_settlement_twd = original_item_total_twd + total_qty_settlement_diff_twd

    return {
        "price_escalation": {
            "tier1_individual_10pct": tier1,
            "tier2_category_5pct": tier2,
            "tier3_general_2_5pct": tier3,
            "remaining_general_amount": remaining_general_amount,
            "total_price_escalation_twd": total_price_escalation_twd,
        },
        "quantity_settlement": {
            "contract_item_qty": contract_item_qty,
            "actual_item_qty": actual_item_qty,
            "qty_diff": round(qty_diff, 4),
            "qty_diff_pct": round(qty_diff_pct, 2),
            "band_within_3_qty": round(band_within_3_qty, 4),
            "band_3_to_30_qty": round(band_3_to_30_qty, 4),
            "band_over_30_qty": round(band_over_30_qty, 4),
            "adj_3_to_30_twd": adj_3_to_30_twd,
            "adj_over_30_twd": adj_over_30_twd,
            "total_qty_settlement_diff_twd": total_qty_settlement_diff_twd,
            "original_item_total_twd": original_item_total_twd,
            "final_item_settlement_twd": final_item_settlement_twd,
            "settlement_rule": settlement_rule,
        },
        "payment_deadline_article_73_1": {
            "review_days": 15,
            "payment_days": 15,
            "subsidy_payment_days": 30,
            "rule": "採購法第73條之1：接到廠商請款單據後，審核程序及付款期限各不得超過 15 個實際工作日（向上級機關申請核撥補助款者為 30 個工作日）；文件不符或需補正者，應「一次通知」廠商補正，不得分次刁難。",
        },
    }


# ============================================================================
# 5. 精算器 (四)：契約變更累計金額 (|加帳|+|減帳|) 與第 58 條偏低標決策樹
# ============================================================================

def calculate_contract_change_and_art58(
    # 契約變更參數
    original_contract_amount_twd: float = 40_000_000,
    addition_amount_twd: float = 8_000_000,       # 加帳金額 (正值)
    deduction_amount_twd: float = 4_000_000,      # 減帳金額 (可傳正或負，取絕對值)
    previous_cumulative_change_twd: float = 0.0,  # 前次已累計之契約變更金額
    category: str = "engineering",
    # 第 58 條總標價偏低參數
    government_estimate_twd: float = 50_000_000,  # 底價
    lowest_bid_twd: float = 33_000_000,           # 最低標總標價
    agency_deems_reasonable: bool = False,        # 機關審酌廠商說明後是否認為合理
) -> Dict[str, Any]:
    """
    1. 採購契約變更或加減價核准監辦備查規定一覽表：
       - 契約變更累計金額 = |加帳金額| + |減帳金額|（加減帳絕對值合併計算，不得相抵！）
       - 檢核採購法第22條第1項第6款（原契約目的範圍內追加契約金額 ≤ 原主契約金額 50%）
       - 檢核是否達公告金額（150萬元）須傳輸決標公告/彙送、是否達查核金額須報上級機關補具文件備查。
    2. 採購法第 58 條「依總標價態樣隨即執行程序」決策樹：
       - ≥ 底價 80%：非第58條總標價偏低，正常決標。
       - 70% ≤ 標價 < 80% 底價：
         (a) 機關認為無顯不合理 ➔ 照價決標。
         (b) 機關認為顯不合理，有降低品質之虞 ➔ 限期通知廠商提出說明 ➔ 合理則照價決標；可提出差額保證金（底價×80% - 總標價）後決標。
       - 標價 < 底價 70%：
         (a) 限期通知廠商提出說明；
         (b) 說明合理 ➔ 無需通知提差額保證金，照價決標；
         (c) 說明尚非完全合理，但廠商願意提出差額保證金（底價×80% - 總標價，不得低於底價×80%減標價）➔ 繳交後決標；
         (d) 說明顯不合理或未提出說明，且有降低品質不能誠信履約之虞 ➔ 不決標予該廠商，並以次低標廠商為最低標廠商（不得既認顯不合理又收差額保證金決標！）。
    """
    abs_add = abs(addition_amount_twd)
    abs_ded = abs(deduction_amount_twd)
    current_change_abs_sum = abs_add + abs_ded
    net_change = abs_add - abs_ded
    new_contract_total = original_contract_amount_twd + net_change
    total_cumulative_change_abs = previous_cumulative_change_twd + current_change_abs_sum

    sup_threshold = THRESHOLDS_TWD["supervision"].get(category, 50_000_000)

    # 第22條第1項第6款 50% 追加上限檢核 (僅針對工程及勞務之加帳累計)
    addition_pct_of_original = (abs_add / original_contract_amount_twd * 100.0) if original_contract_amount_twd > 0 else 0.0
    exceeds_art22_1_6_limit = category in ("engineering", "service") and addition_pct_of_original > 50.0

    if total_cumulative_change_abs >= sup_threshold:
        change_supervision_rule = (
            f"契約變更累計金額（|加帳|+|減帳| = {total_cumulative_change_abs:,.0f} 元）已達查核金額（{sup_threshold // 10_000:,}萬元）以上："
            "應報請上級機關派員監辦，並於決標日起 30 日內補具文件送上級機關備查，且須刊登決標公告。"
        )
    elif current_change_abs_sum >= THRESHOLDS_TWD["publication"] or total_cumulative_change_abs >= THRESHOLDS_TWD["publication"]:
        change_supervision_rule = (
            f"契約變更累計金額（|加帳|+|減帳| = {total_cumulative_change_abs:,.0f} 元）達公告金額（150萬元）以上、未達查核金額："
            "由機關主（會）計及有關單位監辦，自決標日起 30 日內刊登決標公告。"
        )
    else:
        change_supervision_rule = (
            f"契約變更累計金額（|加帳|+|減帳| = {total_cumulative_change_abs:,.0f} 元）未達公告金額（150萬元）："
            "依未達公告金額監辦規定辦理，定期彙送決標資料。"
        )

    # 第 58 條偏低標決策樹
    ratio_pct = (lowest_bid_twd / government_estimate_twd * 100.0) if government_estimate_twd > 0 else 100.0
    threshold_80 = round(government_estimate_twd * 0.80)
    threshold_70 = round(government_estimate_twd * 0.70)
    bond_diff_amount = max(0, threshold_80 - round(lowest_bid_twd))

    if lowest_bid_twd > government_estimate_twd:
        art58_band = "over_estimate"
        art58_title = "超底價（> 100% 底價，適用採購法第53條減價程序，非第58條）"
        art58_action = "請依採購法第53條通知最低標廠商優先減價1次，仍超底價則由全體合於招標文件規定之投標廠商比減價格（不得逾3次）。"
    elif ratio_pct >= 80.0:
        art58_band = "normal_gte_80"
        art58_title = f"總標價 ≥ 底價 80%（標價佔底價 {ratio_pct:.2f}%）"
        art58_action = "非屬總標價偏低案件（除有部分標價偏低之特殊情形外），機關無須啟動第58條程序，逕行決標。"
        bond_diff_amount = 0
    elif ratio_pct >= 70.0:
        art58_band = "between_70_and_80"
        art58_title = f"總標價介於底價 70% ～ 80% 之間（標價佔底價 {ratio_pct:.2f}%）"
        if agency_deems_reasonable:
            art58_action = "機關審酌認為無顯不合理、無降低品質不能誠信履約之虞（或廠商說明合理）➔ 無須繳納差額保證金，照價決標。"
        else:
            art58_action = (
                f"機關認為顯不合理，有降低品質、不能誠信履約之虞 ➔ 應限期（例如5日內）通知廠商提出說明；"
                f"廠商說明合理則照價決標，或通知廠商於限期內提出差額保證金 新臺幣 {bond_diff_amount:,} 元（底價80% {threshold_80:,} 元 － 標價 {round(lowest_bid_twd):,} 元）後決標。"
            )
    else:
        art58_band = "under_70"
        art58_title = f"總標價低於底價 70%（標價佔底價 {ratio_pct:.2f}% < 70%，高風險偏低標）"
        if agency_deems_reasonable:
            art58_action = "經限期通知廠商提出說明，機關審認其說明合理 ➔ 無須通知廠商提出差額保證金，照價決標。"
        else:
            art58_action = (
                f"【第58條執行程序四重點】總標價低於底價70%：\n"
                f"1. 限期通知廠商提出書面說明。\n"
                f"2. 若廠商說明「尚非完全合理」但無不能誠信履約之虞，通知廠商繳納差額保證金 {bond_diff_amount:,} 元（底價80% {threshold_80:,} 元 － 標價 {round(lowest_bid_twd):,} 元）後決標。\n"
                f"3. 若廠商「未於期限內提出說明」或「說明顯不合理，有降低品質、不能誠信履約之虞」➔ 應【不決標予該廠商】，並以次低標廠商為最低標廠商（嚴禁既認顯不合理卻仍收差額保證金決標！）。"
            )

    return {
        "contract_change": {
            "original_contract_amount_twd": original_contract_amount_twd,
            "addition_amount_twd": abs_add,
            "deduction_amount_twd": abs_ded,
            "current_change_abs_sum_twd": current_change_abs_sum,
            "net_change_twd": net_change,
            "new_contract_total_twd": new_contract_total,
            "total_cumulative_change_abs_twd": total_cumulative_change_abs,
            "addition_pct_of_original": round(addition_pct_of_original, 2),
            "exceeds_art22_1_6_limit": exceeds_art22_1_6_limit,
            "art22_1_6_note": (
                f"⚠️ 警告：本次追加金額佔原主契約金額 {addition_pct_of_original:.1f}%，已逾採購法第22條第1項第6款「原主契約金額50%」法定上限！不得依該款採限制性招標追加！"
                if exceeds_art22_1_6_limit
                else f"追加金額佔原主契約金額 {addition_pct_of_original:.1f}%（符合採購法第22條第1項第6款 ≤ 50% 規定，惟仍須為原招標目的範圍內且因未能預見之情形）。"
            ),
            "change_supervision_rule": change_supervision_rule,
        },
        "article_58_decision": {
            "government_estimate_twd": government_estimate_twd,
            "lowest_bid_twd": lowest_bid_twd,
            "ratio_pct": round(ratio_pct, 2),
            "threshold_80_twd": threshold_80,
            "threshold_70_twd": threshold_70,
            "bond_diff_amount_twd": bond_diff_amount,
            "art58_band": art58_band,
            "art58_title": art58_title,
            "art58_action": art58_action,
        },
    }


# ============================================================================
# 6. 階段三：第 50 條重大異常關聯 ＆ 第 101/103 條停權處分檢核器
# ============================================================================

def evaluate_bid_rigging_and_debarment(
    # 第 50 條異常關聯勾選特徵
    anomalies: List[str],
    # 第 101/103 條停權參數
    violation_clause: str = "101_1_12",   # e.g. "101_1_1" ~ "101_1_15"
    prior_debarment_count_in_5yrs: int = 0,
    gave_10day_statement_notice: bool = True,
    reviewed_by_work_group_with_external: bool = True,
    months_since_violation_or_breach: int = 12,
) -> Dict[str, Any]:
    """
    1. 檢核工程會 09500256920 號令（重大異常關聯）及 09700060670 號令（電子投標 IP 相同）圍標特徵。
    2. 檢核採購法第 101 條、第 103 條停權處分法定程序：
       - 書面通知廠商於 10 日內陳述意見（第101條第3項）
       - 成立「採購工作及審查小組」（外聘專家學者不得少於 1/3）認定是否該當且無情節不重大（第101條第3、4項）
       - 停權期間：
         * 第1~5、15款（借牌/圍標/偽造/破產/行賄）：刊登公報次日起 3 年（或判決撤銷/無罪）
         * 第6款（犯第87~91條之罪經判刑）：有期徒刑以上 3 年；拘役/罰金/緩刑 1 年
         * 第7~14款（可歸責解除契約/驗收不符/保固不履/歧視/違反勞基法）：5年內第1次 3 個月、第2次 6 個月、第3次以上 1 年（階梯式累計加重）
       - 裁處權時效：行政罰法第 27 條第 1 項 3 年裁處權時效（押標金追繳為行政程序法第 131 條 5 年公法上請求權時效）。
    """
    anomaly_catalog = {
        "serial_registered_mail": "投標文件由同一處郵局交寄且掛號信連號（09500256920號令第1點）",
        "serial_bank_checks": "押標金由同一銀行開具且支票連號，或由同一帳戶匯出（09500256920號令第2點）",
        "same_handwriting_or_typo": "不同投標廠商投標文件筆跡相同、標單異常一致或共同出現相同錯別字/漏項（09500256920號令第1點）",
        "same_contact_address_phone": "不同投標廠商負責人、聯絡人、電話、傳真或地址相同（09500256920號令第3點）",
        "same_ip_electronic_bid": "電子領標或電子投標之 IP 位址相同（09700060670號令）",
        "escort_bid_invalid_docs": "陪標廠商故意不附押標金或資格文件明顯缺漏致無效標（假性競爭）",
    }

    matched_anomalies = [anomaly_catalog.get(a, a) for a in anomalies]
    has_rigging_risk = len(matched_anomalies) > 0

    # 第101條各款停權期間精算 (108年修法新制)
    three_year_clauses = {
        "101_1_1": "第101條第1項第1款：容許他人借用本人名義或證件參加投標者",
        "101_1_2": "第101條第1項第2款：借用或冒用他人名義或證件投標者",
        "101_1_3": "第101條第1項第3款：擅自減省工料，情節重大者",
        "101_1_4": "第101條第1項第4款：以虛偽不實之文件投標、訂約或履約，情節重大者",
        "101_1_5": "第101條第1項第5款：受停業處分期間仍參加投標者",
        "101_1_15": "第101條第1項第15款：對採購有關人員行求、期約或交付不正利益者",
    }
    progressive_clauses = {
        "101_1_7": "第101條第1項第7款：得標後無正當理由而不訂約者",
        "101_1_8": "第101條第1項第8款：查驗或驗收不合格，情節重大者",
        "101_1_9": "第101條第1項第9款：驗收後不履行保固責任，情節重大者",
        "101_1_10": "第101條第1項第10款：因可歸責於廠商之事由，致延誤履約期限，情節重大者",
        "101_1_11": "第101條第1項第11款：違反第65條規定轉包者",
        "101_1_12": "第101條第1項第12款：因可歸責於廠商之事由，致解除或終止契約，情節重大者",
        "101_1_13": "第101條第1項第13款：破產程序中之廠商",
        "101_1_14": "第101條第1項第14款：歧視性別、原住民、身心障礙或違反勞工法令情節重大者",
    }

    if violation_clause in three_year_clauses:
        clause_title = three_year_clauses[violation_clause]
        debarment_duration = "3 年（採購法第103條第1項第1款）"
        proportionality_req = violation_clause in ("101_1_3", "101_1_4")
    elif violation_clause == "101_1_6":
        clause_title = "第101條第1項第6款：犯第87條至第92條之罪，經第一審為有罪判決者"
        debarment_duration = "判處有期徒刑以上者停權 3 年；判處拘役、罰金或緩刑者停權 1 年（第103條第1項第1、2款）"
        proportionality_req = False
    else:
        clause_title = progressive_clauses.get(violation_clause, progressive_clauses["101_1_12"])
        proportionality_req = True
        occurrence_no = prior_debarment_count_in_5yrs + 1
        if occurrence_no == 1:
            debarment_duration = "3 個月（第103條第1項第3款：5年內第1次刊登）"
        elif occurrence_no == 2:
            debarment_duration = "6 個月（第103條第1項第3款：5年內第2次刊登，累計加重）"
        else:
            debarment_duration = f"1 年（第103條第1項第3款：5年內第{occurrence_no}次刊登，最高加重至1年）"

    # 程序正義與裁處權時效檢核
    procedural_defects: List[str] = []
    if not gave_10day_statement_notice:
        procedural_defects.append(
            "❌ 違反採購法第101條第3項：未於通知前給予廠商「10日以上」口頭或書面陳述意見之機會（重大程序瑕疵，異議/申訴必遭撤銷）！"
        )
    if proportionality_req and not reviewed_by_work_group_with_external:
        procedural_defects.append(
            "❌ 違反採購法第101條第3、4項：適用「情節重大」各款時，未成立「採購工作及審查小組」（委員5人以上、外聘專家學者不得少於1/3）進行比例原則認定！"
        )

    is_time_barred_debarment = months_since_violation_or_breach > 36
    is_time_barred_bid_bond = months_since_violation_or_breach > 60
    if is_time_barred_debarment:
        procedural_defects.append(
            f"❌ 逾越《行政罰法》第27條第1項「3年（36個月）裁處權時效」（目前已歷時 {months_since_violation_or_breach} 個月），不得再為第101條停權通知！"
        )

    return {
        "article_50_check": {
            "has_rigging_risk": has_rigging_risk,
            "matched_anomalies": matched_anomalies,
            "legal_basis": [
                "採購法第50條第1項第5款：不同投標廠商間之投標文件內容有重大異常關聯者",
                "工程會95年7月25日工程企字第09500256920號令（重大異常關聯4大認定態樣）",
                "工程會97年2月14日工程企字第09700060670號令（電子領投標IP相同異常關聯）",
                "採購法第31條第2項第7款：不予發還或追繳押標金（追繳時效依第31條第4項自不予開標/決標日起算 5 年）",
            ],
            "recommended_action": (
                "應依採購法第50條第1項第5款不予開標或不予決標；已決標者撤銷決標、終止或解除契約，依第31條第2項沒收/追繳押標金（5年時效），並移送檢調偵辦第87條圍標罪及啟動第101條停權程序。"
                if has_rigging_risk
                else "尚未勾選明顯第50條重大異常關聯特徵。"
            ),
        },
        "article_101_103_check": {
            "violation_clause": violation_clause,
            "clause_title": clause_title,
            "debarment_duration": debarment_duration,
            "proportionality_req": proportionality_req,
            "gave_10day_statement_notice": gave_10day_statement_notice,
            "reviewed_by_work_group_with_external": reviewed_by_work_group_with_external,
            "months_since_violation": months_since_violation_or_breach,
            "is_time_barred_debarment_3yr": is_time_barred_debarment,
            "is_time_barred_bid_bond_5yr": is_time_barred_bid_bond,
            "procedural_defects": procedural_defects,
            "is_procedurally_valid": len(procedural_defects) == 0,
        },
    }


# ============================================================================
# 7. 階段三：刑事/行政/民事三維法律責任剖析器
# ============================================================================

def analyze_three_dimensional_liability(
    scenario_type: str = "spec_tailoring",  # "spec_tailoring" | "false_acceptance" | "bid_rigging_leak" | "design_negligence" | "admin_discretion"
    actor_role: str = "civil_servant",      # "civil_servant" | "commissioned_architect" | "evaluation_committee" | "supplier"
    has_corrupt_intent: bool = False,
    has_illegal_gain: bool = False,
    kickback_or_inflation_flag: bool = False,
    damage_amount_twd: float = 5_000_000,
) -> Dict[str, Any]:
    """
    針對採購當事人（公務員、受託設計監造技師/建築師、評選委員、廠商）進行：
    1. 刑事責任（貪污治罪條例第4條第1項第3款經辦公用工程舞弊罪、第6條第1項第4款圖利罪、
       刑法第132條洩密罪、第213/214/215條登載不實罪、採購法第87~92條圍標/綁標/洩密罪）
    2. 行政責任（採購人員倫理準則第7~12條、公務員懲戒法、技師法懲戒、採購法第101~103條停權、第31條押標金追繳）
    3. 民事責任（民法第184/227/495條侵權與不完全給付損害賠償、採購法第59條利益所得扣減、第72條減價收受、連帶保證）
    4. 圖利罪與合法行政裁量之界線區辨（明知違背法令 vs 裁量權正當行使）
    """
    criminal_liabilities: List[Dict[str, str]] = []
    admin_liabilities: List[Dict[str, str]] = []
    civil_liabilities: List[Dict[str, str]] = []

    # 身分認定（刑法第10條第2項授權公務員/委託公務員）
    if actor_role == "civil_servant":
        identity_status = "刑法第10條第2項第1款「身分公務員」（依法令服務於國家、地方自治團體所屬機關而具有法定職務權限）"
    elif actor_role == "evaluation_committee":
        identity_status = "刑法第10條第2項第1款後段「授權公務員」（依政府採購法規定行使評選公權力之採購評選委員，於評選職務範圍內具公務員身分）"
    elif actor_role == "commissioned_architect":
        identity_status = "原則上屬私法委任關係之專門職業人員（受機關委託辦理規劃設計監造，最高法院實務見解認一般技服監造非行使公權力之委託公務員；惟若涉及採購法第88條受託專案管理/設計監造人員綁標罪，直接負特別刑事責任！）"
    else:
        identity_status = "投標/得標廠商及其負責人、受雇人（若與公務員共犯貪污治罪條例之罪，依貪污治罪條例第3條亦以共犯論處；另負採購法第87條及第92條兩罰規定責任）"

    # 刑事責任分析
    if kickback_or_inflation_flag:
        criminal_liabilities.append({
            "law": "《貪污治罪條例》第 4 條第 1 項第 3 款（建築或經辦公用工程或購辦公用器材、物品，浮報價額、數量、收取回扣或有其他舞弊情事者）",
            "penalty": "處無期徒刑或 10 年以上有期徒刑，得併科新臺幣 1 億元以下罰金",
            "analysis": "屬重度貪污犯罪。凡於經辦公用工程或採購過程中，有浮報預算/結算數量、收取廠商回扣、驗收放水配合舞弊領款等行為，即構成經辦公用工程舞弊罪。",
        })

    if has_corrupt_intent and has_illegal_gain:
        criminal_liabilities.append({
            "law": "《貪污治罪條例》第 6 條第 1 項第 4 款（對於主管或監督之事務，明知違背法令，直接或間接圖自己或其他私人不法利益，因而獲得利益者）",
            "penalty": "處 5 年以上有期徒刑，得併科新臺幣 3,000 萬元以下罰金（圖利罪以「結果犯」為限，不罰未遂）",
            "analysis": "90年及98年修法要件：(1)明知違背法令（包含法律、法律授權之法規命令、自治條例及具裁量基準性質之行政規則）、(2)圖自己或私人不法利益之直接故意、(3)因而獲得不法利益（結果犯）。",
        })
    else:
        criminal_liabilities.append({
            "law": "《貪污治罪條例》第 6 條第 1 項第 4 款【圖利罪 vs 行政裁量區辨結論：不構成圖利罪】",
            "penalty": "無刑事圖利罪責（屬行政作業疏失或合法行政裁量範疇）",
            "analysis": "依最高法院及工程會實務見解：若公務員係基於公共利益考量、在法令授權裁量範圍內作成決定（如採購法第26條功能效益需求、第72條減價收受裁量），欠缺「明知違背法令」之主觀犯意或廠商僅取得合法履行契約之相當對價（無不法利益），應嚴格區辨「行政疏失/行政裁量」與「圖利犯罪」，不構成圖利罪。",
        })

    if scenario_type == "spec_tailoring":
        criminal_liabilities.append({
            "law": "《政府採購法》第 88 條第 1 項（受機關委託提供採購規劃、設計、審查、監造、專案管理或代辦採購廠商之人員，意圖為私人不法之利益，對技術、工法、材料、設備或規格，為違反法令之限制或審查，因而獲得利益者）",
            "penalty": "處 1 年以上 7 年以下有期徒刑，得併科新臺幣 300 萬元以下罰金（對廠商資格為違反法令之限制或審查者亦同；未遂犯罰之）",
            "analysis": "專為受託設計監造/PCM人員量身訂定之「綁標罪」，縱不具刑法公務員身分，違法指定特定品牌/尺寸規格且無「或同等品」字樣並圖私人不法利益者，直接依採購法第88條論處。",
        })
    elif scenario_type == "false_acceptance":
        criminal_liabilities.append({
            "law": "《刑法》第 213 條（公文書不實登載罪）＆ 第 215 條（業務上文書登載不實罪）",
            "penalty": "公務員處 1 年以上 7 年以下有期徒刑；從事業務之人（技師/監造）處 3 年以下有期徒刑",
            "analysis": "明知工程未完工或抽驗尺寸/強度不符契約規定，卻於監造報表、估驗計價單或驗收紀錄上登載「合格/與契約相符」並簽章，成立公文書或業務上文書不實登載罪。",
        })
    elif scenario_type == "bid_rigging_leak":
        criminal_liabilities.append({
            "law": "《政府採購法》第 87 條第 3~6 項（詐術圍標罪、合意圍標罪、借牌投標罪）＆ 第 89 條 /《刑法》第 132 條（洩漏國防以外秘密罪）",
            "penalty": "圍標/借牌處 5 年以下或 3 年以下有期徒刑；洩漏底價/領標家數/評選委員名單處 3 年以下有期徒刑（過失洩密處 1 年以下）",
            "analysis": "開標前洩漏底價、應秘密之預算明細、領投標廠商名稱或家數、未公開之評選委員名單，構成刑法第132條洩密罪（過失亦罰！）。廠商合意不為價格競爭或借用牌照投標構成採購法第87條第4、5項。",
        })

    # 行政責任分析
    admin_liabilities.extend([
        {
            "law": "《採購人員倫理準則》第 7 條、第 12 條 ＆《公務員考績法》/《公務員懲戒法》",
            "penalty": "申誡、記過、記大過，情節重大移送懲戒法院（撤職、休職、降級、減俸、罰款）",
            "analysis": "違反採購人員倫理準則第7條各款（如第3款不依法令規定辦理採購、第6款未公正辦理採購、第7款洩漏應保守秘密之採購資訊、第8款接受與職務有關廠商之餽贈或飲宴應酬）。",
        },
        {
            "law": "《政府採購法》第 101 條、第 103 條（不良廠商停權處分）＆ 第 31 條第 2 項（押標金不予發還/追繳）",
            "penalty": "刊登政府採購公報停權 3 個月 / 6 個月 / 1 年 / 3 年；追繳押標金（5年時效）",
            "analysis": "廠商涉犯借牌、圍標、偽造文書、減省工料或違約情節重大，應踐行10日陳述意見及採購工作及審查小組程序後刊登公報。",
        },
        {
            "law": "《技師法》第 19 條、第 39~41 條 ＆《建築師法》第 46 條（專門職業人員懲戒）",
            "penalty": "警告、申誡、停止業務（2個月至2年）或廢止執業執照/證書",
            "analysis": "設計監造技師或建築師違反法令或簽證不實，移送工程會技師懲戒委員會或主管機關懲戒。",
        },
    ])

    # 民事責任分析
    civil_liabilities.extend([
        {
            "law": "《民法》第 184 條（侵權行為）、第 227 條（不完全給付）、第 493~495 條（承攬瑕疵擔保與損害賠償）",
            "penalty": f"連帶負損害賠償責任（本案預估損害/扣款標的約 新臺幣 {damage_amount_twd:,.0f} 元）",
            "analysis": "因設計錯誤、監造不實或施工偷工減料致機關受有損害（如道路坍塌、結構補強或重作費用），機關得依契約及民法向施工廠商及設計監造單位請求損害賠償，並得不發還履約/保固保證金。",
        },
        {
            "law": "《政府採購法》第 59 條第 2 項（不正利益扣減或追償）＆ 第 72 條第 2 項（減價收受與懲罰性違約金）",
            "penalty": "將不正利益自契約價款中扣除；減價收受並處減價金額 1 倍至數倍之懲罰性違約金",
            "analysis": "廠商以支付他人佣金、比例金、仲介費、後謝金或其他不正利益促成採購契約成立者，機關得終止或解除契約，或將二倍之不正利益自契約價款中扣除（第59條）。",
        },
    ])

    return {
        "scenario_type": scenario_type,
        "actor_role": actor_role,
        "identity_status": identity_status,
        "criminal_liabilities": criminal_liabilities,
        "admin_liabilities": admin_liabilities,
        "civil_liabilities": civil_liabilities,
        "discretion_vs_corruption_guide": {
            "core_distinction": "《貪污治罪條例》第6條第1項第4款「圖利罪」之成立，必須同時具備：(1)明知違背法令（直接故意）、(2)圖私人不法利益、(3)因而獲得利益（結果犯）。若採購人員係本於專業判斷、於法令授權裁量範圍內為解決工程介面或民生急迫需求所為之決定，縱程序有微疵，亦屬行政疏失而非刑事圖利罪！",
            "safe_harbor_steps": [
                "1. 善用採購法第 11 條之 1「採購工作及審查小組」協助審查需求、經費、規格與契約變更合理性（集體決策透明化）。",
                "2. 規格訂定落實採購法第 26 條及執行注意事項：國際標準/國家標準優先，無法以精確文字說明始列參考廠牌並強制加註「或同等品」。",
                "3. 履約爭議善用採購法第 85 條之 1 工程會履約爭議調解、申訴審議或仲裁機制，避免私下無據免除廠商違約金。",
            ],
        },
    }

