/*
 * Convert relative imports from a list of top level directories to absolute imports
 */
import path from 'path';

// TODO: investigate setup / tear down for test runner since tests rely on defaults
const DEFAULT_ROOT_DIRECTORY = 'transforms/';
// command line parser does not handle arrays so we compress into a string
const DEFAULT_DIRECTORIES = 'moduleA,moduleB,module-c';
const DEFUALT_PREFIX = '';
const DEFAULT_OPTIONS = { rootDirectory: DEFAULT_ROOT_DIRECTORY, directories: DEFAULT_DIRECTORIES, prefix: DEFUALT_PREFIX };

function transformer(fileInfo, api, options = {}) {
  const filePath = fileInfo.path;

  const j = api.jscodeshift;

  const mergedOptions = Object.assign(DEFAULT_OPTIONS, options);
  const { rootDirectory, directories, prefix } = mergedOptions;
  // decompress string into array of directories
  const topLevelDirectories = directories.split(',');

  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration)
    .filter(function(path) {
      const importSourceValue = path.node.source.value;

      const isAbsoluteImport = checkIsAbsoluteImport(importSourceValue);
      if (isAbsoluteImport) return false;

      const isCurrentDirectoryImport = checkIsCurrentDirectoryImport(importSourceValue);
      if (isCurrentDirectoryImport) return false;

      const isRelativeImport = checkIsRelativeImport(importSourceValue);
      if (!isRelativeImport) return false;

      const isTopLevelImport = checkIsTopLevelImport(importSourceValue, filePath, rootDirectory);
      if (!isTopLevelImport) return false;

      const isTopLevelDirectory = checkIsTopLevelDirectory(importSourceValue, topLevelDirectories);
      return isTopLevelDirectory;
    })
    .map(function(path) {
      const importSourceValue = path.node.source.value;

      const namedDirectories = getNamedDirectories(importSourceValue);
      const newImportSourceValue = prefixString(prefix, namedDirectories);

      path.node.source.value = newImportSourceValue;

      return path;
    });

  return root.toSource({ quote: 'single' });
}

// 'dir' => true
function checkIsAbsoluteImport(importSourceValue) {
  const absoluteImportPattern = /^\w/;
  return absoluteImportPattern.test(importSourceValue);
}

// './dir' => true
function checkIsCurrentDirectoryImport(importSourceValue) {
  const currentDirectoryImportPattern = /^\.\/\w/;
  return currentDirectoryImportPattern.test(importSourceValue);
}

// '../../dir' => true
function checkIsRelativeImport(importSourceValue) {
  const relativeImportPattern = /^\.{2}\//;
  return relativeImportPattern.test(importSourceValue);
}

// importSourceValue: '../folderA', filePath: 'modules/folderB/file.js', rootDirectory: 'modules' => true
function checkIsTopLevelImport(importSourceValue, filePath, rootDirectory) {
  const relativePathToRootDirectory = getRelativePathToRootDirectory(filePath, rootDirectory);
  const relativePathToImportDirectory = getRelativePathToImportDirectory(importSourceValue);
  return relativePathToRootDirectory === relativePathToImportDirectory;
}

// filePath: 'modules/folder/folder/file.js', rootDirectory: 'modules' => '../..'
function getRelativePathToRootDirectory(filePath, rootDirectory) {
  const fileDirectory = path.dirname(filePath);
  return path.relative(fileDirectory, rootDirectory);
}

// '../../module/folder' => '../..'
// '../..' => '../..'
// 'module' => 'module'
function getRelativePathToImportDirectory(importSourceValue) {
  const relativePathPattern = /((?:\.{2}\/?)+)/;
  const result = relativePathPattern.exec(importSourceValue);
  if (!result) return importSourceValue;
  const captureGroup = 1;
  const relativePath = result[captureGroup];
  // since `path.relative` does not include last separator, trim it if it exists
  if (relativePath.charAt(relativePath.length - 1) === path.sep) {
    return relativePath.substring(0, relativePath.length - 1);
  }
  return relativePath;
}

function checkIsTopLevelDirectory(importSourceValue, topLevelDirectories) {
  const directory = getFirstNamedDirectory(importSourceValue);
  return topLevelDirectories.includes(directory);
}

// '../../module-name/folder' => 'module-name'
// '../..' => '../..'
function getFirstNamedDirectory(importSourceValue) {
  const firstNamedDirectoryPattern = /([\w-]+)/;
  const result = firstNamedDirectoryPattern.exec(importSourceValue);
  if (!result) return importSourceValue;
  const captureGroup = 1;
  return result[captureGroup];
}

// '../../module/folder' => 'module/folder'
// '../..' => '../..'
function getNamedDirectories(importSourceValue) {
  const namedDirectoriesPattern = /\/(\w.*)/;
  const result = namedDirectoriesPattern.exec(importSourceValue);
  if (!result) return importSourceValue;
  const captureGroup = 1;
  return result[captureGroup];
}

function prefixString(prefix, string) {
  return `${prefix}${string}`;
}

module.exports = transformer;
