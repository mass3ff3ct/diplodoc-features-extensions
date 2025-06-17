import type {BaseConfig, BaseProgram, IExtension} from '@diplodoc/cli/lib/program'
import {ok} from 'node:assert'
import {getHooks as getBaseHooks} from '@diplodoc/cli/lib/program'
import {getBuildHooks, getEntryHooks} from '@diplodoc/cli'

type VcsType = 'github' | 'arcanum' | 'custom'

const vcsTypeSet = new Set<VcsType>(['github', 'arcanum', 'custom'])

type VcsControlOptions = {
    url: string
    type: VcsType
    icon?: string
    hint?: string
}

type ConfigWithVcsControl = BaseConfig & {
    vcsControl: false | VcsControlOptions
}

const urlPathVariable = '{path}'

export class Extension implements IExtension {
    apply(program: BaseProgram<ConfigWithVcsControl>): void {
        getBaseHooks(program).Config.tap('VcsControl', (config) => {
            if (!config.vcsControl) {
                return config
            }

            ok("object" === typeof config.vcsControl, 'vcsControl must be object')
            ok("url" in config.vcsControl, 'vcsControl.url must be required')
            ok("string" === typeof config.vcsControl.url, 'vcsControl.url must be not empty')
            ok(config.vcsControl.url.includes(urlPathVariable), `vcsControl.url not contains template variable ${urlPathVariable}`)
            ok(vcsTypeSet.has(config.vcsControl.type), `vcsControl.type must be one of ${Array.from(vcsTypeSet).join(', ')}`)


            return config
        })

        getBuildHooks(program).BeforeRun.for('html').tapPromise('VcsControl', async (run) => {
            getEntryHooks(run.entry).State.tap('VcsControl', (state) => {
                if (!program.config.vcsControl) {
                    return state
                }

                const vcsControlConfig = program.config.vcsControl

                state.data.vcsUrl = vcsControlConfig.url.replace(urlPathVariable, `${state.router.pathname}.md`)
                state.data.vcsType = vcsControlConfig.type

                if (vcsControlConfig.icon) {
                    state.data.vcsIcon = vcsControlConfig.icon
                }

                if (vcsControlConfig.hint) {
                    state.data.vcsHint = vcsControlConfig.hint
                }

                return state
            })
        })
    }
}