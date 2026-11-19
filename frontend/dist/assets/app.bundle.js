// GovPro V2.0 Pre-compiled SPA Bundle (Zero External Network Dependencies)
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
        const isTextInput = (vnode.type === "input" && props.type !== "file" && props.type !== "checkbox" && props.type !== "radio") || vnode.type === "textarea";
        el.addEventListener(evt === "change" && isTextInput ? "input" : evt, v);
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

// --- Compiled from SlideOverDrawer.jsx ---

function SlideOverDrawer({ isOpen, onClose, drawerData }) {
  const [activeTab, setActiveTab] = useState('laws');

  const lawCards = (drawerData && drawerData.law_cards) ? drawerData.law_cards : [];
  const citations = (drawerData && drawerData.textbook_citations) ? drawerData.textbook_citations : [];
  const topology = (drawerData && drawerData.agent_topology) ? drawerData.agent_topology : { nodes: [], edges: [], execution_trace: [] };
  const traceList = topology.execution_trace || [];

  return (
    React.createElement("div", { "className": (isOpen ? "drawer-backdrop open" : "drawer-backdrop"), "onClick": (onClose) }, React.createElement("aside", { "className": (isOpen ? "slide-over-drawer open" : "slide-over-drawer"), "onClick": ((e) => e.stopPropagation()), "aria-label": "法規溯源與 AI 代理軌跡抽屜" }, React.createElement("div", { "className": "drawer-header" }, React.createElement("div", null, React.createElement("span", { "className": "drawer-eyebrow" }, "LEGAL PROVENANCE & LANGGRAPH TRACE"), React.createElement("h2", { "className": "drawer-title" }, "📚 法規溯源與 AI 代理軌跡抽屜")), React.createElement("button", { "className": "btn-drawer-close", "onClick": (onClose), "title": "收合抽屜" }, "✕ 收合")), React.createElement("div", { "className": "drawer-tabs" }, React.createElement("button", { "className": (activeTab === 'laws' ? 'drawer-tab active' : 'drawer-tab'), "onClick": (() => setActiveTab('laws')) }, "⚖️ 母法×細則對照 (", (lawCards.length), ")"), React.createElement("button", { "className": (activeTab === 'citations' ? 'drawer-tab active' : 'drawer-tab'), "onClick": (() => setActiveTab('citations')) }, "📖 教材出處頁碼 (", (citations.length), ")"), React.createElement("button", { "className": (activeTab === 'topology' ? 'drawer-tab active' : 'drawer-tab'), "onClick": (() => setActiveTab('topology')) }, "🕸️ LangGraph 拓撲圖")), React.createElement("div", { "className": "drawer-body" }, (activeTab === 'laws' && (
            React.createElement("div", { "className": "drawer-section" }, React.createElement("div", { "className": "drawer-section-intro" }, "同步對照《政府採購法》母法主文與《施行細則／相關子法》及 115 年最新修法重點："), (lawCards.map((card, idx) => (
                React.createElement("div", { "key": (card.article_no || idx), "className": "drawer-law-card" }, React.createElement("div", { "className": "drawer-law-card-header" }, React.createElement("span", { "className": "badge-navy" }, (card.article_no)), React.createElement("strong", { "className": "drawer-law-card-title" }, (card.title)), React.createElement("span", { "className": "badge-amber" }, (card.textbook_page))), React.createElement("div", { "className": "drawer-dual-columns" }, React.createElement("div", { "className": "drawer-col mother-col" }, React.createElement("div", { "className": "col-label" }, "《政府採購法》母法主文"), React.createElement("p", { "className": "col-text" }, (card.mother_law))), React.createElement("div", { "className": "drawer-col rule-col" }, React.createElement("div", { "className": "col-label" }, "《", (card.enforcement_rule_no), "》"), React.createElement("p", { "className": "col-text" }, (card.enforcement_rule)))), React.createElement("div", { "className": "drawer-commentary-box" }, React.createElement("strong", null, "💡 工程會教材精解："), React.createElement("span", null, (card.textbook_commentary))))
              ))))
          )), (activeTab === 'citations' && (
            React.createElement("div", { "className": "drawer-section" }, React.createElement("div", { "className": "drawer-section-intro" }, "工程會採購專業人員基礎／進階訓練標準教材出處頁碼與核心考點索引："), (citations.map((cit, idx) => (
                React.createElement("div", { "key": (idx), "className": "citation-item-card" }, React.createElement("div", { "className": "citation-header" }, React.createElement("span", { "className": "badge-emerald" }, (cit.article_no), " — ", (cit.title)), React.createElement("span", { "className": "citation-page-tag" }, "📄 ", (cit.page))), React.createElement("p", { "className": "citation-highlight" }, (cit.highlight)))
              ))))
          )), (activeTab === 'topology' && (
            React.createElement("div", { "className": "drawer-section" }, React.createElement("div", { "className": "drawer-section-intro" }, "LangGraph 多代理狀態圖（StateGraph）即時調度拓撲與節點執行軌跡："), React.createElement("div", { "className": "topology-flow-container" }, (traceList.map((step, idx) => (
                  React.createElement("div", { "key": (step.node_id || idx), "className": "topology-node-wrapper" }, React.createElement("div", { "className": "topology-node-card" }, React.createElement("div", { "className": "topology-node-top" }, React.createElement("span", { "className": "topology-step-num" }, "STEP ", (idx + 1)), React.createElement("span", { "className": "topology-node-name" }, (step.node_label)), React.createElement("span", { "className": "badge-emerald" }, (step.status), " (", (step.latency_ms || 0.5), " ms)")), React.createElement("div", { "className": "topology-node-detail" }, (step.detail))), (idx !== traceList.length - 1 && (
                      React.createElement("div", { "className": "topology-connector" }, "⬇ StateGraph Edge")
                    )))
                )))))
          )))))
  );
}

// --- Compiled from Stage1CertificationCoach.jsx ---

function Stage1CertificationCoach({ onOpenDrawerWithLaw }) {
  const [subTab, setSubTab] = useState('courses');
  const [courseLevel, setCourseLevel] = useState('basic');
  const [trainingModules, setTrainingModules] = useState({ basic: [], advanced: [] });
  const [lawsList, setLawsList] = useState([]);
  const [lawSearchQuery, setLawSearchQuery] = useState('');
  const [quizBank, setQuizBank] = useState({ basic: [], advanced: [] });
  const [quizLevel, setQuizLevel] = useState('basic');
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    fetch('/api/stage1/overview')
      .then((r) => r.json())
      .then((data) => {
        if (data.training_modules) setTrainingModules(data.training_modules);
        if (data.laws) setLawsList(data.laws);
        if (data.quiz_bank) setQuizBank(data.quiz_bank);
      })
      .catch((err) => console.error('Stage 1 overview fetch error:', err));
  }, []);

  const handleLawSearch = (qText) => {
    setLawSearchQuery(qText);
    fetch('/api/stage1/laws?q=' + encodeURIComponent(qText))
      .then((r) => r.json())
      .then((data) => {
        if (data.results) setLawsList(data.results);
      })
      .catch((err) => console.error('Law search error:', err));
  };

  const handleSelectOption = (qid, optIdx) => {
    const next = Object.assign({}, userAnswers);
    next[qid] = optIdx;
    setUserAnswers(next);
  };

  const handleGradeQuiz = () => {
    fetch('/api/stage1/quiz/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: quizLevel, answers: userAnswers }),
    })
      .then((r) => r.json())
      .then((res) => setQuizResult(res))
      .catch((err) => console.error('Quiz grade error:', err));
  };

  const handleDemoFillQuiz = () => {
    const currentQuestions = quizBank[quizLevel] || [];
    const next = {};
    currentQuestions.forEach((q, idx) => {
      // 故意讓最後一題選錯以展示「錯題法條依據與詳解」功能
      next[q.id] = idx === currentQuestions.length - 1 ? 0 : q.answer_index;
    });
    setUserAnswers(next);
    fetch('/api/stage1/quiz/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: quizLevel, answers: next }),
    })
      .then((r) => r.json())
      .then((res) => setQuizResult(res));
  };

  const currentCourses = trainingModules[courseLevel] || [];
  const currentQuestions = quizBank[quizLevel] || [];
  const quickLawTags = [
    { label: '第15條 二親等迴避', q: '第15條' },
    { label: '第26條 規格與同等品', q: '第26條' },
    { label: '第31條 押標金5年時效', q: '第31條' },
    { label: '第34條 115.7.1公開閱覽', q: '第34條' },
    { label: '第50條 重大異常關聯', q: '第50條' },
    { label: '第58條 總標價偏低', q: '第58條' },
    { label: '第70條之1 職安衛量化', q: '第70條之1' },
    { label: '第73條之1 15日付款', q: '第73條之1' },
    { label: '第94條 評選委員公開', q: '第94條' },
    { label: '第95條 150萬專業人員', q: '第95條' },
    { label: '第101條 停權審查小組', q: '第101條' },
  ];

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("div", { "className": "stage-hero-banner navy-theme" }, React.createElement("div", { "className": "stage-hero-left" }, React.createElement("span", { "className": "stage-badge-pill" }, "STAGE 1 · CERTIFICATION & LEGAL MASTERY"), React.createElement("h1", { "className": "stage-main-title" }, "🎓 階段一：考證培訓賦能（採購專業人員基礎／進階認證教練）"), React.createElement("p", { "className": "stage-subtitle" }, "依循工程會 115 年最新標準教材，整合「基礎與進階章節精讀」、「母法×施行細則雙欄同步對照」及「AI 模擬認證測驗室」。")), React.createElement("div", { "className": "stage-subnav-pills" }, React.createElement("button", { "className": (subTab === 'courses' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('courses')) }, "📘 課程知識導覽"), React.createElement("button", { "className": (subTab === 'crossref' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('crossref')) }, "⚖️ 母法 × 施行細則雙欄對照檢索"), React.createElement("button", { "className": (subTab === 'quiz' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('quiz')) }, "📝 AI 模擬認證測驗室"))), (subTab === 'courses' && (
        React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "📘 採購專業人員「基礎訓練 vs 進階訓練」章節精讀卡片"), React.createElement("p", { "className": "section-desc" }, "涵蓋 115 年最新門檻（150萬公告／15萬小額／5000萬&1000萬查核公開閱覽／土木包工業720萬／再生AC 20%&60%刨用平衡）核心考點。")), React.createElement("div", { "className": "segmented-toggle" }, React.createElement("button", { "className": (courseLevel === 'basic' ? 'seg-btn active' : 'seg-btn'), "onClick": (() => setCourseLevel('basic')) }, "基礎訓練（3大核心章節）"), React.createElement("button", { "className": (courseLevel === 'advanced' ? 'seg-btn active' : 'seg-btn'), "onClick": (() => setCourseLevel('advanced')) }, "進階訓練（5大實務研討）"))), React.createElement("div", { "className": "course-cards-grid" }, (currentCourses.map((mod) => (
              React.createElement("div", { "key": (mod.id), "className": "course-module-card" }, React.createElement("div", { "className": "course-card-top" }, React.createElement("span", { "className": "badge-navy" }, (mod.category)), React.createElement("span", { "className": "badge-amber" }, "時數 ", (mod.hours), " · ", (mod.badge))), React.createElement("h3", { "className": "course-card-title" }, (mod.title)), React.createElement("div", { "className": "course-textbook-tag" }, "📖 教材出處：", (mod.textbook_ref)), React.createElement("p", { "className": "course-summary" }, (mod.summary)), React.createElement("ul", { "className": "course-keypoints-list" }, ((mod.key_points || []).map((pt, i) => (
                    React.createElement("li", { "key": (i) }, (pt))
                  )))), React.createElement("div", { "className": "course-related-footer" }, React.createElement("span", { "className": "related-label" }, "關聯重點條文（點擊開啟雙欄對照）："), React.createElement("div", { "className": "related-chips" }, ((mod.related_articles || []).map((artNo) => (
                      React.createElement("button", { "key": (artNo), "className": "chip-btn", "onClick": (() => {
                          setSubTab('crossref');
                          handleLawSearch(artNo);
                          if (onOpenDrawerWithLaw) onOpenDrawerWithLaw(artNo);
                        }) }, (artNo))
                    ))))))
            )))))
      )), (subTab === 'crossref' && (
        React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "⚖️ 《政府採購法》母法 × 《施行細則》雙欄同步對照檢索"), React.createElement("p", { "className": "section-desc" }, "輸入條號或關鍵字（如「第15條」、「第31條」、「第101條」、「公開閱覽」、「二親等」），左右雙欄即時對照母法、施行細則與教材釋義。"))), React.createElement("div", { "className": "search-bar-container" }, React.createElement("input", { "type": "text", "className": "law-search-input", "placeholder": "🔍 請輸入條號或關鍵字（例如：第15條、第31條、第101條、二親等、押標金5年、公開閱覽）...", "value": (lawSearchQuery), "onChange": ((e) => handleLawSearch(e.target.value)) }), React.createElement("button", { "className": "btn-secondary", "onClick": (() => handleLawSearch('')) }, "顯示全部核心條文")), React.createElement("div", { "className": "quick-tags-bar" }, (quickLawTags.map((item) => (
              React.createElement("button", { "key": (item.q), "className": (lawSearchQuery === item.q ? 'chip-btn active' : 'chip-btn'), "onClick": (() => handleLawSearch(item.q)) }, (item.label))
            )))), React.createElement("div", { "className": "dual-law-list" }, (lawsList.map((law) => (
              React.createElement("div", { "key": (law.article_no), "className": "dual-law-card" }, React.createElement("div", { "className": "dual-law-header" }, React.createElement("div", { "className": "dual-law-title-group" }, React.createElement("span", { "className": "badge-navy-lg" }, (law.article_no)), React.createElement("h3", { "className": "dual-law-title" }, (law.title))), React.createElement("div", { "className": "dual-law-meta" }, React.createElement("span", { "className": "badge-amber" }, "📄 ", (law.textbook_page)), React.createElement("button", { "className": "btn-outline-sm", "onClick": (() => onOpenDrawerWithLaw && onOpenDrawerWithLaw(law.article_no)) }, "收納至右側溯源抽屜 ➔"))), React.createElement("div", { "className": "dual-law-grid" }, React.createElement("div", { "className": "law-pane mother-law-pane" }, React.createElement("div", { "className": "pane-title-bar navy-bar" }, "🏛️ 《政府採購法》母法主文（", (law.article_no), "）"), React.createElement("pre", { "className": "law-pre-text" }, (law.mother_law))), React.createElement("div", { "className": "law-pane rule-law-pane" }, React.createElement("div", { "className": "pane-title-bar emerald-bar" }, "📑 《施行細則／相關子法解釋令》（", (law.enforcement_rule_no), "）"), React.createElement("pre", { "className": "law-pre-text" }, (law.enforcement_rule)))), React.createElement("div", { "className": "law-textbook-note" }, React.createElement("span", { "className": "note-badge" }, "🎓 工程會教材逐條說明與修法重點"), React.createElement("p", { "className": "note-body" }, (law.textbook_commentary))))
            )))))
      )), (subTab === 'quiz' && (
        React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "📝 AI 模擬認證測驗室（即時批改計分 × 錯題法條詳解）"), React.createElement("p", { "className": "section-desc" }, "支援切換「基礎認證模擬考（及格門檻70分）」與「進階認證模擬考」，作答後即時批改並顯示錯題母法依據與詳解。")), React.createElement("div", { "className": "segmented-toggle" }, React.createElement("button", { "className": (quizLevel === 'basic' ? 'seg-btn active' : 'seg-btn'), "onClick": (() => {
                  setQuizLevel('basic');
                  setQuizResult(null);
                  setUserAnswers({});
                }) }, "基礎認證模擬考"), React.createElement("button", { "className": (quizLevel === 'advanced' ? 'seg-btn active' : 'seg-btn'), "onClick": (() => {
                  setQuizLevel('advanced');
                  setQuizResult(null);
                  setUserAnswers({});
                }) }, "進階認證模擬考"))), React.createElement("div", { "className": "quiz-action-toolbar" }, React.createElement("button", { "className": "btn-primary", "onClick": (handleGradeQuiz) }, "✅ 立即交卷批改計分"), React.createElement("button", { "className": "btn-secondary", "onClick": (handleDemoFillQuiz) }, "⚡ 一鍵載入示範作答（含錯題詳解演練）")), (quizResult && (
            React.createElement("div", { "className": (quizResult.passed ? 'quiz-score-banner pass' : 'quiz-score-banner fail') }, React.createElement("div", { "className": "score-main" }, React.createElement("span", { "className": "score-number" }, (quizResult.score), " 分"), React.createElement("span", { "className": "score-status" }, (quizResult.passed ? '🎉 恭喜通過認證標準（≥70分）！' : '⚠️ 未達及格標準（70分），請檢視下方錯題法條詳解'))), React.createElement("div", { "className": "score-detail" }, "測驗級別：", (quizResult.level_title), " ｜ 答對題數：", (quizResult.correct_count), " / ", (quizResult.total_questions), "題"))
          )), React.createElement("div", { "className": "quiz-questions-list" }, (currentQuestions.map((q, qIdx) => {
              const gradedItem = quizResult
                ? (quizResult.graded_items || []).find((g) => g.id === q.id)
                : null;
              return (
                React.createElement("div", { "key": (q.id), "className": "quiz-question-card" }, React.createElement("div", { "className": "quiz-q-header" }, React.createElement("span", { "className": "badge-navy" }, "第 ", (qIdx + 1), " 題"), React.createElement("p", { "className": "quiz-q-text" }, (q.question))), React.createElement("div", { "className": "quiz-options-grid" }, ((q.options || []).map((optText, optIdx) => {
                      const isSelected = userAnswers[q.id] === optIdx;
                      let optClass = isSelected ? 'quiz-option selected' : 'quiz-option';
                      if (gradedItem) {
                        if (optIdx === gradedItem.correct_answer_index) {
                          optClass = 'quiz-option correct';
                        } else if (isSelected && !gradedItem.is_correct) {
                          optClass = 'quiz-option wrong';
                        }
                      }
                      return (
                        React.createElement("button", { "key": (optIdx), "type": "button", "className": (optClass), "onClick": (() => handleSelectOption(q.id, optIdx)) }, (optText))
                      );
                    }))), (gradedItem && (
                    React.createElement("div", { "className": (gradedItem.is_correct ? 'quiz-explanation-box ok' : 'quiz-explanation-box err') }, React.createElement("div", { "className": "exp-title" }, (gradedItem.is_correct ? '✔️ 作答正確！' : '❌ 錯題診斷與法條依據'), " — ", React.createElement("strong", null, (gradedItem.law_ref))), React.createElement("p", { "className": "exp-text" }, (gradedItem.explanation)))
                  )))
              );
            }))))
      )))
  );
}

