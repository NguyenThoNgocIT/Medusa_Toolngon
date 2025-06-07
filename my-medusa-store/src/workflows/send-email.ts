import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { 
  sendNotificationsStep, 
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

type WorkflowInput = {
  id: string
}

export const sendEmailWorkflow = createWorkflow(
  "send-email-workflow",
  ({ id }: WorkflowInput) => {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "*",
        "variants.*",
      ],
      filters: {
        id,
      },
    })

    sendNotificationsStep({
      to: "test@gmail.com",
      channel: "email",
      template: "product-created",
      data: {
        product_title: products[0].title,
        product_image: products[0].images[0]?.url,
      },
    })
  }
)