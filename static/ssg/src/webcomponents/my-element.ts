import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("my-element")
export class MyElement extends LitElement {
  @property({ type: String })
  username = "World";

  render() {
    return html`<div>
      <h1>Hello ${this.username}</h1>
      <slot></slot>
    </div>`;
  }
}
