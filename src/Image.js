import {findFirefly} from './FireflyCommonUtils.js';
import {version} from '../package.json';
import * as widgets from '@jupyter-widgets/base';
import {extend} from 'lodash';

// for model attributes, including `_model_name`, `_view_name`, `_model_module`
// and `_view_module` when different from the base class.
//
// When serializing entire widget state for embedding, only values different from the
// defaults will be specified.
export const ImageModel = widgets.DOMWidgetModel.extend({
    defaults: extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ImageModel',
        _view_name : 'ImageView',
        _model_module : 'jupyter-firefly',
        _view_module : 'jupyter-firefly',
        _model_module_version : version,
        _view_module_version : version
    })
});

//var util = firefly.util;
//var action = firefly.action;

var seq = 1;

// Custom View. Renders the widget model.
export const ImageView = widgets.DOMWidgetView.extend({
    render: function() {
        findFirefly().then( (ffConfig) => {

            const {firefly}= ffConfig;
            firefly.setGlobalPref({imageDisplayType: 'encapusulate'});
            const targetDiv= document.createElement('div');
            this.el.appendChild(targetDiv);
            targetDiv.style.width= '100%';
            targetDiv.style.height= '100%';
            this.targetDiv= targetDiv;


            this.url = this.model.get('url');
            let plotId = this.model.get('plot_id');
            if (!plotId) {
                plotId = `imageViewer-${seq++}`;
                this.model.set('plot_id', plotId);
            }
            this.targetDiv.id = plotId;
            // disable Jupyter notebook keyboard manager
            // shortcut handling prevents input into dialog fields
            this.el.onclick = () => {
                if (window.Jupyter) window.Jupyter.keyboard_manager.disable();
            };
            this.model.set('conn_id', String(firefly.util.getWsConnId()));
            this.model.set('channel', String(firefly.util.getWsChannel()));
            this.touch();
            this.req = {
                plotId,
                plotGroupId : 'jupyter-image-widgets',
                Type      : 'SERVICE',
                 Service   : 'WISE',
                Title     : 'wise from service',
                GridOn     : true,
                SurveyKey  : 'Atlas',
                SurveyKeyBand  : '2',
                WorldPt    : '10.68479;41.26906;EQ_J2000',
                SizeInDeg  : '.12',
                AllowImageSelection : true };
            this.model.on('change:GridOn change:SurveyKey change:FilePath', this.redraw, this);
            this.model.on('change:colorbar', this.update_color, this);
            this.model.on('change:zoom', this.update_zoom, this);
            this.model.on('change:detach', this.updateDetach, this);
            this.model.on('change:x_pan change:y_pan', this.update_pan, this);
            this.redraw = this.redraw.bind(this);
            this.update_color = this.update_color.bind(this);
            this.color_changed = this.color_changed.bind(this);
            this.colorListner = firefly.util.addActionListener(firefly.action.type.COLOR_CHANGE, this.color_changed);
            this.update_zoom = this.update_zoom.bind(this);
            this.zoom_changed = this.zoom_changed.bind(this);
            this.zoomListner = firefly.util.addActionListener(firefly.action.type.ZOOM_IMAGE, this.zoom_changed);
            this.update_pan = this.update_pan.bind(this);
            this.pan_changed = this.pan_changed.bind(this);
            this.stopPickListner = firefly.util.addActionListener(firefly.action.type.SELECT_POINT, this.pan_changed);
            //this.panListner = firefly.util.addActionListener(firefly.action.type.PROCESS_SCROLL, this.pan_changed);
            setTimeout(this.redraw, 0);
        });
    },

    redraw: function() {
        const {url, req, targetDiv, model}= this;
        req.GridOn = model.get('GridOn');
        req.SurveyKey = model.get('SurveyKey');
        req.WorldPt = model.get('WorldPt');
        req.SizeInDeg = model.get('SizeInDeg');
        const {plotId, plotGroupId}= req;
        if (url) {
            console.log('using url ' + url);
            firefly.showImage(targetDiv.id, {url, plotId, plotGroupId}, null, false);
        }
        else {
            firefly.showImage(targetDiv.id, req, null, false);
        }
    },

    update_color: function() {
        firefly.action.dispatchColorChange({
            plotId : this.req.plotId,
            cbarId : Number(this.model.get('colorbar')),
            actionScope : 'SINGLE'});
    },

    color_changed: function(action,state) {        // the callback for a color change
        if (action.payload.plotId === this.model.get('plot_id')) {
            const cbarId = Number(action.payload.primaryStateJson.colorTableId);
            const o_colorbar = Number(this.model.get('colorbar'));
            //var mymodel = this.model;
            console.log('I got a color change, colorbar = ' + cbarId);
            console.log('model colorbar = ' + o_colorbar);
            if (cbarId != o_colorbar){
                console.log('updating model colorbar to ' + cbarId);
                this.model.set('colorbar', cbarId);
                this.touch();
            }
        }
    },

    update_zoom: function() {
        firefly.action.dispatchZoom({
            plotId : this.model.get('plot_id'),
            userZoomType : 'LEVEL',
            level : this.model.get('zoom'),
            forceDelay : true });
    },

    zoom_changed: function(action,state) {        // the callback for a zoom change
        if (action.payload.plotId === this.model.get('plot_id')) {
            const plot= firefly.util.image.getPrimePlot( action.payload.plotId);  // get the plot
            console.log('I got a replot, zoom factor= ' + plot.zoomFactor);
            const zoom_factor = Math.round(parseFloat(plot.zoomFactor)*100)/100;
            const o_zoom = Math.round(this.model.get('zoom')*100)/100;
            console.log('model zoom = ' + o_zoom);
            if (zoom_factor !==o_zoom){
                console.log('updating model zoom to ' + zoom_factor);
                this.model.set('zoom', zoom_factor);
                this.touch();
            }
        }
     },

    update_pan: function() {
        console.log('updating x_pan, y_pan to ' + this.model.get('x_pan') + ' ' + this.model.get('y_pan'));
        const {model}= this;
        firefly.action.dispatchRecenter({
            plotId : model.get('plot_id'),
            centerPt : firefly.util.image.makeImagePt( Number(model.get('x_pan')), Number(model.get('y_pan')))});
    },

    pan_changed: function(action,state) {        // the callback for a zoom change
         console.log('I got a scroll processed');
        if (action.payload.plotId === this.model.get('plot_id')) {
            //var plot= firefly.util.image.getPrimePlot( action.payload.plotId);  // get the plot
            //const cc= firefly.util.image.CysConverter.make(plot);
            //const scrollToImagePt= cc.getImageCoords(
            //            firefly.util.image.makeScreenPt(plot.scrollX,plot.scrollY));
            var imagePt = String(action.payload.imagePt);
            var worldPt = String(action.payload.worldPt);
            console.log('imagePt is ' + imagePt);
            var data = imagePt.split(';');
            console.log('data[0] is ' + data[0]);
            console.log('data[1] is ' + data[1]);
            this.model.set('x_pan', Math.round(parseFloat(data[0])*100)/100);
            this.model.set('y_pan', Math.round(parseFloat(data[1])*100)/100);
            this.model.set('WorldPt', worldPt);
            this.touch();
        }
     },

    updateDetach: function() {
        console.log('updating detach');
        const {model}= this;
        if (model.get('detach')) {
            // this.el.id;


        }
    },

});



