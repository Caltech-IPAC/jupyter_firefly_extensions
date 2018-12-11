import {addFirefly} from './FireflyCommonUtils.js';
const widgets = require('@jupyter-widgets/base');
const _ = require('lodash');


const fireflyURL= addFirefly();

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including `_model_name`, `_view_name`, `_model_module`
// and `_view_module` when different from the base class.
//
// When serialiazing entire widget state for embedding, only values different from the
// defaults will be specified.
export const ChartModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ChartModel',
        _view_name : 'ChartView',
        _model_module : 'jupyter-firefly',
        _view_module : 'jupyter-firefly'
    })
});

var seq = 1;

// Custom View. Renders the widget model.
export const ChartView = widgets.DOMWidgetView.extend({
    render: function() {
        this.el.id = `ChartViewer-${seq++}`;
        // disable Jupyter notebook keyboard manager
        // shortcut handling prevents input into dialog fields
        this.el.onclick = () => {
            Jupyter.keyboard_manager.disable();
        };
        this.model.on('change:tbl_group', this.redraw, this);
        this.redraw = this.redraw.bind(this);
        setTimeout(this.redraw, 0);
    },

    redraw: function() {
        getFireflyAPI().then( (firefly) => {
            firefly.showChart(this.el.id, {tbl_group: this.model.get('tbl_group')});
        });
    }

});


// module.exports = {
//     ChartModel : ChartModel,
//     ChartView : ChartView
// };
