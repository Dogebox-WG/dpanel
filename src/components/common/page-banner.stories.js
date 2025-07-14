import './page-banner.js';

export default {
  title: 'Common/PageBanner',
  tags: ['autodocs'],
  render: (args) => `<page-banner title="${args.title}" subtitle="${args.subtitle}">${args.content}</page-banner>`,
  parameters: {
    docs: {
      description: {
        component: 'A page banner component that displays a title, subtitle, and content with styled slots for additional content.',
      },
    },
    // Add CSS dependencies for proper styling
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#23252a',
        },
      ],
    },
  },
  decorators: [
    (story) => {
      // Create a wrapper div with proper theme classes and styles
      const wrapper = document.createElement('div');
      wrapper.className = 'sl-theme-dark';
      wrapper.style.cssText = `
        /* Import custom fonts */
        @import url('/styles/fonts.css');
        
        /* Import global styles */
        @import url('/styles/index.css');
        
        /* Apply global styles inline for Storybook */
        --sl-font-sans: 'Comic Neue', sans-serif;
        --sl-font-weight-normal: 400;
        --sl-line-height-normal: 1.5;
        --sl-color-neutral-900: rgb(226, 232, 240);
        --sl-color-neutral-700: rgb(203, 213, 225);
        --sl-color-neutral-600: rgb(148, 163, 184);
        background: #23252a;
        font: 16px var(--sl-font-sans);
        font-weight: var(--sl-font-weight-normal);
        line-height: var(--sl-line-height-normal);
        color: var(--sl-color-neutral-900);
        padding: 20px;
        min-height: 100vh;
        box-sizing: border-box;
      `;
      
      // Add CSS imports programmatically
      if (!document.querySelector('link[href*="fonts.css"]')) {
        const fontsCSS = document.createElement('link');
        fontsCSS.rel = 'stylesheet';
        fontsCSS.href = '/styles/fonts.css';
        document.head.appendChild(fontsCSS);
      }
      
      if (!document.querySelector('link[href*="index.css"]')) {
        const indexCSS = document.createElement('link');
        indexCSS.rel = 'stylesheet';
        indexCSS.href = '/styles/index.css';
        document.head.appendChild(indexCSS);
      }
      
      wrapper.innerHTML = story();
      return wrapper;
    },
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title text',
    },
    subtitle: {
      control: 'text', 
      description: 'The subtitle text displayed below the title',
    },
    content: {
      control: 'text',
      description: 'Content to be displayed in the default slot',
    },
  },
};

export const Default = {
  args: {
    title: 'Dogebox',
    subtitle: 'Dogecoin',
    content: '<p>Easily manage your Dogecoin Node.<br/>Explore the Doge Ecosystem while you\'re at it.</p>',
  },
};

export const WithSimpleContent = {
  args: {
    title: 'Welcome',
    subtitle: 'Setup',
    content: '<p>Get started with your new Dogebox installation.</p>',
  },
};

export const WithMinimalContent = {
  args: {
    title: 'Settings',
    subtitle: 'Configuration',
    content: '',
  },
}; 