#!/bin/bash
docker-compose up -d

# docker build -t backend  .
# docker container run backend node server.js

# docker build -t frontend  .
# docker container run frontend cal

docker build -t app  .
docker container run app behave


docker-compose down