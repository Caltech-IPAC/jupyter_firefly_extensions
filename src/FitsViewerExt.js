import b64toBlob from 'b64-to-blob';
import { buildURLErrorHtml, findFirefly } from './FireflyCommonUtils.js';
import { Widget } from '@lumino/widgets';
import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { requestAPI } from './handler';


export const FITS_MIME_TYPE = 'application/fits';
const CLASS_NAME = 'jp-OutputWidgetFITS'; // the class name added to the extension
const FACTORY = 'Firefly (Image Viewer)';

let idCounter=0;


const fitsIFileType = {
    name: 'FITS',
    displayName: 'FITS file',
    fileFormat: null, // prevent client from auto-loading bytes; server path or on-demand upload handles it
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
    if (!app.docRegistry.getFileType('FITS')) { //prevent duplicate registration of file type
        app.docRegistry.addFileType(fitsIFileType);
    }

    const factory = new ABCWidgetFactory({
        name: FACTORY,
        modelName: 'base64', // so that context.model.toString() returns base64 encoded file data
        fileTypes: ['FITS'],
        defaultFor: ['FITS'],
        readOnly: true
    });
    factory.createNewWidget = createNewFitsViewerDocumentWidget;
    app.docRegistry.addWidgetFactory(factory);

    factory.widgetCreated.connect((_sender, widget) => {
        const types = app.docRegistry.getFileTypesForPath(widget.context.path);
        if (types.length) {
            widget.title.iconClass = types[0].iconClass || '';
            widget.title.iconLabel = types[0].iconLabel || '';
        }
    });
}





export function createNewFitsViewerDocumentWidget(context) {
    // DocumentWidget wrapper (no toolbar, default save etc. needed for read-only viewer)
    return new DocumentWidget({ content: new FitsViewerWidget(context), context, reveal: true, toolbar: null });
}

/**
 * A widget for rendering a Firefly FITS Image Viewer.
 */
export class FitsViewerWidget extends Widget {
    /**
     * Construct a new output widget.
     * @param context
     */
    constructor(context) {
        super({ node: createNode(context.path) });
        // jlExtUseModel flag controls whether to upload from JL client-side file "model"
        // default is false to upload from JL server which is faster
        const useModel = window?.firefly?.jlExtUseModel || false;
        this.addClass(CLASS_NAME);
        this.filename = context.path;
        idCounter++;
        this.plotId = `${this.filename}-${idCounter}`;
        this.loaded = false;
        if (this.isDisposed) return;

        // Initial render
        void this.renderModel(context, useModel);
        // Re-render if content or file changes (e.g., save-as, rename)
        context.model.contentChanged.connect(this.renderModel, this);
        context.fileChanged.connect(this.renderModel, this);
    }

    /**
     * Render FITS into this widget's node.
     * @param context
     * @param useModelFirst
     * @return {Promise<{firefly: Object, channel: string, fireflyURL: string}>}
     */
    async renderModel(context, useModelFirst) {
        if (this.isDisposed) return;

        // If already loaded, just activate the existing plot view
        if (this.loaded) {
            return findFirefly().then(
                ({firefly}) => firefly.action.dispatchChangeActivePlotView(this.plotId)
            );
        }

        try {
            const { firefly, fireflyURL } = await findFirefly();

            // 1. Acquire server response (either upload file from JL-client model OR ask JL server to upload)
            let responseText;
            if (useModelFirst) {
                await context.ready; // ensure model contents ready
                const uploadResp = await loadFileToServer(context.model.toString(), this.filename, firefly, fireflyURL);
                responseText = await uploadResp.text();
            } else {
                 responseText = await tellLabToLoadFileToServer(this.filename, firefly);
            }

            // 2. Interpret response or fallback
            let cacheKey = null; // Firefly server cache key for the uploaded file
            if (useModelFirst) {
                [, cacheKey] = (responseText || '').split('::::'); // Expected format: <something>::::<cacheKey>
                if (!cacheKey) {
                    console.warn('Firefly FitsViewExt: unexpected upload response, cannot extract cache key');
                }
            } else {
                if (responseText && responseText.length < 300 && responseText.startsWith('${')) { // Server upload succeeded; response itself is the cache key
                    cacheKey = responseText;
                } else { // Fallback to client upload
                    console.log('Firefly FitsViewExt: failed to upload from server, falling back to (slower) browser upload');
                    await context.ready;
                    const upResp = await loadFileToServer(context.model.toString(), this.filename, firefly, fireflyURL);
                    const upText = await upResp.text();
                    [, cacheKey] = (upText || '').split('::::');
                    if (!cacheKey) {
                        console.error('Firefly FitsViewExt: fallback upload response missing cache key');
                    }
                }
            }

            // 3. Show image if upload succeeded and we have a cache key for the file
            if (cacheKey) {
                // firefly.action.dispatchExternalUpload({fileOnServer: cacheKey, immediate: false}); //TODO: remove after testing
                showImage(cacheKey, this.plotId, this.filename, firefly);
                this.loaded = true;
                return;
            }

            // If we reach here we failed to display
            const div = document.getElementById(this.filename);
            if (div && !this.loaded) {
                div.innerHTML = buildURLErrorHtml('Failed to load FITS file');
            }
        } catch (e) {
            const div = document.getElementById(this.filename);
            if (div) div.innerHTML = buildURLErrorHtml(e);
        }
    }

