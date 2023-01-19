/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = async function (context, req, connectionInfo) {
    context.res.body = connectionInfo;
    context.log(connectionInfo);    
};