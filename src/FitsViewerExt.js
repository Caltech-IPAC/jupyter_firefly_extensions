import { Widget } from '@phosphor/widgets';
import {initFirefly} from 'firefly-api-access';
import b64toBlob from 'b64-to-blob';
import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import {addFirefly} from './FireflyCommonUtils.js';



export const FITS_MIME_TYPE = 'application/fits';

const ERROR_MSG_CONT= `Make sure you set the firefly URL in your jupyter_notebook_config.py. 
                For example- 'c.Firefly.url= http://some.firefly.url/firefly'`;

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'jp-OutputWidgetFITS';



const fireflyURL= addFirefly();

var idCounter=0;




/**
 * A widget for rendering FITS.
 */
export class FitsViewerWidget extends Widget {
    /**
     * Construct a new output widget.
     */
    constructor(options) {
        super({ node: createNode(options.resolver._session.name) });
        this._mimeType = options.mimeType;
        this.addClass(CLASS_NAME);
        this.filename= options.resolver._session.name;
        idCounter++;
        this.plotId= `${this.filename}-${idCounter}`;
        this.loaded= false;
    }

    /**
     * Render FITS into this widget's node.
     */
    renderModel(model) {

        const {getFireflyAPI}= window;

        if (this.loaded) {
            return getFireflyAPI()
                .then( (firefly) => firefly.action.dispatchChangeActivePlotView(this.plotId) );
        }

        return getFireflyAPI()
            .then( (firefly) => loadFileToServer(model.data[FITS_MIME_TYPE], this.filename, firefly) )
            .then( (response) => response.text())
            .then( (text) => {
                const [status, cacheKey] = text.split('::::');
                showImage(cacheKey,this.plotId, this.filename, firefly);
                this.loaded= true;
            })
            .catch( (e) => {
                throw new Error(
                    `${e.message}. ${ERROR_MSG_CONT}`);
            });
    }

    dispose() {
        return window.getFireflyAPI()
            .then( (firefly) => firefly.action.dispatchDeletePlotView({plotId:this.plotId, holdWcsMatch:true}) );

    }
}


/**
 * A mime renderer factory for FITS data.
 */
export const fitsViewerRendererFactory = {
    safe: true,
    mimeTypes: [FITS_MIME_TYPE],
    createRenderer: options => {
        console.log('creating FitsViewerWidget '); //*** DEBUG
        return new FitsViewerWidget (options);
    }
};

// for adding a second extension for a mime type - does not work yet in Jupyter Lab
// --- https://github.com/jupyterlab/jupyterlab/issues/5381
// export const fitsViewerRendererFactory2 = {
//     safe: true,
//     mimeTypes: [FITS_MIME_TYPE],
//     createRenderer: options => {
//         console.log('creating FitsViewerWidget 2'); //*** DEBUG
//         return new FitsViewerWidget (options);
//     }
// };


function loadFileToServer( fileData, filename, firefly) {

    const {fetchUrl, ServerParams}= firefly.util;
    const UL_URL = `${fireflyURL}/sticky/CmdSrv?${ServerParams.COMMAND}=${ServerParams.UPLOAD}&filename=${filename}`;
    const fitsBlob= b64toBlob(fileData);
    const options = {
        method: 'multipart',
        params: {
            filename,
            type:'FITS',
            file: fitsBlob
        }
    };
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
    const {ui,util,action}= firefly;
    const {IMAGE, NewPlotMode}= util.image;
    const {dispatchPlotImage, dispatchAddViewer}= action;
    dispatchAddViewer(filename, NewPlotMode.create_replace.key, IMAGE);
    util.renderDOM(filename, ui.ApiFullImageDisplay,{viewerId:filename} );
    dispatchPlotImage({
        plotId:plotId,
        viewerId:filename,
        wpRequest:req,
        pvOptions: {
            userCanDeletePlots: false
        }
    });

}

function createNode(filename) {
    let node = document.createElement('div');
    node.id= filename;
    // const tmpElement=  document.createElement('div');
    // tmpElement.innerHTML= '<div>I am here</div>';
    // node.appendChild(tmpElement);
    return node;
}
