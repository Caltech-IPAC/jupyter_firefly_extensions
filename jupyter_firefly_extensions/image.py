import ipywidgets as widgets
from traitlets import Unicode, Bool, Integer, Float, TraitError, validate
from ._version import version_short

@widgets.register
class ImageViewer(widgets.DOMWidget):
    """
    Image Viewer widget
    """
    _model_name = Unicode('ImageModel').tag(sync=True)
    _model_module = Unicode('jupyter-firefly').tag(sync=True)
    _model_module_version = Unicode(version_short).tag(sync=True)
    _view_name = Unicode('ImageView').tag(sync=True)
    _view_module = Unicode('jupyter-firefly').tag(sync=True)
    _view_module_version = Unicode(version_short).tag(sync=True)
    GridOn = Bool(True).tag(sync=True)
    SurveyKey = Unicode('k').tag(sync=True)
    WorldPt = Unicode('10.68479;41.26906;EQ_J2000').tag(sync=True)
    SizeInDeg = Unicode('.12').tag(sync=True)
    url = Unicode('').tag(sync=True)
    colorbar = Integer(0).tag(sync=True)
    x_pan = Float(1.0).tag(sync=True)
    y_pan = Float(1.0).tag(sync=True)
    zoom = Float(1.0).tag(sync=True)
    conn_id = Unicode().tag(sync=True)
    channel = Unicode().tag(sync=True)
    plot_id = Unicode().tag(sync=True)
    detach = Unicode().tag(sync=False)

    @validate('colorbar')
    def _valid_colorbar(self, proposal):
        colorbar = proposal['value']
        if colorbar not in range(22):
            raise TraitError('colorbar must be in range 0 to 21 inclusive')
        return proposal['value']
