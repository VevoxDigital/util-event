
import { EventEmitter } from 'events'
import { Signal } from './signal'

/** The type of a signal's args */
export type SignalArgs<T> = T extends Signal<infer U> ? U : T

/** Signal emitter listener */
export type Listener<T extends Signal | any[] = any[]> = Functional.Consumer<SignalArgs<T>>

/**
 * An implementation of {@link NodeJS.EventEmitter} that is driven by signals
 */
export class SignalEmitter<T extends KnownDictionary<Signal<any[]>>>
implements EventEmitter {

  /** All signals on this emitter */
  public readonly signals: T

  public constructor (signals: T) {
    this.signals = signals
  }

  /**
   * Gets an array of all events current tied to this emitter
   */
  public eventNames (): string[] {
    return Object.keys(this.signals)
  }

  /**
   * @deprecated
   */
  public setMaxListeners (_n: number): this {
    /* no-op right now */
    return this
  }

  /**
   * @deprecated
   */
  public getMaxListeners (): number {
    /* no-op right now */
    return -1
  }

  /**
   * Gets a signal by name
   * @param name The name of the signal
   */
  public signal (name: symbol): Signal<any[]>
  public signal <K extends keyof T> (name: K): T[K]
  public signal (name: symbol | keyof T) {
    return this.signals[name as string]
  }

  /**
   * Add a listener to this emitter
   * @param event The signal name to listen on
   * @param listener The listener
   */
  public addListener (event: symbol, listener: Listener): this
  public addListener <K extends keyof T> (event: K, listener: Listener<T[K]>): this
  public addListener (event: symbol | keyof T, listener: Listener<any>): this {
    const s = this.signals[event as string]
    if (s) s.connectSync(listener)
    return this
  }

  /**
   * Add a listener to this emitter
   * @param event The signal name to listen on
   * @param listener The listener
   */
  public on (event: symbol, listener: Listener): this
  public on <K extends keyof T> (event: K, listener: Listener<T[K]>): this
  public on (event: symbol | keyof T, listener: Listener<any>): this {
    return this.addListener(event as keyof T, listener)
  }

  /**
   * Add a listener to this emitter that decays after being used once
   * @param event The signal name to listen on
   * @param listener The listener
   */
  public once (event: symbol, listener: Listener): this
  public once <K extends keyof T> (event: K, listener: Listener<T[K]>): this
  public once (event: symbol | keyof T, listener: Listener<any>): this {
    const s = this.signals[event as string]
    if (s) s.connectOnceSync(listener)
    return this
  }

  /**
   * Removes a listener from a given signal
   * @param event The event to disconnect from
   * @param listener The listener to disconnect
   * @see #off
   */
  public removeListener (event: symbol | keyof T, listener: Listener<any>): this {
    const s = this.signals[event as string]
    if (s) s.disconnect(listener)
    return this
  }

  /**
   * Removes a listener from a given signal
   * @param event The event to disconnect from
   * @param listener The listener to disconnect
   * @see #removeListener
   */
  public off (event: symbol | keyof T, listener: Listener<any>): this {
    return this.removeListener(event, listener)
  }

  /**
   * Removes all listeners from either a given event (if given) or all events
   * @param event The event to remove listeners from
   */
  public removeAllListeners (event?: symbol | keyof T): this {
    if (event) {
      const s = this.signals[event as string]
      if (s) s.disconnectAll()
    } else {
      for (const e of Object.keys(this.signals)) this.removeAllListeners(e)
    }
    return this
  }

  /**
   * Gets a list of sync slots on a given signal, by name
   * @param event The signal name
   */
  public listeners (event: symbol): Listener[]
  public listeners <K extends keyof T> (event: K): Array<Listener<T[K]>>
  public listeners (event: symbol | keyof T): Array<Listener<any>> {
    const s = this.signals[event as string]
    return s ? s.slots(true) : []
  }

  /**
   * Gets the number of listeners on a given signal
   * @param event The event to look up
   */
  public listenerCount (event: symbol | keyof T): number {
    return this.listeners(event as keyof T).length
  }

  /**
   * Gets a list of sync slots on a given signal, by name
   * @param event The signal name
   */
  public rawListeners (event: symbol): Listener[]
  public rawListeners <K extends keyof T> (event: K): Array<Listener<T[K]>>
  public rawListeners (event: symbol | keyof T): Array<Listener<any>> {
    return this.listeners(event as keyof T)
  }

  /**
   * Fires a signal by name
   * @param event The event name
   * @param args Args to fire the signal with
   */
  public emit (event: symbol, ...args: any[]): boolean
  public emit <K extends keyof T> (event: K, ...args: SignalArgs<T[K]>): boolean
  public emit (event: symbol | keyof T, ...args: any[]): boolean {
    const s = this.signals[event as string]
    return !!s.fireSync(...args)
  }

  /**
   * Add a listener to the pre-fire signal of the given signal
   * @param event The signal name to listen on
   * @param listener The listener
   */
  public prependListener (event: symbol, listener: Listener): this
  public prependListener <K extends keyof T> (event: K, listener: Listener<T[K]>): this
  public prependListener (event: symbol | keyof T, listener: Listener<any>): this {
    const s = this.signals[event as string]
    if (s) {
      let { pre } = s
      if (!pre) {
        pre = new Signal()
        s.pre = pre
      }
      pre.connectSync(listener)
    }
    return this
  }

  /**
   * Add a listener to the pre-fire signal of the given signal that decays after being used once
   * @param event The signal name to listen on
   * @param listener The listener
   */
  public prependOnceListener (event: symbol, listener: Listener): this
  public prependOnceListener <K extends keyof T> (event: K, listener: Listener<T[K]>): this
  public prependOnceListener (event: symbol | keyof T, listener: Listener<any>): this {
    const s = this.signals[event as string]
    if (s) {
      let { pre } = s
      if (!pre) {
        pre = new Signal()
        s.pre = pre
      }
      pre.connectOnceSync(listener)
    }
    return this
  }
}
