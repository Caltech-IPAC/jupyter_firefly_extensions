import {
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';


import {activateSlateCommandExt} from './SlateCommandExt.js';


/**
 * Initialization data for the extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyter_firefly_extensions:showSlate',
  description:
    'Show firefly slate',
  autoStart: true,
  requires: [IDocumentManager,  ILayoutRestorer],
  activate: activateSlateCommandExt
};

export default plugin; // TODO: export list when adding fits viewer plugin too
