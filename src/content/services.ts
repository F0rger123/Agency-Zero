import type { ServiceSlug } from "@/lib/site-config";

/**
 * Long-form copy for /services/<slug>. Written to be useful rather than keyword-stuffed, and to make no guarantees
 * (no rankings, no revenue claims). Voice: direct, plain, first person where it is Luke speaking.
 * TODO(content): the owner should review wording, add pricing approach and real examples.
 */
export type ServicePage = {
  slug: ServiceSlug;
  title: string;
  /** Closing call-to-action headline for the page. */
  ctaTitle: string;
  /** Where the work happens: in person around York vs remote. Shown on the page and used in structured data. */
  where: string;
  metaDescription: string;
  headline: string;
  intro: string;
  audience: string[];
  includes: { title: string; body: string }[];
  process: { title: string; body: string }[];
  faqs: { q: string; a: string; bullets?: string[] }[];
};

const REMOTE = "Delivered remotely, so your location doesn't matter. In-person meetings are available around the York, PA area.";

export const servicePages: Record<ServiceSlug, ServicePage> = {
  software: {
    slug: "software",
    title: "Custom software & CRMs",
    ctaTitle: "Need software that fits how you work?",
    where: REMOTE,
    metaDescription:
      "Custom CRMs, internal tools, customer portals and automation, built around how your business works.",
    headline: "Software built around your business, not the other way around.",
    intro:
      "Off-the-shelf tools make you bend your process to their screens. I design and build the system your team needs instead: your pipeline, your jobs, your quotes and invoices, your reporting, in one place, with the automation that removes the repetitive work.",
    audience: [
      "Teams running on spreadsheets, inboxes and five disconnected apps",
      "Service businesses that quote, schedule, deliver and invoice by hand",
      "Agencies and consultancies with a process no template fits",
      "Owners who want one dashboard of what is true right now",
    ],
    includes: [
      { title: "Custom CRM", body: "Clients, contacts, deals, notes, files and conversations organized the way you sell and deliver." },
      { title: "Quotes, projects and invoices", body: "One connected flow from proposal to payment, with signed contracts and a clear record of what was agreed." },
      { title: "Automation", body: "Reminders, status changes, onboarding steps and follow-ups that happen without anyone remembering to do them." },
      { title: "Dashboards and reporting", body: "Revenue, workload, pipeline and the numbers you actually run the business on." },
      { title: "Customer portals and integrations", body: "Let clients see their own work, and connect payments, calendars, email and accounting where it makes sense." },
      { title: "Secure by design", body: "Role-based access, private data storage and sensible defaults from the first release." },
    ],
    process: [
      { title: "Map the workflow", body: "I look at how work really moves through your business and find where it gets stuck." },
      { title: "Design the system", body: "Screens, data and automation designed together and agreed before anything is built." },
      { title: "Build in slices", body: "Working software every few weeks, so you use it and shape it as it grows." },
      { title: "Launch and support", body: "Data migration, training, and improvements as the business changes." },
    ],
    faqs: [
      { q: "Why not just use an existing CRM?", a: "Often you should. Off-the-shelf tools are cheaper and faster when your process is ordinary. Custom software starts to make sense when your process is genuinely different, when you're stitching several tools together with spreadsheets, or when bending your work to someone else's screens keeps getting more expensive. After a short conversation I'll tell you honestly which side of that line you're on.", bullets: ["Good reasons to go custom: an unusual workflow, tools that don't talk to each other, or a CRM your team avoids", "Good reasons not to: a standard sales pipeline and a team that's happy with a mainstream tool"] },
      { q: "Do I own the software?", a: "Ownership and handover are agreed in writing before work starts. The goal is that you're never locked in: the code is documented, your data lives in an account you control, and another developer could pick it up. If you want me to host and maintain it, that's a separate, clearly priced option rather than a hidden dependency." },
      { q: "How long does it take, and what does it cost?", a: "A focused first version, such as one pipeline, the key screens and the main automations, can be usable in a few weeks. Bigger systems are delivered in stages so value arrives early and you can change direction as you learn. After discovery I give you a fixed scope and price for each stage, so you know what you're paying for before anything is built." },
      { q: "Can it connect to the tools I already use?", a: "Usually yes. Common connections include accounting, email, calendars, payments such as Stripe, forms and spreadsheets. I list every integration during discovery and flag any that depend on a third party's limits, so there are no surprises halfway through.", bullets: ["Typical examples: Stripe, Google Workspace, accounting software, email and SMS, website forms"] },
      { q: "What happens if my process changes later?", a: "That's the point of building it around you. Because the system is yours, stages, fields and automation can be changed without waiting for a vendor roadmap. Small changes after launch are quick, and bigger ones are scoped like any other stage." },
      { q: "Is my data safe?", a: "Access is limited to the people you choose, data is stored in a private database, and backups are part of the setup. I design permissions from the first release rather than adding them later, and I'll explain plainly where your data lives and who can see it." },
    ],
  },

  websites: {
    slug: "websites",
    title: "Websites",
    ctaTitle: "Need a website that does its job?",
    where: REMOTE,
    metaDescription:
      "Custom-designed, fast, mobile-friendly websites with clear calls to action and SEO built in.",
    headline: "A website that matches the quality of the business behind it.",
    intro:
      "Visitors judge your site in seconds. I design and build it from scratch, with no templates, so it looks like you, loads fast on any device, and makes it obvious how to call, book or buy.",
    audience: [
      "Businesses whose website no longer reflects the quality of their work",
      "New or repositioning brands that need a strong first impression",
      "Service companies that need a site to bring in inquiries, not just exist",
      "Teams that want to update the site themselves without calling a developer",
    ],
    includes: [
      { title: "Custom design", body: "Typography, layout and motion designed around your brand and your customers." },
      { title: "Built for every screen", body: "Tested on phones, tablets and large displays, with accessibility in mind." },
      { title: "A clear path to contact", body: "Messaging, buttons and forms arranged so a visitor knows what to do next." },
      { title: "SEO foundations", body: "Clean markup, fast loading, sensible titles and structure so search engines understand the site." },
      { title: "Content and imagery", body: "Direction on copy, photography and video, and production where you need it." },
      { title: "Hosting and handover", body: "Reliable hosting, analytics and written notes so you're never left guessing." },
    ],
    process: [
      { title: "Strategy", body: "Who the site is for, what it should get them to do, and the message it has to land." },
      { title: "Design", body: "A design direction shown in context before the full build." },
      { title: "Build", body: "Engineered for speed, accessibility and easy editing." },
      { title: "Launch and improve", body: "A careful release, then measurement and refinement once real visitors arrive." },
    ],
    faqs: [
      { q: "Do you use templates?", a: "No. Every site is designed and built for the business it represents, starting from your customers and what you want them to do: call, book, inquire or buy. You'll see a design direction in context before the full build, so the look is agreed early." },
      { q: "Will it be easy to update?", a: "Yes. During scoping we agree who will edit the site and how often, then I build the editing to suit, from simple text and image changes to a full content system if you publish regularly. You get a short walkthrough and written notes, so you're not dependent on me for everyday changes." },
      { q: "Is SEO included?", a: "The technical and on-page foundations are part of every build: clear page titles and descriptions, sensible headings, fast loading, mobile-friendly layouts, structured data and a sitemap. Ongoing SEO work such as local profiles, content and links is a separate service you can add whenever it suits.", bullets: ["Included: titles, descriptions, headings, speed, structured data, sitemap", "Separate: ongoing content, link building and local SEO"] },
      { q: "Can you add a booking system, shop or customer portal?", a: "Yes. Those are custom features I scope with you, and they can connect to your existing tools such as payments, calendars and email. Because I also build CRMs, inquiries and bookings can flow straight into a system you control." },
      { q: "How long does a website take?", a: "A focused site of a handful of pages is typically a few weeks from approved design to launch. Larger sites or custom features take longer, and I give you a timeline in writing with dates for each stage. The biggest factor is usually how quickly content and feedback arrive, so I'll tell you what I need and when." },
      { q: "What do I need to provide?", a: "Your logo and brand colors if you have them, a clear idea of what the site should achieve, and the key facts about your services. I can help write the copy and source images. If you don't have a brand yet, I can propose a simple direction as part of the design stage." },
    ],
  },

  seo: {
    slug: "seo",
    title: "SEO & AI search (AEO)",
    ctaTitle: "Want to be easier to find?",
    where: REMOTE,
    metaDescription:
      "SEO and AI-search optimization (AEO): technical fixes, local presence and content that answers real questions.",
    headline: "Be easier to find, and easier to choose.",
    intro:
      "People look for businesses on Google, on maps and in AI assistants. I improve the technical health, local presence and content that decide whether you show up, and whether what they find makes them call you. I never promise rankings. I do the work that earns visibility.",
    audience: [
      "Local and service businesses that rely on being found nearby",
      "Companies whose site is invisible for the things they actually sell",
      "Brands that want to show up in AI-generated answers as well as search results",
      "Owners who want clear reporting instead of vanity metrics",
    ],
    includes: [
      { title: "Technical audit and fixes", body: "Crawling, speed, structure and errors that quietly hold a site back." },
      { title: "On-page optimization", body: "Titles, headings, content and internal links lined up with how people search." },
      { title: "Local SEO", body: "Google Business Profile, listings, reviews and location pages for \"near me\" searches." },
      { title: "AI search (AEO)", body: "Clear answers, structured data and consistent business details, so AI assistants and search features can understand and quote you." },
      { title: "Content that answers questions", body: "Pages built around the real questions customers ask, useful to people and to search engines." },
      { title: "Reporting you can read", body: "What changed, what it did, and what happens next, in plain language." },
    ],
    process: [
      { title: "Audit", body: "Where you stand today and what is actually holding you back." },
      { title: "Fix the foundations", body: "Technical and on-page work that makes everything else easier." },
      { title: "Build presence", body: "Local, content and authority work, done steadily and honestly." },
      { title: "Measure and refine", body: "Reporting, learning and adjusting month by month." },
    ],
    faqs: [
      { q: "What is AEO?", a: "AEO (answer engine optimization) means making your content easy for AI assistants and search features, such as Google AI Overviews, ChatGPT and Perplexity, to understand and quote accurately. It uses direct answers, clear headings, structured data and consistent facts about your business. It sits alongside traditional SEO rather than replacing it.", bullets: ["Plain answers to the questions customers really ask", "Structured data and consistent business details", "Credible reviews and mentions"] },
      { q: "Can you guarantee first-page rankings?", a: "No, and be wary of anyone who does. Search engines decide rankings and no outside party controls them. What I commit to is the work, the transparency and the reporting: a clear audit, fixes done properly, and a plain-language report of what changed and what it did." },
      { q: "How long does SEO take?", a: "Technical fixes can help within weeks. Competitive searches usually take months, and local searches often move faster than national ones. After the audit I give you an honest expectation for your market rather than a promise, and we review it as results come in." },
      { q: "Do you do local SEO?", a: "Yes. Local search is often the fastest win for businesses that serve an area. It covers your Google Business Profile, accurate listings, reviews, location pages and content about the places you work. I'm based in York, PA, and I also do local SEO for businesses in other cities." },
      { q: "What will I get each month?", a: "A short report in plain English: what was done, what changed in visibility and inquiries, and what happens next. No dashboards full of numbers that don't matter. If you want a call to talk it through, that's part of the service." },
      { q: "Do I need a new website for SEO?", a: "Not always. Many sites can be improved in place. If the site is slow, hard to edit or built in a way that limits search visibility, I'll say so and show you what a rebuild would change and what it wouldn't." },
    ],
  },

  "meta-ads": {
    slug: "meta-ads",
    title: "Meta ads",
    ctaTitle: "Ready to put ads behind your offer?",
    where: REMOTE,
    metaDescription:
      "Facebook and Instagram ads: creative made for the feed, tracking you can read and steady testing.",
    headline: "Paid social that is built, tracked and improved properly.",
    intro:
      "Good Meta advertising is mostly creative, measurement and patience. I build the offer, the creative and the tracking, then test and refine so your spend goes to what works. No promises about results, just disciplined work and honest reporting.",
    audience: [
      "Businesses ready to put budget behind paid social",
      "Brands whose ads look off-brand or tired",
      "Teams without reliable tracking of leads and sales",
      "Owners who want to understand what their ad spend is doing",
    ],
    includes: [
      { title: "Strategy and offer", body: "Audience, positioning and the offer that gives an ad something to say." },
      { title: "Creative production", body: "Static, carousel and short-form video ads designed for the feed." },
      { title: "Campaign build", body: "Structure, targeting, placements and budgets set up cleanly." },
      { title: "Tracking", body: "Pixel, conversions and lead tracking you can trust." },
      { title: "Testing and optimization", body: "Ongoing creative and audience tests, with clear decisions." },
      { title: "Reporting", body: "Spend, leads and cost per result explained without jargon." },
    ],
    process: [
      { title: "Plan", body: "Goals, audience, offer and measurement agreed first." },
      { title: "Create", body: "Creative made to stop the scroll and fit your brand." },
      { title: "Launch", body: "A clean build, with tracking verified before any money is spent." },
      { title: "Optimize", body: "Weekly learning, creative refreshes and budget decisions." },
    ],
    faqs: [
      { q: "What budget do I need?", a: "Enough to learn within a reasonable time. Ads need some spend to show what works, and the right amount depends on your market and goal. After I understand your goals I suggest a realistic starting range. I'd rather start modestly and scale what works than overspend on guesses." },
      { q: "Do you make the creative?", a: "Yes: design, copy and short video, so ads and brand stay consistent. Each campaign starts with the offer, the hook and the call to action, then several creative variants are tested against each other so you learn which message lands.", bullets: ["Static images and carousels", "Short-form video", "Copy, offer and call to action"] },
      { q: "Can you guarantee leads or sales?", a: "No. I control the quality of the work, the tracking and the testing, not the market or how appealing your offer is to customers. What you get is clear measurement, steady testing and honest reporting, so decisions rest on data." },
      { q: "Do I keep the ad account?", a: "Yes. The ad account, the pixel and the data stay yours. I work through delegated access, so you can see everything and remove my access at any time." },
      { q: "How will I know it's working?", a: "Tracking is set up before launch so inquiries, calls or sales are recorded properly. You get a regular report showing spend, results, cost per result and what I'm changing next, in plain language." },
      { q: "How is this different from boosting a post?", a: "Boosting shows one post to more people. A campaign lets me choose who sees the ad, test different offers and creative, track real results and stop what doesn't work. That usually means less wasted spend." },
    ],
  },

  social: {
    slug: "social",
    title: "Social media",
    ctaTitle: "Want your accounts handled properly?",
    where: REMOTE,
    metaDescription:
      "Social media management: planned, on-brand content and community replies, so your accounts stay active.",
    headline: "A steady presence that doesn't become your second job.",
    intro:
      "Showing up regularly and sounding like yourself builds trust. I plan, create, schedule and publish your content and look after the conversation around it, so your accounts stay active and on-brand.",
    audience: [
      "Businesses that know they should post but don't have the time",
      "Brands whose accounts look inconsistent or dormant",
      "Teams that want content planned around real goals",
      "Owners who need someone to keep the conversation going",
    ],
    includes: [
      { title: "Content strategy", body: "Themes, formats and a calendar tied to what your business needs." },
      { title: "Content creation", body: "Graphics, short-form video and copy in your brand voice." },
      { title: "Scheduling and publishing", body: "Consistent posting on the platforms that matter to your customers." },
      { title: "Community management", body: "Comments, replies and messages handled with care." },
      { title: "Approvals", body: "A simple review step, so nothing goes live without your say." },
      { title: "Reporting", body: "Reach, engagement, and what to do more of or less of." },
    ],
    process: [
      { title: "Understand", body: "Your brand, your audience and what success looks like." },
      { title: "Plan", body: "A content calendar you can see and approve." },
      { title: "Produce", body: "Content made in batches, consistent in look and voice." },
      { title: "Publish and learn", body: "Posting, engagement and a monthly review." },
    ],
    faqs: [
      { q: "Which platforms do you cover?", a: "Mostly Instagram and Facebook, and where it suits the business, TikTok, LinkedIn and YouTube Shorts. I recommend platforms based on where your customers actually spend time, not what's fashionable, and it's fine to start with one." },
      { q: "Do I approve posts?", a: "Yes. You see the plan and the content before it's published, and you can ask for changes. Once we know each other's taste you can choose lighter approvals, but nothing goes out without your agreement." },
      { q: "Do you need access to my accounts?", a: "I use proper delegated access, such as Meta Business access, so you keep ownership. I never need your passwords, and you can remove my access whenever you like." },
      { q: "How much content do I get?", a: "That depends on the plan, but it's agreed in advance as a clear number of posts, reels or stories per month. Content is planned as a calendar, so you can see what's coming and why." },
      { q: "Can this pair with video production?", a: "Very well. A shoot day can produce weeks of short videos and photos, which are then edited and scheduled across your channels. If you're in the York, PA area I can do the shoot in person; otherwise you can send footage and I'll handle the rest." },
      { q: "Will you reply to comments and messages?", a: "I can. Replies keep a business feeling alive, and I can handle comments and routine messages in your tone while passing anything important or sensitive back to you." },
    ],
  },

  content: {
    slug: "content",
    title: "Video & content",
    ctaTitle: "Need video you can use everywhere?",
    where: "Shoots happen in person around the York, PA area. Planning, editing and delivery are done remotely, so businesses elsewhere can send footage or arrange travel.",
    metaDescription:
      "Short-form video, on-location shoots and campaign creative planned in batches so one shoot feeds weeks of content.",
    headline: "Video and content that looks like your brand, planned so it actually gets made.",
    intro:
      "Strong content powers everything else: ads, social, your website. I handle the whole production, from ideas and scripts to filming, editing and delivery, in organized batches, so you have a steady supply of work that looks like it belongs to your brand.",
    audience: [
      "Brands that need a steady flow of short-form video",
      "Businesses launching a campaign or a new offer",
      "Teams that want ads and organic content to share one creative plan",
      "Owners who want filming and editing handled end to end",
    ],
    includes: [
      { title: "Concepts and scripting", body: "Ideas and scripts built around what your audience cares about." },
      { title: "Shoots", body: "On-location or studio filming, planned to capture a month of content at once." },
      { title: "Editing and motion", body: "Short-form edits, captions and motion graphics made for each platform." },
      { title: "Campaign creative", body: "Ad-ready assets in the formats each platform needs." },
      { title: "Photography", body: "Brand and product images for your site, social and ads." },
      { title: "Asset library", body: "Organized files you can reuse across channels." },
    ],
    process: [
      { title: "Plan", body: "Concepts, scripts and a shot list agreed before the day." },
      { title: "Shoot", body: "Efficient filming that captures a lot in a little time." },
      { title: "Edit", body: "Fast turnaround, with a review step before anything is final." },
      { title: "Deliver", body: "Platform-ready files and a library to pull from." },
    ],
    faqs: [
      { q: "Where do you shoot?", a: "At your location or in a studio, whichever suits the content. For trades, venues and shops, shooting on site usually looks most authentic. I'm based in the York, PA area, so shoots there and nearby are in person. For businesses further away, we can plan travel or work from footage you capture yourself." },
      { q: "How much content comes from one shoot?", a: "That depends on the plan, but shoots are designed to produce weeks of content: short vertical videos, photos and clips for ads, social and your website. I tell you the expected output before you book." },
      { q: "Can you work with footage I already have?", a: "Yes. I can edit and repurpose existing video and photos, add captions and branding, and cut versions for each platform. Phone footage is often a good starting point if it's shot with a few simple guidelines." },
      { q: "Do you handle posting?", a: "I can. Posting and community management are part of the Social media service, and the two work best together. You can also take the finished files and post them yourself." },
      { q: "What does the process look like?", a: "First a short planning call to agree goals and ideas, then a shot list, then the shoot, then editing and review rounds, then delivery in the formats you need. You see drafts before anything is final." },
      { q: "Do you do voiceover, music and captions?", a: "Captions are standard because most people watch with the sound off. Music is licensed for commercial use, and voiceover can be recorded where it helps the message." },
    ],
  },
};
