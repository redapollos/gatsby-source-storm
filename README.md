<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  gatsby-source-storm
</h1>

A Gatsby source plugin for the Storm CMS

## 🚀 Quick start

To get started, you can follow these steps:

1. Install the plugin

```shell
npm i gatsby-source-storm
```

2. Configure the plugin by adding it to the gatsby-config.js file

```javascript
module.exports = {
  plugins: [
    {
        resolve: `gatsby-source-storm`,
        options: {
            host: process.env.REACT_APP_WEBAPI_URL,
            appkey: "Your app key"
        }
    },
  ],
}
```
