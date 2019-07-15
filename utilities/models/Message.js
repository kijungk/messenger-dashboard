const Attachment = require('../models/Attachment');

module.exports = class Message {
    constructor(attachment) {
        switch (true) {
            case typeof attachment === 'string':
                this.text = attachment;
                break;

            case attachment instanceof Attachment:
                this.attachment = attachment;
                break;
        }
    }
}