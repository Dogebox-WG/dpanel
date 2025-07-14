import './welcome-modal.js';

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
  },
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

export const WithEssentialsSelected = {
  args: {
    open: true,
    selectedOption: 'essentials',
    isInstalling: false,
  },
};

export const WithCoreSelected = {
  args: {
    open: true,
    selectedOption: 'core',
    isInstalling: false,
  },
};

export const WithCustomSelected = {
  args: {
    open: true,
    selectedOption: 'custom',
    isInstalling: false,
  },
};

export const InstallingState = {
  args: {
    open: true,
    selectedOption: 'essentials',
    isInstalling: true,
  },
}; 