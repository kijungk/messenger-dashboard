module.exports = class Attachment {
    constructor(type, elements, text) {
        this.type = 'template';
        this.payload = {
            template_type = type
        }

        switch (type) {
            case 'button':
                // new Attachment('button', '[Buttons]', 'Choose one of the following options')
                this.payload.buttons = elements;
                this.payload.text = text;
                break;

            case 'generic':
                // new Attachment('generic', '[Elements]')
                this.payload.elements = elements;
                break;

            case 'list':
                // new Attachment('list', '[Elements]', 'compact')
                this.payload.elements = elements;
                this.payload.top_element_style = text;
                break;
        }
    }
}