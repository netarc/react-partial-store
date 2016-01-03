var Handlers = {};


/**
 * responseHandler serves as a collection/object parser for the resulting JSON of
 * a request. This parser will gather objects and send them off the the associated
 * Store for storage.
 *
 * New handlers can be added and the default able to be changed so one can
 * customize how they expect their backend show data and how RPS imports that data.
 */

Handlers.containerless_unnested = require("./handlers/containerless_unnested");
Handlers.containerless_nested = require("./handlers/containerless_nested");

////////////////////////////////////////////////////////////////////////////////////////////////////

Handlers.default = Handlers.containerless_nested;

module.exports = Handlers;
