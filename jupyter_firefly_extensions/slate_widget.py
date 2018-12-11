import ipywidgets as widgets
from traitlets import Unicode, Bool, Integer, Float, TraitError, validate
from ._version import version_short


@widgets.register
class SlateWidget(widgets.DOMWidget):
    """
    Slate Widget
    """
    _model_name = Unicode('SlateModel').tag(sync=True)
    _model_module = Unicode('jupyter-firefly').tag(sync=True)
    _model_module_version = Unicode(version_short).tag(sync=True)
    _view_name = Unicode('SlateView').tag(sync=True)
    _view_module = Unicode('jupyter-firefly').tag(sync=True)
    _view_module_version = Unicode(version_short).tag(sync=True)
    detach = Unicode('true').tag(sync=True)

    try:
        from firefly_client import FireflyClient
        _fc = FireflyClient.make_lab_client(start_tab=False)
        _render_tree_id = Unicode(_fc.render_tree_id).tag(sync=True)
    except:
        _fc = None

    def get_firefly_client(self):
            if not self._fc:
                from firefly_client import FireflyClient
                self._fc = FireflyClient.make_lab_client(start_tab=False)
            return self._fc
