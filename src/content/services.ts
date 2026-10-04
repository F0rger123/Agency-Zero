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
  faqs: { q: string; a: string; bullets?: string[] }[];
};

export const servicePages: Record<ServiceSlug, ServicePage> = {
  software: {
    slug: "software",
    title: "Custom software & CRMs",
    metaDescription:
      "Custom CRMs, internal tools and workflow automation built around how your business actually runs — not the other way around.",
    headline: "Software built around your business, not the reverse.",
    intro:
      "Off-the-shelf tools force you to bend your process to their screens. I design and build the system your team actually needs: your pipeline, your jobs, your invoices, your reporting — in one place, with the automations that remove the repetitive work.",
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
      { title: "Map the workflow", body: "I sit with how work really moves through your business and find the friction." },
      { title: "Design the system", body: "Screens, data and automations designed together and agreed before building." },
      { title: "Build in slices", body: "Working software every few weeks, so you use it and shape it as it grows." },
      { title: "Launch & support", body: "Migration, training and ongoing improvement as the business changes." },
    ],
    faqs: [
      { q: "Why not just use an existing CRM?", a: "Often you should. Off-the-shelf tools are cheaper and faster when your process is ordinary. Custom software starts to make sense when your process is genuinely different, when you are stitching several tools together with spreadsheets, or when the cost of bending your work to someone else's screens keeps growing. I will tell you honestly which side of that line you are on after a short discovery conversation.", bullets: ["Good reasons to go custom: unusual workflow, several tools that do not talk to each other, or a CRM your team avoids using", "Good reasons not to: a standard sales pipeline and a team happy with a mainstream tool"] },
      { q: "Do I own the software?", a: "Ownership and hand-over are agreed in writing before work starts. The aim is that you are never locked in to me: the code is documented, the data stays in an account you control, and another developer could pick it up. If you want me to host and maintain it, that is a separate, clearly priced option rather than a hidden dependency." },
      { q: "How long does it take, and what does it cost?", a: "A focused first version, such as one pipeline, the key screens and the main automations, can be usable in a few weeks. Larger systems are delivered in stages so value arrives early and you can change direction as you learn. I give a fixed scope and price for each stage after discovery, so you know what you are paying for before anything is built." },
      { q: "Can it connect to the tools I already use?", a: "Usually yes. Common connections include accounting, email, calendars, payments such as Stripe, forms and spreadsheets. I list every integration during discovery and flag any that depend on a third party's limits, so there are no surprises midway through.", bullets: ["Typical examples: Stripe, Google Workspace, accounting software, email and SMS, website forms"] },
      { q: "What happens if my process changes later?", a: "That is the point of building it around you. Because the system is yours, stages, fields and automations can be adjusted without waiting for a vendor roadmap. Small changes after launch are quick, and larger ones are scoped like any other stage." },
      { q: "Is my data safe?", a: "Access is limited to the people you choose, data is stored in a private database, and backups are part of the setup. I design permissions from the first release rather than adding them later, and I will explain plainly where your data lives and who can see it." },
    ],
  },

  websites: {
    slug: "websites",
    title: "Website design",
    metaDescription:
      "Custom-designed, fast, responsive websites with motion, conversion thinking and SEO foundations built in.",
    headline: "A website that carries the standard of the business behind it.",
    intro:
      "Your site is judged in seconds. I design and engineer it from scratch — no templates — so it looks like you, loads quickly on any device, and guides visitors toward getting in touch or buying.",
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
      { q: "Do you use templates?", a: "No. Every site is designed and built for the business it represents, starting from your customers and what you need them to do: call, book, enquire or buy. You will see a design direction in context before the full build, so the look is agreed early." },
      { q: "Will it be easy to update?", a: "Yes. During scoping we agree who will edit the site and how often, then I build the editing to suit, from simple text and image changes to a full content system if you publish regularly. You will get a short walkthrough and written notes so you are not dependent on me for everyday changes." },
      { q: "Is SEO included?", a: "The technical and on-page foundations are part of every build: clear page titles and descriptions, sensible headings, fast loading, mobile-friendly layouts, structured data and a sitemap. Ongoing SEO work such as local profiles, content and links is a separate service, which you can add whenever it suits.", bullets: ["Included: titles, descriptions, headings, speed, structured data, sitemap", "Separate: ongoing content, link building and local SEO"] },
      { q: "Can you add a booking system, shop or customer portal?", a: "Yes. Those are custom features I scope with you, and they can connect to your existing tools such as payments, calendars and email. Because I also build CRMs, enquiries and bookings can flow straight into a system you control." },
      { q: "How long does a website take?", a: "A focused site of a handful of pages is typically a few weeks from approved design to launch. Larger sites or custom features take longer, and I give you a timeline in writing with dates for each stage. The biggest factor is usually how quickly content and feedback arrive, so I will tell you what I need and when." },
      { q: "What do I need to provide?", a: "Your logo and brand colors if you have them, a clear idea of what the site should achieve, and the key facts about your services. I can write the copy and source images with you. If you do not have a brand yet, I can propose a simple direction as part of the design stage." },
    ],
  },

  seo: {
    slug: "seo",
    title: "SEO",
    metaDescription:
      "SEO for Google, AI search and local discovery: technical foundations, local presence and content that answers real searches.",
    headline: "Be easier to find — and easier to choose.",
    intro:
      "People look for businesses in Google, in AI assistants and on maps. I improve the technical health, local presence and content that determine whether you show up — and whether what they find makes them call you. I never promise rankings; I do the work that earns visibility.",
    audience: [
      "Local and service businesses who rely on being found nearby",
      "Companies whose site is invisible for the things they actually sell",
      "Brands who want to show up in AI-generated answers as well as search results",
      "Teams that need clear reporting instead of vanity metrics",
    ],
    includes: [
      { title: "Technical audit & fixes", body: "Crawlability, speed, structure and errors that quietly hold a site back." },
      { title: "On-page optimization", body: "Titles, headings, content and internal links aligned to how people search." },
      { title: "Local SEO", body: "Google Business Profile, citations, reviews and location pages for local discovery." },
      { title: "Content that answers questions", body: "Pages and articles built around real customer questions — useful to people and to AI systems." },
      { title: "Authority building", body: "Earning credible mentions and links without shortcuts that risk penalties." },
      { title: "Reporting you can read", body: "What changed, what it did, and what I do next — in plain language." },
    ],
    process: [
      { title: "Audit", body: "Where you stand today, and what is actually holding you back." },
      { title: "Fix the foundations", body: "Technical and on-page work that unlocks everything else." },
      { title: "Build presence", body: "Local, content and authority work, steadily and honestly." },
      { title: "Measure & refine", body: "Reporting, learning and adjusting month by month." },
    ],
    faqs: [
      { q: "Can you guarantee first-page rankings?", a: "No, and be wary of anyone who does. Search engines decide rankings and no outside party controls them. What I commit to is the work, the transparency and the reporting: a clear audit, fixes done properly, and a plain-language report of what changed and what it did." },
      { q: "How long does SEO take?", a: "Technical fixes can help within weeks. Competitive searches usually take months, and local searches often move faster than national ones. After the audit I give you an honest expectation for your market rather than a promise, and we review it as results come in." },
      { q: "What about AI search?", a: "AI tools tend to quote pages that are clear, well structured and genuinely helpful, from sources that look credible. The same work that helps in Google, such as plain answers to real customer questions, good structure and consistent business details, helps you get cited by AI assistants too. I build for both.", bullets: ["Clear pages that answer real questions", "Consistent business details across the web", "Reviews and credible mentions"] },
      { q: "Do you do local SEO?", a: "Yes. Local search is often the fastest win for businesses that serve an area. It covers your Google Business Profile, accurate listings, reviews, location pages and content about the places you work." },
      { q: "What will I get each month?", a: "A short report in plain English: what was done, what changed in visibility and enquiries, and what happens next. No dashboards full of numbers that do not matter. If you want a call to talk it through, that is part of the service." },
      { q: "Do I need a new website for SEO?", a: "Not always. Many sites can be improved in place. If the site is slow, hard to edit or built in a way that limits search visibility, I will say so and show you what a rebuild would change and what it would not." },
    ],
  },

  "meta-ads": {
    slug: "meta-ads",
    title: "Meta ads",
    metaDescription:
      "Facebook and Instagram advertising: creative built for the feed, clean tracking and steady testing.",
    headline: "Paid social that is built, tracked and improved properly.",
    intro:
      "Good Meta advertising is mostly creative, measurement and patience. I build the offer, the creative and the tracking, then test and refine so spend goes to what works. No guarantees about results — just disciplined work and honest reporting.",
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
      { title: "Testing & optimization", body: "Ongoing creative and audience testing with clear decisions." },
      { title: "Reporting", body: "Spend, leads and cost per result explained without jargon." },
    ],
    process: [
      { title: "Plan", body: "Goals, audience, offer and measurement agreed first." },
      { title: "Create", body: "Creative made to stop the scroll and fit your brand." },
      { title: "Launch", body: "Clean build with tracking verified before spend." },
      { title: "Optimise", body: "Weekly learning, creative refresh and budget decisions." },
    ],
    faqs: [
      { q: "What budget do I need?", a: "Enough to learn within a reasonable time. Ads need some spend to show what works, and the right amount depends on your market and goal. After understanding your goals I suggest a realistic starting range, and I would rather start modestly and scale what works than overspend on guesses." },
      { q: "Do you make the creative?", a: "Yes. Design, copy and short video, so ads and brand stay consistent. Each campaign starts with the offer, the hook and the call to action, then several creative variants are tested against each other so you learn which message lands.", bullets: ["Static images and carousels", "Short-form video", "Copy, offer and call to action"] },
      { q: "Can you guarantee leads or sales?", a: "No. I control the quality of the work, the tracking and the testing discipline, not the market or your offer's appeal to customers. What you get is clear measurement, steady testing and honest reporting, so decisions rest on data." },
      { q: "Do I keep the ad account?", a: "Yes. The ad account, the pixel and the data stay yours. I work through delegated access, so you can see everything and remove my access at any time." },
      { q: "How will I know it is working?", a: "Tracking is set up before launch so enquiries, calls or sales are recorded properly. You get a regular report that shows spend, results, cost per result and what I am changing next, in plain language." },
      { q: "How is this different from boosting a post?", a: "Boosting is a quick way to show one post to more people. Campaigns let me choose who sees the ad, test different offers and creative, track real results and stop what does not work. That usually means less wasted spend." },
    ],
  },

  social: {
    slug: "social",
    title: "Social media",
    metaDescription:
      "Organic social media management: a consistent, on-brand presence with planned content and community care.",
    headline: "A consistent presence that doesn't become your second job.",
    intro:
      "Showing up regularly and sounding like yourself builds trust. I plan, create, schedule and publish your organic content, and look after the conversation around it, so your channels stay active and on-brand.",
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
      { q: "Which platforms do you cover?", a: "Typically Instagram and Facebook, and where it suits the business also TikTok, LinkedIn and YouTube Shorts. I recommend platforms by where your customers actually spend time, not by what is fashionable, and it is fine to start with one." },
      { q: "Do I approve posts?", a: "Yes. You see the plan and the content before it is published, and you can ask for changes. Once we know each other's taste you can choose lighter approvals, but nothing goes out without your agreement." },
      { q: "Do you need access to my accounts?", a: "I use proper delegated access, such as Meta Business access, so you keep ownership. I never need your passwords, and you can remove my access whenever you like." },
      { q: "How much content do I get?", a: "That depends on the plan, but it is agreed in advance as a clear number of posts, reels or stories per month. Content is planned as a calendar, so you can see what is coming and why." },
      { q: "Can this pair with video production?", a: "Very well. A shoot day can produce weeks of short videos and photos, which are then edited and scheduled across your channels. See Video and content for how that works." },
      { q: "Will you reply to comments and messages?", a: "I can. Community replies keep a business feeling alive, and I can handle comments and routine messages in your tone while passing anything important or sensitive back to you." },
    ],
  },

  content: {
    slug: "content",
    title: "Video & content",
    metaDescription:
      "Short-form video, on-location shoots and campaign creative that feeds every channel.",
    headline: "Content worth stopping for — produced as a pipeline, not a scramble.",
    intro:
      "Strong content powers everything else: ads, social, your website. I handle the whole production — ideas, scripting, filming, editing and delivery — in organized batches, so you have a steady supply of work that looks like it belongs to your brand.",
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
      { q: "Where do you shoot?", a: "At your location or in a studio, whichever suits the content. For trades, venues and shops, shooting on site usually looks most authentic. I plan the shot list beforehand so the day runs efficiently." },
      { q: "How much content comes from one shoot?", a: "That depends on the plan, but shoots are designed to produce weeks of content: short vertical videos, photos and clips for ads, social and your website. I tell you the expected output before you book." },
      { q: "Can you work with footage I already have?", a: "Yes. I can edit and repurpose existing video and photos, add captions and branding, and cut versions for each platform. Phone footage is often a good starting point if it is shot with a few simple guidelines." },
      { q: "Do you handle posting?", a: "I can. Posting and community management are part of the Social media service, and the two work best together. You can also take the finished files and post them yourself." },
      { q: "What does the process look like?", a: "First a short planning call to agree goals and ideas, then a shot list, then the shoot, then editing and review rounds, then delivery in the formats you need. You see drafts before anything is final." },
      { q: "Do you do voiceover, music and captions?", a: "Captions are standard because most people watch with the sound off. Music is licensed for commercial use, and voiceover can be recorded where it helps the message." },
    ],
  },
};
