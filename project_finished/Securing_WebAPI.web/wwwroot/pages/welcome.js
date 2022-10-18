const html = () => /*html*/`
<div>
  <h2>Welcome Page</h2>
  <p ic-authorize="admin">I am logged in as an admin</p>
  <p ic-authorize="user">I am logged in as a user</p>
</div>
`;

export default class WelcomePage {
  constructor() { }

  init() { }

  render(params) {
    return html();
  }
}