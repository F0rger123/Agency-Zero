import type { ServiceSlug } from "@/lib/site-config";
import type { FaqItem } from "@/components/site/faq";

/**
 * Search- and answer-engine-facing copy. Written answer-first: each answer opens with a direct, quotable sentence and then
 * adds detail. People come first; the same wording is used in the page, the FAQ structured data and /llms.txt.
 * No guarantees, no invented prices, ratings or addresses.
 *
 * Positioning: Agency Zero is based in the York, PA area (in-person work: shoots, meetings, on-site creative work) and
 * delivers most services remotely, so it works with businesses outside Pennsylvania too.
 */

export const positioning = {
  line: "Based in York, PA. Built to work anywhere.",
  inPerson: "Based in the York, PA area and available for in-person work throughout the surrounding region.",
  remote:
    "Websites, custom software and CRMs, SEO and AI search, Meta ads, social media and consulting are delivered remotely, so businesses outside Pennsylvania are welcome too.",
} as const;

/** One quotable sentence per service, shown at the top of the service page and used in answer engines. */
export const shortAnswers: Record<ServiceSlug, string> = {
  software:
    "Agency Zero builds custom software, CRMs, customer portals and business automation around the way a company actually works. It's based in York, PA and delivered remotely, so it works with businesses anywhere.",
  websites:
    "Agency Zero designs and builds custom, fast, mobile-friendly websites with SEO and clear calls to action built in from the start. It's based in York, PA and delivered remotely for businesses anywhere.",
  seo:
    "Agency Zero provides SEO and AI-search optimization (AEO): technical and on-page fixes, local search and Google Business Profile support, and content structured so Google and AI assistants can understand and quote it.",
  "meta-ads":
    "Agency Zero plans, builds and manages Facebook and Instagram ads (Meta ads): creative, audiences, tracking and steady testing, reported in plain English, for businesses in York, PA and remotely elsewhere.",
  social:
    "Agency Zero manages social media for small businesses: a planned content calendar, on-brand posts and short-form video, and community replies, so accounts stay active without becoming the owner's second job.",
  content:
    "Agency Zero produces short-form video, photos and campaign creative, planned in batches so one shoot feeds weeks of content. Shoots are in person around York, PA; planning and editing are done remotely.",
};

