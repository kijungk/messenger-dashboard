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
      message,
      quickReplies;

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

        break;

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

        quickReplies = [new QuickReply('Back', 'Home')];

        break;

      case 'Experience':
        buttons = [
          new Button('Booths', 'postback', 'Booths')
        ];

        elements = [
          new Element('Experience and Learn', 'Earn SWAG using QR codes at each booth', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Home')];

        break;

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

        quickReplies = [new QuickReply('Back', 'Experience'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothOneComplete':
        attachment = 'You completed Booth 1 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothTwoComplete':
        attachment = 'You completed Booth 2 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothThreeComplete':
        attachment = 'You completed Booth 3 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothFourComplete':
        attachment = 'You completed Booth 4 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothFiveComplete':
        attachment = 'You completed Booth 5 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothSixComplete':
        attachment = 'You completed Booth 6 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothSevenComplete':
        attachment = 'You completed Booth 7 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothEightComplete':
        attachment = 'You completed Booth 8 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'Booths'), new QuickReply('Home', 'Home')];

        break;

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

        quickReplies = [new QuickReply('Back', 'Home')];

        break;

      case 'Venue':
        buttons = [new Button('Website', 'web_url', 'https://www.ddp.or.kr/main')];

        attachment = new Attachment('button', buttons, 'This demo event will be held at Dongdaemun Design Plaza (DDP).\n\nYou can find more about the venue on its website!')

        quickReplies = [
          new QuickReply('Back', 'GeneralInformation'),
          new QuickReply('Home', 'Home')
        ]

        break;

      case 'Transport':
        buttons = [
          new Button('Metro', 'web_url', 'https://english.visitkorea.or.kr/enu/TRP/TP_ENG_6.jsp'),
          new Button('Bus', 'web_url', 'https://english.visitkorea.or.kr/enu/TRP/TP_ENG_5_1.jsp')
        ];

        attachment = new Attachment('button', buttons, 'You can get around Seoul via metro, bus, or a taxi.\n\nFind metro and bus routes near you to conveniently commute to the venue!')

        quickReplies = [
          new QuickReply('Back', 'GeneralInformation'),
          new QuickReply('Home', 'Home')
        ]

        break;

      case 'Contact':
        attachment = "You can find information kiosks at the venue during the event, or contact us via email.\n\nPlease forward all inquiries to xxxx@xxxx.xxx";

        quickReplies = [
          new QuickReply('Back', 'GeneralInformation'),
          new QuickReply('Home', 'Home')
        ]

        break;

      default:
        attachment = 'I don\'t understand that input :('

        quickReplies = [new QuickReply('Home', 'Home')];

        break;
    }

    message = new Message(attachment, quickReplies);

    return message;
  }

  return {
    processPayload: processPayload
  }
})();