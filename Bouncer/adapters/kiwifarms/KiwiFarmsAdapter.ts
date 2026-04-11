import type { PlatformAdapter, PlatformSelectors, PostContent } from '../../src/types';

window.BouncerAdapter = class KiwiFarmsAdapter implements PlatformAdapter {
  siteId = 'kiwifarms' as const;

  selectors: PlatformSelectors = {
    post: '.message--post, .structItem--thread',
    sidebar: '.p-body-sidebar',
    sidebarContent: '.p-body-sidebar .block',
    primaryColumn: '.p-body-main',
    nav: '.p-nav',
    bottomBar: '.p-footer',
    mutations: '.message-body .bbWrapper, .structItem-title a',
    textContent: '.message-body .bbWrapper, .structItem-title a',
  };

  extractPostContent(article: HTMLElement): PostContent {
    if (article.classList.contains('structItem--thread')) return this._extractThread(article);
    const nameEl = article.querySelector('.message-name a, .username');
    const author = nameEl?.textContent?.trim() || '';
    const bodyEl = article.querySelector('.message-body .bbWrapper');
    const text = bodyEl?.textContent?.trim() || '';
    const textHtml = bodyEl?.innerHTML || '';
    const timeEl = article.querySelector('.message-attribution time, .message-date time');
    const avatarEl = article.querySelector('.message-avatar img, .avatar img') as HTMLImageElement | null;
    const imageEls = article.querySelectorAll('.message-body .bbImage, .message-body img.bbImage');
    const imageUrls: string[] = [];
    imageEls.forEach(el => {
      const src = (el as HTMLImageElement).src;
      if (src && !src.startsWith('data:')) imageUrls.push(src);
    });
    return {
      text,
      author,
      handle: author,
      avatarUrl: avatarEl?.src || null,
      timeText: timeEl?.textContent?.trim() || null,
      textHtml,
      quote: null,
      postUrl: this.getPostUrl(article),
      imageUrls,
      hasMediaContainer: imageUrls.length > 0,
    };
  }

  private _extractThread(article: HTMLElement): PostContent {
    const titleEl = article.querySelector('.structItem-title a') as HTMLAnchorElement | null;
    const title = titleEl?.textContent?.trim() || '';
    const author = article.querySelector('.structItem-cell--latest .username, .structItem-minor .username')?.textContent?.trim() || '';
    const preview = article.querySelector('.structItem-snippet')?.textContent?.trim() || '';
    const timeEl = article.querySelector('time');
    return {
      text: preview ? `${title}: ${preview}` : title,
      author,
      handle: author,
      avatarUrl: null,
      timeText: timeEl?.textContent?.trim() || null,
      textHtml: titleEl?.innerHTML || title,
      quote: null,
      postUrl: titleEl?.href || null,
      imageUrls: [],
      hasMediaContainer: false,
    };
  }

  shouldProcessCurrentPage(): boolean {
    const path = window.location.pathname;
    return path === '/' || path.startsWith('/threads') || path.startsWith('/forums') ||
      path.startsWith('/search') || path.startsWith('/whats-new');
  }

  isMainPost(article: HTMLElement): boolean {
    if (!/\/threads\//.test(window.location.pathname)) return false;
    const firstPost = document.querySelector('.message--post');
    return article === firstPost;
  }

  getPostUrl(article: HTMLElement): string | null {
    const link = article.querySelector('.message-attribution a[href*="post-"], .message-date a, .structItem-title a') as HTMLAnchorElement | null;
    return link?.href || null;
  }

  getPostContentKey(article: HTMLElement): string {
    return article.getAttribute('data-content') || article.id || this.getPostUrl(article) ||
      article.querySelector('.bbWrapper, .structItem-title a')?.textContent?.substring(0, 200) || '';
  }

  getPostContainer(article: HTMLElement): HTMLElement { return article; }

  hidePost(article: HTMLElement): void {
    article.style.display = 'none';
    article.dataset.filteredByExtension = 'true';
  }

  getThemeMode(): 'light' | 'dim' | 'dark' {
    const styleId = document.documentElement.getAttribute('data-style-id') || '';
    if (/dark/i.test(styleId)) return 'dark';
    const bg = window.getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m && Number(m[1]) > 200 && Number(m[2]) > 200 && Number(m[3]) > 200) return 'light';
    return 'dark';
  }

  async extractPostContentFromStore(article: HTMLElement): Promise<PostContent | null> {
    return this.extractPostContent(article);
  }

  cleanupFilteredPostHtml(el: HTMLElement): void {
    el.style.display = '';
    el.removeAttribute('data-filtered-by-extension');
  }

  getShareButton(article: HTMLElement): HTMLElement | null {
    return article.querySelector('.actionBar-action--share, a[data-xf-click="share"]');
  }

  insertActionButton(article: HTMLElement, button: HTMLElement): void {
    const bar = article.querySelector('.message-actionBar, .actionBar');
    if (bar) bar.appendChild(button);
  }

  getSearchForm(): HTMLElement | null {
    return document.querySelector('.p-nav-search form, form[action*="search"]');
  }
};
