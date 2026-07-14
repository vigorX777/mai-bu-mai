"use client";

import { toPng } from "html-to-image";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BIAS_LABELS,
  GATE_LABELS,
  GATES,
  PATHS,
  PERSONAS,
  decodeSharedResult,
  encodeSharedResult,
  estimatePersonaShare,
  evaluateQuiz,
  getQuestion,
  personaShareCopy,
  selectQuestions,
  shareText,
  type Bias,
  type Gate,
  type Option,
  type Question,
  type QuizResult,
  type Selection,
  type TradePath,
  type Variant,
} from "../lib/domain";

type View = "intro" | "quiz" | "settling" | "result";

interface StoredQuiz {
  version: 1;
  path: TradePath;
  questionIds: string[];
  selections: Selection[];
  currentIndex: number;
}

interface StoredResult {
  version: 1;
  path: TradePath;
  questionIds: string[];
  selections: Selection[];
  result: QuizResult;
  completedAt: string;
}

const STORAGE = {
  session: "maibumai:v1:session",
  result: "maibumai:v1:last-result",
  versions: "maibumai:v1:last-versions",
  count: "maibumai:v1:test-count",
};

const PATH_FOCUS: Record<TradePath, { focus: string; action: string }> = {
  buy: { focus: "追涨 · 从众 · 抄底幻觉", action: "开始审买入" },
  add: { focus: "回本执念 · 计划漂移 · 仓位失控", action: "开始审加仓" },
  sell: { focus: "损失厌恶 · 卖飞焦虑 · 止损失忆", action: "开始审卖出" },
};

function readStorage<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is an optional enhancement; the test remains fully usable.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

function isStoredQuiz(value: StoredQuiz | null): value is StoredQuiz {
  return Boolean(
    value &&
      value.version === 1 &&
      PATHS[value.path] &&
      value.questionIds.length === 5 &&
      value.currentIndex >= 0 &&
      value.currentIndex < 5,
  );
}

function isStoredResult(value: StoredResult | null): value is StoredResult {
  return Boolean(
    value &&
      value.version === 1 &&
      PATHS[value.path] &&
      value.questionIds.length === 5 &&
      PERSONAS[value.result.primary],
  );
}

function buildSharedResultUrl(record: StoredResult): string {
  const url = new URL(window.location.href);
  url.search = encodeSharedResult(record.path, record.questionIds, record.selections);
  url.hash = "result";
  return url.toString();
}

