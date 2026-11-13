// designed by alfathaannn.id
/**
 * POS & Kiosk Auto Display Manager - Background Service Worker
 * Handles automatic window positioning & fullscreen across multi-monitor setups.
 */

// designed by alfathaannn.id
// Memory cache to debounce rapid navigation events on the same tab
const processedTabs = new Map();

// designed by alfathaannn.id
// Helper: Normalize URL string for comparison
function cleanUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return (parsed.origin + parsed.pathname).toLowerCase();
  } catch (e) {
    return url.toLowerCase();
  }
}

// designed by alfathaannn.id
// Find matching rule for a given URL
async function findMatchingRule(url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("about:")) {
    return null;
  }

  const { rules = [] } = await chrome.storage.local.get({ rules: [] });
  const urlLower = url.toLowerCase();

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const pattern = (rule.urlPattern || "").trim().toLowerCase();
    if (!pattern) continue;

    // Check matching
    if (urlLower.includes(pattern)) {
      return rule;
    }
  }
  return null;
}

// designed by alfathaannn.id
// Locate target display from display list using ID, index, or name
function resolveTargetDisplay(displays, rule) {
  if (!displays || displays.length === 0) return null;

  // 1. Try matching by exact ID
  if (rule.displayId) {
    const byId = displays.find(d => d.id === rule.displayId);
    if (byId) return byId;
  }

  // 2. Try matching by displayIndex
  if (typeof rule.displayIndex === "number" && displays[rule.displayIndex]) {
    return displays[rule.displayIndex];
  }

  // 3. Try matching by name
  if (rule.displayName) {
    const byName = displays.find(d => d.name === rule.displayName);
    if (byName) return byName;
  }

  // Fallback to first available display
  return displays[0];
}

// designed by alfathaannn.id
// Move a window to target display and enter fullscreen
async function moveWindowToDisplay(windowId, targetDisplay, autoFullscreen = true) {
  try {
    const bounds = targetDisplay.bounds;
    
    // Step 1: Set to normal state and position within the target display bounds
    // Chrome requires setting coordinates in "normal" state first
    await chrome.windows.update(windowId, {
      state: "normal",
      left: Math.round(bounds.left + 50),
      top: Math.round(bounds.top + 50),
      width: Math.max(800, Math.min(1024, bounds.width - 100)),
      height: Math.max(600, Math.min(768, bounds.height - 100)),
      focused: true
    });

    // designed by alfathaannn.id
    // Step 2: Set fullscreen if requested
    if (autoFullscreen) {
      setTimeout(async () => {
        try {
          await chrome.windows.update(windowId, {
            state: "fullscreen"
          });
        } catch (err) {
          console.warn("[AutoDisplay] Gagal set fullscreen:", err.message);
        }
      }, 350);
    }

    return true;
  } catch (err) {
    console.error("[AutoDisplay] Gagal memindahkan window:", err);
    return false;
  }
}

// designed by alfathaannn.id
// Process tab and execute placement if rule matches
async function processTab(tabId, url) {
  if (!url) return;

  // Debounce check: Jangan proses ulang jika URL sama dalam 4 detik terakhir pada tab ini
  const last = processedTabs.get(tabId);
  const now = Date.now();
  if (last && last.url === cleanUrl(url) && (now - last.time) < 4000) {
    return;
  }

  const rule = await findMatchingRule(url);
  if (!rule) return;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab) return;

    processedTabs.set(tabId, { url: cleanUrl(url), time: now });

    const displays = await chrome.system.display.getInfo();
    const targetDisplay = resolveTargetDisplay(displays, rule);
    if (!targetDisplay) {
      console.warn("[AutoDisplay] Tidak ada display yang cocok ditemukan!");
      return;
    }

    const currentWindow = await chrome.windows.get(tab.windowId, { populate: true });
    let targetWindowId = tab.windowId;

    // designed by alfathaannn.id
    // Jika tab berada dalam window yang memiliki banyak tab dan aturan memisahkan tab aktif
    if (rule.separateWindow && currentWindow.tabs && currentWindow.tabs.length > 1) {
      const newWin = await chrome.windows.create({
        tabId: tab.id,
        focused: true
      });
      targetWindowId = newWin.id;
    }

    await moveWindowToDisplay(targetWindowId, targetDisplay, rule.autoFullscreen !== false);
  } catch (err) {
    console.error("[AutoDisplay] Error saat memproses tab:", err);
  }
}

// designed by alfathaannn.id
// Event Listener 1: Tab URL updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const urlToCheck = changeInfo.url || tab.url;
  if (urlToCheck) {
    processTab(tabId, urlToCheck);
  }
});

// designed by alfathaannn.id
// Event Listener 2: Web Navigation committed (reliable for fast redirection)
chrome.webNavigation.onCommitted.addListener((details) => {
  // Hanya proses frame utama (bukan iframe)
  if (details.frameId === 0 && details.url) {
    processTab(details.tabId, details.url);
  }
});

// designed by alfathaannn.id
// Event Listener 3: Runtime Messages from Popup (e.g. Instant Test Move)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "TEST_MOVE_WINDOW") {
    (async () => {
      try {
        const displays = await chrome.system.display.getInfo();
        const targetDisplay = resolveTargetDisplay(displays, {
          displayId: message.displayId,
          displayIndex: message.displayIndex
        });

        if (!targetDisplay) {
          sendResponse({ success: false, error: "Display target tidak ditemukan!" });
          return;
        }

        const currentWindow = await chrome.windows.getCurrent();
        const success = await moveWindowToDisplay(
          currentWindow.id,
          targetDisplay,
          message.autoFullscreen !== false
        );

        sendResponse({ success });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
});

// designed by alfathaannn.id
// Cleanup cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [tabId, data] of processedTabs.entries()) {
    if (now - data.time > 30000) {
      processedTabs.delete(tabId);
    }
  }
}, 60000);

// designed by alfathaannn.id
