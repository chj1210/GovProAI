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

// --- Compiled from Stage3AuditInvestigator.jsx ---

function Stage3AuditInvestigator({ onUpdateDrawer }) {
  const [sampleCases, setSampleCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [customText, setCustomText] = useState('');

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
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target.result || '');
      setCustomText(content);
    };
    reader.readAsText(file);
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

  return (
    React.createElement("div", { "className": "stage-container" }, React.createElement("div", { "className": "stage-hero-banner amber-theme" }, React.createElement("div", { "className": "stage-hero-left" }, React.createElement("span", { "className": "stage-badge-pill" }, "STAGE 3 · AUDIT, ANTI-RIGGING & 3D LIABILITY RADAR"), React.createElement("h1", { "className": "stage-main-title" }, "⚖️ 階段三：監察查核領航（工程查核、採購稽核與監察調查防弊雷達）"), React.createElement("p", { "className": "stage-subtitle" }, "整合「招標與契約風險自動掃描」、「第50條重大異常關聯＆第101/103條停權處分檢核台」與「刑事/行政/民事三維法律責任剖析器（含 HITL SHA-256 電子簽章原生 PDF 匯出）」。"))), React.createElement("section", { "className": "content-card" }, React.createElement("div", { "className": "card-header-row" }, React.createElement("div", null, React.createElement("h2", { "className": "section-heading" }, "🔍 【招標與契約風險自動掃描區】（四大監察／稽核實務教案 ＋ 自訂文件上傳掃描）"), React.createElement("p", { "className": "section-desc" }, "點選載入四大經典缺失案例或上傳／貼上招標文件條文，由 AI 自動揪出違反法條、缺失根因與具體處置建議，並連動更新右側抽屜溯源卡片。"))), React.createElement("div", { "className": "sample-cases-bar" }, (sampleCases.map((sc) => (
            React.createElement("button", { "key": (sc.id), "className": (activeCase && activeCase.id === sc.id ? 'case-pill-btn active' : 'case-pill-btn'), "onClick": (() => handleSelectCase(sc.id)) }, "📂", (sc.title))
          )))), React.createElement("div", { "className": "scanner-workbench-grid" }, React.createElement("div", { "className": "scanner-input-panel" }, React.createElement("div", { "className": "scanner-toolbar" }, React.createElement("strong", null, "📄 招標公告／施工規範／契約條文摘錄"), React.createElement("label", { "className": "upload-file-btn" }, "📎 上傳招標或契約文字檔 (.txt/.md)", React.createElement("input", { "type": "file", "accept": ".txt,.md,.csv,.json", "onChange": (handleFileUpload), "style": ({ display: 'none' }) }))), React.createElement("textarea", { "className": "scanner-textarea", "rows": (6), "value": (customText), "onChange": ((e) => setCustomText(e.target.value)), "placeholder": "請貼上招標須知、施工規範或開審標紀錄文字..." }), React.createElement("button", { "className": "btn-primary", "onClick": (handleScanCustomText) }, "🚨 啟動 AI 法規風險與缺失根因掃描")), (activeCase && (
            React.createElement("div", { "className": "scanner-output-panel" }, React.createElement("div", { "className": "case-summary-header" }, React.createElement("div", null, React.createElement("span", { "className": "badge-navy" }, (activeCase.category)), React.createElement("h3", { "className": "case-title-text" }, (activeCase.title))), React.createElement("span", { "className": "badge-amber" }, "預算", ((activeCase.budget_twd || 0).toLocaleString()), "元")), React.createElement("p", { "className": "case-summary-desc" }, (activeCase.summary)), React.createElement("div", { "className": "violations-list" }, ((activeCase.detected_violations || []).map((v, i) => (
                  React.createElement("div", { "key": (i), "className": "violation-alert-card" }, React.createElement("div", { "className": "v-top" }, React.createElement("span", { "className": (v.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber') }, (v.severity)), React.createElement("strong", null, (v.law))), React.createElement("p", { "className": "v-finding" }, (v.finding)))
                )))), React.createElement("div", { "className": "root-cause-box" }, React.createElement("div", null, React.createElement("strong", null, "🎯 缺失根因剖析："), (activeCase.root_cause)), React.createElement("div", { "style": ({ marginTop: '6px' }) }, React.createElement("strong", null, "🛠️ 法定導正作為："), (activeCase.corrective_action))))
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
