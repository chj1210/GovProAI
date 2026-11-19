# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - LangGraph 多代理調度引擎 (Multi-Agent StateGraph)
支援零外部網路依賴之本地端確定性推理，輸出完整「LangGraph Agent 調度拓撲圖」、
「母法×細則對照卡片」及「教材出處頁碼」，供前端右側可開闔抽屜 (Slide-over Drawer) 即時呈現。
"""

from typing import Dict, Any, List, Callable, Optional
import time
import re

from backend.agent_calculators import (
    calculate_procurement_thresholds,
    calculate_engineering_qualification_and_qc,
    calculate_price_index_and_settlement,
    calculate_contract_change_and_art58,
    evaluate_bid_rigging_and_debarment,
    analyze_three_dimensional_liability,
)
from backend.knowledge_base import (
    search_law_cross_reference,
    LAW_CROSS_REFERENCE_DB,
)
from backend.erroneous_patterns_skill import run_erroneous_patterns_skill_audit


class LightweightStateGraph:
    """
    相容 LangGraph StateGraph 之零外部依賴狀態圖引擎。
    若環境安裝有 langgraph 套件亦可無縫切換，確保 100% 離線穩定運作。
    """

    def __init__(self) -> None:
        self.nodes: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}
        self.edges: List[Dict[str, str]] = []
        self.entry_point: Optional[str] = None

    def add_node(self, name: str, fn: Callable[[Dict[str, Any]], Dict[str, Any]]) -> None:
        self.nodes[name] = fn

    def set_entry_point(self, name: str) -> None:
        self.entry_point = name

    def add_edge(self, src: str, dst: str) -> None:
        self.edges.append({"from": src, "to": dst})

    def invoke(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        state = dict(initial_state)
        state.setdefault("trace", [])
        current = self.entry_point
        visited = set()
        while current and current in self.nodes and current not in visited:
            visited.add(current)
            t0 = time.perf_counter()
            state = self.nodes[current](state)
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
            if state["trace"] and state["trace"][-1].get("node_id") == current:
                state["trace"][-1]["latency_ms"] = elapsed_ms
            next_nodes = [e["to"] for e in self.edges if e["from"] == current]
            current = next_nodes[0] if next_nodes else None
        return state


# ============================================================================
# LangGraph 拓撲節點定義
# ============================================================================

TOPOLOGY_NODES_META: List[Dict[str, str]] = [
    {
        "id": "router_agent",
        "label": "🧭 意圖路由代理 (RouterAgent)",
        "role": "解析問題階段、金額參數與爭點類別",
    },
    {
        "id": "law_retrieval_agent",
        "label": "📚 母法×細則溯源代理 (LawRetrievalAgent)",
        "role": "雙欄檢索採購法母法、施行細則與教材頁碼",
    },
    {
        "id": "calculator_agent",
        "label": "🧮 115新制門檻精算代理 (CalculatorAgent)",
        "role": "核算150萬/5000萬/GPA/720萬土木包工業/物調與實作數量",
    },
    {
        "id": "audit_radar_agent",
        "label": "🔍 查核防弊雷達代理 (AuditInvestigatorAgent)",
        "role": "套用「政府採購錯誤行為態樣」Agent Skill（277項準則），掃描綁標、第50條異常關聯與第101/103條停權",
    },
    {
        "id": "liability_judge_agent",
        "label": "⚖️ 三維法律責任代理 (LiabilityJudgeAgent)",
        "role": "剖析貪污治罪條例第4/6條、採購法第87~92條與行政裁量界線",
    },
    {
        "id": "executive_synthesizer",
        "label": "🛡️ 領航決策綜整代理 (SynthesizerAgent)",
        "role": "彙整法規結論、檢核建議與抽屜溯源證據鏈",
    },
]


def _extract_amount_twd(query: str) -> Optional[float]:
    """從自然語言提問中提取金額（支援『4.5億』、『680萬』、『1,200萬元』等格式）。"""
    q = query.replace(",", "").replace("，", "")
    m_yi = re.search(r"(\d+(?:\.\d+)?)\s*億", q)
    if m_yi:
        val = float(m_yi.group(1)) * 100_000_000
        m_wan_after = re.search(r"億\s*(\d+(?:\.\d+)?)\s*萬", q)
        if m_wan_after:
            val += float(m_wan_after.group(1)) * 10_000
        return val
    m_wan = re.search(r"(\d+(?:\.\d+)?)\s*萬", q)
    if m_wan:
        return float(m_wan.group(1)) * 10_000
    return None


def node_router(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    stage = state.get("stage", "stage2")
    amount = _extract_amount_twd(q) or state.get("amount_twd") or 50_000_000

    category = "engineering"
    if any(k in q for k in ["勞務", "技服", "技術服務", "委託研究", "資訊服務", "設計監造"]):
        category = "service"
    elif any(k in q for k in ["財物", "設備採購", "器材", "耗材"]):
        category = "property"

    state["detected_amount_twd"] = amount
    state["detected_category"] = category
    state["trace"].append({
        "node_id": "router_agent",
        "node_label": "🧭 意圖路由代理 (RouterAgent)",
        "status": "COMPLETED",
        "detail": f"識別階段={stage}｜類別={category}｜偵測金額={amount:,.0f}元",
    })
    return state


def node_law_retrieval(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    matched_laws = search_law_cross_reference(q)

    # 依據關鍵語意補充最相關條文
    keyword_article_map = {
        "公開閱覽": "第34條",
        "查核金額": "第34條",
        "二親等": "第15條",
        "迴避": "第15條",
        "押標金": "第31條",
        "5年": "第31條",
        "綁標": "第26條",
        "同等品": "第26條",
        "異常關聯": "第50條",
        "掛號": "第50條",
        "連號": "第50條",
        "偏低": "第58條",
        "差額保證金": "第58條",
        "70%": "第58條",
        "80%": "第58條",
        "安全衛生": "第70條之1",
        "職安": "第70條之1",
        "付款": "第73條之1",
        "15日": "第73條之1",
        "評選": "第94條",
        "專業人員": "第95條",
        "150萬": "第95條",
        "停權": "第101條",
        "陳述意見": "第101條",
        "審查小組": "第11條之1",
        "巨額": "第11條之1",
        "追加": "第22條",
        "異議": "第75條・第76條",
        "申訴": "第75條・第76條",
        "審議判斷": "第83條・第85條",
        "訴願": "第83條・第85條",
        "調解": "第85條之1",
        "仲裁": "第85條之1",
        "強制仲裁": "第85條之1",
        "履約爭議": "第85條之1",
    }
    target_articles = set()
    for kw, art in keyword_article_map.items():
        if kw in q:
            target_articles.add(art)

    if target_articles:
        prioritized = [item for item in LAW_CROSS_REFERENCE_DB if item["article_no"] in target_articles]
        for item in matched_laws:
            if item not in prioritized and len(prioritized) < 4:
                prioritized.append(item)
        matched_laws = prioritized[:4]
    else:
        matched_laws = matched_laws[:4]

    state["law_cards"] = matched_laws
    state["textbook_citations"] = [
        {
            "article_no": item["article_no"],
            "title": item["title"],
            "page": item["textbook_page"],
            "highlight": item["textbook_commentary"],
        }
        for item in matched_laws
    ]
    state["trace"].append({
        "node_id": "law_retrieval_agent",
        "node_label": "📚 母法×細則溯源代理 (LawRetrievalAgent)",
        "status": "COMPLETED",
        "detail": f"命中母法×細則雙欄卡片共 {len(matched_laws)} 條（{', '.join(c['article_no'] for c in matched_laws)}）",
    })
    return state


def node_calculator(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    amount = state.get("detected_amount_twd", 50_000_000)
    category = state.get("detected_category", "engineering")

    ministry = "other"
    if "交通部" in q:
        ministry = "motc"
    elif any(k in q for k in ["經濟部", "內政部", "農業部"]):
        ministry = "moi_moea_moa"
    elif "國防部" in q:
        ministry = "mnd_classified"

    thresh_res = calculate_procurement_thresholds(
        amount_twd=amount,
        category=category,
        entity_type="central",
        ministry_type=ministry,
    )
    eng_res = calculate_engineering_qualification_and_qc(
        budget_twd=amount,
        is_road_work=("道路" in q or "AC" in q.upper() or "刨除" in q),
    )

    state["calc_summary"] = {
        "thresholds": thresh_res,
        "engineering_qc": eng_res,
    }
    state["trace"].append({
        "node_id": "calculator_agent",
        "node_label": "🧮 115新制門檻精算代理 (CalculatorAgent)",
        "status": "COMPLETED",
        "detail": f"完成級距判定：{thresh_res['tier_name']}｜最低承攬資格：{eng_res['contractor_title']}",
    })
    return state


def node_audit_radar(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    anomalies = []
    if "掛號" in q or "連號" in q:
        anomalies.append("serial_registered_mail")
    if "支票" in q or "押標金" in q:
        anomalies.append("serial_bank_checks")
    if "IP" in q.upper():
        anomalies.append("same_ip_electronic_bid")

    audit_res = evaluate_bid_rigging_and_debarment(
        anomalies=anomalies,
        violation_clause="101_1_12",
        prior_debarment_count_in_5yrs=0,
    )
    skill_res = run_erroneous_patterns_skill_audit(text=q, case_title="LangGraph 錯誤行為態樣即時檢核")
    audit_res["erroneous_patterns_skill"] = {
        "skill_name": skill_res["skill_name"],
        "risk_level": skill_res["risk_level"],
        "risk_score": skill_res["risk_score"],
        "matched_codes": skill_res["matched_codes"],
        "total_matched": skill_res["counts"]["total_matched"],
    }
    state["audit_summary"] = audit_res
    matched_preview = "、".join(skill_res["matched_codes"][:4]) if skill_res["matched_codes"] else "無直接命中"
    state["trace"].append({
        "node_id": "audit_radar_agent",
        "node_label": "🔍 查核防弊雷達代理 (AuditInvestigatorAgent)",
        "status": "COMPLETED",
        "detail": (
            f"套用「政府採購錯誤行為態樣」Agent Skill 命中 {skill_res['counts']['total_matched']} 項"
            f"（{matched_preview}），並完成第50條異常關聯({len(anomalies)}項)與第101/103條停權檢核"
        ),
    })
    return state


def node_liability_judge(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    scenario = "admin_discretion"
    if any(k in q for k in ["綁標", "冷軋", "指定廠牌", "同等品"]):
        scenario = "spec_tailoring"
    elif any(k in q for k in ["圍標", "掛號", "借牌", "洩密"]):
        scenario = "bid_rigging_leak"
    elif any(k in q for k in ["驗收不實", "地滑", "坍方", "偷工減料"]):
        scenario = "false_acceptance"

    liab_res = analyze_three_dimensional_liability(
        scenario_type=scenario,
        actor_role="civil_servant",
        has_corrupt_intent=("圖利" in q or "回扣" in q or "舞弊" in q),
        has_illegal_gain=("圖利" in q or "回扣" in q or "舞弊" in q),
        kickback_or_inflation_flag=("回扣" in q or "浮報" in q),
        damage_amount_twd=state.get("detected_amount_twd", 5_000_000) * 0.1,
    )
    state["liability_summary"] = liab_res
    state["trace"].append({
        "node_id": "liability_judge_agent",
        "node_label": "⚖️ 三維法律責任代理 (LiabilityJudgeAgent)",
        "status": "COMPLETED",
        "detail": f"完成貪污治罪條例第4/6條、採購法第87~92條及合法行政裁量界線比對（情境={scenario}）",
    })
    return state


def node_synthesizer(state: Dict[str, Any]) -> Dict[str, Any]:
    q = state.get("query", "")
    thresh = state["calc_summary"]["thresholds"]
    eng = state["calc_summary"]["engineering_qc"]
    law_cards = state.get("law_cards", [])

    bullets = [
        f"1. **【採購級距與招決標判定】**：本案金額核算為 **{thresh['amount_twd']:,.0f} 元**（{thresh['category_label']}），屬於「**{thresh['tier_name']}**」。{thresh['tendering_rule']}",
        f"2. **【115.7.1 公開閱覽與專業人員新制】**：{thresh['public_inspection_note']} 另{thresh['specialist_note']}",
        f"3. **【營造業資格與三級品管配置】**：{eng['contractor_reason']} 三級品管要求：{eng['quality_control']['qc_personnel_type']}；{eng['quality_control']['supervision_personnel_type']}。",
        f"4. **【114.12 再生 AC 刨用平衡與職安衛】**：道路工程熱拌再生 AC 須 **≥ 20%**、基底層再生 AC **≥ 60%**（機關負去化責任，嚴禁編列折價要求廠商價購運回）；規劃設計應依**採購法第 70 條之 1** 繪製安衛圖說並專章量化編列費用。",
    ]
    if thresh["requires_pcc_basic_design"]:
        bullets.append(
            f"5. **【基本設計送工程會審議】**：已達主管部會審議門檻（{thresh['pcc_review_threshold_twd'] // 100_000_000} 億元），應送工程會辦理基本設計審議"
            + ("，且達 10 億元以上須提報「替選方案評估」！" if thresh["requires_alternative_scheme"] else "。")
        )
    if law_cards:
        top_law = law_cards[0]
        bullets.append(
            f"6. **【核心法條與教材依據（{top_law['article_no']} {top_law['title']}）】**：{top_law['textbook_commentary']}（詳見右側抽屜：{top_law['textbook_page']}）。"
        )

    state["answer_markdown"] = (
        f"### 🧭 政府採購 AI 領航員診斷報告\n"
        f"**針對提問**：「{q}」\n\n" + "\n".join(bullets)
    )
    state["trace"].append({
        "node_id": "executive_synthesizer",
        "node_label": "🛡️ 領航決策綜整代理 (SynthesizerAgent)",
        "status": "COMPLETED",
        "detail": "已生成結構化法規領航建議，並同步更新右側抽屜之母法×細則卡片與代理拓撲圖",
    })
    return state


def build_procurement_agent_graph() -> LightweightStateGraph:
    graph = LightweightStateGraph()
    graph.add_node("router_agent", node_router)
    graph.add_node("law_retrieval_agent", node_law_retrieval)
    graph.add_node("calculator_agent", node_calculator)
    graph.add_node("audit_radar_agent", node_audit_radar)
    graph.add_node("liability_judge_agent", node_liability_judge)
    graph.add_node("executive_synthesizer", node_synthesizer)

    graph.set_entry_point("router_agent")
    graph.add_edge("router_agent", "law_retrieval_agent")
    graph.add_edge("law_retrieval_agent", "calculator_agent")
    graph.add_edge("calculator_agent", "audit_radar_agent")
    graph.add_edge("audit_radar_agent", "liability_judge_agent")
    graph.add_edge("liability_judge_agent", "executive_synthesizer")
    return graph


AGENT_GRAPH = build_procurement_agent_graph()


def run_navigator_agent(query: str, stage: str = "stage2", amount_twd: Optional[float] = None) -> Dict[str, Any]:
    """執行 LangGraph 多代理工作流並回傳完整解答與右側抽屜溯源資料。"""
    final_state = AGENT_GRAPH.invoke({
        "query": query,
        "stage": stage,
        "amount_twd": amount_twd,
        "trace": [],
    })
    return {
        "query": query,
        "stage": stage,
        "answer_markdown": final_state["answer_markdown"],
        "law_cards": final_state["law_cards"],
        "textbook_citations": final_state["textbook_citations"],
        "calc_summary": final_state["calc_summary"],
        "audit_summary": final_state["audit_summary"],
        "liability_summary": final_state["liability_summary"],
        "agent_topology": {
            "nodes": TOPOLOGY_NODES_META,
            "edges": AGENT_GRAPH.edges,
            "execution_trace": final_state["trace"],
        },
    }
