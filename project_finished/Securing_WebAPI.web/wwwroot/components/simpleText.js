const html_simpleText = () => /*html*/`
<style>
  label {
    display: block;
  }
</style>
<div>
  <label for="text-input"></label>
  <input id="text-input" />
</div>
`;

class SimpleText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = html_simpleText();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    this.render();
  }

  static get observedAttributes() {
    return ['text'];
  }
  
  get text() {
    return this.getAttribute('text');
  }

  set text(value) {
    this.setAttribute('text', value);
  }

  render() {
    if (this.text) {
      this.shadowRoot.querySelector('label').innerHTML = this.text;
    }
  }
}
customElements.define('simple-text', SimpleText);
