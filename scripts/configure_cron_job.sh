#!/usr/bin/env bash

echo "Configuring cron job..."

# ensure the log file exists
touch "$LOG_FILE"

# check if CRON_STRING is set
if [ -z "$CRON_STRING" ]
then
      # if it's not set - default to every monday at 05:00 am
      CRON_STRING=0 5 * * 1
fi

# add a cronjob in a new crontab
echo "$CRON_STRING echo 'Exporting metadata...' && /usr/local/bin/node /usr/src/app/index.js >> $LOG_FILE 2>&1" > /etc/crontab

# register the new crontab
crontab /etc/crontab

# start cron service
/usr/sbin/service cron start

# display logs - useful to see it in docker logs
tail -f "$LOG_FILE"
