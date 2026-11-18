# -*- coding: utf-8 -*-
"""
政府採購AI領航員平台 V2.0 - 預編譯 SPA 零外部依賴建置器 (Pure-Python JSX Compiler & Bundler)
將 frontend/src/ 下之 React JSX 元件編譯為零外部網路依賴之預編譯 SPA (frontend/dist/)。
"""

import html
import json
import re
from pathlib import Path
from typing import Tuple, List

BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR / "frontend" / "src"
DIST_DIR = BASE_DIR / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"


# ============================================================================
# 1. 遞迴下降 JSX 轉譯器 (JSX -> React.createElement)
# ============================================================================

def _skip_ws(s: str, i: int) -> int:
    n = len(s)
    while i < n and s[i] in " \t\r\n":
        i += 1
    return i


def _read_ident(s: str, i: int) -> Tuple[str, int]:
    n = len(s)
    start = i
    while i < n and (s[i].isalnum() or s[i] in "_-:$"):
        i += 1
    return s[start:i], i


def _read_balanced_braces(s: str, i: int) -> Tuple[str, int]:
    """從 s[i] == '{' 讀取配對之 '}'，同時自動遞迴轉譯內部鑲嵌之 JSX。"""
    assert s[i] == "{"
    i += 1
    depth = 1
    out: List[str] = []
    n = len(s)
    while i < n and depth > 0:
        ch = s[i]
        # 處理單雙引號與樣板字串
        if ch in ("'", '"', "`"):
            quote = ch
            out.append(ch)
            i += 1
            while i < n:
                c2 = s[i]
                out.append(c2)
                i += 1
                if c2 == "\\" and i < n:
                    out.append(s[i])
                    i += 1
                elif c2 == quote:
                    break
            continue
        # 處理單行註解
        if ch == "/" and i + 1 < n and s[i + 1] == "/":
            while i < n and s[i] != "\n":
                out.append(s[i])
                i += 1
            continue
        # 處理多行註解
        if ch == "/" and i + 1 < n and s[i + 1] == "*":
            out.append("/*")
            i += 2
            while i + 1 < n and not (s[i] == "*" and s[i + 1] == "/"):
                out.append(s[i])
                i += 1
            if i + 1 < n:
                out.append("*/")
                i += 2
            continue
        # 偵測內部巢狀 JSX 標籤 `<Tag`
        if ch == "<" and i + 1 < n and (s[i + 1].isalpha() or s[i + 1] == "_"):
            jsx_js, next_i = _parse_jsx_element(s, i)
            out.append(jsx_js)
            i = next_i
            continue
        if ch == "{":
            depth += 1
            out.append(ch)
            i += 1
        elif ch == "}":
            depth -= 1
            if depth > 0:
                out.append(ch)
            i += 1
        else:
            out.append(ch)
            i += 1
    return "".join(out), i