/** Extra FAQs per service, appended to that service's FAQ list and its FAQPage structured data. */
export const localFaqs: Record<ServiceSlug, FaqItem[]> = {
  software: [
    {
      q: "Who builds custom software and CRMs for small businesses?",
      a: "Agency Zero does. Luke Knight designs and builds custom CRMs, internal tools and business software, working directly with the owner rather than through a sales team. Based in York, PA; most of the work is done over video calls and shared tools, so location isn't a barrier.",
    },
    {
      q: "Can you build a CRM for a contractor or service business?",
      a: "Yes. Contractors, trades and local service businesses are a good fit, because their work is repeatable but rarely matches off-the-shelf software: quotes, jobs, schedules, follow-ups and invoices. A first version covering one workflow can usually be live in a few weeks, then grows in stages.",
    },
    {
      q: "How much does a custom CRM or app cost?",
      a: "It depends on scope, so I price it after a short discovery call. Each stage has a fixed scope and price agreed before building starts, so you know the cost of a stage before it begins. A small, focused first version costs far less than a full system, and you decide how far to go.",
    },
  ],
  websites: [
    {
      q: "Who builds custom websites for small businesses?",
      a: "Agency Zero designs and builds custom websites for small and growing businesses. Every site is designed from scratch rather than from a template, built to load fast on phones, and set up for search from day one. Based in York, PA, working with businesses anywhere.",
    },
    {
      q: "How much does a small business website cost?",
      a: "It depends on the number of pages, features such as booking or online payments, and how much content needs writing or photographing. I quote a fixed price after a short conversation, so you know the cost before work starts.",
    },
    {
      q: "Will my website show up in Google and AI search?",
      a: "I build every site so Google and AI assistants can understand it: clean structure, fast loading, descriptive page titles, structured data and clear answers to the questions customers ask. Nobody can honestly guarantee a ranking, but a well-built site is the best foundation for earning one.",
    },
  ],
  seo: [
    {
      q: "Who offers SEO and AI-search optimization for small businesses?",
      a: "Agency Zero offers SEO and AEO: technical SEO, on-page SEO, local SEO, Google Business Profile support and content planning. The work is done by Luke Knight directly, with monthly reporting in plain English. It's delivered remotely, so businesses outside Pennsylvania are welcome.",
    },
    {
      q: "What is local SEO and why does it matter?",
      a: "Local SEO helps your business appear when people nearby search for what you do, such as \"plumber near me\" or \"web designer in York PA\". It covers your Google Business Profile, consistent listings, reviews and location-relevant pages. For businesses that serve an area, it's usually the highest-return kind of SEO.",
    },
    {
      q: "Do you optimize for ChatGPT, Google AI Overviews and Perplexity?",
      a: "I optimize for the things those systems rely on: direct answers, clear headings, structured data and consistent facts about who you are and what you do. No one can guarantee being cited, but clear, well-structured pages make it far more likely.",
    },
  ],
  "meta-ads": [
    {
      q: "Who manages Facebook and Instagram ads for small businesses?",
      a: "Agency Zero manages Meta ads (Facebook and Instagram). That covers creative, audience targeting, conversion tracking, weekly testing and a plain-English report, so you can see what your ad budget produced. Remote-friendly, based in York, PA.",
    },
    {
      q: "How much should a small business spend on Meta ads?",
      a: "Enough to gather useful data, which for most local businesses means a few hundred dollars a month to start, scaled up once it works. Ad spend goes to Meta directly and is separate from management fees. I'll recommend a starting budget after learning about your goals and margins.",
    },
    {
      q: "Do Meta ads work for local service businesses?",
      a: "Yes, when the offer is clear and the tracking is set up correctly. Lead-generation ads, click-to-message ads and local awareness campaigns can all work for service businesses. I focus on a clear offer, fast follow-up and measuring cost per lead rather than likes.",
    },
  ],
  social: [
    {
      q: "Who can manage my business's social media?",
      a: "Agency Zero provides social media management for small businesses: a content calendar, on-brand posts and short-form video, and community replies. You work with one person, Luke Knight, who plans and produces the content.",
    },
    {
      q: "What does a social media manager do for a small business?",
      a: "A social media manager plans what to post, creates or edits the content, publishes it on a schedule, replies to comments and messages, and reports on what's working. The point is a consistent, professional presence that brings in inquiries without you having to do it yourself.",
    },
    {
      q: "Which platforms do you manage?",
      a: "Instagram and Facebook are the main focus because they work well for local businesses, with TikTok, LinkedIn and YouTube added when your customers use them. I'd rather do two platforms well than five badly.",
    },
  ],
  content: [
    {
      q: "Who does video production and short-form video for small businesses?",
      a: "Agency Zero plans and produces short-form video, shoots and campaign creative. Content is planned in batches, so one shoot day produces material for your website, social channels and ads. Shoots are in person around York, PA.",
    },
    {
      q: "Why is short-form video worth it for a local business?",
      a: "Short vertical video is what Instagram, Facebook and TikTok show most, and it lets customers see your work, your people and your results quickly. A batch of planned videos also gives your ads and website fresh material, which costs less than producing each channel separately.",
    },
    {
      q: "How does a shoot day work?",
      a: "We agree a shot list and schedule beforehand, shoot a month or more of content in one visit, then I edit and deliver it on a calendar. Planning ahead is what keeps the cost down and the content consistent.",
    },
  ],
};

