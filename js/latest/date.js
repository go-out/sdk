import {fetchJSON, setCanonical, setStructuredData} from "./common.js";

async function indexJSON(requestURL) {
    const index = await fetchJSON(requestURL);
    createCover(index);
    createMenu(requestURL, index);
};

async function fetchText(url) {
    fetch(url)
        .then(response => response.text())
        .then(text => {
            document.querySelector("#notes").innerText = text
        }, false);
};

// fetch（非同期）。last-modifiedヘッダーを読みたいので、fetchJSONではなく
// レスポンスそのものを扱うここだけは従来通りにしている。
async function gateDate(target) {
    const response = await fetch(target);
    if (response.ok) {
        return response;
    } else {
        throw new Error("The data could not be read");
    };
};

// 更新日取得
function getModified(target) {
    const headers = target.headers;
    let lastModified = "";
    for (const pair of headers.entries()) {
        if (pair[0] === "last-modified") {
            lastModified = pair[1];
        };
    };
    return lastModified;
};

const days = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
];

function formatDate(targetDate) {
    const modified = new Date(targetDate);
    const year = modified.getFullYear();
    const month = modified.getMonth() + 1;
    const date = modified.getDate();
    const day = modified.getDay();
    return +year + "." + month + "." + date + " (" + days[day] + ")";
};

function coverTitle(obj) {
    const thisTitle = document.querySelector("header h1 strong");
    if (obj.title) {
        thisTitle.innerHTML = `<b>${obj.title[0]}</b>`;
        if (obj.title[1]) {
            thisTitle.innerHTML += `<small>${obj.title[1]}</small>`;
        };
    } else {
        thisTitle.hidden = true;
    };

    const thisDescription = document.querySelector("header h1 u");
    if (obj.description) {
        thisDescription.textContent = obj.description;
        document.querySelector(`meta[name="description"]`).content = obj.description;
    } else {
        thisDescription.hidden = true;
    };

    const thisNote = document.querySelector("header h2"),
        note0 = document.querySelector("header h2 small"),
        note1 = document.querySelector("header h2 i");
    if (obj.note) {
        note0.textContent = obj.note[0];
        note1.textContent = obj.note[1];
        thisNote.hidden = false;
    } else {
        note0.textContent = "";
        note1.textContent = "";
        thisNote.hidden = true;
    };
};

// header/#coverの切り替え：cover.hidden ではなく header.id = "cover" を付け外しする方式。
// markdown・cover.directory・linksの参照先はすべて "/リポジトリ名/..." という
// ドメインルート基準で書く運用に統一したため、path（../ 等のプレフィックス）を
// 計算して引き回す仕組みは不要になった（以前あったcreateCover/createMenu/
// readmeThisのpath引数は廃止）。
function createCover(obj) {
    const header = document.querySelector("header");

    // SEO: canonical URLとJSON-LD構造化データ
    setCanonical(location.href);
    setStructuredData({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": obj.cover && obj.cover.title ? obj.cover.title[0] : undefined,
        "description": obj.cover ? obj.cover.description : undefined
    });

    if (obj.cover) {
        coverTitle(obj.cover);
        if (obj.cover.title) {
            if (obj.cover.title[1]) {
                document.title = `${obj.cover.title[0]} - ${obj.cover.title[1]}`;
            } else {
                document.title = obj.cover.title[0];
            };
        };

        let directory;

        if (obj.cover.url) {
            header.id = "cover";
            if (obj.cover.directory) {
                // http絶対URL、または"/"始まりのドメインルート基準パスの前提でそのまま使う
                directory = obj.cover.directory;
                header.style.backgroundImage = `url(${directory}${obj.cover.url})`;
            } else {
                directory = "https://lh5.googleusercontent.com/";
                header.style.backgroundImage = `url(${directory}${obj.cover.url}=w1280-h720-k-no)`;
            };
        } else {
            header.removeAttribute("id");
            header.style.backgroundImage = null;
        };
    } else {
        header.removeAttribute("id");
        header.style.backgroundImage = null;
    };
};

