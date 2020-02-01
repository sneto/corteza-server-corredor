import MakeFilterFn from '../filter'
import { corredor as exec } from '@cortezaproject/corteza-js'
import { BaseLogger } from 'pino'
import { GetLastUpdated, Script } from '../shared'

interface ListFilter {
    query?: string;
    resourceType?: string;
    eventTypes?: string[];
}

/**
 *
 */
export class Service {
    private scripts: Script[] = [];
    private readonly config: exec.Config;

    /**
     * Service constructor
     */
    constructor (config: exec.Config) {
      this.config = config
    }

    // Returns date of the most recently updated script from the set
    get lastUpdated (): Date {
      return GetLastUpdated(this.scripts)
    }

    /**
     * Loads scripts
     */
    Update (set: Script[]): void {
      // Scripts loaded, replace set
      this.scripts = set
    }

    /**
     * Finds and executes the script using current configuration, passed arguments and logger
     *
     * @param name Name of the script
     * @param args Arguments for the script
     * @param log Exec logger to capture and proxy all log.* and console.* calls
     */
    async Exec (name: string, args: exec.BaseArgs, log: BaseLogger): Promise<object> {
      const script: Script|undefined = this.scripts.find((s) => s.name === name)

      if (script === undefined) {
        return Promise.reject(new Error('script not found'))
      }

      if (script.errors && script.errors.length > 0) {
        return Promise.reject(new Error('can not run script with initialization errors'))
      }

      if (!script.exec || !(script.exec as exec.ScriptExecFn)) {
        return Promise.reject(new Error('can not run uninitialized script'))
      }

      if (script.exec as exec.ScriptExecFn) {
        return exec.Exec(script.exec as exec.ScriptExecFn, args, log, this.config)
      }
    }

    /**
     * Returns list of scripts
     */
    List (f: ListFilter = {}): Script[] {
      return this.scripts.filter(MakeFilterFn(f))
    }
}
