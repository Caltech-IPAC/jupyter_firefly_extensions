import {
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';


import {activateSlateCommandExt} from './SlateCommandExt.js';


/**
 * Initialization data for the extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter_firefly_extensions:showSlate',
  description:
    'Show firefly slate',
  autoStart: true,
  optional: [ILauncher],
  requires: [IDocumentManager, ILayoutRestorer, ICommandPalette],
  activate: activateSlateCommandExt
};

export default plugin; // TODO: export list when adding fits viewer plugin too
