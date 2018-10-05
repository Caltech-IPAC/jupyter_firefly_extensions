import {activateFitsViewerExt, createNewFitsViewerDocumentWidget, FITS_MIME_TYPE} from './FitsViewerExt.js';
import { ILayoutRestorer, JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
import { IInstanceTracker, InstanceTracker} from '@jupyterlab/apputils';
import { plugins } from '@jupyterlab/apputils-extension';
import { palette } from '@jupyterlab/apputils-extension';
import { IDocumentManager } from '@jupyterlab/docmanager';
import {activateSlateCommandExt} from './SlateCommandExt.js';
import { ICommandPalette } from '@jupyterlab/apputils';

import * as Image from './Image.js';
import * as Chart from './Chart.js';
import * as Table from './Table.js';
import * as Slate from './SlateWidget.js';
import * as ServerConnection from './ServerConnection.js';
import {version} from '../package.json';

const base = require('@jupyter-widgets/base');


const fireflyWidgets= Object.assign({}, Image, Chart, Table, Slate, ServerConnection, {version});


const extension = [
    {
        id: 'jupyter_firefly_extensions:fitsviewer',
        autoStart: true,
        activate: activateFitsViewerExt,
        requires: [ILayoutRestorer],
        provides: [IInstanceTracker],
    },
    {
        id: 'jupyter_firefly_extensions:showSlate',
        autoStart: true,
        requires: [IDocumentManager,  ILayoutRestorer],
        // requires: [IDocumentManager,  ILayoutRestorer, ICommandPalette],
        activate: activateSlateCommandExt
    },
    {
        id: 'jupyter_firefly_extensions:firefly_widgets',
        requires: [base.IJupyterWidgetRegistry],
        activate: function(app, widgets) {
            widgets.registerWidget({
                name: 'jupyter-firefly',
                version: fireflyWidgets.version,
                exports: fireflyWidgets
            });
        },
        autoStart: true
    }
];

export default extension;
