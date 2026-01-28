/**
 * Agent status can be 'online', 'offline', or 'in_call'
 */
export enum AgentStatus {
  /** Agent is online and available */
  Online = 'online',
  /** Agent is offline and unavailable */
  Offline = 'offline',
  /** Agent is currently in a call */
  InCall = 'in_call',
}
