import { faker } from '@faker-js/faker';
import { Message } from '../models/message.js';

export const createMessages = async (users, chats) => {
  try {
    const messages = [];

    for (const chat of chats) {
      const numMessages = faker.number.int({ min: 5, max: 20 });

      for (let i = 0; i < numMessages; i++) {
        const message = new Message({
          content: faker.lorem.sentence(),
          attachments: [],
          sender: faker.helpers.arrayElement(users)._id,
          chat: chat._id,
        });
        messages.push(message);
      }
    }

    await Message.insertMany(messages);
  } catch (error) {
    console.log(error);
  }
};
