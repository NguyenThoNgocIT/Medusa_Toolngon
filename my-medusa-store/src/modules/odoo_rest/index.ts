import { Module } from "@medusajs/framework/utils"
import OdooRestService from "./service"

export default Module("odoo_rest", {
  service: OdooRestService
})
export * from"./types"