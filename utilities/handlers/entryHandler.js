module.exports = (function entryHandler() {
    const { entryIds } = require('../constants/index');

    function processEntryId(entryId) {
        switch (entryId) {
            case entryIds.FMS2019:
                return process.env.FMS2019;

            case entryIds.OXC2019:
                return process.env.OXC2019;

            default:
                //throw error. entry from unauthorized source page
                break;
        }
    }

    return {
        processEntryId: processEntryId
    }
})();