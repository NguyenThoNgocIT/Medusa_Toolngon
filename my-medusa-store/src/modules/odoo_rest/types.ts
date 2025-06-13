export interface OdooProduct {
  id: number;
  name: string;
  default_code?: string;
  list_price: number;
  type: string;
}
export interface CreateProductRequest {
  name: string;
  default_code?: string;
  list_price?: number;
  type?: string;
}
export interface UpdateProductRequest {
  name?: string;
  default_code?: string;
  list_price?: number;
  type?: string;
}