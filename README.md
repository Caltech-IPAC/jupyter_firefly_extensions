# jupyter_firefly_extensions

A Jupyterlab extension for rendering FITS images with Firefly.

This package is in the development phase. `jupyter_firefly_extensions` is 
installable via npm (Javascript side) and pip (Python side).


## Overview

This extension adds the following features to JupyterLab:

  - Double click or right-click on a FITS file and see it in a tab
  - Start the full Firefly viewer in a tab.
  - Use `FireflyClient` in a Python notebook to start Firefly in a tab and send data
  (tables, images, charts) to it using the `FireflyClient` API
  - There are several widgets (images, tables, charts) that can be used in a notebook
  - The `SlateWidget` is a full Firefly viewer widget that provides a `FireflyClient` instance to embed a full Firefly in a notebook as a widget



## Prerequisites

* JupyterLab ^0.35.1
* nodejs
* ipywidgets ^7.0.0
* astropy ^3.0.0
* firefly_client ^2.1.1

The first four prerequisites can be installed with `conda install jupyterlab nodejs ipywidgets astropy`.
The `firefly_client` package can be installed with `pip install firefly_client`.

### _Very Important_: first setup the Firefly URL - 3 ways

 * Add the following line to your `~/.jupyter/jupyter_notebook_config.py`

   ```python
   c.Firefly.url = 'http://localhost:8080/firefly'
   ```

_Or_

 * Add the following line to your `~/.jupyter/jupyter_notebook_config.json` under the root object.

   ```json
   "Firefly": {
     "url": "http://localhost:8080/firefly"
   }
   ```

_Or_

 * Use the environment variable

   ```
   setenv FIREFLY_URL http://localhost:8080/firefly
   ```

**where the URL points to a Firefly server.**



### Install

To use any of the widgets in this package you must install the jupyter widget manager (`@jupyter-widgets/jupyterlab-manager`)

```bash
pip install firefly_client
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install jupyter_firefly_extensions
pip install jupyter_firefly_extensions
jupyter serverextension enable --py jupyter_firefly_extensions
```

### Install for development

_First:_

If developing `firefly_client`, be sure to clone the `firefly_client` repository
(https://github.com/Caltech-IPAC/firefly_client)
and then do `pip install -e .` from inside its directory.

_Then:_
```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
git clone https://github.com/Caltech-IPAC/jupyter_firefly_extensions
cd jupyter_firefly_extensions
jupyter labextension install . --no-build
jupyter lab build
pip install -e .
jupyter serverextension enable --py jupyter_firefly_extensions
```



### Helpful commands

 - `jupyter serverextension list` - show a list of server extensions
 - `jupyter labextension list` - show a list of lab extensions
 - `jupyter lab` - run jupyter lab
 - `jupyter lab build` - rebuild after modifying the javascript:


### To remove extensions:
```bash
jupyter labextension uninstall @jupyter-widgets/jupyterlab-manager --no-build
jupyter labextension uninstall jupyter_firefly_extensions
jupyter serverextension disable --py jupyter_firefly_extensions
pip uninstall jupyter_firefly_extensions
```


### Examples
The `examples` directory has several example notebooks to demonstrate the extension features. When using the examples you should copy the directory and contents to another place or jupyter lab will and to keep rebuilding

 - `slate-demo-explicit.ipynb`, `slate-demo-explicit2.ipynb` - demonstrates
    opening a Firefly tab and sending data to it with the `FireflyClient` python API
 - `slate-widget-demo.ipnb` - simple demo of the Firefly slate widget
 - Three example demoing the images, tables, and charts widgets
     - `Image Colorbar Test.ipynb`
     - `Image Zoom and Pan Test.ipynb`
     - `Images and Tables.ipynb`
`
