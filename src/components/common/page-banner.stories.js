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
  },
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