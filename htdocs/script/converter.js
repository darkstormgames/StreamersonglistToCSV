function createCSV() {
    let streamer = document.getElementById('streamer').value;
    let latest = document.getElementById('count').value;
    let period = document.getElementById('period').value;
    let sortOrder = document.getElementById('sortOrder').value;
    
    let uri = 'https://api.streamersonglist.com/v1/streamers/' + streamer + '/playHistory?size=' + latest + '&period=' + period + '&order=' + sortOrder;

    getData(uri)
    .then((data) => {
        let outString = getCSVString(data);

        let outBox = document.getElementById("output");
        outBox.innerHTML = outString;
    });
}

function downloadCSV() {
    let outBox = document.getElementById("output");
    if (!outBox.innerHTML || outBox.innerHTML == '') return;
    
    let streamer = document.getElementById('streamer').value;
    let sortOrder = document.getElementById('sortOrder').value;
    let commaValue = document.getElementById('commaType').value;
    let commaType = ';'
    if (commaValue == ',' || commaValue == ';' || commaValue == ':' || commaValue == ' ') {
        commaType = commaValue;
    }
    else if (value.toLowerCase() == 'tab') {
        commaType = '\t';
    }
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
    let lineValue = document.getElementById('datasetDelimiter').value;

    download(streamer + '_' + lineValue + '_' + commaString + '_' + sortOrder + '.csv', outBox.innerHTML);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

function getCSVString(data) {
    let commaValue = document.getElementById('commaType').value;
    let commaType = ';'
    if (commaValue == ',' || commaValue == ';' || commaValue == ':' || commaValue == ' ') {
        commaType = commaValue;
    }
    else if (value.toLowerCase() == 'tab') {
        commaType = '\t';
    }
    let lineValue = document.getElementById('datasetDelimiter').value;
    let datasetDelimiter = '\r\n';
    if (lineValue.toUpperCase() == 'UNIX') {
        datasetDelimiter = '\n';
    }
    else if (lineValue.toUpperCase() == 'WIN' || lineValue.toUpperCase() == 'WINDOWS') {
        datasetDelimiter = '\r\n';
    }

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
            out += getCleanCSVString(item.nonlistSong, commaType) + commaType + commaType + '1' + commaType;
        }
        else {
            out += getCleanCSVString(item.song.title, commaType) + commaType + getCleanCSVString(item.song.artist, commaType) + commaType + '0' + commaType;
        }

        out += item.donationAmount + commaType;
        
        if (!item.requests[0]) {
            out += commaType + commaType + commaType;
        }
        else {
            out += item.requests[0].id + commaType + getCleanCSVString(item.requests[0].name, commaType) + commaType + getCleanCSVString(item.requests[0].source, commaType) + commaType;
        }
        
        if (!item.note) {
            out += commaType;
        }
        else {
            out += getCleanCSVString(item.note, commaType) + commaType;
        }
        
        out += getCleanCSVString(getTimeString(item.createdAt), commaType) + commaType;
        out += getCleanCSVString(getTimeString(item.playedAt), commaType) + datasetDelimiter;
    });

    return out;
}

function getTimeString(value) {
    let utcOffset = document.getElementById('utcOffset').value;
    let dateFormat = document.getElementById('dateFormat').value;

    if (utcOffset == '') {
        return moment.utc(value, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).format(dateFormat);
    }
    else {
        return moment.utc(value, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).utcOffset(utcOffset).format(dateFormat);
    }
}

function getCleanCSVString(value, commaType) {
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
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => { 
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    resolve(JSON.parse(xmlHttp.responseText));
                }
            }
            xmlHttp.open("GET", uri, true); // true for asynchronous 
            xmlHttp.send(null);
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