(() => {
  "use strict";

  const DEFAULT_BALANCE = 2456575;
  const DEFAULT_ORDER_COUNT = 1824353;
  const SALE_DISCOUNT = 0.35;

  const STORAGE_KEYS = {
    balance: "dreadmarket_balance_v3",
    purchasedItems: "dreadmarket_purchased_items_v3",
    customOrders: "dreadmarket_custom_orders_v3",
    customTransactions: "dreadmarket_custom_transactions_v3",
    saleMode: "dreadmarket_sale_mode_v3",
    tradeBalances: "dreadmarket_trade_balances_v3",
  };

  const state = {
    balance: DEFAULT_BALANCE,
    selectedItem: null,
    selectedPrice: 0,
    selectedVendor: "",
    activeCategory: "all",
    purchasedItems: new Set(),
    customOrders: [],
    customTransactions: [],
    saleMode: false,
    fundsMode: "",
    tradeBalances: {
      btc: 0,
      eth: 0,
      sol: 0,
      usdt: 0,
    },
  };

  const CONNECTED_ACCOUNTS = {
    deposit: [
      "Blackwake Checking",
      "Saltveil Reserve",
      "Storm Credit Union",
      "Aster Wallet",
    ],
    withdraw: [
      "Blackwake Checking",
      "Saltveil Reserve",
      "Storm Credit Union",
      "Aster Wallet",
    ],
    trade: [
      "Aster Wallet",
      "Cold Harbor BTC Vault",
    ],
  };

  const els = {
    sidebar: document.getElementById("sidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop"),
    menuToggle: document.getElementById("menuToggle"),
    closeSidebar: document.getElementById("closeSidebar"),
    navLinks: document.querySelectorAll(".nav-link, .side-link"),
    panelJumpButtons: document.querySelectorAll("[data-panel-target]"),
    panels: document.querySelectorAll(".panel, .hero-banner"),
    categoryButtons: document.querySelectorAll(".category-btn"),
    listings: document.querySelectorAll(".listing-card"),
    search: document.getElementById("marketSearch"),
    buyButtons: document.querySelectorAll(".buy-btn"),

    modal: document.getElementById("buyModal"),
    closeModal: document.getElementById("closeModal"),
    confirmPurchase: document.getElementById("confirmPurchase"),
    modalItemName: document.getElementById("modalItemName"),
    modalItemLabel: document.getElementById("modalItemLabel"),
    modalItemPrice: document.getElementById("modalItemPrice"),

    fundsModal: document.getElementById("fundsModal"),
    closeFundsModal: document.getElementById("closeFundsModal"),
    fundsModeLabel: document.getElementById("fundsModeLabel"),
    fundsModalTitle: document.getElementById("fundsModalTitle"),
    fundsModalCopy: document.getElementById("fundsModalCopy"),
    fundsAccountSelect: document.getElementById("fundsAccountSelect"),
    fundsAmountInput: document.getElementById("fundsAmountInput"),
    fundsAmountSlider: document.getElementById("fundsAmountSlider"),
    fundsSliderReadout: document.getElementById("fundsSliderReadout"),
    fundsSliderField: document.getElementById("fundsSliderField"),
    fundsAmountField: document.getElementById("fundsAmountField"),
    tradeAssetField: document.getElementById("tradeAssetField"),
    tradeAssetSelect: document.getElementById("tradeAssetSelect"),
    fundsProgressWrap: document.getElementById("fundsProgressWrap"),
    fundsProgressFill: document.getElementById("fundsProgressFill"),
    fundsProgressText: document.getElementById("fundsProgressText"),
    fundsActionBtn: document.getElementById("fundsActionBtn"),

    toastWrap: document.getElementById("toastWrap"),
    walletBalance: document.getElementById("walletBalance"),
    walletBig: document.getElementById("walletBig"),
    txList: document.getElementById("txList"),
    activityFeed: document.getElementById("activityFeed"),
    walletActions: document.querySelectorAll(".wallet-action"),
    ordersList: document.getElementById("ordersList"),
    orderCount: document.getElementById("orderCount"),
    ordersBadge: document.getElementById("ordersBadge"),
    ordersBadgeMobile: document.getElementById("ordersBadgeMobile"),
    badgeCountInput: document.getElementById("badgeCountInput"),
    saveBadgeCountBtn: document.getElementById("saveBadgeCountBtn"),
    toggleSaleModeBtn: document.getElementById("toggleSaleModeBtn"),
    clearPurchaseHistoryBtn: document.getElementById("clearPurchaseHistoryBtn"),
    fullDemoResetBtn: document.getElementById("fullDemoResetBtn"),
  };

  function formatMoney(value) {
    return `$${Number(value).toLocaleString("en-US")}`;
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadState() {
    const savedBalance = localStorage.getItem(STORAGE_KEYS.balance);
    const savedPurchasedItems = localStorage.getItem(STORAGE_KEYS.purchasedItems);
    const savedOrders = localStorage.getItem(STORAGE_KEYS.customOrders);
    const savedTransactions = localStorage.getItem(STORAGE_KEYS.customTransactions);
    const savedSaleMode = localStorage.getItem(STORAGE_KEYS.saleMode);
    const savedTradeBalances = localStorage.getItem(STORAGE_KEYS.tradeBalances);

    if (savedBalance !== null && !Number.isNaN(Number(savedBalance))) {
      state.balance = Number(savedBalance);
    }

    state.purchasedItems = new Set(safeParse(savedPurchasedItems, []));
    state.customOrders = safeParse(savedOrders, []);
    state.customTransactions = safeParse(savedTransactions, []);
    state.saleMode = savedSaleMode === "true";
    state.tradeBalances = {
      ...state.tradeBalances,
      ...safeParse(savedTradeBalances, {}),
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.balance, String(state.balance));
    localStorage.setItem(STORAGE_KEYS.purchasedItems, JSON.stringify([...state.purchasedItems]));
    localStorage.setItem(STORAGE_KEYS.customOrders, JSON.stringify(state.customOrders));
    localStorage.setItem(STORAGE_KEYS.customTransactions, JSON.stringify(state.customTransactions));
    localStorage.setItem(STORAGE_KEYS.saleMode, String(state.saleMode));
    localStorage.setItem(STORAGE_KEYS.tradeBalances, JSON.stringify(state.tradeBalances));
  }

  function updateBalanceUI() {
    const money = formatMoney(state.balance);
    if (els.walletBalance) els.walletBalance.textContent = money;
    if (els.walletBig) els.walletBig.textContent = money;
  }

  function updateOrderCount() {
    if (!els.orderCount) return;
    const total = DEFAULT_ORDER_COUNT + state.customOrders.length;
    els.orderCount.textContent = total.toLocaleString("en-US");
  }

  function updateBadgeUI() {
    const liveOrderRows = document.querySelectorAll("#ordersList .order-row").length;
    const text = String(liveOrderRows);

    if (els.ordersBadge) els.ordersBadge.textContent = text;
    if (els.ordersBadgeMobile) els.ordersBadgeMobile.textContent = text;
    if (els.badgeCountInput) els.badgeCountInput.value = text;
  }

  function createToastContent(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="toast-line"></span>${message}`;
    return toast;
  }

  function showToast(message) {
    if (!els.toastWrap) return;
    const toast = createToastContent(message);
    els.toastWrap.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 220);
    }, 3000);
  }

  function closeSidebarMenu() {
    els.sidebar?.classList.remove("open");
    els.sidebarBackdrop?.classList.remove("show");
  }

  function openSidebarMenu() {
    els.sidebar?.classList.add("open");
    els.sidebarBackdrop?.classList.add("show");
  }

  function setActivePanel(panelId) {
    els.panels.forEach((panel) => {
      panel.hidden = panel.id !== panelId;
    });

    els.navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.panel === panelId);
    });

    closeSidebarMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function filterListings() {
    const term = (els.search?.value || "").trim().toLowerCase();

    els.listings.forEach((card) => {
      const cardCategory = card.dataset.category || "";
      const cardName = (card.dataset.name || "").toLowerCase();

      const categoryMatch = state.activeCategory === "all" || state.activeCategory === cardCategory;
      const searchMatch = !term || cardName.includes(term) || card.textContent.toLowerCase().includes(term);

      card.hidden = !(categoryMatch && searchMatch);
    });
  }

  function getEffectivePrice(basePrice) {
    const price = Number(basePrice);
    if (!state.saleMode) return price;
    return Math.max(1, Math.round(price * (1 - SALE_DISCOUNT)));
  }

  function updateSaleModeUI() {
    els.listings.forEach((card) => {
      const button = card.querySelector(".buy-btn");
      const pricePill = card.querySelector(".price-text");
      if (!button || !pricePill) return;

      const originalPrice = Number(button.dataset.originalPrice || button.dataset.price || 0);
      button.dataset.originalPrice = String(originalPrice);

      const livePrice = getEffectivePrice(originalPrice);
      button.dataset.price = String(livePrice);
      pricePill.textContent = formatMoney(livePrice);

      let badge = card.querySelector(".sale-badge");

      if (state.saleMode) {
        card.classList.add("on-sale");
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "sale-badge";
          badge.textContent = "SALE";
          pricePill.insertAdjacentElement("afterend", badge);
        }
      } else {
        card.classList.remove("on-sale");
        badge?.remove();
      }
    });

    if (els.toggleSaleModeBtn) {
      els.toggleSaleModeBtn.textContent = state.saleMode ? "Disable Sale Mode" : "Enable Sale Mode";
    }
  }

  function openModal(item, price, vendor) {
    if (state.purchasedItems.has(item)) {
      showToast(`${item} already purchased.`);
      return;
    }

    state.selectedItem = item;
    state.selectedPrice = Number(price);
    state.selectedVendor = vendor || "Unknown Vendor";

    if (els.modalItemName) els.modalItemName.textContent = item;
    if (els.modalItemLabel) els.modalItemLabel.textContent = item;
    if (els.modalItemPrice) els.modalItemPrice.textContent = formatMoney(price);

    els.modal?.classList.add("show");
    els.modal?.setAttribute("aria-hidden", "false");
  }

  function closePurchaseModal() {
    els.modal?.classList.remove("show");
    els.modal?.setAttribute("aria-hidden", "true");
  }

    function openFundsModal(mode) {
    state.fundsMode = mode;

    const maxAvailable = Math.max(100, Math.floor(state.balance));
    const defaultValue = Math.min(5000, maxAvailable);

    if (els.fundsAmountSlider) {
        els.fundsAmountSlider.max = String(maxAvailable);
        els.fundsAmountSlider.value = String(defaultValue);
    }

    if (mode === "deposit") {
        els.fundsModeLabel.textContent = "Funding Route";
        els.fundsModalTitle.textContent = "Deposit Funds";
        els.fundsModalCopy.textContent = "Select a connected account and move funds into your Dreadmarket reserve.";
        els.fundsActionBtn.textContent = "Deposit";
        els.fundsSliderField.hidden = true;
        els.fundsAmountField.hidden = false;
        els.tradeAssetField.hidden = true;
        populateAccountOptions(CONNECTED_ACCOUNTS.deposit);
    }

    if (mode === "withdraw") {
        els.fundsModeLabel.textContent = "Withdrawal Route";
        els.fundsModalTitle.textContent = "Withdraw Funds";
        els.fundsModalCopy.textContent = "Select which connected account receives the transfer, then choose the amount.";
        els.fundsActionBtn.textContent = "Transfer";
        els.fundsSliderField.hidden = false;
        els.fundsAmountField.hidden = true;
        els.tradeAssetField.hidden = true;
        populateAccountOptions(CONNECTED_ACCOUNTS.withdraw);
        syncSliderReadout();
    }

    if (mode === "trade") {
        els.fundsModeLabel.textContent = "Trade Route";
        els.fundsModalTitle.textContent = "Trade Into Aster Wallet";
        els.fundsModalCopy.textContent = "Allocate part of your reserve into crypto held under your connected Aster Wallet.";
        els.fundsActionBtn.textContent = "Trade";
        els.fundsSliderField.hidden = false;
        els.fundsAmountField.hidden = true;
        els.tradeAssetField.hidden = false;
        populateAccountOptions(CONNECTED_ACCOUNTS.trade);
        els.fundsAccountSelect.value = "Aster Wallet";
        syncSliderReadout();
    }

    resetFundsProgress();
    els.fundsModal?.classList.add("show");
    els.fundsModal?.setAttribute("aria-hidden", "false");
    }

  function closeFundsModal() {
    els.fundsModal?.classList.remove("show");
    els.fundsModal?.setAttribute("aria-hidden", "true");
    resetFundsProgress();
  }

  function populateAccountOptions(accounts) {
    if (!els.fundsAccountSelect) return;
    els.fundsAccountSelect.innerHTML = accounts
      .map((account) => `<option value="${account}">${account}</option>`)
      .join("");
  }

    function syncSliderReadout() {
    const maxAvailable = Math.max(100, Math.floor(state.balance));

    if (els.fundsAmountSlider) {
        els.fundsAmountSlider.max = String(maxAvailable);

        if (Number(els.fundsAmountSlider.value) > maxAvailable) {
        els.fundsAmountSlider.value = String(maxAvailable);
        }
    }

    const value = Number(els.fundsAmountSlider?.value || 0);

    if (els.fundsSliderReadout) {
        els.fundsSliderReadout.textContent = `${formatMoney(value)} / ${formatMoney(maxAvailable)}`;
    }
    }

  function resetFundsProgress() {
    if (els.fundsProgressWrap) els.fundsProgressWrap.hidden = true;
    if (els.fundsProgressFill) els.fundsProgressFill.style.width = "0%";
    if (els.fundsProgressText) els.fundsProgressText.textContent = "Processing transfer...";
    if (els.fundsActionBtn) els.fundsActionBtn.disabled = false;
  }

  function runFundsProgress(message) {
    return new Promise((resolve) => {
      if (els.fundsProgressWrap) els.fundsProgressWrap.hidden = false;
      if (els.fundsProgressText) els.fundsProgressText.textContent = message;
      if (els.fundsActionBtn) els.fundsActionBtn.disabled = true;

      let percent = 0;
      const duration = 4000;
      const intervalMs = 100;
      const step = 100 / (duration / intervalMs);

      const timer = setInterval(() => {
        percent += step;
        if (els.fundsProgressFill) {
          els.fundsProgressFill.style.width = `${Math.min(percent, 100)}%`;
        }

        if (percent >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, intervalMs);
    });
  }

  function prependTransaction(label, amountText) {
    if (!els.txList) return;

    const item = document.createElement("div");
    item.className = "tx-item";
    item.innerHTML = `<span>${label}</span><strong>${amountText}</strong>`;
    els.txList.prepend(item);

    const items = els.txList.querySelectorAll(".tx-item");
    if (items.length > 8) {
      items[items.length - 1].remove();
    }
  }

  function addActivityLine(text) {
    if (!els.activityFeed) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const p = document.createElement("p");
    p.innerHTML = `<span class="feed-time">${hh}:${mm}</span> ${text}`;
    els.activityFeed.appendChild(p);

    while (els.activityFeed.children.length > 8) {
      els.activityFeed.removeChild(els.activityFeed.firstElementChild);
    }
  }

  function formatDateTime(dateInput) {
    const now = new Date(dateInput);
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${formattedDate} • ${formattedTime}`;
  }

  function createOrderMarkup(orderData) {
    return `
      <div class="order-main">
        <h3>${orderData.itemName}</h3>
        <p>Vendor: ${orderData.vendorName}</p>
        <p>Price: ${formatMoney(orderData.itemPrice)}</p>
        <p>Purchased: ${formatDateTime(orderData.createdAt)}</p>
      </div>
      <div class="order-side">
        <span class="status pending">Purchased</span>
      </div>
    `;
  }

  function addOrder(itemName, itemPrice, vendorName = "Unknown Vendor", createdAt = new Date().toISOString()) {
    if (!els.ordersList) return;

    const orderData = {
      itemName,
      itemPrice,
      vendorName,
      createdAt,
    };

    state.customOrders.unshift(orderData);

    const order = document.createElement("article");
    order.className = "order-row";
    order.innerHTML = createOrderMarkup(orderData);
    els.ordersList.prepend(order);

    updateOrderCount();
    updateBadgeUI();
  }

  function renderSavedOrders() {
    if (!els.ordersList || !state.customOrders.length) return;

    const fragment = document.createDocumentFragment();

    state.customOrders
      .slice()
      .reverse()
      .forEach((orderData) => {
        const order = document.createElement("article");
        order.className = "order-row";
        order.innerHTML = createOrderMarkup(orderData);
        fragment.prepend(order);
      });

    els.ordersList.prepend(fragment);
    updateBadgeUI();
  }

  function renderSavedTransactions() {
    if (!els.txList || !state.customTransactions.length) return;

    state.customTransactions
      .slice()
      .reverse()
      .forEach((tx) => {
        const item = document.createElement("div");
        item.className = "tx-item";
        item.innerHTML = `<span>${tx.label}</span><strong>${tx.amountText}</strong>`;
        els.txList.prepend(item);
      });

    const items = els.txList.querySelectorAll(".tx-item");
    while (items.length > 8) {
      items[items.length - 1].remove();
    }
  }

  function markListingPurchased(itemName) {
    const safeItem = CSS.escape(itemName);
    const button = document.querySelector(`.buy-btn[data-item="${safeItem}"]`);
    if (!button) return;

    button.textContent = "Purchased";
    button.disabled = true;
    button.classList.add("purchased-btn");
    button.setAttribute("aria-disabled", "true");
  }

  function resetListingButton(itemName) {
    const safeItem = CSS.escape(itemName);
    const button = document.querySelector(`.buy-btn[data-item="${safeItem}"]`);
    if (!button) return;

    button.textContent = "Acquire";
    button.disabled = false;
    button.classList.remove("purchased-btn");
    button.removeAttribute("aria-disabled");
  }

  function syncPurchasedButtons() {
    els.buyButtons.forEach((btn) => resetListingButton(btn.dataset.item || ""));
    state.purchasedItems.forEach((itemName) => {
      markListingPurchased(itemName);
    });
  }

  function rememberTransaction(label, amountText) {
    state.customTransactions.unshift({ label, amountText });
    if (state.customTransactions.length > 8) {
      state.customTransactions = state.customTransactions.slice(0, 8);
    }
  }

  function clearCustomOrdersFromDOM() {
    const rows = els.ordersList?.querySelectorAll(".order-row");
    if (!rows) return;
    rows.forEach((row, index) => {
      if (index >= 3) row.remove();
    });
  }

  function clearCustomTransactionsFromDOM() {
    const items = els.txList?.querySelectorAll(".tx-item");
    if (!items) return;
    items.forEach((item, index) => {
      if (index >= 4) item.remove();
    });
  }

  function clearPurchaseHistory() {
    state.purchasedItems.clear();
    state.customOrders = [];
    state.customTransactions = [];

    clearCustomOrdersFromDOM();
    clearCustomTransactionsFromDOM();
    syncPurchasedButtons();
    updateOrderCount();
    updateBadgeUI();
    saveState();
    showToast("Purchase history cleared.");
    addActivityLine("Owner purge executed on custom purchase history.");
  }

  function fullDemoReset() {
    state.balance = DEFAULT_BALANCE;
    state.saleMode = false;
    state.purchasedItems.clear();
    state.customOrders = [];
    state.customTransactions = [];
    state.tradeBalances = {
      btc: 0,
      eth: 0,
      sol: 0,
      usdt: 0,
    };

    clearCustomOrdersFromDOM();
    clearCustomTransactionsFromDOM();
    updateBalanceUI();
    updateOrderCount();
    updateBadgeUI();
    updateSaleModeUI();
    syncPurchasedButtons();
    saveState();
    showToast("Full demo reset completed.");
    addActivityLine("Market restored to default owner presentation state.");
  }

  async function handleFundsAction() {
    const account = els.fundsAccountSelect?.value || "Unknown Account";

    if (state.fundsMode === "deposit") {
      const amount = Number(els.fundsAmountInput?.value || 0);
      if (amount <= 0) {
        showToast("Enter a valid deposit amount.");
        return;
      }

      await runFundsProgress("Routing deposit through harbor relay...");
      state.balance += amount;
      updateBalanceUI();
      prependTransaction(`Deposit from ${account}`, `+${formatMoney(amount)}`);
      rememberTransaction(`Deposit from ${account}`, `+${formatMoney(amount)}`);
      addActivityLine(`Deposit completed from ${account}.`);
      showToast(`Deposit complete: ${formatMoney(amount)}`);
      saveState();
      closeFundsModal();
      return;
    }

    if (state.fundsMode === "withdraw") {
      const amount = Number(els.fundsAmountSlider?.value || 0);
      if (amount <= 0) {
        showToast("Choose a valid withdrawal amount.");
        return;
      }
      if (amount > state.balance) {
        showToast("Insufficient reserve for withdrawal.");
        return;
      }

      await runFundsProgress("Transferring funds to connected account...");
      state.balance -= amount;
      updateBalanceUI();
      prependTransaction(`Withdraw to ${account}`, `-${formatMoney(amount)}`);
      rememberTransaction(`Withdraw to ${account}`, `-${formatMoney(amount)}`);
      addActivityLine(`Withdrawal completed to ${account}.`);
      showToast(`Transfer complete: ${formatMoney(amount)}`);
      saveState();
      closeFundsModal();
      return;
    }

    if (state.fundsMode === "trade") {
      const amount = Number(els.fundsAmountSlider?.value || 0);
      const asset = els.tradeAssetSelect?.value || "btc";
      const assetLabel = asset.toUpperCase();

      if (amount <= 0) {
        showToast("Choose a valid trade amount.");
        return;
      }
      if (amount > state.balance) {
        showToast("Insufficient reserve for trade.");
        return;
      }

      await runFundsProgress("Converting reserve into Aster Wallet asset...");
      state.balance -= amount;
      state.tradeBalances[asset] = (state.tradeBalances[asset] || 0) + amount;

      updateBalanceUI();
      prependTransaction(`Trade into ${assetLabel}`, `-${formatMoney(amount)}`);
      rememberTransaction(`Trade into ${assetLabel}`, `-${formatMoney(amount)}`);
      addActivityLine(`Trade completed into ${assetLabel} under Aster Wallet.`);
      showToast(`Traded ${formatMoney(amount)} into ${assetLabel}`);
      saveState();
      closeFundsModal();
    }
  }

  els.menuToggle?.addEventListener("click", openSidebarMenu);
  els.closeSidebar?.addEventListener("click", closeSidebarMenu);
  els.sidebarBackdrop?.addEventListener("click", closeSidebarMenu);

  els.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.panel;
      if (target) setActivePanel(target);
    });
  });

  els.panelJumpButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.panelTarget;
      if (target) setActivePanel(target);
    });
  });

  els.categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeCategory = btn.dataset.category || "all";
      filterListings();
    });
  });

  els.search?.addEventListener("input", filterListings);

  els.buyButtons.forEach((btn) => {
    btn.dataset.originalPrice = btn.dataset.price;

    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const card = btn.closest(".listing-card");
      const vendorText = card?.querySelector(".listing-meta span")?.textContent || "Vendor: Unknown";
      const vendorName = vendorText.replace("Vendor:", "").trim();

      openModal(
        btn.dataset.item || "Unknown Listing",
        btn.dataset.price || 0,
        vendorName
      );
    });
  });

  els.closeModal?.addEventListener("click", closePurchaseModal);
  els.modal?.addEventListener("click", (event) => {
    if (event.target === els.modal) closePurchaseModal();
  });

  els.confirmPurchase?.addEventListener("click", () => {
    if (!state.selectedItem) return;
    if (state.purchasedItems.has(state.selectedItem)) {
      closePurchaseModal();
      showToast(`${state.selectedItem} already purchased.`);
      return;
    }

    state.balance -= state.selectedPrice;
    if (state.balance < 0) state.balance = 0;

    const amountText = `-${formatMoney(state.selectedPrice)}`;

    state.purchasedItems.add(state.selectedItem);
    markListingPurchased(state.selectedItem);

    updateBalanceUI();
    prependTransaction(state.selectedItem, amountText);
    rememberTransaction(state.selectedItem, amountText);
    addOrder(state.selectedItem, state.selectedPrice, state.selectedVendor);
    addActivityLine(`Transaction sealed for ${state.selectedItem}.`);
    showToast(`Purchased: ${state.selectedItem}`);

    saveState();
    closePurchaseModal();
  });

  els.walletActions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action || "action";
      openFundsModal(action);
    });
  });

  els.closeFundsModal?.addEventListener("click", closeFundsModal);
  els.fundsModal?.addEventListener("click", (event) => {
    if (event.target === els.fundsModal) closeFundsModal();
  });

  els.fundsAmountSlider?.addEventListener("input", syncSliderReadout);
  els.fundsActionBtn?.addEventListener("click", handleFundsAction);

  els.saveBadgeCountBtn?.addEventListener("click", () => {
    updateBadgeUI();
    showToast("Orders badge now mirrors live order rows.");
    addActivityLine("Orders badge synchronized to recorded cargo.");
  });

  els.toggleSaleModeBtn?.addEventListener("click", () => {
    state.saleMode = !state.saleMode;
    updateSaleModeUI();
    saveState();
    showToast(state.saleMode ? "Sale mode enabled." : "Sale mode disabled.");
    addActivityLine(state.saleMode ? "Owner enabled sale pricing." : "Owner disabled sale pricing.");
  });

  els.clearPurchaseHistoryBtn?.addEventListener("click", clearPurchaseHistory);
  els.fullDemoResetBtn?.addEventListener("click", fullDemoReset);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePurchaseModal();
      closeFundsModal();
      closeSidebarMenu();
    }
  });

  setInterval(() => {
    const events = [
      "New vendor trust seal issued.",
      "Harbor queue traffic increased.",
      "Stormport access lane refreshed.",
      "Ledger archive synchronized.",
      "Escrow manifests reconciled.",
      "Private dock inventory updated.",
      "Ghost relay traffic confirmed.",
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    addActivityLine(randomEvent);
  }, 6500);

  loadState();
  updateBalanceUI();
  renderSavedOrders();
  renderSavedTransactions();
  updateSaleModeUI();
  syncPurchasedButtons();
  updateOrderCount();
  updateBadgeUI();
  syncSliderReadout();
  filterListings();
  setActivePanel("homePanel");
})();
