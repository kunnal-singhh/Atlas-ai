import { ONBOARDING_STEPS } from '../../constants/onboarding.constants.js';
import { OnboardingService } from '../services/onboarding.service.js';
import { OnboardingController } from '../controllers/onboarding.controller.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';

const onboardingService = new OnboardingService();
const onboardingController = new OnboardingController();

export const onboardingMiddleware = async (ctx, next) => {
  const user = ctx.state?.user;

  // Pass if no user or user completed/skipped onboarding
  if (
    !user ||
    user.onboardingStep === ONBOARDING_STEPS.IDLE ||
    user.onboardingStep === ONBOARDING_STEPS.COMPLETED ||
    user.onboardingStep === ONBOARDING_STEPS.SKIPPED
  ) {
    return next();
  }

  // Intercept text messages sent during active onboarding steps
  if (ctx.message && ctx.message.text) {
    const text = ctx.message.text.trim();

    // Ignore commands so user can execute /start or /help
    if (text.startsWith('/')) {
      return next();
    }

    switch (user.onboardingStep) {
      case ONBOARDING_STEPS.ASK_PROFESSION: {
        await onboardingService.saveProfession(user.telegramId, text);
        const updatedUser = await onboardingService.setStep(
          user.telegramId,
          ONBOARDING_STEPS.ASK_INDUSTRIES
        );
        return onboardingController.renderIndustryQuestion(ctx, updatedUser);
      }

      case ONBOARDING_STEPS.ASK_TOPICS: {
        await onboardingService.saveListInput(user.telegramId, 'topics', text);
        return onboardingController.renderCompaniesQuestion(ctx);
      }

      case ONBOARDING_STEPS.ASK_COMPANIES: {
        await onboardingService.saveListInput(user.telegramId, 'companies', text);
        return onboardingController.renderBriefTimeQuestion(ctx);
      }

      case ONBOARDING_STEPS.ASK_CUSTOM_TIME: {
        const result = await onboardingService.saveBriefTime(user.telegramId, text);
        if (!result.success) {
          return ctx.replyWithMarkdownV2(BOT_MESSAGES.ONB_INVALID_TIME);
        }
        return onboardingController.renderNotificationsQuestion(ctx, result.user);
      }

      default:
        return next();
    }
  }

  return next();
};