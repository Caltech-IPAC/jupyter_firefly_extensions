# Making a jupyter_firefly_extensions release

Starting v4.0.0 jupyter_firefly_extensions is distributed as a [prebuilt JupyterLab extension](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#overview-of-extensions). This means that it is configured in a way to deploy the frontend and the backend simultaneously - the frontend NPM package gets built and inserted in the Python package. So there's no need to publish a Javascript package on NPM, we only need to publish Python package on PyPI.

### Procedure
1. To push a new release you must be a maintainer in pypi ([see pypi below](#pypi))
2. Bump version in package.json - this step might be done in the PR (Note: `_version.py` is auto-generated and will pick version specified in `package.json`)
3. Clean out old distribution 
   - `rm dist/*`
4. Create the distribution
   - From the root directory of package, run:
        ```bash
        pip install --upgrade build
        python -m build
        ```
   - check it: `ls dist` should show two files a `.tar.gz` file and a `.whl` file
5. _Optional_ - At this point you could do an optional test installation ([see below](#optional-test-installation))
6. Upload to PYPI  
    ```bash
    pip install --upgrade twine
    twine upload dist/*
    ```
7. If any files were edited (i.e `package.json`):
   - `git commit -a`
   - `git push origin master`
8. Tag
   -  `git tag -a version-#.#.#`  (replace version number with the current version from `package.json`)
9. Push tags
   - `git push --tags`
10. After this you can install 
   - `pip install jupyter_firefly_extensions`
11. Make a release with github, using the tag above
   - https://github.com/Caltech-IPAC/jupyter_firefly_extensions/releases


### PYPI 

- https://pypi.org/project/jupyter_firefly_extensions/
- Currently 3 maintainers
- Testing site: https://test.pypi.org/project/jupyter_firefly_extensions/


### Optional Test installation

1. To create a test release you must be a mainainer on testpypi
2. Create the distribution (see above)
3. `twine upload --repository-url https://test.pypi.org/legacy/ dist/*`
4. `pip uninstall jupyter_firefly_extensions`
5. `pip install --verbose --index-url https://testpypi.python.org/pypi jupyter_firefly_extensions`
