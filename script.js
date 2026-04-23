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
  document.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  function tick() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.addEventListener("mouseleave", () => cursor.style.opacity = "0");
  document.addEventListener("mouseenter", () => cursor.style.opacity = "1");
  // hover expansion handled by script at tile creation
  window.__hoverableCursor = cursor;
})();

function bindHoverCursor(el) {
  const c = window.__hoverableCursor;
  if (!c) return;
  el.addEventListener("mouseenter", () => c.classList.add("hover"));
  el.addEventListener("mouseleave", () => c.classList.remove("hover"));
}

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

  // Intro slide (mobile-only via CSS)
  const intro = document.createElement("figure");
  intro.className = "tile tile--intro";
  intro.innerHTML = `
    <p class="slide-mark">The High Region</p>
    <hr />
    <p class="slide-meta">Phoenix, AZ · ${photos.length} photographs</p>
  `;
  gallery.appendChild(intro);

  photos.forEach((photo, i) => {
    const src = typeof photo === "string" ? photo : photo.src;
    const caption = typeof photo === "string" ? "" : (photo.caption || "");
    const alt = typeof photo === "string" ? "" : (photo.alt || caption || "");

    const tile = document.createElement("figure");
    tile.className = "tile";
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

    gallery.appendChild(tile);
  });

  // Outro slide (mobile-only via CSS)
  const outro = document.createElement("figure");
  outro.className = "tile tile--outro";
  outro.innerHTML = `
    <p class="slide-mark">Thanks for looking.</p>
    <hr />
    <p class="slide-meta">Follow along</p>
    <a class="slide-cta" href="https://www.instagram.com/thehighregion" target="_blank" rel="noopener">Instagram →</a>
  `;
  gallery.appendChild(outro);

  observeTiles();
  prepareLightbox(photos);
  bindParallax();
  bindCarousel(photos);
  buildGridOverlay(photos);
}

// ---------- Mobile carousel (progress bar, counter, grid button, hint) ----------
function bindCarousel(photos) {
  const gallery = document.getElementById("gallery");
  const ui = document.getElementById("carousel-ui");
  const iEl = document.getElementById("car-i");
  const nEl = document.getElementById("car-n");
  const progressEl = document.getElementById("car-progress");
  const hintEl = document.getElementById("car-hint");
  const gridBtn = document.getElementById("car-grid-btn");
  if (!gallery || !ui) return;

  const isMobile = () => matchMedia("(max-width: 720px)").matches;

  nEl.textContent = String(photos.length).padStart(2, "0");

  function setActive(tileEl) {
    [...gallery.children].forEach((c) => c.classList.toggle("is-active", c === tileEl));
    const pIdx = tileEl && tileEl.dataset.photoIndex !== undefined ? Number(tileEl.dataset.photoIndex) : null;
    if (pIdx !== null && !Number.isNaN(pIdx)) {
      iEl.textContent = String(pIdx + 1).padStart(2, "0");
      const pct = photos.length > 1 ? (pIdx / (photos.length - 1)) * 100 : 100;
      progressEl.style.width = pct + "%";
    } else if (tileEl && tileEl.classList.contains("tile--intro")) {
      iEl.textContent = "00";
      progressEl.style.width = "0%";
    } else if (tileEl && tileEl.classList.contains("tile--outro")) {
      iEl.textContent = String(photos.length).padStart(2, "0");
      progressEl.style.width = "100%";
    }
  }

  // activate the intro slide by default (it's the cover)
  const firstChild = gallery.firstElementChild;
  if (firstChild) setActive(firstChild);

  const io = new IntersectionObserver(
    (entries) => {
      if (!isMobile()) return;
      let best = null;
      entries.forEach((e) => {
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      });
      if (best && best.isIntersecting && best.intersectionRatio > 0.55) {
        setActive(best.target);
      }
    },
    { root: gallery, threshold: [0.55, 0.8, 1] }
  );
  [...gallery.children].forEach((tile) => io.observe(tile));

  // Swipe hint: show on mobile, fade on first scroll
  if (isMobile()) {
    setTimeout(() => hintEl.classList.add("show"), 600);
    const onFirstScroll = () => {
      hintEl.classList.remove("show");
      gallery.removeEventListener("scroll", onFirstScroll);
    };
    gallery.addEventListener("scroll", onFirstScroll, { once: true, passive: true });
    setTimeout(() => hintEl.classList.remove("show"), 5000);
  }

  // Grid button → open overlay
  gridBtn.addEventListener("click", () => {
    document.getElementById("grid-overlay").classList.add("open");
    document.getElementById("grid-overlay").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });

  // Hero scroll arrow click → scroll to gallery
  const heroScroll = document.querySelector(".hero-scroll");
  if (heroScroll) {
    heroScroll.style.cursor = "pointer";
    heroScroll.addEventListener("click", () => {
      gallery.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

// ---------- Grid overlay (all-photos view) ----------
function buildGridOverlay(photos) {
  const overlay = document.getElementById("grid-overlay");
  const inner = document.getElementById("grid-overlay-inner");
  const close = document.getElementById("grid-close");
  const gallery = document.getElementById("gallery");
  if (!overlay || !inner) return;

  photos.forEach((photo, idx) => {
    const src = typeof photo === "string" ? photo : photo.src;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Photo ${idx + 1}`);
    const img = document.createElement("img");
    img.src = `images/${src}`;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    b.appendChild(img);
    b.addEventListener("click", () => {
      closeOverlay();
      // scroll carousel to that photo
      const target = gallery.querySelector(`.tile[data-photo-index="${idx}"]`);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      }
    });
    inner.appendChild(b);
  });

  function closeOverlay() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  close.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeOverlay();
  });
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

// ---------- Parallax on full-bleed tiles ----------
function bindParallax() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (matchMedia("(hover: none), (pointer: coarse)").matches) return;
  let raf = null;
  function update() {
    const vh = window.innerHeight;
    fullTiles.forEach(({ el, img }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const shift = Math.max(-40, Math.min(40, -progress * 40));
      img.style.transform = `translateY(${shift}px) scale(1.08)`;
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
