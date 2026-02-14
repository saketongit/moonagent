    fetch("gallery.json")
      .then(res => res.json())
      .then(data => {
        const gallery = document.getElementById("gallery");
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

        // Set hero date (latest image date)
        const heroDateEl = document.getElementById("hero-date");
        if (data.images.length > 0) {
          heroDateEl.textContent = data.images[0].date;
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
