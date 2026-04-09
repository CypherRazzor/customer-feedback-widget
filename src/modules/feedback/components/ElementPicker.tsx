"use client";

import { useEffect, useRef, useState } from "react";

interface ElementPickerProps {
  onSelect: (selector: string, element: Element) => void;
  active: boolean;
  /** Optional same-origin iframe to also attach picking to */
  iframeEl?: HTMLIFrameElement | null;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Overlays a highlight box over hovered elements and captures the CSS selector
 * on click. Supports both the host page and a same-origin iframe.
 */
export function ElementPicker({ onSelect, active, iframeEl }: ElementPickerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  useEffect(() => {
    if (!active) {
      setHighlight(null);
      return;
    }

    // Compute offset of iframe within the host page (for overlay positioning)
    function getIframeOffset(): { top: number; left: number } {
      if (!iframeEl) return { top: 0, left: 0 };
      const rect = iframeEl.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      };
    }

    function rectToHighlight(
      rect: DOMRect,
      offset: { top: number; left: number }
    ): HighlightRect {
      return {
        top: rect.top + (offset.top || window.scrollY),
        left: rect.left + (offset.left || window.scrollX),
        width: rect.width,
        height: rect.height,
      };
    }

    // ── Host document listeners ──────────────────────────────────────────────
    const onHostMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-feedback-ui]") || target === overlayRef.current)
        return;
      const rect = target.getBoundingClientRect();
      setHighlight(rectToHighlight(rect, { top: 0, left: 0 }));
      (target as HTMLElement & { _fbTarget?: Element })._fbTarget = target;
    };

    const onHostClick = async (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-feedback-ui]") || target === overlayRef.current)
        return;
      e.preventDefault();
      e.stopPropagation();
      const { getCssSelector } = await import("css-selector-generator");
      const selector = getCssSelector(target, { blacklist: ["[data-feedback-ui]"] });
      onSelect(selector, target);
    };

    document.addEventListener("mouseover", onHostMouseOver);
    document.addEventListener("click", onHostClick, true);

    // ── Iframe listeners (same-origin only) ──────────────────────────────────
    let iframeDoc: Document | null = null;
    let onIframeMouseOver: ((e: MouseEvent) => void) | null = null;
    let onIframeClick: ((e: MouseEvent) => Promise<void>) | null = null;

    if (iframeEl) {
      try {
        iframeDoc = iframeEl.contentDocument;
      } catch {
        iframeDoc = null; // cross-origin — skip
      }
    }

    if (iframeDoc) {
      onIframeMouseOver = (e: MouseEvent) => {
        const target = e.target as Element;
        const offset = getIframeOffset();
        const rect = target.getBoundingClientRect();
        setHighlight(rectToHighlight(rect, offset));
      };

      onIframeClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as Element;
        const { getCssSelector } = await import("css-selector-generator");
        const selector = getCssSelector(target);
        onSelect(`iframe > ${selector}`, target);
      };

      iframeDoc.addEventListener("mouseover", onIframeMouseOver);
      iframeDoc.addEventListener("click", onIframeClick, true);
    }

    return () => {
      setHighlight(null);
      document.removeEventListener("mouseover", onHostMouseOver);
      document.removeEventListener("click", onHostClick, true);
      if (iframeDoc && onIframeMouseOver && onIframeClick) {
        iframeDoc.removeEventListener("mouseover", onIframeMouseOver);
        iframeDoc.removeEventListener("click", onIframeClick, true);
      }
    };
  }, [active, onSelect, iframeEl]);

  if (!active || !highlight) return null;

  return (
    <div
      ref={overlayRef}
      data-feedback-ui
      className="pointer-events-none z-[9998] border-2 border-blue-500 bg-blue-100/20 rounded transition-all duration-75"
      style={{
        position: "absolute",
        top: highlight.top,
        left: highlight.left,
        width: highlight.width,
        height: highlight.height,
      }}
    />
  );
}
