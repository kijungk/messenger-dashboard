module.exports = (function responseHandler() {
  const
    Button = require('../models/Button'),
    Element = require('../models/Element'),
    Attachment = require('../models/Attachment'),
    Message = require('../models/Message'),
    QuickReply = require('../models/QuickReply'),
    knex = require('../../db/knex'),
    { sendMessage } = require('../../utilities/handlers/sendHandler'),
    appEventEmitter = require('../eventEmitters');

  function processFMS2019Response(accessToken, payload, userId, senderId, response) {
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
          new Element('FMS Seoul 2019', 'FMS Seoul 2019에 오신 여러분 환영합니다! 다음 메뉴에서 원하는 항목을 선택해주세요.', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment);
        return sendMessage(accessToken, senderId, message);

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

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

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

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'Booth':
        buttons = [
          new Button('Start', 'postback', 'BoothCarousel'),
          new Button('Check Current Status', 'postback', 'BoothStatus')
        ];

        attachment = new Attachment('button', buttons, 'Text on how to participate in booths and scavenger hunt.\n\nWill also lay out the rules in obtaining a gift.');

        quickReplies = [new QuickReply('Back', 'Experience'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

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

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'BoothStatus':
        return knex('booths_users')
          .count('booths_users.id')
          .join('booths', 'booths_users.booth_id', '=', 'booths.id')
          .join('events', function() {
            this.on('events.id', '=', 'booths.event_id').andOn('events.id', '=', 1);
          })
          .where({
            user_id: userId
          })
          .then((result) => {
            const count = result[0].count;

            attachment = `You have completed ${count} scavenger hunt!\n\n`;

            if (count < 2) {
              attachment += 'You must complete 2 scavenger hunts to receive SWAG~';
            }

            attachment += 'You can redeem your SWAG!';

            quickReplies = [new QuickReply('Back', 'Booth'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while getting status;
          });

      case 'BoothOneComplete':
        return knex('booths_users').where({ booth_id: 1, user_id: userId })
          .then((result) => {
            if (result.length) {
              return;
            }

            return knex('booths_users').insert({
              user_id: userId,
              booth_id: 1
            })
          })
          .then((result) => {
            attachment = 'You completed Booth 1 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while completing booth 1 for user
            return;
          });

      case 'BoothTwoComplete':
        return knex('booths_users').where({ booth_id: 2, user_id: userId })
          .then((result) => {
            if (result.length) {
              return;
            }

            return knex('booths_users').insert({
              user_id: userId,
              booth_id: 2
            })
          })
          .then((result) => {
            attachment = 'You completed Booth 2 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while completing booth 1 for user
            return;
          });

      case 'BoothThreeComplete':
        return knex('booths_users').where({ booth_id: 3, user_id: userId })
          .then((result) => {
            if (result.length) {
              return;
            }

            return knex('booths_users').insert({
              user_id: userId,
              booth_id: 3
            })
          })
          .then((result) => {
            attachment = 'You completed Booth 3 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while completing booth 1 for user
            return;
          });

      case 'BoothFourComplete':
        return knex('booths_users').where({ booth_id: 4, user_id: userId })
          .then((result) => {
            if (result.length) {
              return;
            }

            return knex('booths_users').insert({
              user_id: userId,
              booth_id: 4
            })
          })
          .then((result) => {
            attachment = 'You completed Booth 4 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while completing booth 1 for user
            return;
          });

      case 'BoothFiveComplete':
        return knex('booths_users').where({ booth_id: 5, user_id: userId })
          .then((result) => {
            if (result.length) {
              return;
            }

            return knex('booths_users').insert({
              user_id: userId,
              booth_id: 5
            })
          })
          .then((result) => {
            attachment = 'You completed Booth 5 scavenger hunt!\n\nFeel free to see what\'s happening at this booth, or check out the other booths available.';

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while completing booth 1 for user
            return;
          });

      case 'MobileOrder':
        buttons = [
          new Button('Menu & Order', 'postback', 'MobileOrderMenus'),
          new Button('Order Status Check', 'postback', 'MobileOrderStatus')
        ];

        attachment = new Attachment('button', buttons, 'Text explanation of the mobile ordering system.\n\nShould be detailed.');

        quickReplies = [new QuickReply('Back', 'Experience'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'MobileOrderMenus':
        elements = [
          new Element('Breakfast Menu', '9:00 am ~ 11:00 am', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'BreakfastMenu')]),
          new Element('Lunch Menu', '12:00 pm ~ 1:30 pm', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'LunchMenu')]),
          new Element('Beverage and Dessert', '12:00 pm ~ 5:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'BeverageAndDessertMenu')])
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'BreakfastMenu':
        elements = [
          new Element('Vendor A', 'Breakfast Option 1', 'https://via.placeholder.com/1910x1000', [new Button('Order', 'postback', 'BreakfastVendorAConfirmation')]),
          new Element('Vendor B', 'Breakfast Option 2', 'https://via.placeholder.com/1910x1000', [new Button('Order', 'postback', 'BreakfastVendorBConfirmation')]),
          new Element('Vendor C', 'Breakfast Option 3', 'https://via.placeholder.com/1910x1000', [new Button('Order', 'postback', 'BreakfastVendorCConfirmation')])
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'BreakfastVendorAConfirmation':
        //check coupon count in coupons_users; if > 0, send different message.
        return knex.raw(`
          SELECT
            *
          FROM
            coupons_users
          WHERE
            user_id = ?
          AND
            coupon_id = 1
        `, userId)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              //user redeemed coupon already
              attachment = 'You already redeemed your breakfast coupon!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];

              message = new Message(attachment, quickReplies);
              return sendMessage(accessToken, senderId, message);
            }

            elements = [
              new Element('Order Completed - Redeem at Vendor A Booth', 'The confirmation button below is for staff', 'https://via.placeholder.com/1910x1000')
            ];

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Staff Confirm', 'BreakfastVendorAComplete'), new QuickReply('Cancel', 'BreakfastMenu')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            //error while checking breakfast coupon redemption status
          });


      case 'BreakfastVendorAComplete':
        //insert into coupons (userId/couponId);
        console.log('outer hit');
        return knex.raw(`
          INSERT INTO
            coupons_users (coupon_id, user_id)
          VALUES
            (1, ?)
          RETURNING
            id
        `, userId)
          .then((result) => {
            console.log('please hit');
            attachment = 'You have used your breakfast coupon! You will not be allowed to redeem any more breakfast items.';

            quickReplies = [new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accesToken, senderId, message);
          })
          .catch((error) => {
            //error while redeeming coupon;
          });







      case 'MobileOrderStatus':

        attachment = 'Under construction';

        quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      default:
        attachment = 'I don\'t understand that input :('

        quickReplies = [new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);
    }
  }


  function processCXO2019Response(accessToken, payload, userId, senderId, response) {
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
          new Button('Map', 'web_url', 'https://rekarchitect.com/wp-content/uploads/2018/07/Harrison-ranch.jpg'),
          new Button('Feedback', 'web_url', 'https://surveymonkey.com')
        ];

        elements = [
          new Element('Welcome to the demo application', 'Feel free to browse around!', 'https://via.placeholder.com/1910x1000', buttons)
        ];

        attachment = new Attachment('generic', elements);

        message = new Message(attachment);

        return sendMessage(accessToken, senderId, message);

      case 'Agenda':
        elements = [
          new Element('CxO Item 1', '9:00 am - 10:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 2', '10:00 am - 11:00 am', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 3', '11:00 am - 12:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 4', '12:00 pm - 1:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 5', '1:00 pm - 2:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 6', '2:00 pm - 3:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 7', '3:00 pm - 4:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 8', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 9', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000'),
          new Element('CxO Item 10', '4:00 pm - 5:00 pm', 'https://via.placeholder.com/1910x1000')
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Home')];

        message = new Message(attachment, quickReplies);

        return sendMessage(accessToken, senderId, message);

      default:
        attachment = 'I don\'t understand that input :('

        quickReplies = [new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);

        return sendMessage(accessToken, senderId, message);
    }
  }

  return {
    processFMS2019Response: processFMS2019Response,
    processCXO2019Response: processCXO2019Response
  }
})();