// --- Compiled from Stage2LifecycleNavigator.jsx ---

function Stage2LifecycleNavigator({ onUpdateDrawer }) {
  const [lifecycleStages, setLifecycleStages] = useState([]);
  const [selectedStageNo, setSelectedStageNo] = useState(1);
  const [checkedItems, setCheckedItems] = useState({});
  const [aiQuery, setAiQuery] = useState('經濟部辦理 4.5 億元水利工程，基本設計是否須送工程會審議？是否應成立採購工作及審查小組？');
  const [aiResult, setAiResult] = useState(null);
  const [activeCalc, setActiveCalc] = useState('calc1');

  // Calculator 1 State (門檻與 GPA/招決標配對器)
  const [c1Amount, setC1Amount] = useState(55000000);
  const [c1Category, setC1Category] = useState('engineering');
  const [c1Entity, setC1Entity] = useState('central');
  const [c1Ministry, setC1Ministry] = useState('moi_moea_moa');
  const [c1ElecNotice, setC1ElecNotice] = useState(true);
  const [c1ElecDoc, setC1ElecDoc] = useState(true);
  const [c1ElecBid, setC1ElecBid] = useState(true);
  const [c1Result, setC1Result] = useState(null);

  // Calculator 2 State (工程資格與三級品管核算器)
  const [c2Budget, setC2Budget] = useState(6800000);
  const [c2Height, setC2Height] = useState(0);
  const [c2Depth, setC2Depth] = useState(0);
  const [c2Span, setC2Span] = useState(4);
  const [c2Road, setC2Road] = useState(true);
  const [c2Result, setC2Result] = useState(null);

  // Calculator 3 State (物價指數三層級 & 實作數量 3%/30%)
  const [c3Valuation, setC3Valuation] = useState(10000000);
  const [c3IndPct, setC3IndPct] = useState(14.0);
  const [c3IndAmt, setC3IndAmt] = useState(3000000);
  const [c3CatPct, setC3CatPct] = useState(7.0);
  const [c3CatAmt, setC3CatAmt] = useState(4000000);
  const [c3GenPct, setC3GenPct] = useState(3.5);
  const [c3AdvRatio, setC3AdvRatio] = useState(0.10);
  const [c3ContractQty, setC3ContractQty] = useState(1000);
  const [c3ActualQty, setC3ActualQty] = useState(1350);
  const [c3UnitPrice, setC3UnitPrice] = useState(1000);
  const [c3ExcessPrice, setC3ExcessPrice] = useState(950);
  const [c3Result, setC3Result] = useState(null);

  // Calculator 4 State (契約變更累計 |加帳|+|減帳| & 第58條偏低標決策樹)
  const [c4OrigAmt, setC4OrigAmt] = useState(40000000);
  const [c4AddAmt, setC4AddAmt] = useState(8000000);
  const [c4DedAmt, setC4DedAmt] = useState(4000000);
  const [c4PrevCum, setC4PrevCum] = useState(0);
  const [c4Estimate, setC4Estimate] = useState(50000000);
  const [c4LowestBid, setC4LowestBid] = useState(33000000);
  const [c4Reasonable, setC4Reasonable] = useState(false);
  const [c4Result, setC4Result] = useState(null);

  useEffect(() => {
    fetch('/api/stage2/lifecycle')
      .then((r) => r.json())
      .then((data) => {
        if (data.stages) setLifecycleStages(data.stages);
      });
    runCalc1(55000000, 'engineering', 'central', 'moi_moea_moa', true, true, true);
    runCalc2(6800000, 0, 0, 4, true);
    runCalc3(10000000, 14.0, 3000000, 7.0, 4000000, 3.5, 0.10, 1000, 1350, 1000, 950);
    runCalc4(40000000, 8000000, 4000000, 0, 50000000, 33000000, false);
  }, []);

  const runAiAssistant = (qText) => {
    const targetQ = qText || aiQuery;
    setAiQuery(targetQ);
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: targetQ, stage: 'stage2' }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAiResult(data);
        if (onUpdateDrawer) {
          onUpdateDrawer({
            law_cards: data.law_cards,
            textbook_citations: data.textbook_citations,
            agent_topology: data.agent_topology,
          });
        }
      });
  };

  const runCalc1 = (amt, cat, ent, min, en, ed, eb) => {
    fetch('/api/stage2/calc/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_twd: Number(amt),
        category: cat,
        entity_type: ent,
        ministry_type: min,
        has_electronic_notice: Boolean(en),
        has_electronic_doc: Boolean(ed),
        has_electronic_bid: Boolean(eb),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC1Result(res));
  };

  const runCalc2 = (bud, h, d, s, road) => {
    fetch('/api/stage2/calc/engineering-qc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget_twd: Number(bud),
        building_height_m: Number(h),
        excavation_depth_m: Number(d),
        bridge_span_m: Number(s),
        is_road_work: Boolean(road),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC2Result(res));
  };

  const runCalc3 = (val, indP, indA, catP, catA, genP, advR, cQty, aQty, uPrice, exPrice) => {
    fetch('/api/stage2/calc/price-settlement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_valuation_amount: Number(val),
        individual_index_change_pct: Number(indP),
        individual_item_weight_amount: Number(indA),
        category_index_change_pct: Number(catP),
        category_item_weight_amount: Number(catA),
        general_index_change_pct: Number(genP),
        deduct_advance_payment_ratio: Number(advR),
        contract_item_qty: Number(cQty),
        actual_item_qty: Number(aQty),
        contract_unit_price: Number(uPrice),
        negotiated_excess_unit_price: Number(exPrice),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC3Result(res));
  };

  const runCalc4 = (orig, add, ded, prev, est, low, reas) => {
    fetch('/api/stage2/calc/contract-change-art58', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_contract_amount_twd: Number(orig),
        addition_amount_twd: Number(add),
        deduction_amount_twd: Number(ded),
        previous_cumulative_change_twd: Number(prev),
        government_estimate_twd: Number(est),
        lowest_bid_twd: Number(low),
        agency_deems_reasonable: Boolean(reas),
      }),
    })
      .then((r) => r.json())
      .then((res) => setC4Result(res));
  };

  const currentStage =
    lifecycleStages.find((s) => s.stage_no === selectedStageNo) || lifecycleStages[0] || null;

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("div", { "className": "stage-hero-banner emerald-theme" }, React.createElement("div", { "className": "stage-hero-left" }, React.createElement("span", { "className": "stage-badge-pill" }, "STAGE 2 · LIFECYCLE & PRECISION CALCULATORS"), React.createElement("h1", { "className": "stage-main-title" }, "🧭 階段二：採購實務領航（全生命週期五階段智慧辦案助理）"), React.createElement("p", { "className": "stage-subtitle" }, "配置「全生命週期五階段互動切換軸」與「115年新制採購實務四大精算器」，一次完成門檻判別、營造業資格、物調實作結算與第58條決策。"))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🔄 全生命週期五階段導航器（1.計畫 ➔ 2.規劃設計 ➔ 3.招標決標 ➔ 4.履約驗收 ➔ 5.維護營運）"), React.createElement("p", { "className": "section-desc" }, "點選任一階段即展開該階段法定必備檢核表與 LangGraph 智慧辦案問答助手。"))), React.createElement("div", { "className": "lifecycle-stepper-bar" }, (lifecycleStages.map((stg) => (
            React.createElement("button", { "key": (stg.id), "className": (stg.stage_no === selectedStageNo ? 'lifecycle-step-btn active' : 'lifecycle-step-btn'), "onClick": (() => setSelectedStageNo(stg.stage_no)) }, React.createElement("span", { "className": "lc-icon" }, (stg.icon)), React.createElement("div", { "className": "lc-text-box" }, React.createElement("div", { "className": "lc-title" }, (stg.title)), React.createElement("div", { "className": "lc-sub" }, (stg.textbook_ref))))
          )))), (currentStage && (
          React.createElement("div", { "className": "lifecycle-detail-grid" }, React.createElement("div", { "className": "lc-checklist-panel" }, React.createElement("div", { "className": "panel-subtitle-bar" }, React.createElement("span", null, (currentStage.icon), " ", (currentStage.title), " — 必備法定檢核表"), React.createElement("span", { "className": "badge-amber" }, (currentStage.textbook_ref))), React.createElement("p", { "className": "lc-mission-text" }, (currentStage.core_mission)), React.createElement("div", { "className": "checklist-items" }, ((currentStage.checklist || []).map((chk, idx) => {
                  const key = currentStage.id + '-' + idx;
                  const isChecked = Boolean(checkedItems[key]);
                  return (
                    React.createElement("label", { "key": (key), "className": (isChecked ? 'chk-card checked' : 'chk-card') }, React.createElement("input", { "type": "checkbox", "checked": (isChecked), "onChange": (() => {
                          const next = Object.assign({}, checkedItems);
                          next[key] = !isChecked;
                          setCheckedItems(next);
                        }) }), React.createElement("div", { "className": "chk-body" }, React.createElement("div", { "className": "chk-top" }, React.createElement("strong", null, (chk.item)), React.createElement("span", { "className": (chk.risk_level === 'HIGH' ? 'badge-red' : 'badge-navy') }, (chk.risk_level === 'HIGH' ? '強制重點' : '核心檢核'))), React.createElement("p", { "className": "chk-rule" }, (chk.rule))))
                  );
                })))), React.createElement("div", { "className": "lc-assistant-panel" }, React.createElement("div", { "className": "panel-subtitle-bar" }, React.createElement("span", null, "🤖 階段智慧辦案問答助手（LangGraph 多代理協同）")), React.createElement("div", { "className": "quick-prompts-box" }, React.createElement("span", { "className": "small-label" }, "本階段常見實務提問（點擊立即診斷）："), ((currentStage.quick_prompts || []).map((qp, idx) => (
                  React.createElement("button", { "key": (idx), "className": "prompt-pill-btn", "onClick": (() => runAiAssistant(qp)) }, "💬", (qp))
                )))), React.createElement("div", { "className": "ai-input-row" }, React.createElement("input", { "type": "text", "className": "law-search-input", "value": (aiQuery), "onChange": ((e) => setAiQuery(e.target.value)), "placeholder": "輸入採購辦案問題（例如：預算680萬道路工程可否限丙等營造業？）..." }), React.createElement("button", { "className": "btn-primary", "onClick": (() => runAiAssistant(aiQuery)) }, "🚀 領航診斷")), (aiResult && (
                React.createElement("div", { "className": "ai-response-card" }, React.createElement("pre", { "className": "ai-markdown-pre" }, (aiResult.answer_markdown)))
              ))))
        ))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🧮 採購實務四大精算器（115年最新法規硬編碼引擎）"), React.createElement("p", { "className": "section-desc" }, "一鍵切換四大精算工作台，即時驗算 GPA/ASTEP 等標期、720萬土木包工業與三級品管、物調10%/5%/2.5%與實作數量3%/30%、契約變更累計與第58條決策樹。"))), React.createElement("div", { "className": "calc-tabs-bar" }, React.createElement("button", { "className": (activeCalc === 'calc1' ? 'calc-tab-btn active' : 'calc-tab-btn'), "onClick": (() => setActiveCalc('calc1')) }, "(1) 門檻與 GPA／招決標配對器"), React.createElement("button", { "className": (activeCalc === 'calc2' ? 'calc-tab-btn active' : 'calc-tab-btn'), "onClick": (() => setActiveCalc('calc2')) }, "(2) 工程資格與三級品管核算器"), React.createElement("button", { "className": (activeCalc === 'calc3' ? 'calc-tab-btn active' : 'calc-tab-btn'), "onClick": (() => setActiveCalc('calc3')) }, "(3) 物價指數三層級＆實作數量結算器"), React.createElement("button", { "className": (activeCalc === 'calc4' ? 'calc-tab-btn active' : 'calc-tab-btn'), "onClick": (() => setActiveCalc('calc4')) }, "(4) 契約變更累計＆第58條偏低標決策樹")), (activeCalc === 'calc1' && (
          React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "🔢 輸入採購金額與機關／標案屬性"), React.createElement("div", { "className": "preset-buttons-row" }, React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC1Amount(120000); runCalc1(120000, 'property', 'central', 'other', true, true, false); }) }, "12萬 小額採購"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC1Amount(4500000); setC1Category('property'); runCalc1(4500000, 'property', 'central', 'other', true, true, true); }) }, "450萬 中央財物 (適用ASTEP 419萬)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC1Amount(55000000); setC1Category('engineering'); runCalc1(55000000, 'engineering', 'central', 'other', true, true, true); }) }, "5,500萬 查核工程 (115.7.1公開閱覽)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC1Amount(220000000); setC1Category('engineering'); runCalc1(220000000, 'engineering', 'central', 'moi_moea_moa', true, true, true); }) }, "2.2億 巨額工程 (GPA 2億974萬)")), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "採購預算／預計金額（新臺幣元）："), React.createElement("input", { "type": "number", "value": (c1Amount), "onChange": ((e) => {
                    setC1Amount(e.target.value);
                    runCalc1(e.target.value, c1Category, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                  }) })), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "採購標的性質："), React.createElement("select", { "value": (c1Category), "onChange": ((e) => {
                      setC1Category(e.target.value);
                      runCalc1(c1Amount, e.target.value, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                    }) }, React.createElement("option", { "value": "engineering" }, "工程採購（查核5,000萬／巨額2億／GPA 2億974萬）"), React.createElement("option", { "value": "property" }, "財物採購（查核5,000萬／巨額1億／GPA中央545萬）"), React.createElement("option", { "value": "service" }, "勞務採購（查核1,000萬／巨額2,000萬／ASTEP中央419萬）"))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "機關層級（條約門檻判別）："), React.createElement("select", { "value": (c1Entity), "onChange": ((e) => {
                      setC1Entity(e.target.value);
                      runCalc1(c1Amount, c1Category, e.target.value, c1Ministry, c1ElecNotice, c1ElecDoc, c1ElecBid);
                    }) }, React.createElement("option", { "value": "central" }, "中央機關（GPA 545萬 / ASTEP 419萬）"), React.createElement("option", { "value": "local_tp_ks" }, "臺北市／高雄市（GPA & ASTEP 838萬）"), React.createElement("option", { "value": "local_4cities" }, "新北／臺中／臺南／桃園四都（ASTEP 838萬）"), React.createElement("option", { "value": "other_entity" }, "國營事業／國立大學／醫院（GPA & ASTEP 1,677萬）"), React.createElement("option", { "value": "overseas" }, "駐外機構（採購專業人員門檻 300萬）")))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "所屬部會（工程基本設計送工程會審議門檻）："), React.createElement("select", { "value": (c1Ministry), "onChange": ((e) => {
                    setC1Ministry(e.target.value);
                    runCalc1(c1Amount, c1Category, c1Entity, e.target.value, c1ElecNotice, c1ElecDoc, c1ElecBid);
                  }) }, React.createElement("option", { "value": "motc" }, "交通部（10億元以上送工程會審議）"), React.createElement("option", { "value": "moi_moea_moa" }, "內政部／經濟部／農業部（4億元以上送工程會審議）"), React.createElement("option", { "value": "mnd_classified" }, "國防部機密戰備工程（10億元以上）"), React.createElement("option", { "value": "other" }, "其他部會（1億元以上送工程會審議）"))), React.createElement("div", { "className": "checkbox-inline-group" }, React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (c1ElecNotice), "onChange": ((e) => {
                      setC1ElecNotice(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, e.target.checked, c1ElecDoc, c1ElecBid);
                    }) }), "網路招標公告(GPA -5日)"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (c1ElecDoc), "onChange": ((e) => {
                      setC1ElecDoc(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, c1ElecNotice, e.target.checked, c1ElecBid);
                    }) }), "電子領標(GPA -5日)"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (c1ElecBid), "onChange": ((e) => {
                      setC1ElecBid(e.target.checked);
                      runCalc1(c1Amount, c1Category, c1Entity, c1Ministry, c1ElecNotice, c1ElecDoc, e.target.checked);
                    }) }), "電子投標(GPA -5日)"))), (c1Result && (
              React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 115年新制門檻、GPA/ASTEP 與等標期精算結果"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "法定級距定位"), React.createElement("strong", { "className": "kpi-val" }, (c1Result.tier_name))), React.createElement("div", { "className": "kpi-box emerald" }, React.createElement("span", { "className": "kpi-label" }, "法定最低等標期"), React.createElement("strong", { "className": "kpi-val" }, (c1Result.bidding_period_days), " 日曆天"))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "📌 招決標程序規定："), React.createElement("p", null, (c1Result.tendering_rule))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "👁️ 115.7.1 公開閱覽新制："), React.createElement("p", null, (c1Result.public_inspection_note))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🌐 國際條約協定（1 SDR = ", (c1Result.sdr_rate), " 元）："), React.createElement("ul", null, ((c1Result.treaty_summary || []).map((t, i) => (
                        React.createElement("li", { "key": (i) }, (t))
                      ))))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⏱️ 等標期計算明細："), React.createElement("p", null, (c1Result.bidding_period_detail))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🎓 第95條採購專業人員＆第94條評選委員會："), React.createElement("p", null, (c1Result.specialist_note)), React.createElement("p", null, (c1Result.evaluation_committee_rule)))))
            )))
        )), (activeCalc === 'calc2' && (
          React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "🏗️ 輸入工程規模、預算與道路 AC 屬性"), React.createElement("div", { "className": "preset-buttons-row" }, React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC2Budget(6800000); setC2Height(0); setC2Depth(0); setC2Span(4); runCalc2(6800000, 0, 0, 4, true); }) }, "680萬 地方道路 (土木包工業 ≤ 720萬)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC2Budget(21000000); setC2Height(18); setC2Depth(5); setC2Span(12); runCalc2(21000000, 18, 5, 12, false); }) }, "2,100萬 建築工程 (丙等 ≤ 2,250萬)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC2Budget(65000000); setC2Height(30); setC2Depth(8); setC2Span(20); runCalc2(65000000, 30, 8, 20, true); }) }, "6,500萬 查核工程 (乙等 ≤ 7,500萬 + 專職品管)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC2Budget(240000000); setC2Height(42); setC2Depth(12); setC2Span(30); runCalc2(240000000, 42, 12, 30, true); }) }, "2.4億 巨額工程 (甲等 + 特定資格1/12 + 品管2人)")), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "工程採購預算金額（新臺幣元）："), React.createElement("input", { "type": "number", "value": (c2Budget), "onChange": ((e) => {
                    setC2Budget(e.target.value);
                    runCalc2(e.target.value, c2Height, c2Depth, c2Span, c2Road);
                  }) })), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "建築物高度 (m)："), React.createElement("input", { "type": "number", "value": (c2Height), "onChange": ((e) => {
                      setC2Height(e.target.value);
                      runCalc2(c2Budget, e.target.value, c2Depth, c2Span, c2Road);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "開挖深度 (m)："), React.createElement("input", { "type": "number", "value": (c2Depth), "onChange": ((e) => {
                      setC2Depth(e.target.value);
                      runCalc2(c2Budget, c2Height, e.target.value, c2Span, c2Road);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "橋梁最大跨距 (m)："), React.createElement("input", { "type": "number", "value": (c2Span), "onChange": ((e) => {
                      setC2Span(e.target.value);
                      runCalc2(c2Budget, c2Height, c2Depth, e.target.value, c2Road);
                    }) })))), (c2Result && (
              React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 營造業承攬限額、特定資格 1/12 與三級品管核算結果"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "最低可承攬營造業等級"), React.createElement("strong", { "className": "kpi-val" }, (c2Result.contractor_title))), React.createElement("div", { "className": "kpi-box emerald" }, React.createElement("span", { "className": "kpi-label" }, "三級品管／監造現場人數"), React.createElement("strong", { "className": "kpi-val" }, "品管", (c2Result.quality_control.qc_personnel_min), " 人 ／ 監造 ", (c2Result.quality_control.supervision_personnel_min), "人"))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🏢 營造業承攬造價限額判定（土木包工業720萬／丙2,250萬／乙7,500萬／甲資本額10倍）："), React.createElement("p", null, (c2Result.contractor_reason))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⚖️ 特定資格與實收資本額／權益 1/12 上限："), React.createElement("p", null, (c2Result.specific_qualification.legal_note))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🛡️ 三級品管配置門檻："), React.createElement("p", null, (c2Result.quality_control.plan_threshold_note)), React.createElement("p", null, "• 施工品管：", (c2Result.quality_control.qc_personnel_type)), React.createElement("p", null, "• 委託監造：", (c2Result.quality_control.supervision_personnel_type))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🌱 114.12 再生 AC 強制比率（20%/60%）＆ 自辦簽證／職安衛："), React.createElement("p", null, "• 道路熱拌再生 AC ≥ ", (c2Result.green_and_osh_norms.hot_mix_recycled_ac_min_pct), "%、基底層再生 AC ≥ ", (c2Result.green_and_osh_norms.base_layer_recycled_ac_min_pct), "%：", (c2Result.green_and_osh_norms.ac_balance_rule)), React.createElement("p", null, "• ", (c2Result.green_and_osh_norms.self_design_rule)), React.createElement("p", null, "• ", (c2Result.green_and_osh_norms.osh_article_70_1)))))
            )))
        )), (activeCalc === 'calc3' && (
          React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📈 輸入物價指數三層級 (10%/5%/2.5%) 與實作數量 (3%/30%) 參數"), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "本期估驗計價總金額 (元)："), React.createElement("input", { "type": "number", "value": (c3Valuation), "onChange": ((e) => {
                      setC3Valuation(e.target.value);
                      runCalc3(e.target.value, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "已付預付款扣減比例 (如 0.10)："), React.createElement("input", { "type": "number", "step": "0.05", "value": (c3AdvRatio), "onChange": ((e) => {
                      setC3AdvRatio(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, e.target.value, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) }))), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "個別項目漲跌幅(%) [門檻±10%]："), React.createElement("input", { "type": "number", "step": "0.5", "value": (c3IndPct), "onChange": ((e) => {
                      setC3IndPct(e.target.value);
                      runCalc3(c3Valuation, e.target.value, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "中分類漲跌幅(%) [門檻±5%]："), React.createElement("input", { "type": "number", "step": "0.5", "value": (c3CatPct), "onChange": ((e) => {
                      setC3CatPct(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, e.target.value, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "總指數漲跌幅(%) [門檻±2.5%]："), React.createElement("input", { "type": "number", "step": "0.5", "value": (c3GenPct), "onChange": ((e) => {
                      setC3GenPct(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, e.target.value, c3AdvRatio, c3ContractQty, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) }))), React.createElement("hr", { "className": "calc-divider" }), React.createElement("h4", { "className": "calc-sub-title" }, "📏 契約範本第 3 條：個別項目實作數量結算（±3% / ±30%）"), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "契約數量："), React.createElement("input", { "type": "number", "value": (c3ContractQty), "onChange": ((e) => {
                      setC3ContractQty(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, e.target.value, c3ActualQty, c3UnitPrice, c3ExcessPrice);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "實作結算數量："), React.createElement("input", { "type": "number", "value": (c3ActualQty), "onChange": ((e) => {
                      setC3ActualQty(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, e.target.value, c3UnitPrice, c3ExcessPrice);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "原契約單價 (元)："), React.createElement("input", { "type": "number", "value": (c3UnitPrice), "onChange": ((e) => {
                      setC3UnitPrice(e.target.value);
                      runCalc3(c3Valuation, c3IndPct, c3IndAmt, c3CatPct, c3CatAmt, c3GenPct, c3AdvRatio, c3ContractQty, c3ActualQty, e.target.value, c3ExcessPrice);
                    }) })))), (c3Result && (
              React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 物調三層級款項 ＆ 實作數量 3%/30% 結算結果"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "本期物價指數調整總額 (含稅)"), React.createElement("strong", { "className": "kpi-val" }, (c3Result.price_escalation.total_price_escalation_twd.toLocaleString()), "元")), React.createElement("div", { "className": "kpi-box emerald" }, React.createElement("span", { "className": "kpi-label" }, "實作數量增減差額 (逾3%部分)"), React.createElement("strong", { "className": "kpi-val" }, (c3Result.quantity_settlement.total_qty_settlement_diff_twd.toLocaleString()), "元"))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "📈 物價指數三層級明細（僅就超過門檻部分計算）："), React.createElement("p", null, "• 第一層（個別項目 ±10%）：漲跌 ", (c3Result.price_escalation.tier1_individual_10pct.change_pct), "% ➔ 超過部分 ", (c3Result.price_escalation.tier1_individual_10pct.excess_pct), "% ➔ 調整 ", React.createElement("strong", null, (c3Result.price_escalation.tier1_individual_10pct.adjustment_twd.toLocaleString()), " 元")), React.createElement("p", null, "• 第二層（中分類 ±5%）：漲跌 ", (c3Result.price_escalation.tier2_category_5pct.change_pct), "% ➔ 超過部分 ", (c3Result.price_escalation.tier2_category_5pct.excess_pct), "% ➔ 調整 ", React.createElement("strong", null, (c3Result.price_escalation.tier2_category_5pct.adjustment_twd.toLocaleString()), " 元")), React.createElement("p", null, "• 第三層（總指數 ±2.5%）：漲跌 ", (c3Result.price_escalation.tier3_general_2_5pct.change_pct), "% ➔ 超過部分 ", (c3Result.price_escalation.tier3_general_2_5pct.excess_pct), "% ➔ 調整 ", React.createElement("strong", null, (c3Result.price_escalation.tier3_general_2_5pct.adjustment_twd.toLocaleString()), " 元"))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "📏 契約範本第 3 條實作數量結算（差異率 ", (c3Result.quantity_settlement.qty_diff_pct), "%）："), React.createElement("p", null, (c3Result.quantity_settlement.settlement_rule)), React.createElement("p", null, "• 3%以內不調整數量：", (c3Result.quantity_settlement.band_within_3_qty), " ｜ 逾3%~30%按原單價增減數量：", (c3Result.quantity_settlement.band_3_to_30_qty), "（", (c3Result.quantity_settlement.adj_3_to_30_twd.toLocaleString()), "元）｜ 逾30%議定單價數量：", (c3Result.quantity_settlement.band_over_30_qty), "（", (c3Result.quantity_settlement.adj_over_30_twd.toLocaleString()), "元）")), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⏱️ 採購法第 73 條之 1 審核與付款期限："), React.createElement("p", null, (c3Result.payment_deadline_article_73_1.rule)))))
            )))
        )), (activeCalc === 'calc4' && (
          React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "🔄 契約變更累計金額 (|加帳|＋|減帳|) ＆ 第 58 條偏低標參數"), React.createElement("div", { "className": "preset-buttons-row" }, React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC4Estimate(50000000); setC4LowestBid(33000000); setC4Reasonable(false); runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, 50000000, 33000000, false); }) }, "標價 66% 底價 (<70% 需說明或差額保證金)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC4Estimate(50000000); setC4LowestBid(37500000); setC4Reasonable(false); runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, 50000000, 37500000, false); }) }, "標價 75% 底價 (70%~80% 區間)"), React.createElement("button", { "className": "chip-btn", "onClick": (() => { setC4OrigAmt(40000000); setC4AddAmt(35000000); setC4DedAmt(20000000); runCalc4(40000000, 35000000, 20000000, 0, c4Estimate, c4LowestBid, c4Reasonable); }) }, "加帳3,500萬 + 減帳2,000萬 (累計5,500萬達查核且逾50%上限)")), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "原主契約金額 (元)："), React.createElement("input", { "type": "number", "value": (c4OrigAmt), "onChange": ((e) => {
                      setC4OrigAmt(e.target.value);
                      runCalc4(e.target.value, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "本次加帳金額 (元)："), React.createElement("input", { "type": "number", "value": (c4AddAmt), "onChange": ((e) => {
                      setC4AddAmt(e.target.value);
                      runCalc4(c4OrigAmt, e.target.value, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "本次減帳金額 (元)："), React.createElement("input", { "type": "number", "value": (c4DedAmt), "onChange": ((e) => {
                      setC4DedAmt(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, e.target.value, c4PrevCum, c4Estimate, c4LowestBid, c4Reasonable);
                    }) }))), React.createElement("hr", { "className": "calc-divider" }), React.createElement("h4", { "className": "calc-sub-title" }, "⚖️ 採購法第 58 條總標價偏低決策樹輸入"), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "核定底價 (元)："), React.createElement("input", { "type": "number", "value": (c4Estimate), "onChange": ((e) => {
                      setC4Estimate(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, e.target.value, c4LowestBid, c4Reasonable);
                    }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "最低標廠商總標價 (元)："), React.createElement("input", { "type": "number", "value": (c4LowestBid), "onChange": ((e) => {
                      setC4LowestBid(e.target.value);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, e.target.value, c4Reasonable);
                    }) }))), React.createElement("div", { "className": "checkbox-inline-group" }, React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (c4Reasonable), "onChange": ((e) => {
                      setC4Reasonable(e.target.checked);
                      runCalc4(c4OrigAmt, c4AddAmt, c4DedAmt, c4PrevCum, c4Estimate, c4LowestBid, e.target.checked);
                    }) }), "廠商提出之說明經機關審認合理（無降低品質不能誠信履約之虞）"))), (c4Result && (
              React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 契約變更累計金額 ＆ 第 58 條偏低標決策樹輸出"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "契約變更累計金額 (|加帳|＋|減帳|)"), React.createElement("strong", { "className": "kpi-val" }, (c4Result.contract_change.total_cumulative_change_abs_twd.toLocaleString()), "元")), React.createElement("div", { "className": "kpi-box amber" }, React.createElement("span", { "className": "kpi-label" }, "第58條差額保證金 (底價80%－標價)"), React.createElement("strong", { "className": "kpi-val" }, (c4Result.article_58_decision.bond_diff_amount_twd.toLocaleString()), "元"))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🔄 契約變更核准監辦備查與第22條第1項第6款檢核："), React.createElement("p", null, (c4Result.contract_change.change_supervision_rule)), React.createElement("p", null, (c4Result.contract_change.art22_1_6_note))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🌳 採購法第 58 條決策樹落點：", (c4Result.article_58_decision.art58_title)), React.createElement("pre", { "className": "law-pre-text" }, (c4Result.article_58_decision.art58_action)))))
            )))
        ))))
  );
}

