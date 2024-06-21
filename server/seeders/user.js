import { faker } from '@faker-js/faker';
import { User } from '../models/user.js';
import { hash } from 'bcrypt';

export const generateFakeUsers = async (numUsers = 10) => {
  const users = [];

  for (let i = 0; i < numUsers; i++) {
    const hashedPassword = await hash('password123', 10);
    const user = new User({
      name: faker.person.fullName(),
      username: faker.internet.userName(),
      password: hashedPassword, // Same password for simplicity
      bio: faker.lorem.sentence(),
      avatar: {
        publicId: faker.system.fileName(),
        url: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  await User.insertMany(users);
  return users;
};

// export const seedUsers = async (totalNumber) => {
//   try {
//     const users = await generateFakeUsers(totalNumber);
//     const userPromises = users.map((user) => User.create(user));
//     await Promise.all(userPromises);

//     console.log('user seeded successfully');
//     process.exit(0); // Successful completion
//   } catch (error) {
//     console.error('Error seeding users:', error);
//     process.exit(1);
//   }
// };
