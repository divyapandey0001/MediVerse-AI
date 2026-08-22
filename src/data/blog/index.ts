import { BlogArticle, BlogCategory } from '../../types/blog.js';
import { BLOG_CATEGORIES } from './categories.js';
import { medicalReportsArticles } from './medicalReports.js';
import { symptomsArticles } from './symptoms.js';
import { medicinesArticles } from './medicines.js';
import { wellnessBmiArticles } from './wellnessBmi.js';
import { aiHealthcareArticles } from './aiHealthcare.js';
import { medicalRecordsArticles } from './medicalRecords.js';
import { doctorCareArticles } from './doctorCare.js';
import { appointmentsArticles } from './appointments.js';
import { privacyDigitalHealthArticles } from './privacyDigitalHealth.js';

export { BLOG_CATEGORIES };

export const ALL_BLOG_ARTICLES: BlogArticle[] = [
  ...medicalReportsArticles,
  ...symptomsArticles,
  ...medicinesArticles,
  ...wellnessBmiArticles,
  ...aiHealthcareArticles,
  ...medicalRecordsArticles,
  ...doctorCareArticles,
  ...appointmentsArticles,
  ...privacyDigitalHealthArticles
];

// Helper to look up an article by slug (case-insensitive & trimmed)
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  if (!slug) return undefined;
  const normalized = slug.trim().toLowerCase();
  return ALL_BLOG_ARTICLES.find(
    article => article.slug.toLowerCase() === normalized
  );
}

// Helper to get the primary featured article
export function getFeaturedArticle(): BlogArticle {
  const explicitFeatured = ALL_BLOG_ARTICLES.find(a => a.isFeatured);
  return explicitFeatured || ALL_BLOG_ARTICLES[0];
}

// Helper to get articles by category slug
export function getArticlesByCategory(categorySlug: string): BlogArticle[] {
  if (!categorySlug || categorySlug === 'all') {
    return ALL_BLOG_ARTICLES;
  }
  const normalized = categorySlug.trim().toLowerCase();
  return ALL_BLOG_ARTICLES.filter(
    article => article.categorySlug.toLowerCase() === normalized
  );
}

// Helper to get related articles
export function getRelatedArticles(currentSlug: string, count: number = 3): BlogArticle[] {
  const current = getArticleBySlug(currentSlug);
  if (!current) return ALL_BLOG_ARTICLES.slice(0, count);

  // 1. Try explicit relatedSlugs
  if (current.relatedSlugs && current.relatedSlugs.length > 0) {
    const explicitMatches = current.relatedSlugs
      .map(slug => getArticleBySlug(slug))
      .filter((a): a is BlogArticle => a !== undefined && a.slug !== current.slug);

    if (explicitMatches.length >= count) {
      return explicitMatches.slice(0, count);
    }
  }

  // 2. Fill with articles from the same category
  const sameCategory = ALL_BLOG_ARTICLES.filter(
    a => a.categorySlug === current.categorySlug && a.slug !== current.slug
  );

  // 3. Fallback to others
  const others = ALL_BLOG_ARTICLES.filter(
    a => a.slug !== current.slug && a.categorySlug !== current.categorySlug
  );

  const combined = [...sameCategory, ...others];
  const uniqueSlugs = new Set<string>();
  const results: BlogArticle[] = [];

  for (const article of combined) {
    if (!uniqueSlugs.has(article.slug) && article.slug !== current.slug) {
      uniqueSlugs.add(article.slug);
      results.push(article);
      if (results.length >= count) break;
    }
  }

  return results;
}

// Helper for fast, client-side keyword & category search
export function searchBlogArticles(query: string, categorySlug?: string): BlogArticle[] {
  let list = ALL_BLOG_ARTICLES;

  if (categorySlug && categorySlug !== 'all') {
    const catNorm = categorySlug.trim().toLowerCase();
    list = list.filter(a => a.categorySlug.toLowerCase() === catNorm);
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = query.trim().toLowerCase();
  const searchTokens = q.split(/\s+/).filter(Boolean);

  return list.filter(article => {
    const titleMatch = article.title.toLowerCase();
    const excerptMatch = article.excerpt.toLowerCase();
    const categoryMatch = article.category.toLowerCase();
    const keywordsMatch = article.keywords.map(k => k.toLowerCase()).join(' ');
    const authorMatch = article.author.name.toLowerCase();

    const fullSearchHaystack = `${titleMatch} ${excerptMatch} ${categoryMatch} ${keywordsMatch} ${authorMatch}`;

    return searchTokens.every(token => fullSearchHaystack.includes(token));
  });
}
