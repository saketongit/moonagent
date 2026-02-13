    fetch("gallery.json")
      .then(res => res.json())
      .then(data => {
        const gallery = document.getElementById("gallery");
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


        monthKeys.forEach((monthKey, index) => {
          const section = document.createElement("div");
          section.className = "month-section";
          section.dataset.month = monthKey;

          if (monthKey === activeMonth) {
            section.classList.add("active");
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

          // Divider to previous month
          if (index < monthKeys.length - 1) {
            const nextMonthKey = monthKeys[index + 1];
            const [y, m] = nextMonthKey.split("-");
            const label = new Date(y, m - 1)
              .toLocaleString("default", { month: "long", year: "numeric" });

            const divider = document.createElement("div");
            divider.className = "month-divider";
            divider.textContent = label + " ▸";

            divider.addEventListener("click", () => {
              
              // Remove active from all months
              document.querySelectorAll(".month-section")
                .forEach(sec => sec.classList.remove("active"));

              // Find the next month section
              const nextSection = document.querySelector(
                `.month-section[data-month="${nextMonthKey}"]`
              );
            
              // Force reflow so animation plays
              nextSection.offsetHeight;

              // Activate next month
              nextSection.classList.add("active");
            });

            gallery.appendChild(divider);
          }
        });
      })
      .catch(err => console.error("Failed to load gallery.json", err));
