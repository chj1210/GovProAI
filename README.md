# 政府採購AI領航員平台 V2.0 (三階段漸進式領航架構)

本專案為「政府採購AI領航員平台 V2.0」，採用 **React + FastAPI + LangGraph** 架構，具備**預編譯 SPA（零外部網路依賴）**、**115年最新法規與工程會教材硬編碼精算引擎**，以及 **Human-in-the-Loop (HITL) SHA-256 電子簽章原生 PDF 匯出**功能。

## 一、 單一入口快速啟動

```bash
python run.py
```

啟動後自動檢核預編譯 SPA (`frontend/dist/`) 並將服務掛載於：
- **主系統入口**：`http://127.0.0.1:8000`
- **法規檢核**：`http://127.0.0.1:8000/api/health`
- **FastAPI端點**：`http://127.0.0.1:8000/api/docs`

執行完整自動化測試套件：

```bash
python -m pytest tests/test_govpro_v2.py -v
```

## 二、 核心架構與檔案清單

- [run.py](file:///d:/01_invest/115/202611/govpro_v2/run.py)：單一入口啟動腳本（於 `http://127.0.0.1:8000` 啟動服務）
- [build_spa.py](file:///d:/01_invest/115/202611/govpro_v2/build_spa.py)：零外部網路依賴之 JSX 轉譯與預編譯 SPA 打包工具
- [backend/agent_calculators.py](file:///d:/01_invest/115/202611/govpro_v2/backend/agent_calculators.py)：115年最新法規核心參數與四大實務精算器、圍標/停權檢核、三維法律責任引擎
- [backend/knowledge_base.py](file:///d:/01_invest/115/202611/govpro_v2/backend/knowledge_base.py)：基礎/進階教材精讀卡片、母法×施行細則雙欄對照資料庫、模擬認證題庫、五階段檢核表與四大稽核案例庫
- [backend/agent_graph.py](file:///d:/01_invest/115/202611/govpro_v2/backend/agent_graph.py)：LangGraph 6 節點多代理狀態圖調度引擎（輸出代理執行軌跡拓撲圖與法規溯源卡片）
- [backend/erroneous_patterns_skill.py](file:///d:/01_invest/115/202611/govpro_v2/backend/erroneous_patterns_skill.py) ＆ [skills/procurement-erroneous-patterns/SKILL.md](file:///d:/01_invest/115/202611/govpro_v2/skills/procurement-erroneous-patterns/SKILL.md)：「政府採購錯誤行為態樣」Agent Skill 檢核準則引擎（完整收錄工程會五大模組 277 項檢核準則）
- [backend/dispute_km_engine.py](file:///d:/01_invest/115/202611/govpro_v2/backend/dispute_km_engine.py)：爭議處理（異議／申訴／調解）程序時效與規費精算導航、第 85 條之 1 強制仲裁五要件檢核，以及持久化知識管理 (KM) 素材累積庫 (`data/km_materials.json`)
- [backend/document_parser.py](file:///d:/01_invest/115/202611/govpro_v2/backend/document_parser.py)：公文 PDF／DOCX／ODT／純文字 上傳解析與歸檔引擎（支援直接上傳工程會函釋 PDF、監察調查報告與申訴調解書，自動抽取文號、機關、民國日期與法條並歸檔於 `data/uploads/`）
- [backend/pdf_generator.py](file:///d:/01_invest/115/202611/govpro_v2/backend/pdf_generator.py)：HITL SHA-256 數位簽章與繁體中文原生向量 PDF (`%PDF-1.4`) 產生器
- [backend/main.py](file:///d:/01_invest/115/202611/govpro_v2/backend/main.py)：FastAPI 主服務與靜態 SPA 路由
- [frontend/src/App.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/App.jsx)：頂部「三階段漸進式領航切換器 (3-Stage Stepper)」與主畫面容器
- [frontend/src/components/Stage1CertificationCoach.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/Stage1CertificationCoach.jsx)：階段一「考證培訓賦能」元件
- [frontend/src/components/Stage2LifecycleNavigator.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/Stage2LifecycleNavigator.jsx)：階段二「採購實務領航」元件
- [frontend/src/components/Stage3AuditInvestigator.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/Stage3AuditInvestigator.jsx)：階段三「監察查核領航」主元件（整合 [Stage3ErroneousPatternsSkill.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/Stage3ErroneousPatternsSkill.jsx) ＆ [Stage3DisputeAndKmHub.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/Stage3DisputeAndKmHub.jsx)）
- [frontend/src/components/SlideOverDrawer.jsx](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/components/SlideOverDrawer.jsx)：右側可開闔「法規溯源與 AI 代理軌跡抽屜」元件
- [frontend/src/styles/executive.css](file:///d:/01_invest/115/202611/govpro_v2/frontend/src/styles/executive.css)：高雅明亮公務視覺（Executive Light & Navy Theme）樣式表
