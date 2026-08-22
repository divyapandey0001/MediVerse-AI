import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Check,
  Twitter,
  Linkedin,
  Copy,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Info,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { getArticleBySlug, getRelatedArticles } from '../data/blog/index.js';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { trackBlogEvent } from '../utils/analytics.js';

interface BlogPostPageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  const article = getArticleBySlug(slug);
  const relatedArticles = article ? getRelatedArticles(article.slug, 3) : [];

  useEffect(() => {
    if (article) {
      trackBlogEvent('blog_article_view', {
        article_slug: article.slug,
        article_title: article.title,
        category: article.category,
      });
    }
  }, [slug, article]);

  // Observer for active TOC section
  useEffect(() => {
    if (!article) return;

    const handleScroll = () => {
      const headings = article.sections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      const scrollY = window.scrollY + 160;

      for (let i = headings.length - 1; i >= 0; i--) {
        const el = headings[i];
        if (el.offsetTop <= scrollY) {
          setActiveSectionId(el.id);
          return;
        }
      }
      if (headings.length > 0 && headings[0]) {
        setActiveSectionId(headings[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Article Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md">
          We couldn't find the medical guide you're looking for. It may have been moved or updated.
        </p>
        <button
          onClick={() => onNavigate('blog')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Blog Library</span>
        </button>
      </div>
    );
  }

  const canonicalUrl = `https://medi-verse-ai-wine.vercel.app/blog/${article.slug}`;

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    trackBlogEvent('blog_share', { platform, article_slug: article.slug });

    if (platform === 'twitter') {
      const tweetText = encodeURIComponent(`${article.title} - MediVerse AI Health Guide`);
      const url = encodeURIComponent(canonicalUrl);
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'linkedin') {
      const url = encodeURIComponent(canonicalUrl);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCtaClick = () => {
    trackBlogEvent('blog_service_cta_click', {
      service_path: article.targetService.path,
      article_slug: article.slug
    });
    onNavigate(article.targetService.path);
  };

  const handleRelatedClick = (relatedSlug: string) => {
    trackBlogEvent('blog_related_article_click', {
      from_slug: article.slug,
      to_slug: relatedSlug
    });
    onNavigate(`blog/${relatedSlug}`);
  };

  // Structured Data (Article + BreadcrumbList)
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt,
      image: article.coverImage,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: {
        '@type': 'Organization',
        name: article.author.name
      },
      publisher: {
        '@type': 'Organization',
        name: 'MediVerse AI',
        logo: {
          '@type': 'ImageObject',
          url: 'https://medi-verse-ai-wine.vercel.app/assets/mediverse-og.png'
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      keywords: article.keywords.join(', ')
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://medi-verse-ai-wine.vercel.app/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://medi-verse-ai-wine.vercel.app/blog'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.category,
          item: `https://medi-verse-ai-wine.vercel.app/blog?category=${article.categorySlug}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: article.title,
          item: canonicalUrl
        }
      ]
    },
    ...(article.faqs && article.faqs.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <SEOHead
        title={`${article.title} | MediVerse AI Blog`}
        description={article.excerpt}
        canonicalPath={`/blog/${article.slug}`}
        keywords={article.keywords.join(', ')}
        ogType="article"
        ogImage={article.coverImage}
        structuredData={structuredData}
      />

      {/* Top Breadcrumbs Strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <button onClick={() => onNavigate('home')} className="hover:text-blue-600 cursor-pointer">Home</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button onClick={() => onNavigate('blog')} className="hover:text-blue-600 cursor-pointer">Blog</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-700 font-medium">{article.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header Container */}
      <header className="bg-white border-b border-slate-200 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Health Guides</span>
          </button>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                {article.category}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Published: {article.publishedAt}
              </span>
              {article.updatedAt && (
                <>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">Updated: {article.updatedAt}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          {/* Author & Medical Reviewer Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {article.author.name.charAt(0)}
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">{article.author.name}</span>
                  <span className="text-slate-500 text-[11px]">{article.author.role}</span>
                </div>
              </div>

              {article.medicalReviewer && (
                <div className="flex items-center gap-2 pl-3 sm:border-l border-slate-200">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Medically Reviewed</span>
                    <span className="text-slate-500 text-[11px]">{article.medicalReviewer.name} ({article.medicalReviewer.credentials})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Share on X / Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShare('copy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Copy Link to Article"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Article Body Col */}
          <article className="lg:col-span-8 space-y-8">
            
            {/* Featured Image */}
            <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200/80 aspect-[16/9] bg-slate-100">
              <img
                src={article.coverImage}
                alt={article.coverImageAlt}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Key Takeaways Box */}
            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Key Takeaways</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {article.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Sections */}
            <div className="space-y-10 text-slate-800 leading-relaxed text-base">
              {article.sections.map(section => (
                <section key={section.id} id={section.id} className="space-y-4 scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-2 border-t border-slate-100">
                    {section.heading}
                  </h2>

                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-700 leading-relaxed text-[15px] sm:text-base">
                      {p}
                    </p>
                  ))}

                  {/* Bullet points */}
                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <ul className="space-y-2 pl-2 text-sm sm:text-[15px] text-slate-700">
                      {section.bulletPoints.map((item, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Callout */}
                  {section.callout && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 my-4 ${
                      section.callout.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : section.callout.type === 'tip'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                      {section.callout.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      ) : section.callout.type === 'tip' ? (
                        <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div className="text-sm space-y-1">
                        {section.callout.title && <strong className="block font-bold">{section.callout.title}</strong>}
                        <p className="leading-relaxed">{section.callout.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  {section.table && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 my-4 shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                          <tr>
                            {section.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-3 px-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-3 px-4 text-slate-700">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* FAQs Accordion Section */}
            {article.faqs && article.faqs.length > 0 && (
              <section aria-label="Frequently Asked Questions" className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h3>
                </div>
                <div className="space-y-3">
                  {article.faqs.map((faq, fIdx) => (
                    <div key={fIdx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {faq.question}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Medical Educational Disclaimer */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Medical Content Educational Disclaimer</span>
              </div>
              <p className="leading-relaxed text-amber-800/90">
                This article is provided for educational and health literacy purposes only. It is not medical advice, diagnosis, or treatment. Always consult a licensed healthcare professional or your primary physician regarding specific medical conditions or medication changes. In a medical emergency, call your local emergency hotline immediately.
              </p>
            </div>

            {/* Service CTA Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-600/20 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>MediVerse AI Healthcare Suite</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {article.targetService.title}
              </h3>

              <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-xl">
                {article.targetService.description}
              </p>

              <div className="pt-2">
                <button
                  id="article-service-cta-btn"
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{article.targetService.buttonText}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <section aria-label="Related Health Guides" className="pt-8 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Recommended Next Reads</h3>
                  <button
                    onClick={() => onNavigate('blog')}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all guides
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map(rel => (
                    <div
                      key={rel.slug}
                      onClick={() => handleRelatedClick(rel.slug)}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {rel.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100">
                        <Clock className="w-3 h-3" />
                        <span>{rel.readTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </article>

          {/* Sidebar / Table of Contents (Sticky on Desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Table of Contents Card */}
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Table of Contents</span>
              </div>

              <nav aria-label="Table of Contents" className="space-y-1 text-xs">
                {article.sections.map(section => {
                  const isActive = activeSectionId === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block py-1.5 px-2.5 rounded-lg transition-colors leading-snug ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      {section.heading}
                    </a>
                  );
                })}
              </nav>

              {/* Sidebar Quick CTA */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Interactive Tool
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    {article.targetService.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Put this guide into practice with MediVerse AI tools.
                  </p>
                  <button
                    onClick={handleCtaClick}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    {article.targetService.buttonText}
                  </button>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
};
