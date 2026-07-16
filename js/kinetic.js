/* ============================================================
   97 DESIGN — KINETIC TYPE ENGINE
   Splits any [data-split] element into per-word (or per-char)
   spans and animates them via the existing .reveal pipeline —
   "animations on every word" with zero layout shift.

   API (attributes):
     data-split="words|chars"        unit granularity
     data-split-anim="rise|blur|clip|scrub-ink"   (default rise)
     data-split-stagger="28"         ms per unit
     data-split-skip                 subtree the splitter must not touch
                                     (e.g. the live rotating hero word)

   Contract:
   - Walks TEXT NODES only, so nested markup (<em>, .mut, .x/.y
     spans) keeps its styling; each unit gets --d (global index).
   - Word wrappers are inline-block + nowrap → identical line
     wrapping to the unsplit text → no CLS.
   - Host gets aria-label = original text (AT reads one string).
   - Under prefers-reduced-motion the DOM is left completely
     untouched.
   - Reveal: the host's .reveal → .in transition (site.js IO)
     triggers the per-unit stagger, all in CSS (css/kinetic.css).
   - window.K97.split(el) re-splits renderer-emitted headings.
   ============================================================ */
// @ts-check
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MAX_CHARS = 60; // char-splitting cost guard: longer hosts fall back to words

  function split(el) {
    try {
      if (reduce || !el || el.__k97) return;
      el.__k97 = true;
      var mode = el.getAttribute("data-split") === "chars" ? "chars" : "words";
      var label = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!label) return;
      if (mode === "chars" && label.length > MAX_CHARS) mode = "words";
      el.setAttribute("aria-label", label);

      var d = 0; // global unit index across the whole host
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          for (var a = n.parentElement; a && a !== el; a = a.parentElement) {
            if (a.hasAttribute("data-split-skip") || a.classList.contains("kw")) return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        var parts = node.nodeValue.split(/(\s+)/);
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "kw";
          if (mode === "words") {
            w.classList.add("ku");
            w.style.setProperty("--d", String(d++));
            w.textContent = part;
          } else {
            for (var i = 0; i < part.length; i++) {
              var c = document.createElement("span");
              c.className = "kc ku";
              c.style.setProperty("--d", String(d++));
              c.textContent = part[i];
              w.appendChild(c);
            }
          }
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      });
      el.style.setProperty("--n", String(d));
    } catch (err) {
      if (window.console) console.error("[97] kinetic:", err);
    }
  }

  function scan(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-split]"), split);
  }
  window.K97 = { split: split, scan: scan };
  scan(document);
})();
