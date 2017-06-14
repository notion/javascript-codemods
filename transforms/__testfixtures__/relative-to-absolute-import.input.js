// NO: absolute import
import { NamedExportA } from 'moduleA';

// NO: absolute import
import defaultExport from 'ignoredModuleA';

// NO: jest mock, absolute import
jest.mock('moduleA');

// NO: current directory import
import { NamedExportA } from './moduleA';

// NO: current directory import
import { NamedExportA } from './ignoredModuleA';

// NO: jest mock, current directory import
jest.mock('./module-c');

// NO: relative import is not a top level import
import { NamedExportA, NamedExportB as NamedExportC } from '../../moduleB/folder';

// NO: relative import is not a top level import
import * as moduleExports from '../../../module-c';

// NO: relative import is not a top level import
import * as moduleExports from '../..';

// NO: jest mock is not a top level import
jest.mock('../..');

// NO: relative import, directory not a top level directory
import { NamedExportA } from '../ignoredModuleA';

// NO: jest mock, directory not a top level directory
jest.mock('../ignoredModuleA');

// YES: relative import is a top level directory
import { NamedExportA } from '../moduleA';

// YES: relative import is a top level directory
import defaultExport from '../moduleB/folder';

// YES: relative import is a top level directory
import { NamedExportA, NamedExportB as NamedExportC } from '../moduleB/folder/folder';

// YES: relative import is a top level directory
import * as moduleExports from '../module-c';

// YES: jest mock is a top level directory
jest.mock('../module-c/folder');
