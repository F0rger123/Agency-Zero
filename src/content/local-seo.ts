import type { ServiceSlug } from "@/lib/site-config";
import type { FaqItem } from "@/components/site/faq";

/**
 * Local and answer-engine (AEO) copy for York, PA and the surrounding area.
 * Written answer-first: each answer opens with a direct, quotable sentence, then adds detail. No guarantees, no invented
 * prices, ratings or addresses. TODO(content): the owner should confirm the in-person / remote wording below.
 */

/** One quotable sentence per service, shown at the top of the service page and in the page's structured data. */
export const shortAnswers: Record<ServiceSlug, string> = {
  software:
    "Agency Zero builds custom software, CRMs and business apps for small businesses in York, PA and across Pennsylvania. Luke Knight designs and builds each system himself, so you deal with one person from first call to launch.",
  websites:
    "Agency Zero designs and builds custom, fast, mobile-friendly websites for businesses in York, PA and surrounding areas, with SEO and clear calls to action built in from the start rather than added later.",
  seo:
    "Agency Zero provides SEO for York, PA and Central Pennsylvania businesses: technical and on-page SEO, local search and Google Business Profile support, and content structured so Google and AI assistants can quote it.",
  "meta-ads":
    "Agency Zero plans, builds and manages Facebook and Instagram ads (Meta ads) for York, PA area businesses: creative, audiences, tracking and steady testing, reported in plain English.",
  social:
    "Agency Zero manages social media for small businesses in York, PA and nearby: a planned content calendar, on-brand posts, and community replies so your channels stay active without becoming your second job.",
  content:
    "Agency Zero produces short-form video, on-location shoots and campaign creative for York, PA area businesses, planned as one pipeline that feeds your website, social channels and ads.",
};

