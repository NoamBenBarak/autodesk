// Import required modules
const express = require('express')
const axios = require('axios')
const os = require('os')
require('dotenv').config();

// Initialize Express app and set port
const app = express()
const port = process.env.PORT || 3000;

// API Key for YouTube API (retrieved from environment variables)
const apiKey = process.env.API_KEY;
const baseApiUrl = "https://www.googleapis.com/youtube/v3"

// Start listening on defined port
app.listen(port, ()=>{
    console.log("App is started")
})

// Route to handle root endpoint
app.get('/', (req,res)=>{
    res.send('Hello from my initial API')
});

// Route to fetch Autodesk videos
app.get('/search', async (req, res, next)=>{
    try {
        const videos = await getAutodeskVideos();
        res.send(videos);
    } catch (error) {
        // Send appropriate error response to client
        res.status(500).send({ error: 'Internal Server Error' });
        // Log the error for debugging purposes
        console.error('Error fetching Autodesk videos:', error);
        // Forward the error to the error-handling middleware
        next(error);
    }
})

// Route for health check
app.get('/health', async (req, res, next)=>{
    try {
        // Calculate machine memory usage and CPU usage
        const machineMemoryUsage =  ((os.totalmem()-os.freemem()) / os.totalmem()) * 100 ;
        const cpuUsage = os.cpus().reduce((acc, cpu) => acc + cpu.times.user, 0) / (os.uptime() * os.cpus().length) ;
         // Send health check response
        res.send({
            os: os.platform(),
            nodeVersion: process.version,
            memoryUsage: `${machineMemoryUsage.toFixed(2)}%`,
            cpuUsage: `${cpuUsage.toFixed(2)}%`,
        });
    } catch (error) {
        // Send appropriate error response to client
        res.status(500).send({ error: 'Internal Server Error' });
        // Log the error for debugging purposes
        console.error('Error performing health check:', error);
        // Forward the error to the error-handling middleware
        next(error);
    }
})

// Function to fetch views count for a YouTube video
async function getViews(id){
    try {
        const url = `${baseApiUrl}/videos`;
        const params = {
            part: "statistics",
            id: id,
            key: apiKey
        };
         // Fetch views count from YouTube API
        const viewsRes = await axios.get(url, { params })
        const views = viewsRes.data.items.map((item) => (item.statistics.viewCount));
        return views.join(', ');
    } catch (error) {
        console.log(error);
    }
}

// Function to fetch duration for a YouTube video
async function getDuration(id){
    try {
        const url = `${baseApiUrl}/videos`;
        const params = {
            part: "contentDetails",
            id: id,
            key: apiKey
        };
        // Fetch duration from YouTube API
        const durationRes = await axios.get(url, { params });
        const videoDurations = durationRes.data.items.map((item) => convertYoutubeDuration(item.contentDetails.duration));
        return videoDurations.join(', ');
    } catch (error) {
        console.log(error);
    }
}

// Function to fetch Autodesk-related videos from YouTube
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
        // Fetch videos from YouTube API
        const response = await axios.get(url, { params });
        const data = response.data;
        const videos = [];
         // Iterate over each video item and extract relevant information
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

// Function to convert YouTube video duration format to HH:MM:SS
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

// Export for testing
module.exports = {convertYoutubeDuration};