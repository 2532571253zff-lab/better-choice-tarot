/* ============================================
   Better Choice Tarot — App Logic
   Mystic Minimalism Edition
   ============================================ */

// ── Chip/Tab activation (within group) ──
const activateWithinGroup = (selector, activeClass = "active") => {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.parentElement;
      group.querySelectorAll(selector).forEach((item) => item.classList.remove(activeClass));
      button.classList.add(activeClass);
    });
  });
};

activateWithinGroup(".question-block .chip");
activateWithinGroup(".tab");

// ── Page navigation ──
let showPage = (pageName) => {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageName);
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.target === pageName || (pageName === "reading" && item.dataset.target === "reading"));
  });

  const targetPage = document.querySelector(`.page[data-page="${pageName}"]`);
  if (targetPage) {
    targetPage.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// ── Bottom nav ──
document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    if (target === "reading") {
      resetReadingFlow();
      showPage("reading");
      const qInput = document.querySelector('[data-page="reading"] textarea');
      if (qInput) {
        requestAnimationFrame(() => qInput.focus());
      }
    } else {
      showPage(target);
    }
  });
});

// ── Back button ──
document.querySelector('[aria-label="返回"]').addEventListener("click", () => {
  const activePage = document.querySelector(".page.active")?.dataset.page;
  if (activePage === "reading") {
    showPage("home");
  }
});

// ── Reading flow ──
const readingPage = document.querySelector('[data-page="reading"]');
const questionInput = readingPage.querySelector("textarea");
const confirmQuestionButton = readingPage.querySelector('[data-action="confirm-question"]');
const spreadBlock = readingPage.querySelector(".spread-block");
const deckStage = readingPage.querySelector(".deck-stage");
const resultBlock = readingPage.querySelector(".result-block");
const selectedSpreadLabel = readingPage.querySelector("[data-selected-spread]");

const resetReadingFlow = () => {
  if (questionInput) questionInput.value = "";
  if (confirmQuestionButton) confirmQuestionButton.disabled = true;
  if (spreadBlock) spreadBlock.classList.add("flow-hidden");
  if (deckStage) deckStage.classList.add("flow-hidden");
  if (resultBlock) resultBlock.classList.add("flow-hidden");
  readingPage.querySelectorAll(".spread-card").forEach((item, index) => {
    item.classList.toggle("selected", index === 0);
  });
  if (selectedSpreadLabel) selectedSpreadLabel.textContent = "抉择牌阵";
  // Reset draw button state
  if (drawButton) {
    drawButton.disabled = false;
    drawButton.textContent = "开始抽牌";
    isDrawing = false;
  }
  // Hide reflection card
  const reflectionCard = document.getElementById("reflectionCard");
  if (reflectionCard) reflectionCard.classList.add("flow-hidden");
  const reflectionDone = document.getElementById("reflectionDone");
  if (reflectionDone) reflectionDone.classList.add("flow-hidden");
  const reflectionSubmit = document.getElementById("reflectionSubmit");
  const reflectionInput = document.getElementById("reflectionInput");
  if (reflectionSubmit) reflectionSubmit.classList.remove("flow-hidden");
  if (reflectionInput) reflectionInput.disabled = false;
};

// Draw-entry button
document.querySelector(".draw-entry")?.addEventListener("click", () => {
  resetReadingFlow();
  showPage("reading");
  requestAnimationFrame(() => questionInput.focus());
});

// Question input validation
questionInput?.addEventListener("input", () => {
  confirmQuestionButton.disabled = questionInput.value.trim().length < 4;
});

