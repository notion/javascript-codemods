// convert relative imports to absolute imports under specific rules

const absolutePathImportPattern = /^\w/; // 'm'
const currentDirectoryImportPattern = /^\.\/\w/; // './m'
const relativePathImportPattern = /^\.{2}\//; // '../../m'

const captureRelativeImportFirstNamedDirectory = /\/([\w-]+)/; // '../../module/folder' => 'module'
const captureRelativeImportNamedDirectories = /\/(\w.*)/; // '../../module/folder' => 'module/folder'

const directoryInFilePath = (filePath, searchDirectory) => {
  const directories = filePath.split('/');
  return directories.some((directory) => directory === searchDirectory);
}

const DEFUALT_PREFIX = '';

// https://github.com/harthur/nomnom is used to parse command line options
// so we compress a list of names into a string instead of an array
const DIRECTORIES = ['moduleA', 'moduleB', 'module-c'];
const DELIMITER = ',';
const arrayToString = (accumulator, currentValue, currentIndex, array) => {
  if (currentIndex === array.length - 1) return `${accumulator}${currentValue}`;
  return `${accumulator}${currentValue}${DELIMITER}`;
};
const DEFAULT_DIRECTORIES = DIRECTORIES.reduce(arrayToString, '');

const DEFAULT_OPTIONS = { prefix: DEFUALT_PREFIX, directories: DEFAULT_DIRECTORIES };

function transformer(fileInfo, api, options = {}) {
  const mergedOptions = Object.assign(DEFAULT_OPTIONS, options);
  const { prefix, directories } = mergedOptions;
  const directoriesWhiteList = directories.split(DELIMITER);

  const j = api.jscodeshift;

  const filePath = fileInfo.path;

  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration)
    .filter(function(path) {
      const importSourceValue = path.node.source.value;
      const isAbsoluteImport = absolutePathImportPattern.test(importSourceValue);
      if (isAbsoluteImport) return false;

      const isCurrentDirectoryImport = currentDirectoryImportPattern.test(importSourceValue);
      if (isCurrentDirectoryImport) return false;

      const isRelativeImport = relativePathImportPattern.test(importSourceValue);
      if (!isRelativeImport) return false;

      const result = captureRelativeImportFirstNamedDirectory.exec(importSourceValue);
      const captureGroup = 1;
      const firstNamedDirectory = result[captureGroup];

      const fileInsideDirectory = directoryInFilePath(filePath, firstNamedDirectory);
      if (fileInsideDirectory) return false;

      const directoryInWhiteList = directoriesWhiteList.includes(firstNamedDirectory);
      return directoryInWhiteList;
    })
    .map(function(path) {
      const importSourceValue = path.node.source.value;

      const result = captureRelativeImportNamedDirectories.exec(importSourceValue);
      const captureGroup = 1;
      const namedDirectories = result[captureGroup];

      const newImportSourceValue = `${prefix}${namedDirectories}`;

      path.node.source.value = newImportSourceValue;

      return path;
    });

  return root.toSource({ quote: 'single' });
}

module.exports = transformer;
