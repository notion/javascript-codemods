import { NamedExportA } from 'moduleA';
import defaultExport from 'ignoredModuleA';
import { NamedExportA } from './moduleA';
import { NamedExportA } from './ignoredModuleA';
import { NamedExportA } from '../moduleA';
import { NamedExportA } from '../ignoredModuleA';
import defaultExport from '../../moduleB/folder';
import { NamedExportA, NamedExportB as NamedExportC } from '../../moduleB/folder/folder';
import { NamedExportA, NamedExportB as NamedExportC } from '../../ignoredModuleB/folder';
import * as moduleExports from '../../../moduleC';
import * as moduleExports from '../../../ignoredModuleC';
import { NamedExportA } from '../transforms/folder';
