import type { PlatformAdapter, PlatformSelectors, PostContent } from '../../src/types';

window.BouncerAdapter = class RedditAdapter implements PlatformAdapter {
  siteId = 'reddit' as const;

  selectors: PlatformSelectors = {
    post: 'shreddit-post, .thing.link, [data-testid="post-container"]',
    sidebar: 'aside, .side, reddit-sidebar-nav',
    sidebarContent: 'aside > div, .side .spacer',
    primaryColumn: 'main, .content[role="main"], shreddit-feed',
    nav: '#header, reddit-header-large, header',
    bottomBar: '.footer-parent, footer',
    mutations: '[slot="text-body"], [slot="title"], .title a, .md',
    textContent: '[slot="text-body"], [slot="title"], .title a, .md',
  };

  extractPostContent(article: HTMLElement): PostContent {
    if (article.tagName.toLowerCase() === 'shreddit-post') return this._extractShreddit(article);
    return this._extractOld(article);
  }

  private _extractShreddit(article: HTMLElement): PostContent {
    const title = article.getAttribute('post-title') || article.querySelector('[slot="title"]')?.textContent?.trim() || '';
    const author = article.getAttribute('author') || '';
    const subreddit = article.getAttribute('subreddit-prefixed-name') || '';
    const bodyEl = article.querySelector('[slot="text-body"]');
    const body = bodyEl?.textContent?.trim() || '';
    const text = body ? `${title}\n${body}` : title;
    const flair = article.getAttribute('flair-text') || '';
    const fullText = flair ? `[${flair}] ${text}` : text;
    const imageEls = article.querySelectorAll('img[src*="redd.it"], img[src*="reddit"], [slot="post-media-container"] img');
    const imageUrls: string[] = [];
    imageEls.forEach(el => {
      const src = (el as HTMLImageElement).src;
      if (src && !src.startsWith('data:') && !src.includes('icon') && !src.includes('avatar')) imageUrls.push(src);
    });
    const permalink = article.getAttribute('permalink') || '';
    return {
      text: subreddit ? `${subreddit}: ${fullText}` : fullText,
      author,
      handle: author ? `u/${author}` : '',
      avatarUrl: null,
      timeText: article.getAttribute('created-timestamp') || null,
      textHtml: bodyEl?.innerHTML || title,
      quote: null,
      postUrl: permalink ? `https://www.reddit.com${permalink}` : null,
      imageUrls,
      hasMediaContainer: imageUrls.length > 0 || !!article.querySelector('[slot="post-media-container"]'),
    };
  }

  private _extractOld(article: HTMLElement): PostContent {
    const titleEl = article.querySelector('.title a.title, [data-testid="post-title"]') as HTMLAnchorElement | null;
    const title = titleEl?.textContent?.trim() || '';
    const author = article.querySelector('.author, [data-testid="post_author_link"]')?.textContent?.trim() || '';
    const subreddit = article.querySelector('.subreddit, [data-testid="subreddit-link"]')?.textContent?.trim() || '';
    const bodyEl = article.querySelector('.md, [data-testid="post-content"]');
    const body = bodyEl?.textContent?.trim() || '';
    const text = body ? `${title}\n${body}` : title;
    const flairEl = article.querySelector('.linkflairlabel, [data-testid="flair"]');
    const flair = flairEl?.textContent?.trim() || '';
    const fullText = flair ? `[${flair}] ${text}` : text;
    const thumbEl = article.querySelector('.thumbnail img, [data-testid="post-thumbnail"] img') as HTMLImageElement | null;
    const imageUrls = thumbEl?.src && !thumbEl.src.includes('self') && !thumbEl.src.includes('default') ? [thumbEl.src] : [];
    return {
      text: subreddit ? `${subreddit}: ${fullText}` : fullText,
      author,
      handle: author ? `u/${author}` : '',
      avatarUrl: null,
      timeText: article.querySelector('time')?.textContent?.trim() || null,
      textHtml: bodyEl?.innerHTML || title,
      quote: null,
      postUrl: titleEl?.href || this.getPostUrl(article),
      imageUrls,
      hasMediaContainer: imageUrls.length > 0,
    };
  }

  shouldProcessCurrentPage(): boolean {
    const path = window.location.pathname;
    return path === '/' || path.startsWith('/r/') || path.startsWith('/user/') ||
      path.startsWith('/search') || path === '/popular' || path === '/all' || path.startsWith('/home');
  }

  isMainPost(article: HTMLElement): boolean {
    if (!/\/comments\//.test(window.location.pathname)) return false;
    const first = document.querySelector(this.selectors.post);
    return article === first;
  }

  getPostUrl(article: HTMLElement): string | null {
    if (article.tagName.toLowerCase() === 'shreddit-post') {
      const p = article.getAttribute('permalink');
      return p ? `https://www.reddit.com${p}` : null;
    }
    const link = article.querySelector('.title a.title, .comments, a[data-testid="post-title"]') as HTMLAnchorElement | null;
    return link?.href || null;
  }

  getPostContentKey(article: HTMLElement): string {
    if (article.tagName.toLowerCase() === 'shreddit-post') return article.getAttribute('id') || article.getAttribute('permalink') || '';
    return article.getAttribute('data-fullname') || article.id || this.getPostUrl(article) || '';
  }

  getPostContainer(article: HTMLElement): HTMLElement { return article; }

  hidePost(article: HTMLElement): void {
    article.style.display = 'none';
    article.dataset.filteredByExtension = 'true';
  }

  getThemeMode(): 'light' | 'dim' | 'dark' {
    if (document.documentElement.classList.contains('theme-dark') || document.body.classList.contains('res-nightmode')) return 'dark';
    const colorScheme = document.documentElement.style.getPropertyValue('color-scheme') || '';
    if (colorScheme.includes('dark')) return 'dark';
    return 'light';
  }

  async extractPostContentFromStore(article: HTMLElement): Promise<PostContent | null> {
    return this.extractPostContent(article);
  }

  cleanupFilteredPostHtml(el: HTMLElement): void {
    el.style.display = '';
    el.removeAttribute('data-filtered-by-extension');
  }

  getShareButton(article: HTMLElement): HTMLElement | null {
    return article.querySelector('[data-testid="share-button"], .share, button[aria-label*="share" i]');
  }

  insertActionButton(article: HTMLElement, button: HTMLElement): void {
    const bar = article.querySelector('.flat-list, .top-matter, [slot="credit-bar"]');
    if (bar) bar.appendChild(button);
  }

  getSearchForm(): HTMLElement | null {
    return document.querySelector('#search, [role="search"], reddit-search-large, form[action="/search"]');
  }
};
