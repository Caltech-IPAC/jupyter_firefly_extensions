# jupyter_firefly_extensions

A Jupyter Lab mime extension for rendering FITS.

This is in the development phase `jupyter_firefly_extensions` in npm but
it is not pip installable yet.

_Note_ - the readme is currently being written and is very incomplete


## Prerequisites

* JupyterLab ^0.28.0




### Before running

Add the following line to your `~/jupyter/jupyter_notebook_config.py`

```python
c.Firefly.url = 'http://localhost:8080/firefly'
```

_Or_ add the following line to your `~/jupyter/jupyter_notebook_config.json` under the root object.

```json
"Firefly": {
  "url": "http://localhost:8080/firefly"
}
```

Where the url points to a firefly server.



### Install for testing

```bash
jupyter labextension install firefly_extensions
jupyter lab build
# pip here ?????
#pip install firefly_extensions
jupyter serverextension enable --py firefly_extensions
```

### Install for development

```bash
git clone https://github.com/Caltech-IPAC/jupyter_firefly_extensions
cd firefly_extensions
yarn
jupyter labextension install . --no-build
jupyter lab build
# pip here ?????
jupyter serverextension enable --py firefly_extensions
```



### Helpful commands

 - to see a list of server extensions `jupyter serverextension list`
 - to see a list of lab extensions `jupyter labextension list`
 - to run jupyter lab: `jupyter lab`
 - to rebuild after modifying the javascript: `jupyter lab build`


### To remove extensions:
```bash
jupyter labextension uninstall firefly_extensions
jupyter serverextension disable --py firefly_extensions
```
