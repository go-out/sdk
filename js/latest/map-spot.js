import {renderInfo, shuffle} from "./common.js";
import {map} from "./map-embed.js";

// マーカー(map-features.js)・ライン(map-line.js)・一覧(map.jsの#list)の
// クリック時に共通で使う、#spot / #thisEvent モーダルを開いて地図を移動する処理
// item: {properties, geometry} の形（features/lineの各要素、または#listのitem）
// center: flyTo先の座標 [lng, lat]
export function openSpotOrEvent(item, center) {
    const properties = item.properties;

    if (properties.googlePhotos || properties.archive) {
        thisSpot(properties);
        if (properties.archive) {
            spotVideo(properties, properties.archive[0]);
        } else if (properties.googlePhotos) {
            spotImage(properties, properties.googlePhotos[0]);
        };
        document.querySelector("#spot").showModal();
    } else {
        const thisInfo = document.querySelector("#thisEvent #thisInfo");
        thisInfo.innerHTML = ""; // 同じ項目を複数回クリックしても内容が重複しないようリセット

        const h3 = document.createElement("h3");
        h3.innerHTML = properties.title;
        thisInfo.appendChild(h3);

        const thisDescription = (properties.description || (item.geometry && item.geometry.address) || "").replaceAll("\n", "<br>");
        const description = document.createElement("p");
        description.innerHTML = `<b>${thisDescription}</b>`;
        thisInfo.appendChild(description);

        // 修正: renderInfoはnote/markdownが無い場合、渡されたnotes要素自体をhiddenにする仕様のため、
        // thisInfoをそのまま渡すとタイトル・説明文ごと非表示になってしまっていた。
        // note専用の子要素を用意し、そちらだけをnotesとして渡すことでthisInfo全体への影響を防ぐ。
        const notesContainer = document.createElement("div");
        thisInfo.appendChild(notesContainer);

        // note/linksの描画はcommon.jsのrenderInfoと同じ処理のため共通化
        renderInfo(
            {note: properties.note, links: properties.links},
            {notes: notesContainer, links: document.querySelector("#thisLink")}
        );

        document.querySelector("#thisEvent").showModal();
    };

    const zoom = properties.zoom || 17.5;
    map.flyTo({center, essential: true, offset: [0, 0], zoom}, false);
};

// ライン（GeoJSONソース）のクリックはmaplibreglの内部仕様上、
// propertiesのネストしたオブジェクト/配列（note・links・archive・googlePhotos）が
// JSON文字列化された状態で渡ってくるため、ここで元のオブジェクトへ復元してから
// openSpotOrEventへ渡す。
export function openLineClickEvent(rawProperties, lngLat) {
    const properties = {
        title: rawProperties.title,
        description: rawProperties.description,
        zoom: rawProperties.zoom,
        note: rawProperties.note ? JSON.parse(rawProperties.note) : null,
        links: rawProperties.links ? JSON.parse(rawProperties.links) : null,
        archive: rawProperties.archive ? JSON.parse(rawProperties.archive) : null,
        googlePhotos: rawProperties.googlePhotos ? JSON.parse(rawProperties.googlePhotos) : null
    };
    openSpotOrEvent({properties, geometry: null}, [lngLat.lng, lngLat.lat]);
};

// #list（一覧）のitemから、flyTo先の座標を求める。
// Point（features）はそのまま、LineString（line）は中間の座標を使う。
export function centerOfItem(item) {
    const coords = item.geometry.coordinates;
    if (item.geometry.type === "LineString") {
        return coords[Math.floor(coords.length / 2)];
    };
    return [Number(coords[0]), Number(coords[1])];
};

// 以下、#spotダイアログ（写真・動画ビューア）の描画・操作ロジック

