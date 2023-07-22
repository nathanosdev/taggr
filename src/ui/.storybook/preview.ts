import type { Preview } from "@storybook/web-components";
import { toolbarTheme, withTheme } from "./theme";

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [withTheme],
    globalTypes: {
        theme: toolbarTheme,
    },
};

export default preview;
