import Link from "next/link";
import { nav, services, site } from "@/lib/site-config";
import { SiteWordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-rule bg-ink">
      <div className="site-wrap grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <SiteWordmark />
          <p className="t-body mt-6 max-w-sm">
            Software, websites, search, paid media and content — built as one system for businesses that want to be
            taken seriously.
          </p>
          <a href={`mailto:${site.email}`} className="u-link t-title mt-10 inline-block break-all !text-[clamp(1.2rem,2.2vw,1.9rem)]">
            {site.email}
          </a>
        </div>

        <div className="md:col-span-2 md:col-start-7">
          <p className="t-label">Site</p>
          <ul className="mt-5 space-y-3 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="u-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="t-label">Services</p>
          <ul className="mt-5 space-y-3 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="u-link">
                  {service.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="t-label">Elsewhere</p>
          <ul className="mt-5 space-y-3 text-sm">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="u-link">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="site-wrap flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="t-label">© {new Date().getFullYear()} {site.name}</p>
          <Link href="/app" className="u-link t-label">
            Client / team login
          </Link>
        </div>
      </div>
    </footer>
  );
}
