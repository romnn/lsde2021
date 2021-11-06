#### Local spark setup
```bash
docker build -t spark .
docker run -p 9000:8888 -v /media/roman/BIGBIGDATA/lsde2021:/home/jovyan/hdd -v /media/roman/WICKEDFAST/lsde2021:/home/jovyan/nvme -v $PWD:/home/jovyan/work spark
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

- Get the wikidata code for a title
  ```bash
  curl https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=ARTICLE_NAME
  ```

- Get the category for a title

- Get all wikis in all languages
  ```bash
  curl https://commons.wikimedia.org/w/api.php?action=sitematrix&smtype=language&format=json
  ```
