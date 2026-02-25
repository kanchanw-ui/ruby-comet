This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Configure Supabase

1. Create a new Supabase project.
2. Create a storage bucket named `recordings` for uploaded `.webm` screen recordings.
3. Run the SQL in `supabase/schema.sql` against your Supabase database to create the `recordings` and `bug_reports` tables.

### 2. Environment variables

Configure the following environment variables (e.g., in a `.env.local` file locally and in Vercel for deployment):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

### 3. Install dependencies and run dev server

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) with your browser.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
