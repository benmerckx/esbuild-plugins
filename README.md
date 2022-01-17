# esbx

A collection of [esbuild](https://esbuild.github.io) plugins

## [@esbx/alias](packages/alias)

Alias paths. Resolved paths must be absolute.

> **Note:** esbuild supports the tsconfig paths option, which can often be used to achieve the same

```ts
type AliasPluginOptions = {
  [key: string]: string
}

// Example: Re-map the react packages to preact/compat
import {AliasPlugin} from '@esbx/alias'
await build({
  // ...
  plugins: [
    AliasPlugin.configure({
      react: require.resolve('preact/compat'),
      'react-dom': require.resolve('preact/compat')
    })
  ]
})
```

## [@esbx/extension](packages/extension)

Adds the `.js` out extension (configureable through [outExtension](https://esbuild.github.io/api/#out-extension)) to relative imports and marks them as external.

```ts
// Example: append extension to imports
import {ExtensionPlugin} from '@esbx/extension'
await build({
  // ...
  plugins: [ExtensionPlugin]
})
```

## [@esbx/external](packages/external)

Marks paths as external.

```ts
type ExternalPluginResponse = void | boolean | string
type ExternalPluginOptions = {
  filter?: RegExp
  // Boolean returns marks import as external,
  // string return rewrites import
  onResolve?: (
    args: OnResolveArgs
  ) => ExternalPluginResponse | Promise<ExternalPluginResponse>
}

// Example: mark all 'external:...' imports as external
import {ExternalPlugin} from '@esbx/external'
await build({
  // ...
  plugins: [
    ExternalPlugin.configure({
      filter: /external:.*/
    })
  ]
})
```

## [@esbx/legacy](packages/legacy)

Use [swc](https://swc.rs) to compile JavaScript to ES5. Configured for IE11 compatibility by default.

```ts
type LegacyPluginOptions = {
  filter?: RegExp
  exclude?: Array<string>
  swcOptions?: SwcOptions
}

// Example: compile to ES5 for IE11
import {LegacyPlugin} from '@esbx/legacy'
await build({
  // ...
  plugins: [LegacyPlugin]
})
```

## [@esbx/react](packages/react)

Injects `React` import automatically (no need to import `React` in to use JSX).

```ts
type ReactPluginOptions = {
  // Import react packages from 'preact/compat'
  usePreact?: boolean
}

// Example: inject react
import {ReactPlugin} from '@esbx/react'
await build({
  // ...
  plugins: [ReactPlugin]
})
```

## [@esbx/reload](packages/reload)

Reload the browser on source file changes.

```ts
// Example: reload browser on file changes
import {ReloadPlugin} from '@esbx/reload'
await build({
  // ...
  plugins: [ReloadPlugin]
})
```

## [@esbx/reporter](packages/reporter)

Report build times.

```ts
type ReporterPluginOptions = {
  name?: string
}

// Example: report build time
import {ReporterPlugin} from '@esbx/reporter'
await build({
  // ...
  plugins: [ReporterPlugin.configure({name: 'Server'})]
})
```

## [@esbx/run](packages/run)

Run or restart a command on successful builds.

```ts
type RunPluginOptions = {
  cmd: string
} & SpawnOptions

// Example: start server after building
import {RunPlugin} from '@esbx/run'
await build({
  // ...
  plugins: [
    RunPlugin.configure({
      command: 'node server.js'
    })
  ]
})
```

## [@esbx/sass](packages/sass)

Compile sass to css. Includes support for css modules and post css plugins.

```ts
type SassPluginOptions = {
  moduleOptions: CssModulesOptions
  scssOptions: SassOptions<'sync'>
  postCssPlugins?: Array<PostCssPlugin>
}

// Example: compile sass and define css module options
import {SassPlugin} from '@esbx/sass'
await build({
  // ...
  plugins: [
    SassPlugin.configure({
      moduleOptions: {
        localsConvention: 'dashes'
      }
    })
  ]
})
```

## [@esbx/static](packages/static)

Bundle static assets directory alongside generated code.

```ts
type StaticPluginOptions = {
  // Defaults to 'static'
  destination?: string
  // Set source dir in case no entryPoints are available at build time
  sources?: Array<string>
}

// Example: copy [entry]/static to [output]/static
import {StaticPlugin} from '@esbx/static'
await build({
  // ...
  plugins: [StaticPlugin]
})
```

## [@esbx/summary](packages/summary)

Allows to analyze imported module size by printing a small summary of build sizes.

```ts
// Example: show a summary of imported module sizes after building
import {SummaryPlugin} from '@esbx/summary'
await build({
  // ...
  plugins: [SummaryPlugin]
})
```

## [@esbx/swc](packages/swc)

Use [swc](https://swc.rs) to process JavaScript.

```ts
type SwcPluginOptions = {
  filter?: RegExp
  exclude?: Array<string>
  swcOptions?: SwcOptions
}

// Example: use SWC with build options
import {SwcPlugin} from '@esbx/swc'
await build({
  // ...
  plugins: [
    SwcPlugin.configure({
      swcOptions: {
        jsc: {
          target: 'es5',
          loose: false,
          externalHelpers: false,
          keepClassNames: false
        }
      }
    })
  ]
})
```
