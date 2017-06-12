# javascript-codemods
Automate repetitive modifications to JavaScript source code using [`jscodeshift`](https://github.com/facebook/jscodeshift)

## transforms
### relative-to-absolute-import
Converts import statements using a relative path to an absolute path.
#### rules
- ignores absolute imports, i.e. `import ... from 'directory'`
- ignores relative imports that refer to the current directory, i.e. `import ... from './directory'`
- ignores imports that are not relative imports
- ignores relative imports that refer to a directory the file is in
  - `import ... from '../directory'` will be ignored when file is anywhere inside `directory` recursively
- only converts relative import statements that start with a directory in a whitelist
  - `import ... from '../directoryA/directoryB'` will be replaced when whitelist includes `directoryA`
  - `import ... from '../directoryA/directoryB'` will not be replaced when whitelist does not include `directoryA`
  - `import ... from '../directoryA/directoryB'` will not be replaced when whitelist includes `directoryB`, but does not include `directoryA`
- supports adding a prefix to replace imports with
  - `--prefix='rootDirectory/'` will replace `import ... from '../directoryA'` with `import ... from 'rootDirectory/directoryA'`
- allows providing a whitelist of directories
  - `--directories='directoryA,directoryB'` makes the whitelist of directories `['directoryA', 'directoryB']`
#### usage
```
jscodeshift -t transforms/relative-to-absolute-import.js file.js -d -p --prefix='myPrefix' --directories='myDirectory,yourDirectory'
```

## contributing
### development
Using [`astexplorer.net`](https://astexplorer.net/) makes writing a codemod much easier!
### testing
```
npm test
```
