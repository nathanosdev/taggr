import { html } from "lit";
import { Decorator } from "@storybook/web-components";
import { InputType } from "@storybook/types";

import "../src/themes/taggr-base.scss";
import calm from "../src/themes/calm.scss?inline";
import classic from "../src/themes/classic.scss?inline";
import dark from "../src/themes/dark.scss?inline";
import light from "../src/themes/light.scss?inline";
import midnight from "../src/themes/midnight.scss?inline";

enum Theme {
    Calm = "calm",
    Classic = "classic",
    Dark = "dark",
    Light = "light",
    Midnight = "midnight",
}

const getThemeStyles = (theme: string | undefined): string => {
    switch (theme) {
        case "calm":
            return calm;
        case "classic":
            return classic;
        case "dark":
            return dark;
        case "light":
            return light;
        case "midnight":
            return midnight;
        default:
            console.warn(`Unknown theme: ${theme}`);
            return "";
    }
};

export const withTheme: Decorator = (story, ctx) => {
    const theme: string | undefined = ctx.parameters.theme ?? ctx.globals.theme;
    const themeStyles = getThemeStyles(theme);

    return html`
        <style>
            ${themeStyles}
        </style>

        <style>
            .story-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 1rem;
                background-color: var(--background, white);
            }
        </style>

        <div class="story-wrapper">${story()}</div>
    `;
};

export const toolbarTheme: InputType = {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: Theme.Light,
    toolbar: {
        icon: "contrast",
        items: [
            { value: Theme.Light, title: "Light" },
            { value: Theme.Dark, title: "Dark" },
            { value: Theme.Calm, title: "Calm" },
            {
                value: Theme.Classic,

                title: "Classic",
            },
            {
                value: Theme.Midnight,

                title: "Midnight",
            },
        ],
        showName: true,
        dynamicTitle: true,
    },
};
