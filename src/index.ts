import { JupyterFrontEndPlugin } from '@jupyterlab/application';
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
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateSlateCommandExt
};

export default plugin; // TODO: export list when adding fits viewer plugin too
