const express = require('express')
const axios = require('axios')
const os = require('os')

const app = express()
const port = process.env.PORT || 3000;

// const apiKey = "AIzaSyCqfHWVhzEkGcNpLg4uOryZ4i6r8xYjdDk"
const apiKey = "AIzaSyBnt3RiGrcgIHnEvPMU4ug6bySLr7RTvE0"
const baseApiUrl = "https://www.googleapis.com/youtube/v3"


app.listen(port, ()=>{
    console.log("App is started")
})


app.get('/', (req,res)=>{
    res.send('Hello from my initial API')
});


app.get('/search', async (req, res, next)=>{
    try {
        const videos = await getAutodeskVideos();
        res.send(videos);
    } catch (error) {
        next(error)
    }
})

app.get('/health', async (req, res, next)=>{
    try {
        const machineMemoryUsage =  ((os.totalmem()-os.freemem()) / os.totalmem()) * 100 ;
        const cpuUsage = os.cpus().reduce((acc, cpu) => acc + cpu.times.user, 0) / (os.uptime() * os.cpus().length) ;
        res.send({
            os: os.platform(),
            nodeVersion: process.version,
            memoryUsage: `${machineMemoryUsage.toFixed(2)}%`,
            cpuUsage: `${cpuUsage.toFixed(2)}%`,
        });
    } catch (error) {
        next(error)
    }
})

async function getViews(id){
    try {
        const url = `${baseApiUrl}/videos`;
        const params = {
            part: "statistics",
            id: id,
            key: apiKey
        };
        const viewsRes = await axios.get(url, { params })
        const views = viewsRes.data.items.map((item) => (item.statistics.viewCount));
        return views.join(', ');
    } catch (error) {
        console.log(error);
    }
}

async function getDuration(id){
    try {
        const url = `${baseApiUrl}/videos`;
        const params = {
            part: "contentDetails",
            id: id,
            key: apiKey
        };
        const durationRes = await axios.get(url, { params });
        const videoDurations = durationRes.data.items.map((item) => convertYoutubeDuration(item.contentDetails.duration));
        return videoDurations.join(', ');
    } catch (error) {
        console.log(error);
    }
}

async function getAutodeskVideos(){
    try {
        const url = "https://www.googleapis.com/youtube/v3/search";
        const params = {
            part: "snippet",
            maxResults: 10,
            q: "Autodesk",
            type: "video",
            key: apiKey
        };
        const response = await axios.get(url, { params });
        const data = response.data;
        const videos = [];
        for (const item of data.items) {
            const title = item.snippet.title;
            const videoId = item.id.videoId;
            const length = await getDuration(videoId); 
            const views = await getViews(videoId); 
            videos.push({ title, length, views });
        }
        return videos;
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

function convertYoutubeDuration(youtubeDurationFormat){
    const match = youtubeDurationFormat.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) {
        const match2 = youtubeDurationFormat.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
        if(match2){
            const hours =  match2[1] ? parseInt(match2[1], 10) : 0;
            const minutes = match2[2] ? parseInt(match2[2], 10) : 0;
            const seconds = match2[3] ? parseInt(match2[3], 10) : 0;
            return `${hours}:${minutes}:${seconds}`;
        }
        else if(!match2){
            const match3 = youtubeDurationFormat.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
            if(match3){
                const days =  match3[1] ? parseInt(match3[1], 10) : 0;
                const hours =  match3[2] ? parseInt(match3[2], 10) : 0;
                const minutes = match3[3] ? parseInt(match3[3], 10) : 0;
                const seconds = match3[4] ? parseInt(match3[4], 10) : 0;
                return `${days}:${hours}:${minutes}:${seconds}`;
            } 
        }
        return 'Invalid duration format';
    }
    const hours = 0
    const minutes = match[1] ? parseInt(match[1], 10) : 0;
    const seconds = match[2] ? parseInt(match[2], 10) : 0;
    return `${hours}:${minutes}:${seconds}`;
}

module.exports = convertYoutubeDuration;