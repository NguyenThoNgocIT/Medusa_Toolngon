import { service } from "@medusajs/medusa/event-bus-local"
import { JSONRPCClient } from "json-rpc-2.0"

type Options = {
  url: string
  dbName: string
  username: string
  apiKey: string
}

export default class OdooModuleService {
  private options: Options
  private client: JSONRPCClient
  private uid?: number

  constructor({}, options: Options) {
    this.options = options

    this.client = new JSONRPCClient((jsonRPCRequest) => {
      return fetch(`${options.url}/jsonrpc`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(jsonRPCRequest),
      }).then((response) => {
        if (response.status === 200) {
          return response
            .json()
            .then((jsonRPCResponse) => this.client.receive(jsonRPCResponse))
            .catch((error) => {
              console.error("JSON parsing error:", error)
              throw new Error("Failed to parse Odoo response")
            })
        } else if (jsonRPCRequest.id !== undefined) {
          return Promise.reject(new Error(response.statusText))
        }
      })
    })
  }

  async login(): Promise<number> {
    try {
      this.uid = await this.client.request("call", {
        service: "common",
        method: "authenticate",
        args: [
          this.options.dbName,
          this.options.username,
          this.options.apiKey,
          {}
        ],
      })

      if (!this.uid) {
        throw new Error("Odoo login failed: uid is undefined")
      }

      console.log("Successfully logged in to Odoo with UID:", this.uid)
      return this.uid
    } catch (error: any) {
      console.error("Failed to login to Odoo:", error?.message || error)
      if (error?.data) {
        console.error("Odoo error data:", error.data)
      }
      throw new Error(`Odoo login failed: ${error.message}`)
    }
  }

  async listProducts(filters: any[] = [], pagination?: Pagination): Promise<OdooProduct[]> {
    try {
      if (!this.uid) {
        await this.login()
      }

      // Đảm bảo domain luôn là mảng hợp lệ
      const domain = Array.isArray(filters) ? filters : []
      
      const offset = pagination?.offset || 0
      const limit = pagination?.limit || 10

      console.log("Fetching products from Odoo with domain:", domain, "and pagination:", { offset, limit })

      // Bước 1: Tìm kiếm ID sản phẩm
      const ids = await this.client.request("call", {
        service: "object",
        method: "execute_kw",
        args: [
          this.options.dbName, 
          this.uid, 
          this.options.apiKey, 
          "product.template", 
          "search", 
          [domain], // Truyền domain như một mảng
          {
            offset,
            limit,
          },
        ],
      })

      if (!ids || !Array.isArray(ids)) {
        throw new Error("Invalid product IDs returned from Odoo")
      }

      console.log(`Found ${ids.length} product IDs from Odoo`)

      // Bước 2: Lấy chi tiết sản phẩm
      const productSpecifications = {
        id: {},
        display_name: {},
        is_published: {},
        website_url: {},
        name: {},
        list_price: {},
        description: {},
        description_sale: {},
        qty_available: {},
        location_id: {},
        taxes_id: {},
        hs_code: {},
        allow_out_of_stock_order: {},
        image_1920: {},
        image_1024: {},
        image_512: {},
        image_256: {},
        currency_id: {
          fields: {
            display_name: {},
          },
        },
      }

      const type = "product.template"
      const products: OdooProduct[] = await this.client.request("call", {
        service: "object",
        method: "execute_kw",
        args: [
          this.options.dbName, 
          this.uid, 
          this.options.apiKey, 
          type, 
          "web_read", 
          [ids], 
          {
            specification: {
              ...productSpecifications,
              product_variant_ids: {
                fields: {
                  ...productSpecifications,
                  product_template_variant_value_ids: {
                    fields: {
                      name: {},
                      attribute_id: {
                        fields: {
                          display_name: {},
                        },
                      },
                    },
                    context: {
                      show_attribute: false,
                    },
                  },
                  code: {},
                },
                context: {
                  show_code: false,
                },
              },
              attribute_line_ids: {
                fields: {
                  attribute_id: {
                    fields: {
                      display_name: {},
                    },
                  },
                  value_ids: {
                    fields: {
                      display_name: {},
                    },
                    context: {
                      show_attribute: false,
                    },
                  },
                },
              },
            },
          },
        ],
      })

      console.log(`Successfully fetched ${products.length} products from Odoo`)
      return products
    } catch (error) {
      console.error("Error in listProducts:", error)
      throw new Error(`Failed to list products from Odoo: ${error.message}`)
    }
  }
}

export type Pagination = {
  offset?: number
  limit?: number
}

export type OdooProduct = {
  id: number
  display_name: string
  is_published: boolean
  website_url: string
  name: string
  list_price: number
  description: string | false
  description_sale: string | false
  product_variant_ids: OdooProductVariant[]
  qty_available: number
  location_id: number | false
  taxes_id: number[]
  hs_code: string | false
  allow_out_of_stock_order: boolean
  is_kits: boolean
  image_1920: string
  image_1024: string
  image_512: string
  image_256: string
  image_128: string
  attribute_line_ids: {
    attribute_id: {
      display_name: string
    }
    value_ids: {
      display_name: string
    }[]
  }[]
  currency_id: {
    id: number
    display_name: string
  }
}

export type OdooProductVariant = Omit<
  OdooProduct, 
  "product_variant_ids" | "attribute_line_ids"
> & {
  product_template_variant_value_ids: {
    id: number
    name: string
    attribute_id: {
      display_name: string
    }
  }[]
  code: string
}