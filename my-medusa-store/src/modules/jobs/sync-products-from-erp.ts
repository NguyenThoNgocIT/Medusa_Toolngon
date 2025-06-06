// import {
//   MedusaContainer,
// } from "@medusajs/framework/types"
// import { syncFromErpWorkflow } from "../../workflows/sync-from-erp"
// import { OdooProduct } from "../../modules/odoo/service"

// export default async function syncProductsJob(container: MedusaContainer) {
//   const limit = 10
//   let offset = 0
//   let total = 0
//   let odooProducts: OdooProduct[] = []

//   console.log("Syncing products...")

//   do {
//     odooProducts = (await syncFromErpWorkflow(container).run({
//       input: {
//         limit,
//         offset,
//       },
//     })).result.odooProducts

//     offset += limit
//     total += odooProducts.length
//   } while (odooProducts.length > 0)

//   console.log(`Synced ${total} products`)
// }

// export const config = {
//   name: "daily-product-sync",
//   schedule: "0 0 * * *", // Every day at midnight
// }

// Tạo file debug-sync.ts để test thủ công
import { syncFromErpWorkflow } from "../../workflows/sync-from-erp"

export default async function debugSync(container) {
  console.log("🚀 Bắt đầu debug đồng bộ...")
  
  try {
    // Test kết nối Odoo
    const odooService = container.resolve("odoo")
    console.log("✅ Odoo service resolved")
    
    // Test login
    await odooService.login()
    console.log("✅ Odoo login thành công")
    
    // Test lấy sản phẩm
    const products = await odooService.listProducts(undefined, { offset: 0, limit: 5 })
    console.log(`📦 Tìm thấy ${products?.length || 0} sản phẩm từ Odoo:`)
    
    if (products && products.length > 0) {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, Name: ${product.display_name}, Published: ${product.is_published}`)
      })
    }
    
    // Test workflow
    const result = await syncFromErpWorkflow(container).run({
      input: { limit: 5, offset: 0 }
    })
    
    console.log("🔄 Workflow completed:", result.result)
    
  } catch (error) {
    console.error("❌ Lỗi:", error)
  }
}