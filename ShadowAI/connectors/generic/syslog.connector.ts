/**
 * Syslog Connector - Receives events via syslog protocol.
 * This is a pull-based adapter that reads from a local syslog buffer.
 *
 * Note: In production, a syslog server (e.g., rsyslog, syslog-ng)
 * would forward events to this connector's buffer. The actual syslog
 * listener would be set up as part of the deployment infrastructure.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class SyslogConnector extends BaseConnector {
  private eventBuffer: RawEvent[] = [];

  async testConnection(): Promise<ConnectorTestResult> {
    const config = this.config.config;
    const port = config.syslog_port || 514;
    const protocol = config.syslog_protocol || "tcp";

    return {
      success: true,
      message: `Syslog listener configured on ${protocol.toString().toUpperCase()}:${port}`,
      events_available: this.eventBuffer.length,
      latency_ms: 0,
    };
  }

  async connect(): Promise<void> {
    // In a production environment, this would start a syslog listener
    // For now, events are pushed into the buffer via receiveSyslogMessage()
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    const events = this.eventBuffer.filter((e) => e.received_at >= since);
    this.eventBuffer = this.eventBuffer.filter((e) => e.received_at < since);
    return events;
  }

  async disconnect(): Promise<void> {
    // Would stop the syslog listener in production
  }

  /**
   * Parse and buffer a syslog message.
   * Supports RFC 3164 and RFC 5424 formats.
   */
  receiveSyslogMessage(message: string): RawEvent {
    const parsed = this.parseSyslogMessage(message);
    const event: RawEvent = {
      source_type: "syslog",
      raw_data: parsed,
      received_at: new Date(),
    };
    this.eventBuffer.push(event);
    return event;
  }

  /**
   * Simple syslog message parser.
   */
  private parseSyslogMessage(message: string): Record<string, unknown> {
    const result: Record<string, unknown> = { raw_message: message };

    // Try RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
    const rfc5424 = message.match(
      /^<(\d+)>(\d+) (\S+) (\S+) (\S+) (\S+) (\S+) (.*)/
    );

    if (rfc5424) {
      result.priority = parseInt(rfc5424[1]);
      result.version = parseInt(rfc5424[2]);
      result.timestamp = rfc5424[3];
      result.hostname = rfc5424[4];
      result.app_name = rfc5424[5];
      result.proc_id = rfc5424[6];
      result.msg_id = rfc5424[7];
      result.message = rfc5424[8];
    } else {
      // Try RFC 3164: <PRI>TIMESTAMP HOSTNAME MSG
      const rfc3164 = message.match(/^<(\d+)>(.{15}) (\S+) (.*)/);
      if (rfc3164) {
        result.priority = parseInt(rfc3164[1]);
        result.timestamp = rfc3164[2];
        result.hostname = rfc3164[3];
        result.message = rfc3164[4];
      }
    }

    // Try to extract URL from message body
    const urlMatch = message.match(/(https?:\/\/[^\s"']+)/);
    if (urlMatch) {
      result.url = urlMatch[1];
      try {
        const url = new URL(urlMatch[1]);
        result.host = url.hostname;
      } catch {
        // ignore
      }
    }

    return result;
  }

  getBufferSize(): number {
    return this.eventBuffer.length;
  }
}
