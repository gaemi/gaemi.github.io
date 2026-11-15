export interface ExternalLink {
  label: string;
  href: string;
  meta: string;
  external?: boolean;
}

export const siteConfig = {
  name: 'gaemi',
  title: 'gaemi · 송정훈',
  description: '송정훈(gaemi)의 개인 웹사이트와 기록 공간.',
  url: 'https://gaemi.github.io',
  locale: 'ko-KR',
  intro: {
    headline: 'gaemi',
    role: '송정훈 · Software Engineer',
    summary:
      '복잡한 문제를 단순하고 단단하게 풀어내는 일을 좋아합니다. 만들고 배운 것들과 소소한 기록을 이곳에 가볍게 남깁니다.',
  },
  companion: {
    caption: 'Resident supervisor',
  },
  /**
   * Primary index links shown on `/`.
   * Update handles/URLs here as channels evolve; keep portfolio/product links out until ready.
   */
  links: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/gaemi/',
      meta: 'in/gaemi',
      external: true,
    },
    {
      label: 'GitHub',
      href: 'https://github.com/gaemi',
      meta: '@gaemi',
      external: true,
    },
    {
      label: 'Blog',
      href: '/blog/',
      meta: '/blog',
      external: false,
    },
    {
      label: 'RSS',
      href: '/rss.xml',
      meta: '/rss.xml',
      external: false,
    },
  ] satisfies ExternalLink[],
} as const;
