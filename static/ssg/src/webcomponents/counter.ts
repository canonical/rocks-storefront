import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("my-counter")
export class XCounter extends LitElement {
  @property({ type: Number })
  value = 0;

  render() {
    return html`
      <style>
        button,
        p {
          display: inline-block;
        }
      </style>
      <button @click="${() => this.decrement()}" aria-label="decrement">
        -
      </button>
      <p>${this.value}</p>
      <button @click="${() => this.increment()}" aria-label="increment">
        +
      </button>
    `;
  }

  decrement() {
    this.value--;
    this._valueChanged();
  }

  increment() {
    this.value++;
    this._valueChanged();
  }

  _valueChanged() {
    this.dispatchEvent(new CustomEvent("valueChange", { detail: this.value }));
  }
}
