// Waits until the document's elements are available
document.addEventListener("DOMContentLoaded", (event) => {
    getAudio();
});

function getAudio() {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            updateAudioSource(xmlHttp.responseText);
    }
    xmlHttp.open("GET", "http://localhost:5000/getMenu", true); // true for asynchronous 
    xmlHttp.send(null);
}

function updateAudioSource(audio) {
    if (!audio) return console.log("No response from audio endpoint...");

    document.getElementById("noAudio").style.display = 'none';
    let audioFigure = document.getElementById("audio"),
        audioEmbed = document.getElementById("latest_menu");

    audioFigure.style.display = 'inherit';
    audioEmbed.src = audio;
}