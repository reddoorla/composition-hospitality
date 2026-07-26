<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { page } from "$app/state";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";
  import pages from "$lib/blux/page-slices.json";

  const uid = $derived(page.params["uid"] ?? "home");
  const slices = $derived((pages as Record<string, unknown[]>)[uid] ?? []);
</script>

<!-- The converted multi-page site straight from `blux convert` output: each
     page's migration-plan slices (page-slices.json, keyed by uid) through the
     same SliceZone wiring the Prismic-backed routes use, with the manifest
     page selected by the same uid. This is the pre-migrate render — the
     fidelity-verification vehicle (/dev/blux-site/home, /dev/blux-site/about,
     …). Media loads from the export's CDN until `blux migrate` re-hosts it. -->
<SliceZone
  slices={slices as never}
  {components}
  context={{ presentation: loadPresentation(uid) }}
/>
