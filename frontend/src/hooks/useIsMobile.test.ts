import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./useIsMobile";

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;
  afterEach(() => {
    // Restore original width after each test
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns true if window.innerWidth is less than breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it("returns false if window.innerWidth is greater than or equal to breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it("updates when window is resized", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 600,
      });
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });

  it("uses default breakpoint if not provided", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 700,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
