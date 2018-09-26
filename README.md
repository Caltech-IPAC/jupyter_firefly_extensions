# jupyter_firefly_extensions

A Jupyter Lab mime extension for rendering FITS.

This is in the development phase `jupyter_firefly_extensions` in npm but
it is not pip installable yet.

_Note_ - the readme is currently being written and is very incomplete


## Overview

After installing this extension double click on a FITS file in jupyterlab and see the image in a tab.



## Prerequisites

* JupyterLab ^0.28.0



### Before running

Add the following line to your `~/.jupyter/jupyter_notebook_config.py`

```python
c.Firefly.url = 'http://localhost:8080/firefly'
```

_Or_ add the following line to your `~/.jupyter/jupyter_notebook_config.json` under the root object.

```json
"Firefly": {
  "url": "http://localhost:8080/firefly"
}
```

Where the url points to a firefly server.



### Install for testing

```bash
jupyter labextension install jupyter_firefly_extensions
jupyter serverextension enable --py jupyter_firefly_extensions
```

### Install for development

```bash
git clone https://github.com/Caltech-IPAC/jupyter_firefly_extensions
cd jupyter_firefly_extensions
jupyter labextension install . --no-build
jupyter lab build
jupyter serverextension enable --py jupyter_firefly_extensions
```



### Helpful commands

 - `jupyter serverextension list` - show a list of server extensions
 - `jupyter labextension list` - show a list of lab extensions
 - `jupyter lab` - run jupyter lab
 - `jupyter lab build` - rebuild after modifying the javascript:


### To remove extensions:
```bash
jupyter labextension uninstall jupyter_firefly_extensions
jupyter serverextension disable --py jupyter_firefly_extensions
pip uninstall jupyter_firefly_extensions
```
