#!/bin/bash

CONTAINER_NAME=app

docker container rm -f $(docker container list -qa)
#docker image rmi $(docker image list -qa)
#docker system prune --force --volumes

docker build -t app  .
docker container run app behave
