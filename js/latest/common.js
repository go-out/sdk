"use strict";

export const siki = [
    ["January", "冬", "winter"],
    ["February", "冬", "winter"],
    ["March", "春", "spring"],
    ["April", "春", "spring"],
    ["May", "春", "spring"],
    ["June", "夏", "summer"],
    ["July", "夏", "summer"],
    ["August", "夏", "summer"],
    ["September", "秋", "autumne"],
    ["October", "秋", "autumne"],
    ["November", "秋", "autumne"],
    ["December", "冬", "winter"]
];
export const sikiNow = siki[new Date().getMonth()][2];

// 汎用JSON取得
export async function fetchJSON(url) {
    const response = await fetch(new Request(url));
    if (!response.ok) {
        // 404等のHTTPエラーを明示的に検知し、JSON.parseエラーを防ぐ
        throw new Error(`fetchJSON: ${url} -> HTTP ${response.status}`);
    };
    const text = await response.text();
    return JSON.parse(text);
};

// info（markdown / note / links）をコンテナに描画する汎用処理
// containers: { notes: Element|null, links: Element|null }
export function renderInfo(info, containers) {
    const {notes, links} = containers;

    if (info && (info.markdown || info.note)) {
        if (notes) {
            notes.hidden = false;
            if (info.markdown) {
                fetch(info.markdown)
                    .then(response => {
                        if (!response.ok) {
                            // markdownファイル取得失敗時のエラー検知
                            throw new Error(`renderInfo: ${info.markdown} -> HTTP ${response.status}`);
                        };
                        return response.text();
                    })
                    .then(text => {
                        const p = document.createElement("p");
                        p.innerText = text;
                        notes.appendChild(p);
                    })
                    .catch(error => console.error(error));
            } else if (info.note) {
                notes.innerHTML = "";
                for (const note of info.note) {
                    const p = document.createElement("p");
                    p.innerHTML = note;
                    notes.appendChild(p);
                };
            };
        };
    } else if (notes) {
        notes.hidden = true;
    };

    if (info && info.links) {
        if (links) {
            links.hidden = false;
            links.innerHTML = "";
            for (const link of info.links) {
                const a = document.createElement("a");
                a.href = link.url;
                a.target = link.target;
                a.textContent = link.text;
                links.appendChild(a);
            };
        };
    } else if (links) {
        links.hidden = true;
    };
};

// イベント1件分（タイトル・note・description）をコンテナに描画する汎用処理
// map.js（季節イベント一覧）・date.js（月間カレンダー、今後実装）の両方から利用する想定
export function renderEventDetails(container, eventObj) {
    if (eventObj.note) {
        const note = document.createElement("ruby");
        note.textContent = `${eventObj.note[1]} `;
        if (eventObj.note[0]) {
            const rt = document.createElement("rt");
            rt.textContent = eventObj.note[0];
            note.appendChild(rt);
        };
        container.appendChild(note);
    };

    if (eventObj.title) {
        const h3 = document.createElement("h3");
        h3.textContent = `${eventObj.title[0]} `;
        if (eventObj.title[1]) {
            const small = document.createElement("small");
            small.textContent = eventObj.title[1];
            h3.appendChild(small);
        };
        container.appendChild(h3);
    };

    if (eventObj.description) {
        const p = document.createElement("p");
        p.textContent = eventObj.description;
        container.appendChild(p);
    };
};

// 配列シャッフル（Fisher–Yates）
export function shuffle(arrays) {
    const array = arrays.slice();
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};