import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import { createGroupChats, createSingleChats } from './chats.js';
import { createMessages } from './messages.js';
import { generateFakeUsers } from './user.js';

export const seedDatabase = async () => {
  try {
    // Clean up the database
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});

    // Generate fake users
    const users = await generateFakeUsers(10);

    // Create single and group chats
    const singleChats = await createSingleChats(users);
    const groupChats = await createGroupChats(users);

    // Create messages for all chats
    await createMessages(users, [...singleChats, ...groupChats]);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};
