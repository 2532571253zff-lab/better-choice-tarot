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
const showPage = (pageName) => {
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

// ── Journey entry buttons (homepage card entries → reading) ──
document.querySelectorAll(".journey-entry").forEach((entry) => {
  entry.addEventListener("click", () => {
    const journey = entry.dataset.journey;
    const categoryMap = {
      relationship: "关系",
      study: "自我",
      work: "事业",
      social: "关系",
    };
    const category = categoryMap[journey] || "事业";

    resetReadingFlow();
    showPage("reading");

    // Pre-select the matching category chip
    const readingPage = document.querySelector('[data-page="reading"]');
    const chips = readingPage.querySelectorAll(".question-block .chip");
    chips.forEach((chip) => {
      chip.classList.toggle("active", chip.textContent.trim() === category);
    });

    // Focus the textarea
    const qInput = readingPage.querySelector("textarea");
    if (qInput) {
      requestAnimationFrame(() => qInput.focus());
    }
  });
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
drawButton?.addEventListener("click", (e) => {
  // Spawn stardust particles
  spawnParticles(e.currentTarget);

  // Show results after a short delay (simulating card reveal)
  setTimeout(() => {
    resultBlock.classList.remove("flow-hidden");
    resultBlock.scrollIntoView({ behavior: "smooth", block: "start" });
    // Add fade-in animation to drawn cards
    resultBlock.querySelectorAll(".drawn-card").forEach((card, i) => {
      card.style.animation = `fadeIn 0.5s var(--ease-soft) ${i * 0.12}s both`;
    });
  }, 600);
});

// Reset button
document.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
  resetReadingFlow();
  document.querySelector(".question-block")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

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

// ── History Data ──
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

const detail = document.querySelector(".history-detail");

document.querySelectorAll(".journal-item").forEach((item) => {
  item.addEventListener("click", () => {
    const data = historyData[item.dataset.history];
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
});

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