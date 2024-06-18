import { faker } from '@faker-js/faker';
import { User } from '../models/user.js';
import { hash } from 'bcrypt';

const generateFakeUsers = async (numUsers = 10) => {
  const tempUsers = [];

  for (let i = 0; i < numUsers; i++) {
    const hashedPassword = await hash('password123', 10); // Hash the password
    const user = {
      name: faker.person.fullName(),
      username: faker.internet.userName(),
      password: hashedPassword, // Use the hashed password
      bio: faker.lorem.sentence(10),
      avatar: {
        publicId: faker.system.fileName(),
        url: faker.image.avatar(),
      },
    };
    tempUsers.push(user);
  }

  return tempUsers;
};

export const seedUsers = async (totalNumber) => {
  try {
    const users = await generateFakeUsers(totalNumber);
    const userPromises = users.map((user) => User.create(user));
    await Promise.all(userPromises);

    console.log('user seeded successfully');
    process.exit(0); // Successful completion
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};
