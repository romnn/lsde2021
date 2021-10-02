#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""The setup script."""

from setuptools import find_packages, setup
import os

try:  # for pip >= 10
    from pip._internal.req import parse_requirements
except ImportError:  # for pip <= 9.0.3
    from pip.req import parse_requirements

install_reqs = [
    str(req.requirement)
    for req in parse_requirements("requirements.txt", session="hack")
]

short_description = "No description has been added so far."

version = "0.0.1"

PROJECT_ROOT = os.path.dirname(os.path.realpath(__file__))

try:
    readme_rst = os.path.join(PROJECT_ROOT, "README.rst")
    readme_md = os.path.join(PROJECT_ROOT, "README.md")
    if os.path.isfile(readme_rst):
        with open(readme_rst) as readme_file:
            long_description = readme_file.read()
    elif os.path.isfile(readme_md):
        import m2r

        long_description = m2r.parse_from_file(readme_md)
    else:
        raise AssertionError("No readme file")
except (ImportError, AssertionError):
    long_description = short_description

setup(
    author="romnn",
    author_email="contact@romnn.com",
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Environment :: Console",
        "Operating System :: OS Independent",
        "Natural Language :: English",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    entry_points={"console_scripts": ["lsde2021=lsde2021.cli:lsde2021"]},
    python_requires=">=3.6",
    install_requires=install_reqs,
    setup_requires=install_reqs,
    tests_require=install_reqs,
    extras_require=dict(dev=install_reqs, test=install_reqs),
    license="MIT",
    description=short_description,
    long_description=long_description,
    include_package_data=True,
    package_data={"lsde2021": []},
    keywords="lsde2021",
    name="lsde2021",
    packages=find_packages(include=["lsde2021"]),
    test_suite="tests",
    url="https://github.com/romnn/lsde2021",
    version=version,
    zip_safe=False,
)
