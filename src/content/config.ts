import { defineCollection } from 'astro:content';
import { workSchema, bookSchema } from './schema';

export const collections = {
  works: defineCollection({ type: 'content', schema: workSchema }),
  books: defineCollection({ type: 'content', schema: bookSchema }),
};
