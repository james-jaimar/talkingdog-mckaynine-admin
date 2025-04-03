
/**
 * Barrel file to export all message service functionality
 * This maintains backward compatibility with existing imports
 */

import { getClientMessages, sendClientMessage } from './services/messageApi';
import { subscribeToClientMessages } from './services/messageSubscription';
import { uploadMessageAttachment } from './services/storageService';

export {
  getClientMessages,
  sendClientMessage,
  subscribeToClientMessages,
  uploadMessageAttachment
};
