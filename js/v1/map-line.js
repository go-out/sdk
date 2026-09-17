// route（obj.line / obj.lineJSON）関連の処理

import {fetchJSON} from "./common.js";
import {map, mapSupported} from "./map-embed.js";
import {openLineClickEvent} from "./map-spot.js";

export const ROUTE_SOURCE_ID = "route";
export const ROUTE_LAYER_ID = "route-layer";

// obj.line / obj.lineJSON からlineAllArrを組み立て、地図に描画する。
// 呼び出し側であらかじめmapReadyを待ってから呼ぶこと（mapが未生成の状態では使えない）。
export async function processLines(obj) {
    const lineAllArr = [];

    if (obj.line) {
        lineAllArr.push(...obj.line);
    };

    if (obj.lineJSON) {
        for (const json of obj.lineJSON) {
            const index = await fetchJSON(json);
            if (index.line) {
                lineAllArr.push(...index.line);
            };
        };
    };

    // 地図が無い環境ではルートを描く先が無いのでスキップする。
    // lineAllArr自体は#listの一覧表示に使うため、そのまま返す
    if (lineAllArr.length && mapSupported) {
        addLine(lineAllArr);
    };

    return lineAllArr;
};

// 地図上にルートラインを描画する
function addLine(lineArr) {
    map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: {type: "FeatureCollection", features: lineArr}
    });
    map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: {"line-join": "round", "line-cap": "round"},
        paint: {"line-color": "lightskyblue", "line-width": 14.5}
    });

    map.on("mouseenter", ROUTE_LAYER_ID, () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", ROUTE_LAYER_ID, () => map.getCanvas().style.cursor = "");

    // クリック時のモーダル表示・地図移動はmap-spot.jsに共通化。
    // ラインのproperties（note/links/archive/googlePhotos等）は、GeoJSONソースから
    // 地図クリックで取得する際にJSON文字列化されているため、map-spot.js側で復元する。
    map.on("click", ROUTE_LAYER_ID, (e) => {
        openLineClickEvent(e.features[0].properties, e.lngLat);
    });
};