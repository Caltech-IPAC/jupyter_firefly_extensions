import { JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';


import { activateSlateCommandExt } from './SlateCommandExt.js';
import { activateFitsViewerExt } from './FitsViewerExt.js';
import { activateAnyFileViewerExt } from './AnyFileViewerExt.js';

/**
 * Initialization data for each extension.
 */
const showSlateExt: JupyterFrontEndPlugin<void> = {
  id: 'jupyter_firefly_extensions:showSlate',
  description: 'Show Firefly Viewer',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateSlateCommandExt
};

const fitsViewerExt: JupyterFrontEndPlugin<void> = {
  id: 'jupyter_firefly_extensions:fitsviewer',
  description: 'View a FITS file',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: activateFitsViewerExt
};

const anyFileViewerExt: JupyterFrontEndPlugin<void> = {
  id: 'jupyter_firefly_extensions:anyfileviewer',
  description: 'Open files with Firefly Viewer',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: activateAnyFileViewerExt
};

// More than one extension/plugin can be exported as a list
export default [showSlateExt, fitsViewerExt, anyFileViewerExt];
