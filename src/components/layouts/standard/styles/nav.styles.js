import { css } from "/vendor/@lit/all@3.1.2/lit-all.min.js";

export const navStyles = css`
  #Nav {
    position: fixed;
    z-index: 700;
    top: 0;
    left: calc(0px - var(--sidebar-width));
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    overflow: hidden;
    width: var(--sidebar-width);

    @media (min-width: 576px) {
      border-right: 1px solid #333333;
    }

    @media (min-width: 576px) {
      left: 0;
      box-shadow: none;
    }
  }

  #Nav[open] {
    transition: left 200ms ease-out;
    box-shadow: 10px 0 5px -5px rgba(0, 0, 0, 0.2);
    z-index: 700;
    left: 0px;

    @media (min-width: 576px) {
      box-shadow: none;
    }
  }
  #Nav[animating] {
    transition: left 200ms ease-out;
  }

  .logo-link {
    margin-top: 2em;
    margin-bottom: -1em;
    display: flex;
    flex-direction: column;
    align-items: center;

    color: #8c8c8c;
    text-shadow: rgba(0,0,0,.02);
    text-decoration: none;

    transition: filter 300ms ease;
    &:hover .img { 
      filter: drop-shadow(0 0 1rem #373b75);
    }
    &.active .img { 
      filter: drop-shadow(0 0 1rem #373b75);
    }

    .img {
      width: 180px;
      filter: drop-shadow(0 0 1rem #433);
      margin-bottom: -7px;

      @media (min-width: 576px) {
        width: 100px;
      }
    }
    .sublabel {
      margin: 0;
      font-family: "Comic Neue";
      margin-bottom: -25px;
      position: relative;
      left: -7px;
      z-index: 1;
      color: #ffea43;
    }
    .label {
      font-family: "Montserrat";
      font-weight: 700;
      font-size: 1.7rem;
      margin-top: -6px;
      user-select: none;
      color: #222;
    }

    .icon {
      color: #ffea43;
      position: absolute;
      font-size: 0.8rem;
      top: 21px;
      right: -15px;
      transform: rotate(7deg);
    }
  }

  #Side {
    flex-direction: column;
    justify-content: space-between;
    row-gap: 1em;

    width: 100%;
    height: 100vh;
    overflow-y: auto;

    background: #181818;
    box-shadow: 0;

    @media (min-width: 576px) {
      width: var(--sidebar-width);
      box-shadow: 10px 0 5px -5px rgba(0, 0, 0, 0.2);
    }

    @media (min-width: 1024px) {
      width: var(--sidebar-width);
    }
  }

  #Side .inner.opaque {
    opacity: 0.1;
  }

  #Side .inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #Side .menu-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    column-gap: 1em;

    margin: 0.2em 0em 0.2em 1em;
    padding: 0.55em 1.4em;

    @media (min-width:576px) {
      margin-left: 0em;
    }

    font-family: "Comic Neue";
    font-size: 1.2rem;
    font-weight: 400;

    cursor: pointer;
  }

  #Side .menu-item,
  #Side .menu-item sl-icon {
    text-decoration: none;
    user-select: none;
  }

  #Side .menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  #Side .menu-item.active,
  #Side .menu-item.active sl-icon {
    text-decoration: none;
    color: white;
    background: #4360ff;
  }

  #Side .menu-item,
  #Side .sub-menu-item {
    color: rgba(255, 255, 255, 0.5);
  }

  #Side .menu-item sl-icon,
  #Side .sub-menu-item sl-icon {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .nav-footer-content {
    padding: 0em var(--sl-spacing-x-large);
    padding-bottom: var(--sl-spacing-x-large);
  }

  #Side section.section-installed .menu-item.active {
    background: #4360ff;
  }

  .nav-footer {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: var(--sidebar-width);
  }

  .nav-footer .connection {
    display: flex;
    flex-direction: row;
    padding: 0.3em 1em;
    background: #2ede75;
    gap: 0.5em;
    align-items: baseline;
    color: black;

    sl-icon {
      position: relative;
      top: 4px;
      font-size: 1.2rem;
    }
  }

  .nav-update-badge {
    margin-left: auto;
    font-size: 0.7rem;
  }

  .nav-update-badge::part(base) {
    padding: 0.2em 0.5em;
    min-width: 1.2em;
    height: 1.2em;
    font-weight: bold;
  }
`;
