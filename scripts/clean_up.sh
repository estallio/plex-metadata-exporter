#!/usr/bin/env bash

echo "Cleaning up..."

find $PLEX_ROOT_FOLDER -name "*-$FILE_ENDING_PATTERN.json" -type f -delete
find $PLEX_ROOT_FOLDER -name "*-$FILE_ENDING_PATTERN.xml" -type f -delete
find $PLEX_ROOT_FOLDER -name "*-$FILE_ENDING_PATTERN-art.jpg" -type f -delete
find $PLEX_ROOT_FOLDER -name "*-$FILE_ENDING_PATTERN-thumb.jpg" -type f -delete
