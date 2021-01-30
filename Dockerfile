# blueprint for docker cron from https://stackoverflow.com/questions/37458287/how-to-run-a-cron-job-inside-a-docker-container
FROM node:14

# set timezone
ENV TZ=Europe/Vienna

# update install dependencies
RUN apt-get update \
    && apt-get install -y cron

# copy start-up script
COPY ./container_start_up.sh /container_start_up.sh

# set execution rights on the start-up script
RUN chmod +x /container_start_up.sh

# create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install dependencies
COPY app/package*.json /usr/src/app/
RUN npm install

# copy source files
COPY app /usr/src/app

# start the start-up script
ENTRYPOINT ["/container_start_up.sh"]


