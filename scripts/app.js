    fetch("gallery.json")
      .then(res => res.json())
      .then(data => {
        let scrollPosition = 0;
        const gallery = document.getElementById("gallery");

        const REAL_MOON_IMAGES = {
          "New Moon": "images/real/new-moon.webp",
          "Waxing Crescent": "images/real/waxing-crescent.webp",
          "First Quarter": "images/real/first-quarter.webp",
          "Waxing Gibbous": "images/real/waxing-gibbous.webp",
          "Full Moon": "images/real/full-moon.webp",
          "Waning Gibbous": "images/real/waning-gibbous.webp",
          "Last Quarter": "images/real/last-quarter.webp",
          "Waning Crescent": "images/real/waning-crescent.webp"
        };

        const PHOTO_CREDITS = {
          "New Moon": "",
          "Waxing Crescent": "Getty Images",
          "First Quarter": "UMUT DAĞLI",
          "Waxing Gibbous": "Getty Images",
          "Full Moon": "Rino Adamo",
          "Waning Gibbous": "Jessica Chortkoff",
          "Last Quarter": "Leonora Oates",
          "Waning Crescent": "Wendy Calandrelli"
        };



        // ---- Phase modal logic (real) ----
        const modalOverlay = document.getElementById("phase-modal-overlay");
        const modalImg = document.getElementById("phase-modal-img");
        const modalTitle = document.getElementById("phase-modal-title");
        const modalDesc = document.getElementById("phase-modal-desc");
        const modalMeta = document.getElementById("phase-modal-meta");
        const modalDate = document.getElementById("phase-modal-date");

        function openPhaseModal(data) {
          // Save scroll position
          scrollPosition = window.scrollY;
          
          // Lock background scroll
          document.body.classList.add("modal-open");

          modalImg.src =
            REAL_MOON_IMAGES[data.phase] || data.image;
          modalTitle.textContent = data.icon
            ? `${data.icon} ${data.phase}`
            : data.phase;
          modalDesc.textContent = data.meaning || "";
          modalDate.textContent = data.date;

          const photographer = PHOTO_CREDITS[data.phase];
          modalMeta.innerHTML = `
            <div class="meta-row">
              <span>🌕 ${data.illumination}% illuminated</span>
              <span>🕒 ${data.age} days old</span>
            </div>
            <div class="meta-row">  
            <span>🌍 ${data.distance.toLocaleString()} km away</span>
            ${photographer ? `<span>📷 Photo: ${photographer}</span>` : ""}
            </div>
          `;

          modalOverlay.classList.remove("hidden");
        }

        function closePhaseModal() {
          modalOverlay.classList.add("hidden");

          // Unlock background scroll
          document.body.classList.remove("modal-open");

          // Restore scroll position
          window.scrollTo(0, scrollPosition);
        }

        // Click outside modal closes it
        modalOverlay.addEventListener("click", (e) => {
          if (e.target === modalOverlay) {
            closePhaseModal();
          }
        });





        // ---- Grid/List persistence ----
        const VIEW_KEY = "moon_view_mode";
        let isGridView = localStorage.getItem(VIEW_KEY) === "grid";

        const viewToggleBtn = document.getElementById("view-toggle-button");
        // Apply saved view mode on load
        if (isGridView) {
          document.querySelectorAll(".month-section").forEach(section => {
            section.classList.add("grid");
          });
          viewToggleBtn.textContent = "☰";
        } else {
          viewToggleBtn.textContent = "▦";
        }


        viewToggleBtn.addEventListener("click", () => {
          isGridView = !isGridView;

          document.querySelectorAll(".month-section").forEach(section => {
              section.classList.toggle("grid", isGridView);
          });

          // Save preference
          localStorage.setItem(VIEW_KEY, isGridView ? "grid" : "list");

          // Update icon
          viewToggleBtn.textContent = isGridView ? "☰" : "▦";
        });

        // ---- Hero ambient caption ----
        const today = data.images[0];

        const heroPhaseLine = document.getElementById("hero-phase-line");
        const heroDateEl = document.getElementById("hero-date");

        if (heroPhaseLine) {
          heroPhaseLine.textContent =
            `${today.phase} · ${today.illumination}% illuminated`;
        }

        if (heroDateEl) {
          heroDateEl.textContent = today.date;
        }

        // Group images by month (skip hero image)
        const months = {};
        data.images.slice(1).forEach(item => {
          const key = item.date.slice(0, 7); // YYYY-MM
          if (!months[key]) months[key] = [];
          months[key].push(item);
        });

        // Sort months (latest first)
        const monthKeys = Object.keys(months).sort().reverse();
        let activeMonth = monthKeys[0];
        
        // Floating month selector elements
        const selector = document.getElementById("month-selector");
        const selectorLabel = document.getElementById("month-selector-label");
        const selectorMenu = document.getElementById("month-selector-menu");

        // Helper: format month label
        function formatMonth(key) {
          const [y, m] = key.split("-");
          return new Date(y, m - 1).toLocaleString("default", {
            month: "long",
            year: "numeric"
          });
        }

        // Set initial label
        selectorLabel.textContent = formatMonth(activeMonth) + " ▾";

        // Build selector menu
        monthKeys.forEach(key => {
          const item = document.createElement("div");
          item.className = "month-selector-item";
          item.textContent = formatMonth(key);

          if (key === activeMonth) {
            item.classList.add("active");
          }

          item.addEventListener("click", () => {
            
            // Switch active month
            document.querySelectorAll(".month-section")
              .forEach(sec => sec.classList.remove("active"));

            const nextSection = document.querySelector(
              `.month-section[data-month="${key}"]`
            );
            
            // force reflow so animation plays
            nextSection.offsetHeight;

            nextSection.classList.add("active");
            nextSection.classList.toggle("grid", isGridView);

            // Update selector UI
            selectorLabel.textContent = formatMonth(key) + " ▾";
            document.querySelectorAll(".month-selector-item")
              .forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            selectorMenu.classList.remove("active");
          });

          selectorMenu.appendChild(item);
        });

        // Toggle menu open/close
        selectorLabel.addEventListener("click", () => {
          selectorMenu.classList.toggle("active");
        });



        monthKeys.forEach(monthKey => {

          // Create month section
          const section = document.createElement("div");
          section.className = "month-section";
          section.dataset.month = monthKey;

          // Active month logic
          if (monthKey === activeMonth) {
            section.classList.add("active");
          }

          section.classList.toggle("grid", isGridView);

          // Month title (ONLY for past months)
          if (monthKey !== activeMonth) {
            const title = document.createElement("div");
            title.className = "month-title";
            title.textContent = formatMonth(monthKey);
            section.appendChild(title);
          }

          // Images
          months[monthKey].forEach(item => {
            const wrap = document.createElement("div");
            wrap.className = "gallery-item";
            wrap.dataset.phase = item.phase || "";
            wrap.dataset.phaseIcon = item.phase_icon || "";
            wrap.dataset.phaseMeaning = item.phase_meaning || "";
            wrap.dataset.image = item.file;

            wrap.style.cursor = "pointer";

            wrap.addEventListener("click", () => {
              openPhaseModal({
                image: wrap.dataset.image,
                phase: wrap.dataset.phase,
                icon: wrap.dataset.phaseIcon,
                meaning: wrap.dataset.phaseMeaning,
                illumination: item.illumination,
                age: item.age_days,
                distance: item.distance_km,
                date: item.date
              });
            });



            const img = document.createElement("img");
            img.src = item.file;

            const date = document.createElement("div");
            date.className = "date";
            date.textContent = item.date;

            wrap.appendChild(img);
            wrap.appendChild(date);
            section.appendChild(wrap);
          });

          gallery.appendChild(section);
        });

      })
      .catch(err => console.error("Failed to load gallery.json", err));
