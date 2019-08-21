module.exports = (function responseHandler() {
  const
    Button = require('../models/Button'),
    Element = require('../models/Element'),
    Attachment = require('../models/Attachment'),
    Message = require('../models/Message'),
    QuickReply = require('../models/QuickReply'),
    knex = require('../../db/knex'),
    { sendMessage } = require('../../utilities/handlers/sendHandler');

  function checkController(knex, eventDescription, controllerDescription) {
    return knex.raw(`
      SELECT
        c.active
      FROM
        controllers c
      JOIN
        events e
        ON e.id = c.event_id
        AND e.description = :eventDescription
      WHERE
        c.description = :controllerDescription
    `, {
        controllerDescription,
        eventDescription
      });
  }

  function receiveOrder(knex, eventDescription, productDescription, couponUserId, userId) {
    return knex.raw(`
      INSERT INTO
        orders (event_id, product_id, coupon_user_id, user_id)
      SELECT
        e.id,
        p.id,
        :couponUserId,
        :userId
      FROM
        products p
      JOIN
        vendors v
        ON v.id = p.vendor_id
      JOIN
        events e
        ON e.id = v.event_id
        AND e.description = :eventDescription
      WHERE
        p.description = :productDescription
      RETURNING
        id
    `, {
        eventDescription,
        productDescription,
        couponUserId,
        userId
      });
  }

  function checkProductInventory(knex, eventDescription, productDescription) {
    return knex.raw(`
        SELECT
          p.inventory
        FROM
          products p
        JOIN
         vendors v
         ON v.id = p.vendor_id
        JOIN
          events e
          ON e.id = v.event_id
          AND e.description = :eventDescription
        WHERE
          p.description = :productDescription
      `, {
        eventDescription,
        productDescription
      });
  }

  function checkVendorInventory(knex, productTypeDescription, eventDescription, vendorDescription) {
    return knex.raw(`
      SELECT
        p.description AS product_description,
        v.description AS vendor_description,
        p.inventory
      FROM
        products p
      JOIN
        product_types pt
        ON pt.id = p.product_type_id
        AND pt.description = :productTypeDescription
      JOIN
        vendors v
        ON v.id = p.vendor_id
        AND v.description = :vendorDescription
      JOIN
        events e
        ON e.id = v.event_id
        AND e.description = :eventDescription
      ORDER BY
        p.id
    `, {
        productTypeDescription,
        eventDescription,
        vendorDescription
      });
  }

  function checkProductTypeInventory(knex, productTypeDescription, eventDescription) {
    return knex.raw(`
        SELECT
          v.description AS vendor_description,
          p.description AS product_description,
          p.inventory
        FROM
          products p
        JOIN
          vendors v
          ON v.id = p.vendor_id
        JOIN
          events e
          ON e.id = v.event_id
          AND e.description = :eventDescription
        JOIN
          product_types pt
          ON pt.id = p.product_type_id
          AND pt.description = :productTypeDescription
        ORDER BY
          p.id
      `, {
        productTypeDescription,
        eventDescription
      });
  }

  function completeBooth(knex, userId, boothDescription) {
    return knex.raw(`
      INSERT INTO
        booths_users (booth_id, user_id)
      SELECT
        id,
        :userId
      FROM
        booths b
      WHERE
        b.description = :boothDescription
    `, {
        boothDescription,
        userId
      });
  }

  function checkBooth(knex, userId, boothDescription) {
    return knex.raw(`
      SELECT
        *
      FROM
        booths_users bu
      JOIN
        booths b
        ON b.id = bu.booth_id
        AND b.description = :boothDescription
      WHERE
        user_id = :userId
    `, {
        boothDescription,
        userId
      });
  }

  function checkBoothStatus(knex, userId) {
    return knex.raw(`
      SELECT
        *
      FROM
        booths_users
      WHERE
        user_id = :userId
    `, {
        userId
      });
  }

  function checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription) {
    return knex.raw(`
        SELECT
          o.id
        FROM
          orders o
        JOIN
          events e
          ON e.id = o.event_id
          AND e.description = :eventDescription
        JOIN
          products p
          ON p.id = o.product_id
        JOIN
          vendors v
          ON v.id = p.vendor_id
          AND v.description = :vendorDescription
        WHERE
          user_id = :userId
    `, {
        eventDescription,
        vendorDescription,
        userId
      });
  }

  function checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription) {
    return knex.raw(`
      SELECT
        cu.id
      FROM
        coupons_users cu
      JOIN
        coupons c
        ON c.id = cu.coupon_id
      JOIN
        events e
        ON e.id = c.event_id
        AND e.description = :eventDescription
      JOIN
        product_types pt
        ON pt.id = c.product_type_id
        AND pt.description = :productTypeDescription
      WHERE
        cu.redeemed = false
      AND cu.user_id = :userId
    `, {
        productTypeDescription,
        eventDescription,
        userId
      });
  }

  function checkCoupons(knex, userId) {
    return knex.raw(`
      SELECT
        *
      FROM
        coupons_users
      WHERE
        user_id = :userId
    `, {
        userId
      });
  }

  function assignCoupons(knex, userId, eventDescription) {
    return knex.raw(`
      INSERT INTO
        coupons_users (coupon_id, user_id)
      SELECT
        c.id,
        :userId
      FROM
        coupons c
      JOIN
        events e
        ON e.id = c.event_id
        AND e.description = :eventDescription
    `, {
        eventDescription,
        userId
      });
  }

  function redeemCoupon(knex, couponId) {
    return knex.raw(`
      UPDATE
        coupons_users
      SET
        redeemed = true
      WHERE
        id = :couponId
    `, {
        couponId
      });
  }

  function decreaseInventory(knex, eventDescription, productDescription) {
    return knex.raw(`
      UPDATE
        products
      SET
        inventory = inventory - 1
      FROM
        vendors,
        events
      WHERE
        vendors.id = products.vendor_id
      AND events.id = vendors.event_id
      AND events.description = :eventDescription
      AND products.description = :productDescription
    `, {
        eventDescription,
        productDescription
      });
  }

  function processFMS2019Response(accessToken, payload, userId, senderId) {
    const eventDescription = 'FMS 2019';

    let
      buttons,
      elements,
      attachment,
      message,
      quickReplies;

    let
      boothDescription,
      controllerDescription,
      couponRedeemed,
      productDescription,
      swagRedeemed,
      transactionComplete,
      vendorDescription,
      unusedCouponId;

    switch (payload) {
      case 'Register':
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

        return checkCoupons(knex, userId)
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              return assignCoupons(knex, userId, eventDescription);
            }

            return;
          })
          .then(() => {
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking and assigning coupons to users;
            return;
          });

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
          new Element('Booth 4', 'Participate and earn SWAG', 'https://via.placeholder.com/1910x1000', [new Button('Link', 'web_url', 'https://facebook.com')])
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'Booth'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'BoothStatus':
        return checkBoothStatus(knex, userId)
          .then((result) => {
            const count = result.rows.length;

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
            console.log(error);
            //error while getting status;
            return;
          });

      case 'BoothOneComplete':
        boothDescription = 'FMS 2019 Demo Booth 1';

        return checkBooth(knex, userId, boothDescription)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              swagRedeemed = true;
              return;
            }

            return completeBooth(knex, userId, boothDescription);
          })
          .then(() => {
            if (swagRedeemed) {
              attachment = `You've already completed ${boothDescription}! Check out what other booths are available!`;
            }

            if (!swagRedeemed) {
              attachment = `You\'ve completed ${boothDescription}. Check out what other booths are available!`;
            }

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while completing booth 1 for user
            return;
          });

      case 'BoothTwoComplete':
        boothDescription = 'FMS 2019 Demo Booth 2';

        return checkBooth(knex, userId, boothDescription)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              swagRedeemed = true;
              return;
            }

            return completeBooth(knex, userId, boothDescription);
          })
          .then(() => {
            if (swagRedeemed) {
              attachment = `You've already completed ${boothDescription}! Check out what other booths are available!`;
            }

            if (!swagRedeemed) {
              attachment = `You\'ve completed ${boothDescription}. Check out what other booths are available!`;
            }

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while completing booth 1 for user
            return;
          });

      case 'BoothThreeComplete':
        boothDescription = 'FMS 2019 Demo Booth 3';

        return checkBooth(knex, userId, boothDescription)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              swagRedeemed = true;
              return;
            }

            return completeBooth(knex, userId, boothDescription);
          })
          .then(() => {
            if (swagRedeemed) {
              attachment = `You've already completed ${boothDescription}! Check out what other booths are available!`;
            }

            if (!swagRedeemed) {
              attachment = `You\'ve completed ${boothDescription}. Check out what other booths are available!`;
            }

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while completing booth 1 for user
            return;
          });

      case 'BoothFourComplete':
        boothDescription = 'FMS 2019 Demo Booth 4';

        return checkBooth(knex, userId, boothDescription)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              swagRedeemed = true;
              return;
            }

            return completeBooth(knex, userId, boothDescription);
          })
          .then(() => {
            if (swagRedeemed) {
              attachment = `You've already completed ${boothDescription}! Check out what other booths are available!`;
            }

            if (!swagRedeemed) {
              attachment = `You\'ve completed ${boothDescription}. Check out what other booths are available!`;
            }

            quickReplies = [new QuickReply('Booths', 'BoothCarousel'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
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
          new Element('Beverage Menu', '12:00 pm ~ 5:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'BeverageMenu')]),
          new Element('Dessert Menu', '12:00 pm ~ 5:00 pm', 'https://via.placeholder.com/1910x1000', [new Button('Menu', 'postback', 'DessertMenu')])
        ];

        attachment = new Attachment('generic', elements);

        quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);

      case 'BreakfastMenu':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductTypeInventory(knex, productTypeDescription, eventDescription);
          })
          .then((result) => {
            const { rows } = result;

            const imageUrls = {
              'Fritz': 'https://via.placeholder.com/1910x1000',
              'Altdif': 'https://via.placeholder.com/1910x1000',
              'Four B': 'https://via.placeholder.com/1910x1000'
            }

            elements = rows.map((row) => {
              const payload = 'Breakfast' + row.vendor_description.replace(/ /g, '') + 'Confirmation';

              let buttonTitle = 'Order';

              if (!row.inventory) {
                buttonTitle = 'Out of Stock';
              }

              if (couponRedeemed) {
                buttonTitle = 'No Coupons Available';
              }

              return new Element(row.vendor_description, row.product_description, imageUrls[row.vendor_description], [new Button(buttonTitle, 'postback', payload)])
            });

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon usage and product inventory
            return;
          });

      case 'BreakfastFritzConfirmation':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'BreakfastFritzComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'BreakfastFritzComplete':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'BreakfastAltdifConfirmation':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'BreakfastAltdifComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'BreakfastAltdifComplete':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'BreakfastFourBConfirmation':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option C';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'BreakfastFourBComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'BreakfastFourBComplete':
        controllerDescription = 'Breakfast';
        productTypeDescription = 'Breakfast';
        productDescription = 'Breakfast Option C';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BreakfastMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'LunchMenu':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductTypeInventory(knex, productTypeDescription, eventDescription);
          })
          .then((result) => {
            const { rows } = result;

            const imageUrls = {
              'Lunch Vendor A': 'https://via.placeholder.com/1910x1000',
              'Lunch Vendor B': 'https://via.placeholder.com/1910x1000',
              'Lunch Vendor C': 'https://via.placeholder.com/1910x1000'
            }

            elements = rows.map((row) => {
              const payload = row.vendor_description.replace(/ /g, '') + 'Confirmation';
              let buttonTitle = 'Order';

              if (!row.inventory) {
                buttonTitle = 'Out of Stock';
              }

              if (couponRedeemed) {
                buttonTitle = 'No Coupons Available';
              }

              return new Element(row.vendor_description, row.product_description, imageUrls[row.vendor_description], [new Button(buttonTitle, 'postback', payload)])
            });

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon usage and product inventory
            return;
          });

      case 'LunchVendorAConfirmation':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'LunchVendorAComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'LunchVendorAComplete':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'LunchVendorBConfirmation':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'LunchVendorBComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'LunchVendorBComplete':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'LunchVendorCConfirmation':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option C';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'LunchVendorCComplete'), new QuickReply('Cancel', 'BreakfastMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'LunchVendorCComplete':
        controllerDescription = 'Lunch';
        productTypeDescription = 'Lunch';
        productDescription = 'Lunch Option C';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'LunchMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'BeverageMenu':
        controllerDescription = 'Beverage';
        productTypeDescription = 'Beverage';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            let buttonTitle = 'Menu';

            if (!count) {
              buttonTitle = 'No Coupons Available';
            }

            elements = [
              new Element('Fritz', 'Beverage Menu', 'https://via.placeholder.com/1910x1000', [new Button(buttonTitle, 'postback', 'BeverageFritzMenu')]),
              new Element('Altdif', 'Beverage Menu', 'https://via.placeholder.com/1910x1000', [new Button(buttonTitle, 'postback', 'BeverageAltdifMenu')]),
              new Element('Four B', 'Beverage Menu', 'https://via.placeholder.com/1910x1000', [new Button(buttonTitle, 'postback', 'BeverageFourBMenu')])
            ];

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking for beverage coupon usage
            return;
          });









      case 'BeverageFritzMenu':
        controllerDescription = 'Beverage';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkVendorInventory(knex, productTypeDescription, eventDescription, vendorDescription);
          })
          .then((result) => {
            const { rows } = result;
            const imageUrls = {
              '따뜻한 라떼': 'https://via.placeholder.com/1910x1000',
              '차가운 라떼': 'https://via.placeholder.com/1910x1000',
              '따뜻한 아메리카노': 'https://via.placeholder.com/1910x1000',
              '차가운 콜드브루': 'https://via.placeholder.com/1910x1000'
            }

            elements = rows.map((row) => {
              const payload = row.vendor_description.replace(/ /g, '') + row.product_description.replace(/ /g, '') + 'Confirmation';
              let buttonTitle = 'Order';

              if (!row.inventory) {
                buttonTitle = 'Out of Stock';
              }

              if (couponRedeemed) {
                buttonTitle = 'No Coupons Availalble';
              }

              return new Element(row.vendor_description, row.product_description, imageUrls[row.product_description], [new Button(buttonTitle, 'postback', payload)]);
            });

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking vendor inventory
            return;
          });

      case 'Fritz따뜻한라떼Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 라떼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Fritz따뜻한라떼Complete'), new QuickReply('Cancel', 'BeverageFritzMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz따뜻한라떼Complete':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 라떼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz차가운라떼Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 라떼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Fritz차가운라떼Complete'), new QuickReply('Cancel', 'BeverageFritzMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz차가운라떼Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 라떼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz따뜻한아메리카노Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 아메리카노';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Fritz따뜻한아메리카노Complete'), new QuickReply('Cancel', 'BeverageFritzMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz따뜻한아메리카노Complete':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 아메리카노';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz차가운콜드브루Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 콜드브루';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Fritz차가운콜드브루Complete'), new QuickReply('Cancel', 'BeverageFritzMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Fritz차가운콜드브루Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 콜드브루';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Fritz';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFritzMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });













      case 'BeverageAltdifMenu':
        controllerDescription = 'Beverage';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkVendorInventory(knex, productTypeDescription, eventDescription, vendorDescription);
          })
          .then((result) => {
            const { rows } = result;
            const imageUrls = {
              '따뜻한 논알콜 뱅쇼': 'https://via.placeholder.com/1910x1000',
              '차가운 논알콜 뱅쇼 에이드': 'https://via.placeholder.com/1910x1000',
              '차가운 샹들리에 블랙티 에이드': 'https://via.placeholder.com/1910x1000',
              '차가운 벨벳 클라우드 밀크티': 'https://via.placeholder.com/1910x1000'
            }

            elements = rows.map((row) => {
              const payload = row.vendor_description.replace(/ /g, '') + row.product_description.replace(/ /g, '') + 'Confirmation';
              let buttonTitle = 'Order';

              if (!row.inventory) {
                buttonTitle = 'Out of Stock';
              }

              if (couponRedeemed) {
                buttonTitle = 'No Coupons Availalble';
              }

              return new Element(row.vendor_description, row.product_description, imageUrls[row.product_description], [new Button(buttonTitle, 'postback', payload)]);
            });

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking vendor inventory
            return;
          });

      case 'Altdif따뜻한논알콜뱅쇼Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 논알콜 뱅쇼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Altdif따뜻한논알콜뱅쇼Complete'), new QuickReply('Cancel', 'BeverageAltdifMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif따뜻한논알콜뱅쇼Complete':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 논알콜 뱅쇼';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif'

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운논알콜뱅쇼에이드Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 논알콜 뱅쇼 에이드';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Altdif차가운논알콜뱅쇼에이드Complete'), new QuickReply('Cancel', 'BeverageAltdifMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운논알콜뱅쇼에이드Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 논알콜 뱅쇼 에이드';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운샹들리에블랙티에이드Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 샹들리에 블랙티 에이드';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Altdif차가운샹들리에블랙티에이드Complete'), new QuickReply('Cancel', 'BeverageAltdifMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운샹들리에블랙티에이드Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 샹들리에 블랙티 에이드';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운벨벳클라우드밀크티Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 벨벳 클라우드 밀크티';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'Altdif차가운벨벳클라우드밀크티Complete'), new QuickReply('Cancel', 'BeverageAltdifMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'Altdif차가운벨벳클라우드밀크티Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 벨벳 클라우드 밀크티';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Altdif';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageAltdifMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });








      case 'BeverageFourBMenu':
        controllerDescription = 'Beverage';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkVendorInventory(knex, productTypeDescription, eventDescription, vendorDescription);
          })
          .then((result) => {
            const { rows } = result;
            const imageUrls = {
              '따뜻한 롱블랙': 'https://via.placeholder.com/1910x1000',
              '차가운 롱블랙': 'https://via.placeholder.com/1910x1000',
              '따뜻한 플랫화이트': 'https://via.placeholder.com/1910x1000',
              '차가운 플랫화이트': 'https://via.placeholder.com/1910x1000'
            }

            elements = rows.map((row) => {
              const payload = row.vendor_description.replace(/ /g, '') + row.product_description.replace(/ /g, '') + 'Confirmation';
              let buttonTitle = 'Order';

              if (!row.inventory) {
                buttonTitle = 'Out of Stock';
              }

              if (couponRedeemed) {
                buttonTitle = 'No Coupons Availalble';
              }

              return new Element(row.vendor_description, row.product_description, imageUrls[row.product_description], [new Button(buttonTitle, 'postback', payload)]);
            });

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking vendor inventory
            return;
          });

      case 'FourB따뜻한롱블랙Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 롱블랙';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'FourB따뜻한롱블랙Complete'), new QuickReply('Cancel', 'BeverageFourBMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB따뜻한롱블랙Complete':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 롱블랙';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B'

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();


            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB차가운롱블랙Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 롱블랙';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'FourB차가운롱블랙Complete'), new QuickReply('Cancel', 'BeverageFourBMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB차가운롱블랙Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 롱블랙';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB따뜻한플랫화이트Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 플랫화이트';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'FourB따뜻한플랫화이트Complete'), new QuickReply('Cancel', 'BeverageFourBMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB따뜻한플랫화이트Complete':
        controllerDescription = 'Beverage';
        productDescription = '따뜻한 플랫화이트';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB차가운플랫화이트Confirmation':
        controllerDescription = 'Beverage';
        productDescription = '차가운 플랫화이트';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Confirm Order', 'It is difficult to cancel an order!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Confirm', 'FourB차가운플랫화이트Complete'), new QuickReply('Cancel', 'BeverageFourBMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });

      case 'FourB차가운플랫화이트Complete':
        controllerDescription = 'Beverage';
        productDescription = '차가운 플랫화이트';
        productTypeDescription = 'Beverage';
        vendorDescription = 'Four B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkBeverageOrderByVendor(knex, userId, vendorDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'BeverageFourBMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'BeverageMenu'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              return receiveOrder(knex, eventDescription, productDescription, unusedCouponId, userId);
            }

            return;
          })
          .then((result) => {
            const row = result.rows[0];
            let { id } = row;
            id = id.toString();

            if (id) {
              attachment += `\n\nThe order number is ${id.padStart(4, '0')}.`
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking inventory
            return;
          });













      case 'DessertMenu':
        controllerDescription = 'Dessert';
        productTypeDescription = 'Dessert A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductTypeInventory(knex, productTypeDescription, eventDescription);
          })
          .then((result) => {
            const row = result.rows[0];

            const payload = row.vendor_description.replace(/ /g, '') + 'Confirmation';
            let buttonTitle = 'Order';

            if (!row.inventory) {
              buttonTitle = 'Out of Stock';
            }

            if (couponRedeemed) {
              buttonTitle = 'No Coupons Available';
            }

            elements = [new Element(row.vendor_description, row.product_description, 'https://via.placeholder.com/1910x1000', [new Button(buttonTitle, 'postback', payload)])]

            productTypeDescription = 'Dessert B';
            couponRedeemed = false;

            return checkController(knex, eventDescription, controllerDescription);
          })
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription);
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductTypeInventory(knex, productTypeDescription, eventDescription);
          })
          .then((result) => {
            const row = result.rows[0];

            const payload = row.vendor_description.replace(/ /g, '') + 'Confirmation';
            let buttonTitle = 'Order';

            if (!row.inventory) {
              buttonTitle = 'Out of Stock';
            }

            if (couponRedeemed) {
              buttonTitle = 'No Coupons Available';
            }

            elements.push(new Element(row.vendor_description, row.product_description, 'https://via.placeholder.com/1910x1000', [new Button(buttonTitle, 'postback', payload)]));

            attachment = new Attachment('generic', elements);

            quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon usage and product inventory
            return;
          });

      case 'DessertVendorAConfirmation':
        controllerDescription = 'Dessert';
        productTypeDescription = 'Dessert A';
        productDescription = 'Dessert Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'DessertMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'DessertVendorAComplete'), new QuickReply('Cancel', 'DessertMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'DessertVendorAComplete':
        controllerDescription = 'Dessert';
        productTypeDescription = 'Dessert A';
        productDescription = 'Dessert Option A';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'DessertMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'DessertVendorBConfirmation':
        controllerDescription = 'Dessert';
        productTypeDescription = 'Dessert B';
        productDescription = 'Dessert Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (!count) {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'DessertMenu'), new QuickReply('Home', 'Home')];
            }


            if (!couponRedeemed && inventory) {
              elements = [new Element('Order Complete', 'Show this to a staff\nThe button below is for staff only!', 'https://via.placeholder.com/1910x1000')];

              attachment = new Attachment('generic', elements);

              quickReplies = [new QuickReply('Staff Confirm', 'DessertVendorBComplete'), new QuickReply('Cancel', 'DessertMenu')];
            }

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking coupon eligibility;
            return;
          });

      case 'DessertVendorBComplete':
        controllerDescription = 'Dessert';
        productTypeDescription = 'Dessert B';
        productDescription = 'Dessert Option B';

        return checkController(knex, eventDescription, controllerDescription)
          .then((result) => {
            const { active } = result.rows[0];

            if (!active) {
              couponRedeemed = true;
            }

            return checkUnusedCoupon(knex, userId, productTypeDescription, eventDescription)
          })
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              unusedCouponId = result.rows[0].id;
            } else {
              couponRedeemed = true;
            }

            return checkProductInventory(knex, eventDescription, productDescription);
          })
          .then((result) => {
            const { inventory } = result.rows[0];

            if (couponRedeemed) {
              attachment = 'You do not have a coupon to use for this item!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && !inventory) {
              attachment = 'This item is out of stock!';

              quickReplies = [new QuickReply('Back', 'DessertMenu'), new QuickReply('Home', 'Home')];
            }

            if (!couponRedeemed && inventory) {
              attachment = 'You have successfully redeemed this coupon!';

              quickReplies = [new QuickReply('Back', 'MobileOrderMenus'), new QuickReply('Home', 'Home')];

              transactionComplete = true;
            }

            return;
          })
          .then(() => {
            if (transactionComplete) {
              const promises = [
                redeemCoupon(knex, unusedCouponId),
                decreaseInventory(knex, eventDescription, productDescription)
              ];

              return Promise.all(promises);
            }

            return;
          })
          .then(() => {
            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while redeeming coupon;
            return;
          });

      case 'MobileOrderStatus':
        return knex.raw(`
          SELECT
            pt.description,
            cu.redeemed
          FROM
            coupons_users cu
          JOIN
            coupons c
            ON c.id = cu.coupon_id
          JOIN
            events e
            ON e.id = c.event_id
            AND e.description = :eventDescription
          JOIN
            product_types pt
            ON pt.id = c.product_type_id
          WHERE
            cu.user_id = :userId
          ORDER BY
            pt.description
        `, {
            eventDescription,
            userId
          })
          .then((result) => {
            const
              { rows } = result,
              redeemedCoupons = [],
              usableCoupons = [];

            if (!rows.length) {
              attachment = 'You need to register at the event to receive digital vouchers!';
            }

            let
              redeemedText = '',
              usableText = '';

            rows.forEach((coupon) => {
              if (coupon.redeemed) {
                redeemedCoupons.push(coupon);
              }

              usableCoupons.push(coupon);
            });

            if (redeemedCoupons.length) {
              redeemedText = '[Redeemed Coupons]';

              redeemedCoupons.forEach((coupon) => {
                redeemedText += `\n${coupon.description} coupon`
              });
            }

            if (usableCoupons.length) {
              usableText = '[Usable Coupons]';

              usableCoupons.forEach((coupon) => {
                usableText += `\n${coupon.description} coupon`
              });
            }

            if (redeemedText) {
              attachment = redeemedText + '\n\n' + usableText;
            }

            if (!redeemedText && usableText) {
              attachment = redeemedText + usableText;
            }

            quickReplies = [new QuickReply('Back', 'MobileOrder'), new QuickReply('Home', 'Home')];

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            //error while checking for coupons;
            return;
          });

      case 'SurveyComplete':
        const title = 'Thank you for your feedback!';

        let
          subtitle,
          imageUrl;

        boothDescription = 'FMS 2019 Exit Survey';

        return checkBooth(knex, userId, boothDescription)
          .then((result) => {
            const count = result.rows.length;

            if (count) {
              swagRedeemed = true;
              return;
            }

            return completeBooth(knex, userId, boothDescription);
          })
          .then(() => {
            if (swagRedeemed) {
              subtitle = 'It seems you\'ve already completed this survey';
              imageUrl = 'https://via.placeholder.com/1910x1000';
              quickReplies = [new QuickReply('Home', 'Home')];
            }

            if (!swagRedeemed) {
              subtitle = 'Please show this menu and button to a staff for SWAG!';
              imageUrl = 'https://via.placeholder.com/1910x1000';
              quickReplies = [new QuickReply('Complete', 'Home')];
            }

            elements = [
              new Element(title, subtitle, imageUrl)
            ];

            attachment = new Attachment('generic', elements);

            message = new Message(attachment, quickReplies);
            return sendMessage(accessToken, senderId, message);
          })
          .catch((error) => {
            console.log(error);
            return;
          });

      default:
        attachment = 'I don\'t understand that input :('

        quickReplies = [new QuickReply('Home', 'Home')];

        message = new Message(attachment, quickReplies);
        return sendMessage(accessToken, senderId, message);
    }
  }

  function processCXO2019Response(accessToken, payload, userId, senderId) {
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