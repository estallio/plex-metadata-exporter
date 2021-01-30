require('dotenv').config();

const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');

const plexAddress = process.env.PLEX_ADDRESS;
const xPlexToken = process.env.X_PLEX_TOKEN;
const plexRootFolder = process.env.PLEX_ROOT_FOLDER.replace(/\/$/, ''); // remove trailing slash
const fileEndingPattern = process.env.FILE_ENDING_PATTERN;

const jsonOptions = {
    responseType: 'json'
};

const xmlOptions = {
    headers: {
        'Accept': 'application/xml'
    }
};

const imageOptions = {
    responseType: 'stream'
};

const createFetchAllSectionsUrl = () => `${plexAddress}/library/sections/all?X-Plex-Token=${xPlexToken}`;
const createFetchSectionUrl = (section) => `${plexAddress}/library/sections/${section}/all?X-Plex-Token=${xPlexToken}`;
const createFetchMetaDataUrl = (ratingKey) => `${plexAddress}/library/metadata/${ratingKey}?X-Plex-Token=${xPlexToken}`;
const createFetchChildrenMetaDataUrl = (ratingKey) => `${plexAddress}/library/metadata/${ratingKey}/children?X-Plex-Token=${xPlexToken}`;
const createFetchImageUrl = (imagePath) => `${plexAddress}${imagePath}?X-Plex-Token=${xPlexToken}`;

(async () => {
    console.log('-- Starting export at ' + new Date().toISOString());

    // fetch all library sections
    const librarySections = await fetchLibrarySections();

    let sectionCount = 0;

    // start export for every library
    for (const libraryDirectory of librarySections.MediaContainer.Directory) {
        console.log("-------- Exporting section " + ++sectionCount + " of " + librarySections.MediaContainer.Directory.length + " - " + (Math.floor((sectionCount - 1) / librarySections.MediaContainer.Directory.length * 10000) / 100) + "% of the sections exported");

        const librarySection = await fetchLibrarySection(libraryDirectory);
        const metaData = librarySection.MediaContainer.Metadata;

        let itemCount = 0;

        // export every item of a section
        for (const sectionItem of metaData) {
            console.log("-------------- Exporting item " + ++itemCount + " of " + metaData.length + " - " + (Math.floor((itemCount - 1) / metaData.length * 10000) / 100) + "% of this section exported");
            await fetchSectionItem(sectionItem.ratingKey);
        }
    }
}) ();

// fetches and writes libraries
async function fetchLibrarySections() {
    console.log('---- Fetching data of all libraries');

    const json = (await axios.get(createFetchAllSectionsUrl(), jsonOptions)).data;
    const xml = (await axios.get(createFetchAllSectionsUrl(), xmlOptions)).data;

    const mediaContainer = json.MediaContainer;

    console.log('------ Library title: ' + mediaContainer.title1);
    console.log('------ Library count: ' + mediaContainer.size);
    console.log('------ Logs: ');

    // write response to root-folder
    await fs.writeFile(plexRootFolder + "/" + mediaContainer.title1 + "-plex-library-" + fileEndingPattern + ".json", JSON.stringify(json));
    await fs.writeFile(plexRootFolder + "/" + mediaContainer.title1 + "-plex-library-" + fileEndingPattern + ".xml", JSON.stringify(xml));

    return json;
}

// fetches and writes sections
async function fetchLibrarySection(libraryDirectory) {
    console.log('---------- Fetching data of the first library with librarySection: ' + libraryDirectory.key);

    const json = (await axios.get(createFetchSectionUrl(libraryDirectory.key), jsonOptions)).data;
    const xml = (await axios.get(createFetchSectionUrl(libraryDirectory.key), xmlOptions)).data;

    const mediaContainer = json.MediaContainer;

    console.log('------------ Section title: ' + mediaContainer.title1);
    console.log('------------ Section size: ' + mediaContainer.size);
    console.log('------------ Logs:');

    for (const location of libraryDirectory.Location) {
        await fs.writeFile(plexRootFolder + location.path + "/" + mediaContainer.title1 + "-plex-section-" + fileEndingPattern + ".json", JSON.stringify(json));
        await fs.writeFile(plexRootFolder + location.path + "/" + mediaContainer.title1 + "-plex-section-" + fileEndingPattern + ".xml", JSON.stringify(xml));
    }

    return json;
}

// fetches and decides item type
async function fetchSectionItem(ratingKey) {
    console.log('---------------- Fetching item with ratingKey: ' + ratingKey);

    const json = (await axios.get(createFetchMetaDataUrl(ratingKey), jsonOptions)).data;
    const xml = (await axios.get(createFetchMetaDataUrl(ratingKey), xmlOptions)).data;

    for (const item of json.MediaContainer.Metadata) {
        console.log('------------------ Item title: ' + item.title);
        console.log('------------------ Item type: ' + item.type);
        console.log('------------------ Item ratingKey: ' + item.ratingKey);
        console.log('------------------ Logs: ');

        if (item.type === 'movie') {
            await fetchItem(item, json, xml, 'movie');
        } else if (item.type === 'show') {
            await fetchShow(item, json, xml);
        } else {
            console.log('------------------ **** Unrecognized item type: ' + item.type);
        }
    }
}

