import time
import platform
import random
import os
import sys
import logging
import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from firefly_client import FireflyClient


def _get_access_token():
    if 'HOME' in os.environ:
        home = os.environ['HOME']
        token_file = '{}/.access_token'.format(home)
        try:
            f = open(token_file, "r")
            token = f.read()
            f.close()
            return token
        except IOError:
            pass
    if 'ACCESS_TOKEN' in os.environ:
        token = os.environ['ACCESS_TOKEN']
        return token
    return None


# TODO: replace logger with server_app.log
logger = logging.getLogger(__name__)
logger.propagate = False
ch = logging.StreamHandler(sys.stderr)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)
firefly_config = None


class GetFireflyUrlData(APIHandler):
    # This decorator ensures only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        j_str = json.dumps(firefly_config)
        logger.info('get_firefly_url_data: returning: ' + j_str)
        self.finish(j_str)


class SendToFireflyHandler(APIHandler):
    def initialize(self, notebook_dir, firefly_url):
        self.notebook_dir = notebook_dir
        self.firefly_url = firefly_url

    # This decorator ensures only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('path', 'not found')
        access_token = _get_access_token()
        logger.info('sendToFirefly: uploading to {}, access token: {}'.format(self.firefly_url, access_token))
        fc = FireflyClient.make_client(url=self.firefly_url, token=access_token, launch_browser=False)
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


def setup_handlers(server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    global firefly_config
    web_app = server_app.web_app
    config_url = server_app.config.get('Firefly', {}).get('url', '')
    url = None
    if 'FIREFLY_URL' in os.environ:
        url = os.environ['FIREFLY_URL']
    if not url:
        url = config_url

    web_app.settings['fireflyURL'] = url

    # page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config = {'fireflyLabExtension': 'true', 'fireflyURL': url}
    # for key,val in web_app.settings.items():
    #     print('{} => {}'.format(key,val))

    hostname = platform.node()
    timestamp = time.time()
    channel = 'ffChan-{}-{}-{}'.format(hostname, int(timestamp), random.randint(1, 100))
    page_config['fireflyChannel'] = channel
    logger.info('firefly URL: {}'.format(url))
    logger.info('firefly Channel: {}'.format(channel))
    # added next two lines because logger does not seem to work JL 3.5
    print('firefly URL: {}'.format(url))
    print('firefly Channel: {}'.format(channel))
    os.environ['fireflyChannelLab'] = channel
    os.environ['fireflyURLLab'] = url
    os.environ['fireflyLabExtension'] = 'true'
    firefly_config = dict(page_config)

    # setup server endpoint: sendToFirefly: http://127.0.0.1:8888/lab/sendToFirefly?path=x.fits
    host_pattern = '.*$'
    send_pattern = url_path_join(web_app.settings['base_url'], 'lab/sendToFirefly')
    get_ff_data_pattern = url_path_join(web_app.settings['base_url'], 'lab/fireflyLocation')
    web_app.add_handlers(host_pattern, [
        (send_pattern, SendToFireflyHandler, {'notebook_dir': server_app.notebook_dir, 'firefly_url': url}),
        (get_ff_data_pattern, GetFireflyUrlData, {})
    ])
