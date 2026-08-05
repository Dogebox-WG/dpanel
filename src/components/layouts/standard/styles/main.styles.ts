import { css } from '/lib/lit-all.js';

export const mainStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :host {
    display: block;
    overflow: hidden;
  }

  .loader-overlay {
    height: calc(100vh - 3em);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #Main {
    flex-grow: 1;
    
    height: calc(100% - 50px);
    width: 100%;
    overflow: hidden;
    margin-left: var(--page-margin-left);

    background: #23252a;
    
    @media (min-width: 576px) {
      height: 100%;
      width: calc(100% - var(--page-margin-left));
    }

    &.fullscreen {
      margin-left: 0;
      width: 100%;
    }
  }

  #Main.opaque {
    opacity: 1;
  }

  #Outlet {
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: #23252a;
  }
`