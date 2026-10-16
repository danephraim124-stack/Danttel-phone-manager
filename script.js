
/* =========================================
   DANTTEL PHONE MANAGER — VERSION 2.0
   Device diagnostics for modern browsers
========================================= */

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setWidth(id, percent) {
  const el = $(id);
  if (el) {
    const value = Math.max(0, Math.min(100, Number(percent) || 0));
    el.style.width = value + "%";
  }
}

function setRingLevel(percent) {
  const ring = $("batteryRing");
  if (!ring) return;

  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  let color = "#43d9a3";

  if (value <= 20) color = "#ff7185";
  else if (value <= 45) color = "#ffb45e";

  ring.style.background =
    `conic-gradient(${color} ${value * 3.6}deg, #263347 ${value * 3.6}deg)`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1024) return bytes + " B";

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return value.toFixed(1) + " " + units[index];
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "Unavailable";
  }

  if (seconds === Infinity) return "Unavailable";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours >= 24) {
    return Math.floor(hours / 24) + "d " + (hours % 24) + "h";
  }

  return hours + "h " + minutes + "m";
}

/* =========================================
   1. DEVICE INFORMATION
========================================= */

function getDeviceInfo() {
  const ua = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform ||
    navigator.platform || "Unknown platform";

  let browser = "Unknown browser";

  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/CriOS/i.test(ua)) browser = "Chrome on iOS";
  else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
  else if (/Safari\//i.test(ua)) browser = "Apple Safari";

  let deviceName = "Unknown device";

  if (/Samsung/i.test(ua)) {
    deviceName = "Samsung device";
  } else if (/Android/i.test(ua)) {
    deviceName = "Android device";
  } else if (/iPhone/i.test(ua)) {
    deviceName = "iPhone";
  } else if (/iPad/i.test(ua)) {
    deviceName = "iPad";
  } else if (/Windows/i.test(ua)) {
    deviceName = "Windows device";
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    deviceName = "Mac device";
  } else if (/Linux/i.test(ua)) {
    deviceName = "Linux device";
  }

  setText("deviceName", deviceName);
  setText("deviceDetails", deviceName);
  setText("platform", platform);
  setText("devicePlatform", platform);
  setText("browserInfo", browser);
  setText("deviceLanguage", navigator.language || "Unavailable");
  setText(
    "deviceOnline",
    navigator.onLine ? "Online" : "Offline"
  );

  const screenWidth = window.screen?.width;
  const screenHeight = window.screen?.height;

  setText(
    "screenInfo",
    screenWidth && screenHeight
      ? `${screenWidth} × ${screenHeight}`
      : "Unavailable"
  );

  setText(
    "viewportInfo",
    `${window.innerWidth} × ${window.innerHeight}`
  );

  setText(
    "pixelRatio",
    window.devicePixelRatio
      ? window.devicePixelRatio + "×"
      : "Unavailable"
  );

  const cores = navigator.hardwareConcurrency;

  setText(
    "deviceCPU",
    cores ? cores + " logical cores" : "Unavailable"
  );

  setText(
    "deviceMemoryDetails",
    navigator.deviceMemory
      ? navigator.deviceMemory + " GB (approximate)"
      : "Unavailable"
  );

  setText(
    "deviceStatus",
    navigator.onLine ? "Device connected" : "Offline"
  );

  setText(
    "deviceOnline",
    navigator.onLine ? "Online" : "Offline"
  );
}

window.addEventListener("resize", () => {
  setText("viewportInfo", `${window.innerWidth} × ${window.innerHeight}`);
});

/* =========================================
   2. BATTERY MONITOR
========================================= */

let batteryManager = null;
let batterySupported = false;

