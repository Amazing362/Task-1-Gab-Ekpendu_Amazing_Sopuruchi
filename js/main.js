/* ==========================================================================
   Grace Harbor Church — Interactive Features & API Integration
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const toastEl = document.getElementById("toast");

  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 3800);
  }

  const API_BASE =
    window.location.protocol === "file:" || (window.location.port && window.location.port !== "5000")
      ? "http://localhost:5000"
      : "";

  async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Request failed. Please try again.");
    }
    return payload;
  }

  // 1. Mobile Navigation Drawer
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 2. Active Section Highlighting on Scroll
  const sections = document.querySelectorAll("main section[id]");
  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  // 3. Ministry "Learn More" Quick Info Toast
  const ministryDetails = {
    "Harbor Kids": "Harbor Kids check-in opens 15 minutes before both Sunday services at the East Wing.",
    "Harbor Youth": "Harbor Youth meets Wednesdays at 6:30 PM for grades 6-12 in Harbor Hall.",
    "Community Groups": "12 neighborhood groups meet Tue-Thu evenings. Use Connect below to find one near you!",
    "City Serve Team": "Next City Serve Saturday is December 5 at 9:00 AM — all ages welcome."
  };

  document.querySelectorAll(".ministry-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-ministry");
      showToast(ministryDetails[name] || `${name} welcomes new members every week!`);
    });
  });

  // 4. Sermon Topic Filter Chips
  const filterChips = document.querySelectorAll(".filter-chip");
  const sermonCards = document.querySelectorAll(".sermon-card");

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selected = chip.getAttribute("data-filter");
      filterChips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");

      sermonCards.forEach((card) => {
        const matches = selected === "all" || card.getAttribute("data-category") === selected;
        card.classList.toggle("is-hidden", !matches);
      });
    });
  });

  // 5. Event RSVP Buttons (POST /api/events/rsvps & DELETE toggle)
  document.querySelectorAll(".rsvp-btn").forEach((btn) => {
    btn.dataset.originalLabel = btn.textContent.trim();

    btn.addEventListener("click", async () => {
      const eventName = btn.getAttribute("data-event");
      btn.disabled = true;

      try {
        if (btn.dataset.rsvpId) {
          await apiRequest(`/api/events/rsvps/${btn.dataset.rsvpId}`, { method: "DELETE" });
          delete btn.dataset.rsvpId;
          btn.textContent = btn.dataset.originalLabel;
          btn.classList.remove("btn-primary");
          btn.classList.add("btn-outline-teal");
          showToast(`RSVP canceled for ${eventName}.`);
        } else {
          const res = await apiRequest("/api/events/rsvps", {
            method: "POST",
            body: JSON.stringify({ eventTitle: eventName })
          });
          btn.dataset.rsvpId = res.data._id;
          btn.textContent = "Spot Saved ✓";
          btn.classList.remove("btn-outline-teal");
          btn.classList.add("btn-primary");
          showToast(`Spot reserved for ${eventName}! Saved to database.`);
        }
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // 6. Modal Management (Plan a Visit & Sermon Player)
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((modal) => {
      modal.hidden = true;
    });
    document.body.style.overflow = "";
    stopPlayerTimer();
  }

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.getAttribute("data-open-modal"));
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
  });

  // 7. Interactive Sermon Preview Player
  const playerTitle = document.getElementById("sermon-modal-title");
  const playerSeries = document.getElementById("player-series");
  const playerSpeaker = document.getElementById("player-speaker");
  const playerTotal = document.getElementById("player-total-time");
  const playerCurrent = document.getElementById("player-current-time");
  const playerFill = document.getElementById("player-progress-fill");
  const playerToggle = document.getElementById("player-toggle-btn");

  let isPlaying = false;
  let elapsedSeconds = 0;
  let totalSeconds = 2058;
  let playerInterval = null;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function parseDuration(str) {
    const parts = (str || "30:00").split(":").map(Number);
    return (parts[0] || 30) * 60 + (parts[1] || 0);
  }

  function updatePlayerUI() {
    if (!playerCurrent || !playerFill || !playerToggle) return;
    playerCurrent.textContent = formatTime(elapsedSeconds);
    const pct = Math.min(100, (elapsedSeconds / totalSeconds) * 100);
    playerFill.style.width = `${pct}%`;
    playerToggle.innerHTML = isPlaying ? "&#10074;&#10074;" : "&#9654;";
  }

  function stopPlayerTimer() {
    isPlaying = false;
    clearInterval(playerInterval);
    playerInterval = null;
    updatePlayerUI();
  }

  document.querySelectorAll("[data-play-sermon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopPlayerTimer();
      elapsedSeconds = 0;
      totalSeconds = parseDuration(btn.getAttribute("data-duration"));
      playerTitle.textContent = btn.getAttribute("data-play-sermon");
      playerSeries.textContent = `Series: ${btn.getAttribute("data-series")}`;
      playerSpeaker.textContent = btn.getAttribute("data-speaker");
      playerTotal.textContent = btn.getAttribute("data-duration");
      updatePlayerUI();
      openModal("sermon-modal");
    });
  });

  if (playerToggle) {
    playerToggle.addEventListener("click", () => {
      if (isPlaying) {
        stopPlayerTimer();
        return;
      }
      isPlaying = true;
      updatePlayerUI();
      playerInterval = setInterval(() => {
        elapsedSeconds += 1;
        if (elapsedSeconds >= totalSeconds) {
          elapsedSeconds = 0;
          stopPlayerTimer();
          return;
        }
        updatePlayerUI();
      }, 1000);
    });
  }

  // 8. Connect / Prayer Tabs & Form Submission (POST /api/messages)
  const formTabs = document.querySelectorAll(".form-tab");
  const formModeInput = document.getElementById("form-mode");
  const messageLabel = document.getElementById("contact-message-label");
  const submitBtn = document.getElementById("contact-submit-btn");
  const connectForm = document.getElementById("connect-form");
  const contactError = document.getElementById("contact-error");

  formTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.getAttribute("data-form-mode");
      formTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      formModeInput.value = mode;
      if (mode === "prayer") {
        messageLabel.textContent = "How can we pray for you?";
        submitBtn.textContent = "Send Prayer Request";
      } else {
        messageLabel.textContent = "Your Question or Message";
        submitBtn.textContent = "Send Message";
      }
    });
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (connectForm) {
    connectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mode = formModeInput.value;
      const name = document.getElementById("contact-name").value.trim();
      const email = document.getElementById("contact-email").value.trim();
      const message = document.getElementById("contact-message").value.trim();

      if (!name || !isValidEmail(email) || message.length < 5) {
        contactError.textContent =
          "Please enter your name, a valid email address, and a message (at least 5 characters).";
        contactError.hidden = false;
        return;
      }

      contactError.hidden = true;
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        await apiRequest("/api/messages", {
          method: "POST",
          body: JSON.stringify({ mode, name, email, message })
        });
        connectForm.reset();
        showToast(
          mode === "prayer"
            ? `Thank you, ${name}. Your prayer request is saved for our pastoral team.`
            : `Thanks for reaching out, ${name}! Your message has been saved.`
        );
      } catch (err) {
        contactError.textContent = err.message;
        contactError.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // 9. Plan a Visit Form Submission (POST /api/visits)
  const visitForm = document.getElementById("visit-form");
  const visitError = document.getElementById("visit-error");

  if (visitForm) {
    visitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("visit-name").value.trim();
      const email = document.getElementById("visit-email").value.trim();
      const serviceTime = document.getElementById("visit-service").value;
      const guests = document.getElementById("visit-guests").value;
      const visitSubmitBtn = visitForm.querySelector('button[type="submit"]');

      if (!name || !isValidEmail(email)) {
        visitError.textContent = "Please provide your name and a valid email address.";
        visitError.hidden = false;
        return;
      }

      visitError.hidden = true;
      visitSubmitBtn.disabled = true;
      visitSubmitBtn.textContent = "Saving...";

      try {
        await apiRequest("/api/visits", {
          method: "POST",
          body: JSON.stringify({ name, email, serviceTime, guests })
        });
        visitForm.reset();
        closeAllModals();
        showToast(`Welcome, ${name}! Your ${serviceTime} visit is saved in MongoDB.`);
      } catch (err) {
        visitError.textContent = err.message;
        visitError.hidden = false;
      } finally {
        visitSubmitBtn.disabled = false;
        visitSubmitBtn.textContent = "Confirm My Visit";
      }
    });
  }

  // 10. Dynamic Footer Year
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});
