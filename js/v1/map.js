// maplibreglはmap.js自体では直接使わないため、ここではimportしない
// （必要なmap-embed.js/map-features.js側でそれぞれ直接importしている）
import {fetchJSON, renderInfo} from "./common.js";
import {map, mapReady, setInitialMapSettings} from "./map-embed.js";
import {processFeatures} from "./map-features.js";
import {processLines} from "./map-line.js";
import {processCover} from "./map-cover.js";
import {processEvents} from "./date-event.js";
import {openSpotOrEvent, centerOfItem} from "./map-spot.js";
import {weatherAPI} from "./weather.js";

// mapページのJSONを取得してマップを構築
export async function collectionJSON(requestURL) {
    const index = await fetchJSON(requestURL);
    createMap(index);
}

async function createMap(obj) {
    const thisTitle = document.querySelector("header #title strong"),
        thisBy = document.querySelector("header #title u"),
        thisDscription = document.querySelector("#collection #description b"),
        spotOpen = document.querySelector("#spot"),
        spotClose = document.querySelector("#spot button.close");

    if (obj.title) {
        thisTitle.innerHTML = obj.title[0];
        if (obj.title[1]) {
            document.title = obj.title[1] + " | " + obj.title[0];
            thisBy.innerHTML = obj.title[1];
            thisBy.hidden = false;
            spotClose.innerHTML = obj.title[1];
        } else {
            document.title = obj.title[0];
            spotClose.innerHTML = obj.title[0];
            if (obj.author) {
                thisBy.textContent = "by " + obj.author.name;
                thisBy.hidden = false;
            } else {
                thisBy.hidden = true;
            };
        }
    } else if (obj.author) {
        thisBy.textContent = obj.author.name;
        thisBy.hidden = false;
    } else {
        thisBy.hidden = true;
    }

    if (obj.description) {
        document.querySelector(`meta[name="description"]`).content = obj.description.replaceAll("\n", " ");
        thisDscription.innerHTML = obj.description.replaceAll("\n", "<br>");
    }

    renderInfo(obj.info, {
        notes: document.querySelector("#notes"),
        links: document.querySelector("#links")
    });

    // obj.mapの値（center/zoom/bounds）をそのまま初期表示に使う
    setInitialMapSettings(obj.map);
    await mapReady;

    const featuresAllArr = await processFeatures(obj);
    const lineAllArr = await processLines(obj);

    const collectionAll = [...featuresAllArr, ...lineAllArr];
    if (obj.features || obj.featuresJSON || obj.line || obj.lineJSON) {
        document.querySelector("#list").hidden = false;
        document.querySelector("#list summary").innerHTML = "このコレクションの <b>" + collectionAll.length + "</b> の場所";
        listItems(collectionAll);
    } else {
        document.querySelector("#list").hidden = true;
    }

    await processEvents(obj);

    processCover(obj, collectionAll);

    if (obj.map && obj.map.center) {
        weatherAPI(obj.map.center[1], obj.map.center[0]);
    }

    if (spotClose && !spotClose.dataset.listenerBound) {
        spotClose.addEventListener("click", () => spotOpen.close());
        spotClose.dataset.listenerBound = "true";
    };

    const thisEventClose = document.querySelector("#thisEvent button.close");
    if (thisEventClose && !thisEventClose.dataset.listenerBound) {
        thisEventClose.addEventListener("click", () => document.querySelector("#thisEvent").close());
        thisEventClose.dataset.listenerBound = "true";
    };
};

function listItems(indexJson) {
    document.querySelector("#list ul").innerHTML = "";
    const existingEmptyMsg = document.querySelector("#list > p");
    if (existingEmptyMsg) {
        existingEmptyMsg.remove();
    };

    if (indexJson.length === 0) {
        const p = document.createElement("p");
        p.textContent = "まだ投稿がありません";
        document.querySelector("#list").prepend(p);
        return;
    };

    indexJson.forEach((item) => {
        const thisTitle = item.properties.title;
        const thisDescription = (item.properties.description || (item.geometry && item.geometry.address) || "").replaceAll("\n", "<br>");

        const li = document.createElement("li");
        li.innerHTML = `<b>${thisTitle}</b>${thisDescription}`;
        document.querySelector("#list ul").appendChild(li);

        li.addEventListener("click", () => {
            openSpotOrEvent(item, centerOfItem(item));
            document.querySelector("#mapbox").scrollIntoView({behavior: "smooth"});
        });
    });
};