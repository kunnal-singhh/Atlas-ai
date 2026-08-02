import { User } from '../../models/user.js';

export class BotService {
  /**
   * Lookup existing user or create a new user document in MongoDB using Mongoose.
   */
  async findOrCreateUser(input) {
    let user = await User.findOne({ telegramId: input.telegramId });

    if (user) {
      // Asynchronously sync profile updates if user details changed on Telegram
      let isChanged = false;
      if (input.username && user.username !== input.username) {
        user.username = input.username;
        isChanged = true;
      }
      if (input.firstName && user.firstName !== input.firstName) {
        user.firstName = input.firstName;
        isChanged = true;
      }
      if (input.lastName && user.lastName !== input.lastName) {
        user.lastName = input.lastName;
        isChanged = true;
      }

      if (isChanged) {
        await user.save();
      }

      return { user, isNewUser: false };
    }

    // Provision new Mongoose User Document
    user = await User.create({
      telegramId: input.telegramId,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      languageCode: input.languageCode || 'en',
    });

    return { user, isNewUser: true };
  }
}