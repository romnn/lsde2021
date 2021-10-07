#### LSDE 2021

#### Local spark setup
```bash
docker build -t spark .
docker run -p 9000:8888 -v $PWD:/home/jovyan/work spark
```

#### Configuring the databricks CLI
```bash
databricks configure
# Host: https://lsde-2021.cloud.databricks.com/
# Username: your username
# Password: your password
```

#### Downloading files from databricks DBFS
```bash
databricks fs cp dbfs:/mnt/group29/your/path.pdf ./dest/path

# e.g. for figures
databricks fs cp -r --overwrite dbfs:/mnt/group29/plots/ ./figs/
```

#### Check local storage usage
```bash
sudo ncdu -x / --exclude /media/
```

#### Wikipedia API
```bash
https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=ARTICLE_NAME
```
