import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import { configManager } from '../../utils/config';
import { logger } from '../../utils/logger';

export async function setupWizard(force = false): Promise<boolean> {
  if (!force && configManager.isSetupComplete()) {
    logger.info('Setup has already been completed.');
    logger.newline();
    logger.subheading('Your current configuration:');

    const config = configManager.getFullConfig();
    logger.keyValue('Default author', config.defaultAuthor || '(not set)');
    logger.keyValue('Preferred editor', config.editor || '(not set)');
    logger.keyValue(
      'GitHub integration',
      config.githubToken ? 'Configured' : 'Not configured'
    );
    logger.newline();

    logger.info('To force setup to run again, use: pawnctl setup --force');
    logger.info('To edit individual settings, use: pawnctl config');
    logger.newline();
    return true;
  }

  logger.heading('Welcome to pawnctl!');
  logger.info('This one-time setup will help configure pawnctl for your use.');
  logger.newline();

  try {
    const author = await input({
      message:
        'What name would you like to use as the default author for your projects?',
      default: configManager.getDefaultAuthor() || '',
    });
    configManager.setDefaultAuthor(author);

    const editor = (await select({
      message: 'Which code editor do you use most for PAWN development?',
      choices: [
        { value: 'VS Code', name: 'Visual Studio Code (recommended)' },
        { value: 'Sublime Text', name: 'Sublime Text' },
        { value: 'Other/None', name: 'Other editor or none' },
      ],
      default: configManager.getEditor() || 'VS Code',
    })) as 'VS Code' | 'Sublime Text' | 'Other/None';
    configManager.setEditor(editor);

    const configureGithub = await confirm({
      message:
        'Would you like to configure GitHub integration? (for package installations)',
      default: false,
    });

    if (configureGithub) {
      const token = await input({
        message:
          'Enter your GitHub personal access token (optional, press Enter to skip):',
        default: '',
      });
      if (token) {
        configManager.setGitHubToken(token);
      }
    }

    configManager.setSetupComplete(true);

    logger.newline();
    logger.finalSuccess('Setup complete! You can now use pawnctl.');
    logger.info('To change these settings in the future, run: pawnctl config');
    return true;
  } catch (error) {
    logger.error(
      `Setup failed: ${error instanceof Error ? error.message : 'unknown error'}`
    );
    return false;
  }
}

export default function (program: Command): void {
  program
    .command('setup')
    .description('Configure pawnctl settings')
    .option('-f, --force', 'force setup even if already configured')
    .action(async (options) => {
      await setupWizard(options.force);
    });
}
