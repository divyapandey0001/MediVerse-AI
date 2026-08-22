import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  Stethoscope,
  Pill,
  Calculator,
  Bot,
  FolderHeart,
  Users,
  ShieldCheck,
  Activity,
  X
} from 'lucide-react';
import { BLOG_CATEGORIES, ALL_BLOG_ARTICLES, searchBlogArticles, getFeaturedArticle } from '../data/blog/index.js';
import { BlogArticle, BlogCategoryName } from '../types/blog.js';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { trackBlogEvent } from '../utils/analytics.js';

interface BlogListPageProps {
  onNavigate: (page: string) => void;
  initialCategory?: string;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ onNavigate, initialCategory = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const featuredArticle = useMemo(() => getFeaturedArticle(), []);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return searchBlogArticles(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    trackBlogEvent('blog_article_view', { page: 'blog_index' });
  }, []);

  const handleCategorySelect = (catSlug: string) => {
    setSelectedCategory(catSlug);
    trackBlogEvent('blog_category_click', { category_slug: catSlug });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 2) {
      trackBlogEvent('blog_search', { query: val.trim() });
    }
  };

  const handleArticleClick = (article: BlogArticle) => {
    trackBlogEvent('blog_article_view', {
      article_slug: article.slug,
      article_title: article.title,
      category: article.category,
    });
    onNavigate(`blog/${article.slug}`);
  };

  const getCategoryIcon = (name: BlogCategoryName) => {
    switch (name) {
      case 'Medical Reports': return FileText;
      case 'Symptoms': return Stethoscope;
      case 'Medicines': return Pill;
      case 'Wellness & BMI': return Calculator;
      case 'AI in Healthcare': return Bot;
      case 'Medical Records': return FolderHeart;
      case 'Doctor & Patient Care': return Users;
      case 'Appointments': return Calendar;
      case 'Digital Health': return Activity;
      case 'Privacy & Healthcare': return ShieldCheck;
      default: return BookOpen;
    }
  };

  // Structured Data for Blog Homepage
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MediVerse AI Health & Medical Intelligence Blog',
    description: 'Evidence-based healthcare guides, medical report explanations, pharmaceutical insights, and AI health intelligence.',
    url: 'https://medi-verse-ai-wine.vercel.app/blog',
    publisher: {
      '@type': 'Organization',
      name: 'MediVerse AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://medi-verse-ai-wine.vercel.app/assets/mediverse-og.png'
      }
    },
    blogPost: ALL_BLOG_ARTICLES.slice(0, 15).map(article => ({
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt,
      url: `https://medi-verse-ai-wine.vercel.app/blog/${article.slug}`,
      datePublished: article.publishedAt,
      image: article.coverImage,
      author: {
        '@type': 'Organization',
        name: article.author.name
      }
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <SEOHead
        title="Health & Medical Intelligence Blog | MediVerse AI"
        description="Explore 38+ evidence-based healthcare guides on deciphering blood tests, understanding symptoms, medicine safety, BMI wellness, and AI in modern medicine."
        canonicalPath="/blog"
        keywords="medical reports guide, blood test analysis, symptom checker guide, medicine precautions, BMI calculator, AI healthcare blog, MediVerse blog"
        ogType="website"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-950 to-[#061229] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-blue-950 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>MediVerse Health Intelligence Library</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Evidence-Based Health Guides & AI Medical Literacy
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Clear, physician-reviewed educational resources to help you decipher laboratory reports, understand medications, track wellness metrics, and prepare for doctor appointments.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-950/20 p-1.5 border border-slate-200">
              <div className="pl-3.5 pr-2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="blog-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by topic, blood test, medicine, or symptom..."
                className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-300 mt-2 text-left px-2">
                Found <strong>{filteredArticles.length}</strong> matching articles for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* Categories Bar */}
        <section aria-label="Blog categories" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Browse Topics & Specialties ({BLOG_CATEGORIES.length})
            </h2>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleCategorySelect('all')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Reset to All ({ALL_BLOG_ARTICLES.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            <button
              id="category-pill-all"
              onClick={() => handleCategorySelect('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Articles ({ALL_BLOG_ARTICLES.length})
            </button>

            {BLOG_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.slug;
              const Icon = getCategoryIcon(cat.name);
              const count = ALL_BLOG_ARTICLES.filter(a => a.categorySlug === cat.slug).length;

              return (
                <button
                  key={cat.id}
                  id={`category-pill-${cat.slug}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Featured Article Section (shown when on 'all' and no active search) */}
        {!searchQuery && selectedCategory === 'all' && (
          <section aria-label="Featured Health Article" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Image Col */}
              <div className="lg:col-span-6 overflow-hidden rounded-2xl relative aspect-[16/10] group cursor-pointer" onClick={() => handleArticleClick(featuredArticle)}>
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.coverImageAlt}
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
                  Featured Guide
                </div>
              </div>

              {/* Text Col */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {featuredArticle.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredArticle.readTime}
                  </span>
                  <span>•</span>
                  <span>{featuredArticle.publishedAt}</span>
                </div>

                <h2
                  onClick={() => handleArticleClick(featuredArticle)}
                  className="text-2xl sm:text-3xl font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug"
                >
                  {featuredArticle.title}
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                  {featuredArticle.excerpt}
                </p>

                <div className="pt-2">
                  <button
                    id="featured-read-article-btn"
                    onClick={() => handleArticleClick(featuredArticle)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Latest Articles Grid */}
        <section aria-label="Articles list" className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              {searchQuery
                ? `Search Results (${filteredArticles.length})`
                : selectedCategory === 'all'
                ? 'Latest Medical Articles & Guides'
                : `${BLOG_CATEGORIES.find(c => c.slug === selectedCategory)?.name || 'Category'} Articles (${filteredArticles.length})`}
            </h2>
            <span className="text-xs text-slate-500">
              Showing {filteredArticles.length} of {ALL_BLOG_ARTICLES.length} guides
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matching articles found</h3>
              <p className="text-sm text-slate-500">
                We couldn't find any articles matching "{searchQuery}". Try searching for blood tests, symptoms, cholesterol, BMI, or medicines.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(article => {
                const CategoryIcon = getCategoryIcon(article.category);
                return (
                  <article
                    key={article.slug}
                    id={`blog-card-${article.slug}`}
                    onClick={() => handleArticleClick(article)}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                  >
                    {/* Cover Image */}
                    <div className="aspect-[16/10] overflow-hidden relative bg-slate-100">
                      <img
                        src={article.coverImage}
                        alt={article.coverImageAlt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                        <CategoryIcon className="w-3 h-3 text-blue-600" />
                        <span>{article.category}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{article.publishedAt}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                        <span>Read Full Guide</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Healthcare Tool Access Bar */}
        <section aria-label="MediVerse AI Tools" className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-6 sm:p-8 border border-blue-100 space-y-4">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              Put Health Knowledge into Action with MediVerse AI Tools
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Explore our suite of interactive, privacy-focused healthcare tools designed to support your wellness literacy.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { id: 'lab-report', name: 'Lab Analyzer', icon: FileText },
              { id: 'symptom-checker', name: 'Symptoms', icon: Stethoscope },
              { id: 'medicine-info', name: 'Medicine Info', icon: Pill },
              { id: 'bmi', name: 'BMI Calculator', icon: Calculator },
              { id: 'ai-chat', name: 'AI Health Chat', icon: Bot },
              { id: 'appointment', name: 'Book Doctor', icon: Calendar },
            ].map(tool => {
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onNavigate(tool.id)}
                  className="p-3 bg-white hover:bg-blue-600 hover:text-white text-slate-800 rounded-xl border border-blue-100/80 shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
                >
                  <ToolIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                  <span className="text-xs font-semibold">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Medical Safety Disclaimer */}
        <DisclaimerBanner />

      </div>
    </div>
  );
};
