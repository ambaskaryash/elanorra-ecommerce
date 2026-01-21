import xmlrpc from 'xmlrpc';
import { EventEmitter } from 'events';

interface OdooConfig {
  url: string;
  port?: number;
  db: string;
  username: string;
  password?: string;
  apiKey?: string; // Odoo often uses API keys for external access
}

interface OdooSearchReadOptions {
  fields?: string[];
  offset?: number;
  limit?: number;
  order?: string;
}

export class OdooClient extends EventEmitter {
  private config: OdooConfig;
  private common: xmlrpc.Client;
  private object: xmlrpc.Client;
  private uid: number = 0;
  private secure: boolean;

  constructor(config: OdooConfig) {
    super();
    this.config = config;
    const url = new URL(config.url);
    this.secure = url.protocol === 'https:';
    const host = url.hostname;
    const port = config.port || (this.secure ? 443 : 80);

    const clientOptions = { host, port, path: '/xmlrpc/2/common' };
    const objectOptions = { host, port, path: '/xmlrpc/2/object' };

    this.common = this.secure 
      ? xmlrpc.createSecureClient(clientOptions) 
      : xmlrpc.createClient(clientOptions);
      
    this.object = this.secure 
      ? xmlrpc.createSecureClient(objectOptions) 
      : xmlrpc.createClient(objectOptions);
  }

  async connect(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.common.methodCall(
        'authenticate',
        [
          this.config.db,
          this.config.username,
          this.config.password || this.config.apiKey,
          {}
        ],
        (error, value) => {
          if (error) {
            reject(error);
          } else if (!value) {
            reject(new Error('Authentication failed'));
          } else {
            this.uid = Number(value);
            resolve(this.uid);
          }
        }
      );
    });
  }

  async execute(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: any = {}
  ): Promise<any> {
    if (!this.uid) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.object.methodCall(
        'execute_kw',
        [
          this.config.db,
          this.uid,
          this.config.password || this.config.apiKey,
          model,
          method,
          args,
          kwargs
        ],
        (error, value) => {
          if (error) {
            reject(error);
          } else {
            resolve(value);
          }
        }
      );
    });
  }

  /**
   * Search and Read records from Odoo
   * @param model Odoo model name (e.g., 'product.template')
   * @param domain Search domain (e.g., [['type', '=', 'consu']])
   * @param options fields, offset, limit, order
   */
  async searchRead(
    model: string,
    domain: any[] = [],
    options: OdooSearchReadOptions = {}
  ): Promise<any[]> {
    return this.execute(model, 'search_read', [domain], options);
  }

  /**
   * Create a record in Odoo
   * @param model Odoo model name (e.g., 'sale.order')
   * @param data Object containing field values
   */
  async create(model: string, data: any): Promise<number> {
    return this.execute(model, 'create', [data]);
  }

  /**
   * Write/Update a record in Odoo
   * @param model Odoo model name
   * @param ids Array of IDs to update
   * @param data Object containing field values to update
   */
  async write(model: string, ids: number[], data: any): Promise<boolean> {
    return this.execute(model, 'write', [ids, data]);
  }

  /**
   * Delete records in Odoo
   * @param model Odoo model name
   * @param ids Array of IDs to delete
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.execute(model, 'unlink', [ids]);
  }
}