    dispose() {
        // Attempt to remove Firefly image view; ignore errors if firefly not available.
        findFirefly()
            .then(({ firefly }) => firefly.action.dispatchDeletePlotView({ plotId: this.plotId, holdWcsMatch: true }))
            .catch(() => undefined);
        super.dispose();
    }

    activate() {
        super.activate();
        if (this.loaded) {
            return findFirefly().then(
                ({ firefly }) => firefly.action.dispatchChangeActivePlotView(this.plotId)
            );
        }
    }
}

/**
 * Load a file to the Firefly server from JL server.
 * 
 * Invokes the server extension (at /jupyter-firefly-extensions/sendToFirefly endpoint)
 * to upload the file by using the firefly python client
 */
function tellLabToLoadFileToServer(path, firefly) {
    console.debug(`Firefly FitsViewExt: asking JL server to upload file: ${path}`);
    return requestAPI(`sendToFirefly?path=${encodeURIComponent(path)}`)
        .then((response) => response.text())
        .catch((e) => {
            console.error('Firefly FitsViewExt: error from server upload request', e);
            return 'FAILED'; // dummy response text to trigger fallback
        });
}

/**
 * Load a file to the Firefly server from the JL client.
 * 
 * It's slower because JL client will read the file into browser memory first, 
 * encode it and then upload to server.
 */
function loadFileToServer(fileData, filename, firefly, fireflyURL) {
    const { fetchUrl, ServerParams } = firefly.util;
    const UPLOAD_URL = `${fireflyURL}/sticky/CmdSrv?${ServerParams.COMMAND}=${ServerParams.UPLOAD}&filename=${encodeURIComponent(filename)}`;
    const fitsBlob = b64toBlob(fileData);
    const options = { method: 'multipart', params: { filename, type: 'FITS', file: fitsBlob } };
    console.debug(`Firefly FitsViewExt: uploading file from JL client to ${UPLOAD_URL}`);
    return fetchUrl(UPLOAD_URL, options);
}

/**
 * Show an uploaded FITS file as image in the Firefly viewer.
 * 
 * This calls the Firefly JS API directly to display an image viewer for the file.
 */
function showImage(cacheKey, plotId, filename, firefly) {
    const req = {
        type: 'FILE',
        FILE: cacheKey,
        plotId,
        plotGroupId: 'JUPLAB',
        title: filename
    };
    // firefly.action.dispatchApiToolsView(true);
    // firefly.setGlobalPref({ imageDisplayType: 'encapusulate' });

    // high-level API that attaches an independent imageviewer to a target div
    // alongside dispatching action to display the image in that viewer
    firefly.showImage(filename, req, null, false); // targetDivId = filename
}

function createNode(filename) {
    const node = document.createElement('div');
    node.id = filename;
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
