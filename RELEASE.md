# Making a jupyter_firefly_extensions release


## Commit and Tag Version

Update the version number 

_Edit:_ `package.json`

(Note: `_version.py` is auto-generated and will pick version specified in `package.json`)

Commit your changes, add git tag for this version, and push both commit and tag to your origin/remote repo.
```bash
git commit -a
git tag version-#.#.#
git push origin master
git push origin --tags
```


## Package and Upload

This JupyterLab extension is distributed as a [prebuilt extension](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#overview-of-extensions). This means that it is configured in a way to deploy the frontend and the backend simultaneously - the frontend NPM package gets built and inserted in the Python package. So there's no need to publish a Javascript package on NPM, we only need to publish Python package on PyPI.

See the documentation on [python packaging](https://packaging.python.org/distributing/#uploading-your-project-to-pypi) for detailed and up-to-date instructions. Following should be enough for our case:

### Generate the distribution

From the root directory of package, run:

```bash
pip install --upgrade build
python -m build
```

### Upload the distribution

```bash
pip install --upgrade twine
twine upload dist/*
```
