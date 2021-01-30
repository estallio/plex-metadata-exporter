#!/usr/bin/env bash

# relay env-variables, so apps executed with cron can also access these
printenv > /etc/environment

echo "Starting up container..."

if [ -z "$FILE_ENDING_PATTERN" ]
then
      echo "FILE_ENDING_PATTERN can not be empty"
      exit 1
fi

case $1 in

  cron)
    exec /scripts/configure_cron_job.sh
  ;;

  once)
    exec /scripts/run_once.sh
  ;;

  cleanup)
    exec /scripts/clean_up.sh
  ;;

  *)
    # starting the next command - in this case a following command from CMD or command
    exec "$@"
  ;;

esac

exit 0
