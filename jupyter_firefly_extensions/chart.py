import ipywidgets as widgets
from traitlets import Unicode


@widgets.register
class ChartViewer(widgets.DOMWidget):
    """
    Chart Viewer widget
    """
    _view_name = Unicode('ChartView').tag(sync=True)
    _view_module = Unicode('jupyter-firefly').tag(sync=True)
    tbl_group = Unicode().tag(sync=True)
