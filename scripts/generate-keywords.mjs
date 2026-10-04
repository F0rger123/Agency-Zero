// Generates the local keyword universe for Agency Zero (York, PA and surrounding areas).
//   node scripts/generate-keywords.mjs
// Reads src/content/seo-data.json and writes docs/seo/keywords.csv (every keyword, with cluster, tier, target page and
// intent) and docs/seo/KEYWORDS.md (the prioritised summary). The CSV is a research list for the owner, Google Business
// Profile, ads and content planning. It is NOT pasted into the site: stuffing hundreds of terms onto pages gets sites
// demoted, so the live pages use a natural subset (see docs/seo/SEO_PLAN.md).
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../src/content/seo-data.json", import.meta.url), "utf8"));
const rows = new Map();
const add = (keyword, cluster, pattern, place, tier, page, intent) => {
  const key = keyword.toLowerCase().replace(/\s+/g, " ").trim();
  if (!rows.has(key)) rows.set(key, { keyword: key, cluster, pattern, place, tier, page, intent });
};
const pa = (area) => (area.state === "MD" ? "md" : "pa");

for (const s of data.services) {
  const term = s.term;
  // 1. Generic, no place (tier 4: broad, competitive)
  add(term, s.cluster, "generic", "", 4, s.page, "commercial");
  for (const m of data.modifiers) {
    add(m === "near me" || m === "cost" || m === "pricing" || m === "packages" || m === "quote" || m === "free consultation" || m === "company" || m === "services" || m === "agency" || m === "consultant" || m === "freelance" || m === "hire" ? (m === "hire" ? `hire a ${term}` : `${term} ${m}`) : `${m} ${term}`, s.cluster, "modifier", "", m === "near me" ? 1 : 4, s.page, m === "near me" ? "local" : "commercial");
  }
  // 2. Place + service
  for (const a of data.areas) {
    const p = a.name.toLowerCase();
    const st = pa(a);
    const tier = a.tier;
    add(`${term} ${p} ${st}`, s.cluster, "service+place", a.name, tier, s.page, "local");
    add(`${term} in ${p}, ${st}`, s.cluster, "service+place", a.name, tier, s.page, "local");
    add(`${term} near ${p} ${st}`, s.cluster, "service+place", a.name, tier, s.page, "local");
    add(`${p} ${st} ${term}`, s.cluster, "service+place", a.name, tier, s.page, "local");
    if (a.tier <= 2) {
      add(`best ${term} in ${p} ${st}`, s.cluster, "best+service+place", a.name, tier, s.page, "commercial-local");
      add(`affordable ${term} ${p} ${st}`, s.cluster, "modifier+place", a.name, tier, s.page, "commercial-local");
      add(`${term} ${p} ${st} cost`, s.cluster, "cost+place", a.name, tier, s.page, "pricing");
      add(`small business ${term} ${p} ${st}`, s.cluster, "modifier+place", a.name, tier, s.page, "commercial-local");
    }
  }
  // 3. Regions
  for (const r of data.regions) {
    add(`${term} ${r.toLowerCase()}`, s.cluster, "service+region", r, 2, s.page, "local");
    add(`${term} in ${r.toLowerCase()}`, s.cluster, "service+region", r, 2, s.page, "local");
    add(`best ${term} ${r.toLowerCase()}`, s.cluster, "service+region", r, 2, s.page, "commercial-local");
  }
  // 4. Questions (answer-engine / voice style)
  for (const q of data.questions) {
    for (const a of data.areas.filter((x) => x.tier === 1)) {
      add(q.replaceAll("{service}", term).replaceAll("{place}", `${a.name}, PA`), s.cluster, "question", a.name, 1, s.page, "question");
    }
    if (!q.includes("{place}")) add(q.replaceAll("{service}", term), s.cluster, "question", "", 4, s.page, "question");
  }
}

