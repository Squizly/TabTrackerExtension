function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  const remSec = seconds % 60;

  if (hours > 0) return `${hours}ч ${remMin}м`;
  if (minutes > 0) return `${minutes}м ${remSec}с`;
  return `${remSec}с`;
}

document.addEventListener("DOMContentLoaded", () => {
  const statsList = document.getElementById("stats");
  const emptyMsg = document.getElementById("emptyMsg");
  const today = new Date().toISOString().split("T")[0];

  chrome.storage.local.get([today], (result) => {
    const todayStats = result[today] || {};
    const entries = Object.entries(todayStats);

    if (entries.length === 0) {
      statsList.style.display = "none";
      emptyMsg.style.display = "block";
      return;
    }

    const sorted = entries.sort((a, b) => b[1] - a[1]);

    for (const [domain, time] of sorted) {
      const card = document.createElement("div");
      card.className = "card";

      const domainSpan = document.createElement("div");
      domainSpan.className = "domain";
      domainSpan.textContent = domain;

      const timeSpan = document.createElement("div");
      timeSpan.className = "time";
      timeSpan.textContent = formatTime(time);

      card.appendChild(domainSpan);
      card.appendChild(timeSpan);
      statsList.appendChild(card);
    }
  });

  document.getElementById("clear").addEventListener("click", () => {
  statsList.innerHTML = "";
  statsList.style.display = "none";
  emptyMsg.textContent = "Очищено";
  emptyMsg.style.display = "block";
});
});

