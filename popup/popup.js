// designed by alfathaannn.id
/**
 * POS & Kiosk Auto Display Manager - Popup Controller
 * Manages Neumorphism UI interactions, custom dropdown with Hugeicons, display detection, and rule persistence.
 */

// designed by alfathaannn.id
document.addEventListener("DOMContentLoaded", async () => {
  // designed by alfathaannn.id
  // DOM Elements
  const urlInput = document.getElementById("urlInput");
  const customDisplayTrigger = document.getElementById("customDisplayTrigger");
  const customDisplayOptions = document.getElementById("customDisplayOptions");
  const customDisplayText = document.getElementById("customDisplayText");
  const customDisplaySelectWrapper = document.getElementById("customDisplaySelectWrapper");

  // designed by alfathaannn.id
  const fullscreenToggle = document.getElementById("fullscreenToggle");
  const separateWinToggle = document.getElementById("separateWinToggle");
  const saveBtn = document.getElementById("saveBtn");
  const testBtn = document.getElementById("testBtn");
  const refreshDisplaysBtn = document.getElementById("refreshDisplaysBtn");
  const rulesList = document.getElementById("rulesList");
  const ruleCount = document.getElementById("ruleCount");
  const displayCountText = document.getElementById("displayCountText");
  const statusMessage = document.getElementById("statusMessage");

  // designed by alfathaannn.id
  let detectedDisplays = [];
  let selectedDisplay = null; // { id, index, name, isPrimary, bounds }

  // designed by alfathaannn.id
  // Helper: Show Feedback Message
  function showStatus(text, type = "success", duration = 3000) {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove("hidden");

    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, duration);
  }

  // designed by alfathaannn.id
  // Close Custom Dropdown
  function closeDropdown() {
    customDisplayOptions.classList.remove("is-open");
    customDisplayTrigger.classList.remove("is-open");
    customDisplayTrigger.setAttribute("aria-expanded", "false");
  }

  // designed by alfathaannn.id
  // Open Custom Dropdown
  function openDropdown() {
    customDisplayOptions.classList.add("is-open");
    customDisplayTrigger.classList.add("is-open");
    customDisplayTrigger.setAttribute("aria-expanded", "true");
  }

  // designed by alfathaannn.id
  // Toggle Custom Dropdown
  function toggleDropdown() {
    if (customDisplayOptions.classList.contains("is-open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  // designed by alfathaannn.id
  // Select a display option
  function chooseDisplay(display, index) {
    selectedDisplay = {
      id: display.id,
      index: index,
      name: display.name || `Display ${index + 1}`,
      isPrimary: display.isPrimary,
      bounds: `${display.bounds.width}x${display.bounds.height}`
    };

    const isPrimaryBadge = display.isPrimary ? " (Utama)" : "";
    customDisplayText.textContent = `[Display ${index + 1}] ${selectedDisplay.name} - ${selectedDisplay.bounds}${isPrimaryBadge}`;

    // Update active class on option elements
    const allOptions = customDisplayOptions.querySelectorAll(".custom-option");
    allOptions.forEach((opt) => {
      if (opt.dataset.id === display.id) {
        opt.classList.add("is-selected");
        const checkEl = opt.querySelector(".option-check");
        if (checkEl) checkEl.style.display = "flex";
      } else {
        opt.classList.remove("is-selected");
        const checkEl = opt.querySelector(".option-check");
        if (checkEl) checkEl.style.display = "none";
      }
    });

    closeDropdown();
  }

  // designed by alfathaannn.id
  // Load and render custom dropdown options with Hugeicons
  async function loadDisplays() {
    try {
      customDisplayText.textContent = "Mendeteksi monitor...";
      customDisplayOptions.innerHTML = "";
      detectedDisplays = await chrome.system.display.getInfo();

      if (!detectedDisplays || detectedDisplays.length === 0) {
        customDisplayText.textContent = "Tidak ada monitor terdeteksi";
        displayCountText.textContent = "0 Layar";
        selectedDisplay = null;
        return;
      }

      displayCountText.textContent = `${detectedDisplays.length} Layar`;

      // Determine default display (secondary if dual monitor, else primary)
      let defaultIdx = 0;
      if (detectedDisplays.length > 1) {
        const secIdx = detectedDisplays.findIndex(d => !d.isPrimary);
        defaultIdx = secIdx >= 0 ? secIdx : 0;
      }

      detectedDisplays.forEach((disp, idx) => {
        const optionEl = document.createElement("div");
        optionEl.className = "custom-option";
        optionEl.dataset.id = disp.id;
        optionEl.dataset.index = idx;

        const isPrimary = disp.isPrimary;
        const bounds = `${disp.bounds.width}x${disp.bounds.height}`;
        const name = disp.name ? disp.name : `Display ${idx + 1}`;

        // designed by alfathaannn.id
        optionEl.innerHTML = `
          <div class="option-left">
            <div class="option-icon-wrap">
              <!-- Hugeicons: computer-desk -->
              <svg class="hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="13" rx="2.5"></rect>
                <path d="M8 21h8"></path>
                <path d="M12 16v5"></path>
              </svg>
            </div>
            <div class="option-text">
              <span class="option-title">[Display ${idx + 1}] ${escapeHtml(name)}</span>
              <span class="option-res">${bounds}</span>
            </div>
          </div>
          <div class="option-badges">
            ${isPrimary ? '<span class="badge badge-primary">Utama</span>' : '<span class="badge">Sekunder</span>'}
            <span class="option-check" style="display: none;">
              <!-- Hugeicons: tick-02 -->
              <svg class="hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 13 4 4L19 7"></path>
              </svg>
            </span>
          </div>
        `;

        optionEl.addEventListener("click", () => {
          chooseDisplay(disp, idx);
        });

        customDisplayOptions.appendChild(optionEl);
      });

      // Set default selected option
      chooseDisplay(detectedDisplays[defaultIdx], defaultIdx);

    } catch (err) {
      console.error("Gagal mendeteksi display:", err);
      customDisplayText.textContent = "Gagal memuat monitor";
      showStatus("Gagal membaca monitor: " + err.message, "error");
    }
  }

  // designed by alfathaannn.id
  // Load saved rules from storage
  async function loadRules() {
    const { rules = [] } = await chrome.storage.local.get({ rules: [] });
    ruleCount.textContent = rules.length;

    if (rules.length === 0) {
      rulesList.innerHTML = `
        <div class="empty-state">
          <p>Belum ada aturan tersimpan.</p>
          <span class="empty-hint">Masukkan URL dan pilih monitor di atas lalu klik Simpan.</span>
        </div>
      `;
      return;
    }

    rulesList.innerHTML = "";

    rules.forEach((rule) => {
      const card = document.createElement("div");
      card.className = "rule-card";

      const displayLabel = rule.displayName || `Display ${rule.displayIndex + 1}`;

      // designed by alfathaannn.id
      card.innerHTML = `
        <div class="rule-info">
          <div class="rule-url" title="${escapeHtml(rule.urlPattern)}">
            ${escapeHtml(rule.urlPattern)}
          </div>
          <div class="rule-badges">
            <span class="badge badge-primary">
              <!-- Hugeicons: computer-desk -->
              <svg class="hugeicon badge-hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="13" rx="2.5"></rect>
                <path d="M8 21h8"></path>
                <path d="M12 16v5"></path>
              </svg>
              <span>${escapeHtml(displayLabel)}</span>
            </span>

            ${rule.autoFullscreen ? `
              <span class="badge badge-fullscreen">
                <!-- Hugeicons: maximize-01 -->
                <svg class="hugeicon badge-hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
                <span>Fullscreen</span>
              </span>
            ` : ''}

            ${rule.separateWindow ? `
              <span class="badge">
                <!-- Hugeicons: window-tabs -->
                <svg class="hugeicon badge-hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M7 6.5h.01"></path>
                  <path d="M10 6.5h.01"></path>
                </svg>
                <span>Pisah Jendela</span>
              </span>
            ` : ''}
          </div>
        </div>
        <div class="rule-actions">
          <button class="btn-rule-test" data-id="${rule.id}" title="Test Pindahkan Jendela">
            <!-- Hugeicons: play-stroke-rounded -->
            <svg class="hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 4.75a1 1 0 0 1 1.518-.857l12.44 7.25a1 1 0 0 1 0 1.714l-12.44 7.25A1 1 0 0 1 6 19.25V4.75Z"></path>
            </svg>
          </button>
          <button class="btn-rule-delete" data-id="${rule.id}" title="Hapus Aturan">
            <!-- Hugeicons: delete-02 -->
            <svg class="hugeicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19.5 5.5 18.8 18.5a2.5 2.5 0 0 1-2.5 2.5H7.7a2.5 2.5 0 0 1-2.5-2.5L4.5 5.5"></path>
              <path d="M3 5.5h18"></path>
              <path d="M9 5.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"></path>
              <path d="M10 10v6"></path>
              <path d="M14 10v6"></path>
            </svg>
          </button>
        </div>
      `;

      // Event listener test button
      card.querySelector(".btn-rule-test").addEventListener("click", () => {
        executeTestMove(rule.displayId, rule.displayIndex, rule.autoFullscreen);
      });

      // Event listener delete button
      card.querySelector(".btn-rule-delete").addEventListener("click", async () => {
        await deleteRule(rule.id);
      });

      rulesList.appendChild(card);
    });
  }

  // designed by alfathaannn.id
  // Save new rule
  async function handleSave() {
    const pattern = urlInput.value.trim();
    if (!pattern) {
      showStatus("Harap isi URL atau kata kunci terlebih dahulu!", "error");
      urlInput.focus();
      return;
    }

    if (!selectedDisplay) {
      showStatus("Silakan pilih target display terlebih dahulu!", "error");
      return;
    }

    const autoFullscreen = fullscreenToggle.checked;
    const separateWindow = separateWinToggle.checked;

    const { rules = [] } = await chrome.storage.local.get({ rules: [] });

    // Check if an existing rule with this pattern already exists
    const existingIndex = rules.findIndex(r => r.urlPattern.toLowerCase() === pattern.toLowerCase());

    const newRule = {
      id: existingIndex >= 0 ? rules[existingIndex].id : "rule_" + Date.now(),
      urlPattern: pattern,
      displayId: selectedDisplay.id,
      displayIndex: selectedDisplay.index,
      displayName: selectedDisplay.name,
      autoFullscreen: autoFullscreen,
      separateWindow: separateWindow,
      enabled: true,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      rules[existingIndex] = newRule;
    } else {
      rules.unshift(newRule);
    }

    await chrome.storage.local.set({ rules });

    showStatus("Aturan berhasil disimpan!", "success");
    urlInput.value = "";
    await loadRules();
  }

  // designed by alfathaannn.id
  // Delete rule
  async function deleteRule(id) {
    const { rules = [] } = await chrome.storage.local.get({ rules: [] });
    const updated = rules.filter(r => r.id !== id);
    await chrome.storage.local.set({ rules: updated });
    showStatus("Aturan telah dihapus.", "success");
    await loadRules();
  }

  // designed by alfathaannn.id
  // Test moving current window to target display
  function executeTestMove(displayId, displayIndex, autoFullscreen = true) {
    chrome.runtime.sendMessage({
      action: "TEST_MOVE_WINDOW",
      displayId: displayId,
      displayIndex: displayIndex,
      autoFullscreen: autoFullscreen
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus("Error: " + chrome.runtime.lastError.message, "error");
      } else if (response && response.success) {
        showStatus("Jendela berhasil dipindahkan!", "success");
      } else {
        showStatus("Gagal: " + (response ? response.error : "Unknown error"), "error");
      }
    });
  }

  // designed by alfathaannn.id
  // Helper: Escape HTML string
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // designed by alfathaannn.id
  // Event Listeners
  customDisplayTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // designed by alfathaannn.id
  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!customDisplaySelectWrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // designed by alfathaannn.id
  // Close dropdown on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });

  // designed by alfathaannn.id
  saveBtn.addEventListener("click", handleSave);

  testBtn.addEventListener("click", () => {
    if (!selectedDisplay) {
      showStatus("Pilih monitor terlebih dahulu!", "error");
      return;
    }
    executeTestMove(
      selectedDisplay.id,
      selectedDisplay.index,
      fullscreenToggle.checked
    );
  });

  refreshDisplaysBtn.addEventListener("click", async () => {
    await loadDisplays();
    showStatus("Daftar monitor diperbarui.", "success");
  });

  // designed by alfathaannn.id
  // Enter key on URL input triggers save
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSave();
    }
  });

  // designed by alfathaannn.id
  // Initialize
  await loadDisplays();
  await loadRules();
});

// designed by alfathaannn.id
