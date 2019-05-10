import time
import platform
import random
import os
import logging
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler
from firefly_client import FireflyClient


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


class SendToFireflyHandler(IPythonHandler):

    def initialize(self, notebook_dir, firefly_url):
        self.notebook_dir = notebook_dir
        self.firefly_url = firefly_url

    def get(self):
        log = logging.getLogger(__name__)
        path = self.get_argument('path', 'not found')
        fc = FireflyClient(url=self.firefly_url)
        first_try_file = self.notebook_dir+'/'+path
        second_try_file = os.path.abspath(path)
        third_try_file = ''
        if 'HOME' in os.environ:
            third_try_file = os.environ['HOME'] + '/' + path

        if self.can_read(first_try_file):
            log.info('sendToFirefly: uploading: ' + first_try_file)
            upload_name = fc.upload_file(first_try_file)
        elif self.can_read(second_try):
            log.info('sendToFirefly: uploading: ' + second_try_file)
            upload_name = fc.upload_file(second_try_file)
        elif len(third_try_file) and self.can_read(third_try_file):
            log.info('sendToFirefly: uploading: ' + third_try_file)
            upload_name = fc.upload_file(third_try_file)
        else:
            upload_name = 'FAILED: ' + first_try_file + ', ' + second_try_file + ', ' + third_try_file

        if upload_name.startswith('FAILED'):
            log.info('sendToFirefly:failed: could not find file. tried: %s, %s, %s'
                     % (first_try_file, second_try_file, third_try_file))
        else:
            log.info('sendToFirefly: success, Upload key: ' + upload_name)

        self.finish(upload_name)

    @staticmethod
    def can_read(f):
        if os.path.exists(f):
                return os.access(f, os.R_OK)
        return false



def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    logger = logging.getLogger(__name__)
    web_app = nb_server_app.web_app
    config_url = nb_server_app.config.get('Firefly', {}).get('url', '')
    url = None
    if 'FIREFLY_URL' in os.environ:
        url = os.environ['FIREFLY_URL']
    if not url:
        url = config_url

    web_app.settings['fireflyURL']= url

    page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config['fireflyLabExtension'] = 'true'
    page_config['fireflyURL'] = url
    # for key,val in web_app.settings.items():
    #     print('{} => {}'.format(key,val))

    hostname = platform.node()
    timestamp = time.time()
    channel = 'ffChan-{}-{}-{}'.format(hostname,int(timestamp),random.randint(1,100))
    page_config['fireflyChannel'] = channel
    logger.info('firefly URL: {}'.format(url))
    logger.info('firefly Channel: {}'.format(channel))
    os.environ['fireflyChannelLab'] = channel
    os.environ['fireflyURLLab'] = url
    os.environ['fireflyLabExtension'] = 'true'

    # setup server endpoint: sendToFirefly: http://127.0.0.1:8888/lab/sendToFirefly?path=x.fits
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], 'lab/sendToFirefly')
    web_app.add_handlers(host_pattern, [(route_pattern, SendToFireflyHandler,
                                         {
                                             'notebook_dir': nb_server_app.notebook_dir,
                                             'firefly_url': url
                                          })])
