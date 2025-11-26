import { ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';
import { findFirefly } from './FireflyCommonUtils.js';

export const ANYFACTORY = 'Firefly Viewer';

// TODO: extend to other file types as needed
const fitsFileType = {
	name: 'FITS',
	displayName: 'FITS file',
	fileFormat: null,
	mimeTypes: ['application/fits'],
	extensions: ['.fits']
};

/**
 * Activate the AnyFileViewer extension.
 *
 * @param {JupyterLab} app
 * @param {ILayoutRestorer} _restorer
 */
export function activateAnyFileViewerExt(app, _restorer) {
	// Ensure the file type exists (guard for duplicates)
	if (!app.docRegistry.getFileType('FITS')) {
		app.docRegistry.addFileType(fitsFileType);
	}

	// Create a non-default reader for FITS that routes to Firefly's generic show_data flow
	const factory = new ABCWidgetFactory({
		name: ANYFACTORY,
		modelName: 'base64', // Prevents UTF-8 decode error for binary files
		fileTypes: ['FITS'],
		defaultFor: ['FITS'],
		readOnly: true
	});

	// Bind our widget creator
	factory.createNewWidget = (context) => createAnyViewerDocumentWidget(app, context);
	app.docRegistry.addWidgetFactory(factory);
}

/**
 * Create a minimal widget that forwards to Firefly and auto-closes.
 * 
 * We create a DocumentWidget here to satisfy JupyterLab's expectations,
 * but the content is just a placeholder. The real action happens in
 * forwardToFirefly(), which uploads the file to the Firefly server
 * and tells Firefly Viewer (client-side) to display it.
 */
function createAnyViewerDocumentWidget(app, context) {
	const content = new Widget();
	const widget = new DocumentWidget({ content, context, reveal: false });
	
	// Forward to Firefly and close this widget
	void forwardToFirefly(app, context.path).then(() => {
		widget.close();
	});
	
	return widget;
}

async function forwardToFirefly(app, filepath) {
	// 1) Ensure Firefly Viewer is open/active (singleton behavior handled by SlateCommandExt)
	try {
		await app.commands.execute('firefly:open-slate');
	} catch (e) {
		console.error('Could not activate Firefly viewer:', e);
		return;
	}

	// 2) Upload file to Firefly server and get file's cache key
	let cacheKey;
	try {
        const responseText = await (await requestAPI(`sendToFirefly?path=${encodeURIComponent(filepath)}`)).text();
        if (!responseText?.startsWith('${')) {
            throw new Error(`Unexpected response from Firefly server: ${responseText}`);
        }
        cacheKey = responseText;
	} catch (e) {
		console.error('Error while uploading to Firefly server:', e);
		return;
	}

	// 3) Tell Firefly JS API to display the uploaded file
	try {
		const { firefly } = await findFirefly();
		firefly.action.dispatchExternalUpload({
			fileOnServer: cacheKey,
			immediate: false,
			displayName: filepath
		});
	} catch (e) {
		console.error('Error dispatching external upload to Firefly client:', e);
	}
}
