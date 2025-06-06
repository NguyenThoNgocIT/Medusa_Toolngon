// import { JSONRPCClient } from "json-rpc-2.0"

// type Options = {
//   url: string
//   dbName: string
//   username: string
//   apiKey: string
// }

// export default class OdooModuleService {
//   private options: Options
//   private client: JSONRPCClient
//   private uid?: number

//   constructor({}, options: Options) {
    
//     this.options = options

//     this.client = new JSONRPCClient((jsonRPCRequest) => {
//       return fetch(`${options.url}/jsonrpc`, {
//         method: "POST",
//         headers: {
//           "content-type": "application/json",
//         },
//         body: JSON.stringify(jsonRPCRequest),
//       }).then((response) => {
//         if (response.status === 200) {
//           // Use client.receive when you received a JSON-RPC response.
//           return response
//             .json()
//             .then((jsonRPCResponse) => this.client.receive(jsonRPCResponse))
//         } else if (jsonRPCRequest.id !== undefined) {
//           return Promise.reject(new Error(response.statusText))
//         }
//       })
//     })
//   }
//      async login() {
//       try {
//     this.uid = await this.client.request("call", {
//       service: "common",
//       method: "authenticate",
//       args: [
//         this.options.dbName, 
//         this.options.username, 
//         this.options.apiKey, 
//         {},
//       ],
//     })
//     if(!this.uid) {
//       throw new Error("Failed to authenticate with Odoo")
//     }
//   } catch (error) {
//     console.error("Error during Odoo login:", error)
//     throw error
//   }
// }
//   async listProducts(filters?: any, pagination?: Pagination) {
//     try {
//     if (!this.uid) {
//       await this.login()
//     }

//     const { offset, limit } = pagination || { offset: 0, limit: 10 }

//     const ids = await this.client.request("call", {
//       service: "object",
//       method: "execute_kw",
//       args: [
//         this.options.dbName, 
//         this.uid, 
//         this.options.apiKey, 
//         "product.template", 
//         "search", 
//         filters || [[
//           ["is_product_variant", "=", false],
//         ]], {
//           offset,
//           limit,
//         },
//       ],
//     })
//     if(!ids || ids.length === 0) {
//       return []
//     }
//     // TODO retrieve product details based on ids
//     // product fields to retrieve
// const productSpecifications = {
//   id: {},
//   display_name: {},
//   is_published: {},
//   website_url: {},
//   name: {},
//   list_price: {},
//   description: {},
//   description_sale: {},
//   qty_available: {},
//   location_id: {},
//   taxes_id: {},
//   hs_code: {},
//   allow_out_of_stock_order: {},
//   is_kits: {},
//   image_1920: {},
//   image_1024: {},
//   image_512: {},
//   image_256: {},
//    image_128: {}, // Thêm field này vào specification
//   currency_id: {
//     fields: {
//       display_name: {},
//     },
//   },
// }

// // retrieve products
// const products: OdooProduct[] = await this.client.request("call", {
//   service: "object",
//   method: "execute_kw",
//   args: [
//     this.options.dbName, 
//     this.uid, 
//     this.options.apiKey, 
//     "product.template", 
//     "web_read", 
//     [ids], 
//     {
//       specification: {
//         ...productSpecifications,
//         product_variant_ids: {
//           fields: {
//             ...productSpecifications,
//             product_template_variant_value_ids: {
//               fields: {
//                 name: {},
//                 attribute_id: {
//                   fields: {
//                     display_name: {},
//                   },
//                 },
//               },
//               context: {
//                 show_attribute: false,
//               },
//             },
//             code: {},
//           },
//           context: {
//             show_code: false,
//           },
//         },
//         attribute_line_ids: {
//           fields: {
//             attribute_id: {
//               fields: {
//                 display_name: {},
//               },
//             },
//             value_ids: {
//               fields: {
//                 display_name: {},
//               },
//               context: {
//                 show_attribute: false,
//               },
//             },
//           },
//         },
//       },
//     },
//   ],
// })

// return products
//   }catch (error) {
//     console.error(`Error listing products:, ${error.message}`)
    
//   }
//   }
// }
// export type Pagination = {
//   offset?: number
//   limit?: number
// }

