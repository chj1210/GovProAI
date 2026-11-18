import React, { useState, useEffect } from 'react';

export default function Stage1CertificationCoach({ onOpenDrawerWithLaw }) {
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
    <div className="stage-container">
      <div className="stage-hero-banner navy-theme">
        <div className="stage-hero-left">
          <span className="stage-badge-pill">STAGE 1 · CERTIFICATION &amp; LEGAL MASTERY</span>
          <h1 className="stage-main-title">🎓 階段一：考證培訓賦能（採購專業人員基礎／進階認證教練）</h1>
          <p className="stage-subtitle">
            依循工程會 115 年最新標準教材，整合「基礎與進階章節精讀」、「母法×施行細則雙欄同步對照」及「AI 模擬認證測驗室」。
          </p>
        </div>
        <div className="stage-subnav-pills">
          <button
            className={subTab === 'courses' ? 'subnav-btn active' : 'subnav-btn'}
            onClick={() => setSubTab('courses')}
          >
            📘 課程知識導覽
          </button>
          <button
            className={subTab === 'crossref' ? 'subnav-btn active' : 'subnav-btn'}
            onClick={() => setSubTab('crossref')}
          >
            ⚖️ 母法 × 施行細則雙欄對照檢索
          </button>
          <button
            className={subTab === 'quiz' ? 'subnav-btn active' : 'subnav-btn'}
            onClick={() => setSubTab('quiz')}
          >
            📝 AI 模擬認證測驗室
          </button>
        </div>
      </div>

      {subTab === 'courses' && (
        <section className="content-card">
          <div className="card-header-row">
            <div>
              <h2 className="section-heading">📘 採購專業人員「基礎訓練 vs 進階訓練」章節精讀卡片</h2>
              <p className="section-desc">
                涵蓋 115 年最新門檻（150萬公告／15萬小額／5000萬&amp;1000萬查核公開閱覽／土木包工業720萬／再生AC 20%&amp;60%刨用平衡）核心考點。
              </p>
            </div>
            <div className="segmented-toggle">
              <button
                className={courseLevel === 'basic' ? 'seg-btn active' : 'seg-btn'}
                onClick={() => setCourseLevel('basic')}
              >
                基礎訓練（3大核心章節）
              </button>
              <button
                className={courseLevel === 'advanced' ? 'seg-btn active' : 'seg-btn'}
                onClick={() => setCourseLevel('advanced')}
              >
                進階訓練（5大實務研討）
              </button>
            </div>
          </div>

          <div className="course-cards-grid">
            {currentCourses.map((mod) => (
              <div key={mod.id} className="course-module-card">
                <div className="course-card-top">
                  <span className="badge-navy">{mod.category}</span>
                  <span className="badge-amber">時數 {mod.hours} · {mod.badge}</span>
                </div>
                <h3 className="course-card-title">{mod.title}</h3>
                <div className="course-textbook-tag">📖 教材出處：{mod.textbook_ref}</div>
                <p className="course-summary">{mod.summary}</p>
                <ul className="course-keypoints-list">
                  {(mod.key_points || []).map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
                <div className="course-related-footer">
                  <span className="related-label">關聯重點條文（點擊開啟雙欄對照）：</span>
                  <div className="related-chips">
                    {(mod.related_articles || []).map((artNo) => (
                      <button
                        key={artNo}
                        className="chip-btn"
                        onClick={() => {
                          setSubTab('crossref');
                          handleLawSearch(artNo);
                          if (onOpenDrawerWithLaw) onOpenDrawerWithLaw(artNo);
                        }}
                      >
                        {artNo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {subTab === 'crossref' && (
        <section className="content-card">
          <div className="card-header-row">
            <div>
              <h2 className="section-heading">⚖️ 《政府採購法》母法 × 《施行細則》雙欄同步對照檢索</h2>
              <p className="section-desc">
                輸入條號或關鍵字（如「第15條」、「第31條」、「第101條」、「公開閱覽」、「二親等」），左右雙欄即時對照母法、施行細則與教材釋義。
              </p>
            </div>
          </div>

          <div className="search-bar-container">
            <input
              type="text"
              className="law-search-input"
              placeholder="🔍 請輸入條號或關鍵字（例如：第15條、第31條、第101條、二親等、押標金5年、公開閱覽）..."
              value={lawSearchQuery}
              onChange={(e) => handleLawSearch(e.target.value)}
            />
            <button className="btn-secondary" onClick={() => handleLawSearch('')}>
              顯示全部核心條文
            </button>
          </div>

          <div className="quick-tags-bar">
            {quickLawTags.map((item) => (
              <button
                key={item.q}
                className={lawSearchQuery === item.q ? 'chip-btn active' : 'chip-btn'}
                onClick={() => handleLawSearch(item.q)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="dual-law-list">
            {lawsList.map((law) => (
              <div key={law.article_no} className="dual-law-card">
                <div className="dual-law-header">
                  <div className="dual-law-title-group">
                    <span className="badge-navy-lg">{law.article_no}</span>
                    <h3 className="dual-law-title">{law.title}</h3>
                  </div>
                  <div className="dual-law-meta">
                    <span className="badge-amber">📄 {law.textbook_page}</span>
                    <button
                      className="btn-outline-sm"
                      onClick={() => onOpenDrawerWithLaw && onOpenDrawerWithLaw(law.article_no)}
                    >
                      收納至右側溯源抽屜 ➔
                    </button>
                  </div>
                </div>

                <div className="dual-law-grid">
                  <div className="law-pane mother-law-pane">
                    <div className="pane-title-bar navy-bar">
                      🏛️ 《政府採購法》母法主文（{law.article_no}）
                    </div>
                    <pre className="law-pre-text">{law.mother_law}</pre>
                  </div>

                  <div className="law-pane rule-law-pane">
                    <div className="pane-title-bar emerald-bar">
                      📑 《施行細則／相關子法解釋令》（{law.enforcement_rule_no}）
                    </div>
                    <pre className="law-pre-text">{law.enforcement_rule}</pre>
                  </div>
                </div>

                <div className="law-textbook-note">
                  <span className="note-badge">🎓 工程會教材逐條說明與修法重點</span>
                  <p className="note-body">{law.textbook_commentary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {subTab === 'quiz' && (
        <section className="content-card">
          <div className="card-header-row">
            <div>
              <h2 className="section-heading">📝 AI 模擬認證測驗室（即時批改計分 × 錯題法條詳解）</h2>
              <p className="section-desc">
                支援切換「基礎認證模擬考（及格門檻70分）」與「進階認證模擬考」，作答後即時批改並顯示錯題母法依據與詳解。
              </p>
            </div>
            <div className="segmented-toggle">
              <button
                className={quizLevel === 'basic' ? 'seg-btn active' : 'seg-btn'}
                onClick={() => {
                  setQuizLevel('basic');
                  setQuizResult(null);
                  setUserAnswers({});
                }}
              >
                基礎認證模擬考
              </button>
              <button
                className={quizLevel === 'advanced' ? 'seg-btn active' : 'seg-btn'}
                onClick={() => {
                  setQuizLevel('advanced');
                  setQuizResult(null);
                  setUserAnswers({});
                }}
              >
                進階認證模擬考
              </button>
            </div>
          </div>

          <div className="quiz-action-toolbar">
            <button className="btn-primary" onClick={handleGradeQuiz}>
              ✅ 立即交卷批改計分
            </button>
            <button className="btn-secondary" onClick={handleDemoFillQuiz}>
              ⚡ 一鍵載入示範作答（含錯題詳解演練）
            </button>
          </div>

          {quizResult && (
            <div className={quizResult.passed ? 'quiz-score-banner pass' : 'quiz-score-banner fail'}>
              <div className="score-main">
                <span className="score-number">{quizResult.score} 分</span>
                <span className="score-status">
                  {quizResult.passed ? '🎉 恭喜通過認證標準（≥70分）！' : '⚠️ 未達及格標準（70分），請檢視下方錯題法條詳解'}
                </span>
              </div>
              <div className="score-detail">
                測驗級別：{quizResult.level_title} ｜ 答對題數：{quizResult.correct_count} / {quizResult.total_questions} 題
              </div>
            </div>
          )}

          <div className="quiz-questions-list">
            {currentQuestions.map((q, qIdx) => {
              const gradedItem = quizResult
                ? (quizResult.graded_items || []).find((g) => g.id === q.id)
                : null;
              return (
                <div key={q.id} className="quiz-question-card">
                  <div className="quiz-q-header">
                    <span className="badge-navy">第 {qIdx + 1} 題</span>
                    <p className="quiz-q-text">{q.question}</p>
                  </div>
                  <div className="quiz-options-grid">
                    {(q.options || []).map((optText, optIdx) => {
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
                        <button
                          key={optIdx}
                          type="button"
                          className={optClass}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                        >
                          {optText}
                        </button>
                      );
                    })}
                  </div>
                  {gradedItem && (
                    <div className={gradedItem.is_correct ? 'quiz-explanation-box ok' : 'quiz-explanation-box err'}>
                      <div className="exp-title">
                        {gradedItem.is_correct ? '✔️ 作答正確！' : '❌ 錯題診斷與法條依據'} — <strong>{gradedItem.law_ref}</strong>
                      </div>
                      <p className="exp-text">{gradedItem.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
