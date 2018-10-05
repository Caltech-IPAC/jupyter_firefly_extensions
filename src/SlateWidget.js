import {addFirefly} from './FireflyCommonUtils.js';
import {version} from '../package.json';
const widgets = require('@jupyter-widgets/base');
const _ = require('lodash');

const fireflyURL= addFirefly();

export const SlateModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'SlateModel',
        _view_name : 'SlateView',
        _model_module : 'jupyter-firefly',
        _view_module : 'jupyter-firefly',
        _model_module_version : version,
        _view_module_version : version
    })
});

var seq = 1;

// Custom View. Renders the widget model.
export const SlateView= widgets.DOMWidgetView.extend({
    render() {
        getFireflyAPI().then( (firefly) => {

            const targetDiv= document.createElement('div');
            this.el.appendChild(targetDiv);
            targetDiv.style.width= '100%';
            targetDiv.style.height= '100%';
            targetDiv.id= 'slateWidget='+ seq;
            seq++;
            this.targetDiv= targetDiv;
            this.redraw = this.redraw.bind(this);


            this.el.onclick = () => {
                if (window.Jupyter) window.Jupyter.keyboard_manager.disable();
            };
            this.model.set('conn_id', String(firefly.util.getWsConnId()));
            this.model.set('channel', String(firefly.util.getWsChannel()));


            getFireflyAPI().then( (firefly) => {
                setTimeout(this.redraw, 0);
            } );
            this.touch();
        });
    },

    redraw() {
        if (this.controlApp) {
            this.controlApp.render();
        }
        else {
            const renderTreeId = this.model.get('_render_tree_id');
            this.startViewer(firefly,this.targetDiv.id, renderTreeId);
        }
    },

    startViewer(firefly, id, renderTreeId) {
        const {util,action}= firefly;
        const props=  {
            div: id,
            renderTreeId,
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


});


