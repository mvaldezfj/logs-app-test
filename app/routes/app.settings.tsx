import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, Form } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Button, BlockStack } from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const webhooks = await admin.rest.resources.Webhook.all({ session });
    const collectionCreateWebhook = webhooks.data.find(
      (webhook) => webhook.topic === "collections/delete",
    );

    return json({ isSubscribed: !!collectionCreateWebhook });
  } catch (error: any) {
    return json({ isSubscribed: false, error: error.message }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const isChecked = formData.get("subscribe") === "on";
  console.log(isChecked)

  try {
    if (isChecked) {
      const webhook = new admin.rest.resources.Webhook({ session });

      webhook.address =
        "https://offices-build-shift-diamond.trycloudflare.com/webhooks";
      webhook.topic = "collections/delete";
      webhook.format = "json";
      await webhook.save({
        update: true,
      });
    } else {
      const webhooks = await admin.rest.resources.Webhook.all({ session });
      const collectionCreateWebhook = webhooks.data.find(
        (webhook) => webhook.topic === "collections/delete",
      );
      console.log("WEBHOOKS", webhooks, collectionCreateWebhook)
      if (collectionCreateWebhook) {
        await admin.rest.resources.Webhook.delete({
          session,
          id: collectionCreateWebhook.id!,
        });
      }
    }

    return redirect("/app/settings");
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
}

export default function Settings() {
  const actionData = useActionData<typeof action>();
  const { isSubscribed: initialSubscribed } = useLoaderData<typeof loader>();

  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);

  const handleCheckboxChange = (newCheckedValue: boolean) => {
    console.log("From checkbox", newCheckedValue);
    setIsSubscribed(newCheckedValue);
  };

  return (
    <Page>
      <TitleBar title="Settings page" />
      <Form method="post">
        <BlockStack align="center">
            <label htmlFor="subscribe">Collections create notifications</label>
          <input
            id="subscribe"
            type="checkbox"
            name="subscribe"
            checked={isSubscribed}
            onChange={(val) => handleCheckboxChange(val.target.checked)}
          />
          <Button submit>Submit</Button>
        </BlockStack>
      </Form>
      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
    </Page>
  );
}
