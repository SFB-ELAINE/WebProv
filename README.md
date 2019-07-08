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
