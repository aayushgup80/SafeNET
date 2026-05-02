const url = window.location.href.toLowerCase();

let risk = 0;
let reasons = [];

// HTTP
if (url.startsWith("http://")) {
  risk += 55;
  reasons.push("Insecure connection");
}

// Bad domains
const badDomains = [".xyz", ".tk", ".top", ".click", ".ru"];

badDomains.forEach(d => {
  if (url.includes(d)) {
    risk += 25;
    reasons.push("Suspicious domain");
  }
});

// Bad words
const badWords = ["login","verify","free","gift","otp","prize","urgent"];

badWords.forEach(word => {
  if (url.includes(word)) {
    risk += 10;
    reasons.push("Scam keyword");
  }
});

// Fake login detector
const hasPassword = document.querySelector('input[type="password"]');

if (hasPassword && risk >= 30) {
  risk += 35;
  reasons.push("Credential request on risky site");
}

// Final banner trigger
if (risk >= 50) {

  const banner = document.createElement("div");

  banner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>⚠ SafeNET Warning: ${reasons.join(", ")}</span>
      <button id="safeCloseBtn"
      style="
      background:white;
      color:#ff3b30;
      border:none;
      padding:6px 10px;
      border-radius:6px;
      font-weight:bold;
      cursor:pointer;">X</button>
    </div>
  `;

  banner.style.position = "fixed";
  banner.style.top = "0";
  banner.style.left = "0";
  banner.style.width = "100%";
  banner.style.padding = "12px";
  banner.style.background = "#ff3b30";
  banner.style.color = "white";
  banner.style.fontSize = "14px";
  banner.style.fontWeight = "bold";
  banner.style.zIndex = "999999";
  banner.style.boxShadow = "0 3px 10px rgba(0,0,0,.25)";

  document.body.prepend(banner);

  document.getElementById("safeCloseBtn").onclick = () => {
    banner.remove();
  };
}