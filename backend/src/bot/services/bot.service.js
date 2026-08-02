import { User } from '../../models/User.js';
import { Profile } from '../../models/Profile.js';

export class BotService {
  /**
   * Lookup existing user or create a new user document in MongoDB using Mongoose.
   */
  async findOrCreateUser(input) {
    const telegramId = String(input.telegramId);
    let user = await User.findOne({ telegramId });

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
      telegramId,
      username: input.username || '',
      firstName: input.firstName || 'User',
      lastName: input.lastName || '',
      languageCode: input.languageCode || 'en',
    });

    await Profile.create({
      userId: user._id,
      telegramId,
    });

    return { user, isNewUser: true };
  }
}
