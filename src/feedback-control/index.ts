import {ok} from 'node:assert'
import {join} from 'node:path'
import type {BaseConfig, BaseProgram, IExtension} from '@diplodoc/cli/lib/program'
import {getHooks as getBaseHooks} from '@diplodoc/cli/lib/program'
import {getBuildHooks, getEntryHooks} from '@diplodoc/cli'


type FeedbackControlOptions = {
    endpoint: string
}

type ConfigWithFeedbackControl = BaseConfig & {
    feedbackControl: boolean | FeedbackControlOptions
}

export class Extension implements IExtension {
    apply(program: BaseProgram<ConfigWithFeedbackControl>): void {
        getBaseHooks(program).Config.tap('FeedbackControl', (config) => {
            if (!config.feedbackControl || "boolean" === typeof config.feedbackControl) {
                return config
            }

            ok(config.feedbackControl.endpoint !== '', 'feedbackControl.endpoint must be not empty')

            return config
        })

        getBuildHooks(program).BeforeRun.for('html').tap('FeedbackControl', (run) => {
            if (!program.config.feedbackControl) {
                return
            }

            getEntryHooks(run.entry).Page.tap('FeedbackControl', (template) => {
                const controlConfig = program.config.feedbackControl === true ? {} : program.config.feedbackControl

                template.addScript('/_extensions/feedback-control-extension.js', {
                    position: 'leading',
                    attrs: {
                        defer: void 0
                    }
                })

                template.addScript(`window.feedbackControlExtensionInit(${JSON.stringify(controlConfig)})`, {
                    position: 'state',
                    inline: true,
                });
            });
        })

        getBuildHooks(program).AfterRun.for('html').tapPromise('FeedbackControl', async (run) => {
            if (!program.config.feedbackControl) {
                return
            }

            const extensionFilePath = join(__dirname, 'resources', 'feedback-control-extension.js')

            try {
                await run.copy(
                    extensionFilePath,
                    join(run.output, '_extensions', 'feedback-control-extension.js')
                );
            } catch (error) {
                run.logger.warn(`Unable copy the feedback-control extension script ${extensionFilePath}.`, error);
            }
        })
    }
}