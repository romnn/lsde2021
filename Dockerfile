FROM jupyter/pyspark-notebook

ADD Pipfile Pipfile
ADD Pipfile.lock Pipfile.lock

RUN pip install pipenv
RUN pipenv lock -r > requirements.txt
RUN pip install -r requirements.txt