// --- Compiled from Stage3ErroneousPatternsSkill.jsx ---

function Stage3ErroneousPatternsSkill({
  onUpdateDrawer,
  onTransferToKm,
  onSendToPdfReport,
}) {
  const [skillMeta, setSkillMeta] = useState(null);
  const [showSkillMd, setShowSkillMd] = useState(false);

  const [selectedModule, setSelectedModule] = useState('general_12');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [patternsList, setPatternsList] = useState([]);

  const [checkedCodes, setCheckedCodes] = useState([]);
  const [auditTitle, setAuditTitle] = useState('招標文件與採購作業錯誤行為態樣檢核案');
  const [auditText, setAuditText] = useState(
    '本工程採購預算 4,800 萬元，採評分及格最低標招標，審查項目將廠商投標標價納入評分 20%；投標廠商資格限取得 ISO 9001 驗證且投標時須檢附原廠授權代理證明書；空調冰水機組 EER 值高於經濟部標準且指定特定廠牌未允許同等品。'
  );
  const [auditResult, setAuditResult] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadedSourceFile, setUploadedSourceFile] = useState(null);

  useEffect(() => {
    fetch('/api/stage3/erroneous-patterns/meta')
      .then((r) => r.json())
      .then((data) => setSkillMeta(data));
    fetchPatterns('general_12', 'all', '');
    runSkillAudit(
      '本工程採購預算 4,800 萬元，採評分及格最低標招標，審查項目將廠商投標標價納入評分 20%；投標廠商資格限取得 ISO 9001 驗證且投標時須檢附原廠授權代理證明書；空調冰水機組 EER 值高於經濟部標準且指定特定廠牌未允許同等品。',
      [],
      '招標文件與採購作業錯誤行為態樣檢核案'
    );
  }, []);

  const fetchPatterns = (modId, cat, q) => {
    const url =
      '/api/stage3/erroneous-patterns?module_id=' +
      encodeURIComponent(modId || 'all') +
      '&category=' +
      encodeURIComponent(cat || 'all') +
      '&q=' +
      encodeURIComponent(q || '');
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setPatternsList(data.items);
      });
  };

  const handleModuleChange = (modId) => {
    setSelectedModule(modId);
    setSelectedCategory('all');
    fetchPatterns(modId, 'all', searchQuery);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    fetchPatterns(selectedModule, cat, searchQuery);
  };

  const handleSearchChange = (qVal) => {
    setSearchQuery(qVal);
    fetchPatterns(selectedModule, selectedCategory, qVal);
  };

  const runSkillAudit = (textVal, codesVal, titleVal) => {
    fetch('/api/stage3/erroneous-patterns/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textVal !== undefined ? textVal : auditText,
        checked_codes: codesVal !== undefined ? codesVal : checkedCodes,
        case_title: titleVal !== undefined ? titleVal : auditTitle,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) setAuditResult(data.audit);
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
      });
  };

  const toggleCheckCode = (code) => {
    const exists = checkedCodes.indexOf(code) !== -1;
    const next = exists ? checkedCodes.filter((c) => c !== code) : checkedCodes.concat([code]);
    setCheckedCodes(next);
    runSkillAudit(auditText, next, auditTitle);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadMsg('⏳ 正在上傳並解析公文／PDF 檔案：「' + file.name + '」...');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type_hint', 'auto');
    fd.append('auto_save_km', 'false');
    fetch('/api/stage3/upload-official-doc', {
      method: 'POST',
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) {
          setUploadMsg('❌ 上傳解析失敗：' + data.detail);
          return;
        }
        const extracted = data.parsed ? data.parsed.extracted_text || '' : '';
        const detectedTitle = data.metadata ? data.metadata.title : '上傳文件檢核：' + file.name;
        setAuditText(extracted);
        setAuditTitle(detectedTitle);
        setUploadedSourceFile(data.source_file || null);
        if (data.skill_audit) {
          setAuditResult(data.skill_audit);
        } else {
          runSkillAudit(extracted, checkedCodes, detectedTitle);
        }
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
        const warn = data.parsed && data.parsed.warning_message ? ' ' + data.parsed.warning_message : '';
        setUploadMsg(
          '✅ 已解析「' +
            file.name +
            '」（' +
            (data.parsed ? data.parsed.page_count : 1) +
            ' 頁、' +
            (data.parsed ? data.parsed.char_count : 0) +
            ' 字｜文號：' +
            (data.metadata ? data.metadata.case_no : '') +
            '）並完成 277 項錯誤態樣檢核！' +
            warn
        );
      })
      .catch((err) => setUploadMsg('❌ 上傳失敗：' + String(err)));
  };

  const applyPresetSample = (title, text) => {
    setAuditTitle(title);
    setAuditText(text);
    runSkillAudit(text, checkedCodes, title);
  };

  const currentModuleObj =
    skillMeta && skillMeta.modules
      ? skillMeta.modules.find((m) => m.id === selectedModule)
      : null;

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("span", { "className": "badge-navy" }, "AGENT SKILL · procurement-erroneous-patterns v2.0"), React.createElement("h2", { "className": "section-heading", "style": ({ marginTop: '6px' }) }, "🤖 【政府採購錯誤行為態樣】Agent Skill 檢核準則工作台"), React.createElement("p", { "className": "section-desc" }, "完整內建行政院公共工程委員會五大檢核準則模組（共", (' '), React.createElement("strong", null, (skillMeta ? skillMeta.total_criteria_count : 277)), (' '), "項標準檢核準則），供 AI Agent 自動比對招標文件／契約／查核報告，並支援稽核人員互動勾選與一鍵轉入知識管理（KM）素材庫。")), React.createElement("div", { "style": ({ display: 'flex', gap: '8px', flexWrap: 'wrap' }) }, React.createElement("button", { "className": "btn-secondary", "onClick": (() => setShowSkillMd(!showSkillMd)) }, (showSkillMd ? '🔼 收合 SKILL.md 準則規範' : '📄 檢視 Agent Skill (SKILL.md) 規範')))), (showSkillMd && skillMeta && (
          React.createElement("div", { "className": "skill-md-viewer" }, React.createElement("div", { "className": "skill-md-header" }, React.createElement("strong", null, "📘 Agent Skill 定義檔：", (skillMeta.skill_file_path)), React.createElement("span", { "className": "badge-emerald" }, "已掛載至 LangGraph AuditInvestigatorAgent")), React.createElement("pre", { "className": "skill-md-pre" }, (skillMeta.skill_markdown)))
        )), React.createElement("div", { "className": "scanner-workbench-grid" }, React.createElement("div", { "className": "scanner-input-panel" }, React.createElement("div", { "className": "scanner-toolbar" }, React.createElement("strong", null, "📝 待檢核工程會函釋 PDF／監察調查報告／招標文件摘錄"), React.createElement("label", { "className": "upload-file-btn" }, "📎 上傳 PDF／公文 (.pdf/.docx/.odt/.txt)", React.createElement("input", { "type": "file", "accept": ".pdf,.docx,.odt,.txt,.md,.csv,.json", "onChange": (handleFileUpload), "style": ({ display: 'none' }) }))), (uploadMsg && (
              React.createElement("div", { "className": "safe-harbor-box", "style": ({ marginBottom: '10px', padding: '10px 12px', fontSize: '13.5px' }) }, (uploadMsg))
            )), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "檢核案名："), React.createElement("input", { "type": "text", "value": (auditTitle), "onChange": ((e) => setAuditTitle(e.target.value)) })), React.createElement("div", { "className": "preset-buttons-row" }, React.createElement("button", { "className": "chip-btn", "onClick": (() =>
                  applyPresetSample(
                    '建築機電規格綁標＋ISO9001資格限制案',
                    '非屬特殊或巨額採購卻限定投標廠商須取得 ISO 9001 驗證，且投標時須檢附原廠授權代理證明書；空調工程冰水機組 EER 及 COP 值訂定過高並指定特定廠牌未允許同等品，消音箱加註八音頻衰減表。'
                  )) }, "🎯 建築機電綁標情境"), React.createElement("button", { "className": "chip-btn", "onClick": (() =>
                  applyPresetSample(
                    '第22條第1項第6款追加逾50%暨加減帳相抵案',
                    '因故減項招標後，履約期間逕依採購法第22條第1項第6款向原廠商辦理契約變更採購原減項內容，且誤以為追加減合計未逾50%，實際加帳累計已逾原主契約金額50%，且未優先以比價方式辦理，簽核僅照錄各款文字。'
                  )) }, "🎯 第22條限制性缺失"), React.createElement("button", { "className": "chip-btn", "onClick": (() =>
                  applyPresetSample(
                    '評分及格最低標程序違失案',
                    '本案採評分及格最低標，未成立工作小組或工作小組未達3人且兼任審查委員，審查項目將廠商投標標價納入審查評分，價格標開標對象限總平均前3名，且開標後參考合格廠商標價訂定底價。'
                  )) }, "🎯 評分及格最低標違失"), React.createElement("button", { "className": "chip-btn", "onClick": (() =>
                  applyPresetSample(
                    '15萬元以下小額採購化整為零暨假比價案',
                    '機關意圖規避公告金額採購規定，將年度需求化整為零分批以15萬元以下小額採購辦理，並洽1家廠商代為蒐集提供3家廠商之報價估價單，且誤以為共同供應契約小額採購無需辦理驗收，核銷未確認確實履約。'
                  )) }, "🎯 15萬小額採購違失")), React.createElement("textarea", { "className": "scanner-textarea", "rows": (5), "value": (auditText), "onChange": ((e) => setAuditText(e.target.value)), "placeholder": "貼上招標須知、施工規範、第22條簽陳、評分及格審查紀錄或小額請購核銷案情，啟動 277 項 Agent Skill 準則比對..." }), React.createElement("div", { "style": ({ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }) }, React.createElement("button", { "className": "btn-primary", "onClick": (() => runSkillAudit(auditText, checkedCodes, auditTitle)) }, "🤖 執行錯誤行為態樣 Agent Skill 檢核"), (checkedCodes.length > 0 && (
                React.createElement("button", { "className": "btn-secondary", "onClick": (() => {
                    setCheckedCodes([]);
                    runSkillAudit(auditText, [], auditTitle);
                  }) }, "🧹 清除手動勾選 (", (checkedCodes.length), ")")
              )))), (auditResult && (
            React.createElement("div", { "className": "scanner-output-panel" }, React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": (auditResult.risk_level === 'CRITICAL'
                      ? 'kpi-box red'
                      : auditResult.risk_level === 'HIGH'
                        ? 'kpi-box amber'
                        : 'kpi-box emerald') }, React.createElement("span", { "className": "kpi-label" }, "Agent Skill 綜合風險評級"), React.createElement("strong", { "className": "kpi-val" }, (auditResult.risk_level), "（", (auditResult.risk_score), "/ 100 分）")), React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "命中錯誤行為態樣準則"), React.createElement("strong", { "className": "kpi-val" }, (auditResult.counts.total_matched), " 項（CRITICAL ", (auditResult.counts.critical), " ｜ HIGH ", (auditResult.counts.high), "）"))), React.createElement("div", { "className": "skill-risk-banner" }, React.createElement("strong", null, "📊 診斷總評："), (auditResult.risk_label)), (auditResult.module_breakdown && auditResult.module_breakdown.length > 0 && (
                React.createElement("div", { "className": "skill-mod-badges" }, (auditResult.module_breakdown.map((mb) => (
                    React.createElement("span", { "key": (mb.module_id), "className": "badge-amber" }, (mb.title), "：", (mb.matched_count), "項")
                  ))))
              )), React.createElement("div", { "className": "violations-list", "style": ({ maxHeight: '300px', overflowY: 'auto' }) }, ((auditResult.matched_patterns || []).map((mp) => (
                  React.createElement("div", { "key": (mp.code), "className": "violation-alert-card" }, React.createElement("div", { "className": "v-top", "style": ({ flexWrap: 'wrap' }) }, React.createElement("span", { "className": (mp.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber') }, (mp.severity)), React.createElement("span", { "className": "badge-navy" }, (mp.code)), React.createElement("strong", null, (mp.category), " ", (mp.item_no))), React.createElement("p", { "className": "v-finding" }, (mp.pattern)), React.createElement("div", { "className": "skill-item-meta" }, React.createElement("span", null, "⚖️ 法令依據：", (mp.legal_basis))), React.createElement("div", { "className": "skill-item-remediation" }, "🛠️ 導正措施：", (mp.remediation)))
                ))), ((!auditResult.matched_patterns || auditResult.matched_patterns.length === 0) && (
                  React.createElement("div", { "className": "res-item" }, "✅ 本次文本與勾選檢核未命中顯著錯誤行為態樣，可於下方 277 項清單進一步手動勾選核對。")
                ))), React.createElement("div", { "style": ({ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }) }, (onTransferToKm && (
                  React.createElement("button", { "className": "btn-amber", "onClick": (() =>
                      onTransferToKm({
                        doc_type: 'audit_report',
                        title: '【錯誤態樣查核】' + auditTitle,
                        dispute_topic: '政府採購錯誤行為態樣 Agent Skill 查核',
                        facts_summary: auditText,
                        decision_or_findings:
                          '經「政府採購錯誤行為態樣」Agent Skill 檢核，風險評分 ' +
                          auditResult.risk_score +
                          ' 分（' +
                          auditResult.risk_level +
                          '），共命中 ' +
                          auditResult.counts.total_matched +
                          ' 項錯誤態樣：' +
                          (auditResult.matched_codes || []).join('、'),
                        km_lessons: auditResult.corrective_action,
                        matched_pattern_codes: auditResult.matched_codes || [],
                        source_file: uploadedSourceFile || null,
                      })) }, "📚 轉存為知識管理 (KM) 查核素材")
                )), (onSendToPdfReport && (
                  React.createElement("button", { "className": "btn-secondary", "onClick": (() =>
                      onSendToPdfReport({
                        id: 'skill-audit-export',
                        title: auditTitle,
                        category: '政府採購錯誤行為態樣 Agent Skill 查核',
                        agency: '受查核機關',
                        budget_twd: 50000000,
                        summary: auditText.slice(0, 220),
                        document_excerpt: auditText,
                        detected_violations: auditResult.detected_violations || [],
                        root_cause: auditResult.risk_label,
                        corrective_action: auditResult.corrective_action || '',
                      })) }, "🔏 帶入 HITL SHA-256 PDF 報告")
                ))))
          )))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "📋 【五大模組完整檢核準則互動查核表】（可勾選缺失項目即時重算風險）"), React.createElement("p", { "className": "section-desc" }, "點選切換五大檢核模組，支援依子類別與關鍵字即時篩選；勾選任一缺失準則即同步納入上方 Agent Skill 風險評估與導正清單。")), React.createElement("span", { "className": "badge-navy-lg" }, "已勾選缺失：", (checkedCodes.length), "項")), React.createElement("div", { "className": "sample-cases-bar" }, React.createElement("button", { "className": (selectedModule === 'all' ? 'case-pill-btn active' : 'case-pill-btn'), "onClick": (() => handleModuleChange('all')) }, "📑 全部五大模組 (", (skillMeta ? skillMeta.total_criteria_count : 277), ")"), (skillMeta &&
            (skillMeta.modules || []).map((mod) => (
              React.createElement("button", { "key": (mod.id), "className": (selectedModule === mod.id ? 'case-pill-btn active' : 'case-pill-btn'), "onClick": (() => handleModuleChange(mod.id)) }, (mod.short_title), " (", (mod.total_count), ")")
            )))), React.createElement("div", { "className": "form-row-2", "style": ({ marginBottom: '16px' }) }, React.createElement("div", { "className": "form-group", "style": ({ marginBottom: 0 }) }, React.createElement("label", null, "細項類別篩選："), React.createElement("select", { "value": (selectedCategory), "onChange": ((e) => handleCategoryChange(e.target.value)) }, React.createElement("option", { "value": "all" }, "全部類別"), (currentModuleObj &&
                (currentModuleObj.categories || []).map((cat) => (
                  React.createElement("option", { "key": (cat.name), "value": (cat.name) }, (cat.name), "（", (cat.count), "項）")
                ))))), React.createElement("div", { "className": "form-group", "style": ({ marginBottom: 0 }) }, React.createElement("label", null, "關鍵字檢索（代碼／態樣／法令／函釋）："), React.createElement("input", { "type": "text", "value": (searchQuery), "onChange": ((e) => handleSearchChange(e.target.value)), "placeholder": "例如：ISO 9001、第58條、50%、空調、15萬、圍標、評分及格..." }))), React.createElement("div", { "className": "skill-criteria-scroll" }, (patternsList.map((item) => {
            const isChecked = checkedCodes.indexOf(item.code) !== -1;
            return (
              React.createElement("label", { "key": (item.code), "className": (isChecked ? 'skill-criterion-card checked' : 'skill-criterion-card') }, React.createElement("input", { "type": "checkbox", "checked": (isChecked), "onChange": (() => toggleCheckCode(item.code)), "style": ({ marginTop: '4px' }) }), React.createElement("div", { "className": "skill-criterion-body" }, React.createElement("div", { "className": "skill-criterion-top" }, React.createElement("span", { "className": "badge-navy" }, (item.code)), React.createElement("span", { "className": (item.severity === 'CRITICAL'
                          ? 'badge-red'
                          : item.severity === 'HIGH'
                            ? 'badge-amber'
                            : 'badge-emerald') }, (item.severity)), React.createElement("strong", null, (item.category), " ", (item.item_no))), React.createElement("p", { "className": "skill-criterion-text" }, (item.pattern)), React.createElement("div", { "className": "skill-item-meta" }, React.createElement("span", null, "⚖️ 法令及函釋：", (item.legal_basis))), React.createElement("div", { "className": "skill-item-remediation" }, "✅ 因應／導正措施：", (item.remediation))))
            );
          })), (patternsList.length === 0 && (
            React.createElement("div", { "className": "res-item" }, "查無符合條件之錯誤行為態樣準則，請調整篩選關鍵字。")
          )))))
  );
}

