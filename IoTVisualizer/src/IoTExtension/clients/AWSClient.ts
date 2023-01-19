/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import API, { graphqlOperation } from "@aws-amplify/api";

export const subscribeDoc = /* GraphQL */ `
    subscription Subscribe($name: String!) {
        subscribe(name: $name) {
          name          
          data          
        }
    }
`;

export function subscribe(name: string, next: any, error: any) {
  return (API.graphql(graphqlOperation(subscribeDoc, { name })) as any).subscribe({
    next: ({ provider, value }: any) => {
      console.log(value);
      next(value.data.subscribe, provider, value);
    },
    error: error || console.log,
  });
}
