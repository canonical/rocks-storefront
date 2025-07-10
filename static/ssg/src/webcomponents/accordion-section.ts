import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

export interface AccordionSectionData {
  title: string;
  text: string;
  index: string;
}

@customElement("vf-accordion-section")
export class AccordionSection extends LitElement {
  @property({ attribute: false, type: Object })
  context: AccordionSectionData = {
    title: "{{ context.title }}",
    text: "{{ context.text }}",
    index: "{{ context.index }}",
  };

  render() {
    return html`<li class="p-accordion__group">
      <h4 class="p-accordion__heading">
        <button
          type="button"
          class="p-accordion__tab"
          id="tab${this.context.index}"
          aria-controls="tab${this.context.index}-section"
          aria-expanded="true"
        >
          ${this.context.title}
        </button>
      </h4>
      <section
        class="p-accordion__panel"
        id="tab${this.context.index}-section"
        aria-hidden="true"
        aria-labelledby="tab${this.context.index}"
      >
        <p>${this.context.text}</p>
      </section>
    </li>`;
  }
}
