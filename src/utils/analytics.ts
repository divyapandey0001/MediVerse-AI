// Google Analytics Event Tracking Utility for MediVerse AI

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'js',
      action: string,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export type BlogAnalyticsEvent =
  | 'blog_article_view'
  | 'blog_search'
  | 'blog_category_click'
  | 'blog_related_article_click'
  | 'blog_service_cta_click'
  | 'blog_share';

export function trackBlogEvent(eventName: BlogAnalyticsEvent, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, {
        platform: 'MediVerse AI',
        ...params,
      });
    } catch (e) {
      console.warn('Analytics event tracking error:', e);
    }
  }
}
