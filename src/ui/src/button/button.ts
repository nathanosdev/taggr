import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

export interface ButtonProps {}

@customElement("tgr-button")
export class Button extends LitElement implements ButtonProps {
    static override styles = css`
        button {
            cursor: pointer;
            display: inline-block;

            text-transform: var(--btn-text-transform);
            font-size: var(--btn-font-size);
            font-weight: var(--btn-font-weight);

            border: var(--btn-border);
            border-radius: var(--btn-border-radius);
            padding: var(--btn-padding-y) var(--btn-padding-x);

            color: var(--btn-accent-color);
            background-color: var(--btn-accent-background-color);
        }

        button:hover {
            color: var(--btn-accent-hover-color);
            background-color: var(--btn-accent-hover-background-color);
        }

        button:active {
            color: var(--btn-accent-active-color);
            background-color: var(--btn-accent-active-background-color);
        }
    `;

    override render() {
        return html`<button><slot></slot></button>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "tgr-button": Button;
    }
}
