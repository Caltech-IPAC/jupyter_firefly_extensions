import {findFirefly} from './FireflyCommonUtils.js';
import {initFirefly} from 'firefly-api-access';
import { PageConfig} from '@jupyterlab/coreutils';

var widgets = require('@jupyter-widgets/base');



export const ServerConnectionModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ServerConnectionModel',
        _view_name : 'ServerConnection',
        _model_module : 'jupyter-firefly',
        _view_module : 'jupyter-firefly',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0'
    })
});

export const ServerConnection = widgets.DOMWidgetView.extend({

    render() {
        const modelUrl = this.model.get('url');
        this.usingLabExt= PageConfig && PageConfig.getOption('fireflyLabExtension');
        if (this.usingLabExt && PageConfig.getOption('fireflyURL')) {
            const fireflyLabURL= PageConfig.getOption('fireflyURL');
            if (modelUrl && fireflyLabURL !== modelUrl) this.showURLMismatch= true;
            this.connectedURL= fireflyLabURL;
            findFirefly();
        }
        else {
            this.usingLabExt= false;
            this.connectedURL= modelUrl;
            window.getFireflyAPI= initFirefly(this.connectedURL);
        }
        this.redraw= this.redraw.bind(this);
        setTimeout(this.redraw, 0);
    },

    redraw() {
        const unnecessaryMsg= this.usingLabExt ?
            `You have installed the jupyter firefly extension, you don't need to use the ServerConnection Widget<br>` : '' ;
        const warning= this.showURLMismatch ?
            `Preset url either defined in <code>~/.jupyter/jupyter_notebook_config</code> 
             or environment variable <code>FIREFLY_URL</code> conflicts with passed URL, 
             using preset url<br>` : '';
        const connectMsg= `connected url: ${this.connectedURL}`;

        this.el.innerHTML=`<div style='font-size: 10pt'>${unnecessaryMsg}${warning}${connectMsg}</div>`;
    }

});