def _parse_jsx_element(s: str, i: int) -> Tuple[str, int]:
    """解析單一 JSX 元素 `<Tag ...>...</Tag>` 或 `<Tag ... />` 並轉為 `React.createElement(...)`。"""
    assert s[i] == "<"
    i += 1
    tag_name, i = _read_ident(s, i)
    props_pairs: List[str] = []

    n = len(s)
    while i < n:
        i = _skip_ws(s, i)
        if i >= n:
            break
        if s[i] == "/" and i + 1 < n and s[i + 1] == ">":
            i += 2
            tag_expr = f'"{tag_name}"' if tag_name[0].islower() else tag_name
            props_expr = "{ " + ", ".join(props_pairs) + " }" if props_pairs else "null"
            return f"React.createElement({tag_expr}, {props_expr})", i
        if s[i] == ">":
            i += 1
            break

        attr_name, i = _read_ident(s, i)
        i = _skip_ws(s, i)
        if i < n and s[i] == "=":
            i += 1
            i = _skip_ws(s, i)
            if s[i] in ('"', "'"):
                q = s[i]
                i += 1
                val_chars: List[str] = []
                while i < n and s[i] != q:
                    if s[i] == "\\" and i + 1 < n:
                        val_chars.append(s[i + 1])
                        i += 2
                    else:
                        val_chars.append(s[i])
                        i += 1
                i += 1
                decoded_str = html.unescape("".join(val_chars))
                props_pairs.append(f"{json.dumps(attr_name)}: {json.dumps(decoded_str, ensure_ascii=False)}")
            elif s[i] == "{":
                expr_str, i = _read_balanced_braces(s, i)
                props_pairs.append(f"{json.dumps(attr_name)}: ({expr_str.strip()})")
        else:
            props_pairs.append(f"{json.dumps(attr_name)}: true")

    # 解析子節點直到 `</tag_name>`
    children_exprs: List[str] = []
    text_buf: List[str] = []

    def flush_text() -> None:
        if not text_buf:
            return
        raw = "".join(text_buf)
        text_buf.clear()
        # 清理多行縮排空白
        if "\n" in raw:
            lines = [ln.strip() for ln in raw.split("\n")]
            lines = [ln for ln in lines if ln]
            cleaned = " ".join(lines)
        else:
            cleaned = raw
        if cleaned:
            unescaped = html.unescape(cleaned)
            children_exprs.append(json.dumps(unescaped, ensure_ascii=False))

    while i < n:
        if s[i] == "<" and i + 1 < n and s[i + 1] == "/":
            flush_text()
            i += 2
            close_tag, i = _read_ident(s, i)
            i = _skip_ws(s, i)
            if i < n and s[i] == ">":
                i += 1
            break
        elif s[i] == "<" and i + 1 < n and (s[i + 1].isalpha() or s[i + 1] == "_"):
            flush_text()
            child_js, i = _parse_jsx_element(s, i)
            children_exprs.append(child_js)
        elif s[i] == "{":
            flush_text()
            expr_str, i = _read_balanced_braces(s, i)
            # 移除註解後判斷是否為空
            no_comment = re.sub(r"/\*[\s\S]*?\*/", "", expr_str).strip()
            if no_comment:
                children_exprs.append(f"({expr_str.strip()})")
        else:
            text_buf.append(s[i])
            i += 1

    tag_expr = f'"{tag_name}"' if tag_name[0].islower() else tag_name
    props_expr = "{ " + ", ".join(props_pairs) + " }" if props_pairs else "null"
    if children_exprs:
        return f"React.createElement({tag_expr}, {props_expr}, {', '.join(children_exprs)})", i
    return f"React.createElement({tag_expr}, {props_expr})", i


def transpile_jsx_source(source: str) -> str:
    """移除 ES module import/export 並將所有 JSX 標籤轉為 React.createElement 呼叫。"""
    # 移除 import 語句
    lines = []
    for line in source.splitlines():
        stripped = line.strip()
        if stripped.startswith("import ") and (" from " in stripped or stripped.endswith(";")):
            continue
        if stripped.startswith("export default function "):
            line = line.replace("export default function ", "function ", 1)
        lines.append(line)
    code = "\n".join(lines)

    out: List[str] = []
    i = 0
    n = len(code)
    while i < n:
        ch = code[i]
        if ch in ("'", '"', "`"):
            q = ch
            out.append(ch)
            i += 1
            while i < n:
                c2 = code[i]
                out.append(c2)
                i += 1
                if c2 == "\\" and i < n:
                    out.append(code[i])
                    i += 1
                elif c2 == q:
                    break
            continue
        if ch == "/" and i + 1 < n and code[i + 1] == "/":
            while i < n and code[i] != "\n":
                out.append(code[i])
                i += 1
            continue
        if ch == "/" and i + 1 < n and code[i + 1] == "*":
            out.append("/*")
            i += 2
            while i + 1 < n and not (code[i] == "*" and code[i + 1] == "/"):
                out.append(code[i])
                i += 1
            if i + 1 < n:
                out.append("*/")
                i += 2
            continue
        if ch == "<" and i + 1 < n and (code[i + 1].isalpha() or code[i + 1] == "_"):
            jsx_js, i = _parse_jsx_element(code, i)
            out.append(jsx_js)
            continue
        out.append(ch)
        i += 1
    return "".join(out)