function thisSpot(info) {
    const spotNote = document.querySelector("#spot #info section"),
        spotLinks = document.querySelector("#spot #info aside"),
        selectLog = document.querySelector("#spot select#log");

    // 修正: infoに応じてdescriptionが無い場合もあるため、nullを想定して安全に
    document.querySelector("#spot #thisDescription").innerHTML = (info.description || "").replaceAll("\n", "<br>");
    if (info.note) {
        for (const noteEach of info.note) {
            const p = document.createElement("p");
            p.innerHTML = noteEach;
            spotNote.appendChild(p);
        };
        spotNote.hidden = false;
    } else {
        spotNote.hidden = true;
    };

    if (info.links) {
        for (const linkEach of info.links) {
            const a = document.createElement("a");
            a.href = linkEach.url;
            a.target = linkEach.target;
            a.textContent = linkEach.text;
            spotLinks.appendChild(a);
        };
        spotLinks.hidden = false;
    } else {
        spotLinks.hidden = true;
    };

    if (info.archive || info.googlePhotos) {
        let i = 0;

        if (info.archive) {
            info.archive.forEach((archiveEach, index) => {
                i++;
                const option = document.createElement("option");
                option.value = "archive-" + index;
                selectLog.appendChild(option);

                if (archiveEach.year && archiveEach.month) {
                    option.innerHTML = `${archiveEach.year}年${archiveEach.month}月${archiveEach.date}日`;
                } else {
                    option.innerHTML = "[" + i + "] ";
                    if (archiveEach.title) {
                        option.textContent += archiveEach.title;
                    } else {
                        option.textContent += info.title;
                    };
                };

                if (i == 2) {
                    selectLog.hidden = false;
                };
            });
        };

        if (info.googlePhotos) {
            info.googlePhotos.forEach((imageEach, index) => {
                i++;
                const option = document.createElement("option");
                option.value = "image-" + index;
                selectLog.appendChild(option);

                if (imageEach.year && imageEach.month) {
                    option.innerHTML = `${imageEach.year}年${imageEach.month}月${imageEach.date}日`;
                } else {
                    option.innerHTML = "[" + i + "] ";
                    if (imageEach.title) {
                        option.textContent += imageEach.title;
                    } else {
                        option.textContent += info.title;
                    };
                };

                if (i == 2) {
                    selectLog.hidden = false;
                };
            });
        };

        selectLog.addEventListener("change", (e) => {
            for (const removeEl of document.querySelectorAll("#vewAll input, #vewAll label")) {
                removeEl.remove();
            };

            if (e.target.value.includes("archive")) {
                const archiveCH = e.target.value.split("-");
                spotVideo(info, info.archive[Number(archiveCH[1])]);
            } else if (e.target.value.includes("image")) {
                const imageCH = e.target.value.split("-");
                spotImage(info, info.googlePhotos[Number(imageCH[1])]);
            };
        });
    } else {
        selectLog.hidden = true;
    };
};

function spotImage(info, imgArr) {
    document.querySelector("#spot h2").className = null;
    document.querySelector("#spot #video").hidden = true;

    const spotTitle = document.querySelector("#spot h2 strong"),
        logYYYY = document.querySelector("#spot h2 #year"),
        logMM = document.querySelector("#spot h3 #month"),
        logDD = document.querySelector("#spot h3 #date");

    if (imgArr.title) {
        spotTitle.innerHTML = imgArr.title;
        spotTitle.hidden = false;
    } else {
        spotTitle.innerHTML = info.title;
        spotTitle.hidden = false;
    };

    if (imgArr.year) {
        logYYYY.hidden = false;
        logYYYY.textContent = imgArr.year;
    } else {
        logYYYY.hidden = true;
    };
    if (imgArr.month) {
        logMM.hidden = false;
        logMM.textContent = imgArr.month;
    } else {
        logMM.hidden = true;
    };
    if (imgArr.date) {
        logDD.hidden = false;
        logDD.textContent = imgArr.date;
    } else {
        logDD.hidden = true;
    };

    const imgAll = shuffle(imgArr.url), directory = "https://lh3.googleusercontent.com/";
    document.querySelector("#spot div").style.backgroundImage = `url(${directory}${imgAll[0]}=w1280-h720-p-k-no)`;
    if (imgAll.length !== 0) {
        for (let i = 0; i < imgAll.length; i++) {
            const input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", "channel");
            input.id = `img${i}`;
            input.value = `img${i}`;
            document.querySelector("#vewAll").appendChild(input);

            const url = directory + imgAll[i] + "=w172-h111-p-k-no";
            const label = document.createElement("label");
            label.setAttribute("for", `img${i}`);
            label.style.display = "block";
            label.style.height = "6.25rem";
            label.style.backgroundImage = `url(${url})`;
            document.querySelector("#vewAll").appendChild(label);

            input.addEventListener("change", () => {
                document.querySelector("#spot div").style.backgroundImage = `url(${directory}${imgAll[i]}=w1280-h720-p-k-no)`;
            });
        };
    };

    document.querySelector("#spot button.close").addEventListener("click", () => {
        document.querySelector("#spot").close();
        resetAll();
    }, false);
};