// Confirm question → show spread selection
confirmQuestionButton?.addEventListener("click", () => {
  spreadBlock.classList.remove("flow-hidden");
  deckStage.classList.add("flow-hidden");
  resultBlock.classList.add("flow-hidden");
  spreadBlock.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Spread card selection
document.querySelectorAll(".spread-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".spread-card").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedSpreadLabel.textContent = button.dataset.spread;
    spreadBlock.classList.add("flow-hidden");
    deckStage.classList.remove("flow-hidden");
    resultBlock.classList.add("flow-hidden");
    deckStage.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ── Draw button with stardust particles ──
const drawButton = document.getElementById("drawButton");
let isDrawing = false;

if (!drawButton) {
  console.warn("[Better Choice Tarot] #drawButton not found in DOM");
}

drawButton?.addEventListener("click", (e) => {
  if (isDrawing) return;
  isDrawing = true;

  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = "正在感应...";

  try {
    spawnParticles(btn);
  } catch (err) {
    console.warn("[Better Choice Tarot] spawnParticles failed:", err);
  }

  setTimeout(() => {
    try {
      if (resultBlock) {
        resultBlock.classList.remove("flow-hidden");
        resultBlock.scrollIntoView({ behavior: "smooth", block: "start" });
        resultBlock.querySelectorAll(".drawn-card").forEach((card, i) => {
          card.style.animation = `fadeIn 0.5s var(--ease-soft) ${i * 0.12}s both`;
        });
      }
    } catch (err) {
      console.warn("[Better Choice Tarot] resultBlock error:", err);
    }

    // Save to question history
    const qText = questionInput?.value.trim();
    const activeChip = readingPage.querySelector(".question-block .chip.active");
    const category = activeChip?.textContent.trim() || "其他";
    const spread = selectedSpreadLabel?.textContent || "抉择牌阵";
    if (qText) {
      addQuestionToHistory(qText, category, spread);
    }

    // Show Reflection Card after a pause
    setTimeout(() => {
      try {
        showReflectionCard();
      } catch (err) {
        console.warn("[Better Choice Tarot] showReflectionCard error:", err);
      }
    }, 1200);

    // Re-enable button
    btn.disabled = false;
    btn.textContent = "重新感应";
    isDrawing = false;
  }, 600);
});

// Reset button
document.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
  resetReadingFlow();
  document.querySelector(".question-block")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ── iOS Bottom Sheet: Mood Logging ──

window._emotions = window._emotions || {};

const moodModule = document.getElementById("emotionModule");
const moodOverlay = document.getElementById("moodOverlay");
const moodSlider = document.getElementById("moodSlider");
const moodScaleBtns = document.querySelectorAll(".mood-dot");
const moodTags = document.querySelectorAll(".mood-tag");
const moodStateDefault = document.getElementById("moodStateDefault");
const moodStateRecorded = document.getElementById("moodStateRecorded");
const moodSaveBtn = document.getElementById("moodSaveBtn");

const moodLabels = { 1: "很低落", 2: "有点down", 3: "平静", 4: "还不错", 5: "很愉快" };
const moodColors = { 1: "blue", 2: "blue", 3: "purple", 4: "pink", 5: "gold" };

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getTodayMood = () => window._emotions[getTodayKey()];

const updateMoodModule = () => {
  const todayMood = getTodayMood();
  if (todayMood) {
    moodStateDefault?.classList.add("flow-hidden");
    moodStateRecorded?.classList.remove("flow-hidden");
    const valueEl = document.getElementById("moodRecordedValue");
    if (valueEl) {
      const tags = todayMood.tags?.length ? ` · ${todayMood.tags.join("、")}` : "";
      valueEl.textContent = `${todayMood.label}${tags}`;
    }
  } else {
    moodStateDefault?.classList.remove("flow-hidden");
    moodStateRecorded?.classList.add("flow-hidden");
  }
};

// Open bottom sheet from homepage module
moodModule?.addEventListener("click", (e) => {
  if (e.target.closest(".mood-re-record")) {
    delete window._emotions[getTodayKey()];
    updateMoodModule();
    openMoodSheet();
    return;
  }
  if (e.target.closest(".mood-dot")) return;
  openMoodSheet();
});

// Mood dots on homepage — quick select
moodScaleBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    quickRecordMood(parseInt(btn.dataset.level));
  });
});

const quickRecordMood = (level) => {
  const today = getTodayKey();
  window._emotions[today] = {
    level,
    label: moodLabels[level],
    color: moodColors[level],
    tags: [],
    note: "",
    time: new Date().toISOString(),
  };
  updateMoodModule();
  updateJourneyStats();
  spawnActionSparks(moodModule, 6);
};

const openMoodSheet = () => {
  if (!moodOverlay) return;

  // Restore previous state or defaults
  const prev = getTodayMood();
  moodSlider.value = prev?.level || 3;
  moodTags.forEach((tag) => {
    tag.classList.toggle("selected", prev?.tags?.includes(tag.dataset.emotion));
  });

  // Lock body scroll
  document.body.style.overflow = "hidden";

  // Reset sheet scroll position
  const sheet = moodOverlay.querySelector(".mood-sheet");
  if (sheet) sheet.scrollTop = 0;

  // Add .active — CSS transition handles the rest (no display:none involved)
  moodOverlay.classList.add("active");
};

