import Auth from '../scripts/authentication.js';
import WebAPI from '../scripts/webapi.js';

const html = () => /*html*/`
<div>
  <form id="form-login">
    <h2>Login Page</h2>
    <div>
      <label for="text-user">UserName: </label>
      <input id="text-username" />
    </div>
    <div>
      <label for="text-input">Password: </label>
      <input id="text-password" type="password" />
    </div>
    <button>Login</button>
</div>
`;

export default class LoginPage {
  constructor() { }

  init() {
    document.querySelector('#form-login').addEventListener('submit', e => {
      e.preventDefault();
      this.login();
    });
  }

  render(params) {
    return html();
  }

  login() {
    let request = {
      userName: document.querySelector('#text-username').value,
      password: document.querySelector('#text-password').value
    };

    WebAPI.execFetch('/authentication/login', 'POST', WebAPI.defaultHeaders, request)
      .then(data => {
        Auth.login(data.user, data.token);
        window.location.href = '/#/welcome';
      });
  }
}