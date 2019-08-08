# Web Provenance
The goal of this project is the create a web platform to automatically visualize a provenance model. The data required to create these visualizations should be stored in a graph database. The web platform will also feature an editor to allow users to manually create provenance models that can be stored within the database.

[Link to Demo](https://sfb-elaine.github.io/WebProv/)
> The backend sometimes take a while (> 2 minutes) to start as we are using the `Heroku` free servers which sleep after 30 minutes of inactivity.

## Environment Setup
### Node
The first step to setting up your environment involves installing `Node.js` and `npm` (if not already installed). The recommended way to do this is by using the `Node Version Manager` tool:
1. Install [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm#install--update-script)
1. Install `Node.js` and `npm` using nvm: `nvm install node`

### Neo4j
Next, if not already installed, `Neo4j` should be installed:
1. Install [Neo4j](https://neo4j.com/docs/operations-manual/current/installation/)
1. Go to the [Neo4j browser](http://localhost:7474/browser/), input the default username (`neo4j`) and password (`neo4j`) and change the password to whatever you plan to use for development (ex. `password`).
> `Docker` can also be used to create a `Neo4j` database. If using `Docker`, the above instructions can be ignored.

### Lerna
This repository uses [lerna](https://lerna.js.org/) as it is a monorepo. All packages are located within the `packages` folder. The main benefit of lerna is that it can symlink repos together when one package depends on another within the same repository. Because there is symlinking involved, you must use lerna to install dependencies. Because we have a `postinstall` script defined in the `package.json` folder, the only command that you have to run is:
```
npm install # or `npm i`
```

## Development
A `Makefile` file is present within both the frontend and backend repositories. To start a development server with hot-reload within each package, just run the following command:
```
make dev
```
> Ensure that you start the backend server before starting the frontend server.

## Installing Dependencies
If you want to install a package, avoid using `npm` as `npm` will remove symlinks during installation (if this happens, just bootstrap the project again). Instead, using the `lerna add` command. For example:
```
npx lerna add the-module-to-install --scope=the-package-to-add-the-module-to [--dev]
```

## Contributing
See the branching instruction and rules [here](https://guides.github.com/introduction/flow/). Basically, when working on a feature or bug, create a branch off master. When you want to merge your changes, just create a PR.

## Deployment
The frontend and backend are automatically deployed when PRs or new commits are merged/pushed to the `master` branch. The following sections describe how this deployment process was set up.

### Backend
The backend is currently using `Heroku` for automatic deployments. The following commands were used to set up the Heroku backend:
```
export app=web-prov-backend
heroku apps:create $app

# add free hosting database
heroku addons:create graphenedb:dev-free --app $app
```

Then, using the online dashboard, this repository was connected to GitHub for automatic deployments by clicking the `Enable Automatic Deploys` button. This connection triggers a new deployment of the backend on every merge into `master`.
> This requires admin access to the repository.

The last step is determining the domain of the deployed backend and inserting that url into the frontend so that the deployed frontend is pointing at the correct location. This can be found within the `Heroku` project that you crated. Then, within `Netlify`, go to `Settings` > `Build & deploy` > `Environment` > `Environment variables` and then set `VUE_APP_BACKEND_URL` to whatever url the backend is deployed at (ex. `https://web-prov-backend.herokuapp.com/`).

### Frontend
The frontend is currently being deployed using `Netlify`. The following instructions were used to create the `Netlify` application:

1. Create a `New site from Git`.
1. Click `Continuous Deployment` > `GitHub`.
1. Find the repository.
1. Set the build command to `npm run build-frontend`.
1. Set the publish directory to `_site` (must match folder in `vue.config.js`).
1. Leave all other settings at their default values and click `Deploy site`.

Whenever new commits are merged into `master`, the frontend will be built and deployed.
> Ensure that you set the `VUE_APP_BACKEND_URL` environmental variable.

## Dependencies/Acknowledgements
### Frontend
- [@types/d3](https://www.npmjs.com/package/@types/d3) (MIT)
- [@types/@types/lodash.debounce](https://www.npmjs.com/package/@types/@types/lodash.debounce) (MIT)
- [buefy](https://www.npmjs.com/package/buefy) (MIT)
- [core-js](https://www.npmjs.com/package/core-js) (MIT)
- [d3](https://www.npmjs.com/package/d3) (BSD 3-Clause)
- [fuse.js](https://www.npmjs.com/package/fuse.js) (Apache-2.0)
- [lodash.debounce](https://www.npmjs.com/package/lodash.debounce) (MIT)
- [vue](https://www.npmjs.com/package/vue) (MIT)
- [vue-function-api](https://www.npmjs.com/package/vue-function-api) (MIT)
- [@vue/cli-plugin-babel](https://www.npmjs.com/package/@vue/cli-plugin-babel) (MIT)
- [@vue/cli-plugin-typescript](https://www.npmjs.com/package/@vue/cli-plugin-typescript) (MIT)
- [@vue/cli-service](https://www.npmjs.com/package/@vue/cli-service) (MIT)
- [babel-core](https://www.npmjs.com/package/babel-core) (MIT)
- [sass](https://www.npmjs.com/package/sass) (MIT)
- [sass-loader](https://www.npmjs.com/package/sass-loader) (MIT)
- [svg-pan-zoom](https://www.npmjs.com/package/svg-pan-zoom) (BSD-2-Clause)
- [typescript](https://www.npmjs.com/package/typescript) (Apache-2.0)
- [vue-template-compiler](https://www.npmjs.com/package/vue-template-compiler) (MIT)

### Backend
- [@types/cors](https://www.npmjs.com/package/@types/cors) (MIT)
- [@types/dotenv](https://www.npmjs.com/package/@types/dotenv) (MIT)
- [body-parser](https://www.npmjs.com/package/body-parser) (MIT)
- [cors](https://www.npmjs.com/package/cors) (MIT)
- [dotenv](https://www.npmjs.com/package/dotenv) (BSD-2-Clause)
- [express](https://www.npmjs.com/package/express) (MIT)
- [neo4j-driver](https://www.npmjs.com/package/neo4j-driver) (Apache-2.0)
- [restyped-express-async](https://www.npmjs.com/package/restyped-express-async) (MIT)
- [typescript](https://www.npmjs.com/package/typescript) (Apache-2.0)
- [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) (MIT)

### Common
- [typescript](https://www.npmjs.com/package/typescript) (Apache-2.0)
- [fp-ts](https://www.npmjs.com/package/fp-ts) (MIT)
- [io-ts](https://www.npmjs.com/package/io-ts) (MIT)
