import { LogLevel } from "../contracts/Logger";

class Logger {
    private moduleName: string;
    private isDevelopment: boolean;

    constructor(moduleName: string) {
        this.moduleName = moduleName;
        this.isDevelopment = process.env.NODE_ENV === "development";
    }

    printMessage(level: LogLevel, message: string, data?: unknown) {
        const prefix = this.getLogPrefix(level);
        switch (level) {
            case LogLevel.ERROR:
                console.error(prefix, message, data);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, data);
                break;
            case LogLevel.INFO:
                console.log(prefix, message, data);
                break;
            case LogLevel.DEBUG:
                console.debug(prefix, message, data);
                break;
        }
    }

    getLogPrefix(level: LogLevel) {
        const timeStamp = new Date().toISOString();
        return `[${timeStamp}] [${level.toUpperCase()}] [${this.moduleName}] : `;
    }

    formatLogData(data: unknown) {
        if (data == undefined) {
            return "";
        } else if (typeof data === "string") {
            return data;
        } else if (typeof data === "object") {
            return JSON.stringify(data, null, 2);
        }
    }

    log(level: LogLevel, message: string, data?: unknown) {
        if (this.isDevelopment && level == LogLevel.DEBUG) {
            return;
        }

        data = this.formatLogData(data);
        this.printMessage(level, message, data);
    }
}

export default Logger;
