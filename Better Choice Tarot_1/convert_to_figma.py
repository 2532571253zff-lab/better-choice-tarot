"""
Convert each app page state to Figma layers using @builder.io/html-to-figma.
Then combine into a .figma.json file that can be imported.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figma_frames")
BASE_URL = "http://localhost:4173"
BUNDLE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html-to-figma-browser.js")
VIEWPORT = {"width": 390, "height": 844}


async def get_figma_layers(page, selector="body"):
    """Extract Figma layers from the current page DOM."""
    try:
        # Inject the bundled htmlToFigma library
        with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
            bundle_code = f.read()
        await page.evaluate(bundle_code)

        layers = await page.evaluate(f"""
            () => {{
                const el = document.querySelector("{selector}");
                if (!el) return null;
                const layers = htmlToFigmaLib.htmlToFigma(el, true, false);
                return JSON.parse(JSON.stringify(layers));
            }}
        """)
        return layers
    except Exception as e:
        print(f"  ✗ Error extracting layers: {e}")
        return None


async def get_full_page_layers(page):
    """Get layers for the full visible screen."""
    try:
        with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
            bundle_code = f.read()
        await page.evaluate(bundle_code)

        layers = await page.evaluate("""
            () => {
                const body = document.body;
                // Get the .screen container
                const screen = document.querySelector('.screen');
                const target = screen || body;
                const layers = htmlToFigmaLib.htmlToFigma(target, true, false);
                return JSON.parse(JSON.stringify(layers));
            }
        """)
        return layers
    except Exception as e:
        print(f"  ✗ Error extracting full page: {e}")
        return None


async def click_nav(page, target):
    """Click bottom nav item."""
    try:
        nav_items = page.locator(".nav-item")
        count = await nav_items.count()
        targets = ["home", "reading", "deck", "journal", "profile"]
        if target in targets:
            idx = targets.index(target)
            if idx < count:
                await nav_items.nth(idx).click()
                await page.wait_for_timeout(600)
                print(f"  → {target}")
    except Exception as e:
        print(f"  ✗ nav: {e}")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport=VIEWPORT, device_scale_factor=2)
        page = await context.new_page()

        print("Loading app...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        all_frames = []

        # ── 1. HOME PAGE ──
        print("\n[1] Home Page")
        layers = await get_full_page_layers(page)
        if layers:
            all_frames.append({"name": "Home", "layers": layers})
            with open(os.path.join(OUTPUT_DIR, "01_home.json"), "w", encoding="utf-8") as f:
                json.dump(layers, f, indent=2, ensure_ascii=False)
            print("  ✓ saved")

        # ── 2. BOTTOM SHEET (Mood) ──
        print("\n[2] Bottom Sheet - Mood")
        try:
            await page.locator(".emotion-module").first.click()
            await page.wait_for_timeout(500)
            layers = await get_full_page_layers(page)
            if layers:
                all_frames.append({"name": "Home + Bottom Sheet", "layers": layers})
                with open(os.path.join(OUTPUT_DIR, "02_home_bottom_sheet.json"), "w", encoding="utf-8") as f:
                    json.dump(layers, f, indent=2, ensure_ascii=False)
                print("  ✓ saved")
            await page.locator("#moodOverlay").click(position={"x": 5, "y": 5})
            await page.wait_for_timeout(400)
        except Exception as e:
            print(f"  ✗ {e}")

        # ── 3. READING - Question ──
        print("\n[3] Reading - Question")
        await click_nav(page, "reading")
        layers = await get_full_page_layers(page)
        if layers:
            all_frames.append({"name": "Reading - Question", "layers": layers})
            with open(os.path.join(OUTPUT_DIR, "03_reading_question.json"), "w", encoding="utf-8") as f:
                json.dump(layers, f, indent=2, ensure_ascii=False)
            print("  ✓ saved")

        # ── 4. READING - Spread ──
        print("\n[4] Reading - Spread")
        try:
            await page.locator(".question-block textarea").first.fill(
                "我该继续现在的工作，还是接受新的机会？"
            )
            await page.wait_for_timeout(300)
            await page.locator('[data-action="confirm-question"]').click()
            await page.wait_for_timeout(500)
            layers = await get_full_page_layers(page)
            if layers:
                all_frames.append({"name": "Reading - Spread", "layers": layers})
                with open(os.path.join(OUTPUT_DIR, "04_reading_spread.json"), "w", encoding="utf-8") as f:
                    json.dump(layers, f, indent=2, ensure_ascii=False)
                print("  ✓ saved")
        except Exception as e:
            print(f"  ✗ {e}")

        # ── 5. READING - Deck ──
        print("\n[5] Reading - Deck")
        try:
            await page.locator(".spread-card.selected").first.click()
            await page.wait_for_timeout(500)
            layers = await get_full_page_layers(page)
            if layers:
                all_frames.append({"name": "Reading - Deck", "layers": layers})
                with open(os.path.join(OUTPUT_DIR, "05_reading_deck.json"), "w", encoding="utf-8") as f:
                    json.dump(layers, f, indent=2, ensure_ascii=False)
                print("  ✓ saved")
        except Exception as e:
            print(f"  ✗ {e}")

        # ── 6. READING - Result + Reflection ──
        print("\n[6] Reading - Result")
        try:
            draw_btn = page.locator("#drawButton")
            if await draw_btn.is_visible():
                await draw_btn.click()
                await page.wait_for_timeout(2500)
            layers = await get_full_page_layers(page)
            if layers:
                all_frames.append({"name": "Reading - Result", "layers": layers})
                with open(os.path.join(OUTPUT_DIR, "06_reading_result.json"), "w", encoding="utf-8") as f:
                    json.dump(layers, f, indent=2, ensure_ascii=False)
                print("  ✓ saved")
        except Exception as e:
            print(f"  ✗ {e}")

        # ── 7. DECK LIBRARY ──
        print("\n[7] Deck Library")
        await click_nav(page, "deck")
        layers = await get_full_page_layers(page)
        if layers:
            all_frames.append({"name": "Deck Library", "layers": layers})
            with open(os.path.join(OUTPUT_DIR, "07_deck_library.json"), "w", encoding="utf-8") as f:
                json.dump(layers, f, indent=2, ensure_ascii=False)
            print("  ✓ saved")

        # ── 8. JOURNEY ──
        print("\n[8] Journey")
        await click_nav(page, "journal")
        await page.wait_for_timeout(800)
        layers = await get_full_page_layers(page)
        if layers:
            all_frames.append({"name": "Journey - Calendar", "layers": layers})
            with open(os.path.join(OUTPUT_DIR, "08_journey.json"), "w", encoding="utf-8") as f:
                json.dump(layers, f, indent=2, ensure_ascii=False)
            print("  ✓ saved")

        # ── 9. JOURNEY - Day Detail ──
        print("\n[9] Journey - Day Detail")
        try:
            day_cell = page.locator(".calendar-day[data-has-data]").first
            if await day_cell.is_visible():
                await day_cell.click()
                await page.wait_for_timeout(400)
            layers = await get_full_page_layers(page)
            if layers:
                all_frames.append({"name": "Journey - Day Detail", "layers": layers})
                with open(os.path.join(OUTPUT_DIR, "09_journey_day_detail.json"), "w", encoding="utf-8") as f:
                    json.dump(layers, f, indent=2, ensure_ascii=False)
                print("  ✓ saved")
        except Exception as e:
            print(f"  ✗ {e}")

        # ── 10. PROFILE ──
        print("\n[10] Profile")
        await click_nav(page, "profile")
        layers = await get_full_page_layers(page)
        if layers:
            all_frames.append({"name": "Profile", "layers": layers})
            with open(os.path.join(OUTPUT_DIR, "10_profile.json"), "w", encoding="utf-8") as f:
                json.dump(layers, f, indent=2, ensure_ascii=False)
            print("  ✓ saved")

        await browser.close()

    # ═══════════════════════════════════════
    # Combine all frames into a single .figma.json
    # ═══════════════════════════════════════
    print("\nCombining all frames into BetterChoiceTarot.figma.json ...")

    combined = {
        "name": "Better Choice Tarot",
        "frames": all_frames,
    }

    output_path = os.path.join(OUTPUT_DIR, "BetterChoiceTarot.figma.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done!")
    print(f"   10 page states converted to Figma JSON")
    print(f"   Combined file: {output_path}")
    print(f"   Individual files: {OUTPUT_DIR}/0*.json")


if __name__ == "__main__":
    asyncio.run(main())
