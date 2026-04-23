// ---------- Year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Contact ----------
(function initContact() {
  const block = document.getElementById("contact-block");
  const link = document.getElementById("contact-link");
  const email = (window.CONTACT_EMAIL || "").trim();
  if (!email) {
    block.remove();
    return;
  }
  link.href = `mailto:${email}?subject=Prints%20inquiry`;
})();

// ---------- Split hero title into chars for stagger animation ----------
(function splitHero() {
  const el = document.getElementById("hero-title");
  if (!el) return;
  const text = el.textContent;
  const words = text.split(" ");
  el.innerHTML = "";
  let charIndex = 0;
  words.forEach((word, wi) => {
    const wrap = document.createElement("span");
    wrap.className = "word";
    [...word].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = ch;
      span.style.animationDelay = `${0.25 + charIndex * 0.045}s`;
      wrap.appendChild(span);
      charIndex++;
    });
    el.appendChild(wrap);
    if (wi < words.length - 1) {
      el.appendChild(document.createTextNode(" "));
      charIndex++;
    }
  });
  const sub = document.getElementById("hero-sub");
  if (sub) sub.style.animationDelay = `${0.25 + charIndex * 0.045 + 0.1}s`;
})();

// ---------- Theme toggle ----------
(function initTheme() {
  const btn = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");
  if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  });
})();

// ---------- Info panel toggle ----------
const infoBtn = document.getElementById("info-toggle");
const infoPanel = document.getElementById("info-panel");
infoBtn.addEventListener("click", () => {
  const open = infoPanel.classList.toggle("open");
  infoBtn.setAttribute("aria-expanded", String(open));
  infoPanel.setAttribute("aria-hidden", String(!open));
});
infoPanel.addEventListener("click", (e) => {
  if (e.target === infoPanel) {
    infoPanel.classList.remove("open");
    infoBtn.setAttribute("aria-expanded", "false");
    infoPanel.setAttribute("aria-hidden", "true");
  }
});

// ---------- Scroll progress ----------
(function scrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  function update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + "%";
  }
  document.addEventListener("scroll", update, { passive: true });
  update();
})();

// ---------- Custom cursor ----------
(function customCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y;
  // Contextual cursor labels
  function setCursorLabel(text) {
    const label = cursor.querySelector(".cursor-label");
    if (label) label.textContent = text || "VIEW";
  }

  document.addEventListener("mousemove", (e) => { 
    tx = e.clientX; 
    ty = e.clientY; 
  });
  
  function tick() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener("mouseleave", () => cursor.style.opacity = "0");
  document.addEventListener("mouseenter", () => cursor.style.opacity = "1");

  // Hover expansion handled by script at tile creation
  window.__hoverableCursor = cursor;
  window.__setCursorLabel = setCursorLabel;
})();

function bindHoverCursor(el, label = "VIEW") {
  const c = window.__hoverableCursor;
  if (!c) return;
  el.addEventListener("mouseenter", () => {
    c.classList.add("hover");
    if (window.__setCursorLabel) window.__setCursorLabel(label);
  });
  el.addEventListener("mouseleave", () => {
    c.classList.remove("hover");
    if (window.__setCursorLabel) window.__setCursorLabel("VIEW");
  });
}

// ---------- Magnetic Buttons ----------
(function initMagnetic() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const items = document.querySelectorAll(".theme-btn, .info-btn, .mark, .lb-close, .lb-prev, .lb-next");
  
  items.forEach(el => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.4;
      const dy = (e.clientY - cy) * 0.4;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
})();

// ---------- Gallery ----------
const gallery = document.getElementById("gallery");
const empty = document.getElementById("gallery-empty");
const fullTiles = [];

