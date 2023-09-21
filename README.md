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
  - The `SlateWidget` is a full Firefly viewer widget that provides a `FireflyClient` instance to embed a full Firefly in a notebook as a widget



## Prerequisites

* JupyterLab ^0.35.1,<4
* nodejs
* astropy ^3.0.0
* firefly_client ^2.1.1

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

```bash
# install firefly_client package required to communicate with a firefly server from python
pip install firefly_client

# install client-side component of this extension from npm and enable it
jupyter labextension install jupyter_firefly_extensions

# install server-side component of this extension from pypi and enable the server extension manually
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
git clone https://github.com/Caltech-IPAC/jupyter_firefly_extensions
cd jupyter_firefly_extensions

# client-side component
jupyter labextension install . --no-build
jupyter lab build  # required because using source extension

# server-side component
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
jupyter labextension uninstall jupyter_firefly_extensions
jupyter serverextension disable --py jupyter_firefly_extensions
pip uninstall jupyter_firefly_extensions
```


### Examples
The `examples` directory has several example notebooks to demonstrate the extension features. When using the examples you should copy the directory and contents to another place or jupyter lab will and to keep rebuilding

 - `slate-demo-explicit.ipynb`, `slate-demo-explicit2.ipynb` - demonstrates
    opening a Firefly tab and sending data to it with the `FireflyClient` python API
 - Other notebooks demonstrate capabilites of widgets which are no longer supported, so they won't work.


Besides this, you can also use this extension to display fits images. In the file browser of jupyter lab, simply clicking on a `.fits`  file will show the image in a new tab.



### Troubleshooting
If you are using a local Firefly server and facing issues with rendering images, check the console for an error message about being unable to load 'firefly-thread.worker.js'. If that's the case, you can clean your existing Firefly build using `gradle clean` and then build and deploy it in the development environment (instead of the local one, i.e., the default) by using `gradle -Penv=dev firefly:bAD`. Then, reload the Jupyter Lab browser tab (and empty the cache). You shouldn't see that console error anymore and the images should render correctly.