module.exports = (function responseHandler() {
  const
    Button = require('../models/Button'),
    Element = require('../models/Element'),
    Attachment = require('../models/Attachment'),
    Message = require('../models/Message'),
    QuickReply = require('../models/QuickReply');

  function processFMS2019Response(payload) {
    let
      buttons,
      elements,
      attachment,
      message,
      quickReplies;

    switch (payload) {
      case 'Home':
        buttons = [
          new Button('Agenda', 'postback', 'AgendaCarousel'),
          new Button('Experience', 'postback', 'Experience'),
          new Button('Feedback', 'web_url', 'https://surveymonkey.com')
        ];

        elements = [
          new Element('Welcome to the demo application', 'Feel free to browse around!', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        break;

      case 'AgendaCarousel':
        elements = [
          new Element('Agenda Item 1', '9:00 am - 10:00 am', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 2', '10:00 am - 11:00 am', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 3', '11:00 am - 12:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 4', '12:00 pm - 1:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 5', '1:00 pm - 2:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 6', '2:00 pm - 3:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 7', '3:00 pm - 4:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 8', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 9', '5:00 pm - 6:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Agenda Item 10', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')])
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Home')];

        break;

      case 'Experience':
        buttons = [
          new Button('Map', 'web_url', 'https://rekarchitect.com/wp-content/uploads/2018/07/Harrison-ranch.jpg'),
          new Button('Booth', 'postback', 'Booth'),
          new Button('Mobile Order', 'postback', 'MobileOrder')
        ];

        elements = [
          new Element('Experience and Learn', 'Earn SWAG using QR codes at each booth', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Home')];

        break;

      case 'Booth':
        buttons = [
          new Button('Start', 'postback', 'BoothCarousel'),
          new Button('Check Current Status', 'postback', 'BoothStatus')
        ];

        attachment = new Attachment('button', buttons, 'Text on how to participate in booths and scavenger hunt.\n\nWill also lay out the rules in obtaining a gift.');

        quickReplies = [new QuickReply('Back', 'Experience'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothCarousel':
        elements = [
          new Element('Booth 1', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Booth 2', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Booth 3', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Booth 4', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
          new Element('Booth 5', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')]),
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Booth'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothStatus':
        attachment = 'Under construction';

        quickReplies = [new QuickReply('Back', 'Booth'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothOneComplete':
        attachment = 'You completed Booth 1 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothTwoComplete':
        attachment = 'You completed Booth 2 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothThreeComplete':
        attachment = 'You completed Booth 3 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothFourComplete':
        attachment = 'You completed Booth 4 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

        break;

      case 'BoothFiveComplete':
        attachment = 'You completed Booth 5 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

        quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

        break;

      case 'MobileOrder':
        buttons = [
          new Button('Menu & Order', 'postback', 'MobileOrderMenu'),
          new Button('Order Status Check', 'postback', 'MobileOrderStatus')
        ];

        attachment = new Attachment('button', buttons, 'Text explanation of the mobile ordering system.\n\nShould be detailed.');

        quickReplies = [new QuickReply('Back', 'Experience'), new QuickReply('Home', 'Home')];

        break;

      case 'MobileOrderMenu':
        elements = [
          new Element('Food 1', 'Burgers', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'FoodOneMenu')]),
          new Element('Food 2', 'Pizza', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'FoodTwoMenu')]),
          new Element('Food 3', 'Snacks', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'FoodThreeMenu')]),
          new Element('Beverage 1', 'Coffee', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'BeverageOneMenu')]),
          new Element('Beverage 2', 'Juice', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'BeverageTwoMenu')]),
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

        break;

      case 'FoodOneMenu':
        elements = [
          new Element('Plain Burger', '100% organic', null, [new Button('Order', 'postback', 'FoodOneItemOne')]),
          new Element('Cheese Burger', 'Smoked gouda', null, [new Button('Order', 'postback', 'FoodOneItemTwo')]),
          new Element('Super Burger', 'Voted #1', null, [new Button('Order', 'postback', 'FoodOneItemTwo')]),
        ];

        attachment = new Attachment('list', elements, 'compact');

        quickReplies = [new QuickReply('Back', 'MobileOrderMenu'), new QuickReply('Home', 'Home')];

        break;

      case 'FoodOneItemOne':
        attachment = 'Confirm order for Plain Burger?';

        quickReplies = [new QuickReply('Yes', 'FoodOneItemOneConfirm'), new QuickReply('No', 'FoodOneMenu')];

        break;

      case 'FoodOneItemOneConfirm':
        attachment = 'Thank you for your order.\n\nYou can check the status of your order in the Mobile Order menu.\n\nWhen the dish is prepared, you\'ll receive a Push Notification from this page';

        quickReplies = [new QuickReply('Mobile Order', 'MobileOrder'), new QuickReply('Home', 'Home')];

        break;

      case 'FoodOneItemTwo':
        attachment = 'Confirm order for Cheese Burger?';

        quickReplies = [new QuickReply('Yes', 'FoodOneItemTwoConfirm'), new QuickReply('No', 'FoodOneMenu')];

        break;

      case 'FoodOneItemTwoConfirm':
        attachment = 'Thank you for your order.\n\nYou can check the status of your order in the Mobile Order menu.\n\nWhen the dish is prepared, you\'ll receive a Push Notification from this page';

        quickReplies = [new QuickReply('Mobile Order', 'MobileOrder'), new QuickReply('Home', 'Home')];

        break;

      case 'FoodOneItemThree':
        attachment = 'Confirm order for Super Burger?';

        quickReplies = [new QuickReply('Yes', 'FoodOneItemThreeConfirm'), new QuickReply('No', 'FoodOneMenu')];

        break;

      case 'FoodOneItemThreeConfirm':
        attachment = 'Thank you for your order.\n\nYou can check the status of your order in the Mobile Order menu.\n\nWhen the dish is prepared, you\'ll receive a Push Notification from this page';

        quickReplies = [new QuickReply('Mobile Order', 'MobileOrder'), new QuickReply('Home', 'Home')];

        break;

      case 'MobileOrderStatus':

        attachment = 'Under construction';

        quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

        break;

      default:
        attachment = 'I don\'t understand that input :('

        quickReplies = [new QuickReply('Home', 'Home')];

        break;
    }

    message = new Message(attachment, quickReplies);

    return message;
  }


  function processOXC2019Response(payload) {
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
          new Button('General Information', 'postback', 'GeneralInformation'),
          new Button('Survey', 'postback', 'Experience')
        ];

        elements = [
          new Element('Welcome to the demo application', 'Feel free to browse around!', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        break;

      case 'Agenda':
        elements = [
          new Element('OxC Item 1', '9:00 am - 10:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 2', '10:00 am - 11:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 3', '11:00 am - 12:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('Lunch', '12:00 pm - 1:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 5', '1:00 pm - 2:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 6', '2:00 pm - 3:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 7', '3:00 pm - 4:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('OxC Item 8', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000')
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Home')];

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
        buttons = [new Button('Website', 'web_url', 'https://www.shilla.net/seoul/index.do')];

        attachment = new Attachment('button', buttons, 'This demo event will be held at Seoul Shilla Hotel.\n\nYou can find more about the venue on its website!')

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
    processFMS2019Response: processFMS2019Response,
    processOXC2019Response: processOXC2019Response
  }
})();