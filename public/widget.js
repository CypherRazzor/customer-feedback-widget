/**
 * Feedback Widget — embeddable standalone script
 *
 * Usage (API key — recommended for multi-tenant/SaaS):
 *   <script
 *     src="https://your-app.com/widget.js"
 *     data-api-key="wfk_..."
 *     data-api="https://your-app.com"
 *   ></script>
 *
 * Usage (legacy pre-minted token):
 *   <script
 *     src="https://your-app.com/widget.js"
 *     data-token="YOUR_PREVIEW_TOKEN"
 *     data-api="https://your-app.com"
 *   ></script>
 *
 * Optional attributes:
 *   data-api      Base URL of the feedback API (defaults to same origin as the script)
 *   data-session  Session ID override (auto-generated if absent)
 */
(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.querySelectorAll(
        "script[data-token],script[data-api-key]"
      );
      return scripts[scripts.length - 1];
    })();

  var TOKEN = (currentScript && currentScript.dataset.token) || "";
  var API_KEY = (currentScript && currentScript.dataset.apiKey) || "";
  var API_BASE = ((currentScript && currentScript.dataset.api) || "").replace(
    /\/$/,
    ""
  );
  var SESSION_ID =
    (currentScript && currentScript.dataset.session) ||
    "s-" + Math.random().toString(36).slice(2);

  if (!TOKEN && !API_KEY) {
    console.warn("[FeedbackWidget] Missing data-token or data-api-key attribute.");
    return;
  }

  // ── Token exchange (API key → preview token) ─────────────────────────────────
  function fetchToken() {
    return fetch(API_BASE + "/api/widget/token", {
      method: "POST",
      headers: { "x-api-key": API_KEY },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Token exchange failed: " + res.status);
        return res.json();
      })
      .then(function (data) {
        TOKEN = data.token;
        SESSION_ID = data.session_id || SESSION_ID;
      });
  }

  // ── State ───────────────────────────────────────────────────────────────────
  var mode = "idle"; // 'idle' | 'picking' | 'annotating'
  var feedbackCount = 0;
  var selectedSelector = "";
  var pendingScreenshot = null;
  var highlightEl = null;
  var toolbarEl = null;
  var formEl = null;
  var overlayEl = null;

  // ── CSS ─────────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("_fb-widget-styles")) return;
    var style = document.createElement("style");
    style.id = "_fb-widget-styles";
    style.textContent = [
      "._fb-highlight{position:absolute!important;pointer-events:none!important;z-index:2147483640!important;border:2px solid #3b82f6!important;background:rgba(59,130,246,.1)!important;border-radius:3px!important;transition:top .07s,left .07s,width .07s,height .07s!important;box-sizing:border-box!important}",
      "._fb-toolbar{position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483645!important;display:flex!important;flex-direction:column!important;align-items:flex-end!important;gap:8px!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important}",
      "._fb-btn{display:inline-flex!important;align-items:center!important;gap:8px!important;padding:10px 18px!important;border-radius:9999px!important;border:none!important;cursor:pointer!important;font-size:14px!important;font-weight:500!important;font-family:inherit!important;box-shadow:0 4px 12px rgba(0,0,0,.15)!important;transition:background .2s!important;line-height:1.5!important;text-decoration:none!important}",
      "._fb-btn-primary{background:#2563eb!important;color:#fff!important}",
      "._fb-btn-primary:hover{background:#1d4ed8!important}",
      "._fb-btn-active{background:#1d4ed8!important;color:#fff!important;outline:2px solid #93c5fd!important;outline-offset:1px!important}",
      "._fb-btn-success{background:#16a34a!important;color:#fff!important}",
      "._fb-btn-success:hover{background:#15803d!important}",
      "._fb-overlay{position:fixed!important;inset:0!important;background:rgba(0,0,0,.35)!important;z-index:2147483646!important}",
      "._fb-dialog{position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:2147483647!important;background:#fff!important;border-radius:12px!important;box-shadow:0 20px 60px rgba(0,0,0,.25)!important;padding:24px!important;width:min(90vw,400px)!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;box-sizing:border-box!important}",
      "._fb-dialog h3{margin:0 0 4px!important;font-size:16px!important;font-weight:600!important;color:#111827!important}",
      "._fb-dialog ._fb-sel{font-family:monospace!important;font-size:11px!important;color:#9ca3af!important;margin:0 0 14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}",
      "._fb-dialog textarea{width:100%!important;border:1px solid #d1d5db!important;border-radius:8px!important;padding:10px 12px!important;font-size:13px!important;font-family:inherit!important;resize:none!important;outline:none!important;box-sizing:border-box!important;line-height:1.5!important;color:#111827!important}",
      "._fb-dialog textarea:focus{border-color:#3b82f6!important;box-shadow:0 0 0 2px rgba(59,130,246,.2)!important}",
      "._fb-dialog ._fb-actions{display:flex!important;justify-content:flex-end!important;gap:10px!important;margin-top:14px!important}",
      "._fb-dialog ._fb-cancel{background:none!important;border:none!important;color:#6b7280!important;font-size:13px!important;cursor:pointer!important;padding:8px 12px!important;font-family:inherit!important}",
      "._fb-dialog ._fb-cancel:hover{color:#374151!important}",
      "._fb-dialog ._fb-submit{background:#2563eb!important;color:#fff!important;border:none!important;border-radius:8px!important;padding:8px 16px!important;font-size:13px!important;font-weight:500!important;cursor:pointer!important;font-family:inherit!important}",
      "._fb-dialog ._fb-submit:hover{background:#1d4ed8!important}",
      "._fb-dialog ._fb-submit:disabled{opacity:.5!important;cursor:not-allowed!important}",
      "._fb-dialog ._fb-err{color:#dc2626!important;font-size:12px!important;margin-top:8px!important}",
      "._fb-done{position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483645!important;background:#16a34a!important;color:#fff!important;border-radius:12px!important;padding:16px 20px!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;box-shadow:0 4px 12px rgba(0,0,0,.2)!important;max-width:280px!important}",
      "._fb-done p{margin:0!important;font-size:14px!important;font-weight:600!important}",
      "._fb-done span{font-size:12px!important;opacity:.85!important;margin-top:4px!important;display:block!important}",
    ].join("");
    document.head.appendChild(style);
  }

  // ── Selector helper ──────────────────────────────────────────────────────────
  function getSelector(el) {
    if (el.id) return "#" + el.id;
    var parts = [];
    var current = el;
    while (current && current !== document.body) {
      if (current.id) {
        parts.unshift(current.tagName.toLowerCase() + "#" + current.id);
        break;
      }
      var tag = current.tagName.toLowerCase();
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(
          parent.children,
          function (s) {
            return s.tagName === current.tagName;
          }
        );
        if (siblings.length > 1) {
          tag += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
        }
      }
      parts.unshift(tag);
      current = current.parentElement;
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  }

  function escHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  function createToolbar() {
    toolbarEl = document.createElement("div");
    toolbarEl.className = "_fb-toolbar";
    toolbarEl.setAttribute("data-feedback-ui", "");
    renderToolbar();
    document.body.appendChild(toolbarEl);
  }

  function renderToolbar() {
    toolbarEl.innerHTML = "";

    if (feedbackCount > 0 && mode === "idle") {
      var confirmBtn = document.createElement("button");
      confirmBtn.className = "_fb-btn _fb-btn-success";
      confirmBtn.textContent =
        "Feedback abschlie\u00dfen (" + feedbackCount + ")";
      confirmBtn.addEventListener("click", confirmSession);
      toolbarEl.appendChild(confirmBtn);
    }

    var mainBtn = document.createElement("button");
    mainBtn.className =
      "_fb-btn " + (mode === "picking" ? "_fb-btn-active" : "_fb-btn-primary");
    if (mode === "picking") {
      mainBtn.innerHTML = "Abbrechen <span style=\"font-size:16px\">&#x2715;</span>";
    } else {
      mainBtn.innerHTML = "Feedback geben <span style=\"font-size:16px\">\uD83D\uDCAC</span>";
    }
    mainBtn.addEventListener("click", togglePicking);
    toolbarEl.appendChild(mainBtn);
  }

  // ── Picking ──────────────────────────────────────────────────────────────────
  function togglePicking() {
    if (mode === "picking") {
      stopPicking();
    } else {
      startPicking();
    }
  }

  function startPicking() {
    mode = "picking";
    renderToolbar();
    document.body.style.cursor = "crosshair";

    highlightEl = document.createElement("div");
    highlightEl.className = "_fb-highlight";
    highlightEl.setAttribute("data-feedback-ui", "");
    document.body.appendChild(highlightEl);

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("click", onPickClick, true);
  }

  function stopPicking() {
    mode = "idle";
    renderToolbar();
    document.body.style.cursor = "";
    if (highlightEl) {
      highlightEl.remove();
      highlightEl = null;
    }
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("click", onPickClick, true);
  }

  function onMouseOver(e) {
    var target = e.target;
    if (
      !target ||
      target.closest("[data-feedback-ui]") ||
      target === highlightEl
    )
      return;
    var rect = target.getBoundingClientRect();
    highlightEl.style.top = rect.top + window.scrollY + "px";
    highlightEl.style.left = rect.left + window.scrollX + "px";
    highlightEl.style.width = rect.width + "px";
    highlightEl.style.height = rect.height + "px";
  }

  function onPickClick(e) {
    var target = e.target;
    if (!target || target.closest("[data-feedback-ui]")) return;
    e.preventDefault();
    e.stopPropagation();
    selectedSelector = getSelector(target);
    stopPicking();
    captureAndAnnotate();
  }

  // ── Screenshot + Annotate ────────────────────────────────────────────────────
  function captureAndAnnotate() {
    pendingScreenshot = null;
    loadHtml2Canvas()
      .then(function (h2c) {
        return h2c(document.body, {
          useCORS: true,
          allowTaint: false,
          scale: 0.5,
        });
      })
      .then(function (canvas) {
        pendingScreenshot = canvas.toDataURL("image/png");
      })
      .catch(function (err) {
        console.warn("[FeedbackWidget] Screenshot failed:", err);
      })
      .finally(function () {
        showForm();
      });
  }

  function loadHtml2Canvas() {
    // If already available (e.g. bundled on host page) use it
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    return new Promise(function (resolve, reject) {
      var cdnUrl =
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      if (document.querySelector('script[src="' + cdnUrl + '"]')) {
        // Already injecting — poll for availability
        var tries = 0;
        var poll = setInterval(function () {
          if (window.html2canvas) {
            clearInterval(poll);
            resolve(window.html2canvas);
          } else if (++tries > 50) {
            clearInterval(poll);
            reject(new Error("html2canvas load timeout"));
          }
        }, 100);
        return;
      }
      var s = document.createElement("script");
      s.src = cdnUrl;
      s.onload = function () {
        resolve(window.html2canvas);
      };
      s.onerror = function () {
        reject(new Error("html2canvas load failed"));
      };
      document.head.appendChild(s);
    });
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  function showForm() {
    mode = "annotating";

    overlayEl = document.createElement("div");
    overlayEl.className = "_fb-overlay";
    overlayEl.setAttribute("data-feedback-ui", "");
    overlayEl.addEventListener("click", closeForm);
    document.body.appendChild(overlayEl);

    formEl = document.createElement("div");
    formEl.className = "_fb-dialog";
    formEl.setAttribute("data-feedback-ui", "");
    formEl.innerHTML =
      "<h3>Feedback hinzuf\u00fcgen</h3>" +
      "<p class=\"_fb-sel\">" +
      escHtml(selectedSelector) +
      "</p>" +
      "<textarea rows=\"4\" placeholder=\"Was soll ge\u00e4ndert werden?\"></textarea>" +
      "<p class=\"_fb-err\" style=\"display:none\"></p>" +
      "<div class=\"_fb-actions\">" +
      "<button class=\"_fb-cancel\">Abbrechen</button>" +
      "<button class=\"_fb-submit\">Feedback senden</button>" +
      "</div>";

    var textarea = formEl.querySelector("textarea");
    var errEl = formEl.querySelector("._fb-err");
    var cancelBtn = formEl.querySelector("._fb-cancel");
    var submitBtn = formEl.querySelector("._fb-submit");

    cancelBtn.addEventListener("click", closeForm);

    submitBtn.addEventListener("click", function () {
      var comment = textarea.value.trim();
      if (!comment) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet\u2026";
      errEl.style.display = "none";

      fetch(API_BASE + "/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-preview-token": TOKEN,
        },
        body: JSON.stringify({
          page_url: window.location.href,
          css_selector: selectedSelector,
          comment: comment,
          screenshot_base64: pendingScreenshot,
          session_id: SESSION_ID,
        }),
      })
        .then(function (res) {
          if (!res.ok) {
            return res
              .json()
              .catch(function () {
                return {};
              })
              .then(function (body) {
                throw new Error(body.error || "Fehler beim Senden");
              });
          }
          feedbackCount++;
          closeForm();
          renderToolbar();
        })
        .catch(function (err) {
          errEl.textContent = err.message || "Unbekannter Fehler";
          errEl.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Feedback senden";
        });
    });

    // Prevent overlay click from closing when clicking inside the dialog
    formEl.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    document.body.appendChild(formEl);
    setTimeout(function () {
      textarea && textarea.focus();
    }, 50);
  }

  function closeForm() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
    if (formEl) {
      formEl.remove();
      formEl = null;
    }
    pendingScreenshot = null;
    mode = "idle";
    renderToolbar();
  }

  // ── Confirm session ──────────────────────────────────────────────────────────
  function confirmSession() {
    fetch(API_BASE + "/api/feedback/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-preview-token": TOKEN,
      },
      body: JSON.stringify({ session_id: SESSION_ID }),
    }).catch(function () {});

    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
    }
    var doneEl = document.createElement("div");
    doneEl.className = "_fb-done";
    doneEl.setAttribute("data-feedback-ui", "");
    doneEl.innerHTML =
      "<p>Feedback abgeschlossen \u2713</p>" +
      "<span>Vielen Dank! Wir melden uns bei dir.</span>";
    document.body.appendChild(doneEl);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById("_fb-widget-styles")) return;
    injectStyles();
    createToolbar();
  }

  function start() {
    if (API_KEY && !TOKEN) {
      fetchToken()
        .then(init)
        .catch(function (err) {
          console.warn("[FeedbackWidget] API key token exchange failed:", err);
        });
    } else {
      init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Public API (optional programmatic control)
  window.FeedbackWidget = { init: start };
})();
