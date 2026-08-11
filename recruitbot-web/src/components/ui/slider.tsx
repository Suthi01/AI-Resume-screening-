"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* Track */}
      <SliderPrimitive.Track className="relative h-[4px] w-full grow rounded-full bg-white/10 overflow-hidden">
        {/* Filled range */}
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>

      {/* Thumb(s) */}
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "relative block h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-white shadow-md",
            "ring-0 ring-primary/40 transition-[box-shadow]",
            "hover:ring-4 focus-visible:ring-4 focus-visible:outline-none",
            "active:scale-110 active:ring-4",
            "disabled:pointer-events-none disabled:opacity-50",
            "after:absolute after:-inset-2 cursor-grab active:cursor-grabbing"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
