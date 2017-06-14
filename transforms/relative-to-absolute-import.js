/*
 * Convert relative imports from a list of top level directories to absolute imports
 */
import { relative, sep } from 'path';

// TODO: investigate passing defaults from test runner
// since these defaults are set for tests!

const DEFAULT_TOP_LEVEL_DIRECTORY = 'transforms/__testfixtures__';
// command line parser does not handle arrays so we compress into a string
const DEFAULT_DIRECTORIES = 'moduleA,moduleB,module-c';
const DEFUALT_PREFIX = '';

const DEFAULT_OPTIONS = { topLevelDirectory: DEFAULT_TOP_LEVEL_DIRECTORY, directories: DEFAULT_DIRECTORIES, prefix: DEFUALT_PREFIX };

function transformer(fileInfo, api, options = {}) {
  const filePath = fileInfo.path;

  const j = api.jscodeshift;

  const mergedOptions = Object.assign(DEFAULT_OPTIONS, options);
  const { topLevelDirectory, directories, prefix } = mergedOptions;
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

      const isTopLevelImport = checkIsTopLevelImport(importSourceValue, filePath, topLevelDirectory);
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

// importSourceValue: '../folderA', filePath: 'modules/folderB/file.js', topLevelDirectory: 'modules/folderB' => true
function checkIsTopLevelImport(importSourceValue, filePath, topLevelDirectory) {
  const relativePathToTop = getRelativePathToTop(filePath, topLevelDirectory);
  const relativePathToDirectory = getRelativePathToDirectory(importSourceValue);
  return relativePathToTop === relativePathToDirectory;
}

// filePath: 'modules/folder/file.js', topLevelDirectory: 'modules/folder' => '../'
function getRelativePathToTop(filePath, topLevelDirectory) {
  const pathFromFileToTop = relative(filePath, topLevelDirectory);
  // pad relative path with delimiter since `relative` returns '../..' instead of desired '../../'
  return pathFromFileToTop + sep;
}

// '../../module/folder' => '../../'
function getRelativePathToDirectory(importSourceValue) {
  const relativePathPattern = /(.*?)\w/;
  const captureGroup = 1;
  return relativePathPattern.exec(importSourceValue)[captureGroup];
}

function checkIsTopLevelDirectory(importSourceValue, topLevelDirectories) {
  const directory = getFirstNamedDirectory(importSourceValue);
  return topLevelDirectories.includes(directory);
}

// '../../module-name/folder' => 'module-name'
function getFirstNamedDirectory(importSourceValue) {
  const firstNamedDirectoryPattern = /([\w-]+)/;
  const captureGroup = 1;
  return firstNamedDirectoryPattern.exec(importSourceValue)[captureGroup];
}

// '../../module/folder' => 'module/folder'
function getNamedDirectories(importSourceValue) {
  const namedDirectoriesPattern = /\/(\w.*)/;
  const captureGroup = 1;
  return namedDirectoriesPattern.exec(importSourceValue)[captureGroup];
}

function prefixString(prefix, string) {
  return `${prefix}${string}`;
}

module.exports = transformer;
