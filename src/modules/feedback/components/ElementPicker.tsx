"use client";

import { useEffect, useRef, useState } from "react";

interface ElementPickerProps {
  onSelect: (selector: string, element: Element) => void;
  active: boolean;
}

/**
 * Overlays a highlight box over hovered elements and captures the CSS selector
 * on click. Uses css-selector-generator (loaded dynamically to keep bundle lean).
 */
export function ElementPicker({ onSelect, active }: ElementPickerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Element | null>(null);

  useEffect(() => {
    if (!active) {
      setHovered(null);
      return;
    }

    let currentTarget: Element | null = null;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      // Skip our own overlay and feedback UI elements
      if (
        target.closest("[data-feedback-ui]") ||
        target === overlayRef.current
      ) {
        return;
      }
      currentTarget = target;
      setHovered(target);
    };

    const onClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentTarget) return;

      const { getCssSelector } = await import("css-selector-generator");
      const selector = getCssSelector(currentTarget, {
        blacklist: ["[data-feedback-ui]"],
      });
      onSelect(selector, currentTarget);
    };

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, onSelect]);

  useEffect(() => {
    if (!hovered || !overlayRef.current) return;
    const rect = hovered.getBoundingClientRect();
    const overlay = overlayRef.current;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }, [hovered]);

  if (!active || !hovered) return null;

  return (
    <div
      ref={overlayRef}
      data-feedback-ui
      className="fixed pointer-events-none z-[9998] border-2 border-blue-500 bg-blue-100/20 rounded transition-all duration-75"
      style={{ position: "absolute" }}
    />
  );
}