// --- Compiled from Stage3DisputeAndKmHub.jsx ---

function Stage3DisputeAndKmHub({
  mode,
  onUpdateDrawer,
  onSendToPdfReport,
  prefillKmDraft,
  onClearPrefill,
  onSwitchToKmWithDraft,
}) {
  // === 爭議處理導航 (Dispute Evaluator) State ===
  const [disputeRef, setDisputeRef] = useState({ six_municipalities: [], doc_types: [], topics_catalog: [] });
  const [disputeCategory, setDisputeCategory] = useState('tendering_review_award');
  const [procCategory, setProcCategory] = useState('engineering');
  const [procAmount, setProcAmount] = useState(5000000);
  const [jurisdiction, setJurisdiction] = useState('中央機關或其他縣市政府');
  const [biddingDays, setBiddingDays] = useState(14);
  const [objSubtype, setObjSubtype] = useState('tender_docs');
  const [claimAmount, setClaimAmount] = useState(4500000);
  const [isMonetary, setIsMonetary] = useState(true);
  const [applicantSide, setApplicantSide] = useState('supplier');
  const [negFailed, setNegFailed] = useState(true);
  const [issuedProposal, setIssuedProposal] = useState(true);
  const [agencyRejected, setAgencyRejected] = useState(true);
  const [disputeResult, setDisputeResult] = useState(null);

  // === 知識管理 (KM) 素材輸入與累積庫 State ===
  const [kmMaterials, setKmMaterials] = useState([]);
  const [kmAnalytics, setKmAnalytics] = useState(null);
  const [kmDocTypes, setKmDocTypes] = useState([]);
  const [filterDocType, setFilterDocType] = useState('all');
  const [filterPatternCode, setFilterPatternCode] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedKmId, setExpandedKmId] = useState('');

  // KM 輸入表單 State
  const [formDocType, setFormDocType] = useState('mediation_case');
  const [formCaseNo, setFormCaseNo] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthority, setFormAuthority] = useState('行政院公共工程委員會採購申訴審議委員會');
  const [formAgency, setFormAgency] = useState('');
  const [formProcCat, setFormProcCat] = useState('engineering');
  const [formBudget, setFormBudget] = useState(15000000);
  const [formCaseDate, setFormCaseDate] = useState('2026-11-19');
  const [formOutcome, setFormOutcome] = useState('調解成立／缺失改善結案');
  const [formTopic, setFormTopic] = useState('履約爭議調解（展延工期及利管費／漏項／違約金／減價收受）');
  const [formFacts, setFormFacts] = useState('');
  const [formDecision, setFormDecision] = useState('');
  const [formLessons, setFormLessons] = useState('');
  const [formLawRefs, setFormLawRefs] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formManualCodes, setFormManualCodes] = useState('');
  const [formAutoTag, setFormAutoTag] = useState(true);
  const [formSourceFile, setFormSourceFile] = useState(null);
  const [previewSkillAudit, setPreviewSkillAudit] = useState(null);
  const [submitBanner, setSubmitBanner] = useState('');

  useEffect(() => {
    fetch('/api/stage3/disputes/reference')
      .then((r) => r.json())
      .then((data) => {
        setDisputeRef(data);
        if (data.doc_types) setKmDocTypes(data.doc_types);
      });
    runDisputeEval(
      'tendering_review_award',
      'engineering',
      5000000,
      '中央機關或其他縣市政府',
      14,
      'tender_docs',
      4500000,
      true,
      'supplier',
      true,
      true,
      true
    );
    fetchKmMaterials('all', 'all', '');
  }, []);

  useEffect(() => {
    if (prefillKmDraft && mode === 'km') {
      if (prefillKmDraft.doc_type) setFormDocType(prefillKmDraft.doc_type);
      if (prefillKmDraft.title) setFormTitle(prefillKmDraft.title);
      if (prefillKmDraft.dispute_topic) setFormTopic(prefillKmDraft.dispute_topic);
      if (prefillKmDraft.facts_summary) setFormFacts(prefillKmDraft.facts_summary);
      if (prefillKmDraft.decision_or_findings) setFormDecision(prefillKmDraft.decision_or_findings);
      if (prefillKmDraft.km_lessons) setFormLessons(prefillKmDraft.km_lessons);
      if (prefillKmDraft.matched_pattern_codes) {
        setFormManualCodes(prefillKmDraft.matched_pattern_codes.join(', '));
      }
      if (prefillKmDraft.source_file) {
        setFormSourceFile(prefillKmDraft.source_file);
      }
      setSubmitBanner('已由「政府採購錯誤行為態樣 Agent Skill」帶入查核結果，請補充案號／機關後寫入 KM 知識管理素材庫！');
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillKmDraft, mode]);

  const runDisputeEval = (
    dCat,
    pCat,
    pAmt,
    jur,
    bDays,
    oSub,
    cAmt,
    isMon,
    appSide,
    nFail,
    issProp,
    agRej
  ) => {
    fetch('/api/stage3/disputes/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dispute_category: dCat,
        procurement_category: pCat,
        procurement_amount_twd: Number(pAmt),
        agency_jurisdiction: jur,
        bidding_period_days: Number(bDays),
        objection_subtype: oSub,
        claim_amount_twd: Number(cAmt),
        is_monetary_claim: Boolean(isMon),
        applicant_side: appSide,
        negotiation_failed_first: Boolean(nFail),
        committee_issued_proposal: Boolean(issProp),
        agency_rejected_proposal: Boolean(agRej),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.evaluation) setDisputeResult(data.evaluation);
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const fetchKmMaterials = (dType, pCode, q) => {
    const url =
      '/api/stage3/km/materials?doc_type=' +
      encodeURIComponent(dType || 'all') +
      '&pattern_code=' +
      encodeURIComponent(pCode || 'all') +
      '&q=' +
      encodeURIComponent(q || '');
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.materials) setKmMaterials(data.materials);
        if (data.analytics) setKmAnalytics(data.analytics);
        if (data.doc_types) setKmDocTypes(data.doc_types);
      });
  };

  const handleKmFileImport = (e, autoSaveDirectly) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSubmitBanner('⏳ 正在上傳並解析公文／PDF 檔案：「' + file.name + '」...');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type_hint', 'auto');
    fd.append('auto_save_km', autoSaveDirectly ? 'true' : 'false');

    fetch('/api/stage3/upload-official-doc', {
      method: 'POST',
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) {
          setSubmitBanner('❌ 檔案上傳解析失敗：' + data.detail);
          return;
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);

        const warn = data.parsed && data.parsed.warning_message ? ' ' + data.parsed.warning_message : '';
        if (autoSaveDirectly && data.saved_km_record) {
          setSubmitBanner(
            '✅ 已直接解析並寫入 KM 知識庫！「' +
              data.saved_km_record.title +
              '」（原檔：' +
              (data.source_file ? data.source_file.original_filename : file.name) +
              '，共 ' +
              (data.parsed ? data.parsed.page_count : 1) +
              ' 頁，自動標註 ' +
              (data.saved_km_record.matched_pattern_codes || []).length +
              ' 項錯誤態樣）。' +
              warn
          );
          fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
          return;
        }

        const meta = data.metadata || {};
        if (meta.doc_type) setFormDocType(meta.doc_type);
        if (meta.case_no) setFormCaseNo(meta.case_no);
        if (meta.title) setFormTitle(meta.title);
        if (meta.authority) setFormAuthority(meta.authority);
        if (meta.agency) setFormAgency(meta.agency);
        if (meta.procurement_category) setFormProcCat(meta.procurement_category);
        if (meta.budget_twd !== undefined) setFormBudget(meta.budget_twd);
        if (meta.case_date) setFormCaseDate(meta.case_date);
        if (meta.outcome) setFormOutcome(meta.outcome);
        if (meta.dispute_topic) setFormTopic(meta.dispute_topic);
        if (meta.facts_summary) setFormFacts(meta.facts_summary);
        if (meta.decision_or_findings) setFormDecision(meta.decision_or_findings);
        if (meta.law_refs && meta.law_refs.length > 0) setFormLawRefs(meta.law_refs.join(', '));
        if (meta.tags && meta.tags.length > 0) setFormTags(meta.tags.join(', '));
        if (data.skill_audit) {
          setPreviewSkillAudit(data.skill_audit);
          if (data.skill_audit.matched_codes && data.skill_audit.matched_codes.length > 0) {
            setFormManualCodes(data.skill_audit.matched_codes.join(', '));
          }
          if (data.skill_audit.corrective_action) {
            setFormLessons(data.skill_audit.corrective_action);
          }
        }
        setFormSourceFile(data.source_file || null);
        setSubmitBanner(
          '✅ 已自動解析 PDF／公文「' +
            file.name +
            '」（共 ' +
            (data.parsed ? data.parsed.page_count : 1) +
            ' 頁、' +
            (data.parsed ? data.parsed.char_count : 0) +
            ' 字）並填妥下方表單欄位與錯誤態樣標註，請確認後按「💾 寫入並累積至 KM 知識管理素材庫」！' +
            warn
        );
      })
      .catch((err) => setSubmitBanner('❌ 上傳連線錯誤：' + String(err)));
  };

  const handlePreviewAutoTag = () => {
    const combined = [formTitle, formTopic, formFacts, formDecision, formLessons].join('\n');
    const manualList = formManualCodes
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    fetch('/api/stage3/erroneous-patterns/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: combined,
        checked_codes: manualList,
        case_title: formTitle || 'KM 知識素材預覽標註',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) {
          setPreviewSkillAudit(data.audit);
          if (data.audit.matched_codes && data.audit.matched_codes.length > 0) {
            setFormManualCodes(data.audit.matched_codes.join(', '));
          }
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleSubmitKmMaterial = () => {
    if (!formTitle.trim()) {
      setSubmitBanner('⚠️ 請至少填寫「案件／報告標題」再進行儲存。');
      return;
    }
    const manualList = formManualCodes
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const lawList = formLawRefs
      .split(/[,，、]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tagList = formTags
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    fetch('/api/stage3/km/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: formDocType,
        case_no: formCaseNo,
        title: formTitle,
        authority: formAuthority,
        agency: formAgency,
        procurement_category: formProcCat,
        budget_twd: Number(formBudget) || 0,
        case_date: formCaseDate,
        outcome: formOutcome,
        dispute_topic: formTopic,
        facts_summary: formFacts,
        decision_or_findings: formDecision,
        km_lessons: formLessons,
        matched_pattern_codes: manualList,
        law_refs: lawList,
        tags: tagList,
        auto_tag_patterns: Boolean(formAutoTag),
        source_file: formSourceFile || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.record) {
          setSubmitBanner(
            '✅ 已成功儲存至知識管理素材庫（ID: ' +
              data.record.id +
              '），並自動標註 ' +
              (data.record.matched_pattern_codes || []).length +
              ' 項「政府採購錯誤行為態樣」準則！'
          );
          setFormCaseNo('');
          setFormTitle('');
          setFormAgency('');
          setFormFacts('');
          setFormDecision('');
          setFormLessons('');
          setFormLawRefs('');
          setFormTags('');
          setFormManualCodes('');
          setFormSourceFile(null);
          setPreviewSkillAudit(null);
          fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
        }
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleDeleteKm = (id) => {
    fetch('/api/stage3/km/materials/' + encodeURIComponent(id), {
      method: 'DELETE',
    })
      .then((r) => r.json())
      .then(() => {
        fetchKmMaterials(filterDocType, filterPatternCode, filterQuery);
      });
  };

  const handleSyncDrawerWithKm = (rec) => {
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: rec.title + ' ' + rec.dispute_topic + ' ' + (rec.law_refs || []).join(' '),
        stage: 'stage3',
        amount_twd: rec.budget_twd || 50000000,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (onUpdateDrawer) {
          onUpdateDrawer({
            law_cards: data.law_cards,
            textbook_citations: data.textbook_citations,
            agent_topology: data.agent_topology,
          });
        }
      });
  };

  const fillSampleKmReport = (sampleType) => {
    if (sampleType === 'appeal') {
      setFormDocType('appeal_decision');
      setFormCaseNo('訴1150091號');
      setFormTitle('【申訴範例】某醫療設備採購不當指定進口廠牌且未加註或同等品申訴案');
      setFormAuthority('行政院公共工程委員會採購申訴審議委員會');
      setFormAgency('某公立醫院');
      setFormProcCat('property');
      setFormBudget(12000000);
      setFormOutcome('申訴有理由（撤銷原異議處理結果）');
      setFormTopic('招標文件違反規定（產品規格綁標如指定廠牌）');
      setFormFacts('本案採購金額1,200萬元，招標規格直接抄襲單一歐美廠商型錄且不允許我國產品，亦未加註「或同等品」字樣，並要求投標時檢附原廠製造證明及授權同意書。');
      setFormDecision('採購申訴審議委員會審議判斷認定違反採購法第26條第2、3項及第37條，命機關20日內另為適法處置並依第85條償付申訴必要費用。');
      setFormLessons('規格訂定須回歸功能效益，不得排除我國產品或指定單一廠牌；原廠製造證明應改於交貨驗收時提出。');
      setFormLawRefs('採購法第26條, 採購法第37條, 採購法第85條');
      setFormTags('申訴, 指定進口, 規格綁標, 原廠製造證明');
    } else if (sampleType === 'mediation') {
      setFormDocType('mediation_case');
      setFormCaseNo('調1150148號');
      setFormTitle('【調解範例】道路改善工程設計數量短少暨逾期違約金減免履約爭議調解案');
      setFormAuthority('新北市政府採購申訴審議委員會');
      setFormAgency('新北市某區公所');
      setFormProcCat('engineering');
      setFormBudget(28500000);
      setFormOutcome('調解成立（依契約第3條調整價金並減計部分逾期違約金）');
      setFormTopic('履約爭議調解（漏項或數量短少／逾期違約金爭議）');
      setFormFacts('履約期間因既有管線遷移延誤工期且實際瀝青路面刨鋪數量超出契約數量34%，機關原本拒絕追加並以履約期限過短計罰高額逾期違約金，協議不成由廠商申請調解。');
      setFormDecision('調解委員建議依工程契約範本第3條就逾3%~30%按原單價給付、逾30%部分協議單價，並扣除不可歸責廠商之管線遷移天數，雙方合意調解成立。');
      setFormLessons('設計階段應核實工項數量並落實管線協調；履約中遇不可歸責展延事由應即時留存會議紀錄佐證。');
      setFormLawRefs('採購法第85條之1, 工程採購契約範本第3條');
      setFormTags('履約調解, 實作數量, 逾期違約金, 管線遷移');
    } else {
      setFormDocType('investigation_report');
      setFormCaseNo('院台調字第1150900321號');
      setFormTitle('【調查報告範例】某機關開標前洩漏底價暨投標廠商掛號連號圍標調查報告');
      setFormAuthority('監察院／法務部廉政署');
      setFormAgency('某縣政府所屬機關');
      setFormProcCat('engineering');
      setFormBudget(36000000);
      setFormOutcome('糾正機關並移送檢調偵辦採購法第87條及刑法第132條');
      setFormTopic('監察／政風調查（圍標重大異常關聯＆開標審標違失）');
      setFormFacts('查核發現3家投標廠商標封掛號信連號且不同投標廠商領標IP相同，開標後有2家刻意未附押標金致僅餘1家合格，且承辦人未依第50條不予決標亦未依第31條追繳押標金。');
      setFormDecision('調查報告認定完全吻合工程會09500256920號令及09700060670號令重大異常關聯圍標態樣，機關未依採購法第50條、第31條及第101條處置顯有重大違失。');
      setFormLessons('開審標應強制勾稽標封掛號連號、押標金票據連號及電子領投標IP紀錄，發現異常立即啟動行政調查，無須等待刑事判決。');
      setFormLawRefs('採購法第50條第1項第5款, 採購法第31條第2項, 採購法第87條, 採購法第101條');
      setFormTags('監察調查, 圍標, 掛號連號, IP相同, 陪標');
    }
    setSubmitBanner('已填入範例草稿，可直接按「🤖 預覽錯誤態樣自動標註」或「💾 寫入 KM 知識管理素材庫」！');
  };

  // =========================================================================
  // 模式 A：爭議處理（異議／申訴／調解）程序、時效、規費與強制仲裁導航
  // =========================================================================
  if (mode === 'dispute') {
    const disputeTopics = (disputeRef && disputeRef.topics_catalog) ? disputeRef.topics_catalog : [];
    const sixCities = (disputeRef && disputeRef.six_municipalities) ? disputeRef.six_municipalities : [];

    return (
      React.createElement("div", { "className": "stage-container" }, React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("span", { "className": "badge-navy" }, "DISPUTE RESOLUTION ENGINE · 採購法第6章（第74~85條之4）＆ 第101~103條"), React.createElement("h2", { "className": "section-heading", "style": ({ marginTop: '6px' }) }, "⚖️ 【政府採購爭議處理（異議／申訴／調解）程序、時效與費用精算導航】"), React.createElement("p", { "className": "section-desc" }, "依據工程會《爭議處理教材》建置：精算四大爭議類別法定期間、150 萬元公告金額門檻與例外（第31條押標金／第101條停權免門檻）、六都與工程會管轄分工、審議費／調解費試算及第 85 條之 1 第 2 項「先調後仲」強制仲裁五要件檢核。"))), React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "1️⃣ 設定採購爭議類別與案件條件"), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "爭議類別（雙軌救濟路徑）："), React.createElement("select", { "value": (disputeCategory), "onChange": ((e) => {
                    setDisputeCategory(e.target.value);
                    runDisputeEval(
                      e.target.value,
                      procCategory,
                      procAmount,
                      jurisdiction,
                      biddingDays,
                      objSubtype,
                      claimAmount,
                      isMonetary,
                      applicantSide,
                      negFailed,
                      issuedProposal,
                      agencyRejected
                    );
                  }) }, React.createElement("option", { "value": "tendering_review_award" }, "1. 招標、審標、決標之爭議（異議 ➔ 申訴，須達150萬公告金額）"), React.createElement("option", { "value": "bid_bond_forfeiture" }, "2. 不發還押標金、追繳押標金之爭議（第31條，不受150萬門檻限制）"), React.createElement("option", { "value": "art101_debarment" }, "3. 通知將刊登政府採購公報停權爭議（第101條，20日異議、不受150萬限制）"), React.createElement("option", { "value": "contract_performance" }, "4. 履約爭議調解（含驗收、保固，第85條之1～第85條之4）"))), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "採購屬性類別："), React.createElement("select", { "value": (procCategory), "onChange": ((e) => {
                      setProcCategory(e.target.value);
                      runDisputeEval(
                        disputeCategory,
                        e.target.value,
                        procAmount,
                        jurisdiction,
                        biddingDays,
                        objSubtype,
                        claimAmount,
                        isMonetary,
                        applicantSide,
                        negFailed,
                        issuedProposal,
                        agencyRejected
                      );
                    }) }, React.createElement("option", { "value": "engineering" }, "工程採購（適用第85-1強制仲裁）"), React.createElement("option", { "value": "tech_service" }, "技術服務採購（適用第85-1強制仲裁）"), React.createElement("option", { "value": "property" }, "財物採購"), React.createElement("option", { "value": "service" }, "一般勞務採購"))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "招標機關管轄歸屬（六都 vs 工程會）："), React.createElement("select", { "value": (jurisdiction), "onChange": ((e) => {
                      setJurisdiction(e.target.value);
                      runDisputeEval(
                        disputeCategory,
                        procCategory,
                        procAmount,
                        e.target.value,
                        biddingDays,
                        objSubtype,
                        claimAmount,
                        isMonetary,
                        applicantSide,
                        negFailed,
                        issuedProposal,
                        agencyRejected
                      );
                    }) }, React.createElement("option", { "value": "中央機關或其他縣市政府" }, "中央機關或其他縣市政府（委請工程會辦理）"), (sixCities.map((city) => (
                      React.createElement("option", { "key": (city), "value": (city) }, (city), "（自設採購申訴審議委員會）")
                    )))))), (disputeCategory !== 'contract_performance' && (
                React.createElement("div", null, React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "本案採購金額（新臺幣元，門檻150萬）："), React.createElement("input", { "type": "number", "value": (procAmount), "onChange": ((e) => {
                          setProcAmount(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            e.target.value,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }) })), (disputeCategory === 'tendering_review_award' && (
                      React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "等標期日數（計算招標文件異議1/4期間）："), React.createElement("input", { "type": "number", "value": (biddingDays), "onChange": ((e) => {
                            setBiddingDays(e.target.value);
                            runDisputeEval(
                              disputeCategory,
                              procCategory,
                              procAmount,
                              jurisdiction,
                              e.target.value,
                              objSubtype,
                              claimAmount,
                              isMonetary,
                              applicantSide,
                              negFailed,
                              issuedProposal,
                              agencyRejected
                            );
                          }) }))
                    ))), (disputeCategory === 'tendering_review_award' && (
                    React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "異議事項細分（第75條第1項各款）："), React.createElement("select", { "value": (objSubtype), "onChange": ((e) => {
                          setObjSubtype(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            e.target.value,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }) }, React.createElement("option", { "value": "tender_docs" }, "對招標文件規定提出異議（等標期1/4，不得少於10日）"), React.createElement("option", { "value": "clarification_change" }, "對釋疑、後續說明、變更或補充提出異議（次日起10日）"), React.createElement("option", { "value": "process_result" }, "對採購過程、結果提出異議（次日起10日，招審決標不逾決標次日起15日）")))
                  )))
              )), (disputeCategory === 'contract_performance' && (
                React.createElement("div", null, React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "調解請求／確認金額（新臺幣元）："), React.createElement("input", { "type": "number", "value": (claimAmount), "onChange": ((e) => {
                          setClaimAmount(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            e.target.value,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "調解申請方："), React.createElement("select", { "value": (applicantSide), "onChange": ((e) => {
                          setApplicantSide(e.target.value);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            e.target.value,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }) }, React.createElement("option", { "value": "supplier" }, "廠商申請（機關不得拒絕啟動調解）"), React.createElement("option", { "value": "agency" }, "機關申請（須經廠商同意，否則不受理）")))), React.createElement("div", { "className": "checkbox-inline-group" }, React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (isMonetary), "onChange": ((e) => {
                          setIsMonetary(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            e.target.checked,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            agencyRejected
                          );
                        }) }), "以請求或確認金額為調解標的（未勾選則為非金額標的固定3萬元）"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (negFailed), "onChange": ((e) => {
                          setNegFailed(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            e.target.checked,
                            issuedProposal,
                            agencyRejected
                          );
                        }) }), "機關與廠商已先就履約爭議進行協議且協議不成"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (issuedProposal), "onChange": ((e) => {
                          setIssuedProposal(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            e.target.checked,
                            agencyRejected
                          );
                        }) }), "採購申訴審議委員會已出具「調解建議」或「調解方案」"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (agencyRejected), "onChange": ((e) => {
                          setAgencyRejected(e.target.checked);
                          runDisputeEval(
                            disputeCategory,
                            procCategory,
                            procAmount,
                            jurisdiction,
                            biddingDays,
                            objSubtype,
                            claimAmount,
                            isMonetary,
                            applicantSide,
                            negFailed,
                            issuedProposal,
                            e.target.checked
                          );
                        }) }), "調解不成立係因「機關不同意」該建議或方案所致")))
              ))), (disputeResult && (
              React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 法定爭議處理路徑、時效與規費檢核結果"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": (disputeResult.can_proceed ? 'kpi-box emerald' : 'kpi-box red') }, React.createElement("span", { "className": "kpi-label" }, "程序啟動／門檻適格性"), React.createElement("strong", { "className": "kpi-val" }, (disputeResult.can_proceed ? '✅ 符合法定啟動要件' : '⚠️ 未達門檻或欠缺先決要件'))), React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "法定規費估算（審議費／調解費）"), React.createElement("strong", { "className": "kpi-val" }, "NT$", ((disputeResult.fee_info ? disputeResult.fee_info.fee_twd : 30000).toLocaleString()), "元"))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🛤️ 救濟軌道："), (disputeResult.track_name), React.createElement("p", null, React.createElement("strong", null, "🏛️ 法定受理機關："), (disputeResult.competent_committee)), React.createElement("p", null, React.createElement("strong", null, "📌 門檻／適格判定："), (disputeResult.eligibility_note))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⏱️ 法定處理期間與應遵行程序："), React.createElement("ul", { "className": "dispute-timeline-list" }, ((disputeResult.deadlines || []).map((d, idx) => (
                        React.createElement("li", { "key": (idx) }, React.createElement("strong", null, (d.step), "："), (d.rule))
                      ))))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "💰 收費與撤回／不受理退費基準："), React.createElement("p", null, (disputeResult.fee_info && disputeResult.fee_info.basis)), React.createElement("p", null, React.createElement("strong", null, "⚖️ 法律效力："), (disputeResult.effect_summary))), (disputeResult.mandatory_arbitration && (
                    React.createElement("div", { "className": (disputeResult.mandatory_arbitration.triggered
                          ? 'defect-warning-line'
                          : 'res-item') }, React.createElement("strong", null, "⚡ 第 85 條之 1 第 2 項「先調後仲」強制仲裁五要件檢核："), React.createElement("p", { "style": ({ margin: '6px 0' }) }, (disputeResult.mandatory_arbitration.summary)), React.createElement("ul", { "style": ({ margin: '4px 0 0', paddingLeft: '20px' }) }, ((disputeResult.mandatory_arbitration.elements || []).map((el, i) => (
                          React.createElement("li", { "key": (i) }, (el.passed ? '✅' : '❌'), " ", (el.element))
                        )))))
                  ))))
            )))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "📘 【工程會進階訓練《爭議處理研討》四大類實務爭點地圖】"), React.createElement("p", { "className": "section-desc" }, "系統化彙整「招標審標決標申訴」、「押標金爭議」、「第101條停權申訴」及「履約爭議調解」核心爭點，點擊可直接轉至 KM 知識管理介面登錄機關實務案例。"))), React.createElement("div", { "className": "course-cards-grid" }, (disputeTopics.map((sec) => (
              React.createElement("div", { "key": (sec.id), "className": "course-module-card" }, React.createElement("div", { "className": "course-card-top" }, React.createElement("span", { "className": "badge-navy" }, (sec.track))), React.createElement("h3", { "className": "course-card-title" }, (sec.section)), React.createElement("div", { "className": "dispute-topic-items" }, ((sec.items || []).map((it, idx) => (
                    React.createElement("div", { "key": (idx), "className": "dispute-subitem" }, React.createElement("strong", null, (it.title)), React.createElement("div", { "className": "skill-item-meta" }, "⚖️ ", (it.law_ref)), React.createElement("p", { "className": "v-finding" }, (it.summary)))
                  )))), (onSwitchToKmWithDraft && (
                  React.createElement("div", { "className": "course-related-footer" }, React.createElement("button", { "className": "btn-outline-sm", "onClick": (() =>
                        onSwitchToKmWithDraft({
                          doc_type:
                            sec.id === 'topic_mediation' ? 'mediation_case' : 'appeal_decision',
                          dispute_topic: sec.section,
                          title: '',
                        })) }, "➕ 登錄此類案件至 KM 知識管理素材庫"))
                )))
            ))))))
    );
  }

  // =========================================================================
  // 模式 B：調解／申訴與相關查核／調查報告 輸入介面與 KM 知識管理累積庫
  // =========================================================================
  const maxPatternCount =
    kmAnalytics && kmAnalytics.top_erroneous_patterns && kmAnalytics.top_erroneous_patterns.length > 0
      ? kmAnalytics.top_erroneous_patterns[0].count
      : 1;

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("span", { "className": "badge-emerald" }, "KNOWLEDGE MANAGEMENT REPOSITORY · 持續累積與防弊回饋"), React.createElement("h2", { "className": "section-heading", "style": ({ marginTop: '6px' }) }, "📚 【爭議處理（異議／申訴／調解）＆ 查核／調查報告 知識管理 (KM) 素材庫】"), React.createElement("p", { "className": "section-desc" }, "可供機關持續輸入異議、申訴審議判斷、履約爭議調解、採購稽核／施工查核報告及監察／廉政調查報告，並自動串接「政府採購錯誤行為態樣 Agent Skill」標註高頻缺失，持久化儲存於本地知識庫（", React.createElement("code", null, "data/km_materials.json"), "）累積組織防弊資產。")), React.createElement("a", { "href": "/api/stage3/km/export", "className": "btn-secondary", "style": ({ textDecoration: 'none', display: 'inline-block' }) }, "📥 匯出完整 KM 知識庫 (.json)")), (kmAnalytics && (
          React.createElement("div", null, React.createElement("div", { "className": "km-kpi-grid" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "累計知識管理素材總數"), React.createElement("strong", { "className": "kpi-val" }, (kmAnalytics.total_materials), " 件")), React.createElement("div", { "className": "kpi-box emerald" }, React.createElement("span", { "className": "kpi-label" }, "使用者新增累積素材"), React.createElement("strong", { "className": "kpi-val" }, (kmAnalytics.user_contributed_count), " 件")), React.createElement("div", { "className": "kpi-box amber" }, React.createElement("span", { "className": "kpi-label" }, "涵蓋標案累計預算規模"), React.createElement("strong", { "className": "kpi-val" }, "NT$", (Math.round((kmAnalytics.total_budget_twd || 0) / 10000).toLocaleString()), "萬元")), React.createElement("div", { "className": "kpi-box red" }, React.createElement("span", { "className": "kpi-label" }, "已追蹤高頻錯誤態樣"), React.createElement("strong", { "className": "kpi-val" }, ((kmAnalytics.top_erroneous_patterns || []).length), "類 TOP 缺失"))), React.createElement("div", { "className": "km-analytics-split" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🗂️ 各類知識管理素材分布（點擊可篩選）："), React.createElement("div", { "className": "km-type-chips" }, React.createElement("button", { "className": (filterDocType === 'all' ? 'chip-btn active' : 'chip-btn'), "onClick": (() => {
                      setFilterDocType('all');
                      fetchKmMaterials('all', filterPatternCode, filterQuery);
                    }) }, "全部素材 (", (kmAnalytics.total_materials), ")"), ((kmAnalytics.by_doc_type || []).map((bt) => (
                    React.createElement("button", { "key": (bt.id), "className": (filterDocType === bt.id ? 'chip-btn active' : 'chip-btn'), "onClick": (() => {
                        setFilterDocType(bt.id);
                        fetchKmMaterials(bt.id, filterPatternCode, filterQuery);
                      }) }, (bt.short), " (", (bt.count), ")")
                  ))))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🔥 跨案高頻命中「政府採購錯誤行為態樣」TOP 排行（點擊代碼可交叉篩選）："), React.createElement("div", { "className": "km-top-patterns-list" }, ((kmAnalytics.top_erroneous_patterns || []).map((tp) => {
                    const widthPct = Math.max(16, Math.round((tp.count / maxPatternCount) * 100));
                    return (
                      React.createElement("div", { "key": (tp.code), "className": (filterPatternCode === tp.code
                            ? 'km-pattern-bar-row active'
                            : 'km-pattern-bar-row'), "onClick": (() => {
                          const nextCode = filterPatternCode === tp.code ? 'all' : tp.code;
                          setFilterPatternCode(nextCode);
                          fetchKmMaterials(filterDocType, nextCode, filterQuery);
                        }) }, React.createElement("div", { "className": "km-bar-label" }, React.createElement("span", { "className": "badge-navy" }, (tp.code)), React.createElement("span", { "className": "km-bar-text" }, (tp.pattern_preview)), React.createElement("strong", null, (tp.count), " 案")), React.createElement("div", { "className": "km-bar-track" }, React.createElement("div", { "className": "km-bar-fill", "style": ({ width: widthPct + '%' }) })))
                    );
                  }))))))
        ))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "✍️ 【新增知識管理素材】（支援直接上傳工程會函釋 PDF、監察調查報告、申訴／調解／稽核檔案）"), React.createElement("p", { "className": "section-desc" }, "直接上傳", React.createElement("strong", null, ".pdf / .docx / .odt / .txt"), "公文或報告，後端將自動抽取內文、辨識發文字號與民國日期、歸檔原檔並自動呼叫 277 項錯誤行為態樣 Agent Skill 標註入庫。")), React.createElement("div", { "style": ({ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }) }, React.createElement("label", { "className": "btn-primary", "style": ({ cursor: 'pointer', display: 'inline-block' }) }, "📤 上傳工程會函釋／調查報告 PDF（自動解析填表）", React.createElement("input", { "type": "file", "accept": ".pdf,.docx,.odt,.txt,.md,.csv,.json", "onChange": ((e) => handleKmFileImport(e, false)), "style": ({ display: 'none' }) })), React.createElement("label", { "className": "btn-amber", "style": ({ cursor: 'pointer', display: 'inline-block' }) }, "⚡ 上傳 PDF 並直接自動入庫", React.createElement("input", { "type": "file", "accept": ".pdf,.docx,.odt,.txt,.md,.csv,.json", "onChange": ((e) => handleKmFileImport(e, true)), "style": ({ display: 'none' }) })), React.createElement("button", { "className": "chip-btn", "onClick": (() => fillSampleKmReport('appeal')) }, "⚡ 申訴範例"), React.createElement("button", { "className": "chip-btn", "onClick": (() => fillSampleKmReport('mediation')) }, "⚡ 調解範例"), React.createElement("button", { "className": "chip-btn", "onClick": (() => fillSampleKmReport('investigation')) }, "⚡ 監察調查範例"))), (formSourceFile && (
          React.createElement("div", { "className": "res-item", "style": ({ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }) }, React.createElement("span", null, "📎 已夾帶歸檔原檔：", React.createElement("strong", null, (formSourceFile.original_filename)), "（", (formSourceFile.page_count || 1), " 頁，", (Math.round((formSourceFile.file_size_bytes || 0) / 1024)), "KB）"), React.createElement("a", { "href": (formSourceFile.download_url), "target": "_blank", "rel": "noreferrer", "className": "btn-outline-sm", "style": ({ textDecoration: 'none' }) }, "📄 檢視原檔"))
        )), (submitBanner && React.createElement("div", { "className": "safe-harbor-box" }, (submitBanner))), React.createElement("div", { "className": "km-form-box" }, React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "素材類別："), React.createElement("select", { "value": (formDocType), "onChange": ((e) => setFormDocType(e.target.value)) }, (kmDocTypes.map((dt) => (
                  React.createElement("option", { "key": (dt.id), "value": (dt.id) }, (dt.label))
                ))))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "文號／案號（如：訴115xxxx號、調115xxxx號、院台調字）："), React.createElement("input", { "type": "text", "value": (formCaseNo), "onChange": ((e) => setFormCaseNo(e.target.value)), "placeholder": "例如：調1150148號 / 稽核115-088號" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "結案／報告日期："), React.createElement("input", { "type": "text", "value": (formCaseDate), "onChange": ((e) => setFormCaseDate(e.target.value)), "placeholder": "YYYY-MM-DD" }))), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "案件／報告標題（必填）："), React.createElement("input", { "type": "text", "value": (formTitle), "onChange": ((e) => setFormTitle(e.target.value)), "placeholder": "例如：【調解案件】某道路工程管線障礙展延工期及利管費爭議案" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "爭議爭點／查核主題分類："), React.createElement("input", { "type": "text", "value": (formTopic), "onChange": ((e) => setFormTopic(e.target.value)), "placeholder": "例如：規格綁標 / 第101條情節重大 / 展延工期利管費 / 化整為零" }))), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "受理／查核／調查機關："), React.createElement("input", { "type": "text", "value": (formAuthority), "onChange": ((e) => setFormAuthority(e.target.value)), "placeholder": "如：工程會申訴會、臺北市申訴會、採購稽核小組、監察院" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "招標／受查核機關："), React.createElement("input", { "type": "text", "value": (formAgency), "onChange": ((e) => setFormAgency(e.target.value)), "placeholder": "例如：某工程處／某局處" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "採購類別 ＆ 金額（新臺幣元）："), React.createElement("div", { "style": ({ display: 'flex', gap: '8px' }) }, React.createElement("select", { "value": (formProcCat), "onChange": ((e) => setFormProcCat(e.target.value)), "style": ({ width: '42%' }) }, React.createElement("option", { "value": "engineering" }, "工程"), React.createElement("option", { "value": "property" }, "財物"), React.createElement("option", { "value": "service" }, "勞務")), React.createElement("input", { "type": "number", "value": (formBudget), "onChange": ((e) => setFormBudget(e.target.value)), "style": ({ width: '58%' }) })))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "處理結果／決議狀態："), React.createElement("input", { "type": "text", "value": (formOutcome), "onChange": ((e) => setFormOutcome(e.target.value)), "placeholder": "例如：申訴有理由撤銷原處分 / 調解成立 / 調解不成立提付仲裁 / 監察院糾正" })), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "案情摘要與事實經過："), React.createElement("textarea", { "className": "scanner-textarea", "rows": (4), "value": (formFacts), "onChange": ((e) => setFormFacts(e.target.value)), "placeholder": "請輸入招標、審標、履約爭議或稽核調查之具體事實經過..." })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "審議判斷／調解建議／查核調查結論與核心理由："), React.createElement("textarea", { "className": "scanner-textarea", "rows": (4), "value": (formDecision), "onChange": ((e) => setFormDecision(e.target.value)), "placeholder": "請輸入申訴審議判斷理由、調解建議方案或稽核／監察調查認定結論..." }))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "知識管理（KM）教訓、防弊要點與後續精進作為："), React.createElement("textarea", { "className": "scanner-textarea", "rows": (2), "value": (formLessons), "onChange": ((e) => setFormLessons(e.target.value)), "placeholder": "彙整本案可供日後承辦人與稽核團隊借鏡之防弊要點..." })), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "關聯錯誤行為態樣代碼（逗號分隔，可自動標註）："), React.createElement("input", { "type": "text", "value": (formManualCodes), "onChange": ((e) => setFormManualCodes(e.target.value)), "placeholder": "如：EP-02-02, EP-03-02, ARCH-16-04" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "相關法條依據（逗號分隔）："), React.createElement("input", { "type": "text", "value": (formLawRefs), "onChange": ((e) => setFormLawRefs(e.target.value)), "placeholder": "如：採購法第26條, 第85條之1" })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "知識標籤 Tags（逗號分隔）："), React.createElement("input", { "type": "text", "value": (formTags), "onChange": ((e) => setFormTags(e.target.value)), "placeholder": "如：規格綁標, 展延工期, 強制仲裁" }))), React.createElement("div", { "style": ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }) }, React.createElement("label", { "style": ({ fontWeight: 700, fontSize: '14.5px', cursor: 'pointer' }) }, React.createElement("input", { "type": "checkbox", "checked": (formAutoTag), "onChange": ((e) => setFormAutoTag(e.target.checked)), "style": ({ marginRight: '8px' }) }), "儲存時自動呼叫「政府採購錯誤行為態樣 Agent Skill」進行 277 項缺失代碼標註"), React.createElement("div", { "style": ({ display: 'flex', gap: '10px', flexWrap: 'wrap' }) }, React.createElement("button", { "className": "btn-secondary", "onClick": (handlePreviewAutoTag) }, "🤖 預覽 Agent Skill 錯誤態樣自動標註"), React.createElement("button", { "className": "btn-primary", "onClick": (handleSubmitKmMaterial) }, "💾 寫入並累積至 KM 知識管理素材庫"))), (previewSkillAudit && (
            React.createElement("div", { "className": "root-cause-box", "style": ({ marginTop: '14px' }) }, React.createElement("strong", null, "🤖 Agent Skill 預覽標註結果（風險", (previewSkillAudit.risk_level), " / ", (previewSkillAudit.risk_score), "分）："), (' '), "共自動偵測", (previewSkillAudit.counts.total_matched), "項錯誤行為態樣：", ((previewSkillAudit.matched_patterns || []).map((mp) => (
                React.createElement("span", { "key": (mp.code), "className": "badge-navy", "style": ({ marginLeft: '6px' }) }, (mp.code), " ", (mp.category))
              ))))
          )))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🗂️ 【已累積知識管理素材檢索庫】（共", (kmMaterials.length), "件符合條件）"), React.createElement("p", { "className": "section-desc" }, "支援依素材類型、錯誤行為態樣代碼及全文關鍵字即時檢索；每筆知識素材皆可直接連動右側法規抽屜或匯入 HITL SHA-256 PDF 簽章報告。")), (filterPatternCode !== 'all' && (
            React.createElement("button", { "className": "btn-outline-sm", "onClick": (() => {
                setFilterPatternCode('all');
                fetchKmMaterials(filterDocType, 'all', filterQuery);
              }) }, "✕ 清除態樣代碼篩選：", (filterPatternCode))
          ))), React.createElement("div", { "className": "search-bar-container" }, React.createElement("input", { "type": "text", "className": "law-search-input", "value": (filterQuery), "onChange": ((e) => {
              setFilterQuery(e.target.value);
              fetchKmMaterials(filterDocType, filterPatternCode, e.target.value);
            }), "placeholder": "全文檢索：案名、文號、機關、申訴理由、調解方案、查核缺失、法條或錯誤態樣代碼..." })), React.createElement("div", { "className": "km-cards-list" }, (kmMaterials.map((rec) => {
            const isExpanded = expandedKmId === rec.id;
            return (
              React.createElement("div", { "key": (rec.id), "className": "km-record-card" }, React.createElement("div", { "className": "km-record-header" }, React.createElement("div", { "className": "km-record-badges" }, React.createElement("span", { "className": (rec.doc_type_badge || 'badge-navy') }, (rec.doc_type_short || rec.doc_type)), React.createElement("span", { "className": "badge-navy" }, (rec.case_no)), React.createElement("span", { "className": "badge-amber" }, "📅", (rec.case_date), " ｜ 預算 ", ((rec.budget_twd || 0).toLocaleString()), "元"), (!rec.is_seed && React.createElement("span", { "className": "badge-emerald" }, "✨ 使用者新增累積"))), React.createElement("div", { "style": ({ display: 'flex', gap: '8px', flexWrap: 'wrap' }) }, React.createElement("button", { "className": "btn-outline-sm", "onClick": (() => setExpandedKmId(isExpanded ? '' : rec.id)) }, (isExpanded ? '🔼 收合全文' : '🔽 展開全文與教訓')), React.createElement("button", { "className": "btn-outline-sm", "onClick": (() => handleSyncDrawerWithKm(rec)) }, "📚 連動法規抽屜"), (rec.source_file && rec.source_file.download_url && (
                      React.createElement("a", { "href": (rec.source_file.download_url), "target": "_blank", "rel": "noreferrer", "className": "btn-outline-sm", "style": ({ textDecoration: 'none' }) }, "📄 原檔 (", (rec.source_file.original_filename), ")")
                    )), (onSendToPdfReport && (
                      React.createElement("button", { "className": "btn-outline-sm", "onClick": (() =>
                          onSendToPdfReport({
                            id: rec.id,
                            title: rec.title,
                            category: rec.doc_type_label || rec.dispute_topic,
                            agency: rec.agency || rec.authority,
                            budget_twd: rec.budget_twd || 0,
                            summary: rec.facts_summary,
                            document_excerpt: rec.decision_or_findings,
                            detected_violations: (rec.matched_patterns_detail || []).map((pd) => ({
                              law: '[' + pd.code + '] ' + pd.legal_basis,
                              severity: pd.severity,
                              finding: '【' + pd.category + ' ' + pd.item_no + '】' + pd.pattern,
                            })),
                            root_cause: rec.decision_or_findings,
                            corrective_action: rec.km_lessons,
                          })) }, "🔏 帶入 PDF 報告")
                    )), React.createElement("button", { "className": "btn-outline-sm", "style": ({ color: '#B91C1C', borderColor: '#B91C1C' }), "onClick": (() => handleDeleteKm(rec.id)) }, "🗑️ 刪除"))), React.createElement("h3", { "className": "km-record-title" }, (rec.title)), React.createElement("div", { "className": "km-record-meta-row" }, React.createElement("span", null, "🏛️ 受理／查核單位：", (rec.authority)), React.createElement("span", null, "🏢 受查核／招標機關：", (rec.agency)), React.createElement("span", null, "📌 爭點：", (rec.dispute_topic))), React.createElement("div", { "className": "km-outcome-line" }, React.createElement("strong", null, "⚖️ 處理結果／決議："), (rec.outcome)), (rec.matched_patterns_detail && rec.matched_patterns_detail.length > 0 && (
                  React.createElement("div", { "className": "km-pattern-chips" }, React.createElement("strong", { "style": ({ fontSize: '13.5px', color: '#0F2942' }) }, "🤖 命中錯誤態樣："), (rec.matched_patterns_detail.map((pd) => (
                      React.createElement("span", { "key": (pd.code), "className": (pd.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'), "title": (pd.pattern) }, (pd.code), "（", (pd.category), "）")
                    ))))
                )), (isExpanded && (
                  React.createElement("div", { "className": "km-expanded-body" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "📄 案情摘要與事實經過："), React.createElement("p", { "style": ({ whiteSpace: 'pre-wrap' }) }, (rec.facts_summary))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⚖️ 審議判斷／調解建議／查核調查結論："), React.createElement("p", { "style": ({ whiteSpace: 'pre-wrap' }) }, (rec.decision_or_findings))), React.createElement("div", { "className": "safe-harbor-box", "style": ({ marginBottom: 0 }) }, React.createElement("strong", null, "💡 知識管理（KM）教訓與防弊要點："), React.createElement("p", { "style": ({ whiteSpace: 'pre-wrap', margin: '6px 0 0' }) }, (rec.km_lessons))))
                )), React.createElement("div", { "className": "km-footer-tags" }, ((rec.law_refs || []).map((lr, i) => (
                    React.createElement("span", { "key": (i), "className": "badge-navy" }, "⚖️", (lr))
                  ))), ((rec.tags || []).map((tg, i) => (
                    React.createElement("span", { "key": (i), "className": "badge-emerald" }, "#", (tg))
                  )))))
            );
          })), (kmMaterials.length === 0 && (
            React.createElement("div", { "className": "res-item" }, "目前篩選條件下尚無知識管理素材，歡迎使用上方表單輸入或匯入報告！")
          )))))
  );
}

