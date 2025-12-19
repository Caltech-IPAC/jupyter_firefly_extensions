import time
import platform
import random
import os
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


firefly_config = None


class GetFireflyUrlData(APIHandler):
    def initialize(self, logger=None):
        self.logger = logger or self.log # self.log is the default Jupyter Server logger

    # This decorator ensures only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        j_str = json.dumps(firefly_config)
        self.logger.info('get_firefly_url_data: returning: ' + j_str)
        self.finish(j_str)


class SendToFireflyHandler(APIHandler):
    def initialize(self, notebook_dir, firefly_url, logger=None):
        self.notebook_dir = notebook_dir
        self.firefly_url = firefly_url
        self.logger = logger or self.log # self.log is the default Jupyter Server logger

    # This decorator ensures only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('path', 'not found')
        access_token = _get_access_token()
        self.logger.info(f'sendToFirefly: uploading to {self.firefly_url}'
                         f'{" with an access token" if access_token is not None else ""}')
        fc = FireflyClient.make_client(url=self.firefly_url, token=access_token, launch_browser=False)
        upload_name = 'FAILED:'
        file_names = self.generate_file_names(path, self.notebook_dir)
        found = False
        for f in file_names:
            if self.can_read(f):
                self.logger.info(f'sendToFirefly: starting upload: {f}')
                upload_name = fc.upload_file(f)
                found = True
                break
        if found:
            self.logger.info(f'sendToFirefly: upload succeeded; file on server key: {upload_name}')
        else:
            all_file_str = ', '.join(file_names)
            upload_name = 'FAILED: ' + all_file_str
            self.logger.error(f'sendToFirefly: upload failed; could not find file.\nTried: {all_file_str}')
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
        server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    # TODO: move it to server_app settings instead
    global firefly_config

    # Namespace the logs of this extension in the Jupyter server logs (will show as "ServerApp.jupyter_firefly_extensions")
    logger = server_app.log.getChild('jupyter_firefly_extensions')

    web_app = server_app.web_app
    config_url = server_app.config.get('Firefly', {}).get('url', 'http://localhost:8080/firefly')
    url = None
    html_file = None
    if 'FIREFLY_URL' in os.environ:
        url = os.environ['FIREFLY_URL']
    if not url:
        url = config_url

    if 'FIREFLY_HTML' in os.environ:
        html_file = os.environ['FIREFLY_HTML']

    web_app.settings['fireflyURL'] = url
    web_app.settings['fireflyHtmlFile'] = html_file

    # page_config = web_app.settings.setdefault('page_config_data', dict())
    page_config = {'fireflyLabExtension': 'true', 'fireflyURL': url, 'fireflyHtmlFile': html_file}

    hostname = platform.node()
    timestamp = time.time()
    channel = 'ffChan-{}-{}-{}'.format(hostname, int(timestamp), random.randint(1, 100))
    page_config['fireflyChannel'] = channel
    logger.info(f'Firefly config:\nfirefly URL: {url}'
                        f'\nfirefly HTML File: {"not defined" if not html_file else html_file}'
                        f'\nfirefly Channel: {channel}')
    os.environ['fireflyChannelLab'] = channel
    os.environ['fireflyURLLab'] = url
    os.environ['fireflyHtmlFile'] = '' if not html_file else html_file
    os.environ['fireflyLabExtension'] = 'true'
    firefly_config = dict(page_config)

    # setup server extension endpoints ----------------------------------
    host_pattern = '.*$'
    send_pattern = url_path_join(web_app.settings['base_url'], 'jupyter-firefly-extensions', 'sendToFirefly')
    get_ff_data_pattern = url_path_join(web_app.settings['base_url'], 'jupyter-firefly-extensions', 'fireflyLocation')
    web_app.add_handlers(host_pattern, [
        # used by `tellLabToLoadFileToServer()` at JL client for requesting JL server to
        # do FireflyClient.upload_file() and return the name of file on server (cache key)
        # e.g. GET http://127.0.0.1:8888/jupyter-firefly-extensions/sendToFirefly?path=x.fits -> '${upload-dir}/...x.fits'
        (send_pattern, SendToFireflyHandler, {
            # parameters to instantiate the class
            'notebook_dir': server_app.notebook_dir,
            'firefly_url': url,
            'logger': logger
        }),

        # used by `findFirefly()` at JL client for retrieving the `firefly_config` JSON from JL server
        # e.g. GET http://127.0.0.1:8888/jupyter-firefly-extensions/fireflyLocation -> JSON {fireflyURL, channel, firefly, fireflyHtmlFile, ...}
        (get_ff_data_pattern, GetFireflyUrlData, {
            'logger': logger
        })
    ])
