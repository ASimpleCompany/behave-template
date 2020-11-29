#!/bin/bash
docker build -t app  .
docker container run app behave