// --- Compiled from Stage3AuditInvestigator.jsx ---

function Stage3AuditInvestigator({ onUpdateDrawer }) {
  const [subTab, setSubTab] = useState('radar');
  const [prefillKmDraft, setPrefillKmDraft] = useState(null);
  const [sampleCases, setSampleCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [customText, setCustomText] = useState('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  // 第 50 條重大異常關聯 & 第 101/103 條停權檢核台 State
  const [anomalies, setAnomalies] = useState(['serial_registered_mail', 'serial_bank_checks']);
  const [violationClause, setViolationClause] = useState('101_1_12');
  const [priorCount, setPriorCount] = useState(1);
  const [gave10Day, setGave10Day] = useState(true);
  const [reviewedByGroup, setReviewedByGroup] = useState(true);
  const [monthsElapsed, setMonthsElapsed] = useState(14);
  const [riggingResult, setRiggingResult] = useState(null);

  // 三維法律責任剖析器 State
  const [liabScenario, setLiabScenario] = useState('spec_tailoring');
  const [liabRole, setLiabRole] = useState('commissioned_architect');
  const [corruptIntent, setCorruptIntent] = useState(true);
  const [illegalGain, setIllegalGain] = useState(true);
  const [kickbackFlag, setKickbackFlag] = useState(false);
  const [damageAmt, setDamageAmt] = useState(18500000);
  const [liabResult, setLiabResult] = useState(null);

  // HITL SHA-256 電子簽章與原生 PDF 匯出 State
  const [reportType, setReportType] = useState('audit_investigation');
  const [signerName, setSignerName] = useState('王守法');
  const [signerTitle, setSignerTitle] = useState('採購稽核小組簡任稽核員（進階採購專業證照）');
  const [hitlDecision, setHitlDecision] = useState('核准簽辦並移送缺失改善 (HITL Approved)');
  const [hitlNotes, setHitlNotes] = useState(
    '經人工複核母法×施行細則雙欄依據與三維法律責任分析，確認符合115年最新採購法令（含115.7.1公開閱覽新制與114.12再生AC刨用平衡規範）。'
  );
  const [hitlSigPreview, setHitlSigPreview] = useState(null);

  useEffect(() => {
    fetch('/api/stage3/sample-cases')
      .then((r) => r.json())
      .then((data) => {
        if (data.cases && data.cases.length > 0) {
          setSampleCases(data.cases);
          setActiveCase(data.cases[0]);
          setCustomText(data.cases[0].document_excerpt || '');
        }
      });
    runRiggingCheck(['serial_registered_mail', 'serial_bank_checks'], '101_1_12', 1, true, true, 14);
    runLiabilityAnalysis('spec_tailoring', 'commissioned_architect', true, true, false, 18500000);
  }, []);

  const handleSelectCase = (caseId) => {
    fetch('/api/stage3/scan-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.case) {
          setActiveCase(data.case);
          setCustomText(data.case.document_excerpt || '');
          const pl = data.case.preset_liability;
          if (pl) {
            setLiabScenario(pl.scenario_type);
            setLiabRole(pl.actor_role);
            setCorruptIntent(pl.has_corrupt_intent);
            setIllegalGain(pl.has_illegal_gain);
            setKickbackFlag(pl.kickback_or_inflation_flag);
            setDamageAmt(pl.damage_amount_twd);
            runLiabilityAnalysis(
              pl.scenario_type,
              pl.actor_role,
              pl.has_corrupt_intent,
              pl.has_illegal_gain,
              pl.kickback_or_inflation_flag,
              pl.damage_amount_twd
            );
          }
        }
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
      });
  };

  const handleScanCustomText = () => {
    fetch('/api/stage3/scan-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_text: customText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.case) setActiveCase(data.case);
        if (data.drawer_update && onUpdateDrawer) onUpdateDrawer(data.drawer_update);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadStatusMsg('⏳ 正在上傳並解析公文／PDF 檔案：「' + file.name + '」...');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type_hint', 'auto');
    fd.append('auto_save_km', 'false');
    fetch('/api/stage3/upload-official-doc', {
      method: 'POST',
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) {
          setUploadStatusMsg('❌ 上傳解析失敗：' + data.detail);
          return;
        }
        if (data.parsed && data.parsed.extracted_text !== undefined) {
          setCustomText(data.parsed.extracted_text);
        }
        if (data.case) {
          setActiveCase(data.case);
        }
        if (data.drawer_update && onUpdateDrawer) {
          onUpdateDrawer(data.drawer_update);
        }
        const warn = data.parsed && data.parsed.warning_message ? ' ' + data.parsed.warning_message : '';
        setUploadStatusMsg(
          '✅ 已完成解析「' +
            (data.source_file ? data.source_file.original_filename : file.name) +
            '」（共 ' +
            (data.parsed ? data.parsed.page_count : 1) +
            ' 頁、抽取 ' +
            (data.parsed ? data.parsed.char_count : 0) +
            ' 字｜文號：' +
            (data.metadata ? data.metadata.case_no : '') +
            '），並同步執行 277 項錯誤態樣檢核！' +
            warn
        );
      })
      .catch((err) => {
        setUploadStatusMsg('❌ 上傳連線錯誤：' + String(err));
      });
  };

  const toggleAnomaly = (code) => {
    const exists = anomalies.indexOf(code) !== -1;
    const next = exists ? anomalies.filter((a) => a !== code) : anomalies.concat([code]);
    setAnomalies(next);
    runRiggingCheck(next, violationClause, priorCount, gave10Day, reviewedByGroup, monthsElapsed);
  };

  const runRiggingCheck = (anomList, clause, pCount, g10, revGroup, mElapsed) => {
    fetch('/api/stage3/check-rigging-debarment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anomalies: anomList,
        violation_clause: clause,
        prior_debarment_count_in_5yrs: Number(pCount),
        gave_10day_statement_notice: Boolean(g10),
        reviewed_by_work_group_with_external: Boolean(revGroup),
        months_since_violation_or_breach: Number(mElapsed),
      }),
    })
      .then((r) => r.json())
      .then((res) => setRiggingResult(res));
  };

  const runLiabilityAnalysis = (scen, role, intent, gain, kick, dmg) => {
    fetch('/api/stage3/analyze-liability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_type: scen,
        actor_role: role,
        has_corrupt_intent: Boolean(intent),
        has_illegal_gain: Boolean(gain),
        kickback_or_inflation_flag: Boolean(kick),
        damage_amount_twd: Number(dmg),
      }),
    })
      .then((r) => r.json())
      .then((res) => setLiabResult(res));
  };

  const buildPdfPayload = (rType) => {
    return {
      report_type: rType || reportType,
      case_title: activeCase ? activeCase.title : '採購稽核與法規查核案',
      agency: activeCase ? activeCase.agency : '受查核機關',
      budget_twd: activeCase ? activeCase.budget_twd : 50000000,
      signer_name: signerName,
      signer_title: signerTitle,
      hitl_decision: hitlDecision,
      hitl_notes: hitlNotes,
      findings: activeCase ? activeCase.detected_violations : [],
      liability_summary:
        liabResult && liabResult.discretion_vs_corruption_guide
          ? liabResult.discretion_vs_corruption_guide.core_distinction
          : '',
      corrective_action: activeCase ? activeCase.corrective_action : '',
    };
  };

  const handlePreviewHitlSignature = () => {
    const payload = buildPdfPayload(reportType);
    fetch('/api/report/hitl-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.signature) setHitlSigPreview(data.signature);
      });
  };

  const handleDownloadNativePdf = (rType) => {
    const chosenType = rType || reportType;
    setReportType(chosenType);
    const payload = buildPdfPayload(chosenType);
    fetch('/api/report/hitl-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        const sha = res.headers.get('X-HITL-SHA256') || '';
        const ts = res.headers.get('X-HITL-Timestamp') || '';
        if (sha) {
          setHitlSigPreview({
            sha256: sha,
            short_fingerprint: sha.slice(0, 8) + '-' + sha.slice(8, 16) + '-' + sha.slice(-8),
            timestamp: ts,
          });
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          chosenType === 'official_memo'
            ? 'GovProV2_公務簽辦報告_HITL簽章.pdf'
            : 'GovProV2_監察調查與採購稽核查核報告_HITL簽章.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const anomalyOptions = [
    { code: 'serial_registered_mail', label: '投標文件同一郵局交寄且掛號信連號（09500256920號令）' },
    { code: 'serial_bank_checks', label: '押標金同一銀行開具連號支票或同帳戶匯出（09500256920號令）' },
    { code: 'same_handwriting_or_typo', label: '不同廠商標單筆跡相同、異常一致或相同錯別字（09500256920號令）' },
    { code: 'same_contact_address_phone', label: '不同廠商地址、電話、傳真、聯絡人或代領人相同（09500256920號令）' },
    { code: 'same_ip_electronic_bid', label: '不同廠商電子領標或電子投標之 IP 位址相同（09700060670號令）' },
    { code: 'escort_bid_invalid_docs', label: '陪標廠商故意缺漏押標金或資格文件營造三家假性競爭' },
  ];

  const handleTransferToKm = (draft) => {
    setPrefillKmDraft(draft);
    setSubTab('km');
  };

  const handleSendToPdfReport = (caseObj) => {
    setActiveCase(caseObj);
    setCustomText(caseObj.document_excerpt || caseObj.summary || '');
    setSubTab('radar');
  };

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("div", { "className": "stage-hero-banner amber-theme" }, React.createElement("div", { "className": "stage-hero-left" }, React.createElement("span", { "className": "stage-badge-pill" }, "STAGE 3 · AUDIT, ERRONEOUS PATTERNS SKILL, DISPUTE & KM HUB"), React.createElement("h1", { "className": "stage-main-title" }, "⚖️ 階段三：監察查核領航（錯誤行為態樣檢核、爭議處理與知識管理防弊雷達）"), React.createElement("p", { "className": "stage-subtitle" }, "整合「招標與契約風險自動掃描」、「政府採購錯誤行為態樣 Agent Skill 277 項檢核準則」、「爭議處理（異議／申訴／調解）導航」、「調解／申訴／查核調查報告 KM 知識累積庫」及「三維法律責任與 HITL SHA-256 原生 PDF 匯出」。")), React.createElement("div", { "className": "stage-subnav-pills" }, React.createElement("button", { "className": (subTab === 'radar' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('radar')) }, "🔍 風險掃描與防弊停權"), React.createElement("button", { "className": (subTab === 'skill' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('skill')) }, "🤖 錯誤行為態樣 Agent Skill (277項)"), React.createElement("button", { "className": (subTab === 'dispute' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('dispute')) }, "⚖️ 爭議處理（異議／申訴／調解）"), React.createElement("button", { "className": (subTab === 'km' ? 'subnav-btn active' : 'subnav-btn'), "onClick": (() => setSubTab('km')) }, "📚 調解／申訴與查核調查 KM 知識庫"))), (subTab === 'skill' && (
        React.createElement(Stage3ErroneousPatternsSkill, { "onUpdateDrawer": (onUpdateDrawer), "onTransferToKm": (handleTransferToKm), "onSendToPdfReport": (handleSendToPdfReport) })
      )), (subTab === 'dispute' && (
        React.createElement(Stage3DisputeAndKmHub, { "mode": "dispute", "onUpdateDrawer": (onUpdateDrawer), "onSendToPdfReport": (handleSendToPdfReport), "prefillKmDraft": (prefillKmDraft), "onClearPrefill": (() => setPrefillKmDraft(null)), "onSwitchToKmWithDraft": (handleTransferToKm) })
      )), (subTab === 'km' && (
        React.createElement(Stage3DisputeAndKmHub, { "mode": "km", "onUpdateDrawer": (onUpdateDrawer), "onSendToPdfReport": (handleSendToPdfReport), "prefillKmDraft": (prefillKmDraft), "onClearPrefill": (() => setPrefillKmDraft(null)), "onSwitchToKmWithDraft": (handleTransferToKm) })
      )), (subTab === 'radar' && (
        React.createElement("div", { "className": "stage-container" }, React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🔍 【招標與契約風險自動掃描區】（四大監察／稽核實務教案 ＋ 自訂文件上傳掃描）"), React.createElement("p", { "className": "section-desc" }, "點選載入四大經典缺失案例或上傳／貼上招標文件條文，由 AI 自動揪出違反法條、缺失根因與具體處置建議，並連動更新右側抽屜溯源卡片。"))), React.createElement("div", { "className": "sample-cases-bar" }, (sampleCases.map((sc) => (
                React.createElement("button", { "key": (sc.id), "className": (activeCase && activeCase.id === sc.id ? 'case-pill-btn active' : 'case-pill-btn'), "onClick": (() => handleSelectCase(sc.id)) }, "📂", (sc.title))
              )))), React.createElement("div", { "className": "scanner-workbench-grid" }, React.createElement("div", { "className": "scanner-input-panel" }, React.createElement("div", { "className": "scanner-toolbar" }, React.createElement("strong", null, "📄 招標公告／工程會函釋 PDF／監察調查報告摘錄"), React.createElement("label", { "className": "upload-file-btn" }, "📎 上傳公文 PDF／Word／ODT (.pdf/.docx/.odt/.txt)", React.createElement("input", { "type": "file", "accept": ".pdf,.docx,.odt,.txt,.md,.csv,.json", "onChange": (handleFileUpload), "style": ({ display: 'none' }) }))), (uploadStatusMsg && (
                  React.createElement("div", { "className": "safe-harbor-box", "style": ({ marginBottom: '10px', padding: '10px 12px', fontSize: '13.5px' }) }, (uploadStatusMsg))
                )), React.createElement("textarea", { "className": "scanner-textarea", "rows": (6), "value": (customText), "onChange": ((e) => setCustomText(e.target.value)), "placeholder": "請貼上招標須知、施工規範或開審標紀錄文字..." }), React.createElement("button", { "className": "btn-primary", "onClick": (handleScanCustomText) }, "🚨 啟動 AI 法規風險與缺失根因掃描")), (activeCase && (
                React.createElement("div", { "className": "scanner-output-panel" }, React.createElement("div", { "className": "case-summary-header" }, React.createElement("div", null, React.createElement("span", { "className": "badge-navy" }, (activeCase.category)), React.createElement("h3", { "className": "case-title-text" }, (activeCase.title))), React.createElement("span", { "className": "badge-amber" }, "預算", ((activeCase.budget_twd || 0).toLocaleString()), "元")), React.createElement("p", { "className": "case-summary-desc" }, (activeCase.summary)), React.createElement("div", { "className": "violations-list" }, ((activeCase.detected_violations || []).map((v, i) => (
                      React.createElement("div", { "key": (i), "className": "violation-alert-card" }, React.createElement("div", { "className": "v-top" }, React.createElement("span", { "className": (v.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber') }, (v.severity)), React.createElement("strong", null, (v.law))), React.createElement("p", { "className": "v-finding" }, (v.finding)))
                    )))), React.createElement("div", { "className": "root-cause-box" }, React.createElement("div", null, React.createElement("strong", null, "🎯 缺失根因剖析："), (activeCase.root_cause)), React.createElement("div", { "style": ({ marginTop: '6px' }) }, React.createElement("strong", null, "🛠️ 法定導正作為："), (activeCase.corrective_action)), (activeCase.skill_audit && activeCase.skill_audit.matched_codes && activeCase.skill_audit.matched_codes.length > 0 && (
                      React.createElement("div", { "style": ({ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }) }, React.createElement("strong", null, "🤖 Agent Skill 命中錯誤態樣代碼："), (activeCase.skill_audit.matched_codes.slice(0, 6).map((code) => (
                          React.createElement("span", { "key": (code), "className": "badge-navy" }, (code))
                        ))))
                    ))), React.createElement("div", { "style": ({ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }) }, React.createElement("button", { "className": "btn-outline-sm", "onClick": (() =>
                        handleTransferToKm({
                          doc_type: 'audit_report',
                          title: '【風險掃描轉存】' + activeCase.title,
                          dispute_topic: activeCase.category,
                          facts_summary: activeCase.summary + '\n' + (activeCase.document_excerpt || ''),
                          decision_or_findings: activeCase.root_cause,
                          km_lessons: activeCase.corrective_action,
                          matched_pattern_codes:
                            activeCase.skill_audit && activeCase.skill_audit.matched_codes
                              ? activeCase.skill_audit.matched_codes
                              : [],
                          source_file: activeCase.source_file || null,
                        })) }, "📚 將本掃描結果累積至 KM 知識管理素材庫"), (activeCase.source_file && activeCase.source_file.download_url && (
                      React.createElement("a", { "href": (activeCase.source_file.download_url), "target": "_blank", "rel": "noreferrer", "className": "btn-outline-sm", "style": ({ textDecoration: 'none' }) }, "📄 開啟原始上傳檔案 (", (activeCase.source_file.original_filename), ")")
                    ))))
              )))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🛡️ 【第 50 條重大異常關聯（圍標）＆ 第 101/103 條停權處分檢核台】"), React.createElement("p", { "className": "section-desc" }, "自動檢核工程會 09500256920 號令與 09700060670 號令圍標特徵；針對第 101 條停權案件，嚴格把關「10日陳述意見」、「採購工作及審查小組（外聘≥1/3）」、「3個月/6個月/1年階梯累計或3年停權」與「行政罰法3年裁處權時效」。"))), React.createElement("div", { "className": "calc-workbench-grid" }, React.createElement("div", { "className": "calc-form-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "1️⃣ 勾選第 50 條第 1 項第 5 款「重大異常關聯」圍標特徵"), React.createElement("div", { "className": "anomaly-checkbox-list" }, (anomalyOptions.map((opt) => (
                    React.createElement("label", { "key": (opt.code), "className": "anomaly-chk-row" }, React.createElement("input", { "type": "checkbox", "checked": (anomalies.indexOf(opt.code) !== -1), "onChange": (() => toggleAnomaly(opt.code)) }), React.createElement("span", null, (opt.label)))
                  )))), React.createElement("hr", { "className": "calc-divider" }), React.createElement("h3", { "className": "calc-panel-title" }, "2️⃣ 設定第 101 條／第 103 條停權處分程序與時效參數"), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "適用採購法第 101 條第 1 項款次："), React.createElement("select", { "value": (violationClause), "onChange": ((e) => {
                      setViolationClause(e.target.value);
                      runRiggingCheck(anomalies, e.target.value, priorCount, gave10Day, reviewedByGroup, monthsElapsed);
                    }) }, React.createElement("option", { "value": "101_1_1" }, "第1款：容許他人借用本人名義或證件參加投標（停權3年）"), React.createElement("option", { "value": "101_1_2" }, "第2款：借用或冒用他人名義或證件投標（停權3年）"), React.createElement("option", { "value": "101_1_4" }, "第4款：以虛偽不實之文件投標、訂約或履約，情節重大（停權3年）"), React.createElement("option", { "value": "101_1_6" }, "第6款：犯第87~92條之罪，經第一審為有罪判決（3年或1年）"), React.createElement("option", { "value": "101_1_8" }, "第8款：查驗或驗收不合格，情節重大（3個月/6個月/1年階梯）"), React.createElement("option", { "value": "101_1_10" }, "第10款：因可歸責於廠商之事由致延誤履約期限，情節重大（3個月/6個月/1年階梯）"), React.createElement("option", { "value": "101_1_12" }, "第12款：因可歸責於廠商之事由致解除或終止契約，情節重大（3個月/6個月/1年階梯）"))), React.createElement("div", { "className": "form-row-2" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "前 5 年內已刊登公報次數（第7~14款累計加重）："), React.createElement("select", { "value": (priorCount), "onChange": ((e) => {
                        setPriorCount(e.target.value);
                        runRiggingCheck(anomalies, violationClause, e.target.value, gave10Day, reviewedByGroup, monthsElapsed);
                      }) }, React.createElement("option", { "value": (0) }, "0 次（本次為5年內第1次 ➔ 3個月）"), React.createElement("option", { "value": (1) }, "1 次（本次為5年內第2次 ➔ 6個月）"), React.createElement("option", { "value": (2) }, "2 次以上（本次為第3次以上 ➔ 1年）"))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "距違約／違法行為終了已經過月數（檢核36個月時效）："), React.createElement("input", { "type": "number", "value": (monthsElapsed), "onChange": ((e) => {
                        setMonthsElapsed(e.target.value);
                        runRiggingCheck(anomalies, violationClause, priorCount, gave10Day, reviewedByGroup, e.target.value);
                      }) }))), React.createElement("div", { "className": "checkbox-inline-group" }, React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (gave10Day), "onChange": ((e) => {
                        setGave10Day(e.target.checked);
                        runRiggingCheck(anomalies, violationClause, priorCount, e.target.checked, reviewedByGroup, monthsElapsed);
                      }) }), "已書面通知廠商於「10日以上期限」內陳述意見（第101條第3項）"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (reviewedByGroup), "onChange": ((e) => {
                        setReviewedByGroup(e.target.checked);
                        runRiggingCheck(anomalies, violationClause, priorCount, gave10Day, e.target.checked, monthsElapsed);
                      }) }), "已成立「採購工作及審查小組（外聘專家學者≥1/3）」認定符合比例原則"))), (riggingResult && (
                React.createElement("div", { "className": "calc-result-panel" }, React.createElement("h3", { "className": "calc-panel-title" }, "📊 第 50 條圍標判定 ＆ 第 101/103 條停權合法性檢核結果"), React.createElement("div", { "className": "kpi-cards-row" }, React.createElement("div", { "className": "kpi-box navy" }, React.createElement("span", { "className": "kpi-label" }, "第 103 條法定停權期間"), React.createElement("strong", { "className": "kpi-val" }, (riggingResult.article_101_103_check.debarment_duration))), React.createElement("div", { "className": (riggingResult.article_101_103_check.is_procedurally_valid ? 'kpi-box emerald' : 'kpi-box red') }, React.createElement("span", { "className": "kpi-label" }, "停權程序與裁處權時效檢核"), React.createElement("strong", { "className": "kpi-val" }, (riggingResult.article_101_103_check.is_procedurally_valid
                          ? '✅ 程序完備且未逾3年裁處時效'
                          : '❌ 存在重大程序或時效瑕疵')))), React.createElement("div", { "className": "result-detail-list" }, React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "🚨 第 50 條重大異常關聯（09500256920 ＆ 09700060670 號令）命中特徵："), React.createElement("ul", null, ((riggingResult.article_50_check.matched_anomalies || []).map((m, idx) => (
                          React.createElement("li", { "key": (idx) }, (m))
                        )))), React.createElement("p", null, React.createElement("strong", null, "處置建議："), (riggingResult.article_50_check.recommended_action))), React.createElement("div", { "className": "res-item" }, React.createElement("strong", null, "⚖️ 第 101 條正當法律程序與時效（3年停權裁處權 vs 5年押標金追繳）："), React.createElement("p", null, "• 適用條款：", (riggingResult.article_101_103_check.clause_title)), React.createElement("p", null, "• 時效狀態：距事發已", (riggingResult.article_101_103_check.months_since_violation), "個月 — 停權3年時效（36個月）：", (riggingResult.article_101_103_check.is_time_barred_debarment_3yr ? '❌已罹於時效' : '✅未逾時效'), "｜ 第31條押標金追繳5年時效（60個月）：", (riggingResult.article_101_103_check.is_time_barred_bid_bond_5yr ? '❌已逾5年' : '✅未逾5年')), ((riggingResult.article_101_103_check.procedural_defects || []).map((def, i) => (
                        React.createElement("div", { "key": (i), "className": "defect-warning-line" }, (def))
                      ))))))
              )))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🏛️ 【刑事／行政／民事三維法律責任剖析器 ＆ HITL SHA-256 電子簽章 PDF 匯出】"), React.createElement("p", { "className": "section-desc" }, "自動比對《貪污治罪條例》第 4 條第 1 項第 3 款（經辦公用工程舞弊罪）、第 6 條第 1 項第 4 款（圖利罪，嚴格區辨行政裁量與不法）、《採購法》第 87~92 條與《採購人員倫理準則》，並支援 Human-in-the-Loop（HITL）SHA-256 電子簽章匯出原生 PDF。"))), React.createElement("div", { "className": "liability-controls-bar" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "違失行為態樣："), React.createElement("select", { "value": (liabScenario), "onChange": ((e) => {
                    setLiabScenario(e.target.value);
                    runLiabilityAnalysis(e.target.value, liabRole, corruptIntent, illegalGain, kickbackFlag, damageAmt);
                  }) }, React.createElement("option", { "value": "spec_tailoring" }, "規格綁標／違法限制競爭（採購法第26、88條）"), React.createElement("option", { "value": "false_acceptance" }, "驗收不實／監造放水／設計疏失致災（刑法第213、215條）"), React.createElement("option", { "value": "bid_rigging_leak" }, "圍標借牌／開標前洩漏底價或委員名單（採購法第87、89條／刑法第132條）"), React.createElement("option", { "value": "admin_discretion" }, "基於公共利益之合法行政裁量／一般行政作業疏失（區辨非圖利罪）"))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "行為人身分："), React.createElement("select", { "value": (liabRole), "onChange": ((e) => {
                    setLiabRole(e.target.value);
                    runLiabilityAnalysis(liabScenario, e.target.value, corruptIntent, illegalGain, kickbackFlag, damageAmt);
                  }) }, React.createElement("option", { "value": "civil_servant" }, "機關承辦／監辦／主管公務員（刑法第10條身分公務員）"), React.createElement("option", { "value": "commissioned_architect" }, "受託規劃設計監造技師／建築師／專案管理廠商（採購法第88條主體）"), React.createElement("option", { "value": "evaluation_committee" }, "採購評選委員會委員（刑法第10條授權公務員）"), React.createElement("option", { "value": "supplier" }, "投標／得標廠商負責人與從業人員（採購法第87、92條）"))), React.createElement("div", { "className": "checkbox-inline-group" }, React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (kickbackFlag), "onChange": ((e) => {
                      setKickbackFlag(e.target.checked);
                      runLiabilityAnalysis(liabScenario, liabRole, corruptIntent, illegalGain, e.target.checked, damageAmt);
                    }) }), "涉浮報價額／數量或收取回扣（貪污第4條第1項第3款）"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (corruptIntent), "onChange": ((e) => {
                      setCorruptIntent(e.target.checked);
                      runLiabilityAnalysis(liabScenario, liabRole, e.target.checked, illegalGain, kickbackFlag, damageAmt);
                    }) }), "明知違背法令且具圖私人不法利益直接故意（貪污第6條第1項第4款）"), React.createElement("label", null, React.createElement("input", { "type": "checkbox", "checked": (illegalGain), "onChange": ((e) => {
                      setIllegalGain(e.target.checked);
                      runLiabilityAnalysis(liabScenario, liabRole, corruptIntent, e.target.checked, kickbackFlag, damageAmt);
                    }) }), "因而獲得不法利益（結果犯要件）"))), (liabResult && (
              React.createElement("div", null, React.createElement("div", { "className": "identity-banner" }, React.createElement("strong", null, "👤 行為人法律身分定性："), " ", (liabResult.identity_status)), React.createElement("div", { "className": "three-dim-grid" }, React.createElement("div", { "className": "dim-card criminal-dim" }, React.createElement("div", { "className": "dim-header red-bar" }, "🚨 一、刑事責任剖析（貪污治罪條例 ＆ 採購法第87~92條）"), React.createElement("div", { "className": "dim-body" }, ((liabResult.criminal_liabilities || []).map((c, idx) => (
                        React.createElement("div", { "key": (idx), "className": "liab-item" }, React.createElement("div", { "className": "liab-law" }, (c.law)), React.createElement("div", { "className": "liab-penalty" }, "法定刑度：", (c.penalty)), React.createElement("p", { "className": "liab-desc" }, (c.analysis)))
                      ))))), React.createElement("div", { "className": "dim-card admin-dim" }, React.createElement("div", { "className": "dim-header navy-bar" }, "📋 二、行政責任剖析（採購人員倫理準則 ＆ 第101條停權）"), React.createElement("div", { "className": "dim-body" }, ((liabResult.admin_liabilities || []).map((a, idx) => (
                        React.createElement("div", { "key": (idx), "className": "liab-item" }, React.createElement("div", { "className": "liab-law" }, (a.law)), React.createElement("div", { "className": "liab-penalty" }, "處分效果：", (a.penalty)), React.createElement("p", { "className": "liab-desc" }, (a.analysis)))
                      ))))), React.createElement("div", { "className": "dim-card civil-dim" }, React.createElement("div", { "className": "dim-header emerald-bar" }, "⚖️ 三、民事責任剖析（損害賠償、第59條扣減、第72條減價）"), React.createElement("div", { "className": "dim-body" }, ((liabResult.civil_liabilities || []).map((cv, idx) => (
                        React.createElement("div", { "key": (idx), "className": "liab-item" }, React.createElement("div", { "className": "liab-law" }, (cv.law)), React.createElement("div", { "className": "liab-penalty" }, "求償效果：", (cv.penalty)), React.createElement("p", { "className": "liab-desc" }, (cv.analysis)))
                      )))))), (liabResult.discretion_vs_corruption_guide && (
                  React.createElement("div", { "className": "safe-harbor-box" }, React.createElement("h4", null, "💡 【圖利罪（貪污第6條第1項第4款） vs 合法行政裁量（採購法第6條第2項）區辨指引】"), React.createElement("p", null, (liabResult.discretion_vs_corruption_guide.core_distinction)), React.createElement("ul", null, ((liabResult.discretion_vs_corruption_guide.safe_harbor_steps || []).map((st, idx) => (
                        React.createElement("li", { "key": (idx) }, (st))
                      )))))
                )))
            )), React.createElement("div", { "className": "hitl-export-panel" }, React.createElement("div", { "className": "hitl-header" }, React.createElement("div", null, React.createElement("span", { "className": "badge-navy" }, "HUMAN-IN-THE-LOOP (HITL) CRYPTOGRAPHIC SEAL"), React.createElement("h3", { "className": "hitl-title" }, "🔏 人工覆核 SHA-256 電子簽章與原生 PDF 正式報告匯出"))), React.createElement("div", { "className": "form-row-3" }, React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "匯出報告類別："), React.createElement("select", { "value": (reportType), "onChange": ((e) => setReportType(e.target.value)) }, React.createElement("option", { "value": "official_memo" }, "📄 公務簽辦報告（採購實務領航與法規簽辦）"), React.createElement("option", { "value": "audit_investigation" }, "🕵️ 監察調查／採購稽核查核報告（防弊雷達與三維責任）"))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "覆核簽章人員姓名："), React.createElement("input", { "type": "text", "value": (signerName), "onChange": ((e) => setSignerName(e.target.value)) })), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "職稱與採購專業證照字號："), React.createElement("input", { "type": "text", "value": (signerTitle), "onChange": ((e) => setSignerTitle(e.target.value)) }))), React.createElement("div", { "className": "form-group" }, React.createElement("label", null, "HITL 人工審核批示意見（納入 SHA-256 數位簽章保護範圍）："), React.createElement("input", { "type": "text", "value": (hitlNotes), "onChange": ((e) => setHitlNotes(e.target.value)) })), React.createElement("div", { "className": "hitl-actions-row" }, React.createElement("button", { "className": "btn-secondary", "onClick": (handlePreviewHitlSignature) }, "🔐 產生 HITL SHA-256 數位簽章指紋"), React.createElement("button", { "className": "btn-primary", "onClick": (() => handleDownloadNativePdf('official_memo')) }, "📥 匯出「公務簽辦報告」原生 PDF"), React.createElement("button", { "className": "btn-amber", "onClick": (() => handleDownloadNativePdf('audit_investigation')) }, "📥 匯出「監察調查／採購稽核查核報告」原生 PDF")), (hitlSigPreview && (
                React.createElement("div", { "className": "hitl-sig-badge-box" }, React.createElement("div", null, React.createElement("strong", null, "✔️ 已完成 HITL SHA-256 電子簽章雜湊驗證"), " ｜ 簽署時間：", (hitlSigPreview.timestamp)), React.createElement("div", { "className": "sha-code-line" }, "SHA-256 指紋：", (hitlSigPreview.sha256)))
              )))))
      )))
  );
}

