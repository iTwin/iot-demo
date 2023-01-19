/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

const { BlobServiceClient } = require('@azure/storage-blob');

let userRole = "Unauthorized";

export const DeviceAction = {
  ADD: 'ADD',
  UPDATE: 'UPDATE'
};

export async function blobToString(blob) {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onloadend = (ev) => {
      resolve(ev.target.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsText(blob);
  });
}

export const getBlobData = async (containerName, blobName) => {
  const blobServiceClient = new BlobServiceClient(process.env.REACT_APP_AZURE_STORAGE_SAS_URL);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  let blobExists = false;
  while (!blobExists) {
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name === blobName) {
        blobExists = true;
      }
    }
  }
  const downloadBlockBlobResponse = await blockBlobClient.download(0);
  const downloadedData = await blobToString(await downloadBlockBlobResponse.blobBody);
  return downloadedData;
}

export const checkUserRole = async (user) => {
  const blobData = await getBlobData("iot-demo-configuration", "UserAuthorization.json");
  const roles = JSON.parse(blobData).Roles;
  for (const role of roles) {
    const emailId = role.emailIds.map((r) => r.toLowerCase());
    if (user !== undefined && emailId.includes(user.toLowerCase())) {
      userRole = role.Role;
      return userRole
    }
  }
  if (user === undefined) {
    return "";
  } else {
    return userRole;
  }
  
}