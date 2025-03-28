import { load } from "@std/dotenv";
import { Pool, PoolClient } from "../deps.ts";

export interface ExchangeRate {
  id: number;
  sell_rate: number;
  buy_rate: number;
  created_at: Date;
}

class DBService {
  pool: PoolClient | undefined;

  constructor() {
    load().then(async (module) => {
      const url = module["dbUrl"];
      const pool = await new Pool(url, 2).connect();
      this.pool = pool;
    });
  }

  createExchangeTable = async () => {
    if (!this.pool) throw new Error("Database connection not initialized");
    await this.pool.queryArray(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        sell_rate DECIMAL NOT NULL,
        buy_rate DECIMAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  };

  insertExchangeCourse = async (sellRate: number, buyRate: number) => {
    console.log("Inserting ", sellRate, " \ ", buyRate);
    if (!this.pool) throw new Error("Database connection not initialized");
    await this.pool.queryArray(
      "INSERT INTO exchange_rates (sell_rate, buy_rate) VALUES ($1, $2)",
      [sellRate, buyRate],
    );
  };

  getAllRates = async (): Promise<ExchangeRate[]> => {
    if (!this.pool) throw new Error("Database connection not initialized");
    const result = await this.pool.queryObject<ExchangeRate>(
      "SELECT * FROM exchange_rates ORDER BY created_at DESC",
    );
    return result.rows;
  };

  getLatestRate = async (): Promise<ExchangeRate> => {
    if (!this.pool) throw new Error("Database connection not initialized");

    const result = await this.pool.queryObject<ExchangeRate>`
      SELECT 
        id,
        CAST(buy_rate AS NUMERIC) AS buy_rate,
        CAST(sell_rate AS NUMERIC) AS sell_rate,
        created_at
      FROM exchange_rates 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    return result.rows[0];
  };
}

export default DBService;
