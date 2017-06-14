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

function parseOptions(options) {
  const mergedOptions = Object.assign(DEFAULT_OPTIONS, options);
  const { rootDirectory, directories, prefix } = mergedOptions;
  // decompress string into array of directories
  const topLevelDirectories = directories.split(',');
  return { rootDirectory, topLevelDirectories, prefix };
}

function transformer(fileInfo, api, options = {}) {
  const filePath = fileInfo.path;
  const j = api.jscodeshift;
  const parsedOptions = parseOptions(options);
  const { rootDirectory, topLevelDirectories, prefix } = parsedOptions;

  const filterData = { filePath, rootDirectory, topLevelDirectories };
  const mapData = { prefix };

  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration)
    .filter(filterImportDeclaration.bind(null, filterData))
    .map(mapImportDeclaration.bind(null, mapData));

  root.find(j.CallExpression, JEST_MOCK_CALLEE)
    .filter(filterCallExpression.bind(null, filterData))
    .map(mapCallExpression.bind(null, mapData));

  return root.toSource({ quote: 'single' });
}


function filterImportDeclaration(data, path) {
  const { filePath, rootDirectory, topLevelDirectories } = data;
  const importString = getImportString(path);
  return checkShouldChangeImport(importString, filePath, rootDirectory, topLevelDirectories);
}

function mapImportDeclaration(data, path) {
  const { prefix } = data;
  const importString = getImportString(path);
  const newImportString = calcNewImportString(importString, prefix);
  replaceImportString(path, newImportString);
  return path;
}

function getImportString(path) {
  return path.node.source.value;
}

function replaceImportString(path, newImportString) {
  path.node.source.value = newImportString;
}


const JEST_MOCK_CALLEE = {
  callee: {
    object: {
      name: 'jest',
    },
    property: {
      name: 'mock',
    }
  }
}

function filterCallExpression(data, path) {
  const { filePath, rootDirectory, topLevelDirectories } = data;
  const callString = getCallString(path);
  return checkShouldChangeImport(callString, filePath, rootDirectory, topLevelDirectories);
}

function mapCallExpression(data, path) {
  const { prefix } = data;
  const callString = getCallString(path);
  const newCallString = calcNewImportString(callString, prefix);
  replaceCallString(path, newCallString);
  return path;
}

function getCallString(path) {
  return path.node.arguments[0].value;
}

function replaceCallString(path, newCallString) {
  path.node.arguments[0].value = newCallString;
}


function checkShouldChangeImport(importString, filePath, rootDirectory, topLevelDirectories) {
  const isAbsoluteImport = checkIsAbsoluteImport(importString);
  if (isAbsoluteImport) return false;

  const isCurrentDirectoryImport = checkIsCurrentDirectoryImport(importString);
  if (isCurrentDirectoryImport) return false;

  const isRelativeImport = checkIsRelativeImport(importString);
  if (!isRelativeImport) return false;

  const isTopLevelImport = checkIsTopLevelImport(importString, filePath, rootDirectory);
  if (!isTopLevelImport) return false;

  const isTopLevelDirectory = checkIsTopLevelDirectory(importString, topLevelDirectories);
  return isTopLevelDirectory;
}

// 'dir' => true
function checkIsAbsoluteImport(importString) {
  const absoluteImportPattern = /^\w/;
  return absoluteImportPattern.test(importString);
}

// './dir' => true
function checkIsCurrentDirectoryImport(importString) {
  const currentDirectoryImportPattern = /^\.\/\w/;
  return currentDirectoryImportPattern.test(importString);
}

// '../../dir' => true
function checkIsRelativeImport(importString) {
  const relativeImportPattern = /^\.{2}\//;
  return relativeImportPattern.test(importString);
}

// importString: '../folderA', filePath: 'modules/folderB/file.js', rootDirectory: 'modules' => true
function checkIsTopLevelImport(importString, filePath, rootDirectory) {
  const relativePathToRootDirectory = getRelativePathToRootDirectory(filePath, rootDirectory);
  const relativePathToImportDirectory = getRelativePathToImportDirectory(importString);
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
function getRelativePathToImportDirectory(importString) {
  const relativePathPattern = /((?:\.{2}\/?)+)/;
  const result = relativePathPattern.exec(importString);
  if (!result) return importString;
  const captureGroup = 1;
  const relativePath = result[captureGroup];
  // since `path.relative` does not include last separator, trim it if it exists
  if (relativePath.charAt(relativePath.length - 1) === path.sep) {
    return relativePath.substring(0, relativePath.length - 1);
  }
  return relativePath;
}

function checkIsTopLevelDirectory(importString, topLevelDirectories) {
  const directory = getFirstNamedDirectory(importString);
  return topLevelDirectories.includes(directory);
}

// '../../module-name/folder' => 'module-name'
// '../..' => '../..'
function getFirstNamedDirectory(importString) {
  const firstNamedDirectoryPattern = /([\w-]+)/;
  const result = firstNamedDirectoryPattern.exec(importString);
  if (!result) return importString;
  const captureGroup = 1;
  return result[captureGroup];
}


function calcNewImportString(importString, prefix) {
  const namedDirectories = getNamedDirectories(importString);
  return prefixString(prefix, namedDirectories);
}

// '../../module/folder' => 'module/folder'
// '../..' => '../..'
function getNamedDirectories(importString) {
  const namedDirectoriesPattern = /\/(\w.*)/;
  const result = namedDirectoriesPattern.exec(importString);
  if (!result) return importString;
  const captureGroup = 1;
  return result[captureGroup];
}

function prefixString(prefix, string) {
  return `${prefix}${string}`;
}

module.exports = transformer;
