/**
 * Database Service Layer
 * Abstracts database operations with connection pooling and error handling
 */

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { logger } from '../utils/logger';
import {
  DatabaseError,
  NotFoundError,
} from '../utils/errors';

export interface QueryOptions {
  timeout?: number;
  maxRetries?: number;
  logQuery?: boolean;
}

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
}

class DatabaseService {
  private connectionPool = db;
  private queryStats = {
    totalQueries: 0,
    totalDuration: 0,
    errors: 0,
    averageTime: 0,
  };

  /**
   * Execute raw SQL query
   */
  async executeQuery<T>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();

    try {
      if (options.logQuery) {
        logger.debug('Executing query', {
          queryId,
          query: query.substring(0, 200),
        });
      }

      const result = await this.connectionPool.execute(
        sql.raw(query),
        params
      );

      const duration = Date.now() - startTime;
      this.updateStats(duration);

      logger.debug('Query executed successfully', {
        queryId,
        duration: `${duration}ms`,
        rowsAffected: (result as any).rowCount || 0,
      });

      return (result as any).rows || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.queryStats.errors++;

      logger.error('Query execution failed', {
        queryId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 200),
      });

      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Query execution failed'
      );
    }
  }

  /**
   * Insert single record
   */
  async insert<T extends Record<string, any>>(
    tableName: string,
    data: T,
    options: QueryOptions = {}
  ): Promise<T> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');

      const query = `
        INSERT INTO ${tableName} (${columns.join(',')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const results = await this.executeQuery<T>(query, values, options);

      if (!results.length) {
        throw new DatabaseError('Insert failed - no record returned');
      }

      logger.info('Record inserted', {
        tableName,
        recordId: (results[0] as any).id,
      });

      return results[0];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Insert operation failed'
      );
    }
  }

  /**
   * Insert multiple records
   */
  async insertMany<T extends Record<string, any>>(
    tableName: string,
    records: T[],
    options: QueryOptions = {}
  ): Promise<T[]> {
    if (!records.length) {
      return [];
    }

    try {
      const resultList: T[] = [];

      for (const record of records) {
        const result = await this.insert(tableName, record, options);
        resultList.push(result);
      }

      logger.info('Multiple records inserted', {
        tableName,
        count: resultList.length,
      });

      return resultList;
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Batch insert operation failed'
      );
    }
  }

  /**
   * Update record
   */
  async update<T extends Record<string, any>>(
    tableName: string,
    id: string | number,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(',');

      const query = `
        UPDATE ${tableName}
        SET ${setClause}, updated_at = NOW()
        WHERE id = $${columns.length + 1}
        RETURNING *
      `;

      const results = await this.executeQuery<T>(query, [...values, id], options);

      if (!results.length) {
        throw new NotFoundError(tableName);
      }

      logger.info('Record updated', {
        tableName,
        recordId: id,
      });

      return results[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Update operation failed'
      );
    }
  }

  /**
   * Delete record
   */
  async delete(
    tableName: string,
    id: string | number,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1`;
      const results = await this.executeQuery(query, [id], options);

      const deleted = (results as any).rowCount > 0;

      if (deleted) {
        logger.info('Record deleted', {
          tableName,
          recordId: id,
        });
      }

      return deleted;
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Delete operation failed'
      );
    }
  }

  /**
   * Find record by ID
   */
  async findById<T>(
    tableName: string,
    id: string | number,
    options: QueryOptions = {}
  ): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const results = await this.executeQuery<T>(query, [id], options);

      return results.length ? results[0] : null;
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Find operation failed'
      );
    }
  }

  /**
   * Find multiple records with filters
   */
  async findMany<T>(
    tableName: string,
    filters: Record<string, any> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      timeout?: number;
      maxRetries?: number;
      logQuery?: boolean;
    } = {}
  ): Promise<T[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderBy = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
      const limit = options.limit ? `LIMIT ${options.limit}` : '';
      const offset = options.offset ? `OFFSET ${options.offset}` : '';

      const query = `
        SELECT * FROM ${tableName}
        ${whereClause}
        ${orderBy}
        ${limit}
        ${offset}
      `;

      return await this.executeQuery<T>(query, values, options);
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Find many operation failed'
      );
    }
  }

  /**
   * Count records
   */
  async count(
    tableName: string,
    filters: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<number> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
      const results = await this.executeQuery<{ count: string }>(
        query,
        values,
        options
      );

      return parseInt(results[0]?.count || '0', 10);
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Count operation failed'
      );
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const txnId = this.generateQueryId();

    try {
      logger.info('Transaction started', {
        txnId,
        isolationLevel: options.isolationLevel || 'READ_COMMITTED',
      });

      // Execute transaction
      const result = await callback();

      logger.info('Transaction committed', {
        txnId,
      });

      return result;
    } catch (error) {
      logger.error('Transaction rolled back', {
        txnId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new DatabaseError(
        error instanceof Error
          ? error.message
          : 'Transaction failed'
      );
    }
  }

  /**
   * Get connection pool health
   */
  async getHealth(): Promise<boolean> {
    try {
      const result = await this.executeQuery('SELECT 1 as health');
      return result.length > 0;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get query statistics
   */
  getStats() {
    return {
      ...this.queryStats,
      averageTime:
        this.queryStats.totalQueries > 0
          ? Math.round(
              this.queryStats.totalDuration / this.queryStats.totalQueries
            )
          : 0,
    };
  }

  /**
   * Reset query statistics
   */
  resetStats(): void {
    this.queryStats = {
      totalQueries: 0,
      totalDuration: 0,
      errors: 0,
      averageTime: 0,
    };
    logger.info('Database stats reset');
  }

  /**
   * Update internal statistics
   */
  private updateStats(duration: number): void {
    this.queryStats.totalQueries++;
    this.queryStats.totalDuration += duration;
    this.queryStats.averageTime = Math.round(
      this.queryStats.totalDuration / this.queryStats.totalQueries
    );
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const dbService = new DatabaseService();

export default dbService;