function spotVideo(info, videoArr) {
    const videoPlayPause = document.querySelector("#spot h2"),
        spotTitle = document.querySelector("#spot h2 strong"),
        logYYYY = document.querySelector("#spot h2 #year"),
        logMM = document.querySelector("#spot h3 #month"),
        logDD = document.querySelector("#spot h3 #date");

    const thisTitle = videoArr.title ? videoArr.title : info.title;

    videoPlayPause.dataset.title = thisTitle;
    spotTitle.hidden = false;

    if (videoArr.year) {
        logYYYY.hidden = false;
        logYYYY.textContent = videoArr.year;
    } else {
        logYYYY.hidden = true;
    };
    if (videoArr.month) {
        logMM.hidden = false;
        logMM.textContent = videoArr.month;
    } else {
        logMM.hidden = true;
    };
    if (videoArr.date) {
        logDD.hidden = false;
        logDD.textContent = videoArr.date;
    } else {
        logDD.hidden = true;
    };

    const directory = "https://archive.org/download/",
        canvas = document.querySelector("#spot #video"),
        canvasCtx = canvas.getContext("2d");

    const coverImg = `${directory}${videoArr.identifier}/${videoArr.identifier}.thumbs/${videoArr.cover}`;
    if (videoArr.files) {
        spotTitle.innerHTML = "▶️ " + thisTitle;
        canvas.hidden = false;
        videoPlayPause.className = "start";

        const playAll = shuffle(videoArr.files);
        if (playAll.length !== 0) {
            for (let i = 0; i < videoArr.count; i++) {
                const input = document.createElement("input");
                input.setAttribute("type", "radio");
                input.setAttribute("name", "channel");
                input.id = `ch${i}`;
                input.value = `ch${i}`;
                document.querySelector("#vewAll").appendChild(input);

                const label = document.createElement("label");
                label.setAttribute("for", `ch${i}`);
                label.style.display = "block";
                label.style.height = "6.25rem";
                document.querySelector("#vewAll").appendChild(label);

                const video = document.createElement("video");
                const url = videoArr.identifier + "/" + videoArr.identifier + ".thumbs/" + playAll[i];
                video.poster = `${directory}${url}_000001.jpg`;
                label.appendChild(video);

                const source = document.createElement("source");
                source.setAttribute("type", "video/mp4");
                source.src = `${directory}${videoArr.identifier}/${playAll[i]}${videoArr.formats}`;
                video.appendChild(source);

                if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    video.muted = true;
                    video.setAttribute("muted", "true");
                    video.setAttribute("playsinline", "true");
                };

                function canvasUpdate() {
                    canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(canvasUpdate);
                };

                input.addEventListener("change", () => {
                    canvasUpdate();
                });

                if (i === 0) {
                    input.checked = true;
                    canvasUpdate();
                };

                let ii = i;
                video.addEventListener("ended", () => {
                    ii = ii + videoArr.count;
                    if (ii >= playAll.length) {
                        ii = ii - Number(playAll.length);
                    };
                    source.src = `${directory}${videoArr.identifier}/${playAll[ii]}${videoArr.formats}`;
                    video.load();
                    video.play();
                    input.checked = true;
                    canvasUpdate();
                }, false);
            };
        };
    } else {
        spotTitle.innerHTML = thisTitle;
        canvas.hidden = true;
    };
    document.querySelector("#spot div").style.backgroundImage = `url(${coverImg})`;

    document.querySelector("#spot button.close").addEventListener("click", () => {
        document.querySelector("#spot").close();
        stopAllVideos();
        resetAll();
    }, false);
};

function resetAll() {
    document.querySelector("#spot div").style.backgroundImage = null;
    document.querySelector("#spot h2").className = null;
    document.querySelector("#spot h3").hidden = false;
    document.querySelector("#spot #video").hidden = true;

    for (const resetEl of document.querySelectorAll("#spot h2 strong, #spot h2 #year, #spot h3 #month, #spot h3 #date")) {
        resetEl.textContent = "";
    };

    for (const removeEl of document.querySelectorAll("#vewAll input, #vewAll label, #spot #info section p, #spot #info aside a, #spot select#log option")) {
        removeEl.remove();
    };
};

function playAllVideos() {
    document.querySelectorAll("dialog#spot #vewAll label video").forEach(video => {
        video.play();
    });
};

function stopAllVideos() {
    document.querySelectorAll("dialog#spot #vewAll label video").forEach(video => {
        video.pause();
    });
};

window.addEventListener("load", function () {
    const videoPlayPause = document.querySelector("#spot h2"),
        spotTitle = document.querySelector("#spot h2 strong"),
        logYYYY = document.querySelector("#spot h2 #year"),
        logMM = document.querySelector("#spot h3 #month"),
        logDD = document.querySelector("#spot h3 #date");

    videoPlayPause.addEventListener("click", () => {
        if (videoPlayPause.className == "start") {
            spotTitle.innerHTML = "⏸️";
            logYYYY.hidden = true;
            logMM.hidden = true;
            logDD.hidden = true;
            videoPlayPause.className = "pause";
            playAllVideos();
        } else if (videoPlayPause.className == "pause") {
            spotTitle.innerHTML = "▶️ " + videoPlayPause.dataset.title;
            logYYYY.hidden = false;
            logMM.hidden = false;
            logDD.hidden = false;
            videoPlayPause.className = "start";
            stopAllVideos();
        };
    });
}, false);