/** Extra FAQs per service, appended to that service's FAQ list and its FAQPage structured data. */
export const localFaqs: Record<ServiceSlug, FaqItem[]> = {
  software: [
    {
      q: "Who builds custom software and CRMs for small businesses in York, PA?",
      a: "Agency Zero does. Luke Knight designs and builds custom software, CRMs and internal tools for small businesses in York, PA and across Pennsylvania, working directly with the owner rather than through a sales team. Meetings can be on a video call, or in person around York where that helps.",
    },
    {
      q: "Can you build a custom app or CRM for a contractor or service business near me?",
      a: "Yes. Contractors, trades and local service businesses are a good fit because their work is repeatable but rarely matches off-the-shelf software: quotes, jobs, schedules, follow-ups and invoices. A first version covering one workflow can usually be live in a few weeks, then grows in stages.",
    },
    {
      q: "How much does a custom CRM or app cost?",
      a: "It depends on scope, so I price it after a short discovery call. Each stage has a fixed scope and price agreed before building starts, which means you know the cost of a stage before it begins. A small, focused first version costs far less than a full system, and you decide how far to go.",
    },
  ],
  websites: [
    {
      q: "Who is a website builder or web designer near me in York, PA?",
      a: "Agency Zero designs and builds custom websites for York, PA and Central Pennsylvania businesses. Every site is designed from scratch rather than from a template, built to load fast on phones, and set up for local search from day one.",
    },
    {
      q: "How much does a small business website cost in York, PA?",
      a: "It depends on the number of pages, features such as booking or online payments, and how much content needs writing or photographing. I quote a fixed price after a short conversation, so you know the cost before work starts. There are no hidden monthly fees for the build itself.",
    },
    {
      q: "Will my website show up in Google and AI search?",
      a: "I build every site so Google and AI assistants can understand it: clean structure, fast loading, descriptive page titles, structured data and clear answers to the questions customers ask. Nobody can honestly guarantee a ranking, but a well-built site gives you the best foundation to earn one.",
    },
  ],
  seo: [
    {
      q: "Who offers SEO services in York, PA?",
      a: "Agency Zero offers SEO services to York, PA and Central Pennsylvania businesses: technical SEO, on-page SEO, local SEO, Google Business Profile support and content planning. Work is done by Luke Knight directly, with monthly reporting in plain English.",
    },
    {
      q: "What is local SEO and why does it matter for a York, PA business?",
      a: "Local SEO helps your business appear when people nearby search for what you do, such as \"plumber near me\" or \"web designer York PA\". It covers your Google Business Profile, consistent listings, reviews and location-relevant pages. For local service businesses it is usually the highest-return kind of SEO.",
    },
    {
      q: "What is AEO, and do you optimize for ChatGPT, Google AI Overviews and Perplexity?",
      a: "AEO (answer engine optimization) means structuring your content so AI assistants and search features can quote it accurately: direct answers, clear headings, FAQ and business structured data, and consistent facts about who you are and where you work. I build all of this into the sites and content I deliver. No one can guarantee being cited, but clear, well-structured pages make it far more likely.",
    },
    {
      q: "How long does SEO take to work?",
      a: "Most businesses see early movement in a few months and stronger results over six to twelve months, depending on competition and starting point. Technical fixes can show effects sooner. I report on what changed and why, and I will not promise a specific ranking.",
    },
  ],
  "meta-ads": [
    {
      q: "Who manages Facebook and Instagram ads for small businesses in York, PA?",
      a: "Agency Zero manages Meta ads (Facebook and Instagram) for York, PA area businesses. That covers creative, audience targeting, conversion tracking, weekly testing and a plain-English report, so you can see what your ad budget produced.",
    },
    {
      q: "How much should a small business spend on Meta ads?",
      a: "Enough to gather useful data, which for most local businesses means a few hundred dollars a month to start, scaled up once it works. Ad spend goes to Meta directly and is separate from management fees. I will recommend a starting budget after learning about your goals and margins.",
    },
    {
      q: "Do Meta ads work for local service businesses?",
      a: "Yes, when the offer is clear and the tracking is set up correctly. Lead-generation ads, click-to-message ads and local awareness campaigns can all work for service businesses. I focus on a clear offer, fast follow-up and measuring cost per lead rather than likes.",
    },
  ],
  social: [
    {
      q: "Who can be my social media manager in York, PA?",
      a: "Agency Zero provides social media management for York, PA small businesses: a content calendar, on-brand posts and short-form video, and community replies. You work with one person, Luke Knight, who plans and produces the content.",
    },
    {
      q: "What does a social media manager do for a small business?",
      a: "A social media manager plans what to post, creates or edits the content, publishes it on a schedule, replies to comments and messages, and reports on what is working. The point is a consistent, professional presence that brings in enquiries without you having to do it yourself.",
    },
    {
      q: "Which platforms do you manage?",
      a: "Instagram and Facebook are the main focus because they work well for local businesses, with TikTok, LinkedIn and YouTube added when your customers use them. I would rather do two platforms well than five badly.",
    },
  ],
  content: [
    {
      q: "Who does video production and short-form video for businesses in York, PA?",
      a: "Agency Zero plans and produces short-form video, on-location shoots and campaign creative for York, PA area businesses. Content is planned in batches so one shoot day produces material for your website, social channels and ads.",
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
        a: "Agency Zero is a one-person digital agency run by Luke Knight. It builds custom software and CRMs, designs websites, and handles SEO, Meta (Facebook and Instagram) ads, social media management and video content for small and medium-sized businesses, serving York, PA and the surrounding area.",
      },
      {
        q: "Where is Agency Zero based, and which areas do you serve?",
        a: "Agency Zero serves York, PA and the surrounding area of South Central Pennsylvania, including York County, Hanover, Harrisburg, Lancaster, Gettysburg, Carlisle and Lebanon. Work is delivered remotely, so clients elsewhere in Pennsylvania and beyond are welcome too.",
      },
      {
        q: "Who will actually do the work?",
        a: "Luke Knight does. There is no hand-off to a junior team: the person you speak to on the first call designs, builds and manages your project. That keeps costs lower and communication simple.",
      },
      {
        q: "How do I get started?",
        a: "Send a message through the contact page. Luke reads every inquiry himself and replies within one working day with questions or a suggested next step, followed by a short call to understand your business before anything is proposed.",
      },
    ],
  },
  {
    group: "Services and pricing",
    items: [
      {
        q: "What services does Agency Zero offer?",
        a: "Six services: custom software and CRMs, website design, SEO, Meta ads, social media management, and video and content production. They are designed to work together, so your website, search presence, ads and content support each other.",
      },
      {
        q: "How much do your services cost?",
        a: "Pricing depends on scope, so every project is quoted after a short discovery call with a fixed scope and price for each stage. There are no surprise charges. Ad spend, where relevant, is paid to the ad platform directly and is separate from management fees.",
      },
      {
        q: "Do you work with small businesses?",
        a: "Yes, small and local businesses are the focus: contractors and trades, restaurants, salons and gyms, professional services, and growing startups. The aim is to give a small business the quality of a larger agency without the overhead.",
      },
      {
        q: "Can you build a custom CRM instead of me using a standard one?",
        a: "Yes. Custom CRMs make sense when your process does not fit a standard tool, or when you are stitching several tools together with spreadsheets. If an off-the-shelf CRM would serve you better and cost less, I will tell you so.",
      },
    ],
  },
  {
    group: "Search, AI and local visibility",
    items: [
      {
        q: "Do you do local SEO for York, PA businesses?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business listings, reviews, and location-relevant website pages, so you appear when nearby customers search for what you do.",
      },
      {
        q: "What is answer engine optimization (AEO)?",
        a: "AEO is making your content easy for AI assistants and search features, such as Google AI Overviews, ChatGPT and Perplexity, to understand and quote. It uses direct answers, clear headings, structured data and consistent business facts. It sits alongside traditional SEO rather than replacing it.",
      },
      {
        q: "Do you guarantee rankings?",
        a: "No, and be cautious of anyone who does. Search engines and AI assistants make their own decisions. I focus on the things within my control, which are technical quality, useful content, clear structure and a strong local presence, and I report honestly on results.",
      },
    ],
  },
];

