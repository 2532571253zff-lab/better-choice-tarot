"""
Capture each app page/module as a standalone screenshot for Figma import.
Uses Playwright to navigate through all app states.
"""
import asyncio
from playwright.async_api import async_playwright
import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figma_frames")
BASE_URL = "http://localhost:4173"
VIEWPORT = {"width": 390, "height": 844}


async def screenshot(page, name, full_page=False):
    path = os.path.join(OUTPUT_DIR, f"{name}.png")
    await page.screenshot(path=path, full_page=full_page)
    print(f"  ✓ {name}")
    return path


async def element_screenshot(page, selector, name):
    """Screenshot a specific element if visible."""
    try:
        el = page.locator(selector).first
        if await el.is_visible():
            path = os.path.join(OUTPUT_DIR, f"{name}.png")
            await el.screenshot(path=path)
            print(f"  ✓ {name}")
            return path
    except Exception as e:
        print(f"  ✗ {name}: {e}")
    return None


async def click_nav(page, target):
    """Click a bottom nav item by data-target."""
    try:
        nav_items = page.locator(".nav-item")
        count = await nav_items.count()
        targets = ["home", "reading", "deck", "journal", "profile"]
        if target in targets:
            idx = targets.index(target)
            if idx < count:
                await nav_items.nth(idx).click()
                await page.wait_for_timeout(600)
                print(f"  → navigated to {target}")
    except Exception as e:
        print(f"  ✗ nav to {target}: {e}")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
        )
        page = await context.new_page()

        print("Navigating to app...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # ═══════════════════════════════════════
        # HOME PAGE
        # ═══════════════════════════════════════
        print("\n── Home Page ──")
        await screenshot(page, "01_home_full", full_page=True)

        for sel, name in [
            (".cosmic-header", "02_module_cosmic_header"),
            (".daily-tarot-hero", "03_module_daily_tarot"),
            (".action-cards", "04_module_action_cards"),
            (".emotion-module", "05_module_emotion_default"),
            (".growth-trajectory", "06_module_growth_trajectory"),
            (".app-header", "07_module_app_header"),
            (".bottom-nav", "08_module_bottom_nav"),
        ]:
            await element_screenshot(page, sel, name)

        # ═══════════════════════════════════════
        # BOTTOM SHEET (Mood)
        # ═══════════════════════════════════════
        print("\n── Bottom Sheet ──")
        try:
            await page.locator(".emotion-module").first.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "09_bottom_sheet_mood", full_page=False)
            # Close by clicking overlay edge
            await page.locator("#moodOverlay").click(position={"x": 5, "y": 5})
            await page.wait_for_timeout(400)
        except Exception as e:
            print(f"  ✗ bottom sheet: {e}")

        # ═══════════════════════════════════════
        # READING PAGE
        # ═══════════════════════════════════════
        print("\n── Reading Page ──")
        await click_nav(page, "reading")
        await screenshot(page, "10_reading_question", full_page=True)
        await element_screenshot(page, ".reader-panel", "11_module_reader_panel")
        await element_screenshot(page, ".question-block", "12_module_question_block")

        # Fill question → confirm → spread
        try:
            await page.locator(".question-block textarea").first.fill(
                "我该继续现在的工作，还是接受新的机会？"
            )
            await page.wait_for_timeout(300)
            await page.locator('[data-action="confirm-question"]').click()
            await page.wait_for_timeout(500)
            await screenshot(page, "13_reading_spread", full_page=True)
            await element_screenshot(page, ".spread-block", "14_module_spread_block")
        except Exception as e:
            print(f"  ✗ spread: {e}")

        # Select spread → deck stage
        try:
            await page.locator(".spread-card.selected").first.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "15_reading_deck", full_page=True)
            await element_screenshot(page, ".deck-stage", "16_module_deck_stage")
        except Exception as e:
            print(f"  ✗ deck: {e}")

        # Draw → result + reflection
        print("  Drawing cards...")
        try:
            draw_btn = page.locator("#drawButton")
            if await draw_btn.is_visible():
                await draw_btn.click()
                await page.wait_for_timeout(2500)
            await screenshot(page, "17_reading_result", full_page=True)
            await element_screenshot(page, ".result-block", "18_module_result_block")
            await element_screenshot(page, "#reflectionCard", "19_module_reflection_card")
        except Exception as e:
            print(f"  ✗ result: {e}")

        # ═══════════════════════════════════════
        # DECK / LIBRARY PAGE
        # ═══════════════════════════════════════
        print("\n── Deck Library Page ──")
        await click_nav(page, "deck")
        await screenshot(page, "20_deck_library", full_page=True)
        await element_screenshot(page, ".library-hero", "21_module_library_hero")
        await element_screenshot(page, ".card-library", "22_module_card_library")

        # ═══════════════════════════════════════
        # JOURNEY PAGE
        # ═══════════════════════════════════════
        print("\n── Journey Page ──")
        await click_nav(page, "journal")
        await screenshot(page, "23_journey_calendar", full_page=True)
        await element_screenshot(page, ".journey-hero", "24_module_journey_hero")
        await element_screenshot(page, ".star-calendar", "25_module_star_calendar")
        await element_screenshot(page, ".question-history", "26_module_question_history")

        # Day detail
        try:
            await page.locator(".calendar-day[data-has-data]").first.click()
            await page.wait_for_timeout(400)
            await screenshot(page, "27_journey_day_detail", full_page=True)
        except Exception as e:
            print(f"  ✗ day detail: {e}")

        # History detail
        try:
            await page.locator("#questionList .journal-item").first.click()
            await page.wait_for_timeout(400)
            await screenshot(page, "28_journey_history_detail", full_page=True)
        except Exception as e:
            print(f"  ✗ history detail: {e}")

        # ═══════════════════════════════════════
        # PROFILE PAGE
        # ═══════════════════════════════════════
        print("\n── Profile Page ──")
        await click_nav(page, "profile")
        await screenshot(page, "29_profile", full_page=True)
        await element_screenshot(page, ".profile-panel", "30_module_profile_panel")
        await element_screenshot(page, ".stats-grid", "31_module_stats_grid")
        await element_screenshot(page, ".insight-panel", "32_module_insight_panel")

        # Edit mode
        try:
            await page.locator(".edit-profile").click()
            await page.wait_for_timeout(400)
            await screenshot(page, "33_profile_edit", full_page=True)
        except Exception as e:
            print(f"  ✗ profile edit: {e}")

        # Return to home for clean state
        await click_nav(page, "home")

        await browser.close()

    total = len(os.listdir(OUTPUT_DIR))
    print(f"\n{'='*50}")
    print(f"✅ Done! {total} frames saved to:")
    print(f"   {OUTPUT_DIR}")
    print(f"{'='*50}")


if __name__ == "__main__":
    asyncio.run(main())
