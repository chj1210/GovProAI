# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 (三階段漸進式領航架構)
單一入口啟動腳本：自動檢核預編譯 SPA 並啟動 FastAPI 服務於內網
"""

import uvicorn
from build_spa import build_spa
from backend.main import app


def main() -> None:
    # 確保預編譯 SPA (frontend/dist/) 為最新狀態
    build_spa()
    print("=" * 72)
    print(" 🏛️  政府採購AI領航員平台 V2.0 (內網共用模式) 啟動中...")
    print(" 🌐  服務網址:透過HCC的 IP 進行連線 (例如: http://10.10.12.62:8000)")
    print("=" * 72)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")


if __name__ == "__main__":
    main()
