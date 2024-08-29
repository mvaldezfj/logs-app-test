import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  
  const { topic, shop, session, admin, payload, subTopic } =
  await authenticate.webhook(request);
  console.log("HIT", request.headers, payload);

  if (!admin && topic !== "SHOP_REDACT") {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    // The SHOP_REDACT webhook will be fired up to 48 hours after a shop uninstalls the app.
    // Because of this, no admin context is available.
    throw new Response();
  }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;
    case "COLLECTIONS_DELETE":
      console.log(payload)
      const addedCollectionDeleteRow = await db.event.create({
        data: {
          author: "Admin",
          arguments: "",
          createdAt: new Date(),
          description: "Title",
          path: "",
          message: "Collection deleted webhook",
          subjectType: "COLLECTION DELETED WEBHOOK",
          eventId: BigInt(Math.round(Math.random() * 500)),
          subjectId: 0,
          verb: "",
          userId: shop,
        },
      });
      if (addedCollectionDeleteRow) {
        redirect("/app");
        console.log("COLLECTION DELETE WEBHOOK", addedCollectionDeleteRow);
      }
      break;
    case "PRODUCTS_UPDATE":
      const addedRow = await db.event.create({
        data: {
          author: payload.vendor,
          arguments: "",
          createdAt: payload.updated_at,
          description: payload.title,
          path: "",
          message: "Product updated",
          subjectType: "PRODUCT UPDATED",
          eventId: BigInt(Math.round(Math.random() * 500)),
          subjectId: 0,
          verb: "",
          userId: shop,
        },
      });
      if (addedRow) {
        redirect("/app");
        console.log("PRODUCT REDACT WEBHOOK", addedRow);
      }
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