function loadGallery() {
  const photos = Array.isArray(window.PHOTOS) ? window.PHOTOS : [];

  if (photos.length === 0) {
    empty.hidden = false;
    return;
  }

  // Layout pattern for mobile editorial rhythm (desktop ignores these classes).
  // Pattern repeats every 8 photos for more variety:
  // 0: full-bleed · 1: indent-left · 2+3: pair · 4: centered-small · 5: full-bleed · 6: indent-right · 7: indent-left
  function mobileClass(i) {
    const m = i % 8;
    if (m === 0 || m === 5) return "tile--full-bleed";
    if (m === 1 || m === 7) return "tile--indent-left";
    if (m === 6) return "tile--indent-right";
    if (m === 4) return "tile--centered-small";
    return ""; // 2 & 3 handled as a pair
  }

  function buildTile(photo, i, extraClass) {
    const src = typeof photo === "string" ? photo : photo.src;
    const caption = typeof photo === "string" ? "" : (photo.caption || "");
    const alt = typeof photo === "string" ? "" : (photo.alt || caption || "");

    const tile = document.createElement("figure");
    tile.className = "tile";
    if (extraClass) tile.classList.add(extraClass);
    if (i > 0 && (i + 1) % 6 === 0) tile.classList.add("full");

    const img = document.createElement("img");
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("load", () => tile.classList.add("loaded"));
    img.src = `images/${src}`;
    tile.appendChild(img);

    tile.dataset.index = String(i);
    tile.dataset.photoIndex = String(i);
    tile.dataset.caption = caption;
    tile.addEventListener("click", () => openLightbox(i));
    bindHoverCursor(tile);

    if (tile.classList.contains("full")) fullTiles.push({ el: tile, img });

    return tile;
  }

  let i = 0;
  let photoCounter = 0; // Keep track of absolute index for lightbox
  
  while (i < photos.length) {
    const item = photos[i];
    
    // Horizontal Series
    if (Array.isArray(item)) {
      const series = document.createElement("div");
      series.className = "series";
      item.forEach((p) => {
        series.appendChild(buildTile(p, photoCounter));
        photoCounter++;
      });
      gallery.appendChild(series);
      i++;
      continue;
    }

    const m = i % 8;
    // Pair slot: positions 2 & 3 of each cycle become a 2-up row on mobile
    if (m === 2 && i + 1 < photos.length && !Array.isArray(photos[i+1])) {
      const pair = document.createElement("div");
      pair.className = "pair";
      pair.appendChild(buildTile(photos[i], photoCounter));
      photoCounter++;
      pair.appendChild(buildTile(photos[i + 1], photoCounter));
      photoCounter++;
      gallery.appendChild(pair);
      i += 2;
    } else {
      gallery.appendChild(buildTile(photos[i], photoCounter, mobileClass(i)));
      photoCounter++;
      i += 1;
    }
  }

  observeTiles();
  prepareLightbox(photos.flat());
  bindParallax();
}


// ---------- Scroll reveal ----------
function observeTiles() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );
  document.querySelectorAll(".tile").forEach((el) => io.observe(el));
}

// ---------- Parallax (all photos on mobile, full-bleed on desktop) ----------
function bindParallax() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const isMobile = matchMedia("(max-width: 720px)").matches;

  let targets;
  if (isMobile) {
    targets = [...document.querySelectorAll("#gallery .tile img")].map((img) => ({
      el: img.closest(".tile"),
      img,
      strength: 14,
    }));
  } else {
    targets = [...document.querySelectorAll(".tile")].map((el, idx) => ({
      el,
      img: el.querySelector("img"),
      strength: 15 + (idx % 4) * 15, // Alternating speeds for depth
    }));
  }

  if (targets.length === 0) return;

  let raf = null;
  function update() {
    const vh = window.innerHeight;

    // Hero parallax
    const heroImg = document.getElementById("hero-img");
    if (heroImg) {
      const scroll = window.pageYOffset;
      if (scroll < vh) {
        heroImg.style.transform = `translateY(${scroll * 0.4}px) scale(${1 + scroll * 0.0005})`;
      }
    }

    targets.forEach(({ el, img, strength }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const shift = Math.max(-strength, Math.min(strength, -progress * strength));
      if (isMobile) {
        img.style.setProperty("--parallax", `${shift}px`);
      } else {
        img.style.transform = `translateY(${shift}px) scale(1.08)`;
      }
    });
    raf = null;
  }
  document.addEventListener("scroll", () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

// ---------- Lightbox ----------
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector(".lb-img");
const lbCap = lb.querySelector(".lb-caption");
const lbClose = lb.querySelector(".lb-close");
const lbPrev = lb.querySelector(".lb-prev");
const lbNext = lb.querySelector(".lb-next");
const lbIndexEl = document.getElementById("lb-index");
const lbTotalEl = document.getElementById("lb-total");
const lbHint = document.getElementById("lb-hint");
let lbIndex = 0;
let lbPhotos = [];
let lbHintShown = false;

function prepareLightbox(photos) {
  lbPhotos = photos;
  lbTotalEl.textContent = String(photos.length);
}

function openLightbox(i) {
  lbIndex = i;
  renderLightbox();
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (!lbHintShown) {
    lbHintShown = true;
    lbHint.classList.add("show");
    setTimeout(() => lbHint.classList.remove("show"), 2500);
  }
}

function closeLightbox() {
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderLightbox() {
  const photo = lbPhotos[lbIndex];
  if (!photo) return;
  const src = typeof photo === "string" ? photo : photo.src;
  const caption = typeof photo === "string" ? "" : (photo.caption || "");
  lbImg.src = `images/${src}`;
  lbImg.alt = caption;
  lbCap.textContent = caption;
  lbIndexEl.textContent = String(lbIndex + 1).padStart(2, "0");
}

function step(delta) {
  if (lbPhotos.length === 0) return;
  lbIndex = (lbIndex + delta + lbPhotos.length) % lbPhotos.length;
  renderLightbox();
}

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => step(-1));
lbNext.addEventListener("click", () => step(1));

// Add cursor labels to lightbox controls
bindHoverCursor(lbClose, "CLOSE");
bindHoverCursor(lbPrev, "PREV");
bindHoverCursor(lbNext, "NEXT");
bindHoverCursor(document.getElementById("info-toggle"), "INFO");
bindHoverCursor(document.getElementById("theme-toggle"), "MODE");
bindHoverCursor(document.querySelector(".mark"), "HOME");

lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

loadGallery();
