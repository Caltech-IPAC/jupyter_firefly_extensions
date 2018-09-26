
def _jupyter_server_extension_paths():
    return [{
        "module": "jupyter_firefly_extensions"
    }]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    url = nb_server_app.config.get('Firefly', {}).get('url', 'not found')
    web_app.settings['fireflyURL']= url
    page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config['fireflyURL'] = url
    # for key,val in web_app.settings.items():
    #     print('{} => {}'.format(key,val))