function readmeThis(info, obj) {
    let textAll = "";
    if (info.markdown) {
        fetchText(info.markdown);
    } else {
        textAll = `${obj.title[0]} ${obj.title[1]}`;
        textAll += "<p>" + obj.note[1] + "<br>" + obj.note[0] + "</p>";
        textAll += `<p>${obj.description}</p>`;
        if (info.note) {
            for (const textEach of info.note) {
                textAll += "<br>" + textEach;
            };
        };
        document.querySelector("#notes").innerHTML = textAll;
    };

    const links = document.querySelector("#links");
    links.innerHTML = "";
    if (info.links) {
        links.hidden = false;
        for (const eachLink of info.links) {
            // urlはhttp絶対URL、または"/"始まりのドメインルート基準パスの前提のため、
            // targetによる場合分けもプレフィックス付与も不要
            const a = document.createElement("a");
            a.textContent = eachLink.text;
            a.setAttribute("target", eachLink.target);
            a.href = eachLink.url;
            links.appendChild(a);
        };
    } else {
        links.hidden = true;
    };
};

async function createMenu(json, obj) {
    const latestUpdate = document.querySelector("#latest");

    if (!obj.lastModified) {
        const modified = getModified(await gateDate(json));
        latestUpdate.value = "更新日 " + formatDate(modified);
    } else {
        latestUpdate.value = obj.lastModified;
    };

    const readmeH3 = document.querySelector("#readme nav h3");
    readmeH3.addEventListener("click", (e) => {
        e.preventDefault();
        createCover(obj);

        if (obj.cover.url) {
            document.querySelector("header").scrollIntoView({top: 0, behavior: "smooth"}, false);
        } else {
            document.querySelector("#readme section").scrollIntoView({top: 0, behavior: "smooth"}, false);
        };

        if (obj.info) {
            readmeThis(obj.info, obj.cover);
        };
    });

    if (obj.info) {
        if (obj.info.index) {
            readmeH3.textContent = obj.info.index;
        };
        readmeThis(obj.info, obj.cover);
    };

    const menu = document.querySelector("#readme nav");
    if (obj.events) {
        for (const indexEach of obj.events) {
            const button = document.createElement("button");
            button.setAttribute("type", "button");
            menu.appendChild(button);
            const ruby = document.createElement("ruby");
            button.appendChild(ruby);

            if (indexEach.title[1]) {
                const b = document.createElement("b");
                b.innerHTML = `${indexEach.title[0]} <small>${indexEach.title[1]}</small>`;
                ruby.appendChild(b);
            } else {
                const b = document.createElement("b");
                b.innerHTML = `${indexEach.title[0]}`;
                ruby.appendChild(b);
            };

            if (indexEach.date) {
                const rt = document.createElement("rt");
                let thisDate = "";
                if (indexEach.date.year) {
                    thisDate += `<b>${indexEach.date.year}</b> <sup>年</sup>`;
                };
                if (indexEach.date.month) {
                    thisDate += `<b>${indexEach.date.month}</b> <sup>月</sup>`;
                };
                if (indexEach.date.date) {
                    if (Array.isArray(indexEach.date.date) == true) {
                        thisDate += `<b>${indexEach.date.date}</b> <sup>日</sup>`;
                    } else {
                        thisDate += ` <sup>${indexEach.date.date}</sup>`;
                    };
                };
                rt.innerHTML = thisDate;
                ruby.appendChild(rt);
            };

            if (indexEach.month) {
                const rt = document.createElement("rt");
                rt.innerHTML = `<b>${indexEach.month}</b> <sup>月</sup>`;
                ruby.appendChild(rt);
            };

            button.addEventListener("click", (e) => {
                e.preventDefault();

                let directory;
                const header = document.querySelector("header");
                if (indexEach.cover && indexEach.cover.url) {
                    coverTitle(indexEach);
                    header.id = "cover";
                    if (indexEach.cover.directory) {
                        directory = indexEach.cover.directory;
                        header.style.backgroundImage = `url(${directory}${indexEach.cover.url})`;
                    } else {
                        directory = "https://lh3.googleusercontent.com/";
                        header.style.backgroundImage = `url(${directory}${indexEach.cover.url}=w1280-h720-k-no)`;
                    };

                    document.querySelector("header").scrollIntoView({top: 0, behavior: "smooth"}, false);
                } else {
                    createCover(obj);
                    document.querySelector("#readme section").scrollIntoView({top: 0, behavior: "smooth"}, false);
                };

                if (indexEach.info) {
                    readmeThis(indexEach.info, indexEach);
                };
            });
        };
    };

    const scrollIndex = document.querySelector("#latest");
    scrollIndex.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector("#readme").scrollIntoView({top: 0, behavior: "smooth"}, false);
    });
};

export {indexJSON};