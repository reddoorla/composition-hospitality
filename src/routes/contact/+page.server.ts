import { asText } from "@prismicio/client";
import { env } from "$env/dynamic/private";
import { createIngestAction } from "@reddoorla/maintenance/forms";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import type { Actions, PageServerLoad } from "./$types";

// The root layout sets `prerender = "auto"`; a form `action` cannot run on a
// prerendered route ("Cannot prerender pages with actions"). Opt out — this
// route is genuinely dynamic.
export const prerender = false;

// The page's COPY is editable in Prismic (the "contact" page document); the
// form below it is not, because a form `action` cannot run on a prerendered
// route. So this route owns the form and borrows the copy, and "contact" is
// excluded from the [uid] catch-all's entries() so the two never generate the
// same path.
//
// A Prismic miss is never fatal here. On an unconfigured clone
// (`isPlaceholderRepo`) or a missing/unpublished document the form still
// renders with its built-in heading — a contact form that 404s because a CMS
// lookup failed is a worse outcome than one without its intro copy.
//
// Also plants a per-request timestamp for the bot timing screen. `title` flows
// to the root layout's <Seo> (static routes set head via data, not their own
// tags).
export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const page = isPlaceholderRepo
    ? null
    : await createClient({ fetch, cookies })
        .getByUID("page", "contact")
        .catch(() => null);

  return {
    page,
    formTs: Date.now(),
    title: page ? asText(page.data.title) : "Contact",
  };
};

export const actions: Actions = {
  default: createIngestAction({
    formType: "contact",
    getConfig: () => ({
      url: env.FORMS_INGEST_URL,
      token: env.FORMS_INGEST_TOKEN,
    }),
    buildPayload: (form, event) => ({
      name: form.get("name")?.toString(),
      email: form.get("email")?.toString(),
      phone: form.get("phone")?.toString(),
      message: form.get("message")?.toString(),
      // Full URL incl. query string so UTM/campaign params (?utm_source=…) are captured.
      sourceUrl: event.url.href,
      // Synthetic end-to-end probe marker (the fleet `form-e2e` audit). Forwarded
      // ONLY when the submitted form carries testMode=true — a real visitor never
      // sets it. Rides through as an extraField (no schema change); central ingest
      // recognizes it and routes the submission away from every real sink.
      testMode: form.get("testMode")?.toString() === "true" || undefined,
    }),
  }),
};