# ============================================================================
# 2. 內嵌零外部依賴 React 18 相容輕量執行期 (Virtual DOM + Hooks)
# ============================================================================

REACT_LITE_RUNTIME_JS = r"""
(function(global) {
  const stateStore = new Map();
  const effectStore = new Map();
  let currentPath = "root";
  let hookIndex = 0;
  let rootComponent = null;
  let rootContainer = null;
  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    Promise.resolve().then(() => {
      renderScheduled = false;
      performRender();
    });
  }

  function useState(initialValue) {
    const key = currentPath + ":" + (hookIndex++);
    if (!stateStore.has(key)) {
      stateStore.set(key, typeof initialValue === "function" ? initialValue() : initialValue);
    }
    const setState = (updater) => {
      const prev = stateStore.get(key);
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next !== prev) {
        stateStore.set(key, next);
        scheduleRender();
      }
    };
    return [stateStore.get(key), setState];
  }

  function useEffect(callback, deps) {
    const key = currentPath + ":eff:" + (hookIndex++);
    const prevDeps = effectStore.get(key);
    let changed = true;
    if (prevDeps && Array.isArray(deps)) {
      changed = deps.length !== prevDeps.length || deps.some((d, i) => d !== prevDeps[i]);
    }
    if (changed) {
      effectStore.set(key, deps);
      setTimeout(() => {
        try { callback(); } catch (e) { console.error("Effect error:", e); }
      }, 0);
    }
  }

  function createElement(type, props, ...children) {
    const flat = [];
    function pushChild(c) {
      if (Array.isArray(c)) {
        c.forEach(pushChild);
      } else if (c !== null && c !== undefined && c !== false && c !== true) {
        flat.push(c);
      }
    }
    children.forEach(pushChild);
    return { type, props: props || {}, children: flat };
  }

  function createDomNode(vnode, path) {
    if (typeof vnode === "string" || typeof vnode === "number") {
      return document.createTextNode(String(vnode));
    }
    if (!vnode || !vnode.type) {
      return document.createComment("empty");
    }
    if (typeof vnode.type === "function") {
      const prevPath = currentPath;
      const prevIdx = hookIndex;
      currentPath = path + "/" + (vnode.type.name || "Comp");
      hookIndex = 0;
      const rendered = vnode.type(Object.assign({}, vnode.props, { children: vnode.children }));
      currentPath = prevPath;
      hookIndex = prevIdx;
      return createDomNode(rendered, path + "/c");
    }

    const el = document.createElement(vnode.type);
    const props = vnode.props || {};
    Object.keys(props).forEach((k) => {
      const v = props[k];
      if (k === "key") return;
      if (k === "className") {
        el.className = v || "";
      } else if (k === "style" && v && typeof v === "object") {
        Object.assign(el.style, v);
      } else if (k.startsWith("on") && typeof v === "function") {
        const evt = k.slice(2).toLowerCase();
        el.addEventListener(evt === "change" && (vnode.type === "input" || vnode.type === "textarea") ? "input" : evt, v);
      } else if (k === "checked") {
        el.checked = Boolean(v);
      } else if (k === "value") {
        el.value = v !== undefined && v !== null ? String(v) : "";
      } else if (k === "disabled") {
        el.disabled = Boolean(v);
      } else if (v !== false && v !== null && v !== undefined) {
        el.setAttribute(k, String(v));
      }
    });

    (vnode.children || []).forEach((child, idx) => {
      const childKey = (child && child.props && child.props.key !== undefined) ? child.props.key : idx;
      el.appendChild(createDomNode(child, path + "/" + vnode.type + "[" + childKey + "]"));
    });

    if (vnode.type === "select" && props.value !== undefined) {
      el.value = String(props.value);
    }
    return el;
  }

  function performRender() {
    if (!rootContainer || !rootComponent) return;
    // 保存焦點欄位狀態以支援流暢輸入
    const active = document.activeElement;
    let focusInfo = null;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      const allInputs = Array.from(rootContainer.querySelectorAll("input, textarea"));
      const idx = allInputs.indexOf(active);
      if (idx !== -1) {
        focusInfo = {
          idx,
          start: active.selectionStart,
          end: active.selectionEnd,
          type: active.type
        };
      }
    }

    currentPath = "root";
    hookIndex = 0;
    const tree = createDomNode(createElement(rootComponent, null), "root");
    rootContainer.innerHTML = "";
    rootContainer.appendChild(tree);

    if (focusInfo) {
      const newInputs = Array.from(rootContainer.querySelectorAll("input, textarea"));
      const target = newInputs[focusInfo.idx];
      if (target) {
        target.focus();
        try {
          if (focusInfo.start !== null && target.type !== "number" && target.type !== "checkbox") {
            target.setSelectionRange(focusInfo.start, focusInfo.end);
          }
        } catch (e) {}
      }
    }
  }

  const React = { createElement, useState, useEffect };
  const ReactDOM = {
    createRoot(container) {
      rootContainer = container;
      return {
        render(element) {
          rootComponent = typeof element.type === "function" ? element.type : () => element;
          performRender();
        }
      };
    }
  };

  global.React = React;
  global.useState = useState;
  global.useEffect = useEffect;
  global.ReactDOM = ReactDOM;
})(window);
"""


