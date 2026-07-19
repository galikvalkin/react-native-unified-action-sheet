# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory (latest React Native, new architecture).
- A second example app in the `example-legacy/` directory (React Native 0.81.x) used to verify old- and new-architecture compatibility. It is **deliberately NOT part of the Yarn workspace**: install it with `npm install` inside `example-legacy/` (it consumes the library via a `file:..` symlink). Toggle the architecture via `newArchEnabled` in `example-legacy/android/gradle.properties` and run `cd example-legacy/android && ./gradlew clean` after toggling. For iOS on the old architecture, run `RCT_NEW_ARCH_ENABLED=0 bundle exec pod install` in `example-legacy/ios`.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

To edit the Kotlin files, open `example/android` in Android Studio and find the source files at `react-native-unified-action-sheet` under `Android`. To edit the iOS files, open `example/ios/UnifiedActionSheetExample.xcworkspace` in Xcode and find them under `Pods > Development Pods > react-native-unified-action-sheet`.

Both platforms are native. `ios/` holds an Objective-C++ shim (`UnifiedActionSheet.mm`) that conforms to the generated TurboModule spec and forwards to `UnifiedActionSheetImpl.swift`, which owns the `UIAlertController`; `android/` holds the Kotlin `AppCompatDialog` implementation. The shim exists because codegen emits the spec as Objective-C++ with a C++ struct parameter, which Swift cannot conform to directly.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "UnifiedActionSheetExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
yarn typecheck
```

To check for linting errors, run the following:

```sh
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn test`: run the JS-layer tests with Jest.
- `yarn lint`: lint files with [ESLint](https://eslint.org/).
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

### Releasing

Releases are published to npm by the [Release workflow](.github/workflows/release.yml) when a version tag is pushed:

```sh
npm version patch   # or minor / major — bumps package.json and creates the vX.Y.Z tag
git push --follow-tags
```

The workflow verifies the tag matches `package.json`, runs lint/typecheck/tests, builds the package, publishes to npm, and creates a GitHub release with generated notes.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers): the job authenticates with the workflow's own OIDC identity, so there is no npm token to store or rotate, and provenance is attached automatically. Trusted publishing can only be configured on a package that already exists on the registry, so the first version had to be published manually; the trusted publisher (this repo + `.github/workflows/release.yml`) is set on the package's npmjs.com settings page. Provenance additionally requires both the repo and the package to be public.
