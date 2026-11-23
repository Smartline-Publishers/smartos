"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  /** Short explanatory text shown under the control. */
  hint?: string;
}

/**
 * Styled select / listbox.
 *
 * <p>Native `<option>` popups render with the operating system's type scale and
 * highlight, which breaks the mobile layout. This control keeps a real
 * (visually hidden) `<select>` for form libraries and form data, but draws the
 * option list itself: 44px rows, a rounded surface, an explicit selected state
 * and keyboard navigation. The popup anchors to the field and flips above it
 * when there is more room there.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    options,
    error,
    hint,
    id,
    className,
    required,
    disabled,
    value,
    defaultValue,
    onChange,
    name,
    ...rest
  },
  ref,
) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const baseId = id ?? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${reactId}`;
  const labelId = `${baseId}-label`;
  const valueId = `${baseId}-value`;
  const listId = `${baseId}-listbox`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const optionId = useCallback((index: number) => `${baseId}-option-${index}`, [baseId]);

  const selectRef = useRef<HTMLSelectElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [domValue, setDomValue] = useState(() =>
    String(defaultValue ?? options[0]?.value ?? ""),
  );

  const currentValue = value !== undefined ? String(value) : domValue;
  const selectedIndex = options.findIndex((option) => String(option.value) === currentValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const optionSignature = options.map((option) => option.value).join("\u0001");

  const attachRef = useCallback(
    (node: HTMLSelectElement | null) => {
      selectRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLSelectElement | null }).current = node;
    },
    [ref],
  );

  const syncFromDom = useCallback(() => {
    const select = selectRef.current;
    if (select && value === undefined && select.value !== domValue) {
      setDomValue(select.value);
    }
  }, [domValue, value]);

  // Form libraries (and the browser's own default selection) apply values
  // through the hidden native select. Read it back after mount and whenever
  // the option set or value changes so the visible trigger stays in step.
  useEffect(() => {
    syncFromDom();
    const frame = window.requestAnimationFrame(syncFromDom);
    return () => window.cancelAnimationFrame(frame);
  }, [defaultValue, optionSignature, syncFromDom, value]);

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 12;
    const width = Math.min(
      Math.max(rect.width, Math.min(220, viewportWidth - gutter * 2)),
      viewportWidth - gutter * 2,
    );
    const left = Math.min(Math.max(rect.left, gutter), viewportWidth - gutter - width);
    const spaceBelow = viewportHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(320, openAbove ? spaceAbove : spaceBelow));

    setMenuStyle({
      position: "fixed",
      left,
      width,
      maxHeight,
      ...(openAbove
        ? { bottom: viewportHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  const openMenu = useCallback(
    (index: number) => {
      if (disabled || options.length === 0) return;
      syncFromDom();
      setActiveIndex(index >= 0 ? index : 0);
      setOpen(true);
    },
    [disabled, options.length, syncFromDom],
  );

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      const next = String(option.value);
      const select = selectRef.current;
      if (select && select.value !== next) select.value = next;
      setDomValue(next);
      setOpen(false);
      triggerRef.current?.focus();
      if (next === currentValue) return;
      onChange?.({
        target: { value: next, name },
        currentTarget: { value: next, name },
      } as unknown as ChangeEvent<HTMLSelectElement>);
    },
    [currentValue, name, onChange, options],
  );

  // Position while open, and keep the popup attached if the page scrolls or
  // the viewport changes. Pressing Escape closes even if focus is elsewhere.
  useEffect(() => {
    if (!open) return;
    positionMenu();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onScroll = (event: Event) => {
      if (listRef.current?.contains(event.target as Node)) return;
      positionMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open, optionId]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openMenu(selectedIndex);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index < 0 ? 0 : Math.min(options.length - 1, index + 1)));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index < 0 ? 0 : Math.max(0, index - 1)));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        id={labelId}
        htmlFor={baseId}
        className="text-[13px] font-semibold text-ink dark:text-neutral-200"
      >
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>

      {/*
        The real control stays in the DOM so react-hook-form's register/ref,
        defaultValues, resets and form submission keep working. It is hidden
        from assistive tech and the tab order; the button below is the control
        people see and operate.
      */}
      <select
        {...rest}
        ref={attachRef}
        id={`${baseId}-native`}
        name={name}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          setDomValue(event.target.value);
          onChange?.(event);
        }}
        className="sr-only"
      >
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu(selectedIndex);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border bg-white pl-3.5 pr-3 text-left text-base text-ink",
          "shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-[border-color,background-color] duration-150",
          "hover:border-slate-300 dark:hover:border-neutral-600",
          "md:h-10 md:rounded-lg md:pl-[11px] md:text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted disabled:shadow-none dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500",
          error ? "border-[#c2413a]" : "border-[#d8e0ec] dark:border-neutral-700",
          "dark:bg-neutral-900 dark:text-neutral-100",
          className,
        )}
      >
        <span id={valueId} className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? ""}
        </span>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-150 dark:text-neutral-400",
            open && "rotate-180",
          )}
        />
      </button>

      {hint ? (
        <p id={hintId} className="text-xs text-muted dark:text-neutral-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] text-[#c2413a] dark:text-red-400">
          {error}
        </p>
      ) : null}

      {open && menuStyle
        ? createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={labelId}
              style={menuStyle}
              className="z-[80] animate-[fab-in_.14s_ease-out] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-1 shadow-[0_16px_44px_rgb(2_6_23/0.24)] dark:border-neutral-700 dark:bg-neutral-900 md:rounded-xl"
            >
              {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${option.value}-${index}`}
                    id={optionId(index)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[15px] transition-colors",
                      "focus-visible:outline-none md:min-h-9 md:text-sm",
                      isActive
                        ? "bg-slate-100 dark:bg-neutral-800"
                        : "hover:bg-slate-50 dark:hover:bg-neutral-800/70",
                      isSelected
                        ? "font-semibold text-brand-700 dark:text-brand-300"
                        : "text-ink dark:text-neutral-100",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {isSelected ? (
                      <Check
                        size={16}
                        weight="bold"
                        aria-hidden="true"
                        className="shrink-0 text-brand-600 dark:text-brand-400"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
});
