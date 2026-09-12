import {shuffle} from "./common.js";

const coverAll = [];

// 写真ギャラリー風のカバー表示（9枚以上あるときのみ表示）
// collectionAll（featuresAllArr/lineAllArrを合わせた配列）から画像をカウントする。
// obj.featuresだけを見ていた以前と違い、obj.featuresJSON・obj.line/lineJSON経由の
// 画像も反映されるようになる。
export function processCover(obj, collectionAll) {
    coverAll.length = 0;

    let directory;
    const header = document.querySelector("header"),
        ul = document.querySelector("header ul");

    for (const item of collectionAll) {
        const properties = item.properties;
        if (properties.googlePhotos) {
            directory = "https://lh3.googleusercontent.com/";
            coverAll.push(directory + properties.googlePhotos[0].url[0] + "=w575-h325-p-k-no");
        } else if (properties.archive) {
            const url = properties.archive[0].identifier + "/" + properties.archive[0].identifier + ".thumbs/" + properties.archive[0].cover;
            coverAll.push("https://archive.org/download/" + url);
        };
    };

    if (obj.cover && obj.cover.url) {
        if (!obj.cover.directory) {
            directory = "https://lh3.googleusercontent.com/";
            for (const url of obj.cover.url) {
                coverAll.push(`${directory}${url}=w575-h325-p-k-no`);
            };
        } else {
            directory = obj.cover.directory;
            for (const url of obj.cover.url) {
                coverAll.push(`${directory}${url}`);
            };
        };
    };

    if (coverAll.length >= 9) {
        header.id = "cover";
        ul.hidden = false;
        ul.innerHTML = "";
        const imgArr = shuffle(coverAll);
        for (let i = 0; i < 9; i++) {
            const li = document.createElement("li");
            li.style.backgroundImage = `url(${imgArr[i]})`;
            li.dataset.number = i;
            ul.appendChild(li);
        };
    };
};