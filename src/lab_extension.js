import { ILayoutRestorer} from '@jupyterlab/application';
import { IInstanceTracker} from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import {IJupyterWidgetRegistry} from '@jupyter-widgets/base';
import {version} from '../package.json';
import {activateFitsViewerExt} from './FitsViewerExt.js';
import {activateSlateCommandExt} from './SlateCommandExt.js';
import * as Image from './Image.js';
import * as Chart from './Chart.js';
import * as Table from './Table.js';
import * as Slate from './SlateWidget.js';
import * as ServerConnection from './ServerConnection.js';

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
        activate: activateSlateCommandExt
    },
    {
        id: 'jupyter_firefly_extensions:firefly_widgets',
        requires: [IJupyterWidgetRegistry],
        activate: function(app, widgets) {
            widgets.registerWidget({
                name: 'jupyter-firefly',
                version,
                exports: {...Image, ...Chart, ...Table, ...Slate, ...ServerConnection, version}
            });
        },
        autoStart: true
    }
];

export default extension;
