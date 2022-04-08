> ## Visual Studio Code Settings
To config vs code
- F1 -> Preferences: Open Settings (JSON)
- Copy and Paste settings.json file content

> ## Snippets
To create new snippets:
- F1 -> Preferences: Configure User Snippets -> New Global Snippets File...
- Copy and Paste snippets files content

> ## GIT
```
  # Config vs code as your core editor:
  git config --global core.editor code
  
  # Open .gitconfig:
  git config --global --edit
```
- Copy and paste .gitconfig file content
> ## Jest
```
  # Dowload Jest:
  npm install -D jest ts-jest
```
```
  # Copy Scripts to package.json on scripts section:
  "test": "npx jest --runInBand --no-cache",
  "test:unit": "npm test -- --watch -c jest-unit-config.js",
  "test:int": "npm test -- --watch -c jest-integration-config.js",
  "test:ci": "npm test -- --coverage",
  "test:coveralls": "npm run test:ci && coveralls < coverage/lcov.info"
```
- Copy jest files to project root
- Run tests using:
```
  npm run test
```

> ## TypeScript with Eslint 
```
  # Run:
  npm install -D typescript;
  npm install -D eslint@^7.12.1;
  npm install -D eslint-plugin-promise@^5.0.0;
  npm install -D eslint-plugin-import@^2.22.1;
  npm install -D eslint-plugin-node@^11.1.0;
  npm install -D @typescript-eslint/eslint-plugin@^4.0.1;
  npm install -D eslint-config-standard-with-typescript;
  npm install -D ts-node-dev;
  npm install -D tsconfig-paths;
  npm install -D rimraf;
  npm install module-alias;
```
- Copy and Paste typescript files to project root
```
  # Copy Scripts to package.json on scripts section:
  "start": "node dist/main/server.js",
  "dev": "ts-node-dev -r tsconfig-paths/register --transpile-only src/main/server.ts",
  "build": "rimraf dist && tsc -p tsconfig-build.json",
  "build:watch": "npm run build -- -w",
```
