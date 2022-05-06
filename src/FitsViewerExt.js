import b64toBlob from 'b64-to-blob';
import {buildURLErrorHtml, findFirefly, makeLabEndpoint} from './FireflyCommonUtils.js';
import { Widget } from '@lumino/widgets';
import { ABCWidgetFactory, DocumentWidget} from '@jupyterlab/docregistry';
import { PageConfig} from '@jupyterlab/coreutils';


export const FITS_MIME_TYPE = 'application/fits';


/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'jp-OutputWidgetFITS';

let idCounter=0;

const FACTORY = 'FITS-IMAGE';


const fitsIFileType= {
    name: 'FITS',
    displayName: 'FITS file',
    fileFormat: 'base64',  // TODO: try putting a null here to keep from loading file, the might be the answer
                           // will need to check the JL version someway
    format: 'base64',
    mimeTypes: [FITS_MIME_TYPE],
    extensions: ['.fits']
};

/**
 *
 * @param {JupyterLab} app
 * @param {ILayoutRestorer} restorer
 */
export function activateFitsViewerExt(app, restorer) {
    const namespace = 'firefly-imageviewer-widget';
    const jlVersion= PageConfig.getOption('appVersion');
    const vAry= jlVersion?.split('.').map( (x) => Number(x)) ?? [0,0,0];

    // if Jupyter Lab version is 3.1 or greater then clear the fileFormat so it does not load the file on the client
    // see - https://github.com/jupyterlab/jupyterlab/pull/7596
    if (vAry[0] >=3 && vAry[1] >= 1) fitsIFileType.fileFormat= null;

    app.docRegistry.addFileType(fitsIFileType);
    const factory = new ABCWidgetFactory({
        name: FACTORY,
        modelName: 'base64',
        // modelName: 'fits-model',
        fileTypes: ['FITS'],
        defaultFor: ['FITS'],
        readOnly: true
    });
    factory.createNewWidget= createNewFitsViewerDocumentWidget;
    app.docRegistry.addWidgetFactory(factory);

    factory.widgetCreated.connect((sender, widget) => {
        const types = app.docRegistry.getFileTypesForPath(widget.context.path);

        if (types.length) {
            widget.title.iconClass = types[0].iconClass || '';
            widget.title.iconLabel = types[0].iconLabel || '';
        }
    });
}





export function createNewFitsViewerDocumentWidget(context) {
    // instead of extending DocumentWidget like the example, just use it directly
    return new DocumentWidget({ content:new FitsViewerWidget(context), context, reveal:true, toolbar:null });
}

/**
 * A widget for rendering FITS.
 */
export class FitsViewerWidget extends Widget {
    /**
     * Construct a new output widget.
     * @param context
     */
    constructor(context) {
        super({ node: createNode(context._path) });
        const useModel= window.firefly && window.firefly.jlExtUseModel || false;
        this.addClass(CLASS_NAME);
        this.filename= context._path;
        idCounter++;
        this.plotId= `${this.filename}-${idCounter}`;
        this.loaded= false;
        if (this.isDisposed) return;
        this.renderModel(context,useModel).then(() => {
        });
        context.model.contentChanged.connect( this.renderModel, this );
        context.fileChanged.connect( this.renderModel, this );
    }

    /**
     * Render FITS into this widget's node.
     * @param context
     * @param useModelFirst
     * @return {Promise<{firefly: Object, channel: string, fireflyURL: string}>}
     */
    renderModel(context, useModelFirst) {

        if (this.isDisposed) return;

        if (this.loaded) {
            return findFirefly()
                .then( (ffConfig) => ffConfig.firefly.action.dispatchChangeActivePlotView(this.plotId) );
        }

        let firefly, fireflyURL;
        return findFirefly()
            .then( (ffConfig) => {
                firefly= ffConfig.firefly;
                fireflyURL= ffConfig.fireflyURL;
                if (useModelFirst) {
                    return context.ready.then(() => loadFileToServer(context.model.toString(), this.filename, firefly, fireflyURL));
                }
                else {
                    return tellLabToLoadFileToServer(this.filename, firefly);
                }
            } )
            .then( (response) => response.text())
            .then( (text) => {
                if (useModelFirst) {
                    const [, cacheKey] = text.split('::::');
                    showImage(cacheKey,this.plotId, this.filename, firefly);
                }
                else {
                    if (text && text.length<300 && text.startsWith('${')) {
                        showImage(text,this.plotId, this.filename, firefly);
                    }
                    else {
                        console.log('Firefly FitsViewExt: Failed to upload from server, ' +
                                          'falling back to (slower) browser upload.');
                        context.ready.then(() => loadFileToServer(context.model.toString(), this.filename, firefly, fireflyURL))
                            .then( (response) => response.text())
                            .then( (text) => {
                                const [, cacheKey] = text.split('::::');
                                showImage(cacheKey, this.plotId, this.filename, firefly);
                            });
                    }
                }
                this.loaded= true;
            })
            .catch( (e) => {
                const div= document.getElementById(this.filename);
                if (div) div.innerHTML=buildURLErrorHtml(e);
            });
    }

