# Using Tabs in Documentation

We use the `remark-directive` plugin to provide tabs functionality for showing alternative code examples or content variations. This is especially useful for:

- Package managers (npm, yarn, pnpm)
- Programming languages (JavaScript, TypeScript)
- Operating systems (Windows, macOS, Linux)
- Configuration formats (hardhat.config.js, hardhat.config.ts)

## Basic Structure

The tabs system consists of two main components:

1. `tabsgroup` - Wrapper that defines all possible tab values
2. `tab` - Individual content containers that match the defined values

## Simple Example

```markdown
::::tabsgroup{options=npm,yarn}
    :::tab{value=npm}
    npm install hardhat
    :::

    :::tab{value=yarn}
    yarn add hardhat
    :::
::::
```