function updateBattery() {
  if (!batteryManager) {
    setText("batteryPercent", "--%");
    setText("batteryStatus", "Not supported");
    setText("batteryNote", "This browser does not expose battery readings.");
    setText("statsBattery", "N/A");
    setText("temperatureInfo", "Not measured");
    setText("chargingTime", "Charging time: unavailable");
    setText("dischargingTime", "Remaining time: unavailable");
    setWidth("batteryBar", 0);
    setRingLevel(0);
    return;
  }

  const level = Math.round(batteryManager.level * 100);
  const charging = batteryManager.charging;

  setText("batteryPercent", level + "%");
  setText(
    "batteryStatus",
    charging ? "Charging" : "On battery"
  );
  setText(
    "batteryNote",
    "Reading supplied by your browser; accuracy depends on device support."
  );
  setText("statsBattery", level + "%");

  setText(
    "chargingTime",
    charging
      ? "Time to full: " + formatDuration(batteryManager.chargingTime)
      : "Charging time: not charging"
  );

  setText(
    "dischargingTime",
    !charging
      ? "Estimated remaining: " + formatDuration(batteryManager.dischargingTime)
      : "Remaining time: while charging"
  );

  setWidth("batteryBar", level);
  setRingLevel(level);
}

async function initBattery() {
  if (!navigator.getBattery) {
    updateBattery();
    return;
  }

  try {
    batteryManager = await navigator.getBattery();
    batterySupported = true;

    updateBattery();

    batteryManager.addEventListener("levelchange", updateBattery);
    batteryManager.addEventListener("chargingchange", updateBattery);
    batteryManager.addEventListener("chargingtimechange", updateBattery);
    batteryManager.addEventListener("dischargingtimechange", updateBattery);
  } catch (error) {
    batteryManager = null;
    updateBattery();
  }
}

/* =========================================
   3. NETWORK DIAGNOSTICS
========================================= */

function updateNetwork() {
  const online = navigator.onLine;
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  setText("networkInfo", online ? "Online" : "Offline");
  setText("networkStatus", online ? "Internet connection available" : "You are offline");
  setText("statsNetwork", online ? "Online" : "Offline");
  setText("deviceOnline", online ? "Online" : "Offline");
  setText("healthNetwork", online ? "Browser reports online" : "Offline");

  const dot = $("networkDot");
  if (dot) {
    dot.style.background = online ? "#43d9a3" : "#ff7185";
    dot.style.boxShadow = online
      ? "0 0 10px #43d9a377"
      : "0 0 10px #ff718577";
  }

  if (connection) {
    setText(
      "connectionType",
      connection.type || "Not exposed"
    );

    setText(
      "effectiveType",
      connection.effectiveType || "Not exposed"
    );

    setText(
      "downlinkInfo",
      Number.isFinite(connection.downlink)
        ? connection.downlink + " Mbps (estimate)"
        : "Not exposed"
    );

    setText(
      "statsDownlink",
      Number.isFinite(connection.downlink)
        ? connection.downlink + " Mbps"
        : "Unavailable"
    );

    setText(
      "networkRtt",
      Number.isFinite(connection.rtt)
        ? connection.rtt + " ms (estimate)"
        : "Unavailable"
    );
  } else {
    setText("connectionType", "Not exposed");
    setText("effectiveType", "Not exposed");
    setText("downlinkInfo", "Not exposed");
    setText("statsDownlink", "Unavailable");
    setText("networkRtt", "Unavailable");
  }

  setText(
    "healthSummary",
    online
      ? "Your browser reports an active network connection. This does not guarantee that every website is reachable."
      : "Your browser reports that the device is offline. Check Wi-Fi or mobile data."
  );
}

window.addEventListener("online", updateNetwork);
window.addEventListener("offline", updateNetwork);

const networkConnection =
  navigator.connection ||
  navigator.mozConnection ||
  navigator.webkitConnection;

if (networkConnection?.addEventListener) {
  networkConnection.addEventListener("change", updateNetwork);
}

/* =========================================
   4. OPTIONAL INTERNET SPEED TEST
   Downloads a small test file from a public endpoint.
   Results depend on network, server and browser.
========================================= */

let speedTestRunning = false;

