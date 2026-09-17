import * as maplibregl from "https://unpkg.com/maplibre-gl@6.9.0/dist/maplibre-gl.mjs";

import {fetchJSON} from "./common.js";
import {map, mapSupported} from "./map-embed.js";
import {openSpotOrEvent} from "./map-spot.js";

// coordinates（[lng, lat]）がbounds（[[west, south], [east, north]]）の範囲内かどうか。
// boundsが指定されていない場合は常にtrue（絞り込みなし）
function isWithinBounds(coordinates, bounds) {
    if (!bounds) return true;
    const [[west, south], [east, north]] = bounds;
    const [lng, lat] = coordinates;
    return lng >= west && lng <= east && lat >= south && lat <= north;
};

// obj.features / obj.featuresJSON からfeaturesAllArrを組み立て、地図上にマーカーを描写する。
// obj.featuresJSON側から読み込むfeatureのみ、obj.map.boundsの範囲外なら除外する
// （obj.features直接埋め込み分は、明示的に選ばれたものとして絞り込み対象にしない）。
// 呼び出し側であらかじめmapReadyを待ってから呼ぶこと（mapが未生成の状態では使えない）。
export async function processFeatures(obj) {
    const featuresAllArr = [];

    if (obj.features) {
        featuresAllArr.push(...obj.features);
    } else if (mapSupported) {
        // 静的なfeaturesが無い場合は、右クリックで座標を取得できるようにしておく
        // （featuresJSON側の外部ファイルを作る際の下調べ用。obj.featuresJSONの有無に関わらず有効）
        map.on("contextmenu", (e) => {
            new maplibregl.Popup({className: "goout"})
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .setHTML(`${e.lngLat.lng}, ${e.lngLat.lat}`)
                .addTo(map);
        });
    };

    if (obj.featuresJSON) {
        const bounds = obj.map && obj.map.bounds;
        for (const json of obj.featuresJSON) {
            const index = await fetchJSON(json);
            if (index.features) {
                for (const feature of index.features) {
                    if (isWithinBounds(feature.geometry.coordinates, bounds)) {
                        featuresAllArr.push(feature);
                    };
                };
            };
        };
    };

    // 今後featuresAllArrを並び替える場合はここで行う想定（例: 日付順、地域順など）

    // 地図が無い環境ではマーカーを置く先が無いのでスキップする。
    // featuresAllArr自体は#listの一覧表示に使うため、そのまま返す
    if (mapSupported) {
        for (const feature of featuresAllArr) {
            addMarker(feature);
        };
    };

    return featuresAllArr;
};

// 地図にカスタムスタイルのマーカーを追加
function addMarker(feature) {
    const thisGeo = [Number(feature.geometry.coordinates[0]), Number(feature.geometry.coordinates[1])];

    const el = document.createElement("span");
    if (feature.properties.icon) {
        el.style.width = feature.properties.icon[1];
        el.style.height = feature.properties.icon[2];
        el.style.backgroundImage = `url(${feature.properties.icon[0]})`;
        if (feature.properties.icon[3]) {
            el.style.zIndex = feature.properties.icon[3];
        };
    } else if (feature.properties.googlePhotos) {
        const url = feature.properties.googlePhotos[0].url[0] + "=w172-h111-p-k-no";
        el.style.width = "7rem";
        el.style.height = "4.5rem";
        el.style.borderRadius = "0.5rem";
        el.style.backgroundImage = `url(https://lh3.googleusercontent.com/${url})`;
    } else if (feature.properties.archive) {
        const url = feature.properties.archive[0].identifier + "/" + feature.properties.archive[0].identifier + ".thumbs/" + feature.properties.archive[0].cover;
        el.style.width = "7rem";
        el.style.height = "4.5rem";
        el.style.borderRadius = "0.5rem";
        el.style.backgroundSize = "cover";
        el.style.backgroundImage = `url(https://archive.org/download/${url})`;
    } else {
        el.classList.add("goout");
    };

    // new maplibregl.Marker(el) のようにHTMLElementを直接渡す書き方は現行のMapLibre GL JSでは
    // 非対応のため、必ず { element: el } の形でoptionsオブジェクトに包んで渡す。
    new maplibregl.Marker({element: el})
        .setLngLat(thisGeo)
        .addTo(map);

    // クリック時のモーダル表示・地図移動はmap-spot.jsに共通化
    el.addEventListener("click", () => {
        openSpotOrEvent(feature, thisGeo);
    }, false);
};