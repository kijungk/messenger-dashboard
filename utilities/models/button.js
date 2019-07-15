module.exports = class Button {
    constructor(title, type, payload) {
        this.title = title;
        this.type = type;

        switch (this.type) {
            case 'web_url':
                // new Button('Click me', 'web_url', 'facebook.com')
                this.url = payload;
                break;

            case 'postback':
                // new Button('Main Menu', 'postback', 'Home')
                this.payload = payload;
                break;
        }
    }
}