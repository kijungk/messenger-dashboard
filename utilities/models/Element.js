module.exports = class Element {
    constructor(title, subtitle, imageUrl, buttons) {
        this.title = title;
        this.subtitle = subtitle;
        this.image_url = imageUrl;
        this.buttons = buttons;
    }
}