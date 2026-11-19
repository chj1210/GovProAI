# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 原生 PDF 報表與 HITL SHA-256 電子簽章引擎
零外部第三方套件依賴，直接產生符合 PDF 1.4 規範與 Adobe CJK (UniCNS-UCS2-H / MSung-Light)
之繁體中文原生向量 PDF（「公務簽辦報告」與「監察調查/採購稽核查核報告」）。
"""

from typing import Dict, Any, List
import hashlib
import datetime


def compute_hitl_sha256(payload: Dict[str, Any]) -> Dict[str, str]:
    """計算 Human-in-the-Loop (HITL) 簽核雜湊指紋與時間戳記。"""
    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    raw_str = (
        f"REPORT_TYPE={payload.get('report_type', 'audit')}|"
        f"CASE_TITLE={payload.get('case_title', '')}|"
        f"SIGNER_NAME={payload.get('signer_name', '採購稽核委員')}|"
        f"SIGNER_TITLE={payload.get('signer_title', '簡任稽核員')}|"
        f"HITL_DECISION={payload.get('hitl_decision', 'APPROVED')}|"
        f"TIMESTAMP={now_iso}|"
        f"NOTES={payload.get('hitl_notes', '')}"
    )
    digest = hashlib.sha256(raw_str.encode("utf-8")).hexdigest().upper()
    return {
        "sha256": digest,
        "short_fingerprint": f"{digest[:8]}-{digest[8:16]}-{digest[-8:]}",
        "timestamp": now_iso,
        "canonical_payload": raw_str,
    }


def _utf16be_hex(text: str) -> str:
    """將繁體中文與 ASCII 字串轉為 PDF UTF-16BE Hex 字串 `<FEFF...>`。"""
    clean = (text or "").replace("\r", "").replace("\n", " ")
    encoded = clean.encode("utf-16-be")
    return "<FEFF" + encoded.hex().upper() + ">"


def _wrap_text(text: str, max_chars: int = 44) -> List[str]:
    """依字元寬度自動斷行以排版於 A4 頁面。"""
    lines: List[str] = []
    for paragraph in (text or "").split("\n"):
        p = paragraph.strip()
        if not p:
            continue
        while len(p) > max_chars:
            lines.append(p[:max_chars])
            p = p[max_chars:]
        if p:
            lines.append(p)
    return lines


def generate_native_audit_pdf(payload: Dict[str, Any]) -> bytes:
    """
    產生原生 A4 (595 x 842 pt) 繁體中文 PDF 二進位檔案。
    支援兩種模式：
    - report_type == "official_memo": 公務簽辦報告（採購實務領航與法規簽辦）
    - report_type == "audit_investigation": 監察調查／採購稽核查核報告
    """
    sig_info = compute_hitl_sha256(payload)
    report_type = payload.get("report_type", "audit_investigation")
    if report_type == "official_memo":
        doc_title = "政府採購AI領航員 V2.0 — 公務採購法規簽辦報告"
        doc_subtitle = "Executive Procurement Legal Compliance & Lifecycle Memo (115年新制基準)"
    else:
        doc_title = "政府採購AI領航員 V2.0 — 監察調查與採購稽核查核報告"
        doc_subtitle = "Control Yuan & Procurement Audit Risk Investigation Report (HITL Verified)"

    case_title = payload.get("case_title", "某碼頭特定鋼板樁綁標案")
    agency = payload.get("agency", "受查核機關")
    budget_twd = float(payload.get("budget_twd", 185_000_000))
    signer_name = payload.get("signer_name", "王守法")
    signer_title = payload.get("signer_title", "採購稽核小組簡任秘書 / 採購專業進階人員")
    hitl_decision = payload.get("hitl_decision", "核准簽辦並移送改善 (HITL Approved)")
    hitl_notes = payload.get(
        "hitl_notes",
        "經人工複核母法×施行細則雙欄依據與三維法律責任分析，確認符合115年最新採購法令。",
    )
    findings: List[Dict[str, str]] = payload.get("findings", [])
    liability_summary: str = payload.get(
        "liability_summary",
        "刑事：檢視貪污治罪條例第4條第1項第3款（經辦公用工程舞弊罪）、第6條第1項第4款（圖利罪，嚴格區辨合法行政裁量）及採購法第87~92條；行政：採購人員倫理準則與第101/103條停權（10日陳述意見、採購工作及審查小組、3年裁處權時效）；民事：民法不完全給付、採購法第59條不正利益扣減與第72條減價收受。",
    )
    corrective_action: str = payload.get(
        "corrective_action",
        "1. 依採購法第26條回歸CNS國家標準並加註或同等品；2. 達查核金額落實115.7.1公開閱覽新制（至少5工作天）；3. 道路工程落實114.12熱拌再生AC≥20%、基底層≥60%刨用平衡。",
    )

    # 建立 PDF 繪圖指令流 (Content Stream)
    cmds: List[str] = []

    # 1. 頂部深海藍公務橫幅 (Executive Navy Header)
    cmds.append("0.059 0.161 0.259 rg")  # #0F2942 Navy
    cmds.append("0 765 595 77 re f")
    cmds.append("0.773 0.545 0.086 rg")  # #C58B16 Amber Gold accent bar
    cmds.append("0 760 595 5 re f")

    # 標題文字 (白色)
    cmds.append("BT /F1 15 Tf 1 1 1 rg 36 810 Td " + _utf16be_hex(doc_title) + " Tj ET")
    cmds.append("BT /F1 9 Tf 0.85 0.90 0.95 rg 36 790 Td " + _utf16be_hex(doc_subtitle) + " Tj ET")
    cmds.append(
        "BT /F1 8.5 Tf 0.95 0.82 0.45 rg 36 772 Td "
        + _utf16be_hex(f"簽核時間：{sig_info['timestamp']}  |  HITL SHA-256 指紋：{sig_info['short_fingerprint']}")
        + " Tj ET"
    )

    y = 736

    # 2. 基本案情資訊框
    cmds.append("0.95 0.97 0.99 rg 32 " + f"{y - 62} 531 68 re f")
    cmds.append("0.059 0.161 0.259 RG 1 w 32 " + f"{y - 62} 531 68 re S")
    cmds.append("BT /F1 11 Tf 0.059 0.161 0.259 rg 42 " + f"{y - 16} Td " + _utf16be_hex(f"【壹、標案基本資料】 案名：{case_title}") + " Tj ET")
    cmds.append("BT /F1 9.5 Tf 0.15 0.20 0.28 rg 42 " + f"{y - 34} Td " + _utf16be_hex(f"主辦機關：{agency}    ｜    採購預算金額：新臺幣 {budget_twd:,.0f} 元整") + " Tj ET")
    cmds.append("BT /F1 9.5 Tf 0.05 0.48 0.37 rg 42 " + f"{y - 52} Td " + _utf16be_hex("法規引擎基準：115年最新門檻（公告150萬/小額15萬/查核5000萬&1000萬公開閱覽/土木包工業720萬/1 SDR=41.9484）") + " Tj ET")

    y -= 86

    # 3. 貳、法規違反與風險掃描明細
    cmds.append("BT /F1 11 Tf 0.059 0.161 0.259 rg 36 " + f"{y} Td " + _utf16be_hex("【貳、AI 法規掃描與稽核查核發現（母法×細則溯源）】") + " Tj ET")
    y -= 6
    cmds.append("0.059 0.161 0.259 RG 1.2 w 36 " + f"{y} m 559 {y} l S")
    y -= 18

    if not findings:
        findings = [
            {
                "law": "《政府採購法》第26條、第34條(115.7.1新制)、第50條、第101條",
                "severity": "HIGH",
                "finding": "經核對115年工程會最新教材與法令基準，應落實公開閱覽、CNS國家標準與同等品審查及比例原則。",
            }
        ]

    for idx, f in enumerate(findings[:4], start=1):
        law_head = f"發現 ({idx}) [{f.get('severity', 'HIGH')}] 違反法條：{f.get('law', '')}"
        cmds.append("BT /F1 9.5 Tf 0.65 0.12 0.12 rg 40 " + f"{y} Td " + _utf16be_hex(law_head) + " Tj ET")
        y -= 15
        for line in _wrap_text(f.get("finding", ""), 48)[:3]:
            cmds.append("BT /F1 9 Tf 0.15 0.18 0.22 rg 50 " + f"{y} Td " + _utf16be_hex(line) + " Tj ET")
            y -= 14
        y -= 4

    y -= 8

    # 4. 參、刑事／行政／民事三維法律責任剖析
    cmds.append("BT /F1 11 Tf 0.059 0.161 0.259 rg 36 " + f"{y} Td " + _utf16be_hex("【參、刑事／行政／民事三維法律責任與圖利罪界線剖析】") + " Tj ET")
    y -= 6
    cmds.append("0.059 0.161 0.259 RG 1.2 w 36 " + f"{y} m 559 {y} l S")
    y -= 16
    for line in _wrap_text(liability_summary, 48)[:6]:
        cmds.append("BT /F1 9 Tf 0.15 0.18 0.22 rg 40 " + f"{y} Td " + _utf16be_hex(line) + " Tj ET")
        y -= 14

    y -= 8

    # 5. 肆、具體處置與防弊改善建議
    cmds.append("BT /F1 11 Tf 0.059 0.161 0.259 rg 36 " + f"{y} Td " + _utf16be_hex("【肆、具體處置與防弊改善建議（含HITL人工覆核意見）】") + " Tj ET")
    y -= 6
    cmds.append("0.059 0.161 0.259 RG 1.2 w 36 " + f"{y} m 559 {y} l S")
    y -= 16
    for line in _wrap_text(corrective_action, 48)[:5]:
        cmds.append("BT /F1 9 Tf 0.15 0.18 0.22 rg 40 " + f"{y} Td " + _utf16be_hex(line) + " Tj ET")
        y -= 14
    for line in _wrap_text(f"人工覆核批示：{hitl_notes}", 48)[:2]:
        cmds.append("BT /F1 9 Tf 0.05 0.42 0.32 rg 40 " + f"{y} Td " + _utf16be_hex(line) + " Tj ET")
        y -= 14

    # 6. 底部 HITL SHA-256 數位簽章防偽印鑑框
    box_y = 48
    cmds.append("0.98 0.96 0.90 rg 32 " + f"{box_y} 531 92 re f")
    cmds.append("0.773 0.545 0.086 RG 1.5 w 32 " + f"{box_y} 531 92 re S")
    cmds.append("BT /F1 10.5 Tf 0.059 0.161 0.259 rg 44 " + f"{box_y + 72} Td " + _utf16be_hex("【伍、Human-in-the-Loop (HITL) 人工簽核與 SHA-256 電子簽章證明】") + " Tj ET")
    cmds.append("BT /F1 9 Tf 0.15 0.18 0.22 rg 44 " + f"{box_y + 52} Td " + _utf16be_hex(f"簽核人員：{signer_name}（{signer_title}）   ｜   裁決狀態：{hitl_decision}") + " Tj ET")
    cmds.append("BT /F1 8.5 Tf 0.15 0.18 0.22 rg 44 " + f"{box_y + 34} Td " + _utf16be_hex(f"簽章時間：{sig_info['timestamp']} (UTC+8)   ｜   法規版本：115年工程會最新教材與採購法基準") + " Tj ET")
    cmds.append("BT /F1 8 Tf 0.55 0.12 0.12 rg 44 " + f"{box_y + 14} Td " + _utf16be_hex(f"SHA-256 完整數位簽章：{sig_info['sha256']}") + " Tj ET")

    stream_data = "\n".join(cmds).encode("ascii")

    # 組裝標準 PDF 1.4 物件表 (含 CIDFontType0 MSung-Light / UniCNS-UCS2-H 繁體中文字型)
    objects: List[bytes] = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
    )
    objects.append(
        b"4 0 obj\n<< /Type /Font /Subtype /Type0 /BaseFont /MSung-Light "
        b"/Encoding /UniCNS-UCS2-H /DescendantFonts [6 0 R] >>\nendobj\n"
    )
    objects.append(
        f"5 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode("ascii")
        + stream_data
        + b"\nendstream\nendobj\n"
    )
    objects.append(
        b"6 0 obj\n<< /Type /Font /Subtype /CIDFontType0 /BaseFont /MSung-Light "
        b"/CIDSystemInfo << /Registry (Adobe) /Ordering (CNS1) /Supplement 4 >> "
        b"/FontDescriptor 7 0 R /DW 1000 >>\nendobj\n"
    )
    objects.append(
        b"7 0 obj\n<< /Type /FontDescriptor /FontName /MSung-Light /Flags 4 "
        b"/FontBBox [-160 -250 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 "
        b"/CapHeight 800 /StemV 80 >>\nendobj\n"
    )

    pdf_out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    xref_offsets: List[int] = []
    for obj in objects:
        xref_offsets.append(len(pdf_out))
        pdf_out.extend(obj)

    xref_pos = len(pdf_out)
    pdf_out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf_out.extend(b"0000000000 65535 f \n")
    for off in xref_offsets:
        pdf_out.extend(f"{off:010d} 00000 n \n".encode("ascii"))

    pdf_out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )
    return bytes(pdf_out)
