import time
import platform
import random
import os
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler


from .image import *
from .table import *
from .chart import *
from .utils import *
from .slate_widget import *


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-firefly',
        'require': 'jupyter-firefly/extension'
    }]




def _jupyter_server_extension_paths():
    return [{
        "module": "jupyter_firefly_extensions"
    }]



class HelloWorldHandler(IPythonHandler):

    def initialize(self):
        print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> in HelloWorldHandler.init')


    def get(self):
        print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> in HelloWorldHandler')
        self.finish('here in Hello, world!')



def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    config_url = nb_server_app.config.get('Firefly', {}).get('url', '')
    url= None
    if 'FIREFLY_URL' in os.environ:
        url = os.environ['FIREFLY_URL']
    if not url:
        url= config_url

    web_app.settings['fireflyURL']= url




    page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config['fireflyLabExtension'] = 'true'
    page_config['fireflyURL'] = url
    # for key,val in web_app.settings.items():
    #     print('{} => {}'.format(key,val))

    hostname= platform.node()
    timestamp= time.time()
    channel= 'ffChan-{}-{}-{}'.format(hostname,int(timestamp),random.randint(1,100))
    page_config['fireflyChannel'] = channel
    print('firefly URL: {}'.format(url))
    print('firefly Channel: {}'.format(channel))
    os.environ['fireflyChannelLab'] = channel
    os.environ['fireflyURLLab'] = url
    os.environ['fireflyLabExtension'] = 'true'
    

    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], 'lab/hello')
    web_app.add_handlers(host_pattern, [(route_pattern, HelloWorldHandler)])