async function runSpeedTest() {
  const button = $("speedTestButton");
  const result = $("speedTestResult");

  if (speedTestRunning) return;

  if (!navigator.onLine) {
    if (result) {
      result.classList.remove("hidden");
      result.textContent = "You appear to be offline. Connect first and try again.";
    }
    return;
  }

  speedTestRunning = true;

  if (button) {
    button.disabled = true;
    button.textContent = "Testing connection...";
  }

  if (result) {
    result.classList.remove("hidden");
    result.textContent = "Measuring download speed. Please wait...";
  }

  try {
    const url =
      "https://speed.cloudflare.com/__down?bytes=1000000&_=" +
      Date.now();

    const start = performance.now();

    const response = await fetch(url, {
      cache: "no-store",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error("Test server did not return a successful response.");
    }

    const data = await response.arrayBuffer();
    const elapsedSeconds = (performance.now() - start) / 1000;

    if (elapsedSeconds <= 0 || data.byteLength === 0) {
      throw new Error("No test data was received.");
    }

    const mbps = (data.byteLength * 8) / elapsedSeconds / 1000000;

    if (result) {
      result.textContent =
        "Estimated download speed: " + mbps.toFixed(2) +
        " Mbps. Test download: " + formatBytes(data.byteLength) +
        ". Results may vary by server and network conditions.";
    }
  } catch (error) {
    if (result) {
      result.textContent =
        "Speed test could not complete. The server, browser, or network may block the request. You can still check your connection status above.";
    }
  } finally {
    speedTestRunning = false;

    if (button) {
      button.disabled = false;
      button.textContent = "Run internet speed test";
    }
  }
}

$("speedTestButton")?.addEventListener("click", runSpeedTest);

/* =========================================
   5. BROWSER STORAGE ANALYZER
========================================= */

async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    setText("storageInfo", "Unavailable");
    setText("storagePercent", "--%");
    setText("storageDescription", "Storage estimate not supported");
    setText("storageUsed", "Unavailable");
    setText("storageQuota", "Unavailable");
    setText("storageFree", "Unavailable");
    setText("healthStorage", "Not supported");
    setWidth("storageBar", 0);
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage;
    const quota = estimate.quota;

    if (!Number.isFinite(usage) || !Number.isFinite(quota) || quota <= 0) {
      throw new Error("Storage estimate unavailable");
    }

    const usedPercent = Math.min(100, (usage / quota) * 100);
    const free = Math.max(0, quota - usage);

    setText("storageInfo", formatBytes(usage));
    setText("storagePercent", usedPercent.toFixed(1) + "%");
    setText(
      "storageDescription",
      formatBytes(usage) + " used of " + formatBytes(quota) + " site quota"
    );

    setText("storageUsed", formatBytes(usage));
    setText("storageQuota", formatBytes(quota));
    setText("storageFree", formatBytes(free));

    setWidth("storageBar", usedPercent);
    setText(
      "healthStorage",
      "Site quota estimate"
    );
  } catch (error) {
    setText("storageInfo", "Unavailable");
    setText("storagePercent", "--%");
    setText("storageDescription", "Could not read storage estimate");
    setText("storageUsed", "Unavailable");
    setText("storageQuota", "Unavailable");
    setText("storageFree", "Unavailable");
    setText("healthStorage", "Unavailable");
  }
}

/* =========================================
   6. PROCESSOR / PERFORMANCE INFORMATION
========================================= */

function getPerformanceInfo() {
  const cores = navigator.hardwareConcurrency;
  const memory = navigator.deviceMemory;

  setText(
    "performanceInfo",
    cores ? cores + " cores" : "Unavailable"
  );

  setText(
    "cpuCores",
    cores ? cores + " logical cores" : "Unavailable"
  );

  setText(
    "deviceCPU",
    cores ? cores + " logical cores" : "Unavailable"
  );

  setText(
    "deviceMemory",
    memory ? memory + " GB approx." : "Unavailable"
  );

  setText(
    "deviceMemoryDetails",
    memory ? memory + " GB (approximate)" : "Unavailable"
  );

  setText(
    "statsCPU",
    cores ? String(cores) : "N/A"
  );

  setText(
    "performanceInfo",
    cores ? cores + " cores" : "Unavailable"
  );
}

/* =========================================
   7. DIAGNOSTIC REFRESH
========================================= */

async function refreshDiagnostics() {
  getDeviceInfo();
  updateNetwork();
  getPerformanceInfo();

  await Promise.all([
    getStorageInfo(),
    batteryManager ? Promise.resolve(updateBattery()) : initBattery()
  ]);

  setText(
    "temperatureInfo",
    "Not exposed by browser"
  );
}

