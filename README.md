# jupyter_firefly_extensions

JupyterLab extensions for rendering FITS and displaying tables, images, & charts with Firefly.


## Overview

These extensions add the following features to JupyterLab:

  - Open a FITS file from the file browser and see it in a tab.
  - Start the full Firefly viewer in a tab (either through launcher or command palette).
  - Use `FireflyClient` in notebook to start Firefly in a tab and send data
  (tables, images, charts) to it using the `FireflyClient` python API.


## Prerequisites

* JupyterLab ^4.0.0 - where these extensions will run. Check past releases if you are using JupyterLab<4.

* firefly_client ^2.1.1 - can be installed with `pip install firefly_client`.

* Firefly server - you can run it locally via a Firefly Docker image obtained from https://hub.docker.com/r/ipac/firefly.

* astropy ^3.0.0 - (optional) used for convenience in example notebooks.

* nodejs ^18.0.0 - only needed if you're doing [development install](#development-install)

If you have conda installed and are setting up a fresh environment, you can use:
```bash
conda create -n jl-ff-ext -c conda-forge python jupyterlab firefly-client astropy
conda activate jl-ff-ext
```


### _Very Important_: first setup the Firefly URL - 3 ways

You must provide **URL to a Firefly server** before running jupyter_firefly_extensions using ANY of the following ways:

 * Add the following line to your `~/.jupyter/jupyter_config.py`

   ```python
   c.Firefly.url = 'http://localhost:8080/firefly'
   ```

_Or_

 * Add the following line to your `~/.jupyter/jupyter_config.json` under the root object.

   ```json
   "Firefly": {
     "url": "http://localhost:8080/firefly"
   }
   ```

_Or_

 * Use the environment variable in the shell where you start jupyter lab

    in bash:
      ```
      export FIREFLY_URL=http://localhost:8080/firefly
      ```
    
    in tcsh:
      ```
      setenv FIREFLY_URL http://localhost:8080/firefly
      ```

_Note:_ If your configuration is set in more than one way as described above, precedence order is:
environment variable > jupyter_config.json > jupyter_config.py


## Installation

In your environment with the prerequisites met,

```bash
pip install jupyter-firefly-extensions
```

Open JupyterLab (with `jupyter lab`) to start using these extensions - see [examples](#examples) to learn how.


### Development install

_First:_

If developing `firefly_client`, be sure to clone the `firefly_client` repository
(https://github.com/Caltech-IPAC/firefly_client)
and then do `pip install -e .` from inside its directory.

Make sure you have nodejs >=18.0.0 installed on your system or virtual environment. It's required for building TS/JS source. In conda environment, you can install it using `conda install nodejs`

_Then:_
```bash
git clone https://github.com/Caltech-IPAC/jupyter_firefly_extensions
cd jupyter_firefly_extensions

# Install package in development mode (changes in python source will reflect automatically)
pip install -e .

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Enable the server extension
jupyter server extension enable jupyter_firefly_extensions

# Build extension TS/JS source
jlpm run build

# Alternatively, watch TS/JS source so that changes in it reflect automatically on lab
jlpm watch
```


### Helpful commands

 - `jupyter server extension list` - show a list of server extensions
 - `jupyter lab extension list` - show a list of lab extensions
 - `jupyter lab` - run jupyter lab
 - `jlpm <any yarn command>` - JupyterLab-provided, locked version of the yarn


### To remove extension:
```bash
pip uninstall jupyter_firefly_extensions
```


## Examples
The `examples` directory has several example notebooks to demonstrate the extension features. When using the examples you should copy the directory and contents to another place or jupyter lab will and to keep rebuilding

 - `slate-demo-explicit.ipynb`, `slate-demo-explicit2.ipynb` - demonstrates
    opening a Firefly tab and sending data to it with the `FireflyClient` python API
 - Other notebooks demonstrate capabilites of widgets which are no longer supported, so they won't work.


Besides this, you can also use this extension to display fits images. In the file browser of jupyter lab, simply clicking on a `.fits`  file will show the image in a new tab.



## Troubleshooting
If you are using a local Firefly server and facing issues with rendering images, check the console for an error message about being unable to load 'firefly-thread.worker.js'. If that's the case, you can clean your existing Firefly build using `gradle clean` and then build and deploy it in the development environment (instead of the local one, i.e., the default) by using `gradle -Penv=dev firefly:bAD`. Then, reload the Jupyter Lab browser tab (and empty the cache). You shouldn't see that console error anymore and the images should render correctly.
