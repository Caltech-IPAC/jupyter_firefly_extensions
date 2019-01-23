import { Widget } from '@phosphor/widgets';
import {addFirefly} from './FireflyCommonUtils.js';



const fireflyInfo= addFirefly();


var widgetId;
var widgetCnt= 1;
var openWidgets= {};


/**
 * Extension can be started in two ways.
 * 1. as a jupyter command
 * 2. firefly_client sending a 'StartLabWindow' action
 * @param app
 */
export function activateSlateCommandExt(app) {
    const slateCmd= 'firefly:open slate';

                // this is a hack could not get the command palette like the documention showed
    const palette= app._pluginMap["@jupyterlab/apputils-extension:palette"].service._palette;
    palette.addItem({command: slateCmd, category: 'Firefly'});

    app.commands.addCommand(slateCmd, {
        label: 'Open Firefly',
        isEnabled: () => true,
        execute: () => {
            const id= 'slate-'+ widgetCnt;
            widgetCnt++;
            openSlateMulti(app, id, true)
        }
    });


    getFireflyAPI().then( (firefly) => {
        firefly.util.addActionListener(['StartLabWindow'], (action,state) => {
            openSlateMulti(app, action.payload.renderTreeId, false);
        });
        firefly.util.addActionListener(['StartBrowserTab'], (action,state) => {
            firefly.setViewerConfig(firefly.ViewerType.Grid);
            firefly.getViewer(action.payload.channel).openViewer();
        });

    });
}

function openSlateMulti(app, id, activate) {
    activate= window.document.getElementById(id) || activate;
    if (!openWidgets[id]) {
        let widget = new SlateRootWidget(id);
        app.shell.addToMainArea(widget);
        getFireflyAPI().then( (firefly) => {
            const {action}= firefly;
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
        getFireflyAPI().then( (firefly) => {
            const {action}= firefly;
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
        const {getFireflyAPI}= window;
        getFireflyAPI().then( (firefly) => {
            this.startViewer(firefly,id);
        } );
    }

    startViewer(firefly, id) {
        const {util,action}= firefly;
        const props=  {
            div: id,
            renderTreeId: id,
            template: 'FireflySlate',
            showBgMonitor: false,
            disableDefaultDropDown: true,
            menu: [
                {label:'Images', action:'ImageSelectDropDownSlateCmd'},
                {label:'Catalogs', action:'IrsaCatalogDropDown'},
                {label:'Charts', action:'ChartSelectDropDownCmd'},
                {label:'Upload', action: 'FileUploadDropDownCmd'},
            ],
        };
        action.dispatchApiToolsView(true,false);
        this.controlApp= util.startAsAppFromApi(id, props, {});
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
        getFireflyAPI().then( (firefly) => {
            const {action}= firefly;
            action.dispatchChangeActivePlotView(undefined);
        });
    }
}


function createNode(filename) {
    let node = document.createElement('div');
    node.id= filename;
    const tmpElement=  document.createElement('div');
    tmpElement.innerHTML= '<div>Firefly Loading...</div>';
    node.appendChild(tmpElement);
    return node;
}
