<script lang="ts">
  import ProductDetail from "$lib/components/ProductDetail.svelte";

  let { data } = $props();
</script>

<ProductDetail product={data.product} />
