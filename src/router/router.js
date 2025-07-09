export class Router {
  constructor(outlet, options = {}) {
    this.routes = [];
    this.beforeHooks = [];
    this.afterHooks = [];
    this.outlet = outlet;
    this.transitionDuration = options.transitionDuration || 300;
    this.currentTransition = null;

    this.setupLinkInterceptor();

    // Ensure route is processed on popstate (eg: browser back button)
    // Else no component.
    window.onpopstate = () => {
      this.handleNavigation(window.location.pathname, { backward: true });
    };
  }

  setRoutes(routes) {
    routes.forEach((route) => {
      this.addRoute(route.path, route.component, route);
    });
  }

  processCurrentRoute() {
    this.handleNavigation(window.location.pathname);
  }

  addRoute(path, component, route) {
    const componentClass = customElements.get(component);
    if (component && !componentClass) {
      console.error(`Component ${component} not found.`);
      return;
    }
    const routePattern = path.replace(/:[^\s/]+/g, "([^/]+)");
    const regex = new RegExp(`^${routePattern}$`);
    this.routes.push({
      ...route,
      regex,
      componentClass,
    });
  }

  addBeforeHook(fn) {
    this.beforeHooks.push(fn);
  }

  addAfterHook(fn) {
    this.afterHooks.push(fn);
  }

  go(path, options = {}) {
    const changeState = options?.replace ? 'replaceState' : 'pushState';

    // Update the URL without refreshing the page
    window.history[changeState]({}, '', path);
    
    // With the URL updated, process the route change (middleware, component swapping)
    this.handleNavigation(path);
  }

  handleNavigation(path, options = {}) {
    const route = this.routes.find((route) => route.regex.test(path));
    if (!route) {
      console.error(`No route found for path: ${path}`);
      return;
    }

    const paramsMatch = route.regex.exec(path);
    const params = this.extractParams(route.path, paramsMatch);
    const context = { route, params };
    const commands = {
      stop: () => { 
        throw new Error('Stop')
      },
      redirect: (destination) => { 
        this.go(destination);
        throw new Error('Redirection');
      }
    };

    const processRoute = async () => {
      try {
        for (const func of this.beforeHooks) {
          const commandResult = await func(context, commands);
        }

        if (route.before) {
          for (const func of route.before) {
            const commandResult = await func(context, commands);
          }
        }

        // Check if middleware has provided a modified component instance
        const componentToRender = route.componentInstance || new route.componentClass();
        this.performTransition(componentToRender, route, options);
        
        if (route.after) {
          for (const func of route.after) {
            func(context, commands);
          }
        }

        for (const func of this.afterHooks) {
          const commandResult = await func(context, commands);
        }
      } catch (error) {
        if (error.message === 'Redirection') {
          console.log('Navigation process terminated due to redirection.');
        } else if (error.message === 'Stop') {
          console.log('Navigation process terminated due to middleware issuing stop command.');
        } else {
          // Re-throw unhandled cases.
          throw error;
        }
      }
    };

    processRoute().catch(console.error);
  }

  setupLinkInterceptor() {
    document.addEventListener("click", (event) => {
      const path = event.composedPath();
      const target = path[0];
      const anchor = target.closest("a");

      // Do not intercept for these cases.
      if (!anchor) return
      if (anchor.target === "_blank") return
      if (anchor.hasAttribute("no-intercept")) return

      // Intercept
      if (anchor.href) {
        event.preventDefault();
        const href = anchor.getAttribute("href");
        history.pushState({}, "", href);
        this.handleNavigation(href);
      }
    });
  }

  extractParams(routePath, paramsMatch) {
    const paramNames = routePath.match(/:([^/]+)/g) || [];
    const params = {};
    paramNames.forEach((name, index) => {
      params[name.substring(1)] = paramsMatch[index + 1];
    });
    return params;
  }

  performTransition(incomingComponent, route, options) {
    if (this.currentTransition) {
      clearTimeout(this.currentTransition);
      this.outlet.firstChild && this.outlet.removeChild(this.outlet.firstChild);
    }

    const outgoingComponent = this.outlet.firstChild;

    let transDuration = 1;
    let doAnimate = false;
    if (options.backward || route.animate) {
      transDuration = this.transitionDuration;
      doAnimate = true;
    }

    // Apply 'transitioning' styles to incoming/outgoing component.
    // As we are about to have both components within the one div
    // They will require to be positioned absolutely, atop of eachother.
    doAnimate && outgoingComponent && outgoingComponent.classList.add('transitioning')
    doAnimate && incomingComponent.classList.add('transitioning');

    // Set the animation duration
    doAnimate && outgoingComponent && outgoingComponent.style.setProperty('--animation-duration', `${transDuration}ms`);
    doAnimate && incomingComponent.style.setProperty('--animation-duration', `${transDuration}ms`);

    // Is this forward navigation or a backward?
    // Forward will have the incoming component on top and sliding up
    // Backward will have the outgoing component on top and sliding down
    const topComponent = options.backward ? outgoingComponent : incomingComponent
    const bottomComponent = options.backward ? incomingComponent : outgoingComponent
    topComponent && topComponent.classList.add('top');

    // Apply animation classes depending on naviation direction
    doAnimate && topComponent && topComponent.classList.add(options.backward ? 'slide-out' : 'slide-in')

    // Add the incoming component to the router-outlet.
    this.outlet.appendChild(incomingComponent);

    // Remove outgoing component after transition completes.
    // Reset styles of incoming component
    const buffer = (options.back || !route.animate) ? 0 : transDuration * 1.25;
    this.currentTransition = setTimeout(() => {
      // After the allocated transition time,
      // Firstly, remove the outgoing component from the DOM
      if (outgoingComponent) {
        this.outlet.removeChild(outgoingComponent);
      }

      // Then, after an additional buffer of time
      // Remove the transitioning classes.
      // Having this performed after the component is removed, prevents a flash of the outgoing component.
      setTimeout(() => {
        doAnimate && incomingComponent && incomingComponent.classList.remove('transitioning');

        // Finally, on next frame, clear the transition.
        requestAnimationFrame(() => {
          this.currentTransition = null;
        });

      }, buffer);
    }, transDuration);

  }
}