/** Page titles and descriptions for the service pages (primary keyword first, local qualifier, under ~60 / ~160 chars). */
export const serviceSeo: Record<ServiceSlug, { title: string; description: string; serviceType: string }> = {
  software: {
    title: "Custom Software & CRM Developer, York PA",
    description:
      "Custom software, CRMs and business apps built around how you work. York, PA software developer serving York County and Central Pennsylvania. Free first conversation.",
    serviceType: "Custom software development",
  },
  websites: {
    title: "Website Design & Developer in York, PA",
    description:
      "Custom, fast, mobile-friendly websites with SEO built in. York, PA web designer and website builder for small businesses across York County and Pennsylvania.",
    serviceType: "Website design and development",
  },
  seo: {
    title: "SEO Services in York, PA",
    description:
      "York, PA SEO company for small businesses: technical SEO, local SEO, Google Business Profile support and content built to be quoted by Google and AI assistants.",
    serviceType: "Search engine optimization",
  },
  "meta-ads": {
    title: "Meta Ads Manager in York, PA",
    description:
      "Facebook and Instagram ads for York, PA area businesses: creative, targeting, tracking and steady testing, with plain-English reporting. Meta ads manager serving Pennsylvania.",
    serviceType: "Paid social advertising",
  },
  social: {
    title: "Social Media Manager in York, PA",
    description:
      "Social media management for York, PA small businesses: planned content, on-brand posts, short-form video and community replies, without it becoming your second job.",
    serviceType: "Social media management",
  },
  content: {
    title: "Video & Short-Form Content, York PA",
    description:
      "Short-form video, on-location shoots and campaign creative for York, PA businesses, planned as one pipeline for your website, social channels and ads.",
    serviceType: "Video and content production",
  },
};
