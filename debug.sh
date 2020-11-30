#!/bin/bash
docker-compose up -d

docker build -t app  .
docker container run app behave

docker-compose down
#docker-compose rm -fsv #https://docs.docker.com/compose/reference/rm/
#docker container rm -f $(docker container list -qa)
#docker image rmi $(docker image list -qa)