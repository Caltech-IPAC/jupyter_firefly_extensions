# Making a jupyter_firefly_extensions release

Starting v4.0.0 jupyter_firefly_extensions is distributed as a [prebuilt JupyterLab extension](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#overview-of-extensions). This means that it is configured in a way to deploy the frontend and the backend simultaneously - the frontend NPM package gets built and inserted in the Python package. So there's no need to publish a Javascript package on NPM, we only need to publish Python package on PyPI.

### Procedure
1. To push a new release you must be a maintainer in pypi ([see pypi below](#pypi))
2. Bump version in package.json - this step might be done in the PR (Note: `_version.py` is auto-generated and will pick version specified in `package.json`)
3. Clean out old distribution and build files:
   ```bash
   rm -rf dist/*
   jlpm clean:all
   ```
4. Make a production build of the extension:
   ```bash
   jlpm build:prod
   ```
5. Commit any changes (e.g. version bump in `package.json`):
   - `git commit -a`
6. Tag the release commit:
   -  `git tag -a version-#.#.#`  (replace version number with the current version from `package.json`)
7. Push commit and tags:
   - `git push origin master --tags`
8. Build the python distribution (including the prebuilt extension) and validate:
   - From the root directory of package, run:
        ```bash
        pip install --upgrade build
        python -m build
        ```
   - Check the distribution: `ls dist` should show two files a `.tar.gz` file and a `.whl` file
   - Optionally, verify that the wheel embeds the correct labextension version:
      ```bash
      python - <<'PY'
      import glob, zipfile, json
      whl = sorted(glob.glob("dist/*.whl"))[-1]
      with zipfile.ZipFile(whl) as z:
         p = [n for n in z.namelist()
               if n.endswith("share/jupyter/labextensions/jupyter_firefly_extensions/package.json")][0]
         print("wheel:", whl)
         print("embedded labextension version:", json.loads(z.read(p))["version"])
      PY
      ```
9. _Optional_ - At this point you could do an optional test installation ([see below](#optional-test-installation))
10. Upload to PYPI
   1. _One-time-only auth setup:_ Login to pypi and then in your account settings, go to the API tokens section and select "Add API token". Give it any name and select scope to project:jupyter-firefly-extensions and create token. To save this token for later uses, make sure to create a `$HOME/.pypirc` file (or update it if you already have it) with the following:
      ```ini
      [distutils]
      index-servers =
         jupyter-firefly-extensions

      [jupyter-firefly-extensions]
      repository = https://upload.pypi.org/legacy/
      username = __token__
      password = pypi-token-you-created
      ```

   2. Upload dist to pypi using twine (with the auth setup in previous step)
      ```bash
      pip install --upgrade twine
      twine upload dist/* --repository jupyter-firefly-extensions
      ```
11. After this you can install 
   - `pip install jupyter-firefly-extensions`
12. Make a release with github, using the tag above
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
