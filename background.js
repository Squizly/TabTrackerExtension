let activeTabId = null;
let activeWindowId = null;
let startTime = null;
let timerId = null;

const GAS_URL = ""; // paste WEB-HOOK from google sheets

async function saveTime(tabId, timeSpent) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    const domain = url.hostname;

    const today = new Date().toISOString().split("T")[0];

    chrome.storage.local.get(null, (allData) => {
      const dateKeys = Object.keys(allData).filter((key) =>
        /^\d{4}-\d{2}-\d{2}$/.test(key)
      );

      const sortedDates = dateKeys.sort();

      if (sortedDates.length > 2) {
        const toDelete = sortedDates.slice(0, sortedDates.length - 2);
        chrome.storage.local.remove(toDelete);
      }

      const todayStats = allData[today] || {};
      const previous = todayStats[domain] || 0;
      todayStats[domain] = previous + timeSpent;

      chrome.storage.local.set({ [today]: todayStats });
    });
  } catch (e) {
  }
}

async function startTracking(tabId, windowId) {
  if (timerId) {
    clearInterval(timerId);
  }

  if (activeTabId !== null && startTime !== null) {
    const timeSpent = Date.now() - startTime;
    await saveTime(activeTabId, timeSpent);
  }

  activeTabId = tabId;
  activeWindowId = windowId;
  startTime = Date.now();

  if (tabId !== null) {
    timerId = setInterval(async () => {
      if (activeTabId === null || startTime === null) return;

      const now = Date.now();
      const elapsed = now - startTime;
      startTime = now;

      await saveTime(activeTabId, elapsed);
    }, 5000);
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  startTracking(activeInfo.tabId, activeInfo.windowId);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (activeTabId !== null && startTime !== null) {
      const timeSpent = Date.now() - startTime;
      await saveTime(activeTabId, timeSpent);
    }
    activeTabId = null;
    activeWindowId = null;
    startTime = null;
  } else {
    chrome.windows.get(windowId, { populate: true }, (window) => {
      const activeTab = window.tabs.find((t) => t.active);
      if (activeTab) {
        startTracking(activeTab.id, windowId);
      }
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    startTracking(tabId, tab.windowId);
  }
});

async function syncDataToGoogleSheets() {
  chrome.storage.local.get(null, (allData) => {
    const dateKeys = Object.keys(allData).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));

    const dataToSend = [];

    dateKeys.forEach(dateKey => {
      const dayData = allData[dateKey];
      if (typeof dayData === "object") {
        for (const [domain, timestamp] of Object.entries(dayData)) {
          dataToSend.push({
            date: dateKey,
            domain,
            timestamp
          });
        }
      }
    });

    if (dataToSend.length === 0) return;

    fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(dataToSend),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.text())
    .then(text => {
      console.log("Google Sheets sync response:", text);
    })
    .catch(err => {
      console.error("Error syncing to Google Sheets:", err);
    });
  });
}

setInterval(() => {
  syncDataToGoogleSheets();
}, 2 * 60 * 1000);
