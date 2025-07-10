import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { AccordionSectionData } from "./accordion-section";

@customElement("vf-accordion")
export class Accordion extends LitElement {
  @property({ attribute: false, type: Array })
  context: Array<AccordionSectionData> = [
    {
      title: "{{ accordion.title }}",
      text: "{{ accordion.text }}",
      index: "{{ accordion.index }}",
    },
  ];

  render() {
    return html`<aside class="p-accordion">
      <ul class="p-accordion__list">
        ${repeat(
          this.context,
          (section) => section.title,
          (section, index) =>
            html`<vf-accordion-section
              .context=${section}
              index=${index}
            ></vf-accordion-section>`
        )}
      </ul>
    </aside>`;
  }
}