def build_spa() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    component_files = [
        SRC_DIR / "components" / "SlideOverDrawer.jsx",
        SRC_DIR / "components" / "Stage1CertificationCoach.jsx",
        SRC_DIR / "components" / "Stage2LifecycleNavigator.jsx",
        SRC_DIR / "components" / "Stage3AuditInvestigator.jsx",
        SRC_DIR / "App.jsx",
    ]

    compiled_parts: List[str] = [
        "// GovPro V2.0 Pre-compiled SPA Bundle (Zero External Network Dependencies)",
        REACT_LITE_RUNTIME_JS.strip(),
    ]

    for comp_path in component_files:
        raw_jsx = comp_path.read_text(encoding="utf-8")
        compiled_js = transpile_jsx_source(raw_jsx)
        compiled_parts.append(f"\n// --- Compiled from {comp_path.name} ---\n" + compiled_js)

    compiled_parts.append(
        "\n// --- Mount Application ---\n"
        "document.addEventListener('DOMContentLoaded', function() {\n"
        "  const rootEl = document.getElementById('root');\n"
        "  if (rootEl) {\n"
        "    ReactDOM.createRoot(rootEl).render(React.createElement(App, null));\n"
        "  }\n"
        "});\n"
    )

    bundle_path = ASSETS_DIR / "app.bundle.js"
    bundle_path.write_text("\n".join(compiled_parts), encoding="utf-8")

    css_src = SRC_DIR / "styles" / "executive.css"
    css_dst = ASSETS_DIR / "executive.css"
    css_dst.write_text(css_src.read_text(encoding="utf-8"), encoding="utf-8")

    index_html = """<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>政府採購AI領航員平台 V2.0 (三階段漸進式領航架構)</title>
  <link rel="stylesheet" href="/assets/executive.css" />
</head>
<body>
  <div id="root"></div>
  <script src="/assets/app.bundle.js"></script>
</body>
</html>
"""
    (DIST_DIR / "index.html").write_text(index_html, encoding="utf-8")
    print(f"[OK] Built SPA bundle: {bundle_path} ({bundle_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    build_spa()
