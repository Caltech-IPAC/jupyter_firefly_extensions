import { Widget } from '@lumino/widgets';
import { ICommandPalette, IFrame } from '@jupyterlab/apputils';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';

import { findFirefly } from './FireflyCommonUtils.js';


let widgetId;
let widgetCnt= 1;
let openWidgets= {};


/**
 * Extension can be started in two ways.
 * 1. as a jupyter command
 * 2. firefly_client sending a 'StartLabWindow' action
 * @param {JupyterFrontEnd} app
 * @param {ICommandPalette} palette
 * @param {ILauncher | null} launcher
 */
export function activateSlateCommandExt(app, palette, launcher) {
    findFirefly().then( (ffConfig) => {
        const {firefly}= ffConfig;
        firefly.util.addActionListener(['StartLabWindow'], (action,state) => {
            openSlateMulti(app, action.payload.renderTreeId, false);
        });
        firefly.util.addActionListener(['StartBrowserTab'], (action,state) => {
            firefly.setViewerConfig(firefly.ViewerType.Grid);
            firefly.getViewer(action.payload.channel).openViewer();
        });

    });

    // for starting extension as a jupyter command -----------
    const command = 'firefly:open-slate';
    const category = 'Firefly';

    app.commands.addCommand(command, {
        label: 'Open Firefly',
        caption: 'Open Firefly',
        isEnabled: () => true,
        execute: () => {
            const id= 'slate-'+ widgetCnt;
            widgetCnt++;
            openSlateMulti(app, id, true);
        }
    });

    palette.addItem({ command, category });
    if (launcher) launcher.add({ command, category});
}

function openSlateMulti(app, id, activate) {
    activate= window.document.getElementById(id) || activate;
    if (!openWidgets[id]) {
        let widget = new SlateRootWidget(id);
        if (app.shell.addToMainArea) app.shell.addToMainArea(widget); // --- pre version 1
        else if (app.shell.add) app.shell.add(widget, 'main');  // version 1
        else throw Error('Could not add firefly to tab');
        findFirefly().then( (ffConfig) => {
            const {action}= ffConfig.firefly;
            action.dispatchChangeActivePlotView(undefined);
        });
        openWidgets[id]= widget;
    }
    if (activate) app.shell.activateById(id);

}


/**
 * Open only one slate tab.  Using this funtion keeps the slate tab as a singleton.
 *
 * Currently not used.
 * @param app
 */
function openSlateSingleOnly(app) {
    if (!widgetId) {
        let widget = new SlateRootWidget('slate-1');
        app.shell.addToMainArea(widget);
        widgetId= widget.id;
        findFirefly().then( (ffConfig) => {
            const {action}= ffConfig.firefly;
            action.dispatchChangeActivePlotView(undefined);
        });
    }
    else {

    }
    app.shell.activateById(widgetId);
}



export class SlateRootWidget extends Widget {
    /**
     * Construct a new output widget.
     */
    constructor(id) {
        super({node: createNode(id)});
        this.id= id;
        this.title.label= 'Firefly: '+ id;
        this.title.closable= true;
        findFirefly().then( (ffConfig) => {
            this.startViewer(ffConfig.firefly,id);
        } );
    }

    startViewer(firefly, id) {
        const {util,action}= firefly;
        const props=  {
            div: id,
            renderTreeId: id,
            template: 'FireflySlate',
            disableDefaultDropDown: true,
        };
        const fallbackMenu= [
            {label:'Images', action:'ImageSelectDropDownSlateCmd'},
            {label:'TAP Searches', action: 'TAPSearch'},
            {label:'Catalogs', action:'IrsaCatalogDropDown'},
            {label:'Charts', action:'ChartSelectDropDownCmd'},
            {label:'Upload', action: 'FileUploadDropDownCmd'},
        ];
        if (!firefly.originalAppProps) {
            props.menu= fallbackMenu;
        }
        action.dispatchApiToolsView(true,false);
        this.controlApp= util.startAsAppFromApi(id, props);
    }

    dispose() {
        widgetId= undefined;
    }
    close() {
        super.close();
        widgetId= undefined;
        delete openWidgets[this.id];
        if (this.controlApp) this.controlApp.unrender();
        this.controlApp= undefined;
    }

    activate() {
        super.activate();
        if (this.controlApp) {
            this.controlApp.unrender();
            this.controlApp.render();
        }
        findFirefly().then( (ffConfig) => {
            const {action}= ffConfig.firefly;
            action.dispatchChangeActivePlotView(undefined);
        });
    }
}


function createNode(filename) {
    const node = document.createElement('div');
    node.id= filename;
    const tmpElement=  document.createElement('div');
    tmpElement.innerHTML= '<div>Firefly Loading...</div>';
    node.appendChild(tmpElement);
    return node;
}
