import time
import platform
import random
import os
import sys
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


logger = logging.getLogger(__name__)
ch = logging.StreamHandler(sys.stderr)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)


class SendToFireflyHandler(IPythonHandler):

    def initialize(self, notebook_dir, firefly_url):
        self.notebook_dir = notebook_dir
        self.firefly_url = firefly_url

    def get(self):
        path = self.get_argument('path', 'not found')
        fc = FireflyClient(url=self.firefly_url)
        upload_name = 'FAILED:'

        file_names = self.generate_file_names(path, self.notebook_dir)
        found = False
        for f in file_names:
            if self.can_read(f):
                logger.info('sendToFirefly: uploading: ' + f)
                upload_name = fc.upload_file(f)
                found = True
                break

        if found:
            logger.info('sendToFirefly: success, Upload key: ' + upload_name)
        else:
            all_file_str = ', '.join(n for n in file_names)
            upload_name = 'FAILED: ' + all_file_str
            logger.info('sendToFirefly:failed: could not find file. tried: : '
                        + all_file_str)

        self.finish(upload_name)

    @staticmethod
    def can_read(f):
        if os.path.exists(f):
                return os.access(f, os.R_OK)
        return False

    @staticmethod
    def generate_file_names(path, notebook_dir):
        names = [
            os.path.join(notebook_dir, path),
            os.path.abspath(path)
        ]
        if 'HOME' in os.environ:
            names.append(os.path.join(os.environ['HOME'], path))
        return names


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    config_url = nb_server_app.config.get('Firefly', {}).get('url', '')
    url = None
    if 'FIREFLY_URL' in os.environ:
        url = os.environ['FIREFLY_URL']
    if not url:
        url = config_url

    web_app.settings['fireflyURL'] = url

    page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config['fireflyLabExtension'] = 'true'
    page_config['fireflyURL'] = url
    # for key,val in web_app.settings.items():
    #     print('{} => {}'.format(key,val))

    hostname = platform.node()
    timestamp = time.time()
    channel = 'ffChan-{}-{}-{}'.format(hostname, int(timestamp), random.randint(1, 100))
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
