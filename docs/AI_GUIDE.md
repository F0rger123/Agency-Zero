# AI guide: Agency-Zero

**For AI assistants (Claude, ChatGPT, Codex, Cursor, Gemini).** Someone gave you a link to this repository. Use this page to explain it, set it up, or help them use it. Talk in plain English; the person may not be technical.

## What this is

A private all-in-one app for running a small agency: clients, projects, quotes, contracts, invoices, payments and a calendar, plus the agency's public website.

**Usually used by:** The agency owner, or a developer helping them.

## Ask first

Ask these together in one short message, then repeat back what you heard in a line or two. Skip anything they already told you.

- Do you want to run it on your own computer, deploy it, or just understand what it does?
- Do you already have a Supabase project and a Cloudflare account?
- Are you working on the CRM part (/app) or the public website?

## Set it up

Do one step at a time. Check each one worked before moving on.

| # | Do this | It worked if |
|---|---|---|
| 1 | Install Node.js 20+, then run `npm install` | `npm run lint` finishes |
| 2 | Copy `.env.example` to `.env.local` and have the person fill in the Supabase URL and anon key | The file exists; never read the values back |
| 3 | Create the database: apply the migrations listed in `supabase/README.md`, in order | Tables appear in the Supabase dashboard |
| 4 | Create the owner user in Supabase (there is no sign-up page on purpose) | The person can sign in at `/login` |
| 5 | `npm run dev` | http://localhost:3000 shows the site and /app shows the CRM after sign-in |

## Use it

- Open the README's "What it does" table to see each module.
- Ask what they want to change; read `docs/MASTER_SPEC.md` before building anything.

## How it works, in plain words

1. One app holds both the public website and the private CRM.
2. Customers only ever see the quote or contract page you send them.
3. Every record is locked so only the owner's account can read it.

## Never

- Never ask for, paste or print passwords, API keys or tokens. Tell the person where to put them (their own `.env` file or the hosting dashboard) and let them do it.
- Never deploy, push to `main`, change a live database or spend money without the person saying yes to that exact step.
- Never use fake data or buttons that pretend to work. Unfinished features say "planned".
- Read `AGENTS.md` before editing code; it is the session rulebook.

## Read next

- [Requirements (source of truth)](docs/MASTER_SPEC.md)
- [Deploying](docs/DEPLOYMENT.md)
- [Database setup](supabase/README.md)

## When you're done

Tell the person, in a few lines: what is set up and checked, what isn't yet, and two or three things they can ask you next.