const closeMoodSheet = () => {
  if (!moodOverlay) return;
  moodOverlay.classList.remove("active");
  document.body.style.overflow = "";
};

// Save button
moodSaveBtn?.addEventListener("click", () => {
  const today = getTodayKey();
  const level = parseInt(moodSlider.value);
  const tags = [];
  moodTags.forEach((tag) => {
    if (tag.classList.contains("selected")) tags.push(tag.dataset.emotion);
  });
  window._emotions[today] = {
    level,
    label: moodLabels[level],
    color: moodColors[level],
    tags,
    note: "",
    time: new Date().toISOString(),
  };
  closeMoodSheet();
  updateMoodModule();
  updateJourneyStats();
  spawnActionSparks(moodModule, 8);
});

// Mood tag toggle
moodTags.forEach((tag) => {
  tag.addEventListener("click", () => {
    tag.classList.toggle("selected");
  });
});

// Close on overlay tap
moodOverlay?.addEventListener("click", (e) => {
  if (e.target === moodOverlay) closeMoodSheet();
});

// Init
updateMoodModule();

// ── Daily Card Draw (homepage) ──
const dailyDrawBtn = document.querySelector('[data-action="draw-daily-card"]');
dailyDrawBtn?.addEventListener("click", (e) => {
  const hero = document.querySelector(".daily-tarot-hero");
  const card = hero?.querySelector(".daily-tarot-card");

  // Particle burst
  if (card) {
    spawnParticles(card, 18);
  }

  // Update card appearance
  if (card) {
    card.style.animation = "none";
    card.offsetHeight; // force reflow
    card.style.animation = "cardFloat 5s var(--ease-breathe) infinite";
  }

  // Update content
  const content = hero?.querySelector(".daily-tarot-content");
  if (content) {
    content.querySelector(".eyebrow").textContent = "今日启示 · 女祭司";
    content.querySelector("h2").textContent = "倾听内在的声音";
    content.querySelector("p").textContent = "今天的答案不在外界，而在你安静下来时最先浮现的那个念头。信任第一直觉，不必反复验证。";
    const keywords = content.querySelector(".daily-tarot-keywords");
    if (keywords) {
      keywords.innerHTML = `
        <span class="keyword-tag">直觉</span>
        <span class="keyword-tag soft">内省</span>
        <span class="keyword-tag warm">等待</span>
      `;
    }
  }

  // Change button text
  if (dailyDrawBtn) {
    dailyDrawBtn.textContent = "已抽取 · 点击重抽";
  }
});

// ── Card Library Filter ──
document.querySelectorAll(".suit-filter .chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".suit-filter .chip").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const suit = button.dataset.suit;
    document.querySelectorAll(".library-card").forEach((card) => {
      card.classList.toggle("filtered-out", suit !== "all" && card.dataset.suit !== suit);
    });
  });
});

// ── Reflection Card Logic ──
const reflectionQuestions = [
  "你真正害怕失去的是什么？",
  "最近有没有一个瞬间，让你觉得自己被忽视了？",
  "如果没有任何限制，你此刻最想做什么？",
  "今天有没有一句话，你其实很想对某个人说？",
  "你正在为什么事情感到内疚？",
  "如果你可以放下一个念头，它会是什么？",
  "你最近是否太习惯一个人承担问题了？",
  "你真正想要的是改变，还是被理解？",
];

const getCardReflection = () => {
  // Cards drawn in result block — use first card's suit to seed question
  const firstCard = resultBlock?.querySelector(".drawn-card strong");
  const cardName = firstCard?.textContent || "";
  if (cardName.includes("圣杯")) return "你最近一次感到被滋养，是什么时候？";
  if (cardName.includes("宝剑")) return "有什么真相你一直不敢对自己承认？";
  if (cardName.includes("权杖")) return "如果勇气不是问题，你的第一步会是什么？";
  if (cardName.includes("星币")) return "此刻你最想守住的是什么？";
  if (cardName.includes("女祭司")) return "你最近是否太习惯一个人承担问题了？";
  return reflectionQuestions[Math.floor(Math.random() * reflectionQuestions.length)];
};