$("refreshButton")?.addEventListener("click", refreshDiagnostics);
$("settingsRefreshButton")?.addEventListener("click", refreshDiagnostics);

/* =========================================
   8. EXPORT DEVICE REPORT
========================================= */

function exportDeviceReport() {
  const report = {
    application: "Danttel Phone Manager",
    version: "2.0",
    generatedAt: new Date().toISOString(),
    device: {
      name: $("deviceName")?.textContent || "Unavailable",
      platform: $("devicePlatform")?.textContent || "Unavailable",
      browser: $("browserInfo")?.textContent || "Unavailable",
      screen: $("screenInfo")?.textContent || "Unavailable",
      viewport: $("viewportInfo")?.textContent || "Unavailable",
      pixelRatio: $("pixelRatio")?.textContent || "Unavailable",
      cpuCores: $("cpuCores")?.textContent || "Unavailable",
      memoryEstimate: $("deviceMemoryDetails")?.textContent || "Unavailable"
    },
    battery: {
      level: $("batteryPercent")?.textContent || "Unavailable",
      status: $("batteryStatus")?.textContent || "Unavailable",
      supported: batterySupported
    },
    network: {
      status: $("networkStatus")?.textContent || "Unavailable",
      type: $("connectionType")?.textContent || "Unavailable",
      effectiveType: $("effectiveType")?.textContent || "Unavailable",
      estimatedDownlink: $("downlinkInfo")?.textContent || "Unavailable"
    },
    browserStorage: {
      used: $("storageUsed")?.textContent || "Unavailable",
      quota: $("storageQuota")?.textContent || "Unavailable",
      note: "Browser origin storage only, not total phone storage."
    },
    limitations: [
      "Browser-reported data may be approximate.",
      "This report does not include full phone storage or private files.",
      "Battery health and battery temperature are not available through standard webpage APIs."
    ]
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "danttel-device-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setText("exportStatus", "Report export requested. Check your Downloads folder.");
}

$("exportReportButton")?.addEventListener("click", exportDeviceReport);
$("settingsExportButton")?.addEventListener("click", exportDeviceReport);

/* =========================================
   9. SETTINGS: AUTOMATIC REFRESH
========================================= */

let refreshTimer = null;

function configureAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  const toggle = $("autoRefreshToggle");
  const intervalSelect = $("refreshInterval");

  if (!toggle || !toggle.checked) return;

  const seconds = Number(intervalSelect?.value) || 30;

  refreshTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshDiagnostics();
    }
  }, seconds * 1000);
}

$("autoRefreshToggle")?.addEventListener("change", configureAutoRefresh);
$("refreshInterval")?.addEventListener("change", configureAutoRefresh);

/* =========================================
   10. PAGE NAVIGATION — KEEP FOUR PAGES
========================================= */

const navButtons = document.querySelectorAll(".bottom-nav .nav-item");

const pages = {
  0: $("homePage"),
  1: $("statsPage"),
  2: $("devicePage"),
  3: $("settingsPage")
};

function showPage(index) {
  Object.entries(pages).forEach(([key, page]) => {
    if (!page) return;

    const active = Number(key) === index;
    page.classList.toggle("hidden", !active);
    page.classList.toggle("active-page", active);
    page.style.display = active ? "block" : "none";
  });

  navButtons.forEach((button) => {
    const active = Number(button.dataset.page) === index;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.page);

    if (Number.isInteger(index) && pages[index]) {
      showPage(index);
    }
  });
});

$("settingsButton")?.addEventListener("click", () => showPage(3));

/* =========================================
   11. START APPLICATION
========================================= */

async function startApp() {
  getDeviceInfo();
  updateNetwork();
  getPerformanceInfo();

  setText("temperatureInfo", "Not exposed by browser");

  await Promise.all([
    initBattery(),
    getStorageInfo()
  ]);

  setText("statsScreen", $("screenInfo")?.textContent || "Unavailable");

  showPage(0);
  configureAutoRefresh();
}

startApp();
