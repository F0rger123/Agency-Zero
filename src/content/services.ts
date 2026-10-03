import type { ServiceSlug } from "@/lib/site-config";

/**
 * Long-form copy for /services/<slug>. Written to be useful rather than
 * keyword-stuffed, and to make no guarantees (no rankings, no revenue claims).
 * TODO(content): the owner should review wording, add pricing approach and real
 * examples, and replace anything that doesn't match how the work is delivered.
 */
export type ServicePage = {
  slug: ServiceSlug;
  title: string;
  metaDescription: string;
  headline: string;
  intro: string;
  audience: string[];
  includes: { title: string; body: string }[];
  process: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const servicePages: Record<ServiceSlug, ServicePage> = {
  software: {
    slug: "software",
    title: "Custom software & CRMs",
    metaDescription:
      "Custom CRMs, internal tools and workflow automation built around how your business actually runs — not the other way around.",
    headline: "Software built around your business, not the reverse.",
    intro:
      "Off-the-shelf tools force you to bend your process to their screens. We design and build the system your team actually needs: your pipeline, your jobs, your invoices, your reporting — in one place, with the automations that remove the repetitive work.",
    audience: [
      "Teams running on spreadsheets, inboxes and five disconnected apps",
      "Service businesses who quote, schedule, deliver and invoice by hand",
      "Agencies and consultancies with a process no template matches",
      "Owners who want one dashboard of what is true right now",
    ],
    includes: [
      { title: "Custom CRM", body: "Clients, contacts, deals, notes, files and communications structured the way you sell and deliver." },
      { title: "Quotes → projects → invoices", body: "One connected flow from proposal to payment, with signed contracts and a clear audit trail." },
      { title: "Workflow automation", body: "Reminders, status changes, onboarding steps and follow-ups that happen without anyone remembering to do them." },
      { title: "Dashboards & reporting", body: "Revenue, workload, pipeline and the numbers you actually run the business on." },
      { title: "Integrations", body: "Calendars, accounting, payments and ad platforms connected where it makes sense." },
      { title: "Secure by design", body: "Role-based access, private data storage and sensible defaults from the first release." },
    ],
    process: [
      { title: "Map the workflow", body: "We sit with how work really moves through your business and find the friction." },
      { title: "Design the system", body: "Screens, data and automations designed together and agreed before building." },
      { title: "Build in slices", body: "Working software every few weeks, so you use it and shape it as it grows." },
      { title: "Launch & support", body: "Migration, training and ongoing improvement as the business changes." },
    ],
    faqs: [
      { q: "Why not just use an existing CRM?", a: "Often you should. We build custom when your process is genuinely different, when you are stitching several tools together, or when the cost of bending to someone else's software is higher than owning your own." },
      { q: "Do I own the software?", a: "That is agreed up front in the project terms. The aim is that you are never locked in to us." },
      { q: "How long does it take?", a: "A focused first version can be usable in weeks. Larger systems are delivered in stages so value arrives early." },
      { q: "Can it connect to the tools I already use?", a: "Usually yes. We scope integrations during discovery so there are no surprises." },
    ],
  },

  websites: {
    slug: "websites",
    title: "Website design",
    metaDescription:
      "Custom-designed, fast, responsive websites with motion, conversion thinking and SEO foundations built in.",
    headline: "A website that carries the standard of the business behind it.",
    intro:
      "Your site is judged in seconds. We design and engineer it from scratch — no templates — so it looks like you, loads quickly on any device, and guides visitors toward getting in touch or buying.",
    audience: [
      "Businesses whose website no longer reflects the quality of their work",
      "Brands launching or repositioning who need a strong first impression",
      "Service companies that need a site to generate enquiries, not just exist",
      "Teams that want a site they can update without calling a developer",
    ],
    includes: [
      { title: "Custom design", body: "Typography, layout and motion designed around your brand and audience." },
      { title: "Responsive engineering", body: "Built and tested for phones, tablets and large displays, with accessibility in mind." },
      { title: "Conversion-focused structure", body: "Clear messaging, calls to action and forms arranged to turn attention into enquiries." },
      { title: "SEO foundations", body: "Clean markup, fast loading, sensible metadata and structure so search engines can understand the site." },
      { title: "Content & imagery guidance", body: "Direction on copy, photography and video, and production where needed." },
      { title: "Hosting & handover", body: "Reliable hosting, analytics and documentation so you are never left guessing." },
    ],
    process: [
      { title: "Strategy", body: "Audience, goals and the message the site has to land." },
      { title: "Design", body: "Concepts, then a refined design system shown in context." },
      { title: "Build", body: "Engineered for speed, accessibility and easy editing." },
      { title: "Launch & improve", body: "Careful release, measurement, and iteration once real visitors arrive." },
    ],
    faqs: [
      { q: "Do you use templates?", a: "No. Every site is designed and built for the business it represents." },
      { q: "Will it be easy to update?", a: "Yes — we agree how you will manage content during scoping and build it to suit." },
      { q: "Is SEO included?", a: "Technical and on-page SEO foundations are part of every build. Ongoing SEO is a separate service." },
      { q: "Can you add a booking, shop or customer portal?", a: "Yes. Those are custom features we scope with you." },
    ],
  },

  seo: {
    slug: "seo",
    title: "SEO",
    metaDescription:
      "SEO for Google, AI search and local discovery: technical foundations, local presence and content that answers real searches.",
    headline: "Be easier to find — and easier to choose.",
    intro:
      "People look for businesses in Google, in AI assistants and on maps. We improve the technical health, local presence and content that determine whether you show up — and whether what they find makes them call you. We never promise rankings; we do the work that earns visibility.",
    audience: [
      "Local and service businesses who rely on being found nearby",
      "Companies whose site is invisible for the things they actually sell",
      "Brands who want to show up in AI-generated answers as well as search results",
      "Teams that need clear reporting instead of vanity metrics",
    ],
    includes: [
      { title: "Technical audit & fixes", body: "Crawlability, speed, structure and errors that quietly hold a site back." },
      { title: "On-page optimisation", body: "Titles, headings, content and internal links aligned to how people search." },
      { title: "Local SEO", body: "Google Business Profile, citations, reviews and location pages for local discovery." },
      { title: "Content that answers questions", body: "Pages and articles built around real customer questions — useful to people and to AI systems." },
      { title: "Authority building", body: "Earning credible mentions and links without shortcuts that risk penalties." },
      { title: "Reporting you can read", body: "What changed, what it did, and what we do next — in plain language." },
    ],
    process: [
      { title: "Audit", body: "Where you stand today, and what is actually holding you back." },
      { title: "Fix the foundations", body: "Technical and on-page work that unlocks everything else." },
      { title: "Build presence", body: "Local, content and authority work, steadily and honestly." },
      { title: "Measure & refine", body: "Reporting, learning and adjusting month by month." },
    ],
    faqs: [
      { q: "Can you guarantee first-page rankings?", a: "No — and be wary of anyone who does. Search engines are not ours to control. We commit to the work, the transparency and the reporting." },
      { q: "How long does SEO take?", a: "Technical fixes can help quickly; competitive terms take months. We will give you an honest expectation after the audit." },
      { q: "What about AI search?", a: "Clear structure, credible sources and genuinely helpful content help in both traditional and AI-driven search. We build for both." },
      { q: "Do you do local SEO?", a: "Yes — Google Business Profile, citations and local content are core to the service." },
    ],
  },

  "meta-ads": {
    slug: "meta-ads",
    title: "Meta ads",
    metaDescription:
      "Facebook and Instagram advertising: creative built for the feed, clean tracking and steady testing.",
    headline: "Paid social that is built, tracked and improved properly.",
    intro:
      "Good Meta advertising is mostly creative, measurement and patience. We build the offer, the creative and the tracking, then test and refine so spend goes to what works. No guarantees about results — just disciplined work and honest reporting.",
    audience: [
      "Businesses ready to put budget behind paid social",
      "Brands whose ads look and feel off-brand or tired",
      "Teams without reliable tracking of leads and sales",
      "Owners who want to understand what their ad spend is doing",
    ],
    includes: [
      { title: "Strategy & offer", body: "Audience, positioning and the offer that gives an ad something to say." },
      { title: "Creative production", body: "Static, carousel and short-form video creative designed for the feed." },
      { title: "Campaign build", body: "Structure, targeting, placements and budgets set up cleanly." },
      { title: "Tracking & attribution", body: "Pixel, conversions and lead tracking you can trust." },
      { title: "Testing & optimisation", body: "Ongoing creative and audience testing with clear decisions." },
      { title: "Reporting", body: "Spend, leads and cost per result explained without jargon." },
    ],
    process: [
      { title: "Plan", body: "Goals, audience, offer and measurement agreed first." },
      { title: "Create", body: "Creative made to stop the scroll and fit your brand." },
      { title: "Launch", body: "Clean build with tracking verified before spend." },
      { title: "Optimise", body: "Weekly learning, creative refresh and budget decisions." },
    ],
    faqs: [
      { q: "What budget do I need?", a: "Enough to learn within a reasonable time. We will suggest a realistic starting range after understanding your goals." },
      { q: "Do you make the creative?", a: "Yes — design, copy and video, so ads and brand stay consistent." },
      { q: "Can you guarantee leads or sales?", a: "No. We control the quality of the work and the testing discipline, not the market." },
      { q: "Do I keep the ad account?", a: "Yes. The account and its data stay yours." },
    ],
  },

  social: {
    slug: "social",
    title: "Social media",
    metaDescription:
      "Organic social media management: a consistent, on-brand presence with planned content and community care.",
    headline: "A consistent presence that doesn't become your second job.",
    intro:
      "Showing up regularly and sounding like yourself builds trust. We plan, create, schedule and publish your organic content, and look after the conversation around it, so your channels stay active and on-brand.",
    audience: [
      "Businesses who know they should post but don't have the time",
      "Brands whose channels look inconsistent or dormant",
      "Teams who want content planned around real goals",
      "Owners who need someone to keep the conversation going",
    ],
    includes: [
      { title: "Content strategy", body: "Themes, formats and a calendar tied to what your business needs." },
      { title: "Content creation", body: "Graphics, short-form video and copy produced in your brand voice." },
      { title: "Scheduling & publishing", body: "Consistent posting across the platforms that matter to you." },
      { title: "Community management", body: "Replies, comments and messages handled with care." },
      { title: "Approvals", body: "A simple review step so nothing goes live without your say." },
      { title: "Reporting", body: "Reach, engagement and what to do more (or less) of." },
    ],
    process: [
      { title: "Understand", body: "Brand, audience and what success looks like." },
      { title: "Plan", body: "A content calendar you can see and approve." },
      { title: "Produce", body: "Content created in batches, consistent in look and voice." },
      { title: "Publish & learn", body: "Posting, engagement and monthly review." },
    ],
    faqs: [
      { q: "Which platforms do you cover?", a: "Typically Instagram, Facebook, LinkedIn, TikTok and YouTube Shorts — chosen for where your customers are." },
      { q: "Do I approve posts?", a: "Yes. You see the plan and the content before it is published." },
      { q: "Do you need access to my accounts?", a: "We use proper delegated access so you keep ownership." },
      { q: "Can this pair with video production?", a: "Very well — see Video & content." },
    ],
  },

  content: {
    slug: "content",
    title: "Video & content",
    metaDescription:
      "Short-form video, on-location shoots and campaign creative that feeds every channel.",
    headline: "Content worth stopping for — produced as a pipeline, not a scramble.",
    intro:
      "Strong content powers everything else: ads, social, your website. We handle the whole production — ideas, scripting, filming, editing and delivery — in organised batches, so you have a steady supply of work that looks like it belongs to your brand.",
    audience: [
      "Brands who need a steady flow of short-form video",
      "Businesses launching a campaign or new offer",
      "Teams who want ads and organic content to share one creative engine",
      "Owners who want filming and editing handled end to end",
    ],
    includes: [
      { title: "Concepts & scripting", body: "Ideas and scripts built around what your audience cares about." },
      { title: "Shoots", body: "On-location or studio filming, planned to capture a month of content at once." },
      { title: "Editing & motion", body: "Short-form edits, captions and motion design made for each platform." },
      { title: "Campaign creative", body: "Ad-ready assets in the formats each platform needs." },
      { title: "Photography", body: "Brand and product imagery for site, social and ads." },
      { title: "Asset library", body: "Organised deliverables you can reuse across channels." },
    ],
    process: [
      { title: "Plan", body: "Concepts, scripts and a shoot plan agreed ahead of the day." },
      { title: "Shoot", body: "Efficient filming that captures a lot in a little time." },
      { title: "Edit", body: "Fast turnaround, with a review step before anything is final." },
      { title: "Deliver", body: "Platform-ready files and a library to pull from." },
    ],
    faqs: [
      { q: "Where do you shoot?", a: "At your location or in a studio, whichever suits the content." },
      { q: "How much content comes from one shoot?", a: "That depends on the plan — we design shoots to produce weeks of content." },
      { q: "Can you work with footage I already have?", a: "Yes. We edit and repurpose existing material too." },
      { q: "Do you handle posting?", a: "We can — see Social media." },
    ],
  },
};
