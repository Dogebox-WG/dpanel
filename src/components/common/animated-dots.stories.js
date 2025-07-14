// Import the actual animated-dots component
import './animated-dots.js';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
export default {
  title: 'Common/AnimatedDots',
  tags: ['autodocs'],
  render: () => `<animated-dots></animated-dots>`,
  parameters: {
    docs: {
      description: {
        component: 'A simple animated dots component that displays three dots with a fading animation effect.',
      },
    },
  },
};

// Basic story showing the animated dots
export const Default = {
  args: {},
}; 