import AdminPage from '../pages/admin.js';
import HomePage from '../pages/home.js';
import LoginPage from '../pages/login.js';
import NewPage from '../pages/new.js';
import WelcomePage from '../pages/welcome.js';

export let routes = [
  {
    path: "/",
    component: new HomePage(),
    default: true
  },
  {
    path: "/new",
    component: new NewPage()
  },
  {
    path: "/login",
    component: new LoginPage()
  },
  {
    path: "/admin",
    component: new AdminPage(),
    authorize: "admin"
  },
  {
    path: "/welcome",
    component: new WelcomePage(),
    authorize: "any"
  }
];