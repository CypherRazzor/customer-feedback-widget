"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface TenantFilterProps {
  slugs: string[];
  selected: string | null;
}

export function TenantFilter({ slugs, selected }: TenantFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("project_slug", slug);
      } else {
        params.delete("project_slug");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (slugs.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tenant-filter" className="text-sm text-gray-600">
        Projekt:
      </label>
      <select
        id="tenant-filter"
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Alle Projekte</option>
        {slugs.map((slug) => (
          <option key={slug} value={slug}>
            {slug}
          </option>
        ))}
      </select>
    </div>
  );
}
