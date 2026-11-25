/* ==========================================================================
   Grace Harbor Church — Office Admin Dashboard (GET, PATCH, DELETE)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const dbPill = document.getElementById("db-status-pill");
  const refreshBtn = document.getElementById("refresh-all-btn");
  const visitsList = document.getElementById("visits-list");
  const messagesList = document.getElementById("messages-list");
  const rsvpsList = document.getElementById("rsvps-list");
  const statVisits = document.getElementById("stat-visits");
  const statMessages = document.getElementById("stat-messages");
  const statRsvps = document.getElementById("stat-rsvps");
  const toastEl = document.getElementById("toast");

  let currentVisitFilter = "all";
  let currentMsgFilter = "all";
  let toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 3500);
  }

  const API_BASE =
    window.location.protocol === "file:" || (window.location.port && window.location.port !== "5000")
      ? "http://localhost:5000"
      : "";

  async function apiRequest(url, options = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "API request failed");
    return data;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  async function loadHealth() {
    try {
      const health = await apiRequest("/api/health");
      const connected = health.database === "connected";
      dbPill.textContent = connected ? "MongoDB Connected" : `DB: ${health.database}`;
      dbPill.classList.toggle("is-connected", connected);
    } catch (err) {
      dbPill.textContent = "Server Offline (run npm start)";
      dbPill.classList.remove("is-connected");
      dbPill.title = err.message || "Could not reach /api/health";
    }
  }

  async function loadVisits() {
    const query = currentVisitFilter === "all" ? "" : `?status=${encodeURIComponent(currentVisitFilter)}`;
    const res = await apiRequest(`/api/visits${query}`);
    statVisits.textContent = String(res.count);
    visitsList.innerHTML = "";

    if (!res.data.length) {
      visitsList.appendChild(createEl("p", "empty-state", "No planned visits found."));
      return;
    }

    res.data.forEach((visit) => {
      const row = createEl("article", "record-card");
      const info = createEl("div", "record-info");

      const top = createEl("div", "record-title-row");
      top.appendChild(createEl("strong", "", visit.name));
      top.appendChild(createEl("span", `status-badge status-${visit.status}`, visit.status));

      const meta = createEl(
        "p",
        "record-meta",
        `${visit.email} • ${visit.serviceTime} • ${visit.guests} guest(s) • ${formatDate(visit.createdAt)}`
      );

      info.append(top, meta);

      const actions = createEl("div", "record-actions");
      const nextStatus = visit.status === "confirmed" ? "attended" : "confirmed";
      const patchBtn = createEl(
        "button",
        "btn btn-soft btn-sm",
        visit.status === "confirmed" ? "Mark Attended" : "Confirm Visit"
      );
      patchBtn.type = "button";
      patchBtn.addEventListener("click", async () => {
        await apiRequest(`/api/visits/${visit._id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        showToast(`Visit updated to "${nextStatus}".`);
        loadVisits();
      });

      const delBtn = createEl("button", "btn btn-danger-soft btn-sm", "Delete");
      delBtn.type = "button";
      delBtn.addEventListener("click", async () => {
        await apiRequest(`/api/visits/${visit._id}`, { method: "DELETE" });
        showToast(`Deleted visit from ${visit.name}.`);
        loadVisits();
      });

      actions.append(patchBtn, delBtn);
      row.append(info, actions);
      visitsList.appendChild(row);
    });
  }

  async function loadMessages() {
    const query = currentMsgFilter === "all" ? "" : `?mode=${encodeURIComponent(currentMsgFilter)}`;
    const res = await apiRequest(`/api/messages${query}`);
    statMessages.textContent = String(res.count);
    messagesList.innerHTML = "";

    if (!res.data.length) {
      messagesList.appendChild(createEl("p", "empty-state", "No prayer requests or messages yet."));
      return;
    }

    res.data.forEach((msg) => {
      const row = createEl("article", "record-card");
      const info = createEl("div", "record-info");

      const top = createEl("div", "record-title-row");
      top.appendChild(createEl("strong", "", msg.name));
      top.appendChild(createEl("span", "sermon-tag", msg.mode));
      top.appendChild(
        createEl(
          "span",
          `status-badge ${msg.isResolved ? "status-confirmed" : "status-pending"}`,
          msg.isResolved ? "resolved" : "open"
        )
      );

      const body = createEl("p", "record-message", msg.message);
      const meta = createEl("p", "record-meta", `${msg.email} • ${formatDate(msg.createdAt)}`);
      info.append(top, body, meta);

      const actions = createEl("div", "record-actions");
      const toggleBtn = createEl(
        "button",
        "btn btn-soft btn-sm",
        msg.isResolved ? "Reopen" : "Mark Resolved"
      );
      toggleBtn.type = "button";
      toggleBtn.addEventListener("click", async () => {
        await apiRequest(`/api/messages/${msg._id}`, {
          method: "PATCH",
          body: JSON.stringify({ isResolved: !msg.isResolved })
        });
        showToast("Message status updated.");
        loadMessages();
      });

      const delBtn = createEl("button", "btn btn-danger-soft btn-sm", "Delete");
      delBtn.type = "button";
      delBtn.addEventListener("click", async () => {
        await apiRequest(`/api/messages/${msg._id}`, { method: "DELETE" });
        showToast(`Deleted message from ${msg.name}.`);
        loadMessages();
      });

      actions.append(toggleBtn, delBtn);
      row.append(info, actions);
      messagesList.appendChild(row);
    });
  }

  async function loadRsvps() {
    const res = await apiRequest("/api/events/rsvps");
    statRsvps.textContent = String(res.count);
    rsvpsList.innerHTML = "";

    if (!res.data.length) {
      rsvpsList.appendChild(createEl("p", "empty-state", "No event RSVPs yet."));
      return;
    }

    res.data.forEach((rsvp) => {
      const row = createEl("article", "record-card");
      const info = createEl("div", "record-info");
      info.appendChild(createEl("strong", "", rsvp.eventTitle));
      info.appendChild(
        createEl("p", "record-meta", `${rsvp.attendeeName || "Guest"} • ${formatDate(rsvp.createdAt)}`)
      );

      const actions = createEl("div", "record-actions");
      const delBtn = createEl("button", "btn btn-danger-soft btn-sm", "Delete");
      delBtn.type = "button";
      delBtn.addEventListener("click", async () => {
        await apiRequest(`/api/events/rsvps/${rsvp._id}`, { method: "DELETE" });
        showToast(`Removed RSVP for ${rsvp.eventTitle}.`);
        loadRsvps();
      });

      actions.appendChild(delBtn);
      row.append(info, actions);
      rsvpsList.appendChild(row);
    });
  }

  async function refreshAll() {
    await Promise.all([loadHealth(), loadVisits(), loadMessages(), loadRsvps()]);
  }

  document.querySelectorAll("[data-visit-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-visit-filter]").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      currentVisitFilter = chip.getAttribute("data-visit-filter");
      loadVisits();
    });
  });

  document.querySelectorAll("[data-msg-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-msg-filter]").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      currentMsgFilter = chip.getAttribute("data-msg-filter");
      loadMessages();
    });
  });

  refreshBtn.addEventListener("click", async () => {
    await refreshAll();
    showToast("Records refreshed from MongoDB.");
  });

  refreshAll().catch((err) => showToast(err.message));
});