// writes a Plex item and fetches covers
async function fetchItem(item, json, xml, itemType) {
    for (const media of item.Media) {
        for (const part of media.Part) {
            const filePathWithoutExtension = plexRootFolder + part.file.replace(/\.[^/.]+$/, ""); // removes file-extension
            const filePath = filePathWithoutExtension + "-plex-" + itemType + "-item-" + fileEndingPattern;

            await fs.writeFile(filePath + ".json", JSON.stringify(json));
            await fs.writeFile(filePath + ".xml", JSON.stringify(xml));

            const thumbResponse = (await axios.get(createFetchImageUrl(item.thumb), imageOptions)).data;
            thumbResponse.pipe(fsSync.createWriteStream(filePath + "-thumb.jpg"));

            const artResponse = (await axios.get(createFetchImageUrl(item.art), imageOptions)).data;
            artResponse.pipe(fsSync.createWriteStream(filePath + "-art.jpg"));
        }
    }
}

// writes show data and fetches covers
async function fetchShow(item, json, xml) {
    for (const location of item.Location) {
        const filePath = plexRootFolder + location.path + "/" + item.title + "-plex-show-item-" + fileEndingPattern;

        await fs.writeFile(filePath + ".json", JSON.stringify(json));
        await fs.writeFile(filePath + ".xml", JSON.stringify(xml));

        const thumbResponse = (await axios.get(createFetchImageUrl(item.thumb), imageOptions)).data;
        thumbResponse.pipe(fsSync.createWriteStream(filePath + "-thumb.jpg"));

        const artResponse = (await axios.get(createFetchImageUrl(item.art), imageOptions)).data;
        artResponse.pipe(fsSync.createWriteStream(filePath + "-art.jpg"));
    }

    // try to fetch children for show - maybe unnecessary because empty shows will be removed from Plex
    try {
        console.log('------------------ Fetching children for show: ' + item.title);
        const childrenJson = (await axios.get(createFetchChildrenMetaDataUrl(item.ratingKey), jsonOptions)).data;

        for (const season of childrenJson.MediaContainer.Metadata) {
            await fetchSeason(season.ratingKey);
        }
    } catch (error) {
        // if children are not available, a 400 is returned by Plex
        if (error && error.response && error.response.status === 400) {
            console.log('**** Show does not have children: ' + item.title);
        } else {
            throw error;
        }
    }
}

// writes season data and fetches covers
async function fetchSeason(ratingKey) {
    const json = (await axios.get(createFetchMetaDataUrl(ratingKey), jsonOptions)).data;
    const xml = (await axios.get(createFetchMetaDataUrl(ratingKey), xmlOptions)).data;

    for (const item of json.MediaContainer.Metadata) {
        // try to fetch children for season - maybe unnecessary because empty seasons will be removed from Plex
        try {
            console.log('------------------ Fetching children for season: ' + item.title);

            const children = (await axios.get(createFetchChildrenMetaDataUrl(item.ratingKey), jsonOptions)).data;

            let lastEpisodeParentFolderLocation = null;

            // TODO: currently, the folder structure is show -> season -> episode-file, but maybe a more elegant way would be
            //  to rename the whole library and build a structure like show -> season -> episode -> episode-file
            // at the moment, the season-cover and info is saved in the same folder as the first part of the last child-episode is located
            for (const episode of children.MediaContainer.Metadata) {
                const lastEpisodeLocation = await fetchEpisode(episode.ratingKey);

                lastEpisodeParentFolderLocation = plexRootFolder + lastEpisodeLocation.match(/^(.+)\/([^\/]+)$/)[1]; // remove the whole filename and the slash before
            }

            if (lastEpisodeParentFolderLocation !== null) {
                const filePath = lastEpisodeParentFolderLocation + "/" +
                  item.title + "-plex-season-item-" + fileEndingPattern;

                await fs.writeFile(filePath + ".json", JSON.stringify(json));
                await fs.writeFile(filePath + ".xml", JSON.stringify(xml));

                const thumbResponse = (await axios.get(
                  createFetchImageUrl(item.thumb), imageOptions)).data;
                thumbResponse.pipe(
                  fsSync.createWriteStream(filePath + "-thumb.jpg"));

                const artResponse = (await axios.get(
                  createFetchImageUrl(item.art), imageOptions)).data;
                artResponse.pipe(
                  fsSync.createWriteStream(filePath + "-art.jpg"));
            }
        } catch (error) {
            // if children are not available, a 400 is returned by Plex
            if (error && error.response && error.response.status === 400) {
                console.log('**** Season does not have children: ' + seasonItem.title);
            } else {
                throw error;
            }
        }
    }
}

// writes episode data and fetches covers
async function fetchEpisode(ratingKey) {
    const json = (await axios.get(createFetchMetaDataUrl(ratingKey), jsonOptions)).data;
    const xml = (await axios.get(createFetchMetaDataUrl(ratingKey), xmlOptions)).data;

    const metaData = json.MediaContainer.Metadata;

    for (const item of metaData) {
        console.log('------------------------ Item title: ' + item.title);
        console.log('------------------------ Item type: ' + item.type);
        console.log('------------------------ Item ratingKey: ' + item.ratingKey);
        console.log('------------------------ Logs: ');

        await fetchItem(item, json, xml, 'episode');
    }

    return metaData[metaData.length - 1].Media[0].Part[0].file;
}
