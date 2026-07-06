const chat = document.getElementById("chat");
const inputBox = document.getElementById("input");

// 🔄 Load chat
window.onload = () => {
  chrome.storage.local.get(["chat"], (result) => {
    chat.innerHTML = result.chat || "";
  });
};

// 💾 Save chat
function saveChat() {
  chrome.storage.local.set({
    chat: chat.innerHTML
  });
}

// 💬 Add message
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerText = text;

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;

  saveChat();
}

// 🚀 MAIN FUNCTION (WITH PROBLEM EXTRACTION)
function getProblemAndSend(prompt) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "GET_PROBLEM" },
      async (response) => {

        console.log("📩 From content:", response);

        if (!response || !response.text) {
          addMessage("Couldn't read problem 😕", "bot");
          return;
        }

        // 🔥 IMPORTANT: combine problem + user prompt
        const finalPrompt = `
Problem:
${response.text}

User Question:
${prompt}
        `;

        console.log("📤 Sending:", finalPrompt.slice(0, 200));

        try {
          const res = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: finalPrompt })
          });

          const data = await res.json();

          addMessage(data.reply || "No response from AI", "bot");

        } catch (err) {
          console.error(err);
          addMessage("Server error ❌", "bot");
        }
      }
    );
  });
}

// ✅ SEND BUTTON (FIXED)
document.getElementById("ask").addEventListener("click", () => {
  const input = inputBox.value.trim();
  if (!input) return;

  addMessage(input, "user");

  // 🔥 USE THIS (NOT sendPrompt)
  getProblemAndSend(input);

  inputBox.value = "";
});

// ✅ ENTER KEY
inputBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("ask").click();
  }
});

// 🧹 CLEAR CHAT
document.getElementById("clear").addEventListener("click", () => {
  chat.innerHTML = "";
  chrome.storage.local.set({ chat: "" });
});