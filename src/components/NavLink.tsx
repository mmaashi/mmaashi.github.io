"use client";

/**
 * NavLink — a client-side wrapper around Next.js <Link> that
 * automatically applies the ".active" CSS class when the
 * current pathname matches the href.
 *
 * Used in the server-component layout so nav items light up
 * on the correct page.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

type NavLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function NavLink({ href, children, className, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const hrefStr = String(href);

  // Exact match for the root path, prefix match for sub-routes
  const isActive =
    pathname === hrefStr || pathname.startsWith(hrefStr + "/");

  return (
    <Link
      href={href}
      className={`nav-link${isActive ? " active" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </Link>
  );
}
