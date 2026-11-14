(function () {
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const sections = document.querySelectorAll("main section[id]");
  const links = nav.querySelectorAll('a[href^="#"]');
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });

    const revealItems = document.querySelectorAll(".section__head, .card, .about__content, .step, .clients, .contact");
    const reveal = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (el) {
      el.classList.add("reveal");
      reveal.observe(el);
    });
  }

  document.querySelectorAll("[data-slider]").forEach(initSlider);

  document.getElementById("year").textContent = new Date().getFullYear();

  function initSlider(root) {
    const viewport = root.querySelector(".slider__viewport");
    const track = root.querySelector(".slider__track");
    const dotsWrap = root.querySelector(".slider__dots");
    const originals = Array.from(track.children);
    const n = originals.length;
    if (!n) return;

    function makeClone(slide) {
      const c = slide.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("a, button").forEach(function (el) { el.tabIndex = -1; });
      return c;
    }
    track.prepend.apply(track, originals.map(makeClone));
    track.append.apply(track, originals.map(makeClone));
    const slides = Array.from(track.children);

    const dots = originals.map(function (_, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to client " + (i + 1));
      b.addEventListener("click", function () { go(n + i); });
      dotsWrap.appendChild(b);
      return b;
    });

    let index = n;
    let drag = 0;
    let busy = false;
    let busyTimer;

    function offsetFor(i) {
      const s = slides[i];
      return viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    }

    function render(animate) {
      track.classList.toggle("is-animating", animate);
      track.style.transform = "translate3d(" + (offsetFor(index) + drag) + "px,0,0)";
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index % n); });
    }

    function settle() {
      busy = false;
      clearTimeout(busyTimer);
      if (index >= n && index < 2 * n) return;
      index = ((index % n) + n) % n + n;
      track.classList.add("is-jumping");
      render(false);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { track.classList.remove("is-jumping"); });
      });
    }

    function go(i) {
      if (busy) return;
      busy = true;
      index = i;
      render(true);
      busyTimer = setTimeout(settle, 700);
    }

    track.addEventListener("transitionend", function (e) {
      if (e.target === track && e.propertyName === "transform") settle();
    });

    root.querySelector("[data-prev]").addEventListener("click", function () { go(index - 1); });
    root.querySelector("[data-next]").addEventListener("click", function () { go(index + 1); });

    let startX = 0;
    let dragging = false;
    let moved = false;
    viewport.addEventListener("pointerdown", function (e) {
      if (busy) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      viewport.setPointerCapture(e.pointerId);
      pause();
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      drag = e.clientX - startX;
      if (Math.abs(drag) > 8) moved = true;
      render(false);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      const dx = drag;
      drag = 0;
      if (dx < -50) go(index + 1);
      else if (dx > 50) go(index - 1);
      else render(true);
      resume();
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("click", function (e) {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    }, true);

    let timer;
    function pause() { clearInterval(timer); }
    function resume() {
      pause();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(function () {
        if (!document.hidden) go(index + 1);
      }, 3500);
    }
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", resume);

    window.addEventListener("resize", function () { render(false); });
    window.addEventListener("load", function () { render(false); });
    render(false);
    resume();
  }
})();
