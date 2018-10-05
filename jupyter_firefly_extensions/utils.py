from __future__ import print_function
import ipywidgets as widgets
from ipywidgets import Layout
from traitlets import Unicode, Bool, Integer, Float, TraitError, validate
from IPython.core.display import HTML
from IPython.display import display

from ._version import version_short




@widgets.register
class ServerConnection(widgets.DOMWidget):
    _model_name = Unicode('ServerConnectionModel').tag(sync=True)
    _model_module = Unicode('jupyter-firefly').tag(sync=True)
    _model_module_version = Unicode(version_short).tag(sync=True)
    _view_name = Unicode('ServerConnection').tag(sync=True)
    _view_module = Unicode('jupyter-firefly').tag(sync=True)
    _view_module_version = Unicode(version_short).tag(sync=True)
    url = Unicode('url').tag(sync=True)


def helpme():
    """need help
    """
    print('help me')


def connect(server_url='http://localhost:8080/firefly'):
    """Load Firefly javascript into the DOM

    Parameters:
    ----------
    server_url : `str`
       base URL for Firefly server Firefly
       defaults to http://localhost:8080/firefly
    """
    print('>>>>>>>>>>>>>>>>>> in firefly_widgets, utils.py')
    print('>>>>>>>>>>>>>>>>>> in firefly_widgets, utils.py, again again')
    connection= ServerConnection(url=server_url, layout=Layout(width='400px', height='400px'))
    connection
    # fullstr = '<script src="{}/firefly_loader.js"></script>'.format(server_url)
    # display(HTML(fullstr))
