const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("[data-menu]");
const navLinks = Array.from(document.querySelectorAll(".site-menu a"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  menu?.classList.toggle("is-open", !isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    menu?.classList.remove("is-open");
  });
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -60px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 },
  );

  sections.forEach((section) => activeObserver.observe(section));
}

const canvas = document.getElementById("signalCanvas");

if (canvas) {
  const context = canvas.getContext("2d");
  const palette = {
    gold: "rgba(233, 214, 167, 0.82)",
    goldSoft: "rgba(201, 164, 93, 0.22)",
    steel: "rgba(158, 180, 191, 0.52)",
    line: "rgba(255, 255, 255, 0.08)",
  };
  const nodes = [
    { x: 0.15, y: 0.28, r: 3.5 },
    { x: 0.34, y: 0.18, r: 2.7 },
    { x: 0.56, y: 0.34, r: 3.2 },
    { x: 0.76, y: 0.22, r: 2.9 },
    { x: 0.84, y: 0.48, r: 3.4 },
    { x: 0.62, y: 0.64, r: 2.7 },
    { x: 0.38, y: 0.56, r: 3.1 },
    { x: 0.2, y: 0.72, r: 2.5 },
  ];
  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [6, 0],
    [1, 6],
    [3, 5],
  ];
  let width = 0;
  let height = 0;
  let frame = 0;
  let animationFrame;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawGrid = () => {
    context.strokeStyle = palette.line;
    context.lineWidth = 1;
    const gap = 42;

    for (let x = -gap; x < width + gap; x += gap) {
      context.beginPath();
      context.moveTo(x + (frame % gap) * 0.08, 0);
      context.lineTo(x - 40, height);
      context.stroke();
    }

    for (let y = 0; y < height; y += gap) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + 24);
      context.stroke();
    }
  };

  const getPoint = (node, index) => {
    const drift = reducedMotion.matches ? 0 : Math.sin(frame * 0.012 + index) * 9;
    return {
      x: node.x * width + drift,
      y: node.y * height + Math.cos(frame * 0.01 + index) * 7,
    };
  };

  const drawNetwork = () => {
    const points = nodes.map(getPoint);

    context.lineCap = "round";
    links.forEach(([from, to], index) => {
      const start = points[from];
      const end = points[to];
      const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
      gradient.addColorStop(0, index % 2 ? palette.steel : palette.goldSoft);
      gradient.addColorStop(1, index % 2 ? palette.goldSoft : palette.steel);
      context.strokeStyle = gradient;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    });

    points.forEach((point, index) => {
      const node = nodes[index];
      context.beginPath();
      context.fillStyle = index % 2 ? palette.steel : palette.gold;
      context.shadowColor = index % 2 ? palette.steel : palette.gold;
      context.shadowBlur = 16;
      context.arc(point.x, point.y, node.r, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      context.beginPath();
      context.strokeStyle = "rgba(255, 255, 255, 0.12)";
      context.arc(point.x, point.y, node.r * 4.6, 0, Math.PI * 2);
      context.stroke();
    });
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#08080a";
    context.fillRect(0, 0, width, height);
    drawGrid();
    drawNetwork();
    frame += 1;

    if (!reducedMotion.matches) {
      animationFrame = requestAnimationFrame(draw);
    }
  };

  resizeCanvas();
  draw();
  window.addEventListener("resize", () => {
    resizeCanvas();
    draw();
  });

  reducedMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(animationFrame);
    draw();
  });
}
