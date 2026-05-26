import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'AI 实战教程',
  description: '手把手教你用 AI 解决实际问题',
  base: '/ai-tutorials/',

  head: [
    ['meta', { property: 'og:title', content: 'AI 实战教程' }],
    ['meta', { property: 'og:description', content: '手把手教你用 AI 解决实际问题' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'AI 实战教程' }],
    ['meta', { name: 'twitter:description', content: '手把手教你用 AI 解决实际问题' }],
    ['link', { rel: 'icon', href: '/favicon.svg' }]
  ],

  themeConfig: {
    appearance: 'dark',

    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/tutorials/' },
      { text: '关于', link: '/about' }
    ],

    sidebar: [
      {
        text: '📚 教程分类',
        items: [
          {
            text: '🤖 AI 知识',
            items: [
              { text: 'AI Agent 全面入门', link: '/tutorials/knowledge/ai-agent-intro' },
              { text: 'AI Agent 开发实战', link: '/tutorials/knowledge/ai-agent-dev' },
              { text: '具身智能全面入门', link: '/tutorials/knowledge/embodied-ai-intro' },
              { text: '具身智能技术详解与实战', link: '/tutorials/knowledge/embodied-ai-dev' },
              { text: 'DeepSeek V4 实战教程', link: '/tutorials/knowledge/deepseek-v4' },
              { text: '国产算力与低比特大模型', link: '/tutorials/knowledge/domestic-chips-low-bit' }
            ]
          },
          {
            text: '💻 编程开发',
            items: [
              { text: '用Claude Code帮你debug代码', link: '/tutorials/coding/claude-debug' },
              { text: '用AI写单元测试代码', link: '/tutorials/coding/ai-unit-test' }
            ]
          },
          {
            text: '📝 写作文案',
            items: [
              { text: '用ChatGPT 10分钟写完周报', link: '/tutorials/writing/chatgpt-weekly-report' },
              { text: '用AI把长文章提炼成3页摘要', link: '/tutorials/writing/ai-summary' }
            ]
          },
          {
            text: '📊 办公效率',
            items: [
              { text: '用AI一键生成PPT', link: '/tutorials/productivity/ai-ppt' },
              { text: '用AI做Excel数据分析报告', link: '/tutorials/productivity/ai-excel-report' }
            ]
          },
          {
            text: '🎨 设计创意',
            items: []
          },
          {
            text: '🎬 视频制作',
            items: []
          }
        ]
      }
    ],

    editLink: {
      pattern: 'https://github.com/guaishoulin/ai-tutorials/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/guaishoulin' }
    ],

    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright © 2026 AI 实战教程'
    }
  },

  build: {
    sitemap: {
      hostname: 'https://guaishoulin.github.io/ai-tutorials/'
    }
  }
})
