#### LSDE 2021

#### Local spark setup
```bash
docker build -t spark .
docker run -p 9000:8888 -v $PWD:/home/jovyan/work spark
```