const showReflectionCard = () => {
  const card = document.getElementById("reflectionCard");
  const question = document.getElementById("reflectionQuestion");
  const input = document.getElementById("reflectionInput");
  const done = document.getElementById("reflectionDone");
  if (!card) return;

  const q = getCardReflection();
  if (question) question.textContent = q;
  if (input) input.value = "";
  card.classList.remove("flow-hidden", "meteor-exit");
  if (done) done.classList.add("flow-hidden");
  if (input) input.parentElement?.querySelector(".reflection-submit")?.classList.remove("flow-hidden");

  card.scrollIntoView({ behavior: "smooth", block: "center" });
};

const reflectionSubmit = document.getElementById("reflectionSubmit");
const reflectionInput = document.getElementById("reflectionInput");
reflectionSubmit?.addEventListener("click", () => {
  const text = reflectionInput?.value.trim();
  if (!text) return;

  // Save to in-memory store
  const today = new Date().toISOString().slice(0, 10);
  window._reflections = window._reflections || {};
  window._reflections[today] = {
    question: document.getElementById("reflectionQuestion")?.textContent || "",
    answer: text,
    time: new Date().toISOString(),
  };

  // Spawn gentle particles
  spawnActionSparks(reflectionSubmit, 8);

  // Show done state
  reflectionSubmit.classList.add("flow-hidden");
  reflectionInput.disabled = true;
  const done = document.getElementById("reflectionDone");
  if (done) done.classList.remove("flow-hidden");

  // Record completion
  markActionGlobal("reflection_done");

  // After a brief pause, meteor-exit the entire reflection card
  const card = document.getElementById("reflectionCard");
  if (card) {
    setTimeout(() => {
      card.classList.add("meteor-exit");
      card.addEventListener("animationend", () => {
        card.classList.add("flow-hidden");
        card.classList.remove("meteor-exit");
        // Reset for next reading
        if (done) done.classList.add("flow-hidden");
        reflectionSubmit.classList.remove("flow-hidden");
        reflectionInput.disabled = false;
      }, { once: true });
    }, 900);
  }
});

// ── Journey Calendar Generation ──
const generateStarCalendar = () => {
  const calendar = document.getElementById("starCalendar");
  if (!calendar) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

  const emotions = window._emotions || {};
  const moodColorMap = { blue: "blue", purple: "purple", pink: "pink", gold: "gold" };
  const defaultColors = ["gold", "gold", "purple", "blue", "pink", "gold", "purple", "gold", "pink", "gold", "blue", "gold", "purple", "gold"];
  const todayDate = today.getDate();

  const getDayColor = (d) => {
    const ds = `2026-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const mood = emotions[ds];
    if (mood?.color) return moodColorMap[mood.color] || "gold";
    if (d <= todayDate) return defaultColors[d % defaultColors.length];
    return "empty";
  };

  const getHasData = (d) => {
    if (d > todayDate) return false;
    const ds = `2026-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return !!emotions[ds] || !!window._reflections?.[ds] || d <= todayDate;
  };

  let html = "";
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day"><span class="day-num"></span><span class="day-dot empty"></span></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const color = getDayColor(d);
    const isToday = d === todayDate ? " today" : "";
    const hasData = getHasData(d);
    html += `
      <div class="calendar-day${isToday}" data-day="${d}" ${hasData ? `data-has-data="true"` : ""}>
        <span class="day-num">${d}</span>
        <span class="day-dot ${color}"></span>
      </div>`;
  }

  calendar.innerHTML = html;

  calendar.querySelectorAll(".calendar-day[data-has-data]").forEach((dayEl) => {
    dayEl.addEventListener("click", () => {
      showDayDetail(dayEl.dataset.day);
    });
  });
};

