import type { Meta, StoryObj } from "@storybook/web-components";
import "./button";
import { type ButtonProps } from "./button";
import { html } from "lit";

const meta: Meta<ButtonProps> = {
    title: "Button",
};
export default meta;

type Story = StoryObj<ButtonProps>;

export const Standard: Story = {
    render: () => html`<tgr-button>Standard</tgr-button>`,
};
