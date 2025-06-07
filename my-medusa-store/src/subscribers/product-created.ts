import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendEmailWorkflow } from "../workflows/send-email"
export default async function productCreateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const { data: [product] } = await query.graph({
    entity: "product",
    fields: ["*"],
    filters: {
      id: data.id,
    },
  })

  await notificationModuleService.createNotifications({
    to: "test@gmail.com",
    channel: "email",
    template: "product-created",
    data: {
      product_title: product.title,
      product_image: product.images[0]?.url,
    },
  })
}

export const config: SubscriberConfig = {
  event: "product.created",
}