// export type OdooProduct = {
//   id: number
//   display_name: string
//   is_published: boolean
//   website_url: string
//   name: string
//   list_price: number
//   description: string | false
//   description_sale: string | false
//   product_variant_ids: OdooProductVariant[]
//   qty_available: number
//   location_id: number | false
//   taxes_id: number[]
//   hs_code: string | false
//   allow_out_of_stock_order: boolean
//   is_kits: boolean
//   image_1920: string
//   image_1024: string
//   image_512: string
//   image_256: string
//   image_128: string
//   attribute_line_ids: {
//     attribute_id: {
//       display_name: string
//     }
//     value_ids: {
//       display_name: string
//     }[]
//   }[]
//   currency_id: {
//     id: number
//     display_name: string
//   }
// }

// export type OdooProductVariant = Omit<
//   OdooProduct, 
//   "product_variant_ids" | "attribute_line_ids"
// > & {
//   product_template_variant_value_ids: {
//     id: number
//     name: string
//     attribute_id: {
//       display_name: string
//     }
//   }[]
//   code: string
// }
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
        } else if (jsonRPCRequest.id !== undefined) {
          return Promise.reject(new Error(response.statusText))
        }
      })
    })
  }

  async login() {
    try {
      this.uid = await this.client.request("call", {
        service: "common",
        method: "authenticate",
        args: [
          this.options.dbName, 
          this.options.username, 
          this.options.apiKey, 
          {},
        ],
      })
      
      if (!this.uid) {
        throw new Error("Failed to authenticate with Odoo")
      }
      
      console.log("✅ Odoo login successful, UID:", this.uid)
    } catch (error) {
      console.error("❌ Error during Odoo login:", error)
      throw error
    }
  }

  async listProducts(filters?: any, pagination?: Pagination) {
    try {
      if (!this.uid) {
        await this.login()
      }

      const { offset, limit } = pagination || { offset: 0, limit: 10 }

      console.log("🔍 Searching products with filters:", filters)
      
      // Sửa lỗi: filters phải là array chứa array
      const searchFilters = filters || [
        ["is_product_variant", "=", false],
        ["active", "=", true] // Thêm điều kiện sản phẩm active
      ]

      const ids = await this.client.request("call", {
        service: "object",
        method: "execute_kw",
        args: [
          this.options.dbName, 
          this.uid, 
          this.options.apiKey, 
          "product.template", 
          "search", 
          [searchFilters], // Phải wrap trong array
          {
            offset,
            limit,
          },
        ],
      })

      console.log("📋 Found product IDs:", ids)

      if (!ids || ids.length === 0) {
        console.log("⚠️ No products found")
        return []
      }

      // Product fields to retrieve
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
        is_kits: {},
        image_1920: {},
        image_1024: {},
        image_512: {},
        image_256: {},
        image_128: {},
        active: {}, // Thêm field active
        currency_id: {
          fields: {
            id: {},
            display_name: {},
            name: {}, // Thêm name để lấy currency code
          },
        },
      }

      // Retrieve products
      const products: OdooProduct[] = await this.client.request("call", {
        service: "object",
        method: "execute_kw", // Thay đổi từ web_read thành read
        args: [
          this.options.dbName, 
          this.uid, 
          this.options.apiKey, 
          "product.template", 
          "read", 
          [ids], 
          Object.keys(productSpecifications)
        ],
      })

      // Lấy thêm thông tin variants nếu cần
      for (const product of products) {
        if (product.product_variant_ids && product.product_variant_ids.length > 0) {
          const variantIds = Array.isArray(product.product_variant_ids) 
            ? product.product_variant_ids 
            : [product.product_variant_ids]
            
          const variants = await this.client.request("call", {
            service: "object",
            method: "execute_kw",
            args: [
              this.options.dbName,
              this.uid,
              this.options.apiKey,
              "product.product",
              "read",
              [variantIds],
              ["id", "display_name", "list_price", "default_code", "active"]
            ],
          })
          
          product.product_variant_ids = variants
        }
      }

      console.log(`✅ Retrieved ${products.length} products from Odoo`)
      return products

    } catch (error) {
      console.error(`❌ Error listing products: ${error.message}`)
      throw error // Ném lỗi thay vì return undefined
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
  product_variant_ids: any[] // Simplified type
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
  active: boolean
  currency_id: {
    id: number
    display_name: string
    name: string
  }
}

export type OdooProductVariant = {
  id: number
  display_name: string
  list_price: number
  default_code: string
  active: boolean
}