import type { ExperienceItem } from './types';

export const experience: ExperienceItem[] = [
  {
    // experience 467d7423-acab-5001-8608-bd976dc33331 (2024-03 to present).
    role: 'Independent Software Engineer',
    period: '2024 — Present',
    // projects Getridley b979c75a-f6d2-5b12-884b-7ca5d04871a9, STSX 17c70a20-1d26-5630-b0d2-c7b66ef515f8 (achievement 1c79beec-a911-576d-ad48-fb71ad760e1d),
    // Yoga eb1da6c3-2f25-5620-ac60-b50dd79f5964.
    summary:
      'Contract work for clients: a serverless email inbox on AWS for a real estate platform, a steel-tracking barcoding system in Go and PostgreSQL, and an AI-assisted digital reading library.',
    // project skills of Getridley, STSX and Yoga.
    tags: ['AWS Lambda', 'SQS', 'DynamoDB', 'Go', 'Next.js', 'Firebase'],
  },
  {
    // experience 065591b1-aedd-5780-9710-4fc4132f79c0 (2023-10 to 2024-03).
    role: 'Backend Engineer',
    company: 'Mozare3',
    period: '2023 — 2024',
    // achievements 42e44d8f-7ba6-5a28-b8a4-077975fb8a09 (Kissflow migration), b43667bd-ee34-504a-8dfa-2a70f48aba96 (SAP XML).
    summary: 'Moved operational workflows off Kissflow into microservices on AWS ECS, including XML reporting for SAP.',
    tags: ['AWS ECS', 'Microservices', 'SAP integration'],
  },
  {
    // experience f9dac276-c289-5279-9174-97ff0375bba4 (2018-12 to 2023-10).
    role: 'Software Engineer',
    company: 'Syft',
    period: '2018 — 2023',
    // achievements 9974829b-6cb8-58ee-a95e-e76dae0bb798 (20+ team, 4 engineers), b2fe6020-99f1-5823-9702-15d08efb0211 (social pipelines),
    // f613e0b9-57d6-5044-92b1-1ec3bf7d8b59 (Stripe), 6a0e74d2-eeb2-5fc5-9a5f-eacbb988c573 (CI/CD), eea6f2f0-27f5-5218-bc65-ed4cb5126f37 (GKE).
    summary:
      'Nearly five years on an influencer marketing platform with a 20+ engineer team, directly leading 4 backend engineers. Built GraphQL APIs, social data pipelines, Stripe payments, and CI/CD to GKE.',
    // project skills of Syft App 2ab1fd89-74dd-56f8-83dc-e429a315face; Pub/Sub from 0446af9b-ee19-5ee6-b9b0-a2dba25bdd84.
    tags: ['NestJS', 'GraphQL', 'Prisma', 'Redis', 'Pub/Sub', 'GKE'],
  },
];
