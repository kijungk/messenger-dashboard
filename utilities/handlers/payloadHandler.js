module.exports = (function payloadHandler() {
  const
    Button = require('../models/Button'),
    Element = require('../models/Element'),
    Attachment = require('../models/Attachment'),
    Message = require('../models/Message'),
    QuickReply = require('../models/QuickReply');

  function processPayload(payload) {
    let
      buttons,
      elements,
      attachment,
      message;

    switch (payload) {
      case 'Home':
        buttons = [
          new Button('Agenda', 'postback', 'Agenda'),
          new Button('Experience', 'postback', 'Experience'),
          new Button('General Information', 'postback', 'GeneralInformation')
        ];

        elements = [
          new Element('Welcome to the demo application', 'Feel free to browse around!', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment);

        return message;

      case 'Agenda':
        elements = [
          new Element('Agenda Item 1', '9:00 am - 10:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 2', '10:00 am - 11:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 3', '11:00 am - 12:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Lunch', '12:00 pm - 1:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 5', '1:00 pm - 2:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 6', '2:00 pm - 3:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 7', '3:00 pm - 4:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Agenda Item 8', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000')
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment, [new QuickReply('Home', 'Home')]);

        return message

      case 'Experience':
        buttons = [
          new Button('Booths', 'postback', 'Booths')
        ];

        elements = [
          new Element('Experience and Learn', 'Earn SWAG using QR codes at each booth', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment, [new QuickReply('Home', 'Home')]);

        return message;

      case 'GeneralInformation':
        buttons = [
          new Button('Venue', 'postback', 'Venue'),
          new Button('Transport', 'postback', 'Transport'),
          new Button('Contact', 'postback', 'Contact')
        ];

        elements = [
          new Element('General Information', 'Find out more about this event', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment, [new QuickReply('Home', 'Home')])

        return message;

      case 'Booths':
        elements = [
          new Element('Booth 1', 'Booth 1 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 2', 'Booth 2 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 3', 'Booth 3 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 4', 'Booth 4 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 5', 'Booth 5 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 6', 'Booth 6 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 7', 'Booth 7 details', 'https://via.placeholder.com/1910x1000'),
          new Element('Booth 8', 'Booth 8 details', 'https://via.placeholder.com/1910x1000')
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment, [new QuickReply('Home', 'Home'), new QuickReply('Back', 'Experience')]);

        return message;

      default:
        message = new Message('I don\'t understand that input :(')

        return message;
    }
  }

  return {
    processPayload: processPayload
  }
})();