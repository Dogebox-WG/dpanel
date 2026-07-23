import { css } from '/lib/lit-all.js';

export const transitionStyles = css`
  #Outlet > .transitioning {
    position: fixed;
    width: calc(100% - var(--page-margin-left));
    overflow-y: hidden;
    top: 0px;
    right: 0px;
    z-index: 1;
    translate3d(0, 0, 0);
    will-change: transform, opacity;
    --animation-duration: 300ms;
  }

  #Outlet > .transitioning.top {
    z-index: 2;
  }

  #Outlet > .fade { 
    animation: var(--animation-duration) fadeOut ease; 
  }

  #Outlet > .slide-in { 
    animation: var(--animation-duration) slideFadeIn ease; 
  }

  #Outlet > .slide-out { 
    animation: var(--animation-duration) slideFadeOut ease; 
  }

  @keyframes slideFadeIn {
    0% {
      opacity: 0.85;
      transform: translateY(15px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideFadeOut {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(175px);
    }
  }

  @keyframes fadeOut {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.7;
    }
  }
`