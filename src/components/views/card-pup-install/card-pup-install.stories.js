import './index.js';
// Import Shoelace components and setup
import { setBasePath } from "/vendor/@shoelace/cdn@2.14.0/utilities/base-path.js";
import "/vendor/@shoelace/cdn@2.14.0/shoelace.js";

// Set up Shoelace base path for icons and assets
setBasePath("/vendor/@shoelace/cdn@2.14.0/");

export default {
  title: 'Views/PupInstallCard',
  tags: ['autodocs'],
  render: (args) => `<pup-install-card 
    pup-id="${args.pupId}"
    pup-name="${args.pupName}" 
    version="${args.version}"
    short="${args.short}"
    default-icon="${args.defaultIcon}"
    logo-base64="${args.logoBase64}"
    status="${args.status}"
    installed="${args.installed}"
    update-available="${args.updateAvailable}"
    href="${args.href}"
  ></pup-install-card>`,
  parameters: {
    docs: {
      description: {
        component: 'A pup install card component that displays pup information in the store listing.',
      },
    },
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
        max-width: 600px;
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
    pupId: {
      control: 'text',
      description: 'Unique identifier for the pup',
    },
    pupName: {
      control: 'text',
      description: 'Name of the pup',
    },
    version: {
      control: 'text',
      description: 'Version of the pup',
    },
    short: {
      control: 'text',
      description: 'Short description of the pup',
    },
    defaultIcon: {
      control: 'text',
      description: 'Default icon name for the pup',
    },
    logoBase64: {
      control: 'text',
      description: 'Base64 encoded logo image',
    },
    status: {
      control: {
        type: 'select',
        options: ['running', 'stopped', 'installing', 'error'],
      },
      description: 'Current status of the pup',
    },
    installed: {
      control: 'boolean',
      description: 'Whether the pup is installed',
    },
    updateAvailable: {
      control: 'boolean',
      description: 'Whether an update is available',
    },
    href: {
      control: 'text',
      description: 'Link href for the pup card',
    },
  },
};

// Dogecoin Core story as requested
export const DogecoinCore = {
  args: {
    pupId: 'dogecoin-core',
    pupName: 'Dogecoin Core',
    version: '0.0.7',
    short: 'Run a full core node on your dogebox',
    defaultIcon: 'cpu',
    logoBase64: '',
    status: 'stopped',
    installed: false,
    updateAvailable: false,
    href: '#/pup/dogecoin-core',
  },
};

// Additional examples for variety
export const Installed = {
  args: {
    pupId: 'dogecoin-core',
    pupName: 'Dogecoin Core',
    version: '0.0.7',
    short: 'Run a full core node on your dogebox',
    defaultIcon: 'cpu',
    logoBase64: '',
    status: 'running',
    installed: true,
    updateAvailable: false,
    href: '#/pup/dogecoin-core',
  },
};

export const UpdateAvailable = {
  args: {
    pupId: 'dogecoin-core',
    pupName: 'Dogecoin Core',
    version: '0.0.7',
    short: 'Run a full core node on your dogebox',
    defaultIcon: 'cpu',
    logoBase64: '',
    status: 'stopped',
    installed: true,
    updateAvailable: true,
    href: '#/pup/dogecoin-core',
  },
};

export const WithCustomLogo = {
  args: {
    pupId: 'dogecoin-core',
    pupName: 'Dogecoin Core',
    version: '0.0.7',
    short: 'Run a full core node on your dogebox',
    defaultIcon: 'cpu',
    logoBase64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGN0EzMDgiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeD0iMTIiIHk9IjEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjAgMzlDMzAuNDkzNCAzOSAzOSAzMC40OTM0IDM5IDIwQzM5IDkuNTA2NTkgMzAuNDkzNCAxIDIwIDFDOS41MDY1OSAxIDEgOS41MDY1OSAxIDIwQzEgMzAuNDkzNCA5LjUwNjU5IDM5IDIwIDM5WiIgZmlsbD0iI0Y3QTMwOCIvPgo8L3N2Zz4KPC9zdmc+',
    status: 'stopped',
    installed: false,
    updateAvailable: false,
    href: '#/pup/dogecoin-core',
  },
}; 