    dispose() {
        return findFirefly()
            .then( (ffConfig) => ffConfig.firefly.action.dispatchDeletePlotView({plotId:this.plotId, holdWcsMatch:true}) );

    }

    activate() {
        super.activate();
        if (this.loaded) {
            return findFirefly().then( (ffConfig) => ffConfig.firefly.action.dispatchChangeActivePlotView(this.plotId) );
        }
    }
}


function tellLabToLoadFileToServer( path, firefly) {
    const url= makeLabEndpoint('lab/sendToFirefly', new URLSearchParams({'path':path}));
    return firefly.util.fetchUrl(url,{ method: 'GET' },false, false)
        .catch( (e) => {
            console.error('Firefly FitsViewExt: Got Error from upload request',e);
            return 'FAILED';
        });
}


function loadFileToServer( fileData, filename, firefly, fireflyURL) {
    const {fetchUrl, ServerParams}= firefly.util;
    const UL_URL = `${fireflyURL}/sticky/CmdSrv?${ServerParams.COMMAND}=${ServerParams.UPLOAD}&filename=${filename}`;
    const fitsBlob= b64toBlob(fileData);
    const options = { method: 'multipart', params: { filename, type:'FITS', file: fitsBlob } };
    return fetchUrl(UL_URL, options);
}

function showImage(cacheKey, plotId, filename, firefly) {
    const req= {
        type     : 'FILE',
        FILE     : cacheKey,
        plotId,
        plotGroupId: 'JUPLAB',
        title: filename
    };
    firefly.action.dispatchApiToolsView(true, false);
    firefly.setGlobalPref({imageDisplayType: 'encapusulate'});
    firefly.showImage(filename, req, null, false);
}

function createNode(filename) {
    const node = document.createElement('div');
    node.id= filename;
    return node;
}

//=========================================================================================================
//============ Keep code below for reference
//============ Keep code below for reference
//============ Keep code below for reference


// /**
//  * A mime renderer factory for FITS data.
//  */
// export const fitsViewerRendererFactory = {
//     safe: true,
//     mimeTypes: [FITS_MIME_TYPE],
//     createRenderer: options => {
//         return new FitsViewerWidget (options);
//     }
// };



// import { ABCWidgetFactory, DocumentRegistry, DocumentWidget, IDocumentWidget } from '@jupyterlab/docregistry';
// import { PageConfig, URLExt } from '@jupyterlab/coreutils';


// const ERROR_MSG_CONT= `Make sure you set the firefly URL in your jupyter_notebook_config.py.
//                 For example- 'c.Firefly.url= http://some.firefly.url/firefly'`;

// for adding a second extension for a mime type - does not work yet in Jupyter Lab
// --- https://github.com/jupyterlab/jupyterlab/issues/5381
// export const fitsViewerRendererFactory2 = {
//     safe: true,
//     mimeTypes: [FITS_MIME_TYPE],
//     createRenderer: options => {
//         return new FitsViewerWidget (options);
//     }
// };


// export class FitsViewerDocument extends DocumentWidget {
//
//   constructor(context) {
//       super({ content:new FitsViewerWidget(context), context, reveal:true, toolbar:null });
//     // const toolbar = Private.createToolbar(content.viewer);
//     // const reveal = content.ready;
//   }
// }


// export class FitsViewerFactory extends ABCWidgetFactory {
//
//     constructor(options) {
//         super(options);
//     }
//
//
//
//     /**
//      * Create a new widget given a context.
//      * @param context DocumentRegistry.IContext<DocumentRegistry.IModel>
//      * @return DocumentWidget
//      */
//     createNewWidget(context) {
//         // return new FitsViewerDocument(context);
//         return new DocumentWidget({ content:new FitsViewerWidget(context), context, reveal:true, toolbar:null });
//     }
// }


// const a= {
//     name: 'some-name',
//     fileTypes: ['csv'],
//     defaultFor: [],
//     defaultRendered: [],
//     readOnly: false,
//     modelName: 'text',
//     preferKernel: false,
//     canStartKernel: false,
//     widgetCreated: new Signal(null),
// }
