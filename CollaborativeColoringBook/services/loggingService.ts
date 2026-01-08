// services/loggingService.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  data?: any;
  error?: any;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Prevent memory bloat
  private enabled = __DEV__; // Only log in development
  
  log(
    level: LogLevel,
    service: string,
    operation: string,
    message: string,
    data?: any,
    error?: any
  ) {
    if (!this.enabled) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      operation,
      message,
      data,
      error
    };
    
    this.logs.push(entry);
    
    // Keep logs manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Console output (colored for visibility)
    const colors = {
      debug: '⚪',
      info: '🔵',
      warn: '🟡',
      error: '🔴'
    };
    
    console.log(
      `${colors[level]} [${service}:${operation}] ${message}`,
      data || '',
      error || ''
    );
  }
  
  // Get recent logs (for debugging screen)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }
  
  // Clear logs
  clearLogs() {
    this.logs = [];
  }
  
  // Supabase-specific logging wrapper
  createSupabaseLogger(client: any) {
    if (!this.enabled) return client;
    
    return new Proxy(client, {
      get(target, prop) {
        const value = target[prop];
        if (typeof value === 'function') {
          return function(...args: any[]) {
            const service = 'supabase';
            const operation = String(prop);
            
            // Log the call
            loggingService.log('debug', service, operation, 'Calling', {
              args: args.length > 0 ? args[0] : undefined
            });
            
            const startTime = Date.now();
            const result = value.apply(target, args);
            
            if (result && typeof result.then === 'function') {
              return result
                .then((res: any) => {
                  const duration = Date.now() - startTime;
                  
                  if (res?.error) {
                    loggingService.log('error', service, operation, 
                      `Failed (${duration}ms)`, 
                      { args: args[0] },
                      res.error
                    );
                  } else {
                    loggingService.log('info', service, operation, 
                      `Success (${duration}ms)`, 
                      { 
                        args: args[0],
                        hasData: !!res?.data,
                        rowCount: Array.isArray(res?.data) ? res.data.length : undefined
                      }
                    );
                  }
                  return res;
                })
                .catch((error: any) => {
                  loggingService.log('error', service, operation, 
                    'Unhandled error', 
                    { args: args[0] },
                    error
                  );
                  throw error;
                });
            }
            return result;
          };
        }
        return value;
      }
    });
  }
}

export const loggingService = new LoggingService();