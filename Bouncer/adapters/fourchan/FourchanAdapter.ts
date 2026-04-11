import type { PlatformAdapter, PlatformSelectors, PostContent } from '../../src/types';

window.BouncerAdapter = class FourchanAdapter implements PlatformAdapter {
  siteId = 'fourchan' as const;

  selectors: PlatformSelectors = {
    post: '.postContainer',
    sidebar: '#boardNavDesktop',
    sidebarContent: '#boardNavDesktop',
    primaryColumn: '.board',
    nav: '#boardNavDesktop',
    bottomBar: '#boardNavDesktopFoot',
    mutations: '.postMessage',
    textContent: '.postMessage',
  };

  extractPostContent(article: HTMLElement): PostContent {
    const name = article.querySelector('.name, .posterName')?.textContent?.trim() || 'Anonymous';
    const trip = article.querySelector('.postertrip')?.textContent?.trim() || '';
    const subject = article.querySelector('.subject')?.textContent?.trim() || '';
    const msgEl = article.querySelector('.postMessage');
    const text = msgEl?.textContent?.trim() || '';
    const timeEl = article.querySelector('.dateTime');
    const thumbEl = article.querySelector('.fileThumb img, a.fileThumb img') as HTMLImageElement | null;
    const thumbUrl = thumbEl?.src || '';
    const imageUrls = thumbUrl && !thumbUrl.startsWith('data:') ? [thumbUrl] : [];
    const fullText = subject ? `${subject}: ${text}` : text;
    const author = trip ? `${name} ${trip}` : name;
    return {
      text: fullText,
      author,
      handle: name,
      avatarUrl: null,
      timeText: timeEl?.textContent?.trim() || null,
      textHtml: msgEl?.innerHTML || '',
      quote: null,
      postUrl: this.getPostUrl(article),
      imageUrls,
      hasMediaContainer: imageUrls.length > 0,
    };
  }

  shouldProcessCurrentPage(): boolean {
    const path = window.location.pathname;
    return path === '/' || /^\/[a-z0-9]+\/(thread\/\d+|catalog)?\/?$/.test(path);
  }

  isMainPost(article: HTMLElement): boolean {
    if (!/\/thread\/\d+/.test(window.location.pathname)) return false;
    return !!article.querySelector('.post.op');
  }

  getPostUrl(article: HTMLElement): string | null {
    return (article.querySelector('.postNum a:last-child') as HTMLAnchorElement | null)?.href || null;
  }

  getPostContentKey(article: HTMLElement): string {
    return article.id || this.getPostUrl(article) ||
      article.querySelector('.postMessage')?.textContent?.substring(0, 200) || '';
  }

  getPostContainer(article: HTMLElement): HTMLElement { return article; }

  hidePost(article: HTMLElement): void {
    article.style.display = 'none';
    article.dataset.filteredByExtension = 'true';
  }

  getThemeMode(): 'light' | 'dim' | 'dark' {
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

  getShareButton(): HTMLElement | null { return null; }

  insertActionButton(article: HTMLElement, button: HTMLElement): void {
    const info = article.querySelector('.postInfo');
    if (info) info.appendChild(button);
  }

  getSearchForm(): HTMLElement | null { return null; }
};
