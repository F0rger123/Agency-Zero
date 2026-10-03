import Link from "next/link";
import { AsciiReactionLazy } from "@/components/site/ascii-reaction-lazy";
import { Reveal } from "@/components/site/reveal";
import { services } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      <Hero />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28">
      {/* Atmosphere: the reaction field lives on the right/bottom and fades under the headline. */}
      <div
        className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_right,transparent_8%,#000_62%)] max-md:[mask-image:linear-gradient(to_bottom,transparent_10%,#000_70%)]"
        aria-hidden
      >
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_2%,#000_22%,#000_72%,transparent_96%)]">
          <AsciiReactionLazy />
        </div>
      </div>
      <div className="depth-top absolute inset-0 -z-10" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink to-transparent" aria-hidden />

      <div className="site-wrap pb-10 md:pb-14">
        <Reveal>
          <p className="t-label mb-8 flex items-center gap-4">
            <span className="inline-block size-1.5 rounded-full bg-bone" aria-hidden />
            Agency Zero — software, websites, search &amp; content
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="t-display max-w-[15ch] md:max-w-[17ch]">
            We build the systems, content and presence behind better businesses.
          </h1>
        </Reveal>

        <div className="mt-10 grid items-end gap-10 md:mt-14 md:grid-cols-12">
          <Reveal delay={200} className="md:col-span-5">
            <p className="t-lead max-w-md">
              Custom software. Websites. SEO. Paid media. Content. One studio, one standard — so the work around your
              business finally fits together.
            </p>
          </Reveal>
          <Reveal delay={300} className="md:col-span-7 md:justify-self-end">
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="btn btn-solid">
                Start a project <span className="arrow" aria-hidden>→</span>
              </Link>
              <Link href="/work" className="btn">
                See our work <span className="arrow" aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <ul className="mt-14 grid grid-cols-2 border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
            {services.map((service) => (
              <li key={service.slug} className="border-b border-rule sm:border-r sm:last:border-r-0 lg:border-b-0">
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex items-baseline justify-between gap-3 px-1 py-4 sm:px-4"
                >
                  <span className="t-label transition-colors group-hover:!text-bone">{service.index}</span>
                  <span className="text-sm text-mist transition-colors group-hover:text-bone">{service.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
