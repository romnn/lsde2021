FROM jupyter/pyspark-notebook

USER root
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y \
  enchant libblas-dev liblapack-dev gfortran libatlas-base-dev \
  g++ build-essential

# pattern wants this but we cannot run mysql in the container
# mysql-server libmysqlclient-dev \

USER jovyan
RUN pip install pipenv 

ADD Pipfile Pipfile
ADD Pipfile.lock Pipfile.lock

RUN pipenv lock -r > requirements.txt
RUN pip install -r requirements.txt
# RUN pip install --quiet --no-cache-dir -r requirements.txt && \
#     fix-permissions "${CONDA_DIR}" && \
#     fix-permissions "/home/${NB_USER}"
