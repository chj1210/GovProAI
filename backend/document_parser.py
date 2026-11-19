# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 公文 PDF／DOCX／ODT／純文字 上傳解析與智慧中繼資料擷取引擎
專為「工程會函釋 PDF 檔」、「監察院調查／糾正報告」、「採購申訴審議判斷書」、
「履約爭議調解書」及「採購稽核／工程施工查核報告」設計：
  1. 支援 .pdf (pypdf + UTF-16BE CJK 備援)、.docx (標準庫 XML)、.odt (政府公文 ODF)、.txt/.md/.csv/.json (UTF-8/Big5)。
  2. 自動擷取發文字號/案號、發文/調查機關、民國轉西元日期、採購金額、主旨標題、引用法條與分類推斷。
  3. 原始檔案安全歸檔至 data/uploads/，供知識管理 (KM) 卡片後續溯源調閱。
"""

from pathlib import Path
from typing import Dict, Any, List, Tuple
import datetime
import io
import re
import uuid
import warnings
import xml.etree.ElementTree as ET
import zipfile

from backend.agent_graph import _extract_amount_twd

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "data" / "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".odt", ".txt", ".md", ".csv", ".json"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


def sanitize_filename(filename: str) -> str:
    """清理檔名，避免路徑遍歷與非法字元，保留中文與英數。"""
    base = Path(filename or "uploaded_document.pdf").name
    cleaned = re.sub(r'[\\/:*?"<>|\r\n]+', "_", base).strip(" ._")
    if not cleaned:
        cleaned = "uploaded_document.pdf"
    return cleaned[:120]


def save_uploaded_file(file_bytes: bytes, original_filename: str) -> Dict[str, Any]:
    """將上傳之原始公文／報告檔案安全歸檔於 data/uploads/。"""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = sanitize_filename(original_filename)
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"不支援的檔案格式「{ext or '未知'}」，請上傳 {', '.join(sorted(ALLOWED_EXTENSIONS))} 檔案。"
        )
    if len(file_bytes) == 0:
        raise ValueError("上傳檔案內容為空，請確認檔案後再試。")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError(f"檔案大小超過上限（最大 {MAX_UPLOAD_BYTES // (1024 * 1024)} MB）。")

    ts_prefix = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    uid = uuid.uuid4().hex[:6]
    stored_filename = f"{ts_prefix}_{uid}_{safe_name}"
    target_path = UPLOADS_DIR / stored_filename
    target_path.write_bytes(file_bytes)

    return {
        "original_filename": safe_name,
        "stored_filename": stored_filename,
        "extension": ext,
        "file_size_bytes": len(file_bytes),
        "download_url": f"/api/stage3/uploads/{stored_filename}",
        "uploaded_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def _extract_utf16be_hex_from_pdf(file_bytes: bytes) -> str:
    """
    備援解析器：針對以 UTF-16BE Hex (<FEFF...>) 編碼之繁體中文 PDF（例如本平台原生匯出 PDF），
    直接解碼文字串流以補足 CMap 抽取不足。
    """
    chunks: List[str] = []
    for m in re.finditer(rb"<FEFF([0-9A-Fa-f]+)>", file_bytes):
        hex_bytes = m.group(1)
        if len(hex_bytes) % 4 != 0:
            continue
        try:
            decoded = bytes.fromhex(hex_bytes.decode("ascii")).decode("utf-16-be", errors="ignore").strip()
            if decoded:
                chunks.append(decoded)
        except Exception:
            continue
    return "\n".join(chunks)


def _extract_pdf_text(file_bytes: bytes) -> Tuple[str, int, str]:
    """解析 PDF 文字並回傳 (純文字, 頁數, 解析方法)。"""
    page_count = 0
    extracted_pages: List[str] = []
    method = "pypdf"

    try:
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message=r".*ARC4 has been moved.*",
                module=r"pypdf\._crypt_providers.*",
            )
            from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
        for idx, page in enumerate(reader.pages, start=1):
            try:
                pt = (page.extract_text() or "").strip()
            except Exception:
                pt = ""
            if pt:
                extracted_pages.append(pt)
    except Exception as exc:
        method = f"pypdf_error:{type(exc).__name__}"

    combined = "\n\n".join(extracted_pages).strip()

    # 若 pypdf 抽取極少文字（如特殊 CJK Type0 UTF-16BE 編碼），啟動備援解碼
    if len(combined) < 20:
        fallback_txt = _extract_utf16be_hex_from_pdf(file_bytes).strip()
        if len(fallback_txt) > len(combined):
            combined = fallback_txt
            method = "pdf_utf16be_fallback"

    if page_count == 0:
        # 粗估頁數
        page_count = max(1, len(re.findall(rb"/Type\s*/Page\b", file_bytes)))

    return combined, page_count, method


def _extract_docx_text(file_bytes: bytes) -> Tuple[str, int, str]:
    """使用標準庫解析 .docx (Word) 內文與表格。"""
    lines: List[str] = []
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        if "word/document.xml" not in zf.namelist():
            return "", 1, "docx_xml"
        root = ET.fromstring(zf.read("word/document.xml"))
        for p in root.iter():
            if p.tag.endswith("}p"):
                texts = [t.text for t in p.iter() if t.tag.endswith("}t") and t.text]
                if texts:
                    lines.append("".join(texts))
    return "\n".join(lines).strip(), 1, "docx_xml"


def _extract_odt_text(file_bytes: bytes) -> Tuple[str, int, str]:
    """使用標準庫解析 .odt (台灣公務機關 ODF 公文標準格式)。"""
    lines: List[str] = []
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        if "content.xml" not in zf.namelist():
            return "", 1, "odt_xml"
        root = ET.fromstring(zf.read("content.xml"))
        for el in root.iter():
            if el.tag.endswith("}p") or el.tag.endswith("}h"):
                txt = "".join(el.itertext()).strip()
                if txt:
                    lines.append(txt)
    return "\n".join(lines).strip(), 1, "odt_xml"


def _extract_plain_text(file_bytes: bytes) -> Tuple[str, int, str]:
    """解析純文字檔，自動相容 UTF-8 與臺灣 Big5/CP950 編碼。"""
    for enc in ("utf-8-sig", "utf-8", "cp950", "big5", "latin-1"):
        try:
            return file_bytes.decode(enc).strip(), 1, f"text_{enc}"
        except Exception:
            continue
    return file_bytes.decode("utf-8", errors="ignore").strip(), 1, "text_lossy"


def extract_document_text(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """依副檔名自動選擇對應解析器抽取公文／報告文字內容。"""
    ext = Path(filename or "").suffix.lower()
    if ext == ".pdf":
        text, page_count, method = _extract_pdf_text(file_bytes)
    elif ext == ".docx":
        text, page_count, method = _extract_docx_text(file_bytes)
    elif ext == ".odt":
        text, page_count, method = _extract_odt_text(file_bytes)
    else:
        text, page_count, method = _extract_plain_text(file_bytes)

    # 正規化過多空白與控制字元
    normalized = re.sub(r"\r\n?", "\n", text)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized).strip()

    is_scanned_warning = ext == ".pdf" and len(normalized) < 25
    warning_msg = (
        "⚠️ 此 PDF 檔未偵測到可抽取之文字層（可能為純圖片掃描檔），系統已保存原始 PDF 檔，請手動補填摘要或先經 OCR 轉為可搜尋 PDF。"
        if is_scanned_warning
        else ""
    )

    return {
        "text": normalized,
        "char_count": len(normalized),
        "page_count": page_count,
        "parser_method": method,
        "is_scanned_warning": is_scanned_warning,
        "warning_message": warning_msg,
    }


def _roc_to_iso_date(text: str) -> str:
    """擷取民國日期（如 113年9月26日 或 111.12.23）並轉為 YYYY-MM-DD。"""
    m = re.search(r"(?:中華民國\s*)?(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日", text)
    if m:
        y = int(m.group(1)) + 1911
        mo = int(m.group(2))
        d = int(m.group(3))
        if 1990 <= y <= 2100 and 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}-{mo:02d}-{d:02d}"
    m_iso = re.search(r"(20\d{2})[-/](\d{1,2})[-/](\d{1,2})", text)
    if m_iso:
        return f"{int(m_iso.group(1)):04d}-{int(m_iso.group(2)):02d}-{int(m_iso.group(3)):02d}"
    return datetime.date.today().isoformat()


def extract_official_doc_metadata(
    text: str,
    filename: str = "",
    doc_type_hint: str = "",
) -> Dict[str, Any]:
    """
    針對工程會函釋 PDF、監察院調查／糾正報告、採購申訴審議判斷書、履約調解書及稽核查核報告，
    自動抽取結構化欄位，大幅減少承辦人員手動建檔負擔。
    """
    t = text or ""
    fname_stem = Path(filename or "上傳公文報告").stem

    # 1. 自動判定素材類別 doc_type
    if doc_type_hint and doc_type_hint != "auto":
        doc_type = doc_type_hint
    elif any(k in t or k in fname_stem for k in ["工程企字", "工程管字", "工程技字", "令頒", "解釋函", "函釋", "作業指引"]):
        doc_type = "pcc_interpretation"
    elif any(k in t or k in fname_stem for k in ["監察院", "糾正案", "院台調", "調查報告", "廉政署", "彈劾"]):
        doc_type = "investigation_report"
    elif any(k in t or k in fname_stem for k in ["審議判斷", "採購申訴", "申訴廠商", "訴1"]):
        doc_type = "appeal_decision"
    elif any(k in t or k in fname_stem for k in ["調解建議", "調解方案", "調解成立", "履約爭議調解", "調1"]):
        doc_type = "mediation_case"
    elif any(k in t or k in fname_stem for k in ["採購稽核", "稽核小組", "施工查核", "查核報告", "錯誤行為態樣"]):
        doc_type = "audit_report"
    elif "異議" in t:
        doc_type = "dispute_objection"
    else:
        doc_type = "audit_report"

    # 2. 自動擷取發文字號／案號
    case_no = ""
    case_no_patterns = [
        r"(工程[企管技工]字第\s*\d+\s*號[令函]?)",
        r"(院台[^\s，。；\n]{1,6}字第\s*\d+\s*號)",
        r"(發文字號[:：]\s*([^\s\n，。]+))",
        r"([北新高臺中南桃]?市?訴\s*\d{6,8}\s*號)",
        r"([北新高臺中南桃]?市?調\s*\d{6,8}\s*號)",
        r"(稽核\s*\d{2,3}[-－]\d+\s*號)",
        r"(案號[:：]\s*([^\s\n，。]+))",
    ]
    for pat in case_no_patterns:
        m = re.search(pat, t)
        if m:
            raw_no = m.group(2) if m.lastindex and m.lastindex >= 2 and m.group(2) else m.group(1)
            case_no = re.sub(r"\s+", "", raw_no)
            break
    if not case_no:
        case_no = f"DOC-{datetime.datetime.now().strftime('%Y%m%d')}"

    # 3. 發文／受理／調查機關
    authority = "行政院公共工程委員會"
    for candidate in [
        "監察院",
        "法務部廉政署",
        "行政院公共工程委員會採購申訴審議委員會",
        "臺北市政府採購申訴審議委員會",
        "新北市政府採購申訴審議委員會",
        "桃園市政府採購申訴審議委員會",
        "臺中市政府採購申訴審議委員會",
        "臺南市政府採購申訴審議委員會",
        "高雄市政府採購申訴審議委員會",
        "中央採購稽核小組",
        "行政院公共工程委員會",
    ]:
        if candidate in t or candidate in fname_stem:
            authority = candidate
            break

    # 4. 受查核／招標機關偵測
    agency = ""
    m_agency = re.search(r"(?:招標機關|受查核機關|受文者|主辦機關|被糾正機關)[:：]\s*([^\n，。；]{2,28})", t)
    if m_agency:
        agency = m_agency.group(1).strip()
    elif doc_type == "pcc_interpretation":
        agency = "各中央及地方招標機關（通案適用）"
    else:
        agency = "待確認招標／受查核機關"

    # 5. 主旨／標題偵測
    title = ""
    m_subj = re.search(r"(?:主旨|案由|案件名稱|調查案名)[:：]\s*([^\n]{6,120})", t)
    if m_subj:
        title = m_subj.group(1).strip()
    else:
        # 使用檔名或首行有意義文字
        first_lines = [ln.strip() for ln in t.splitlines() if len(ln.strip()) >= 6]
        if fname_stem and not re.match(r"^[0-9a-f_-]+$", fname_stem.lower()):
            title = fname_stem
        elif first_lines:
            title = first_lines[0][:90]
        else:
            title = "上傳公文／調查報告解析案"

    prefix_map = {
        "pcc_interpretation": "【工程會函釋】",
        "investigation_report": "【監察／調查報告】",
        "appeal_decision": "【申訴審議判斷】",
        "mediation_case": "【履約爭議調解】",
        "audit_report": "【採購稽核／查核報告】",
        "dispute_objection": "【異議處理】",
    }
    pref = prefix_map.get(doc_type, "")
    if pref and not title.startswith("【"):
        title = f"{pref}{title}"

    # 6. 採購類別與金額
    procurement_category = "engineering"
    if any(k in t for k in ["勞務採購", "技術服務", "資訊服務", "委外服務", "清潔服務"]):
        procurement_category = "service"
    elif any(k in t for k in ["財物採購", "設備採購", "醫療設備", "器材"]):
        procurement_category = "property"

    budget_twd = _extract_amount_twd(t) or 0.0

    # 7. 日期轉換
    case_date = _roc_to_iso_date(t)

    # 8. 法條自動擷取
    law_patterns = [
        r"(?:政府)?採購法第\s*\d+\s*條(?:之\s*\d+)?(?:第\s*\d+\s*項)?(?:第\s*\d+\s*款)?",
        r"(?:採購法)?施行細則第\s*\d+\s*條(?:之\s*\d+)?",
        r"貪污治罪條例第\s*\d+\s*條(?:第\s*\d+\s*項)?",
        r"行政罰法第\s*\d+\s*條",
        r"資格標準第\s*\d+\s*條",
        r"押保辦法第\s*\d+\s*條",
        r"採購人員倫理準則第\s*\d+\s*條",
    ]
    law_refs: List[str] = []
    for lp in law_patterns:
        for m in re.finditer(lp, t):
            val = re.sub(r"\s+", "", m.group(0))
            if val not in law_refs:
                law_refs.append(val)
            if len(law_refs) >= 8:
                break

    # 9. 處理結果／決議推斷
    if doc_type == "pcc_interpretation":
        outcome = f"工程會通案函釋／令頒基準（{case_no}）"
    elif "糾正" in t:
        outcome = "監察院通過糾正案／要求主管機關檢討改進"
    elif "申訴有理由" in t or "原異議處理結果撤銷" in t:
        outcome = "申訴有理由（撤銷原處分，命機關另為適法處置）"
    elif "申訴駁回" in t:
        outcome = "申訴駁回"
    elif "調解成立" in t:
        outcome = "履約爭議調解成立（與確定判決有同一效力）"
    elif "調解不成立" in t:
        outcome = "調解不成立（評估是否觸發第85條之1第2項強制仲裁）"
    else:
        outcome = "已上傳解析並納入知識管理列管追蹤"

    # 10. 摘要分段（事實／結論／KM 教訓）
    facts_summary = t[:900].strip() if t else f"已上傳原始檔案：{filename}（請檢視原檔補充案情摘要）。"
    decision_or_findings = ""
    m_dec = re.search(r"(?:說明|調查意見|結論|審議判斷理由|調解建議|查核意見)[:：]?\s*([\s\S]{20,900})", t)
    if m_dec:
        decision_or_findings = m_dec.group(1).strip()[:900]
    elif len(t) > 900:
        decision_or_findings = t[900:1800].strip()
    else:
        decision_or_findings = facts_summary

    topic_map = {
        "pcc_interpretation": "工程會法規函釋／採購實務通案指引",
        "investigation_report": "監察院調查／糾正報告（採購違失與防弊檢討）",
        "appeal_decision": "採購申訴審議判斷（招審決標／押標金／第101條）",
        "mediation_case": "履約爭議調解（展延工期／實作數量／違約金／減價收受）",
        "audit_report": "採購稽核／工程施工查核缺失報告",
        "dispute_objection": "廠商異議處理與自我省察",
    }

    return {
        "doc_type": doc_type,
        "case_no": case_no,
        "title": title,
        "authority": authority,
        "agency": agency,
        "procurement_category": procurement_category,
        "budget_twd": budget_twd,
        "case_date": case_date,
        "outcome": outcome,
        "dispute_topic": topic_map.get(doc_type, "採購查核與爭議處理"),
        "facts_summary": facts_summary,
        "decision_or_findings": decision_or_findings,
        "law_refs": law_refs,
        "tags": [doc_type, case_no, authority[:10]],
    }