/** Site-wide Q&As for the /faq page (answer-first, quotable by search and AI assistants). */
export const siteFaqs: { group: string; items: FaqItem[] }[] = [
  {
    group: "About Agency Zero",
    items: [
      {
        q: "What is Agency Zero?",
        a: "Agency Zero is a one-person agency run by Luke Knight. It builds custom software and CRMs, designs websites, and handles SEO and AI-search optimization, Meta (Facebook and Instagram) ads, social media management and video content for small and medium-sized businesses. It's based in York, PA.",
      },
      {
        q: "Where is Agency Zero based, and where do you work?",
        a: "Agency Zero is based in the York, PA area and is available for in-person work throughout the surrounding region, such as shoots and meetings. Most services can be delivered remotely, so businesses outside Pennsylvania are welcome too.",
      },
      {
        q: "Do you work with businesses outside Pennsylvania?",
        a: "Yes. Websites, custom software and CRMs, SEO and AEO, Meta ads, social media management and consulting all work over video calls and shared tools. In-person work, such as video shoots, is easiest around York, PA, and can be planned with travel for businesses further away.",
      },
      {
        q: "Who will actually do the work?",
        a: "Luke Knight does. There's no hand-off to a junior team: the person you speak to on the first call designs, builds and manages your project. That keeps communication simple and costs lower.",
      },
      {
        q: "How do I get started?",
        a: "Send a message through the contact page. Luke reads every inquiry himself and replies within one business day with questions or a suggested next step, followed by a short call to understand your business before anything is proposed.",
      },
    ],
  },
  {
    group: "Services and pricing",
    items: [
      {
        q: "What services does Agency Zero offer?",
        a: "Six services: custom software and CRMs, websites, SEO and AI search (AEO), Meta ads, social media management, and video and content production. Consulting and coaching are available where they fit, for example reviewing your website, search presence or marketing and showing you what to fix. The services are designed to work together, but you can start with one.",
      },
      {
        q: "How much do your services cost?",
        a: "Pricing depends on scope, so every project is quoted after a short discovery call, with a fixed scope and price for each stage. Ad spend, where relevant, is paid to the ad platform directly and is separate from management fees.",
      },
      {
        q: "Do you work with small businesses?",
        a: "Yes, small and growing businesses are the focus: contractors and trades, restaurants, salons and gyms, professional services and startups. The aim is to give a small business the quality of a larger agency without the overhead.",
      },
      {
        q: "Can you build a custom CRM instead of me using a standard one?",
        a: "Yes. Custom CRMs make sense when your process doesn't fit a standard tool, or when you're stitching several tools together with spreadsheets. If an off-the-shelf CRM would serve you better and cost less, I'll tell you so.",
      },
      {
        q: "Do you offer consulting or coaching?",
        a: "Where it makes sense, yes. That can mean reviewing your website, search presence, ads or internal systems and giving you a prioritized list of what to fix, or coaching you or your team to run the work yourselves. Tell me what you're trying to do and I'll say whether consulting is the right fit.",
      },
    ],
  },
  {
    group: "Search, AI and local visibility",
    items: [
      {
        q: "Do you do local SEO?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business listings, reviews and location-relevant website pages, so you appear when nearby customers search for what you do. It works for businesses in York, PA and in other cities.",
      },
      {
        q: "What is answer engine optimization (AEO)?",
        a: "AEO is making your content easy for AI assistants and search features, such as Google AI Overviews, ChatGPT and Perplexity, to understand and quote. It uses direct answers, clear headings, structured data and consistent business facts. It sits alongside traditional SEO rather than replacing it.",
      },
      {
        q: "Do you guarantee rankings?",
        a: "No, and be cautious of anyone who does. Search engines and AI assistants make their own decisions. I focus on what's within my control, which is technical quality, useful content, clear structure and a strong local presence, and I report honestly on results.",
      },
    ],
  },
];

/** Page titles and descriptions for the service pages. Broad service intent first; location is context, not the headline. */
export const serviceSeo: Record<ServiceSlug, { title: string; description: string; serviceType: string }> = {
  software: {
    title: "Custom Software & CRM Development",
    description:
      "Custom CRMs, internal tools, customer portals and automation built around how your business works. Based in York, PA and delivered remotely for businesses anywhere.",
    serviceType: "Custom software development",
  },
  websites: {
    title: "Custom Website Design & Development",
    description:
      "Fast, custom-designed, mobile-friendly websites with clear calls to action and SEO built in. Based in York, PA; websites are built remotely for businesses anywhere.",
    serviceType: "Website design and development",
  },
  seo: {
    title: "SEO & AI Search (AEO) Services",
    description:
      "SEO and AI-search optimization: technical fixes, local SEO, Google Business Profile support and content that answers real questions. Based in York, PA, working with businesses anywhere.",
    serviceType: "Search engine optimization",
  },
  "meta-ads": {
    title: "Meta Ads Management (Facebook & Instagram)",
    description:
      "Facebook and Instagram ads with creative made for the feed, tracking you can read and steady testing. Plain-English reporting. Based in York, PA, working remotely.",
    serviceType: "Paid social advertising",
  },
  social: {
    title: "Social Media Management",
    description:
      "Planned, on-brand social media content and community replies, so your accounts stay active without becoming your second job. Based in York, PA, working remotely.",
    serviceType: "Social media management",
  },
  content: {
    title: "Video & Short-Form Content Production",
    description:
      "Short-form video, shoots and campaign creative planned in batches so one shoot feeds weeks of content. In-person shoots around York, PA; planning and editing done remotely.",
    serviceType: "Video and content production",
  },
};
