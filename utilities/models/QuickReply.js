module.exports = class QuickReply {
    constructor(title, payload) {
        this.content_type = 'text';
        this.title = title;
        this.payload = payload;
    }
}