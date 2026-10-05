import { shortAnswers, siteFaqs } from "@/content/local-seo";
import { servicePages } from "@/content/services";
import { areasByCounty, siteUrl } from "@/lib/seo";
import { services, site } from "@/lib/site-config";

/** Plain-text summaries for AI assistants (the llms.txt convention). Facts only; mirrors what is on the pages. */
export function llmsIndex(): string {
  return `# ${site.name}

> Agency Zero (also written Agency Zer0; website theagencyzero.com) is an agency run by ${site.owner}, based in York, PA. It builds custom software, CRMs and websites, and provides SEO and AI-search optimization (AEO), Meta ads, social media management and video content. In-person work (shoots, meetings) is available around York, PA and nearby; most services are delivered remotely, so businesses outside Pennsylvania are welcome too.

Contact: ${site.email} (replies within one business day). Instagram: ${site.instagram}

## Pages
- [Home](${siteUrl}/): overview of the agency and its six services
- [Services](${siteUrl}/services): all services
${services.map((s) => `- [${s.title}](${siteUrl}/services/${s.slug}): ${s.summary}`).join("\n")}
- [Areas served](${siteUrl}/areas): York, PA and the surrounding towns and counties
- [FAQ](${siteUrl}/faq): common questions about services, pricing, local SEO and AEO
- [Work](${siteUrl}/work): selected projects
- [About ${site.owner}](${siteUrl}/about): the person behind Agency Zero
- [Contact](${siteUrl}/contact): get in touch

## Full text
- [Complete plain-text version](${siteUrl}/llms-full.txt)
`;
}

export function llmsFull(): string {
  const serviceText = services
    .map((s) => {
      const page = servicePages[s.slug];
      return `### ${page.title}\n${shortAnswers[s.slug]}\n\n${page.intro}\n\nIncludes: ${page.includes.map((i) => i.title).join("; ")}.\nURL: ${siteUrl}/services/${s.slug}`;
    })
    .join("\n\n");
  const faqText = siteFaqs
    .flatMap((g) => g.items)
    .map((f) => `**${f.q}**\n${f.a}`)
    .join("\n\n");
  const areaText = areasByCounty()
    .map(([county, list]) => `- ${county}: ${list.map((a) => a.name).join(", ")}`)
    .join("\n");

  return `# ${site.name}: full overview

${site.name} is an agency based in York, PA and run by ${site.owner}. One person designs, builds and manages each project. Services: custom software and CRMs, websites, SEO and AI-search optimization (AEO), Meta ads, social media management, video and content production, and consulting or coaching where it fits.

Contact: ${site.email}
Website: ${siteUrl}

## Services
${serviceText}

## Where Agency Zero works (in person)
${areaText}
In-person work is available in the York, PA area and nearby. Most services are delivered remotely, so businesses outside Pennsylvania can also work with ${site.name}.

## Frequently asked questions
${faqText}
`;
}
