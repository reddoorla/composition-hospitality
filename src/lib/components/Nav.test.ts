import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Nav from "./Nav.svelte";

// jsdom has no WAAPI (Element.animate), so we report reduced motion: the
// $lib/transitions wrappers then collapse durations to 0 and Svelte skips the
// animation machinery entirely. This is the same path real reduced-motion
// users hit in production.
function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

// jsdom performs no layout — treat connected elements as visible so
// trapFocus's getClientRects() filter keeps them.
beforeEach(() => {
  mockMatchMedia(true);
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (
    this: Element,
  ) {
    return (this.isConnected ? [{}] : []) as unknown as DOMRectList;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const frame = () => new Promise((r) => requestAnimationFrame(r));

// Hash hrefs keep jsdom from attempting (unimplemented) page navigation.
const items = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
];

// A top item with dropdown children (renders as a desktop dropdown / mobile
// accordion).
const itemsWithDropdown = [
  {
    label: "Products",
    href: "",
    children: [
      { label: "Chairs", href: "#chairs" },
      { label: "Tables", href: "#tables" },
    ],
  },
  { label: "About", href: "#about" },
];

describe("Nav — logo-only mode", () => {
  it("renders no menu button without items", () => {
    const { queryByLabelText, getByText } = render(Nav);
    expect(getByText("Logo")).toBeTruthy();
    expect(queryByLabelText("Open menu")).toBeNull();
  });

  it("renders the resolved logo image when given a logo", () => {
    const { getByAltText } = render(Nav, {
      logo: { url: "https://cdn.example/logo.png", maxWidth: "250px" },
    });
    const img = getByAltText("Home") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("https://cdn.example/logo.png");
    expect(img.style.maxWidth).toBe("250px");
  });
});

describe("Nav — mobile menu", () => {
  it("opens the menu and moves focus into it", async () => {
    const { getByLabelText, getByRole } = render(Nav, { items });

    await fireEvent.click(getByLabelText("Open menu"));
    const dialog = getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    await frame();
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("wraps Tab from the last link back to the close button", async () => {
    const { getByLabelText, getByRole } = render(Nav, { items });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const links = Array.from(dialog.querySelectorAll("a"));
    const last = links[links.length - 1];
    last.focus();

    const e = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    last.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("closes on Escape and returns focus to the re-mounted trigger", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      items,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    await fireEvent.keyDown(getByRole("dialog"), { key: "Escape" });
    expect(queryByRole("dialog")).toBeNull();

    // The trigger unmounted while the menu was open; focus lands on the fresh
    // instance one frame after close.
    await frame();
    await frame();
    expect(document.activeElement).toBe(getByLabelText("Open menu"));
  });

  it("closes when a menu link is activated", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      items,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const link = Array.from(getByRole("dialog").querySelectorAll("a"))[0];
    await fireEvent.click(link);

    expect(queryByRole("dialog")).toBeNull();
  });

  it("expands a dropdown as an accordion and reveals its children", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: itemsWithDropdown,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    // Scope to the dialog: the desktop dropdown <ul> also holds these links and
    // jsdom applies no stylesheet, so Tailwind's `hidden`/`lg:flex` doesn't hide
    // it — only the dialog's accordion actually collapses its children.
    const dialog = getByRole("dialog");
    expect(dialog.textContent).not.toContain("Chairs");

    const toggle = Array.from(dialog.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Products"),
    )!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.textContent).toContain("Chairs");
    expect(dialog.textContent).toContain("Tables");
  });
});
