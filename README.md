#### LSDE 2021

#### Local spark setup
```bash
docker build -t spark .
docker run -p 9000:8888 -v /media/roman/BIGBIGDATA/lsde2021:/home/jovyan/hdd -v /media/roman/WICKEDFAST/lsde2021:/home/jovyan/nvme -v $PWD:/home/jovyan/work spark
```

#### Setup ORES
```bash
PIPENV_PIPFILE=./Pipfile.ores pipenv install --dev
PIPENV_PIPFILE=./Pipfile.ores pipenv shell
```

#### Monitor disk usage
```bash
watch iostat nvme0n1 sdc
```

#### Configuring the databricks CLI
```bash
databricks configure
# Host: https://lsde-2021.cloud.databricks.com/
# Username: your username
# Password: your password
```

#### Start mySQL docker server
```bash
sudo apt-get install mysql-client
docker run -p 3306:3306 -e MYSQL_USER=root -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=rootdb mysql:8
mysql -uroot -psecret -h172.17.0.1 -P3306 -Drootdb < /media/roman/WICKEDFAST/lsde2021/enwiki-20211001-langlinks.sql
```

#### Downloading files from databricks DBFS
```bash
databricks fs cp dbfs:/mnt/group29/your/path.pdf ./dest/path

# e.g. for figures
databricks fs cp -r --overwrite dbfs:/mnt/group29/plots/ ./figs/
```

#### 

#### Check local storage usage
```bash
sudo ncdu -x / --exclude /media/
```

#### Wikipedia API

- Get the wikidata code for a title
  ```bash
  curl https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=ARTICLE_NAME
  ```

- Get the category for a title

- Get all wikis in all languages
  ```bash
  curl https://commons.wikimedia.org/w/api.php?action=sitematrix&smtype=language&format=json
  ```
