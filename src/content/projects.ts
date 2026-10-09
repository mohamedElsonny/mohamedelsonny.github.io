import type { ProjectItem } from './types';

// Order is fixed by spec §7. Labels come from the vault project descriptions; tags from verified project skills or achievements.
export const projects: ProjectItem[] = [
  {
    // project 2ab1fd89-74dd-56f8-83dc-e429a315face.
    slug: 'syft-app',
    label: 'Influencer marketing',
    title: 'Syft App',
    // achievements 9974829b-6cb8-58ee-a95e-e76dae0bb798 (owned architecture, 20+ team), b2fe6020-99f1-5823-9702-15d08efb0211 + fact 24a14a1d-5ebf-59c5-a66e-26de7f0a0130 (six platforms),
    // f613e0b9-57d6-5044-92b1-1ec3bf7d8b59 (Stripe), 1663901c-e2b1-5460-802b-e01d7cf47dc9 + metric b0dbfbc4-4c63-54e7-a633-55ecbfb66627 (estimated >50%) + fact 8f412b95-604f-5237-94ff-3eaab82bf47b (Redis).
    summary:
      'Owned cross-stack architecture and technology standards for a 20+ engineer team. Built data pipelines across six social platforms, Stripe payments, and Redis caching that cut page-load latency by an estimated 50%+.',
    tags: ['NestJS', 'GraphQL', 'Stripe', 'Redis'],
  },
  {
    // project 5afd6a66-cc80-51c2-a566-afa76f5f9cb3.
    slug: 'mynt',
    label: 'Web3 & NFTs',
    title: 'Mynt.la',
    // achievements 0d663337-f158-5619-aa25-5979420cdbca (OpenSea), b65205f0-a351-5e35-98fd-c49ed21d5736 (5+ chains, 3+ APIs),
    // decision a8366407-727e-52cc-a72a-13300d3b53e9 (RabbitMQ), fact d8e2ce10-82f3-5150-946e-1076b536208f (retries, circuit breakers).
    summary:
      'Built the backend for an NFT marketplace with OpenSea integration. Decoupled ingestion from 5+ blockchains and 3+ APIs through RabbitMQ, with retries and circuit breakers.',
    tags: ['RabbitMQ', 'Circuit Breaker', 'Retries', 'OpenSea'],
  },
  {
    // project b979c75a-f6d2-5b12-884b-7ca5d04871a9.
    slug: 'getridley',
    label: 'Real estate',
    title: 'Getridley',
    // achievements 9e6a4a8c-fbda-55b0-a0e8-30816f036f37 (SES → SQS → Lambda → DynamoDB, WebSockets), c128753c-2b3a-5d59-8da9-3be2692c3c13 (2 of 4 weeks).
    summary:
      'A serverless Gmail-style inbox: SES → SQS → Lambda → DynamoDB, with real-time updates over WebSockets. Core scope delivered in 2 weeks of a 4-week deadline.',
    tags: ['AWS SES', 'AWS Lambda', 'DynamoDB', 'WebSockets'],
  },
  {
    // experience 065591b1-aedd-5780-9710-4fc4132f79c0 (no projects row); AgriTech domain from profile summary.
    slug: 'mozare3',
    label: 'AgriTech',
    title: 'Mozare3',
    // achievements 42e44d8f-7ba6-5a28-b8a4-077975fb8a09 (led Kissflow migration), b43667bd-ee34-504a-8dfa-2a70f48aba96 (SAP XML reporting).
    summary:
      "Led the migration of the company's core system from Kissflow (no-code) to microservices on AWS ECS, plus scheduled SAP reporting over XML web services.",
    tags: ['AWS ECS', 'Microservices', 'SAP integration'],
  },
  {
    // project eb1da6c3-2f25-5620-ac60-b50dd79f5964.
    slug: 'yoga-digital-library',
    label: 'Digital library',
    title: 'Yoga Digital Library',
    // achievements 1a23efdd-07d6-50ef-906e-99499e11c648 (Firebase library), 0045e3f5-607c-5ab7-b51f-bda6810b15e9 (PDF encryption),
    // 1bee7a77-7dae-5293-8d6b-674c347ef22a (TTS), ac4ed6e6-b294-50d7-894b-879be8e08357 (Gemini on Vertex AI).
    summary:
      'A Firebase digital library with client-side PDF encryption for offline reading, text-to-speech, and a Gemini-powered reading assistant on Vertex AI.',
    tags: ['Firebase', 'React', 'Vertex AI', 'Gemini'],
  },
  {
    // project ee19be95-d658-5693-914a-73ff71a56736.
    slug: 'meenda',
    label: 'Influencer bios',
    title: 'Meenda.com',
    // source: user (2026-10-09), recorded as verified achievements bedd915a-4f65-5bd6-8d79-674f7d411d23 (one-time scraping)
    // and 26cc20bf-63c3-50f8-a5b6-91f18baf6402 (admin panel) by ai-cv-tailor/scripts/record_meenda_scraping_admin.py.
    summary:
      'Built scraping scripts that collected public information about celebrities and turned it into published biographies. The job was deliberately a one-time run rather than a continuous sync pipeline. Added an admin panel so editors could review and correct the data.',
    tags: ['Node.js', 'GraphQL', 'Supabase', 'Web Scraping'],
  },
  {
    // project 04da7f85-8c60-5a50-bf39-907a29515c20.
    slug: 'randommath',
    label: 'EdTech',
    title: 'RandomMath',
    // achievement 266cf309-77ae-5516-b40e-c8b94659e997.
    summary:
      'Architected a quiz management system with role-based access for teachers, students, and parents, self-hosted on DigitalOcean.',
    tags: ['Next.js', 'PostgreSQL', 'Docker', 'DigitalOcean'],
  },
];