const showDayDetail = (day) => {
  const panel = document.getElementById("dayDetail");
  if (!panel) return;

  const month = new Date().getMonth() + 1;
  const dateStr = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const reflections = window._reflections || {};
  const emotions = window._emotions || {};
  const dayReflection = reflections[dateStr];
  const dayMood = emotions[dateStr];

  const sampleCards = ["圣杯八 · 正位", "宝剑二 · 逆位", "女祭司 · 正位", "权杖一 · 正位"];
  const sampleQuestions = ["是否接受新的工作机会？", "该不该主动修复一段关系？", "我为什么总是推迟重要决定？"];
  const card = sampleCards[day % sampleCards.length];
  const question = sampleQuestions[day % sampleQuestions.length];
  const reflection = dayReflection?.answer || "今天没有记录，但没关系。";

  const emotionLabel = dayMood
    ? `${dayMood.label}${dayMood.tags?.length ? ` (${dayMood.tags.join("、")})` : ""}`
    : ["金色·积极", "紫色·平静", "蓝色·焦虑", "粉色·温暖"][day % 4];

  panel.innerHTML = `
    <p class="detail-date">5月${day}日</p>
    ${dayMood ? `<p class="detail-mood">今日情绪：${dayMood.label} ${dayMood.note ? `— "${dayMood.note}"` : ""}</p>` : ""}
    <p class="detail-card-name">${card}</p>
    <p style="color: var(--ink-dim); font-size: 12px; margin-bottom: 8px;">问题：${question}</p>
    <p class="detail-reflection">"${reflection}"</p>
    <div class="detail-meta">
      ${dayReflection ? '<span>✦ 已反思</span>' : '<span>◌ 未记录</span>'}
      <span>情绪：${emotionLabel}</span>
    </div>
  `;
  panel.classList.add("open");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

// Generate calendar when navigating to Journey page
const origShowPage = showPage;
showPage = (pageName) => {
  origShowPage(pageName);
  if (pageName === "journal") {
    setTimeout(generateStarCalendar, 100);
    updateJourneyStats();
  }
  if (pageName === "profile") {
    updateExecutionRate();
    updateProfileSummary();
  }
};

// Update journey hero stats
const updateJourneyStats = () => {
  const reflections = window._reflections || {};
  const days = Object.keys(reflections).length;
  const awarenessEl = document.getElementById("awarenessDays");
  const labelEl = document.getElementById("awarenessLabel");
  if (awarenessEl) awarenessEl.textContent = Math.max(12, days);
  if (labelEl) labelEl.textContent = Math.max(12, days);
};

// Update profile growth summary
const updateProfileSummary = () => {
  const reflections = window._reflections || {};
  const totalReflections = Object.keys(reflections).length;
  const profilePanel = document.querySelector(".profile-panel p:not(.eyebrow)");
  if (profilePanel && totalReflections > 0) {
    // Keep the original text but could be extended
  }
};

// ── Global action marker for non-card actions ──
const markActionGlobal = (actionKey) => {
  if (completedActions.has(actionKey)) return;
  completedActions.add(actionKey);
  updateActionSummary();
  updateJourneyStats();
};

// ── Question History ──
const readingHistory = [];

const addQuestionToHistory = (question, category, spread) => {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  const historyId = `reading_${Date.now()}`;

  // Collect card names from the result block
  const cardNames = [];
  const drawnCards = resultBlock?.querySelectorAll(".drawn-card strong");
  drawnCards?.forEach((el) => cardNames.push(el.textContent));

  // Collect advice items
  const adviceItems = [];
  resultBlock?.querySelectorAll(".advice-item p").forEach((el) => adviceItems.push(el.textContent));

  // Store
  readingHistory.unshift({
    id: historyId,
    title: question,
    category,
    spread,
    date: dateStr,
    cards: cardNames,
    advice: adviceItems,
  });

  // Build journal item
  const questionList = document.getElementById("questionList");
  if (!questionList) return;

  const item = document.createElement("button");
  item.className = "journal-item";
  item.dataset.history = historyId;
  item.style.animation = "fadeIn 0.4s var(--ease-soft) both";
  item.innerHTML = `
    <span>${dateStr}</span>
    <h3>${question}</h3>
    <p>${category} · ${spread} · ${cardNames.length} 张牌</p>
  `;

  questionList.prepend(item);
};

// Event delegation for journal items (handles both static and dynamic)
document.getElementById("questionList")?.addEventListener("click", (e) => {
  const item = e.target.closest(".journal-item");
  if (!item) return;

  const historyId = item.dataset.history;
  const detail = document.querySelector(".history-detail");
  if (!detail) return;

  // Check static data first, then dynamic
  let data = historyData[historyId];
  if (!data) {
    const dynamic = readingHistory.find((r) => r.id === historyId);
    if (dynamic) {
      data = {
        title: dynamic.title,
        cards: dynamic.cards.map((name, i) => {
          const suits = ["cups", "swords", "wands", "coins"];
          return [suits[i % 4], "?", "✦", ["现状", "阻碍", "建议"][i] || "提示", name];
        }),
        advice: dynamic.advice.length
          ? `当时建议：${dynamic.advice.join("；")}`
          : "记录你的感受比答案更重要。",
      };
    }
  }

  if (!data) return;

  detail.classList.add("open");
  detail.innerHTML = `
    <p class="eyebrow">历史详情</p>
    <h2>${data.title}</h2>
    <div class="cards-row compact-cards">
      ${data.cards
        .map(
          ([tone, number, symbol, label, name]) => `
            <article class="drawn-card" style="animation: fadeIn 0.4s var(--ease-soft) both;">
              <div class="card-face ${tone}" aria-hidden="true"><span>${number}</span><b>${symbol}</b></div>
              <p>${label}</p>
              <strong>${name}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
    <p class="detail-copy">${data.advice}</p>
  `;
  item.insertAdjacentElement("afterend", detail);
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// ── Static History Data ──
const historyData = {
  career: {
    title: "是否接受新的工作机会？",
    cards: [
      ["cups", "Ⅷ", "☾", "现状", "圣杯八 · 正位"],
      ["swords reversed", "Ⅱ", "✦", "阻碍", "宝剑二 · 逆位"],
      ["wands", "Ⅰ", "♢", "建议", "权杖一 · 正位"],
    ],
    advice: "当时建议：先确认新机会的职责边界和成长空间，再决定是否推进；不要用情绪性离职来证明决心。",
  },
  relation: {
    title: "该不该主动修复一段关系？",
    cards: [
      ["cups", "Ⅵ", "☾", "过去", "圣杯六 · 正位"],
      ["swords", "Ⅴ", "✦", "冲突", "宝剑五 · 正位"],
      ["coins", "Ⅵ", "⌾", "建议", "星币六 · 正位"],
    ],
    advice: "当时建议：先表达真实感受，再观察对方是否愿意共同承担修复关系的责任。",
  },
  self: {
    title: "我为什么总是推迟重要决定？",
    cards: [
      ["major", "Ⅱ", "☉", "内在", "女祭司 · 正位"],
      ["swords", "Ⅷ", "✦", "限制", "宝剑八 · 正位"],
      ["wands reversed", "Ⅱ", "♢", "行动", "权杖二 · 逆位"],
    ],
    advice: "当时建议：把选择拆成可验证的小步骤，先收集事实，再给自己一个明确的决定期限。",
  },
};

// ── Edit Profile ──
document.querySelector(".edit-profile")?.addEventListener("click", () => {
  document.querySelector(".profile-panel")?.classList.toggle("editing");
});

// ── Stardust Particle Effect ──
const spawnParticles = (target, count = 14) => {
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const colors = ["particle", "particle purple", "particle pink", "particle blue"];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    const colorClass = colors[Math.floor(Math.random() * colors.length)];
    particle.className = colorClass;

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 50;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;

    particle.style.position = "fixed";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.width = 2 + Math.random() * 4 + "px";
    particle.style.height = particle.style.width;
    particle.style.animationDuration = 0.8 + Math.random() * 1.2 + "s";
    particle.style.animationDelay = Math.random() * 0.15 + "s";

    document.body.appendChild(particle);

    // Remove after animation
    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }
};

// ── Action Cards State ──
// completedActions: Set of action-id strings that are completed
const completedActions = new Set();

// ── Action completion spark particles ──
const spawnActionSparks = (target, count = 10) => {
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const variants = ["action-spark", "action-spark blue", "action-spark purple", "action-spark pink"];

  for (let i = 0; i < count; i++) {
    const spark = document.createElement("span");
    spark.className = variants[Math.floor(Math.random() * variants.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = 14 + Math.random() * 36;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;

    spark.style.setProperty("--sx", sx + "px");
    spark.style.setProperty("--sy", sy + "px");
    spark.style.left = cx + "px";
    spark.style.top = cy + "px";
    spark.style.width = 2.5 + Math.random() * 4 + "px";
    spark.style.height = spark.style.width;
    spark.style.animationDuration = 0.5 + Math.random() * 0.5 + "s";

    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
};

// ── Update action summary counter ──
const updateActionSummary = () => {
  const totalActions = document.querySelectorAll(".action-item").length;
  const done = completedActions.size;
  const summary = document.getElementById("actionSummary");
  if (summary) {
    summary.textContent = `${done} / ${totalActions}`;
    if (done === totalActions && totalActions > 0) {
      summary.classList.add("all-done");
    } else {
      summary.classList.remove("all-done");
    }
  }
  updateExecutionRate();
};

// ── Update profile execution rate ──
const updateExecutionRate = () => {
  const totalActions = document.querySelectorAll(".action-item").length;
  const done = completedActions.size;
  const rateEl = document.getElementById("executionRate");
  if (rateEl) {
    const pct = totalActions > 0 ? Math.round((done / totalActions) * 100) : 64;
    rateEl.textContent = `${pct}%`;
  }
};

// ── Mark action as completed ──
const completeAction = (actionItem, checkBtn) => {
  const actionId = actionItem.dataset.actionId;
  if (!actionId || completedActions.has(actionId)) return;

  completedActions.add(actionId);
  actionItem.classList.add("completed");

  // Spark particles from the check button
  spawnActionSparks(checkBtn, 10);

  updateActionSummary();
};

// ── Action check button click handler ──
document.querySelectorAll(".action-check").forEach((checkBtn) => {
  checkBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const actionItem = checkBtn.closest(".action-item");
    if (actionItem) {
      completeAction(actionItem, checkBtn);
    }
  });
});

// ── Append reading advice to action cards ──
const appendReadingActions = () => {
  const resultAdviceItems = document.querySelectorAll(
    '[data-page="reading"] .result-block .advice-item'
  );
  if (resultAdviceItems.length === 0) return;

  const actionList = document.getElementById("actionList");
  if (!actionList) return;

  // Get current max action ID
  let maxId = 0;
  actionList.querySelectorAll(".action-item").forEach((item) => {
    const id = parseInt(item.dataset.actionId, 10);
    if (id > maxId) maxId = id;
  });

  resultAdviceItems.forEach((adviceItem, index) => {
    const textEl = adviceItem.querySelector("p");
    const text = textEl ? textEl.textContent.trim() : "";
    if (!text) return;

    const newId = String(maxId + index + 1);

    // Skip if this text already exists in action cards
    const existing = actionList.querySelectorAll(".action-left p");
    for (const p of existing) {
      if (p.textContent.trim() === text) return;
    }

    const item = document.createElement("div");
    item.className = "action-item";
    item.dataset.actionId = newId;
    item.style.animation = "fadeIn 0.35s var(--ease-soft) both";
    item.innerHTML = `
      <div class="action-left">
        <span class="action-num">${newId}</span>
        <p>${text}</p>
      </div>
      <button class="action-check" aria-label="标记完成">
        <span class="check-ring"></span>
      </button>
    `;

    // Attach click handler to new check button
    const checkBtn = item.querySelector(".action-check");
    checkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      completeAction(item, checkBtn);
    });

    actionList.appendChild(item);
  });

  updateActionSummary();
};

// ── Extend draw button to also append reading actions ──
const originalDrawClick = drawButton?.onclick;
drawButton?.addEventListener("click", () => {
  // Wait for results to appear, then append actions
  setTimeout(() => {
    appendReadingActions();
  }, 800);
});

// ── Daily card draw also resets/focuses action cards ──
dailyDrawBtn?.addEventListener("click", () => {
  // Action cards are already in HTML — no appending needed here
  // But update the summary after draw if actions were added
  updateActionSummary();
});

// ── Button press feedback (global) ──
document.addEventListener("click", (e) => {
  // Exclude action-check buttons (they have their own feedback)
  if (e.target.closest(".action-check")) return;

  const btn = e.target.closest(
    "button:not(.nav-item):not(.chip):not(.tab):not(.spread-card):not(.journal-item):not(.journey-entry):not(.suit-filter .chip)"
  );
  if (btn && !btn.disabled) {
    btn.style.transition = "transform 0.15s var(--ease-soft)";
    btn.style.transform = "scale(0.96)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  }
});