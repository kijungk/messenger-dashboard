module.exports = class Button {
    constructor(title, type, payload) {
        this.title = title;
        this.type = type;

        switch (this.type) {
            case 'web_url':
                this.url = payload;
                break;

            case 'postback':
                this.payload = payload;
                break;
        }
    }
}