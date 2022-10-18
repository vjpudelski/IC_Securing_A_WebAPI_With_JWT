const html = () => /*html*/`
<div>
  <p>This is my New Page</p>
  <simple-text text="Name"></simple-text>
  <div>
    <label for="text-input">Another Label</label>
    <input id="text-input" />
  </div>
</div>
`;

export default class NewPage {
  constructor() { }

  init() { }

  render(params) {
    return html();
  }
}