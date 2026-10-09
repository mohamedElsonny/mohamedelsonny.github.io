import type { Profile } from './types';

// Source: Career Vault profile bcbef25e-bf60-513f-91c1-d181bc6f2aed (usable_profiles).
export const profile: Profile = {
  // full_name "Mohamed Gamal Abdelrazeq"; the short form was chosen by the user (2026-10-09).
  name: 'Mohamed Gamal',
  // professional_title "Senior Full Stack Software Engineer", shortened for the site.
  title: 'Senior Full Stack Engineer',
  // profile summary: web apps, serverless pipelines, real-time systems.
  lead: 'I design and ship scalable web apps, serverless pipelines, and real-time systems.',
  location: 'Cairo, Egypt',
  siteUrl: 'https://mohamedelsonny.github.io',
  links: {
    github: 'https://github.com/mohamedElsonny',
    linkedin: 'https://linkedin.com/in/mohamedelsonny8',
  },
  // profiles.email, split so the whole address never appears in the HTML.
  emailParts: { user: 'mohamedelsonny5', domain: 'gmail.com' },
  about: [
    // profile summary: Cairo, 7+ years, the frontend/backend/cloud stack.
    [
      "I'm a full stack engineer based in Cairo with ",
      { strong: '7+ years' },
      ' of designing and shipping production systems. On the frontend I work in ',
      { strong: 'React and Next.js' },
      '; on the backend in ',
      { strong: 'Node.js, Go, and PostgreSQL' },
      ', running on ',
      { strong: 'AWS, GCP, and Kubernetes' },
      '.',
    ],
    // profile summary (domains) + experience 467d7423-acab-5001-8608-bd976dc33331 (independent, 2024-03 to present).
    [
      "I've built across influencer marketing, FinTech and NFTs, real estate, industrial logistics, AgriTech, and AI reading platforms. Lately I've been building as an independent engineer for clients.",
    ],
  ],
};
