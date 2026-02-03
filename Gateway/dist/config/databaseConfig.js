"use strict";
/**
 * Database Configuration Manager for Gateway
 * Handles local storage and forwarding to IngestService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_DIR = process.env.CONFIG_DIR || './data';
const DB_CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'database-config.json');
class DatabaseConfigManager {
    constructor() {
        this.config = {};
        this.ingestServiceUrl = process.env.INGEST_SERVICE_URL || 'http://localhost:4000';
        this.ensureConfigDir();
    }
    ensureConfigDir() {
        if (!fs_1.default.existsSync(CONFIG_DIR)) {
            fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
        }
    }
    /**
     * Load config from local file
     */
    load() {
        try {
            if (fs_1.default.existsSync(DB_CONFIG_FILE)) {
                const content = fs_1.default.readFileSync(DB_CONFIG_FILE, 'utf-8');
                this.config = JSON.parse(content);
                console.log('Database config loaded from local file');
            }
        }
        catch (error) {
            console.error('Failed to load database config from file:', error);
        }
        return this.config;
    }
    /**
     * Save config to local file
     */
    save() {
        try {
            this.ensureConfigDir();
            fs_1.default.writeFileSync(DB_CONFIG_FILE, JSON.stringify(this.config, null, 2), {
                mode: 0o600, // Read/write for owner only
            });
            console.log('Database config saved to local file');
        }
        catch (error) {
            console.error('Failed to save database config to file:', error);
            throw error;
        }
    }
    /**
     * Get database config
     */
    getDatabaseConfig() {
        return this.config.database;
    }
    /**
     * Get IngestService URL
     */
    getIngestServiceUrl() {
        return this.config.ingestServiceUrl || this.ingestServiceUrl;
    }
    /**
     * Set IngestService URL
     */
    setIngestServiceUrl(url) {
        this.config.ingestServiceUrl = url;
        this.save();
    }
    /**
     * Update database config, save locally, and forward to IngestService
     */
    async updateDatabaseConfig(dbConfig) {
        const result = { gateway: false, ingestService: false, error: undefined };
        // Save locally first
        try {
            this.config.database = dbConfig;
            this.config.lastUpdated = new Date().toISOString();
            this.config.configVersion = `v${Date.now()}`;
            this.save();
            result.gateway = true;
            console.log('Database config saved locally');
        }
        catch (error) {
            result.error = `Failed to save locally: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return result;
        }
        // Forward to IngestService
        try {
            const ingestUrl = this.getIngestServiceUrl();
            const ingestToken = process.env.INGEST_TOKEN || '';
            const response = await fetch(`${ingestUrl}/config/database`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ingestToken}`,
                },
                body: JSON.stringify(dbConfig),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                result.ingestService = true;
                console.log('Database config forwarded to IngestService');
            }
            else {
                result.error = data.error || data.message || 'IngestService returned error';
            }
        }
        catch (error) {
            result.error = `Failed to forward to IngestService: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        return result;
    }
    /**
     * Test database connection via IngestService
     */
    async testDatabaseConnection(dbConfig) {
        try {
            const ingestUrl = this.getIngestServiceUrl();
            const ingestToken = process.env.INGEST_TOKEN || '';
            const response = await fetch(`${ingestUrl}/config/database/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ingestToken}`,
                },
                body: JSON.stringify(dbConfig),
            });
            const data = await response.json();
            return {
                success: data.success === true,
                error: data.success ? undefined : (data.message || data.error || 'Connection test failed'),
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reach IngestService: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get current config state (without password)
     */
    getConfigState() {
        const { database, ...rest } = this.config;
        if (database) {
            const { password, ...dbWithoutPassword } = database;
            return { ...rest, database: dbWithoutPassword };
        }
        return rest;
    }
    /**
     * Check if local config file exists
     */
    hasLocalConfig() {
        return fs_1.default.existsSync(DB_CONFIG_FILE);
    }
}
exports.databaseConfigManager = new DatabaseConfigManager();
//# sourceMappingURL=databaseConfig.js.map