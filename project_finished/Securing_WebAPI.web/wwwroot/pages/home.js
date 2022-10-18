const html = () => /*html*/`
<div>
  <p>This is my Home Page</p>
  <p ic-auth="true">You are logged in</p>
  <p ic-auth="false">You are NOT logged in</p>
</div>
`;

export default class HomePage {
  constructor() { }

  init() { }

  render(params) {
    return html();
  }
}