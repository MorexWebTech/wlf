const queuedPopups = [];
let loadPhase = 0;

const head = document.getElementsByTagName("head")[0];
const link = document.createElement("link");

function loadPopups() {
    while (queuedPopups.length > 0) {
        queuedPopups.shift().init();
    }
}

link.rel = "stylesheet";
link.type = "text/css";
link.href = "https://cdn.jsdelivr.net/npm/@simondmc/popup-js@1.4.3/popup.min.css";
link.media = "all";
head.appendChild(link);

link.onload = function () {
    loadPhase += 1;
    if (loadPhase === 2) loadPopups();
};

window.addEventListener("load", () => {
    loadPhase += 1;
    if (loadPhase === 2) loadPopups();
});

class Popup {
    constructor(t = {}) {
        this.params = t;
        if (loadPhase === 2) {
            this.init();
        } else {
            queuedPopups.push(this);
        }
    }

    init() {
        this.id = this.params.id ?? "popup";
        this.title = this.params.title ?? "Popup Title";
        this.content = this.params.content ?? "Popup Content";
        this.titleColor = this.params.titleColor ?? "#000000";
        this.backgroundColor = this.params.backgroundColor ?? "#ffffff";
        this.closeColor = this.params.closeColor ?? "#000000";
        this.textColor = this.params.textColor ?? "#000000";
        this.linkColor = this.params.linkColor ?? "#383838";
        this.widthMultiplier = this.params.widthMultiplier ?? 1;
        this.heightMultiplier = this.params.heightMultiplier ?? 0.66;
        this.fontSizeMultiplier = this.params.fontSizeMultiplier ?? 1;
        this.borderRadius = this.params.borderRadius ?? "15px";
        this.sideMargin = this.params.sideMargin ?? "3%";
        this.titleMargin = this.params.titleMargin ?? "2%";
        this.lineSpacing = this.params.lineSpacing ?? "auto";
        this.showImmediately = this.params.showImmediately ?? false;
        this.showOnce = this.params.showOnce ?? false;
        this.fixedHeight = this.params.fixedHeight ?? false;
        this.allowClose = this.params.allowClose ?? true;
        this.underlineLinks = this.params.underlineLinks ?? false;
        this.fadeTime = this.params.fadeTime ?? "0.3s";
        this.buttonWidth = this.params.buttonWidth ?? "fit-content";
        this.borderWidth = this.params.borderWidth ?? "0";
        this.borderColor = this.params.borderColor ?? "#000000";
        this.disableScroll = this.params.disableScroll ?? true;
        this.textShadow = this.params.textShadow ?? "none";
        this.hideCloseButton = this.params.hideCloseButton ?? false;
        this.hideTitle = this.params.hideTitle ?? false;

        this.height = `min(${770 * this.heightMultiplier}px, ${90 * this.heightMultiplier}vw)`;
        this.width = `min(${770 * this.widthMultiplier}px, ${90 * this.widthMultiplier}vw)`;
        this.fontSize = `min(${25 * this.fontSizeMultiplier}px, ${4 * this.fontSizeMultiplier}vw)`;

        this.css = this.params.css ?? "";
        this.css += `
        .popup.${this.id} {
            transition-duration: ${this.fadeTime};
            text-shadow: ${this.textShadow};
            font-family: '${this.params.font ?? "Inter"}', 'Inter', Helvetica, sans-serif;
        }
        
        .popup.${this.id} .popup-content {
            background-color: ${this.backgroundColor};
            width: ${this.width}; 
            height: ${this.fixedHeight ? this.height : "unset"};
            border-radius: ${this.borderRadius};
            border: ${this.borderWidth} solid ${this.borderColor};
        }

        .popup.${this.id} .popup-header {
            margin-bottom: ${this.titleMargin};
        }

        .popup.${this.id} .popup-title {
            color: ${this.titleColor};
        }

        .popup.${this.id} .popup-close {
            color: ${this.closeColor};
        }

        .popup.${this.id} .popup-body {
            color: ${this.textColor};
            margin-left: ${this.sideMargin};
            margin-right: ${this.sideMargin};
            line-height: ${this.lineSpacing};
            font-size: ${this.fontSize};
        }

        .popup.${this.id} .popup-body button { 
            width: ${this.buttonWidth}; 
        }

        .popup.${this.id} .popup-body a { 
            color: ${this.linkColor};
            ${this.underlineLinks ? "text-decoration: underline;" : ""}
        }`;

        const styleEl = document.createElement("style");
        document.head.append(styleEl);
        styleEl.appendChild(document.createTextNode(this.css));

        // Format content
        this.content = this.content.split("\n");
        for (let i = 0; i < this.content.length; i++) {
            let line = this.content[i].trim();
            if (line !== "") {
                if (line.includes("§")) {
                    const parts = line.split("§");
                    line = `<p class="${parts[0].trim()}">${parts[1].trim()}</p>`;
                } else {
                    line = `<p>${line}</p>`;
                }

                line = line.replace(/  /g, "&nbsp;&nbsp;");
                while (/{a-(.*?)}\[(.*?)]/.test(line)) {
                    line = line.replace(/{a-(.*?)}\[(.*?)]/g, '<a href="$1" target="_blank">$2</a>');
                }

                while (/{btn-(.*?)}\[(.*?)]/.test(line)) {
                    line = line.replace(/{btn-(.*?)}\[(.*?)]/g, '<button class="$1">$2</button>');
                }

                line = line
                    .replace(/([^\\]?){/g, '$1<span class="')
                    .replace(/([^\\]?)}\[/g, '$1">')
                    .replace(/([^\\]?)]/g, "$1</span>");

                this.content[i] = line;
            }
        }

        this.content = this.content.join("");
        this.popupEl = document.createElement("div");
        this.popupEl.classList.add("popup", this.id);

        this.popupEl.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                ${this.hideTitle ? "" : `<div class="popup-title">${this.title}</div>`}
                ${this.allowClose && !this.hideCloseButton ? '<div class="popup-close">&times;</div>' : ""}
            </div>
            <div class="popup-body">${this.content}</div>
        </div>`;

        document.body.appendChild(this.popupEl);

        this.popupEl.addEventListener("click", (e) => {
            if (e.target.className === "popup-close" || e.target.classList.contains("popup")) {
                if (!this.allowClose) return;
                this.hide();
            }
        });

        if (this.params.loadCallback && typeof this.params.loadCallback === "function") {
            this.params.loadCallback();
        }

        if (this.showImmediately) {
            if (this.showOnce && localStorage && localStorage.getItem("popup-" + this.id)) return;
            this.popupEl.classList.add("fade-in");
            postShow(this.disableScroll);
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (!this.allowClose) return;
                this.hide();
            }
        });
    }

    show() {
        this.popupEl.classList.remove("fade-out");
        this.popupEl.classList.add("fade-in");
        postShow(this.params.disableScroll ?? true);
    }

    hide() {
        this.popupEl.classList.remove("fade-in");
        this.popupEl.classList.add("fade-out");
        if (localStorage && this.showOnce) {
            localStorage.setItem("popup-" + this.id, true);
        }
        postHide(this);
    }
}

function postShow(disable) {
    if (disable) disableScroll();
}

function postHide(instance) {
    if (instance.params.hideCallback && typeof instance.params.hideCallback === "function") {
        instance.params.hideCallback();
    }
    enableScroll();
}

function disableScroll() {
    const top = window.scrollY || document.documentElement.scrollTop;
    const left = window.scrollX || document.documentElement.scrollLeft;
    window.onscroll = function () {
        window.scrollTo(left, top);
    };
}

function enableScroll() {
    window.onscroll = function () {};
}
