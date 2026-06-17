import { z } from 'zod';

export const workSchema = z.object({
  title: z.string(),
  type: z.enum(['series', 'standalone']),
  status: z.enum(['live', 'coming-soon', 'locked']),
  tagline: z.string(),
  cover: z.string().optional(),
  accentColor: z.string(),
  genre: z.string().optional(),
  order: z.number().int(),
  // When set, the world tile links OUT to this URL instead of an internal page.
  externalUrl: z.string().url().optional(),
  // Sarcastic Game Master lines specific to this world.
  gmQuips: z.array(z.string()).optional(),
});

export const bookSchema = z.object({
  title: z.string(),
  work: z.string(), // parent work slug
  order: z.number().int(),
  cover: z.string().optional(),
  amazonUrl: z.string().url().optional(),
  paperbackUrl: z.string().url().optional(),
  audiobookUrl: z.string().url().optional(),
  audioSampleUrl: z.string().optional(),
});

export type Work = z.infer<typeof workSchema>;
export type Book = z.infer<typeof bookSchema>;
