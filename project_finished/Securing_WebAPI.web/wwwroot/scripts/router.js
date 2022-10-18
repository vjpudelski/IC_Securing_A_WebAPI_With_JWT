import Auth from './authentication.js';

// class to handle the routing of SPA site
// routes will use /#/ syntax as history mode is not implemented
export default class Router {
  // constructor needs routes array and element where page html will go
  constructor(routes, rootElement) {
    this.routes = routes;
    this.rootElement = document.querySelector(rootElement);

    // find the default route, only one default may exist
    for (let i = 0, length = routes.length; i < length; i++) {
      let route = routes[i];
      if (route.default) {
        this.defaultRoute = route;
      }
    }

    // get current location from window hash value
    this.goToRoute(window.location.hash);

    // event handler for when hash changes to change route
    window.addEventListener("hashchange", (e) => {
      this.goToRoute(e.currentTarget.location.hash);
    });
  }

  // method to navigate to route
  // once path matched to route, security checked, components render and init methods called
  goToRoute(path) {
    // get the route from the collection
    let nav = this.getRouteFromPath(path);

    // check if the route is accessible
    let isAccessible = this.isRouteAccessible(nav);
    if (isAccessible) {
      // set the root object to the component for that route
      this.rootElement.innerHTML = nav.route.component.render(nav.params);
      nav.route.component.init();
      Auth.showAuth();
      Auth.showAuthorize();
    } else {
      window.location.href = ((path != null || path == "/" || path == "/login") ? "" : "?redirect=" + path) + "#/login";
    }
  }

  // parse path and determine matching route
  getRouteFromPath(path) {
    let route = undefined;

    let paramsNames = [];
    let params = {};

    // loop through routes searching for same pattern
    for (let i = 0, length = this.routes.length; i < length; i++) {
      paramsNames = [];

      // replace parameters in path with regular expression
      // this will allow us to match on static portion of path and pattern of parameters
      let regexPath =
        this.routes[i].path.replace(/([:*])(\w+)/g, (full, colon, path) => {
          paramsNames.push(path);
          return "([^/]+)";
        }) + "(?:/|$)";

      // check if the route matches the path
      let matchPath = path.match(new RegExp(regexPath));

      // if a match is found
      if (matchPath !== null) {
        // parse the parameter values out
        params = matchPath.splice(1).reduce((params, value, index) => {
          if (params === null) params = {};
          params[paramsNames[index]] = value;
          return params;
        }, null);

        // set the route
        route = this.routes[i];
        break;
      }
    }

    // if route not found, use default route
    route = route ? route : this.defaultRoute;
    return { route, params };    
  }

  // check if route is accessible to current user
  isRouteAccessible(nav) {
    let isAccessible = false;

    // if there is an authorize on the route, check permissions
    if (nav.route.authorize) {
      let roles = nav.route.authorize.split(",");
      isAccessible = Auth.isAuthorized(roles);
    } else {
      isAccessible = true;
    }

    return isAccessible;
  }  
}