// --- Compiled from App.jsx ---

function App() {
  const [activeStage, setActiveStage] = useState('stage1');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({
    law_cards: [],
    textbook_citations: [],
    agent_topology: { nodes: [], edges: [], execution_trace: [] },
  });

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.default_drawer_data) {
          setDrawerData(data.default_drawer_data);
        }
      })
      .catch((err) => console.error('Health init error:', err));
  }, []);

  const handleOpenDrawerWithLaw = (lawQuery) => {
    fetch('/api/agent/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: lawQuery, stage: activeStage }),
    })
      .then((r) => r.json())
      .then((data) => {
        setDrawerData({
          law_cards: data.law_cards || [],
          textbook_citations: data.textbook_citations || [],
          agent_topology: data.agent_topology || {},
        });
        setDrawerOpen(true);
      });
  };

  const handleUpdateDrawer = (newDrawerData) => {
    setDrawerData((prev) => ({
      law_cards: newDrawerData.law_cards || prev.law_cards,
      textbook_citations: newDrawerData.textbook_citations || prev.textbook_citations,
      agent_topology: newDrawerData.agent_topology || prev.agent_topology,
    }));
  };

  return (
    React.createElement("div", { "className": "govpro-v2-app" }, React.createElement("header", { "className": "executive-topbar" }, React.createElement("div", { "className": "topbar-brand" }, React.createElement("div", { "className": "brand-emblem" }, "🏛️"), React.createElement("div", { "className": "brand-titles" }, React.createElement("span", { "className": "brand-eyebrow" }, "EXECUTIVE PROCUREMENT AI NAVIGATOR V2.0 · 115年最新法規基準"), React.createElement("span", { "className": "brand-main" }, "政府採購 AI 領航員平台 V2.0"))), React.createElement("nav", { "className": "three-stage-stepper", "aria-label": "三階段漸進式領航切換器" }, React.createElement("button", { "className": (activeStage === 'stage1' ? 'stepper-tab active stage1-tab' : 'stepper-tab'), "onClick": (() => setActiveStage('stage1')) }, React.createElement("span", { "className": "step-num" }, "STAGE 1"), React.createElement("span", { "className": "step-title" }, "🎓 階段一：考證培訓賦能"), React.createElement("span", { "className": "step-desc" }, "採購專業人員基礎/進階認證教練")), React.createElement("div", { "className": "stepper-arrow" }, "➔"), React.createElement("button", { "className": (activeStage === 'stage2' ? 'stepper-tab active stage2-tab' : 'stepper-tab'), "onClick": (() => setActiveStage('stage2')) }, React.createElement("span", { "className": "step-num" }, "STAGE 2"), React.createElement("span", { "className": "step-title" }, "🧭 階段二：採購實務領航"), React.createElement("span", { "className": "step-desc" }, "全生命週期五階段智慧辦案助理")), React.createElement("div", { "className": "stepper-arrow" }, "➔"), React.createElement("button", { "className": (activeStage === 'stage3' ? 'stepper-tab active stage3-tab' : 'stepper-tab'), "onClick": (() => setActiveStage('stage3')) }, React.createElement("span", { "className": "step-num" }, "STAGE 3"), React.createElement("span", { "className": "step-title" }, "⚖️ 階段三：監察查核領航"), React.createElement("span", { "className": "step-desc" }, "工程查核、採購稽核與監察防弊雷達"))), React.createElement("div", { "className": "topbar-actions" }, React.createElement("button", { "className": "btn-drawer-trigger", "onClick": (() => setDrawerOpen(!drawerOpen)) }, "📚 法規溯源與 AI 軌跡抽屜 (", ((drawerData.law_cards || []).length), ")"))), React.createElement("main", { "className": "executive-main-workspace" }, (activeStage === 'stage1' && (
          React.createElement(Stage1CertificationCoach, { "onOpenDrawerWithLaw": (handleOpenDrawerWithLaw) })
        )), (activeStage === 'stage2' && (
          React.createElement(Stage2LifecycleNavigator, { "onUpdateDrawer": (handleUpdateDrawer) })
        )), (activeStage === 'stage3' && (
          React.createElement(Stage3AuditInvestigator, { "onUpdateDrawer": (handleUpdateDrawer) })
        ))), React.createElement(SlideOverDrawer, { "isOpen": (drawerOpen), "onClose": (() => setDrawerOpen(false)), "drawerData": (drawerData) }))
  );
}

// --- Mount Application ---
document.addEventListener('DOMContentLoaded', function() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(React.createElement(App, null));
  }
});
