
import { MedusaService } from "@medusajs/framework/utils"
import { createClient } from "contentful-management"
import { ProductDTO, ProductVariantDTO, ProductOptionDTO } from "@medusajs/framework/types"
import { EntryProps } from "contentful-management"
import { MedusaError } from "@medusajs/framework/utils"

const { createClient: createDeliveryClient } = require("contentful")

type InjectedDependencies = {
  logger: any
}

export default class ContentfulModuleService extends MedusaService({}) {
  protected logger_: any
  protected managementClient: any
  protected deliveryClient: any
  protected options: any

  constructor(
    { logger }: InjectedDependencies,
    options: any
  ) {
    super(...arguments)
    
    this.logger_ = logger
    this.options = {
      default_locale: "en-US",
      ...options,
    }

    this.managementClient = createClient({
      accessToken: options.management_access_token,
    }, {
      type: "plain",
      defaults: {
        spaceId: options.space_id,
        environmentId: options.environment,
      },
    })

    this.deliveryClient = createDeliveryClient({
      accessToken: options.delivery_token,
      space: options.space_id,
      environment: options.environment,
    })
  }

  // Phương thức tạo product variants
  private async createProductVariant(
    variants: ProductVariantDTO[],
    productEntry: EntryProps
  ) {
    for (const variant of variants) {
      await this.managementClient.entry.createWithId(
        {
          contentTypeId: "productVariant",
          entryId: variant.id,
        },
        {
          fields: {
            medusaId: {
              [this.options.default_locale!]: variant.id,
            },
            title: {
              [this.options.default_locale!]: variant.title,
            },
            product: {
              [this.options.default_locale!]: {
                sys: {
                  type: "Link",
                  linkType: "Entry",
                  id: productEntry.sys.id,
                },
              },
            },
            productOptionValues: {
              [this.options.default_locale!]: variant.options.map((option) => ({
                sys: {
                  type: "Link",
                  linkType: "Entry",
                  id: option.id,
                },
              })),
            },
          },
        }
      )
    }
  }

  // Phương thức tạo product options và values
  private async createProductOption(
    options: ProductOptionDTO[],
    productEntry: EntryProps
  ) {
    for (const option of options) {
      const valueIds: {
        sys: {
          type: "Link",
          linkType: "Entry",
          id: string
        }
      }[] = []
      
      for (const value of option.values) {
        await this.managementClient.entry.createWithId(
          {
            contentTypeId: "productOptionValue",
            entryId: value.id,
          },
          {
            fields: {
              value: {
                [this.options.default_locale!]: value.value,
              },
              medusaId: {
                [this.options.default_locale!]: value.id,
              },
            },
          }
        )
        valueIds.push({
          sys: {
            type: "Link",
            linkType: "Entry",
            id: value.id,
          },
        })
      }
      
      await this.managementClient.entry.createWithId(
        {
          contentTypeId: "productOption",
          entryId: option.id,
        },
        {
          fields: {
            medusaId: {
              [this.options.default_locale!]: option.id,
            },
            title: {
              [this.options.default_locale!]: option.title,
            },
            product: {
              [this.options.default_locale!]: {
                sys: {
                  type: "Link",
                  linkType: "Entry",
                  id: productEntry.sys.id,
                },
              },
            },
            values: {
              [this.options.default_locale!]: valueIds,
            },
          },
        }
      )
    }
  }

  // Phương thức tạo product chính
  async createProduct(product: ProductDTO) {
    try {
      // Kiểm tra xem product đã tồn tại chưa
      const productEntry = await this.managementClient.entry.get({
        environmentId: this.options.environment,
        entryId: product.id,
      })
      
      return productEntry
    } catch(e) {}

    // Tạo product entry trong Contentful
    const productEntry = await this.managementClient.entry.createWithId(
      {
        contentTypeId: "product",
        entryId: product.id,
      },
      {
        fields: {
          medusaId: {
            [this.options.default_locale!]: product.id,
          },
          title: {
            [this.options.default_locale!]: product.title,
          },
          description: product.description ? {
            [this.options.default_locale!]: {
              nodeType: "document",
              data: {},
              content: [
                {
                  nodeType: "paragraph",
                  data: {},
                  content: [
                    {
                      nodeType: "text",
                      value: product.description,
                      marks: [],
                      data: {},
                    },
                  ],
                },
              ],
            },
          } : undefined,
          subtitle: product.subtitle ? {
            [this.options.default_locale!]: product.subtitle,
          } : undefined,
          handle: product.handle ? {
            [this.options.default_locale!]: product.handle,
          } : undefined,
        },
      }
    )

    // Tạo options nếu có
    if (product.options?.length) {
      await this.createProductOption(product.options, productEntry)
    }

    // Tạo variants nếu có
    if (product.variants?.length) {
      await this.createProductVariant(product.variants, productEntry)
    }

    // Cập nhật product entry với variants và options
    await this.managementClient.entry.update(
      {
        entryId: productEntry.sys.id,
      },
      {
        sys: productEntry.sys,
        fields: {
          ...productEntry.fields,
          productVariants: {
            [this.options.default_locale!]: product.variants?.map((variant) => ({
              sys: {
                type: "Link",
                linkType: "Entry",
                id: variant.id,
              },
            })),
          },
          productOptions: {
            [this.options.default_locale!]: product.options?.map((option) => ({
              sys: {
                type: "Link",
                linkType: "Entry",
                id: option.id,
              },
            })),
          },
        },
      }
    )

    return productEntry
  }

  // Phương thức xóa product
  async deleteProduct(productId: string) {
    try {
      // Lấy product entry
      const productEntry = await this.managementClient.entry.get({
        environmentId: this.options.environment,
        entryId: productId,
      })

      if (!productEntry) {
        return
      }

      // Xóa product entry
      await this.managementClient.entry.unpublish({
        environmentId: this.options.environment,
        entryId: productId,
      })

      await this.managementClient.entry.delete({
        environmentId: this.options.environment,
        entryId: productId,
      })

      // Xóa product variant entries
      for (const variant of productEntry.fields.productVariants[this.options.default_locale!]) {
        await this.managementClient.entry.unpublish({
          environmentId: this.options.environment,
          entryId: variant.sys.id,
        })

        await this.managementClient.entry.delete({
          environmentId: this.options.environment,
          entryId: variant.sys.id,
        })
      }

      // Xóa product options entries và values
      for (const option of productEntry.fields.productOptions[this.options.default_locale!]) {
        for (const value of option.fields.values[this.options.default_locale!]) {
          await this.managementClient.entry.unpublish({
            environmentId: this.options.environment,
            entryId: value.sys.id,
          })

          await this.managementClient.entry.delete({
            environmentId: this.options.environment,
            entryId: value.sys.id,
          })
        }

        await this.managementClient.entry.unpublish({
          environmentId: this.options.environment,
          entryId: option.sys.id,
        })

        await this.managementClient.entry.delete({
          environmentId: this.options.environment,
          entryId: option.sys.id,
        })
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to delete product from Contentful: ${error.message}`
      )
    }
  }
  async getLocales(){
    return await this.managementClient.locale.getMany({})
}
async getDefaultLocaleCode(){
  return await this.options.default_locale
}
}
