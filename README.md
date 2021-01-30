# Plex Metadata Exporter

### What does it?
Saves json and xml metadata as well as cover and art of movies and shows alongside the files in the plex library.

### Why is this necessary?
If you've changed many titles, covers and descriptions in your library you want to back up these data alongside the files so that the changes are not only saved in the Plex database. The current solutions [ExportTools.bundle](https://github.com/ukdtom/ExportTools.bundle) and [Lambda.bundle](https://github.com/ZeroQI/Lambda.bundle) didn't fit my needs when i wanted to archive my whole library.

### How to use

Clone this repo and navigate in the cloned folder, then run:

```
cd app
npm install
npm run start
```

Alternatively, you can also use the Docker image, which saves the whole library at a regular basis - once a week on monday at 05:00 am by default. The basic usage can be seen in the sample docker-compose file.

### Configuration

For running the app manually, just rename or copy the `.env.example` file to `.env` and edit the following configs:

```
# IP or domain and port of the plex server, it is also possible to use the Plex-domain
PLEX_ADDRESS=https://IP:PORT

Example 1: PLEX_ADDRESS=https://192.168.0.2:32400
Example 2: PLEX_ADDRESS=https://192-168-0-2.asfj3940580sdfjkl489sfd345mlf.plex.direct:32400
this url resolves also to your local IP and is also as safe as the plex software or DigiCert is.
See here for more info on how they do this: https://blog.filippo.io/how-plex-is-doing-https-for-all-its-users/
There could be 2 issues I can think of:
1. Plex is resolving to a different IP - you would recognize that case, however, as you run the Plex software, there is some trust in Plex anyways
2. Someone in the network sniffing the DNS requests knows that you run a "private" Plex server on the mentioned IP address in the local network or on a public instance:
    2.1. Someone starts an attack if it's a public IP - that could happen in any case, but when using the DNS, there is a exclusive offering for an attacker to know the software (Plex) and maybe the port
    2.2. Someone knows for sure you run a Plex server in your local area network and can track you back in your home, even it is not illegal to run your Plex server, these could be however relevant infos

# a Plex authentication token, look here how to get one: https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token
X_PLEX_TOKEN=sOmEpL3XT0k3n1234

# it is possible that the root path of the plex server
# is different from the root path running this script
# possible scenarios are running this script in relation
# to a remote server or a docker-container
PLEX_ROOT_FOLDER=/absolute/path/to/the/media

# will be appended to the media-filename before the extension
# e.g. mkvOrMP4FileName-meta_data_naming_scheme.json
# this is especially useful when you want to remove all the meta data at a later point - see below
FILE_ENDING_PATTERN=meta_data_naming_scheme
```

### Clean up

To remove all generated files, you can utilize the `find` command:

```
find . -name '*-FILE_ENDING_PATTERN.json' -type f -delete
find . -name '*-FILE_ENDING_PATTERN.xml' -type f -delete
find . -name '*-FILE_ENDING_PATTERN-art.jpg' -type f -delete
find . -name '*-FILE_ENDING_PATTERN-thumb.jpg' -type f -delete
```

With the FILE_ENDING_PATTERN from the .example.env file:

```
find . -name '*-meta_data_naming_scheme.json' -type f -delete
find . -name '*-meta_data_naming_scheme.xml' -type f -delete
find . -name '*-meta_data_naming_scheme-art.jpg' -type f -delete
find . -name '*-meta_data_naming_scheme-thumb.jpg' -type f -delete
```
