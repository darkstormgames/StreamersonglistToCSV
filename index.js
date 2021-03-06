const { create } = require('domain');
const fs = require('fs');
const https = require('https');
const { utc } = require('moment');
const moment = require('moment');
const { resolve } = require('path');

/**
 * setting some default values
 */
let uri = null,
    streamer = 'miametzmusic',              // Name or numeric ID of the streamer
    latest = 10000,
    period = 'all',                         // Arguments: all | month | week | day | stream
    sortOrder = 'desc',                     // Arguments: desc | asc
    utcOffset = '+00:00',
    timeZoneId = 'UTC',
    dateFormat = 'YYYY-MM-DDTHH:mm:ssZ',    // ISO 8601 notation as default
    commaType = ';',                        // Arguments: ; | , | : | tab | " " 
    datasetDelimiter = '\r\n',              // Arguments: UNIX | WIN | WINDOWS
    createAll = false;

/**
 * check for additional arguments
 */
let args = process.argv.slice(2);
if (args.length > 0) {
    args.forEach((item) => {
        let arg = item.split('=')[0];
        let value = item.split('=')[1];

        if (/^(?:(?:[A-Z]:\\.{1,})|(?:\/.{1,})).json$|^https:\/{2}api.streamersonglist.com\/v1\/streamers\/.{1,}\/playHistory/m.test(arg)) {
            uri = arg;
        }
        if (arg == 'createAll') {
            createAll = true;
        }
        else if (value) {
            switch(arg.toLowerCase()) {
                case 'streamer':
                case 's':
                    streamer = value;
                    break;
                case 'latest':
                case 'l':
                case 'count':
                case 'c':
                    latest = value;
                    break;
                case 'period':
                case 'p':
                    period = value;
                    break;
                case 'sortorder':
                case 'order':
                case 'o':
                    sortOrder = value;
                    break;
                case 'timezone':
                case 'timezoneid':
                case 'tz':
                    timeZoneId = value;
                    break;
                case 'offset':
                case 't':
                case 'utcoffset':
                    utcOffset = value;
                    break;
                case 'timeformat':
                case 'format':
                case 'f':
                    dateFormat = value;
                    break;
                case 'commatype':
                case 'comma':
                    if (value == ',' || value == ';' || value == ':' || value.toLowerCase() == 'tab' || value == ' ') {
                        commaType = value;
                    }
                    break;
                case 'linebreak':
                case 'datasetdelimiter':
                case 'line':
                    if (value.toUpperCase() == 'UNIX') {
                        datasetDelimiter = '\n';
                    }
                    else if (value.toUpperCase() == 'WIN' || value.toUpperCase() == 'WINDOWS') {
                        datasetDelimiter = '\r\n';
                    }
                    break;
                default:
                    break;
            }
        }
    });
}

if (!uri) {
    uri = 'https://api.streamersonglist.com/v1/streamers/' + streamer + '/playHistory?size=' + latest + '&period=' + period + '&order=' + sortOrder;
}

getData(uri)
.then((data) => {
    if (data == null) {
        console.log('No valid URI given!');
    }
    else {
        console.log(data.total + ' total song requests');

        let dateUntil = moment.utc(data.items[0].createdAt, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).utcOffset(utcOffset).format('YYYYMMDD');
        
        if (createAll == false) {
            let commaString = 'semicolon';
            switch(commaType) {
                case ',':
                    commaString = 'comma';
                    break;
                case '\t':
                    commaString = 'tab';
                    break;
                case ':':
                    commaString = 'colon';
                    break;
                case ' ':
                    commaString = 'space';
                    break;
                default:
                    break;
            }
            makeFile(data, streamer + '_' + dateUntil + '_' + (datasetDelimiter == '\r\n' ? 'WIN' : 'UNIX') + '_' + commaString + '_' + sortOrder + '.csv');
        }
        else {
            datasetDelimiter = '\r\n';
            commaType = ';';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_WIN_semicolon_' + sortOrder + '.csv');
            commaType = ',';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_WIN_comma_' + sortOrder + '.csv');
            commaType = '\t';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_WIN_tab_' + sortOrder + '.csv');
            commaType = ':';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_WIN_colon_' + sortOrder + '.csv');
            commaType = ' ';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_WIN_space_' + sortOrder + '.csv');
            datasetDelimiter = '\n';
            commaType = ';';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_UNIX_semicolon_' + sortOrder + '.csv');
            commaType = ',';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_UNIX_comma_' + sortOrder + '.csv');
            commaType = '\t';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_UNIX_tab_' + sortOrder + '.csv');
            commaType = ':';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_UNIX_colon_' + sortOrder + '.csv');
            commaType = ' ';
            makeFile(data, streamer + '_' + dateUntil + (timeZoneId != '' ? '_' + timeZoneId : '') + '_UNIX_space_' + sortOrder + '.csv');
        }

        console.log('Finished writing csv.');
    }
});

function makeFile(data, fileName) {
    let out =   'requestId' + commaType + 
                'songTitle' + commaType + 
                'songArtist' + commaType + 
                'isNonlist' + commaType + 
                'amount' + commaType + 
                'requesterId' + commaType + 
                'requesterName' + commaType + 
                'requestSource' + commaType + 
                'note' + commaType + 
                'createdAt' + commaType + 
                'playedAt' + datasetDelimiter;

    data.items.forEach((item) => {
        out += item.id + commaType;

        if (item.nonlistSong != null) {
            out += getCleanCSVString(item.nonlistSong) + commaType + commaType + '1' + commaType;
        }
        else {
            out += getCleanCSVString(item.song.title) + commaType + getCleanCSVString(item.song.artist) + commaType + '0' + commaType;
        }

        out += item.donationAmount + commaType;
        
        if (!item.requests[0]) {
            out += commaType + commaType + commaType;
        }
        else {
            out += item.requests[0].id + commaType + getCleanCSVString(item.requests[0].name) + commaType + getCleanCSVString(item.requests[0].source) + commaType;
        }
        
        if (!item.note) {
            out += commaType;
        }
        else {
            out += getCleanCSVString(item.note) + commaType;
        }
        
        out += getCleanCSVString(getTimeString(item.createdAt)) + commaType;
        out += getCleanCSVString(getTimeString(item.playedAt)) + datasetDelimiter;
    });
        
    if (!fs.existsSync('.\\out')) {
        fs.mkdirSync('.\\out');
    }
        
    fs.writeFileSync('.\\out\\' + fileName, out);
}

function getTimeString(value) {
    if (utcOffset == '') {
        return moment.utc(value, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).format(dateFormat);
    }
    else {
        return moment.utc(value, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).utcOffset(utcOffset).format(dateFormat);
    }
}

function getCleanCSVString(value) {
    if (value.includes(commaType)) {
        return '"' + (value.includes('"') ? value.replace(/"/g, '""') : value) + '"';
    }
    else {
        return (value.includes('"') ? value.replace(/"/g, '""') : value);
    }
}

function getData(uri) {
    return new Promise((resolve) => {
        if (uri.startsWith('https://api.streamersonglist.com/v1/')) {
            https.get(uri, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve(JSON.parse(data));
                })
            })
            .on('error', (err) => {
                console.log('Error fetching data!\n' + err.message);
                resolve(null);
            });
        }
        else if (/^(?:(?:[A-Z]:\\.{1,})|(?:\/.{1,})).json$/m.test(uri)) {
            /** Read the .json-file */
            resolve(JSON.parse(fs.readFileSync(uri)));
        }
        else {
            resolve(null);
        }
    });
}
