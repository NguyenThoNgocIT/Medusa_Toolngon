import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import OdooRestService from "../../../../modules/odoo_rest/service";
import type { OdooProduct, CreateProductRequest, UpdateProductRequest } from "../../../../modules/odoo_rest/types";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const odooRestService = req.scope.resolve("odoo_rest") as OdooRestService;
    console.log(`[${new Date().toISOString()}] Resolved odooRestService: ${!!odooRestService}`);
    
    const products = await odooRestService.getProducts();
    console.log(`[${new Date().toISOString()}] Fetched ${products.length} products from Odoo`);

    res.json({
      products,
      count: products.length,
      status: "success",
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in GET /admin/odoo_rest/products:`, error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch products",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function GET_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        status: "error",
        error: "Invalid product ID",
      });
    }

    const odooRestService = req.scope.resolve("odoo_rest") as OdooRestService;
    console.log(`[${new Date().toISOString()}] Resolved odooRestService for ID ${id}: ${!!odooRestService}`);

    const product = await odooRestService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        error: `Product with ID ${id} not found`,
      });
    }

    console.log(`[${new Date().toISOString()}] Fetched product ID ${id} from Odoo`);
    res.json({
      product,
      status: "success",
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in GET /admin/odoo_rest/products/${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch product",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const odooRestService = req.scope.resolve("odoo_rest") as OdooRestService;
    console.log(`[${new Date().toISOString()}] Resolved odooRestService for POST: ${!!odooRestService}`);

    const body = req.body as CreateProductRequest;
    if (!body.name) {
      return res.status(400).json({
        status: "error",
        error: "Product 'name' is required",
      });
    }

    // Validate optional fields
    const productData: CreateProductRequest = {
      name: body.name,
      default_code: body.default_code?.trim() || undefined,
      list_price: typeof body.list_price === "number" ? body.list_price : undefined,
      type: body.type?.trim() || undefined,
    };

    const product = await odooRestService.createProduct(productData);
    console.log(`[${new Date().toISOString()}] Created product ID ${product.id} in Odoo`);

    res.status(201).json({
      product,
      status: "success",
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in POST /admin/odoo_rest/products:`, error);
    res.status(500).json({
      status: "error",
      error: "Failed to create product",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        status: "error",
        error: "Invalid product ID",
      });
    }

    const odooRestService = req.scope.resolve("odoo_rest") as OdooRestService;
    console.log(`[${new Date().toISOString()}] Resolved odooRestService for PUT ID ${id}: ${!!odooRestService}`);

    const body = req.body as UpdateProductRequest;
    if (!body.name && !body.default_code && body.list_price === undefined && !body.type) {
      return res.status(400).json({
        status: "error",
        error: "At least one field (name, default_code, list_price, type) is required",
      });
    }

    // Validate optional fields
    const productData: UpdateProductRequest = {
      name: body.name?.trim() || undefined,
      default_code: body.default_code?.trim() || undefined,
      list_price: typeof body.list_price === "number" ? body.list_price : undefined,
      type: body.type?.trim() || undefined,
    };

    const product = await odooRestService.updateProduct(id, productData);
    console.log(`[${new Date().toISOString()}] Updated product ID ${id} in Odoo`);

    res.json({
      product,
      status: "success",
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in PUT /admin/odoo_rest/products/${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Failed to update product",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        status: "error",
        error: "Invalid product ID",
      });
    }

    const odooRestService = req.scope.resolve("odoo_rest") as OdooRestService;
    console.log(`[${new Date().toISOString()}] Resolved odooRestService for DELETE ID ${id}: ${!!odooRestService}`);

    await odooRestService.deleteProduct(id);
    console.log(`[${new Date().toISOString()}] Deleted product ID ${id} in Odoo`);

    res.json({
      id,
      status: "success",
      message: `Product ID ${id} deleted successfully`,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in DELETE /admin/odoo_rest/products/${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Failed to delete product",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}