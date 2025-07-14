import './welcome-modal.js';
// Import Shoelace components and setup
import { setBasePath } from "/vendor/@shoelace/cdn@2.14.0/utilities/base-path.js";
import "/vendor/@shoelace/cdn@2.14.0/shoelace.js";

// Set up Shoelace base path for icons and assets
setBasePath("/vendor/@shoelace/cdn@2.14.0/");

export default {
  title: 'Common/WelcomeModal',
  tags: ['autodocs'],
  render: (args) => `<x-welcome-modal 
    open="${args.open}" 
    selected-option="${args.selectedOption}" 
    is-installing="${args.isInstalling}"
  ></x-welcome-modal>`,
  parameters: {
    docs: {
      description: {
        component: 'A welcome modal component that displays pup collection options for first-time users to choose from.',
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
        /* Import Shoelace dark theme styles */
        @import url('/vendor/@shoelace/cdn@2.14.0/themes/dark.css');
        
        /* Import custom fonts */
        @import url('/styles/fonts.css');
        
        /* Import global styles */
        @import url('/styles/index.css');
        
        /* Apply global styles inline for Storybook */
        --sl-font-sans: 'Montserrat', sans-serif;
        --sl-font-weight-normal: 400;
        --sl-line-height-normal: 1.5;
        --sl-color-neutral-900: rgb(226, 232, 240);
        --sl-color-neutral-700: rgb(203, 213, 225);
        --sl-color-neutral-600: rgb(148, 163, 184);
        --sl-panel-background-color: rgb(30, 41, 59);
        --sl-panel-border-color: rgb(51, 65, 85);
        --sl-color-primary-500: rgb(59, 130, 246);
        --sl-color-primary-50: rgb(30, 41, 59);
        --sl-input-focus-ring-color: rgba(59, 130, 246, 0.25);
        --sl-focus-ring-width: 3px;
        --sl-border-radius-medium: 6px;
        --sl-border-radius-small: 4px;
        --sidebar-width: 240px;
        --page-margin-left: 0px;
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
      if (!document.querySelector('link[href*="shoelace"]')) {
        const shoelaceCSS = document.createElement('link');
        shoelaceCSS.rel = 'stylesheet';
        shoelaceCSS.href = '/vendor/@shoelace/cdn@2.14.0/themes/dark.css';
        document.head.appendChild(shoelaceCSS);
      }
      
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
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    selectedOption: {
      control: {
        type: 'select',
        options: ['', 'essentials', 'core', 'custom'],
      },
      description: 'The selected pup collection option',
    },
    isInstalling: {
      control: 'boolean',
      description: 'Whether the modal is in installing state',
    },
  },
};

export const Default = {
  args: {
    open: true,
    selectedOption: '',
    isInstalling: false,
  },
};