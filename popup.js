async function scanSite() {
  const scanBtn = document.getElementById("scanBtn");
  
  // Prevent double-clicking during animation
  if (scanBtn.disabled) return;
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning...";

  // 1. Reset Gauge to Zero immediately
  updateUI(0, ["Performing deep scan..."]);

  if (typeof chrome === 'undefined' || !chrome.tabs) {
    document.getElementById("siteUrl").textContent = "Local testing mode";
if (typeof chrome === 'undefined' || !chrome.tabs) {
  document.getElementById("siteUrl").textContent = "Local testing mode";

  setTimeout(() => {
    updateUI(50, ["Extension environment not detected"]);
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Again";
  }, 1000);

  return;
}
    return;
  }

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || tab.url.startsWith("chrome://")) {
    document.getElementById("siteUrl").textContent = "Restricted Page";
    updateUI(100, ["Cannot scan system pages"]);
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Again";
    return;
  }

  // 2. Inject the Blue Scan Line into the webpage
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const line = document.createElement("div");
        line.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 5px;
          background: #66fcf1; box-shadow: 0 0 20px #66fcf1;
          z-index: 9999999; pointer-events: none;
          animation: scanMove 1.5s ease-in-out forwards;
        `;
        const style = document.createElement("style");
        style.innerHTML = ` @keyframes scanMove { 
          0% { top: 0; opacity: 1; } 
          100% { top: 100%; opacity: 0; } 
        }`;
        document.head.appendChild(style);
        document.body.appendChild(line);
        setTimeout(() => { line.remove(); style.remove(); }, 2000);
      }
    });
  } catch (e) {
    console.log("Could not inject scan line (normal for some pages)");
  }

  // 3. Wait 1s for the "Scan" feel before showing results
  setTimeout(() => {
    let url = tab.url.toLowerCase();
    document.getElementById("siteUrl").textContent = url;

    let risk = 0;
    let reasons = [];

    if (url.startsWith("http://")) {
      risk += 55;
      reasons.push("Insecure (HTTP)");
    }

    const badDomains = [".xyz", ".tk", ".top", ".click", ".ru"];
    badDomains.forEach(d => { if (url.includes(d)) { risk += 25; reasons.push("Suspicious Domain"); } });

    const badWords = ["login", "verify", "free", "gift", "otp", "prize", "urgent"];
    badWords.forEach(word => { if (url.includes(word)) { risk += 10; reasons.push(`Keyword: ${word}`); } });

    if (risk > 100) risk = 100;
    let score = 100 - risk;

    updateUI(score, reasons);
    
    let statusText = score >= 80 ? "Safe" : score >= 50 ? "Caution" : "Danger";
    saveHistory(url, statusText);

    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Again";
  }, 1000);
}

function updateUI(score, reasons) {
  const status = document.getElementById("statusText");
  const needle = document.getElementById("needle");
  const meterScore = document.getElementById("meterScore");
  const trustScore = document.getElementById("trustScore");
  const riskReasons = document.getElementById("riskReasons");

  trustScore.textContent = score + "/100";
  if (meterScore) meterScore.textContent = score;

  let statusText = "Looks Safe";
  let color = "#00ff99";

  if (score < 50) { statusText = "High Risk"; color = "#ff4d4d"; }
  else if (score < 80) { statusText = "Use Caution"; color = "#ffbd44"; }

  status.textContent = statusText;
  status.style.color = color;
  riskReasons.textContent = reasons.length ? reasons.join(", ") : "No threats detected.";

  // Map 0-100 to -90deg to +90deg
  const angle = -90 + (score * 1.8);
  if (needle) needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    document.body.classList.remove(
"safe-mode",
"warn-mode",
"danger-mode"
);

if(score >= 80){
document.body.classList.add("safe-mode");
}
else if(score >= 50){
document.body.classList.add("warn-mode");
}
else{
document.body.classList.add("danger-mode");
}  
}

function saveHistory(url, status) {
  chrome.storage.local.get(["history"], data => {
    let history = data.history || [];
    history.unshift({ url, status, date: new Date().toLocaleTimeString() });
    history = history.slice(0, 5);
    chrome.storage.local.set({ history }, () => { loadHistory(); });
  });
 
}

function loadHistory() {
  chrome.storage.local.get(["history"], data => {

    let history = data.history || [];

    const box = document.getElementById("historyList");

    if (!box) return;

    if (!history.length) {
      box.innerHTML = "No scans yet.";
    } else {
      box.innerHTML = history.map(item => `
        <div style="margin-bottom:8px;border-bottom:1px solid #1f2833;padding-bottom:5px;">
          <div style="font-size:11px;word-break:break-all;color:#66fcf1;">
            ${item.url}
          </div>
          <span style="opacity:.7;font-size:10px;">
            ${item.status} - ${item.date}
          </span>
        </div>
      `).join("");
    }

    document.getElementById("sitesScanned").textContent = history.length;

    const threats = history.filter(item =>
      item.status === "Danger" ||
      item.status === "High Risk"
    ).length;

    document.getElementById("threatsFound").textContent = threats;

  });
}

document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  if (scanBtn) scanBtn.onclick = scanSite;

  // Simple Tab Switching
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active-tab"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active-tab");
    };
  });

  scanSite(); // Initial scan
  loadHistory();
});