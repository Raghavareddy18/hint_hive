console.log("🚀 CONTENT SCRIPT RUNNING");
function isVisible(el) {
  return el.offsetHeight > 0 && el.offsetWidth > 0;
}

function getCleanText(el) {
  return el.innerText
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProblem() {

  // ✅ 1. Known platforms (fast path)
  const selectors = [
    '[data-analytics="ChallengeProblemStatement"]', // HackerRank
    '.challenge_problem_statement',
    '.question-content',     // LeetCode old
    '.content__u3I1',        // LeetCode new
    '.problem-statement',    // CodeChef
    '.problemindexholder',   // Codeforces
    '.markdown-content',
    'article'
  ];

  for (let sel of selectors) {
    const el = document.querySelector(sel);
    if (el && isVisible(el)) {
      const text = getCleanText(el);
      if (text.length > 200) return text;
    }
  }

  // 🧠 2. Semantic detection (SMART PART)
  const keywords = ["input", "output", "constraints", "example", "sample"];

  let candidates = [];

  document.querySelectorAll("div, section, article").forEach(el => {
    if (!isVisible(el)) return;

    const text = getCleanText(el);

    if (text.length < 200 || text.length > 6000) return;

    let score = 0;

    keywords.forEach(k => {
      if (text.toLowerCase().includes(k)) score++;
    });

    if (score >= 2) {
      candidates.push({ text, score });
    }
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].text;
  }

  // 🧠 3. Fallback (largest meaningful block)
  let best = "";
  document.querySelectorAll("div, section, article").forEach(el => {
    if (!isVisible(el)) return;

    const text = getCleanText(el);

    if (text.length > best.length && text.length < 6000) {
      best = text;
    }
  });

  return best || "Problem not found.";
}
console.log("🧠 Extracted:", extractProblem()?.slice(0, 200));
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  console.log("📨 Message received:", req);

  if (req.type === "GET_PROBLEM") {
    const text = extractProblem();

    console.log("📤 Sending:", text?.slice(0, 200));

    sendResponse({ text });
  }
});
// 🔁 listener
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_PROBLEM") {
    const text = extractProblem();

    console.log("✅ Extracted Problem:", text.slice(0, 300));

    sendResponse({ text });
  }
});