<script lang="ts">
  import { Menu, X, ChevronDown } from "@lucide/svelte";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { fade } from "$lib/transitions";
  import type { NavItem } from "$lib/blux/site-config";

  interface Props {
    /** Nav entries — a leaf is a link; an entry with `children` is a dropdown.
     * Omit for a logo-only bar (the unconverted-starter default). */
    items?: NavItem[];
    /** The site logo (a converted site's resolved logo url); falls back to the
     * "Logo" wordmark. */
    logo?: { url: string; maxWidth?: string };
  }

  let { items = [], logo }: Props = $props();

  let isMenuOpen = $state(false);
  let openButtonEl = $state<HTMLButtonElement>();
  // Which mobile dropdown is expanded (accordion); desktop uses hover/focus CSS.
  let openMobileIndex = $state<number | null>(null);

  const openMenu = () => (isMenuOpen = true);
  const closeMenu = () => {
    isMenuOpen = false;
    openMobileIndex = null;
  };
</script>

<nav
  class="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-background/95 px-8 py-4 backdrop-blur-sm"
>
  <a href="/" class="flex items-center text-lg font-bold">
    {#if logo}
      <img
        src={logo.url}
        alt="Home"
        class="h-8 w-auto"
        style={logo.maxWidth ? `max-width:${logo.maxWidth}` : undefined}
      />
    {:else}
      Logo
    {/if}
  </a>

  {#if items.length > 0}
    <!-- Desktop: inline top items; an item with children reveals its dropdown
         on hover AND focus-within (keyboard-reachable). -->
    <ul class="hidden items-center gap-8 lg:flex">
      {#each items as item (item.label)}
        {#if item.children && item.children.length > 0}
          <li class="group relative">
            <!-- A dropdown toggle (a button, not a dead link) so keyboard users
                 can open it; hover opens it for pointer users. -->
            <button
              type="button"
              class="flex items-center gap-1"
              aria-haspopup="true"
            >
              {item.label}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <ul
              class="invisible absolute top-full left-0 flex min-w-48 flex-col gap-1 bg-background p-2 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              {#each item.children as child (child.href)}
                <li>
                  <a href={child.href} class="block px-3 py-2 hover:opacity-70"
                    >{child.label}</a
                  >
                </li>
              {/each}
            </ul>
          </li>
        {:else}
          <li><a href={item.href}>{item.label}</a></li>
        {/if}
      {/each}
    </ul>

    {#if !isMenuOpen}
      <button
        bind:this={openButtonEl}
        type="button"
        class="flex min-h-11 min-w-11 items-center justify-center lg:hidden"
        onclick={openMenu}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    {/if}
  {/if}
</nav>

{#if isMenuOpen}
  <!-- The open trigger above unmounts while the menu is open, so the element
       trapFocus captured is detached by close time — `restoreFocus` hands it
       the re-mounted trigger instead. -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
    class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-4 overflow-y-auto bg-background py-20 lg:hidden"
    transition:fade
    use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
  >
    <button
      type="button"
      class="absolute top-4 right-8 flex min-h-11 min-w-11 items-center justify-center"
      onclick={closeMenu}
      aria-label="Close menu"
    >
      <X size={24} />
    </button>

    {#each items as item, i (item.label)}
      {#if item.children && item.children.length > 0}
        <!-- Mobile: a dropdown becomes an accordion — tap to expand its links. -->
        <div class="flex flex-col items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1 px-4 py-2"
            aria-expanded={openMobileIndex === i}
            onclick={() => (openMobileIndex = openMobileIndex === i ? null : i)}
          >
            {item.label}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {#if openMobileIndex === i}
            {#each item.children as child (child.href)}
              <a
                href={child.href}
                class="px-4 py-2 opacity-80"
                onclick={closeMenu}>{child.label}</a
              >
            {/each}
          {/if}
        </div>
      {:else}
        <a href={item.href} class="px-4 py-3" onclick={closeMenu}
          >{item.label}</a
        >
      {/if}
    {/each}
  </div>
{/if}
