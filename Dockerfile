# blueprint for docker cron from https://stackoverflow.com/questions/37458287/how-to-run-a-cron-job-inside-a-docker-container
FROM node:14

# set timezone
ENV TZ=Europe/Vienna

# update install dependencies
RUN apt-get update \
    && apt-get install -y cron

# copy scripts
COPY scripts /scripts

# set execution rights on the scripts
RUN chmod +x /scripts/*.sh

# specify location of the log file for the cron job
ENV LOG_FILE=/var/log/cron.log

# create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install dependencies
COPY app/package*.json /usr/src/app/
RUN npm install

# copy source files
COPY app /usr/src/app

# start the start-up script
ENTRYPOINT ["/scripts/container_start_up.sh"]

# start the cron script
CMD ["cron"]


