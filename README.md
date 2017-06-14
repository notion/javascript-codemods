# javascript-codemods
Automate repetitive modifications to JavaScript source code using [`jscodeshift`](https://github.com/facebook/jscodeshift)

## transforms
### relative-to-absolute-import
Convert relative imports from a list of top level directories to absolute imports.
#### rules
- ignores absolute imports
  - `import ... from 'directory'` is an absolute import
- ignores relative imports that refer to the current directory
  - `import ... from './directory'` is a relative import using the current directory
- ignores imports that are not relative imports
  - `import ... from '../directoryA'` is a relative import
  - `import ... from '.../directoryA'` is not a relative import
- ignores imports that are not top level imports
  - `import ... from '../directoryA'` is a top level import if the rootDirectory is `rootDirectory/` and the file is at `rootDirectory/directoryB/file.js`
  - `import ... from '../../directoryA'` is not a top level import if the
  rootDirectory is `rootDirectory/directoryA` and the file is at
  `rootDirectory/directoryB/file.js`
- ignores imports of directories that are not in the whitelist of top level directories
  - `import ... from '../directoryA/directoryB'` is in the top level directory whitelist of `directoryA`
  - `import ... from '../directoryA/directoryB'` is not in the top level directory whitelist of `directoryB`
#### usage
```
jscodeshift -t transforms/relative-to-absolute-import.js rootDirectory/topLevelDirectory/file.js --parser=flow --rootDirectory=rootDirectory/ --directories='topLevelDirectory' --prefix='myPrefix' -d -p
```
- rootDirectory: `--rootDirectory:'rootDirectory'` sets the location of the root directory where top level directories live
- directories: `--directories:'directoryA,directoryB'` makes the whitelist of top level directories `['directoryA', 'directoryB']`
- prefix: `--prefix='myPrefix'` will replace `import form '../directoryA'` with `import ... from 'myPrefix/directoryA'`

## contributing
### development
Using [`astexplorer.net`](https://astexplorer.net/) makes writing a codemod much easier!
### testing
```
npm test
```
