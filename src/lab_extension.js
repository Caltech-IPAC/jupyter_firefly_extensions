import {fitsViewerRendererFactory, FITS_MIME_TYPE} from './FitsViewerExt.js';



const fitsIFileType= {
        name: 'FITS',
        displayName: 'FITS file',
        fileFormat: 'base64',
        mimeTypes: [FITS_MIME_TYPE],
        extensions: ['.fits']
    };

const extension = [
    {
        id: 'jupyter_firefly_extensions:fitsviewer',
        name: 'FITS viewer - firefly',
        rendererFactory:fitsViewerRendererFactory,
        rank: 0,
        dataType: 'string',
        fileTypes: [fitsIFileType],
        documentWidgetFactoryOptions: {
            name: 'Firefly FITS viewer',
            modelName: 'base64',
            primaryFileType: 'FITS',
            fileTypes: ['FITS'],
            defaultFor: ['FITS']
        },

    }
    // --- adding a second extension for a given mime type does not work it is a bug in jupyter lab
    // --- https://github.com/jupyterlab/jupyterlab/issues/5381
    // , {
    //     id: 'jupyter_firefly_extensions:fitsviewer2',
    //     name: 'FITS2',
    //     rendererFactory:fitsViewerRendererFactory2,
    //     rank: 0,
    //     dataType: 'string',
    //     fileTypes: [fitsIFileType],
    //     documentWidgetFactoryOptions: {
    //         name: 'FITS2',
    //         modelName: 'base64',
    //         primaryFileType: 'FITS',
    //         fileTypes: ['FITS'],
    //     },
    //
    // }
];

export default extension;
