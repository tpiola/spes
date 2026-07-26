(() => {
  "use strict";
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const track = (name, data = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...data });
    window.va("event", { name, data });
  };

  document.querySelectorAll("[data-track]").forEach(element => {
    element.addEventListener("click", () => track(element.dataset.track, {
      placement: element.dataset.placement || "editorial",
      path: location.pathname
    }));
  });

  const shareButton = document.querySelector("[data-share]");
  const shareStatus = document.querySelector(".share-status");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const payload = { title: document.title, text: document.querySelector('meta[name="description"]')?.content || "", url: location.href };
      try {
        if (navigator.share) await navigator.share(payload);
        else {
          await navigator.clipboard.writeText(location.href);
          if (shareStatus) shareStatus.textContent = "Link copiado. Envie a quem precisa desta oração.";
        }
        track("content_share", { path: location.pathname });
      } catch (error) {
        if (error?.name !== "AbortError" && shareStatus) shareStatus.textContent = "Copie o endereço desta página para compartilhar.";
      }
    });
  }

  const copyButton = document.querySelector("[data-copy]");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      await navigator.clipboard.writeText(location.href);
      if (shareStatus) shareStatus.textContent = "Link copiado.";
      track("content_copy_link", { path: location.pathname });
    });
  }

  const filterButtons = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-type]");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    const selected = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    cards.forEach(card => { card.hidden = selected !== "todos" && card.dataset.type !== selected; });
    track("archive_filter", { selected });
  }));

  const article = document.querySelector("[data-article]");
  if (article) {
    const key = "spes-history";
    const history = JSON.parse(localStorage.getItem(key) || "[]").filter(Boolean);
    const current = location.pathname;
    localStorage.setItem(key, JSON.stringify([current, ...history.filter(item => item !== current)].slice(0, 20)));
    const streakKey = "spes-last-visit";
    localStorage.setItem(streakKey, new Date().toISOString().slice(0, 10));
  }
})();
