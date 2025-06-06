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