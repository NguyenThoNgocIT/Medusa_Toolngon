"use server"

import { sdk } from "@lib/config"
import type { Document } from "@contentful/rich-text-types"
import { getLocale, setLocale } from "./cookies"

export type Locale = {
  name: string
  code: string
  is_default: boolean
}

export async function getLocales() {
  return await sdk.client.fetch<{
    locales: Locale[]
  }>("/store/locales")
}

export async function getSelectedLocale() {
  let localeCode = await getLocale()
  if (!localeCode) {
    const locales = await getLocales()
    localeCode = locales.locales.find((l) => l.is_default)?.code
  }
  return localeCode
}

export async function setSelectedLocale(locale: string) {
  await setLocale(locale)
}
export type ProductLocaleDetails = {
  id: string
  contentful_product: {
    product_id: string
    title: string
    handle: string
    description: Document
    subtitle?: string
    variants: {
      title: string
      product_variant_id: string
      options: {
        value: string
        product_option_id: string
      }[]
    }[]
    options: {
      title: string
      product_option_id: string
      values: {
        title: string
        product_option_value_id: string
      }[]
    }[]
  }
}

export async function getProductLocaleDetails(
  productId: string
) {
  const localeCode = await getSelectedLocale()

  return await sdk.client.fetch<{
    product: ProductLocaleDetails
  }>(`/store/products/${productId}/${localeCode}`)
}