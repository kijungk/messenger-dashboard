module.exports = (function () {
  //const responseBuilder = require('../builders/responseBuilder');

  function processPayload(payload) {
    let message = null;
    switch (payload) {
      case 'Home':
        // message = responseBuilder.home();
        message = {
          text: 'hello world'
        };
        return message;

        // case 'General_Information':
        //   message = responseBuilder.generalInformation();
        //   return message;

        // case 'About_Application':
        //   message = responseBuilder.aboutApplication();
        //   return message;

        // case 'About_Application_Why':
        //   message = responseBuilder.aboutApplicationWhy();
        //   return message;

        // case 'About_Developer':
        //   message = responseBuilder.aboutDeveloper();
        //   return message;

        // case 'About_Contact':
        //   message = responseBuilder.aboutContact();
        //   return message;

        // case 'About_Developer_Bio':
        //   message = responseBuilder.aboutDeveloperBio();
        //   return message;

        // case 'About_Developer_Stack':
        //   message = responseBuilder.aboutDeveloperStack();
        //   return message;

        // case 'About_Developer_Projects':
        //   message = responseBuilder.aboutDeveloperProjects();
        //   return message;

      default:
        return {
          text: 'I\'m sorry... I don\'t recognize that input :('
        };
    }
  }

  return {
    processPayload: processPayload
  };
})();