function replaceSharedResultUrl(record: StoredResult) {
  const url = new URL(buildSharedResultUrl(record));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function clearSharedResultUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("p");
  url.searchParams.delete("v");
  url.searchParams.delete("a");
  url.hash = "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

async function copyPlainText(value: string): Promise<boolean> {
  try {
    await window.navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

export function QuizApp() {
  const [view, setView] = useState<View>("intro");
  const [path, setPath] = useState<TradePath>("buy");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stamped, setStamped] = useState<Option["id"] | null>(null);
  const [locked, setLocked] = useState(false);
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      const shared = decodeSharedResult(window.location.search);
      const session = readStorage<StoredQuiz>(STORAGE.session);
      const recent = readStorage<StoredResult>(STORAGE.result);
      if (shared) {
        const result = evaluateQuiz(shared.path, shared.selections);
        const record: StoredResult = {
          version: 1,
          path: shared.path,
          questionIds: shared.questionIds,
          selections: shared.selections,
          result,
          completedAt: new Date().toISOString(),
        };
        setPath(shared.path);
        setQuestionIds(shared.questionIds);
        setSelections(shared.selections);
        setStoredResult(record);
        setView("result");
      } else if (isStoredQuiz(session)) {
        setPath(session.path);
        setQuestionIds(session.questionIds);
        setSelections(session.selections);
        setCurrentIndex(session.currentIndex);
        setView("quiz");
      } else if (isStoredResult(recent)) {
        setPath(recent.path);
        setQuestionIds(recent.questionIds);
        setSelections(recent.selections);
        setStoredResult(recent);
        setView("result");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrateTimer);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    if (!hydrated || view !== "quiz" || questionIds.length !== 5) return;
    writeStorage(STORAGE.session, {
      version: 1,
      path,
      questionIds,
      selections,
      currentIndex,
    } satisfies StoredQuiz);
  }, [currentIndex, hydrated, path, questionIds, selections, view]);

  const currentQuestion = questionIds[currentIndex]
    ? getQuestion(questionIds[currentIndex])
    : null;

  const startQuiz = useCallback((nextPath: TradePath) => {
    const versionHistory =
      readStorage<Partial<Record<TradePath, Partial<Record<Gate, Variant>>>>>(STORAGE.versions) ?? {};
    const questions = selectQuestions(nextPath, versionHistory[nextPath] ?? {});
    const nextVersions = {
      ...versionHistory,
      [nextPath]: Object.fromEntries(
        questions.map((question) => [question.gate, question.variant]),
      ) as Record<Gate, Variant>,
    };

    writeStorage(STORAGE.versions, nextVersions);
    removeStorage(STORAGE.session);
    removeStorage(STORAGE.result);
    clearSharedResultUrl();
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setPath(nextPath);
    setQuestionIds(questions.map((question) => question.id));
    setSelections([]);
    setCurrentIndex(0);
    setStamped(null);
    setLocked(false);
    setStoredResult(null);
    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const finishQuiz = useCallback(
    (finalSelections: Selection[]) => {
      setView("settling");
      removeStorage(STORAGE.session);
      const settleTimer = window.setTimeout(() => {
        const result = evaluateQuiz(path, finalSelections);
        const record: StoredResult = {
          version: 1,
          path,
          questionIds,
          selections: finalSelections,
          result,
          completedAt: new Date().toISOString(),
        };
        const count = readStorage<number>(STORAGE.count) ?? 0;
        writeStorage(STORAGE.count, count + 1);
        writeStorage(STORAGE.result, record);
        replaceSharedResultUrl(record);
        setStoredResult(record);
        setView("result");
        setLocked(false);
        window.scrollTo({ top: 0 });
      }, 1200);
      timers.current.push(settleTimer);
    },
    [path, questionIds],
  );

  const chooseAnswer = useCallback(
    (optionId: Option["id"]) => {
      if (!currentQuestion || locked) return;
      const selection: Selection = { questionId: currentQuestion.id, optionId };
      const nextSelections = [
        ...selections.filter((item) => item.questionId !== currentQuestion.id),
        selection,
      ];
      setSelections(nextSelections);
      setStamped(optionId);
      setLocked(true);
      try {
        window.navigator.vibrate?.(18);
      } catch {
        // Haptics are an optional enhancement.
      }

      const answerTimer = window.setTimeout(() => {
        setStamped(null);
        if (currentIndex === 4) {
          finishQuiz(nextSelections);
        } else {
          setCurrentIndex((index) => index + 1);
          setLocked(false);
        }
      }, 760);
      timers.current.push(answerTimer);
    },
    [currentIndex, currentQuestion, finishQuiz, locked, selections],
  );

  useEffect(() => {
    if (view !== "quiz") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        event.preventDefault();
        chooseAnswer((["A", "B", "C"] as const)[Number(event.key) - 1]);
      }
      if (event.key === "ArrowLeft" && currentIndex > 0 && !locked) {
        event.preventDefault();
        setCurrentIndex((index) => index - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseAnswer, currentIndex, locked, view]);

  const goHome = () => {
    removeStorage(STORAGE.session);
    removeStorage(STORAGE.result);
    clearSharedResultUrl();
    setView("intro");
    setStoredResult(null);
    setSelections([]);
    setQuestionIds([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!hydrated) {
    return (
      <main className="app-shell loading-shell" aria-busy="true">
        <div className="loading-mark">正在为你的冲动补写逻辑</div>
      </main>
    );
  }

  return (
    <main className={`app-shell view-${view}`}>
      <SiteHeader onHome={goHome} compact={view !== "intro"} />

      {view === "intro" && <Intro onStart={startQuiz} />}
      {view === "quiz" && currentQuestion && (
        <Quiz
          path={path}
          question={currentQuestion}
          currentIndex={currentIndex}
          selected={selections.find((item) => item.questionId === currentQuestion.id)?.optionId}
          stamped={stamped}
          locked={locked}
          onChoose={chooseAnswer}
          onBack={() => currentIndex > 0 && !locked && setCurrentIndex((index) => index - 1)}
        />
      )}
      {view === "settling" && <Settling path={path} />}
      {view === "result" && storedResult && (
        <ResultView record={storedResult} onHome={goHome} />
      )}

      <SiteFooter />
    </main>
  );
}

function SiteFooter() {
  const [wechatHovered, setWechatHovered] = useState(false);
  const [wechatFocused, setWechatFocused] = useState(false);
  const [wechatPinned, setWechatPinned] = useState(false);
  const wechatRef = useRef<HTMLDivElement>(null);
  const wechatButtonRef = useRef<HTMLButtonElement>(null);
  const wechatOpen = wechatHovered || wechatFocused || wechatPinned;

  useEffect(() => {
    if (!wechatPinned) return;
    const closeOutside = (event: PointerEvent) => {
      if (!wechatRef.current?.contains(event.target as Node)) setWechatPinned(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setWechatPinned(false);
      setWechatHovered(false);
      setWechatFocused(false);
      wechatButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [wechatPinned]);

  return (
    <footer className="site-footer">
      <div className="creator-strip" aria-label="作者与社交账号">
        <a className="creator-item" href="https://github.com/vigorX777" target="_blank" rel="noreferrer">
          <small>作者</small><strong>vigorxu</strong><i>↗</i>
        </a>
        <div
          className={`wechat-channel ${wechatOpen ? "is-open" : ""}`}
          ref={wechatRef}
          onPointerEnter={(event) => event.pointerType === "mouse" && setWechatHovered(true)}
          onPointerLeave={(event) => event.pointerType === "mouse" && setWechatHovered(false)}
          onFocusCapture={() => setWechatFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setWechatFocused(false);
          }}
        >
          <button
            className="creator-item creator-wechat"
            ref={wechatButtonRef}
            type="button"
            aria-expanded={wechatOpen}
            aria-controls="wechat-qr-popover"
            onClick={() => setWechatPinned((value) => !value)}
          >
            <small>公众号 · 悬浮/点击扫码</small><strong>懂点儿AI</strong><i>⌁</i>
          </button>
          <div
            className="wechat-qr-popover"
            id="wechat-qr-popover"
            role="dialog"
            aria-label="懂点儿AI 公众号二维码"
            aria-hidden={!wechatOpen}
          >
            <span>微信扫码关注</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qr/dongdian-ai-wechat.jpg" alt="懂点儿AI 公众号二维码" />
            <strong>懂点儿AI</strong>
            <small>聊 AI，也聊怎么不被自己的脑子收割</small>
          </div>
        </div>
        <a className="creator-item" href="https://x.com/vigorX777" target="_blank" rel="noreferrer">
          <small>X</small><strong>@vigorX777</strong><i>↗</i>
        </a>
        <a className="creator-item" href="https://github.com/vigorX777/mai-bu-mai" target="_blank" rel="noreferrer">
          <small>GitHub</small><strong>查看源码</strong><i>↗</i>
        </a>
      </div>
      <div className="footer-legal">
        <span>买不买 · 一把可歌（割）可泣（弃）的韭菜</span>
        <span>不荐股 · 不预测涨跌 · 不构成投资建议</span>
      </div>
    </footer>
  );
}

function SiteHeader({ onHome, compact }: { onHome: () => void; compact: boolean }) {
  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <button className="wordmark" type="button" onClick={onHome} aria-label="返回买不买首页">
        买<span>不</span>买
      </button>
      <div className="header-signal" aria-hidden="true">
        <i /> 今日情绪已涨停
      </div>
    </header>
  );
}

function Intro({ onStart }: { onStart: (path: TradePath) => void }) {
  return (
    <section className="intro-screen">
      <div className="intro-copy">
        <p className="eyebrow">A 股心理考场 · 专治手比脑子快</p>
        <h1>
          <span className="hero-line">测测你的手</span>
          <span className="hero-line">是不是又快过<span className="hero-accent">脑子。</span></span>
        </h1>
        <p className="intro-lede">
          <strong>5 道题，审审这次买、加、卖：到底是有计划，还是又上头了。</strong>
          <span>不荐股，只帮你在下单前认清自己。</span>
        </p>
        <div className="intro-proof" aria-label="测试说明">
          <span>01 / 不填股票</span>
          <span>02 / 不荐股票</span>
          <span>03 / 专门揭短</span>
        </div>
      </div>

      <div className="market-console" aria-hidden="true">
        <div className="console-label">今日韭菜冲动指数</div>
        <div className="console-ticker">
          <span className="ticker-arrow">↗</span>
          <strong>情绪</strong>
          <span className="ticker-price">99.9</span>
        </div>
        <div className="console-bars">
          {[36, 58, 42, 78, 54, 92, 66].map((height, index) => (
            <i key={height} style={{ "--bar": `${height}%`, "--delay": `${index * 70}ms` } as CSSProperties} />
          ))}
        </div>
        <div className="console-stamp">不要怕 · 技术性调整</div>
      </div>

      <div className="path-panel">
        <div className="panel-heading">
          <span>先选你正在做的决策</span>
          <small>买 / 加 / 卖，三套不同审法</small>
        </div>
        <div className="path-grid">
          {(Object.keys(PATHS) as TradePath[]).map((tradePath, index) => (
            <button key={tradePath} type="button" className={`path-ticket path-${tradePath}`} onClick={() => onStart(tradePath)}>
              <span className="path-glyph" aria-hidden="true">{PATHS[tradePath].short[0]}</span>
              <span className="path-copy">
                <span className="path-number">0{index + 1} / DECISION</span>
                <strong>{PATHS[tradePath].short}决策</strong>
                <small>{PATHS[tradePath].description}</small>
                <span className="path-focus">重点审 · {PATH_FOCUS[tradePath].focus}</span>
                <span className="path-cta">{PATH_FOCUS[tradePath].action}<i aria-hidden="true">→</i></span>
              </span>
            </button>
          ))}
        </div>
        <p className="privacy-note">无需登录，不输入股票代码，不上传任何交易数据。</p>
      </div>
    </section>
  );
}

function Quiz({
  path,
  question,
  currentIndex,
  selected,
  stamped,
  locked,
  onChoose,
  onBack,
}: {
  path: TradePath;
  question: Question;
  currentIndex: number;
  selected?: Option["id"];
  stamped: Option["id"] | null;
  locked: boolean;
  onChoose: (id: Option["id"]) => void;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [armedState, setArmedState] = useState<{ questionId: string; optionId: Option["id"] } | null>(null);
  const lastPointerType = useRef("mouse");
  const armed = armedState?.questionId === question.id ? armedState.optionId : null;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  const chooseWithIntent = (event: ReactMouseEvent<HTMLButtonElement>, optionId: Option["id"]) => {
    const keyboardClick = event.detail === 0;
    const touchLike = lastPointerType.current === "touch" || lastPointerType.current === "pen";
    if (!keyboardClick && touchLike && armed !== optionId) {
      setArmedState({ questionId: question.id, optionId });
      return;
    }
    setArmedState(null);
    onChoose(optionId);
  };

  const tiltOption = (event: ReactPointerEvent<HTMLButtonElement>) => {
    lastPointerType.current = event.pointerType;
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${x * 5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${y * -4}deg`);
  };

  const resetTilt = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  const onOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".answer-ticket"));
      const current = buttons.indexOf(event.currentTarget);
      const change = event.key === "ArrowDown" ? 1 : -1;
      buttons[(current + change + buttons.length) % buttons.length]?.focus();
    }
  };

  return (
    <section className="quiz-screen">
      <div className="quiz-meta">
        <div>
          <span className="meta-label">心理盘口</span>
          <strong>{currentIndex + 1}<i>/5</i></strong>
        </div>
        <span className="path-chip">{PATHS[path].short}</span>
      </div>

      <div className="gate-track" aria-label={`当前第 ${currentIndex + 1} 题，共 5 题`}>
        {GATES.map((gate, index) => (
          <i key={gate} className={index <= currentIndex ? "is-active" : ""} />
        ))}
      </div>

      <div className={`question-sheet ${stamped ? "is-resolving" : ""}`} key={question.id}>
        <div className="question-index">关口 {String(currentIndex + 1).padStart(2, "0")} · {GATE_LABELS[question.gate]}</div>
        <h2 ref={headingRef} tabIndex={-1}>{question.prompt}</h2>
        <p className="first-reaction">别选最正确的，选你手指最想替你承认的。</p>

        <div className="answer-list">
          {question.options.map((answer, index) => {
            const isStamped = stamped === answer.id;
            const isSelected = selected === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                className={`answer-ticket ${isStamped ? "is-stamped" : ""} ${isSelected ? "is-selected" : ""} ${armed === answer.id ? "is-armed" : ""} ${stamped && !isStamped ? "is-dismissed" : ""}`}
                onClick={(event) => chooseWithIntent(event, answer.id)}
                onKeyDown={onOptionKeyDown}
                onPointerDown={(event) => {
                  lastPointerType.current = event.pointerType;
                }}
                onPointerMove={tiltOption}
                onPointerLeave={resetTilt}
                disabled={locked}
                aria-pressed={armed === answer.id || isSelected}
              >
                <span className="answer-key">{index + 1}</span>
                <span className="answer-copy">
                  <span className="answer-text">{answer.text}</span>
                  <span className="answer-thought">{answer.thought}</span>
                  <span className="answer-confirm">再点一次，承认这就是你的答案</span>
                </span>
                <span className="answer-relief">{answer.relief}</span>
                <span className="answer-seal" aria-hidden={!isStamped}>理由已批准</span>
              </button>
            );
          })}
        </div>

        <p className="answer-live" aria-live="polite">
          {armed
            ? `内心弹幕：${question.options.find((answer) => answer.id === armed)?.thought}。再次点击确认。`
            : stamped
              ? `选择已确认：${question.options.find((answer) => answer.id === stamped)?.relief}`
              : ""}
        </p>

        {stamped && (
          <div className="choice-impact" aria-hidden="true">
            <span>已合理化</span><span>✓</span><span>先按了再说</span>
            <strong>{question.options.find((answer) => answer.id === stamped)?.relief}</strong>
          </div>
        )}

        <div className="quiz-controls">
          <button type="button" className="back-button" onClick={onBack} disabled={currentIndex === 0 || locked}>
            ← 上一题
          </button>
          <span>键盘可按 1 / 2 / 3</span>
        </div>
      </div>
    </section>
  );
}

function Settling({ path }: { path: TradePath }) {
  return (
    <section className="settling-screen" aria-live="polite">
      <div className="settling-scope" aria-hidden="true">
        <i /><i /><i />
        <span />
      </div>
      <p className="eyebrow">借口正在申请上市</p>
      <h2>正在区分你是价值投资，还是被套后才开始价值投资</h2>
      <p>{PATHS[path].status}</p>
    </section>
  );
}

function ResultView({
  record,
  onHome,
}: {
  record: StoredResult;
  onHome: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [actionStatus, setActionStatus] = useState("");
  const persona = PERSONAS[record.result.primary];
  const copy = shareText(record.result);
  const personaShare = estimatePersonaShare(record.result);
  const exposures = useMemo(() => buildExposures(record), [record]);

  const renderCard = async () => {
    if (!cardRef.current) throw new Error("Card unavailable");
    await document.fonts?.ready;
    return toPng(cardRef.current, {
      canvasWidth: 1080,
      canvasHeight: 1350,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#050607",
    });
  };

  const copyShareText = async () => {
    return copyPlainText(copy);
  };

  const downloadCard = async () => {
    setActionStatus("正在生成 1080 × 1350 人格卡…");
    try {
      const dataUrl = await renderCard();
      const link = document.createElement("a");
      link.download = `今日韭菜人格-${persona.name}.png`;
      link.href = dataUrl;
      link.click();
      setActionStatus("人格卡已保存");
    } catch {
      const copied = await copyShareText();
      setActionStatus(copied ? "图片生成失败，分享文案已复制" : "图片生成失败，请直接截图保存");
    }
  };

  const copyResultLink = async () => {
    setActionStatus("正在抄送这份韭菜档案…");
    const copied = await copyPlainText(buildSharedResultUrl(record));
    setActionStatus(copied ? "结果链接已复制，欢迎拉人对号入座" : "复制失败，请复制地址栏链接");
  };

  return (
    <section className="result-screen">
      <div className="result-heading">
        <p className="eyebrow">结算完成 · 你的借口已成功上市</p>
        <h1>{persona.name}</h1>
      </div>

      <PersonaShare result={record.result} percentage={personaShare} />

      <div className="result-layout">
        <div className="card-column">
          <ResultCard cardRef={cardRef} record={record} personaShare={personaShare} />
          <p className="export-note">导出为 1080 × 1350 PNG，卡片内不包含个人交易数据。</p>
        </div>

        <div className="result-actions">
          <div className="action-grid">
            <button type="button" className="primary-action" onClick={downloadCard}>保存罪证</button>
            <button type="button" className="secondary-action" onClick={copyResultLink}>复制链接 · 拉人围观</button>
          </div>
          <button type="button" className="retry-action" onClick={onHome}>再割一茬 · 重新决策</button>
          {actionStatus && <p className="action-status" role="status">{actionStatus}</p>}

          <details className="exposure-panel">
            <summary>看看我是怎么把自己卖了 <span>+</span></summary>
            <div className="exposure-content">
              {exposures.map((exposure, index) => (
                <article key={`${exposure.label}-${index}`}>
                  <span>0{index + 1} / {exposure.label}</span>
                  <p>你刚才给自己找的理由：{exposure.answer}</p>
                  <small>{exposure.explanation}</small>
                </article>
              ))}
              <div className="counter-question">
                <span>今日反指 · 立刻执行</span>
                <strong>{persona.counter}</strong>
              </div>
            </div>
          </details>

          <button type="button" className="home-action" onClick={onHome}>换个动作继续挣扎</button>
        </div>
      </div>
    </section>
  );
}

function PersonaShare({ result, percentage }: { result: QuizResult; percentage: number }) {
  return (
    <section className={`persona-share-panel ${result.primary === "brake" ? "is-brake" : ""}`} aria-label={`模拟同款韭菜率 ${percentage}%`}>
      <div className="share-number">
        <span>模拟同款韭菜率</span>
        <strong>{percentage}<i>%</i></strong>
      </div>
      <div className="share-verdict">
        <p>{personaShareCopy(result, percentage)}</p>
        <div className="share-meter" aria-hidden="true">
          <i style={{ width: `${percentage}%` }} />
          <span>你在这片菜地的位置</span>
        </div>
        <small>娱乐性估算：按本次五道选择的主人格基础占比、得分强度和领先幅度计算，不代表真实股民调查。</small>
      </div>
    </section>
  );
}

function ResultCard({
  cardRef,
  record,
  personaShare,
}: {
  cardRef: RefObject<HTMLElement | null>;
  record: StoredResult;
  personaShare: number;
}) {
  const [assetFailed, setAssetFailed] = useState(false);
  const persona = PERSONAS[record.result.primary];
  const secondary = record.result.secondary ? PERSONAS[record.result.secondary] : null;
  const date = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(record.completedAt));

  return (
    <article className={`result-card persona-${record.result.primary}`} ref={cardRef}>
      <div className="card-grain" />
      <div className="card-topline">
        <span>今日韭菜人格</span>
        <span>心理盘口 #{record.result.marketCode}</span>
      </div>
      <h2>{persona.name}</h2>
      <div className="persona-sticker">
        {secondary ? `副人格：${secondary.name}` : record.result.primary === "brake" ? "隐藏人格已触发" : PATHS[record.path].status}
      </div>
      <div className="card-share">
        <span>同款韭菜率</span>
        <strong>{personaShare}%</strong>
      </div>

      <div className="character-stage">
        {!assetFailed && (
          // A raw local image is required so the DOM-to-PNG exporter can inline the exact asset.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={persona.asset} alt={`${persona.name} 3D 角色`} onError={() => setAssetFailed(true)} />
        )}
        {assetFailed && <div className="asset-fallback" aria-label="人物图片加载失败">{persona.name}</div>}
        <div className="taunt-block">
          <small>致命诊断</small>
          <span>“</span>
          <p>{persona.taunts[record.result.tauntIndex]}</p>
        </div>
      </div>

      <div className="trait-row">
        <div>
          <span>隐藏优点</span>
          <p>{persona.strength}</p>
        </div>
        <div>
          <span>{record.result.primary === "brake" ? "潜在盲点" : "致命盲点"}</span>
          <p>{persona.blindspot}</p>
        </div>
      </div>

      <div className="card-counter">
        <span>今日反指 · 立刻执行</span>
        <strong>{persona.counter}</strong>
      </div>

      <div className="card-site-qr" aria-label="扫码打开买不买网站">
        <span>扫一下，看你是哪茬</span>
        {/* A same-origin raw image keeps the QR code sharp in the exported PNG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qr/mai-bu-mai.png" alt="买不买网站二维码" />
      </div>

      <div className="card-footer">
        <span>vigorxu · 懂点儿AI</span>
        <span>{date}</span>
        <span>不构成投资建议</span>
      </div>
    </article>
  );
}

function buildExposures(record: StoredResult) {
  const result = record.result;
  const dimensions: Array<Bias | "brake"> =
    result.primary === "brake"
      ? ["brake", "brake"]
      : result.rankedBiases.filter((bias) => result.scores[bias] > 0).slice(0, 2);

  return dimensions.map((dimension, index) => {
    const candidates = record.selections
      .map((selection) => {
        const question = getQuestion(selection.questionId);
        const answer = question.options.find((option) => option.id === selection.optionId)!;
        return { question, answer, points: answer.scores[dimension] ?? 0 };
      })
      .filter((item) => item.points > 0)
      .sort((left, right) => right.points - left.points);
    const selected = candidates[index % Math.max(candidates.length, 1)] ?? {
      question: getQuestion(record.questionIds[index]),
      answer: getQuestion(record.questionIds[index]).options.find(
        (option) => option.id === record.selections.find((item) => item.questionId === record.questionIds[index])?.optionId,
      )!,
    };
    const label = dimension === "brake" ? "刹车值" : BIAS_LABELS[dimension];
    const explanation =
      dimension === "brake"
        ? "难得，你让事实先说完了话，没有让一根 K 线替你重写家规。"
        : {
            fomo: "涨幅替你做了尽调，踏空替你制造了亏损，最后山顶替你保管仓位。",
            herd: "你把群友的音量当成胜率，仓位判断暂时外包给了最会发语音的人。",
            recovery: "成本价绑架了未来决策；股票都翻篇了，你还在替过去续费。",
            bottom: "跌得多只证明它跌得多，不证明你伸手的位置就是地板。",
            loss: "你不是在等事实变化，只是在等承认错误这件事没那么疼。",
            overconfidence: "观点只有六成把握，仓位已经替你宣布百分之百正确。",
            drift: "价格一变，计划就热更新；唯一不变的是这次仍然不能算错。",
          }[dimension];
    return { label, answer: selected.answer.text, explanation };
  });
}
