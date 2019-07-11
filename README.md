# Web Provenance
The goal of this project is the create a web platform to automatically visualize a provenance model. The data required to create these visualizations should be stored in a graph database. The web platform will also feature an editor to allow users to manually create provenance models that can be stored within the database.

[Link to Demo](https://sfb-elaine.github.io/WebProv/)

## Environment Setup
The first step to setting up your environment involves installing `Node.js` and `npm` (if not already installed). The recommended way to do this is by using the `Node Version Manager` tool:
1. Install [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm#install--update-script)
1. Install `Node.js` and `npm` using nvm: `nvm install node`

Now, the only command you need to run is:
```
npm install # or `npm i`
```

## Development
After setting up your environment, just run the following command:

```
npm run serve
```

This starts a hot-reload development server. Navigate to the link that is outputted in the console.

## Contributing
See the branching instruction and rules [here](https://guides.github.com/introduction/flow/). Basically, when working on a feature or bug, create a branch off master. When you want to merge your changes, just create a PR.

## Deployment
This application is currently being deployed through `GitHub Pages`. To deploy, all you have to do is place the built application in the `docs` folder and merge your changes to the `master` branch. To build the application, run the following command:
```
npm run build
```

This will automatically place the application in the `docs` folder. Then, all you have to do is create a PR for your branch. Once the branch is merged, the new application will automatically be deployed.

## Dependencies/Acknowledgements
- [@types/d3](https://www.npmjs.com/package/@types/d3) (MIT)
- [@types/@types/lodash.debounce](https://www.npmjs.com/package/@types/@types/lodash.debounce) (MIT)
- [@types/@types/lodash.uni](https://www.npmjs.com/package/@types/@types/lodash.uni) (MIT)
- [buefy](https://www.npmjs.com/package/buefy) (MIT)
- [core-js](https://www.npmjs.com/package/core-js) (MIT)
- [d3](https://www.npmjs.com/package/d3) (BSD 3-Clause)
- [firebase](https://www.npmjs.com/package/firebase) (Apache-2.0)
- [fuse.js](https://www.npmjs.com/package/fuse.js) (Apache-2.0)
- [lodash.debounce](https://www.npmjs.com/package/lodash.debounce) (MIT)
- [vue](https://www.npmjs.com/package/vue) (MIT)
- [vue-class-component](https://www.npmjs.com/package/vue-class-component) (MIT)
- [vue-function-api](https://www.npmjs.com/package/vue-function-api) (MIT)
- [@vue/cli-plugin-babel](https://www.npmjs.com/package/@vue/cli-plugin-babel) (MIT)
- [@vue/cli-plugin-typescript](https://www.npmjs.com/package/@vue/cli-plugin-typescript) (MIT)
- [@vue/cli-service](https://www.npmjs.com/package/@vue/cli-service) (MIT)
- [babel-core](https://www.npmjs.com/package/babel-core) (MIT)
- [sass](https://www.npmjs.com/package/sass) (MIT)
- [sass-loader](https://www.npmjs.com/package/sass-loader) (MIT)
- [typescript](https://www.npmjs.com/package/typescript) (Apache-2.0)
- [vue-template-compiler](https://www.npmjs.com/package/vue-template-compiler) (MIT)
