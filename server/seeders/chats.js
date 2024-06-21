import { faker } from '@faker-js/faker';
import { Chat } from '../models/chat.js';

export const createSingleChats = async (users) => {
  try {
    const singleChats = [];

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const chat = new Chat({
          name: faker.lorem.words(2),
          groupChat: false,
          creator: users[i]._id,
          members: [users[i]._id, users[j]._id],
        });
        singleChats.push(chat);
      }
    }

    await Chat.insertMany(singleChats);
    return singleChats;
  } catch (error) {
    console.log(error);
  }
};

export const createGroupChats = async (users, numGroups = 3) => {
  try {
    const groupChats = [];

    for (let i = 0; i < numGroups; i++) {
      const groupSize = faker.number.int({ min: 3, max: users.length });
      const groupMembers = faker.helpers
        .arrayElements(users, groupSize)
        .map((user) => user._id);

      const chat = new Chat({
        name: faker.commerce.productName(),
        groupChat: true,
        creator: groupMembers[0],
        members: groupMembers,
      });

      groupChats.push(chat);
    }

    await Chat.insertMany(groupChats);
    return groupChats;
  } catch (error) {
    console.log(error);
  }
};
