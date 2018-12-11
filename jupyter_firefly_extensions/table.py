import ipywidgets as widgets
from traitlets import Unicode, Int
from astropy.table import Table
from six.moves.urllib.request import urlopen


@widgets.register
class TableViewer(widgets.DOMWidget):
    """
    Linked Table Viewer widget
    """
    _view_name = Unicode('TableView').tag(sync=True)
    _view_module = Unicode('jupyter-firefly').tag(sync=True)
    page_size = Int(50).tag(sync=True)
    filters = Unicode().tag(sync=True)
    position = Unicode('10.68479;41.26906;EQ_J2000').tag(sync=True)
    radius = Int(300).tag(sync=True)
    url_or_path = Unicode().tag(sync=True)
    data_url = Unicode().tag(sync=True)
    tbl_group = Unicode().tag(sync=True)
    conn_id = Unicode().tag(sync=True)
    channel = Unicode().tag(sync=True)
    tbl_id = Unicode().tag(sync=True)

    def selection(self):
        """
        return the current filtered table as an astropy table
        """
        return(Table.read(urlopen(self.data_url).read().decode("utf-8"), format='ipac'))
