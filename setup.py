#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Trey Roby.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function

# the name of the project
name = 'jupyter_firefly_extensions'

#-----------------------------------------------------------------------------
# Minimal Python version sanity check
#-----------------------------------------------------------------------------

import sys

v = sys.version_info
if v[:2] < (3, 5):
    # Note: 3.3 is untested, but we'll still allow it
    error = "ERROR: %s requires Python version 3.5 or above." % name
    print(error, file=sys.stderr)
    sys.exit(1)

#-----------------------------------------------------------------------------
# get on with it
#-----------------------------------------------------------------------------

import io
import os
from os.path import join as pjoin
from glob import glob

from setuptools import setup, find_packages

from setupbase import expand_data_files

here = os.path.abspath(os.path.dirname(__file__))
nbextension = pjoin(here, name, 'nbextension')
labextension = pjoin(here, name, 'labextension')



version_ns = {}
with io.open(pjoin(here, name, '_version.py'), encoding="utf8") as f:
    exec(f.read(), {}, version_ns)


package_data = {
    name: [
        'nbextension/*.*js*',
        'labextension/*.tgz'
    ]
}

data_files = expand_data_files([
    ('share/jupyter/nbextensions/jupyter_firefly_extensions', [pjoin(nbextension, '*.js*')]),
    ('share/jupyter/lab/extensions', [pjoin(labextension, '*.tgz')])
])


setup_args = dict(
    name            = name,
    version         = version_ns['__version__'],
    scripts         = glob(pjoin('scripts', '*')),
    # cmdclass        = cmdclass,
    packages        = find_packages(here),
    package_data    = package_data,
    include_package_data = True,
    data_files      = data_files,
    author               = 'Trey Roby',
    author_email         = 'roby@ipac.caltech.edu',
    url                  = 'https://github.com/Caltech-IPAC/firefly',
    license              = 'BSD',
    platforms            = "Linux, Mac OS X, Windows",
    keywords             = ['jupyter', 'firefly', 'caltech', 'ipac', 'astronomy', 'visualization'],
    classifiers          = [
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8'
    ],
    install_requires     = [
        'notebook>=5.0.0',
        'jupyterlab>=0.35',
        'ipywidgets>=7.0.0',
        'firefly_client>=2.1.1'
    ]
)

if __name__ == '__main__':
    setup(**setup_args)
