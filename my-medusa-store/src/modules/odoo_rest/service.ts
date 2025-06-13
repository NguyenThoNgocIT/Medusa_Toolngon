import axios from "axios";
import type { OdooProduct, CreateProductRequest, UpdateProductRequest } from "./types";

interface OdooRestServiceOptions {
  odoo_base_url?: string;
  username?: string;
  password?: string;
  db?: string;
}

class OdooRestService {
  private odooBaseUrl: string;
  private username: string;
  private password: string;
  private db: string;
  private apiKey: string;

  constructor(container: any, options: OdooRestServiceOptions = {}) {
    this.odooBaseUrl = options.odoo_base_url || process.env.ODOO_BASE_URL || "http://localhost:8069";
    this.username = options.username || process.env.ODOO_USERNAME || "nguyenthongoc22072004@gmail.com";
    this.password = options.password || process.env.ODOO_PASSWORD || "nguyenthongoc";
    this.db = options.db || process.env.ODOO_DB_NAME || "medusa_store-v1";
    this.apiKey = "";
  }

  private async authenticate(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Authenticating with Odoo at ${this.odooBaseUrl}/odoo_connect`);
    const response = await axios.get(`${this.odooBaseUrl}/odoo_connect`, {
      headers: {
        "Content-Type": "application/json",
        login: this.username,
        password: this.password,
        db: this.db,
      },
    });

    const data = response.data;
    console.log(`[${new Date().toISOString()}] /odoo_connect response: ${JSON.stringify(data).slice(0, 200)}...`);

    if (response.status !== 200) {
      throw new Error(`Failed to authenticate with Odoo: ${response.status} - ${JSON.stringify(data)}`);
    }

    if (data.error) {
      throw new Error(`Authentication error: ${JSON.stringify(data.error)}`);
    }
    if (!data["api-key"]) {
      throw new Error("No api-key found in /odoo_connect response");
    }
    this.apiKey = data["api-key"];
    console.log(`[${new Date().toISOString()}] Authentication successful, api-key: ${this.apiKey}`);
  }

  private async requestWithAuth(url: string, options: any = {}, retryCount = 0): Promise<any> {
    if (retryCount > 2) {
      throw new Error("Max retry attempts reached for authentication");
    }

    if (!this.apiKey) {
      await this.authenticate();
    }

    const config = {
      ...options,
      url,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        "api-key": this.apiKey,
        login: this.username,
        password: this.password,
      },
    };

    console.log(`[${new Date().toISOString()}] Sending request to ${url} with method ${options.method || "GET"}`);
    try {
      const response = await axios(config);
      const data = response.data;

      if (response.status !== 200) {
        console.error(`[${new Date().toISOString()}] Request failed: ${response.status} - ${JSON.stringify(data)}`);
        throw new Error(`Request to ${url} failed: ${response.status} - ${JSON.stringify(data)}`);
      }

      if (data.error) {
        console.error(`[${new Date().toISOString()}] Odoo error: ${data.error}`);
        throw new Error(`Odoo request failed: ${data.error}`);
      }

      console.log(`[${new Date().toISOString()}] Response: ${JSON.stringify(data).slice(0, 200)}...`);
      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`[${new Date().toISOString()}] 401 Unauthorized, retrying authentication (${retryCount + 1}/3)`);
        this.apiKey = "";
        return this.requestWithAuth(url, options, retryCount + 1);
      }
      console.error(`[${new Date().toISOString()}] Request error:`, error.message);
      throw error;
    }
  }

  async getProducts(): Promise<OdooProduct[]> {
    const url = `${this.odooBaseUrl}/send_request?model=product.template`;
    const data = await this.requestWithAuth(url, {
      method: "GET",
      data: {
        fields: ["id", "name", "default_code", "list_price", "type"],
        domain: [], // Lấy tất cả
      },
    });

    console.log(`[${new Date().toISOString()}] getProducts response:`, JSON.stringify(data, null, 2));

    if (!data.records || !Array.isArray(data.records)) {
      console.warn(`[${new Date().toISOString()}] Empty or invalid records in response: ${JSON.stringify(data)}`);
      return [];
    }

    return data.records.map((record: any) => ({
      id: record.id,
      name: record.name,
      default_code: record.default_code || undefined,
      list_price: record.list_price || 0,
      type: record.type || "product",
    }));
  }

  async getProductById(id: number): Promise<OdooProduct | null> {
    const url = `${this.odooBaseUrl}/send_request?model=product.template&Id=${id}`;
    const data = await this.requestWithAuth(url, {
      method: "GET",
      data: {
        fields: ["id", "name", "default_code", "list_price", "type"],
        domain: [['id', '=', id]],
      },
    });

    console.log(`[${new Date().toISOString()}] getProductById(${id}) response:`, JSON.stringify(data, null, 2));

    if (!data.records || !Array.isArray(data.records) || data.records.length === 0) {
      console.warn(`[${new Date().toISOString()}] No product found with ID ${id}`);
      return null;
    }

    const record = data.records[0];
    return {
      id: record.id,
      name: record.name,
      default_code: record.default_code || undefined,
      list_price: record.list_price || 0,
      type: record.type || "product",
    };
  }

  async createProduct(productData: CreateProductRequest): Promise<OdooProduct> {
    const url = `${this.odooBaseUrl}/send_request?model=product.template`;
    const data = await this.requestWithAuth(url, {
      method: "POST",
      data: {
        fields: Object.keys(productData),
        values: {
          name: productData.name,
          default_code: productData.default_code,
          list_price: productData.list_price || 0,
          type: productData.type || "product",
        },
      },
    });

    console.log(`[${new Date().toISOString()}] createProduct response:`, JSON.stringify(data, null, 2));

    if (!data.result || !data.result.id) {
      throw new Error(`Failed to create product: ${JSON.stringify(data)}`);
    }

    return {
      id: data.result.id,
      name: data.result.name,
      default_code: data.result.default_code || undefined,
      list_price: data.result.list_price || 0,
      type: data.result.type || "product",
    };
  }

  async updateProduct(id: number, productData: UpdateProductRequest): Promise<OdooProduct> {
    const url = `${this.odooBaseUrl}/send_request?model=product.template&Id=${id}`;
    const data = await this.requestWithAuth(url, {
      method: "PUT",
      data: {
        fields: Object.keys(productData),
        values: {
          name: productData.name,
          default_code: productData.default_code,
          list_price: productData.list_price,
          type: productData.type,
        },
      },
    });

    console.log(`[${new Date().toISOString()}] updateProduct(${id}) response:`, JSON.stringify(data, null, 2));

    if (!data.result || !data.result.id) {
      throw new Error(`Failed to update product: ${JSON.stringify(data)}`);
    }

    return {
      id: data.result.id,
      name: data.result.name,
      default_code: data.result.default_code || undefined,
      list_price: data.result.list_price || 0,
      type: data.result.type || "product",
    };
  }

  async deleteProduct(id: number): Promise<void> {
    const url = `${this.odooBaseUrl}/send_request?model=product.template&Id=${id}`;
    const data = await this.requestWithAuth(url, {
      method: "DELETE",
    });

    console.log(`[${new Date().toISOString()}] deleteProduct(${id}) response:`, JSON.stringify(data, null, 2));

    if (!data.result || !data.result.success) {
      throw new Error(`Failed to delete product: ${JSON.stringify(data)}`);
    }
  }
}

export default OdooRestService;