// 5. Industry-specific long tail: who the service is for, with and without York, PA
const industryServices = data.services.filter((s) => ["website designer", "web designer", "small business website", "CRM for small business", "custom CRM", "SEO services", "local SEO", "social media manager", "Meta ads manager", "Facebook ads manager", "lead generation", "video marketing", "workflow automation", "digital marketing agency"].includes(s.term));
for (const s of industryServices) {
  for (const industry of data.industries) {
    add(`${s.term} for ${industry}`, s.cluster, "service+industry", "", 4, s.page, "commercial");
    add(`${s.term} for ${industry} in york pa`, s.cluster, "service+industry+place", "York", 1, s.page, "commercial-local");
    add(`${industry} ${s.term} york pa`, s.cluster, "service+industry+place", "York", 1, s.page, "commercial-local");
    add(`${s.term} for ${industry} central pa`, s.cluster, "service+industry+place", "Central Pennsylvania", 2, s.page, "commercial-local");
  }
}

const all = [...rows.values()].sort((a, b) => a.tier - b.tier || a.cluster.localeCompare(b.cluster) || a.keyword.localeCompare(b.keyword));
const csv = ["keyword,cluster,pattern,place,tier,target_page,intent", ...all.map((r) => [r.keyword, r.cluster, r.pattern, r.place, r.tier, r.page, r.intent].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
writeFileSync(new URL("../docs/seo/keywords.csv", import.meta.url), csv + "\n");

const count = (fn) => all.filter(fn).length;
const byCluster = {};
for (const r of all) byCluster[r.cluster] = (byCluster[r.cluster] || 0) + 1;
const sample = (cluster, tier, n) => all.filter((r) => r.cluster === cluster && r.tier === tier && ["service+place", "best+service+place", "modifier"].includes(r.pattern)).slice(0, n).map((r) => `- ${r.keyword}`).join("\n");
const clusterNames = { websites: "Website design", software: "Custom software, apps and CRMs", seo: "SEO and AI search", social: "Social media management", "meta-ads": "Meta ads and lead generation", content: "Video and content", agency: "Digital marketing (whole-agency)" };

const md = `# Agency Zero — local keyword plan (York, PA and surrounding areas)

Generated by \`node scripts/generate-keywords.mjs\` from \`src/content/seo-data.json\`. Re-run after editing that file.

**${all.length.toLocaleString()} keywords** in [\`keywords.csv\`](./keywords.csv) (columns: keyword, cluster, pattern, place, tier, target_page, intent).

| Tier | Meaning | Keywords |
|---|---|---|
| 1 | York, PA itself, "near me", and York-specific industry and question terms. Highest local intent. | ${count((r) => r.tier === 1).toLocaleString()} |
| 2 | York County towns and regional names (Hanover, Red Lion, Dallastown, Central PA...). | ${count((r) => r.tier === 2).toLocaleString()} |
| 3 | Nearby cities (Harrisburg, Lancaster, Gettysburg, Carlisle...). | ${count((r) => r.tier === 3).toLocaleString()} |
| 4 | Broad terms with no place. Very competitive; they come as a by-product of the rest. | ${count((r) => r.tier === 4).toLocaleString()} |

## How these are used (and not used)

- They are **research and targeting data**: for the Google Business Profile services list, Meta/Google ad audiences and
  negative keywords, content topics, directory listings, and for checking Search Console for what you already show up for.
- The live site uses a **natural subset** in titles, headings, short answers, FAQs and the service-area page.
  Pasting thousands of phrases into pages ("keyword stuffing") is against Google's spam policies and hurts rankings.
  The \`keywords\` meta tag is ignored by Google and is not used.
- A phrase being on the list does not mean a page ranks for it. Rankings come from useful pages, a verified local
  presence, links/citations and reviews over time. Nobody can promise a position.

## Clusters

${Object.entries(byCluster).map(([c, n]) => `- **${clusterNames[c] || c}** — ${n.toLocaleString()} keywords`).join("\n")}

## Highest-priority examples (tier 1, York, PA)

${Object.keys(clusterNames).map((c) => `### ${clusterNames[c]}\n${sample(c, 1, 14)}`).join("\n\n")}

## Question-style searches (voice and AI answers)

${all.filter((r) => r.pattern === "question" && r.tier === 1).slice(0, 40).map((r) => `- ${r.keyword}?`).join("\n")}

## Suggested ad negatives (Meta/Google)

free, jobs, careers, salary, course, tutorial, template download, DIY, open source, wordpress theme, wix, squarespace login, internship, "how to become".
`;
writeFileSync(new URL("../docs/seo/KEYWORDS.md", import.meta.url), md);
console.log(`${all.length} keywords`);
