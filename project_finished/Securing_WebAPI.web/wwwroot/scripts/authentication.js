export default class Authentication {
  static #userKey = "user";
  static #tokenKey = "token";

  static login(user, token) {
    // store the items in the session storage
    sessionStorage.setItem(this.#userKey, JSON.stringify(user));
    sessionStorage.setItem(this.#tokenKey, JSON.stringify(token));
  }

  static logout() {
    // remove the items from session storage
    sessionStorage.removeItem(this.#userKey);
    sessionStorage.removeItem(this.#tokenKey);
  }
  
  static isAuthorized(roles) {
    var isAuthorized = false;

    // if roles is set to 'any', need only check if logged in
    if (roles.length == 1 && roles[0] == 'any') {
      isAuthorized = this.isLoggedIn();
    } else {
      // else if logged in see if the role matches any of the roles on the route
      if (this.isLoggedIn()) {
        isAuthorized = roles.some((r) => r == this.getUser().role);
      }
    }

    return isAuthorized;
  }
  
  static isLoggedIn() {
    // return if there is a user object
    let user = this.getUser();
    return (user != null);
  }

  static getUser() {
    // return the user object
    return JSON.parse(sessionStorage.getItem(this.#userKey));
  }

  static showAuth() {
    // get all elements with the proper tag
    let elements = document.querySelectorAll("[ic-auth]");

    // check if we are logged in
    let isAuth = this.isLoggedIn();

    // iterate the elements with the proper tag
    elements.forEach((el) => {
      // if tag is true and matches login state, show
      if ((el.getAttribute("ic-auth") == "true") == isAuth) {
        el.removeAttribute("hidden");
      } else {
        // else hide element
        el.setAttribute("hidden", "hidden");
      }
    });
  }

  static showAuthorize() {
    // get all the elements 
    var elements = document.querySelectorAll("[ic-authorize]");

    // if not logged in, hide elements
    if (!this.isLoggedIn()) {
      elements.forEach((el) => {
        el.setAttribute("hidden", "hidden");
      });
    } else { 
      // else get the user
      let user = this.getUser();
      elements.forEach((el) => {
        // get the value of the tag
        let value = el.getAttribute("ic-authorize");

        // if the value is blank or matches the user role show
        if (value == "" || user.role.includes(value)) {
          el.removeAttribute("hidden");
        } else {
          // hide the element
          el.setAttribute("hidden", "hidden");
        }
      });
    }
  }
}
