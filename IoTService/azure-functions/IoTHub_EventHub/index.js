/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = function (context, IoTHubMessages) {  
  //IoTHub triggered function
  IoTHubMessages.forEach(message => {   
    context.bindings.newMessage = [{
      target: "newMessage",
      arguments: [JSON.stringify(message)]

    }];    
  });

  context.done();
};
